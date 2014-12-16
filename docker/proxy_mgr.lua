--
-- REST based HTTP service that allows you to query/modify the contents of an
-- nginx shared memory DICT object.
--
-- bind this via an access_by_lua_file directive in nginx.conf
-- make sure that there is an nginx variable called uri_base in the current
-- context - it is used in parsing out the URI path
-- Used to implement a dynamic reverse proxy for KBase Narrative project
--
-- The following ngx.shared.DICT need to be declared in the main config, or
-- else use different names and pass them in during initialization:
--
-- session_map
-- proxy_map
-- proxy_mgr
--
-- author: Steve Chan sychan@lbl.gov
--
-- Copyright 2013 The Regents of the University of California,
--                Lawrence Berkeley National Laboratory
--                United States Department of Energy
--               The DOE Systems Biology Knowledgebase (KBase)
-- Made available under the KBase Open Source License
--

--

local M={}

local auth_cookie_name = "kbase_narr_session"
local num_prov_retry = 10

-- regexes for matching/validating keys and values
local key_regex = "[%w_%-%.]+"
local val_regex = "[%w_%-:%.]+"
local json = require('json')
local p = require('pl.pretty')
local notemgr = require('notelauncher')
local locklib = require("resty.lock")
local httplib = require("resty.http")
local httpclient = httplib:new()

-- forward declare the functions in this module
local est_connections
local sweeper
local marker
local check_marker
local check_sweeper
local initialize
local set_proxy
local use_proxy
local new_container
local assign_container
local url_decode
local get_session
local discover

-- this are name/value pairs referencing ngx.shared.DICT objects
-- that we use to track docker containers. The ngx.shared.DICT
-- implementation only supports basic scalar types, so we need a
-- couple of these instead of using a common table object
-- session_map maps a session key (kbase token userid) to a whitespace seperated list of:
--          1. ip/port proxy target (eg. '127.0.0.1:49000')
--          2. docker ID
-- docker_map maps a docker ID to a whitespace seperated list of:
--          1. state of container: 'queued', 'active', 'idle'
--          2. ip/port of container
--          3. session assigned to container (same as in session_map), '*' if none
--          4. time value (os.time) of last activity
--          5. IP that last connected
-- token_cache is cache of validated tokens
local session_map = nil
local docker_map = nil
local token_cache = nil

-- This is a dictionary for storing proxy manager internal state
-- The following names are currently supported
-- 'next_sweep' - this stores the next time() the reap_sweeper is scheduled
--                 to be run. It is cleared when the sweeper runs, and
--                 set when the sweeper is rescheduled. If we notice that
--                 'next_sweep' is either relatively far in the past, or
--                 not set, we generate a warning in the logs and schedule
--                 an semi-immediate asynchronous sweeper run
-- 'next_mark' - this stores the next time() the reap_marker is scheduled
--                 to be run. It is cleared when the marker runs, and
--                 set when the marker is rescheduled. If we notice that
--                 'next_mark' is either relatively far in the past, or
--                 not set, we generate a warning in the logs and schedule
--                 an immediate marker run
local proxy_mgr = nil

-- strangely, init_by_lua seems to run the initialize() method twice,
-- use this flag to avoid reinitializing
local initialized = nil

-- Command to run in order to get netstat info for tcp connections in
-- pure numeric form (no DNS or service name lookups)
local NETSTAT = 'netstat -nt'

-- Base URL for Globus Online Nexus API
-- the non-clocking client library we are using, resty.http, doesn't
-- support https, so we depend on a locally configured Nginx
-- reverse proxy to actually perform the request
nexus_url = 'http://127.0.0.1:65001/users/'

-- name of shared dict for locking library
M.lock_name = "lock_map"

-- How often (in seconds) does the sweeper wake up to delete dead
-- containers?
M.sweep_interval = 300

-- How often (in seconds) does the marker wake up to mark containers
-- for deletion?
M.mark_interval = 60

-- How long (in seconds) since we last saw activity on a container should we wait before
-- shutting it down?
M.timeout = 180

