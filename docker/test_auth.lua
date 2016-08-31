local M = {}
local auth_cookie_name = "kbase_session"

local json = require("json")
local locklib = require("resty.lock")
local httplib = require("resty.http")
local httpclient = httplib:new()

local token_cache = nil

-- tokens live for up to 5 minutes
local max_token_lifespan = 5 * 60

-- local auth_url = 'http://127.0.0.1:65001/users/'
local auth_url = 'https://kbase.us/services/authorization/Sessions/Login'

local initialize
local get_user_from_cache
local validate_and_cache_token
local get_user
local parse_cookie
local url_decode
local test_auth

local initialized = nil

M.lock_name = "token_lock"

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
get_user_from_cache = function(self, token)
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
validate_and_cache_token = function(self, token)
    local token_lock = locklib:new(M.lock_name)
    elapsed, err = token_lock:lock(token)

    local user_id = nil
    d = {token=token, fields='user_id'}
    local user_request = {
        url = auth_url,
        method = "POST",
        body = d
    }
    local ok, code, headers, status, body = httpclient:request(user_request)
    if code >= 200 and code < 300 then
        local profile = json.decode(body)
        if profile.user_id then
            user_id = profile.user_id
            token_cache:set(token_cache, token, user_id, M.max_token_lifespan)
        else
            --error - missing user id from token lookup
            ngx.log(ngx.ERR, "Error: auth token lookup doesn't return a user id")
        end
    else
        ngx.log(ngx.ERR, "Error during token validation: "..status.." "..body)
    end
    token_lock:unlock()
    return user_id
end

get_user = function(self, token)
    if token then
        user = get_user_from_cache(token)
        if user then
            return user
        else
            user = validate_and_cache_token(token)
            return user
        end
    end
end

parse_cookie = function(cookie)
    local token_dict = nill
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

--
-- simple URL decode function
url_decode = function(str)
    str = string.gsub (str, "+", " ")
    str = string.gsub (str, "%%(%x%x)", function(h) return string.char(tonumber(h,16)) end)
    str = string.gsub (str, "\r\n", "\n")
    return str
end

test_auth = function(self)
    local headers = ngx.req.get_headers()
    local cheader = ngx.unescape_uri(headers['Cookie'])
    local token_dict = {}
    local token = nil
    if cheader then
        local session = string.match(cheader, auth_cookie_name.."=([%S]+);?")
        if session then
            token = parse_cookie(session)
        end
    end

    local table = {
        "hello, ",
        {"world: ", true, " or ", false,
            {": ", nil}},
        {"token: ", token}
    }
    ngx.say(table)
end


M.initialize = initialize
M.get_user = get_user
M.test_auth = test_auth

return M