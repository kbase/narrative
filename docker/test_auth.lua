local M = {}
local auth_cookie_name = "kbase_session"

local httplib = require("resty.http")
local httpclient = httplib:new()

local token_cache = nil

-- tokens live for up to 5 minutes
local max_token_lifespan = 5 * 60

local nexus_url = 'http://127.0.0.1:65001/users/'

local initialize
local initialized = nil

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

test_auth = function(self)
    ngx.say("testing auth!")
end

M.initialize = initialize
M.test_auth = test_auth

return M