-- Default URL for authentication failure redirect, defaults to nil which means just error
-- out without redirect
M.auth_redirect = "/?redirect=%s"

M.load_redirect = "/loading.html?n=%s"
--
-- Function that runs a netstat and returns a table of foreign IP:PORT
-- combinations and the number of observed ESTABLISHED connetions (at
-- least 1)
--
est_connections = function()
    local connections = {}
    local handle = io.popen( NETSTAT, 'r')
    if handle then
        netstat = handle:read('*a')
        handle:close()
        for conn in string.gmatch(netstat,"[%d%.]+:[%d]+ + ESTABLISHED") do
            ipport = string.match(conn, "[%d%.]+:[%d]+")
            if connections[ipport] then
                connections[ipport] = connections[ipport] + 1
            else
                connections[ipport] = 1
            end
        end
    else
        ngx.log(ngx.ERR, string.format("Error trying to execute %s", NETSTAT))
    end
    return connections
end

--
-- Reaper function that looks in the proxy_state table for instances that need to be
-- removed and removes them
sweeper = function(self)
    ngx.log(ngx.INFO, "sweeper running")
    -- get locker
    local dock_lock = locklib:new(M.lock_name)
    -- loop through ids
    local ids = docker_map:get_keys()
    for num = 1, #ids do
        id = ids[num]
        -- lock docker map before read/write
        elapsed, err = dock_lock:lock(id)
        if elapsed then -- lock worked
            local val = docker_map:get(id) -- make sure its still there
            if val then
                -- info = { state, ip:port, session, last_time, last_ip }
                local info = notemgr:split(val)
                -- this is assigned to be reaped
                if info[1] == "idle" then
                    ngx.log(ngx.INFO, string.format("sweeper removing %s, %s", info[3], id))
                    local ok, err = pcall(notemgr.remove_notebook, id)
                    if ok then
                        docker_map:delete(id)
                        session_map:delete(info[3])
                        ngx.log(ngx.INFO, "notebook removed")
                    elseif string.find(err, "does not exist") then
                        ngx.log(ngx.INFO, "notebook nonexistent - removing references")
                        docker_map:delete(id)
                        session_map:delete(info[3])
                    else
                        ngx.log(ngx.ERROR, string.format("error: %s", err))
                    end
                end
            end
            docker_lock:unlock() -- unlock if it worked
        end
    end
    -- reset sweeper
    proxy_mgr:delete('next_sweep')
    -- enqueue ourself again
    check_sweeper()
end

-- Check for a sweeper in the queue and enqueue if necessary
check_sweeper = function(self)
    local next_run = proxy_mgr:get('next_sweep')
    if next_run == nil then -- no sweeper in the queue, put one into the queue!
        ngx.log(ngx.ERR, string.format("enqueuing sweeper to run in  %d seconds", M.sweep_interval))
        local success, err = ngx.timer.at(M.sweep_interval, sweeper)
        if success then
            proxy_mgr:set('next_sweep', os.time() + M.sweep_interval)
        else
            ngx.log(ngx.ERR, string.format("Error enqueuing sweeper to run in %d seconds: %s", M.sweep_interval, err))
        end
        return false
    end
    return true
end

