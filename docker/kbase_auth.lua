-- This module
local M = {}
-- The auth token cookie name.
local auth_cookie_name = "kbase_session"

local json = require("json")
local locklib = require("resty.lock")
local httplib = require("resty.http")
local httpclient = httplib:new()

-- Gets populated by Nginx - is a ngx.shared.dict
local token_cache = nil

-- tokens live for up to 5 minutes, then the shared dict kills them
local max_token_lifespan = 5 * 60

-- Non-blocking resty http requests can't deal with https.
-- This routes through a proxy to KBase auth.
-- Note that a server stanza must be set up to proxy this.
local auth_url = 'http://127.0.0.1:65001'

-- Variable prototypes
local initialize
local get_user_from_cache
local validate_and_cache_token
local get_user
local parse_cookie
local url_decode
local test_auth

-- Nginx likes to run :initialize twice. Set this flag
-- to something truthy and prevent the second one.
local initialized = nil

-- name of ngx lock dict needed for locking token cache keys
-- while editing them.
M.lock_name = "lock_map"

-- Initializes the module.
-- Given a conf dict, this initializes the main variables.
-- Mainly, this inits the token cache.
initialize = function(self, conf)
    if conf then
        for k, v in pairs(conf) do
            ngx.log(ngx.INFO, string.format("Auth.init conf(%s) = %s", k, tostring(v)))
        end
    else
        conf = {}
    end
    if not initialized then
        initialized = os.time()
        M.max_token_lifespan = conf.max_token_lifespan or max_token_lifespan
        token_cache = conf.token_cache or ngx.shared.token_cache
        ngx.log(ngx.INFO, string.format("Initializing Auth module: token lifespan = %d seconds", M.max_token_lifespan))
    else
        ngx.log(ngx.INFO, string.format("Auth module already initialized at %d, skipping", initialized))
    end
end

-- If the given token is stored in the cache, and hasn't expired, this
-- returns that user id.
-- If it has expired, or the token doesn't exist, returns nil
get_user_from_cache = function(token)
    if token then
        -- TODO: hash that token
        return token_cache:get(token)
    else
        return nil
    end
end

-- Validates the token by looking it up in the Auth service.
-- If valid, adds it to the token cache and returns the user id.
-- If not, returns nil
-- This uses the resty.lock to lock up that particular key while
-- trying to validate.
validate_and_cache_token = function(token)
    if not token then
        return nil
    end

    local token_lock = locklib:new(M.lock_name)
    elapsed, err = token_lock:lock(token)

    local profile = fetch_token_info(token)
    --
    -- local user_id = nil
    -- d = {token=token, fields='user_id'}
    -- local user_request = {
    --     url = auth_url,
    --     method = "POST",
    --     body = "token="..token.."&fields=user_id"
    -- }
    --
    -- ngx.log(ngx.ERR, "Sending validation request: "..json.encode(user_request))
    --
    -- local ok,code,headers,status,body = httpclient:request(user_request)
    -- if code >= 200 and code < 300 then
    --     local profile = json.decode(body)
    --     ngx.log(ngx.ERR, "Something? "..body)
    --     if profile.user_id then
    --         user_id = profile.user_id
    --         token_cache:set(token, user_id, M.max_token_lifespan)
    --     else
    --         --error - missing user id from token lookup
    --         ngx.log(ngx.ERR, "Error: auth token lookup doesn't return a user id")
    --     end
    -- else


    if profile is not nil then
        ngx.log(ngx.ERR, "Got token info "..json.encode(profile))
        if profile.user then
            user_id = profile.user
            token_cache:set(token, user_id, profile.cachefor)
        else
            ngx.log(ngx.ERR, "Error: auth token lookup didn't return a user id!")
        end
    else
        ngx.log(ngx.ERR, "Error during token validation: "..status.." "..body)
    end
    token_lock:unlock()
    return user_id
end

-- From a user's auth token (generally passed in via cookie
-- or AUTHORIZATION header), this validates it, gets the user id,
-- and caches the token.
-- If the token is invalid, return nil.
get_user = function(self, token)
    if token then
        ngx.log(ngx.ERR, "Looking up a token")
        user = get_user_from_cache(token)
        if user then
            ngx.log(ngx.ERR, "Found user! "..user)
            return user
        else
            ngx.log(ngx.ERR, "Didn't find user, validating token...")
            user = validate_and_cache_token(token)
            return user
        end
    end
end

-- TEMPORARY - rewrite when we change the token structure.
-- This parses the expected cookie string and extracts the
-- token out of it.
parse_cookie = function(cookie)
    local token_dict = {}
    local cookie = string.gsub(cookie, ";$", "")
    cookie = url_decode(cookie)
    for k, v in string.gmatch(cookie, "([%w_]+)=([^|]+);?") do
        token_dict[k] = v
    end
    if token_dict['token'] then
        token_dict['token'] = string.gsub(token_dict['token'], "PIPESIGN", "|")
        token_dict['token'] = string.gsub(token_dict['token'], "EQUALSSIGN", "=")
        -- ngx.log( ngx.DEBUG, string.format("token[token] = %s",token['token']))
        return token_dict['token']
    end
    return nil
end

interpret_cookie = function(cookie)
    local token = url_decode(cookie)
    token_info = fetch_token_info(token)
end

fetch_token_info = function(token)
    ok, code, headers, status, body = auth_server_request("/api/V2/token", "GET", token)
    if ok then
        return json.decode(body)
    else
        ngx.log(ngx.ERR, "Failed to fetch token information"..status.." "..body)
        return nil
end

auth_server_request = function(operation, method, token)
    local request = {
        url = auth_url,
        method = method,
        headers = { "Authorization": token }
    }

    ngx.log(ngx.ERR, "Sending validation request: "..json.encode(request))

    local ok,code,headers,status,body = httpclient:request(request)
    return [ok, code, headers, status, body]
end

--
-- simple URL decode function
url_decode = function(str)
    str = string.gsub (str, "+", " ")
    str = string.gsub (str, "%%(%x%x)", function(h) return string.char(tonumber(h,16)) end)
    str = string.gsub (str, "\r\n", "\n")
    return str
end

-- A simple auth tester for the general workflow.
-- Scrapes the cookie, parses the token out of it,
-- validates it, caches it, and returns the user id.
test_auth = function(self)
    local headers = ngx.req.get_headers()
    local cheader = ngx.unescape_uri(headers['Cookie'])
    local token_dict = {}
    local token = nil
    if cheader then
        token = session
        -- local session = string.match(cheader, auth_cookie_name.."=([%S]+);?")
        -- if session then
        --     token = parse_cookie(session)
        -- end
    end

    user = get_user(self, token)

    local table = {
        {"token: ", token},
        {"user_id: ", user}
    }
    ngx.say(table)
end

-- Temporary test function that scrapes the token cache and dumps
-- it to ngx.say. Hides the token, because that's what you do.
dump_cache = function(self)
    response = {}
    keys = token_cache:get_keys()
    for num = 1, #keys do
        local key = keys[num]
        local user_id = token_cache:get(key)
        table.insert(response, {
            user_id = user_id,
            token = "Token Number "..num
        })
    end
    ngx.say(json.encode(response))
end


M.initialize = initialize
M.get_user = get_user
M.test_auth = test_auth
M.dump_cache = dump_cache

return M