--
-- Reaper function that examines containers to see if they have been idle for longer than
-- M.timeout and then marks them for cleanup
-- updates those with active connections
--
marker = function(self)
    ngx.log(ngx.INFO, "marker running")
    local now = os.time()
    local timeout = now - M.timeout
    -- get locker
    local dock_lock = locklib:new(M.lock_name)
    -- fetch currently open connections
    local conn = est_connections()
    -- loop through ids
    local ids = docker_map:get_keys()
    for num = 1, #ids do
        id = ids[num]
        -- lock docker map before read/write
        elapsed, err = dock_lock:lock(id)
        if elapsed then -- lock worked
            local val = docker_map:get(id) -- make sure its still there
            if val then
                -- info = { state, ip:port, session, last_time, last_ip }
                local info = notemgr:split(val)
                -- this is assigned to a session
                if info[1] ~= "queued" then
                    -- currently has connection, update
                    if conn[info[2]] then
                        info[4] = now
                        success, err = docker_map:set(id, table.concat(info, " ")
                        if not success then
                            ngx.log(ngx.ERR, string.format("Error setting %s from established connections: %s", name, err))
                        end
                    -- past due, mark for reaping
                    elseif info[4] <= timeout then
                        ngx.log(ngx.INFO, string.format("Marking %s for reaping - last seen %s", info[3], os.date("%c",info[4])))
                        info[1] = "idle"
                        success, err = docker_map:set(id, table.concat(info, " ")
                        if not success then
                            ngx.log(ngx.ERR, string.format("Error setting %s as idle: %s", name, err))
                        end
                    end
                end
            end
            docker_lock:unlock() -- unlock if it worked
        end
    end
    -- reset marker
    proxy_mgr:delete('next_mark')
    -- enqueue sweeper
    check_sweeper()
    -- requeue ourselves
    check_marker()
end

-- This function just checks to make sure there is a sweeper function in the queue
-- returns true if there was one, false otherwise
check_marker = function(self)
    local next_run = proxy_mgr:get('next_mark')
    if next_run == nil then -- no marker in the queue, put one into the queue!
        ngx.log(ngx.ERR, string.format("enqueuing marker to run in %d seconds", M.mark_interval))
        local success, err = ngx.timer.at(M.mark_interval, marker)
        if success then
            proxy_mgr:set('next_mark', os.time() + M.mark_interval)
        else
            ngx.log(ngx.ERR, string.format("Error enqueuing marker to run in %d seconds: %s", M.mark_interval, err))
        end
        return false
    end
    return true
end

--
-- Do some initialization for the proxy manager.
--
initialize = function(self, conf)
    if conf then
        for k,v in pairs(conf) do
            ngx.log(ngx.INFO, string.format("conf(%s) = %s",k,tostring(v)))
        end
    else
        conf = {}
    end
    if not initialized then
        initialized = os.time()
        M.sweep_interval = conf.sweep_interval or M.sweep_interval
        M.mark_interval = conf.mark_interval or M.mark_interval
        M.timeout = conf.idle_timeout or M.timeout
        M.auth_redirect = conf.auth_redirect or M.auth_redirect
        M.lock_name = conf.lock_name or M.lock_name
        session_map = conf.session_map or ngx.shared.session_map
        docker_map = conf.docker_map or ngx.shared.docker_map
        token_cache = conf.token_cache or ngx.shared.token_cache
        proxy_mgr = conf.proxy_mgr or ngx.shared.proxy_mgr
        -- get the reaper functions into the run queue
        check_marker()
        -- temp hack to pre-start containers
        for var=1,5 do
            new_container()
        end
        ngx.log(ngx.INFO, string.format("Initializing proxy manager: sweep_interval %d mark_interval %d idle_timeout %d auth_redirect %s",
                                            M.sweep_interval, M.mark_interval, M.timeout, tostring(M.auth_redirect)))
    else
        ngx.log(ngx.INFO, string.format("Initialized at %d, skipping",initialized))
    end
end

-- This function is used to implement the rest interface
set_proxy = function(self)
    local uri_key_rx = ngx.var.uri_base.."/("..key_regex ..")"
    local uri_value_rx = ngx.var.uri_base.."/"..key_regex .."/".."("..val_regex..")$"
    local method = ngx.req.get_method()
    local new_flag = false
    -- get the reaper functions into the run queue if not already
    check_marker()
    if method == "POST" then
        -- POST method takes either a key and a IP_ADDR:PORT port, or
        -- else an empty string for the IP_ADDR:PORT. If an actual
        -- value is given then setup a route entry for that destination
        -- if an empty value is given then spin up a new instance for the
        -- name given and bind the ip_addr:port to that name
        local response = {}
        local argc = 0
        ngx.req.read_body()
        local args = ngx.req.get_post_args()
        if not args then
            response["msg"] = "failed to get post args: "
            ngx.status = ngx.HTTP_BAD_REQUEST
        else
            for key, val in pairs(args) do
                key2 = string.match( key, "^"..key_regex.."$")
                val2 = string.match( val, "^"..val_regex.."$")
                if key2 ~= key then
                    response["msg"] = "malformed key: " .. key
                    ngx.status = ngx.HTTP_BAD_REQUEST
                elseif proxy_map:get(key) then
                    response["msg"] = "entry already exists: " .. key
                    ngx.status = ngx.HTTP_BAD_REQUEST
                elseif val ~="" and val2 ~= val then
                    response["msg"] = "malformed value : " .. val
                    ngx.status = ngx.HTTP_BAD_REQUEST
                elseif type(val) == "table" then
                    response["msg"] = "bad post argument: " .. key
                    ngx.status = ngx.HTTP_BAD_REQUEST
                    break
                elseif val == "" then
                    -- Spin up a new container if the dest ip:port is empty
                    -- check to see if NGX status reports an error
                    -- (real exception handling should be added here!)
                    ngx.log( ngx.NOTICE, "Inserting: " .. key .. " -> " .. val)
                    val = new_container(key)
                    new_flag = true
                    if ngx.status == ngx.HTTP_INTERNAL_SERVER_ERROR then
                        response["msg"] = val
                        break
                    end
                    argc = argc + 1
                else
                    argc = argc + 1
                    ngx.log( ngx.NOTICE, "Inserting: " .. key .. " -> " .. val)
                    success, err, force = proxy_map:add(key, val)
                    if not success then
                        ngx.status = ngx.HTTP_BAD_REQUEST
                        response["msg"] = "key insertion error " .. key .. " : " ..err
                        ngx.log( ngx.WARN, "Failed insertion: " .. key .. " -> " .. val)
                    end
                    -- add an entry for proxy state
                    success, err, force = proxy_state:add(key, true)
                    success, err, force = proxy_last:set(key,os.time())
                end
            end
            -- make sure we had at least 1 legit entry
            if argc == 0 and response["msg"] == nil then
                response["msg"] = "No legitimate keys found"
            end

            if response["msg"] == nil then
                ngx.status = ngx.HTTP_CREATED
                response["msg"] = "Successfully added "..argc.." keys"
            end
        end
        if (new_flag) then
            local scheme = ngx.var.src_scheme and ngx.var.src_scheme or 'http'
            local returnurl = string.format("%s://%s%s", scheme, ngx.var.host, ngx.var.request_uri)
            return ngx.redirect(string.format(M.load_redirect, ngx.escape_uri(returnurl)))
        end
        ngx.say(json.encode( response ))
    elseif method == "GET" then
        local response = {}

        -- Check URI to see if a specific proxy entry is being asked for
        -- or if we just dump it all out
        local uri_base = ngx.var.uri_base
        local key = string.match(ngx.var.uri,uri_key_rx)
        if key then
            local target = proxy_map:get(key)
            if target == nil then
                ngx.status = ngx.HTTP_NOT_FOUND
            else
                local last = proxy_last:get(key)
                response = {
                    proxy_target = proxy_map:get(key),
                    last_seen = os.date("%c",last),
                    last_ip = proxy_last_ip:get(key),
                    active = tostring(proxy_state:get(key))
                }
            end
        else 
            local keys = proxy_map:get_keys() 
            for key = 1, #keys do
                local last = proxy_last:get(keys[key])
                response[keys[key]] = { 
                    proxy_target = proxy_map:get(keys[key]),
                    last_seen = os.date("%c",last),
                    last_ip = proxy_last_ip:get(keys[key]),
                    active = tostring(proxy_state:get(keys[key]))
                }
            end
        end
        ngx.say(json.encode( response ))
    elseif method == "PUT" then
        local response = {}

        -- Check URI to make sure a specific key is being asked for
        local uri_base = ngx.var.uri_base
        local key = string.match(ngx.var.uri,uri_key_rx)
        if key then
            -- see if we have a uri of the form
            -- $uri_base/{key}/{value}
            val = string.match(ngx.var.uri,uri_value_rx)
            if val == nil then
                val = ngx.req:get_body_data()
                val = string.match( val, val_regex)
            end
            if val then
                local success,err,forcible = proxy_map:set(key,val)
                if not success then
                    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                    response = err
                else
                    response = "updated"
                    success,err,forcible = proxy_state:set(key,true)
                    success,err,forcible = proxy_last:set(key,os.time())
                end
            else
                ngx.status = ngx.HTTP_BAD_REQUEST
                response = "No value provided for key"
            end
        else 
            response = "No key specified"
            ngx.status = ngx.HTTP_NOT_FOUND
        end
        ngx.say(json.encode( response ))
    elseif method == "DELETE" then
        local response = {}

        -- Check URI to make sure a specific key is being asked for
        local uri_base = ngx.var.uri_base
        local key = string.match(ngx.var.uri,uri_key_rx)
        if key then
            local target = proxy_map:get(key)
            if target == nil then
                ngx.status = ngx.HTTP_NOT_FOUND
            else
                response = "Marked for reaping"
                -- mark the proxy instance for deletion
                proxy_state:set(key,false)
                ngx.log( ngx.NOTICE, "Makred for reaping: " .. key )
            end
        else 
            response = "No key specified"
            ngx.status = ngx.HTTP_NOT_FOUND
        end
        ngx.say(json.encode( response ))
    else
        ngx.exit(ngx.HTTP_METHOD_NOT_IMPLEMENTED )
    end
end


--
-- simple URL decode function
url_decode = function(str)
    str = string.gsub (str, "+", " ")
    str = string.gsub (str, "%%(%x%x)", function(h) return string.char(tonumber(h,16)) end)
    str = string.gsub (str, "\r\n", "\n")
    return str
end

--
-- Examines the current request to validate it and return a
-- session identifier. You can perform authentication here
-- and only return a session id if the authentication is legit
-- returns nil, err if a session cannot be found/created
--
-- In the current implementation we take the token (if given) and
-- try to query Globus Online for the user profile, if it comes back
-- then the token is good and we put an entry in the token_cache
-- table for it
--
-- session identifier is parsed out of token from user name (un=) value
get_session = function()
    local hdrs = ngx.req.get_headers()
    local cheader = hdrs['Cookie']
    local token = {}
    local session_id = nil; -- nil return value by default
    if cheader then
        -- ngx.log( ngx.INFO, string.format("cookie = %s",cheader))
        local session = string.match(cheader, auth_cookie_name.."=([%S]+);?")
        if session then
            -- ngx.log( ngx.INFO, string.format("kbase_session = %s",session))
            session = string.gsub(session, ";$", "")
            session = url_decode(session)
            for k, v in string.gmatch(session, "([%w_]+)=([^|]+);?") do
                token[k] = v
            end
            if token['token'] then
                token['token'] = string.gsub(token['token'], "PIPESIGN", "|")
                token['token'] = string.gsub(token['token'], "EQUALSSIGN", "=")
                --ngx.log( ngx.INFO, string.format("token[token] = %s",token['token']))
            end
        end
    end
    if token['un'] then
        local cached = token_cache:get(token['kbase_sessionid'])
        -- we have to cache either the token itself, or a hash of the token
        -- because this method gets called for every GET for something as
        -- trivial as a .png or .css file, calculating and comparing an MD5
        -- hash of the token would start to be costly given how many GETs
        -- there are on a given page load.
        -- So we cache the token itself. This is a security vulnerability,
        -- however the exposure would require a hacker of fairly high end
        -- skills (or someone who has read the source code...)
        if cached and cached == token['token'] then
            return token['un']
        end
        -- lock and try again
        local token_lock = locklib:new(M.lock_name)
        elapsed, err = token_lock:lock(token['kbase_sessionid'])
        if elapsed == nil then
            ngx.log(ngx.ERR, "Error: failed to update token cache: "..err)
            return nil
        end
        cached = token_cache:get(token['kbase_sessionid'])
        if cached and cached == token['token'] then
            token_lock:unlock()
            return token['un']
        -- still missing, now get from globus
        else
            ngx.log(ngx.ERR, "Token cache miss : ", token['kbase_sessionid'])
            local req = {
                url = nexus_url .. token['un'],
                method = "GET",
                headers = { Authorization = "Globus-Goauthtoken "..token['token'] }
            }
            --ngx.log( ngx.DEBUG, "request.url = " .. req.url)
            local ok,code,headers,status,body = httpclient:request(req)
            --ngx.log( ngx.DEBUG, "Response - code: ", code)
            if code >= 200 and code < 300 then
                local profile = json.decode(body)
                ngx.log(ngx.INFO, "Token validated for "..profile.fullname.." ("..profile.username..")")
                if profile.username == token.un then
                    ngx.log(ngx.INFO, "Token username matches cookie identity, inserting session_id into token cache: "..token['kbase_sessionid'])
                    token_cache:set(token['kbase_sessionid'], token['token'])
                    session_id = profile.username
                    token_lock:unlock()
                else
                    ngx.log(ngx.ERR, "Error: token username DOES NOT match cookie identity: "..profile.username)
                end
            else
                ngx.log(ngx.ERR, "Error during token validation: "..status.." "..body)
            end
        end
        token_lock:unlock() -- make sure its unlcoked
    end
    return session_id
end

--
-- Check docker_map and update session_map if missing
-- info = { state, ip:port, session, last_time, last_ip }
-- this for-loop makes me wish lua had a continue statement
-- currently not using this function
--
discover = function()
    -- add any assigned notebooks we don't know about
    local ids = docker_map:get_keys()
    local docker_lock = locklib:new(M.lock_name)
    local session_lock = locklib:new(M.lock_name)
    for num = 1, #ids do
        id = ids[num]
        -- lock memory map before access
        elapsed, err = docker_lock:lock(id)
        if elapsed then -- lock worked
            local val = docker_map:get(id) -- make sure its still there
            if val then
                local info = notemgr:split(val)
                -- this is assigned to a session
                if info[1] ~= "queued" then
                    local target = session_map:get(info[3])
                    if target == nil then -- not in session_map
                        -- lock session_map before update
                        elapsed, err = session_lock:lock(info[3])
                        if elapsed then -- lock worked
                            target = session_map:get(info[3])
                            if target == nil then -- its still missing after lock
                                ngx.log(ngx.INFO, "session_map is stale, missing "..info[3]..", "..id)
                                local success,err,forcible = session_map:set(info[3], table.concat({info[2], id}, " "))
                                if not success then
                                    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                                    ngx.log(ngx.ERR, "Error setting session_map: "..err)
                                end
                            end
                            session_lock:unlock() -- unlock if it worked
                        end
                    end
                end
            end
            docker_lock:unlock() -- unlock if it worked
        end
    end
end

--
-- Spin up a new container, add to docker_map
-- id = container uuid
-- info = { state, ip:port, session, last_time, last_ip }
-- true if success, fasle if failed
--
new_container = function()
    ngx.log(ngx.INFO, "Creating container for queue")
    local id, info = notemgr:launch_notebook()
    if id == nil then
        ngx.log(ngx.ERR, "Failed to launch new instance : ".. p.write(info))
        return false
    else
        -- lock key before writing it
        local dock_lock = locklib:new(M.lock_name)
        elapsed, err = dock_lock:lock(id)
        if elapsed == nil then
            ngx.log(ngx.ERR, "Error: failed to update docker cache: "..err)
            return false
        end
        docker_map:set(id, table.concat(info, " "))
        dock_lock:unlock()
        return true
    end
end

--
-- Assign session to running container
-- edits docker_map and session_map
-- session_id is already locked when this function called
-- returns IP:port of session, nil if error
--
assign_container = function(session_id, client_ip)
    -- sync map with state
    notemgr:sync_notebooks(M.lock_name)
    local dock_lock = locklib:new(M.lock_name)
    local ids = docker_map:get_keys()
    for num = 1, #ids do
        id = ids[num]
        -- lock docker map before read/write
        elapsed, err = dock_lock:lock(id)
        if elapsed then -- lock worked
            local val = docker_map:get(id) -- make sure its still there
            if val then
                -- info = { state, ip:port, session, last_time, last_ip }
                local info = notemgr:split(val)
                -- this is not assigned to a session
                if info[1] == "queued" then
                    if info[3] == "*" then
                        session_val = table.concat({info[2], id}, " ")
                        session_map:set(session_id, session_val)
                        docker_map:set(id, table.concat({"active", info[2], session_id, os.time(), client_ip}, " ")
                        dock_lock:unlock()
                        return session_val
                    else -- bad state, session with queued
                        info[1] = "idle"
                        docker_map:set(id, table.concat(info, " "))
                    end
                end
            dock_lock:unlock() -- unlock if it worked
        end
    end
    -- no available docker container - launch new
    res = new_container()
    -- new container created, try and re-assign
    -- i hope this recusion works
    if res:
        return assign_container(session_id, client_ip)
    else:
        return nil
end

--
-- Route to the appropriate proxy
--
use_proxy = function(self)
    local target = nil
    local new_flag = false
    -- ngx.log( ngx.INFO, "In /narrative/ handler")
    local client_ip = ngx.var.remote_addr
    -- get session
    -- unauthorized if no session
    local session_key = get_session()
    if not session_key then
        ngx.log(ngx.WARN,"No session_key found, bad auth!")
        return(ngx.exit(ngx.HTTP_UNAUTHORIZED))
    end
    -- get proxy target
    target = session_map:get(session_key)
    -- didn't find in session_map, lock and try again
    if target == nil then
        session_lock = locklib:new(M.lock_name)
        elapsed, err = session_lock:lock(session_key)
        if elasped then
            target = session_map:get(session_key)
        end
        -- still missing, assign comtainer to session
        if target == nil then
            -- session_key still locked in called function
            -- this updates docker_map with session info
            target = assign_container(session_key, client_ip)
            session_lock.unlock()
            -- can not assign a new one / bad state
            if target == nil then
                ngx.log(ngx.WARN,"No available docker containers!")
                return(ngx.exit(ngx.HTTP_SERVICE_UNAVAILABLE))
            end
            -- assign comtainer to session
            local scheme = ngx.var.src_scheme and ngx.var.src_scheme or 'http'
            local returnurl = string.format("%s://%s%s", scheme, ngx.var.host, ngx.var.request_uri)
            return ngx.redirect(string.format(M.load_redirect, ngx.escape_uri(returnurl)))
        end
    end
    -- proxy target already in session
    if target ~= nil then
        -- session = { IP:port, docker_id }
        local session = notemgr:split(target)
        ngx.var.target = session[1]
        -- update docker_map session info, lock first
        local dock_lock = locklib:new(M.lock_name)
        elapsed, err = dock_lock:lock(session[2])
        if elapsed == nil then
            ngx.log(ngx.ERR, "Error: failed to lock docker cache: "..err)
        end
        success,err,forcible = docker_map:set(session[2], table.concat({"active", session[1], session_key, os.time(), client_ip}, " ")
        if not success then
            ngx.log(ngx.WARN, "Error: failed to update docker cache: "..err)
        end
        dock_lock:unlock()
    elseif M.auth_redirect then
        local scheme = ngx.var.src_scheme and ngx.var.src_scheme or 'http'
        local returnurl = string.format("%s://%s/%s", scheme,ngx.var.host,ngx.var.request_uri)
        return ngx.redirect( string.format(M.auth_redirect, ngx.escape_uri(returnurl)))
    else
        return(ngx.exit(ngx.HTTP_NOT_FOUND))
    end
end

M.set_proxy = set_proxy
M.use_proxy = use_proxy
M.initialize = initialize
M.est_connections = est_connections

return M