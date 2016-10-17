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
-- docker_map
-- token_cache
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

local M = {}

local auth_cookie_name = "kbase_session"
local lock_opts = {
    exptime = 5,
    timeout = 5
}

-- regexes for matching/validating keys and ids
local key_regex = "[%w_%-%.]+"
local id_regex = "%x+"

-- packages to load
local json = require('json')
local p = require('pl.pretty')
local notemgr = require('notelauncher')
local locklib = require("resty.lock")
local httplib = require("resty.http")
local httpclient = httplib:new()

-- forward declare the functions in this module
local est_connections
local sweeper
local check_sweeper
local marker
local check_marker
local provisioner
local check_provisioner
local initialize
local narrative_shutdown
local set_proxy
local check_proxy
local url_decode
local get_session
local sync_sessions
local sync_containers
local new_container
local assign_container
local use_proxy

-- this are name/value pairs referencing ngx.shared.DICT objects
-- that we use to track docker containers. The ngx.shared.DICT
-- implementation only supports basic scalar types, so we need a
-- couple of these instead of using a common table object
-- session_map maps a session key (kbase token userid) to a whitespace separated list of:
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
-- 'next_sweep' - this stores the next time() the sweeper is scheduled
--                 to be run. It is cleared when the sweeper runs, and
--                 set when the sweeper is rescheduled. If we notice that
--                 'next_sweep' is either relatively far in the past, or
--                 not set, we generate a warning in the logs and schedule
--                 an semi-immediate asynchronous sweeper run
-- 'next_mark' - this stores the next time() the marker is scheduled
--                 to be run. It is cleared when the marker runs, and
--                 set when the marker is rescheduled. If we notice that
--                 'next_mark' is either relatively far in the past, or
--                 not set, we generate a warning in the logs and schedule
--                 an immediate marker run
-- 'next_provision' - this stores the next time() the provisioner is scheduled
--                 to be run. It is cleared when the provisioner runs, and
--                 set when the provisioner is rescheduled. If we notice that
--                 'next_provision' is either relatively far in the past, or
--                 not set, we generate a warning in the logs and schedule
--                 an immediate provisioner run
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

-- How often (in seconds) does the sweeper wake up to delete dead containers
M.sweep_interval = 600

-- How often (in seconds) does the marker wake up to mark containers for deletion
M.mark_interval = 120

-- How long (in seconds) since last activity on a container should we wait before shutting it down
M.timeout = 300

-- How often (in seconds) does the provisioner wake up to provision new containers
M.provision_interval = 30

-- How many provisioned (un-assigned) containers should we have on stand-by
M.provision_count = 20
-- The max number of docker containers to have running, including provisioned
M.container_max = 5000

-- Image to use for notebooks
M.image = "kbase/narrative:latest"

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
-- Reaper function that looks in the docker_map for instances that need to be
-- removed and removes them
sweeper = function()
    ngx.log(ngx.INFO, "sweeper running")
    -- get locker
    local dock_lock = locklib:new(M.lock_name, lock_opts)
    -- loop through ids
    local ids = docker_map:get_keys()
    for num = 1, #ids do
        id = ids[num]
        -- lock docker map before read/write
        elapsed, err = dock_lock:lock(id)
        if elapsed then -- lock worked
            local val = docker_map:get(id) -- make sure its still there
            if val then
                ngx.log(ngx.DEBUG, "ID "..id..": "..val)
                -- info = { state, ip:port, session, last_time, last_ip }
                local info = notemgr:split(val)
                -- this is assigned to be reaped
                if info[1] == "idle" then
                    ngx.log(ngx.INFO, "Sweeper removing "..info[3]..", "..id)
                    local ok, err = pcall(notemgr.remove_notebook, id)
                    if ok then
                        docker_map:delete(id)
                        session_map:delete(info[3])
                        ngx.log(ngx.INFO, "Notebook "..id.." removed")
                    elseif string.find(err, "does not exist") then
                        docker_map:delete(id)
                        session_map:delete(info[3])
                        ngx.log(ngx.WARN, "Notebook "..id.." nonexistent - removing references")
                    else
                        ngx.log(ngx.ERR, "Error: "..err)
                    end
                end
            end
            dock_lock:unlock() -- unlock if it worked
        end
    end
    -- reset sweeper
    proxy_mgr:delete('next_sweep')
    -- enqueue ourself again
    check_sweeper()
end

-- This function just checks to make sure there is a sweeper function in the queue
-- returns true if there was one, false otherwise
check_sweeper = function(self)
    local sweep_lock = locklib:new(M.lock_name, lock_opts)
    local next_run = proxy_mgr:get('next_sweep')
    if next_run == nil then -- no sweeper in the queue, put one into the queue!
        -- lock it
        elapsed, err = sweep_lock:lock('next_sweep')
        if elapsed == nil then
            ngx.log(ngx.ERR, "Error acquiring sweeper lock: "..err)
            return false
        end
        -- retry get, if still nil then reset
        next_run = proxy_mgr:get('next_sweep')
        if next_run == nil then
            ngx.log(ngx.INFO, "Enqueuing sweeper to run in "..M.sweep_interval.." seconds")
            local success, err = ngx.timer.at(M.sweep_interval, sweeper)
            if success then
                proxy_mgr:set('next_sweep', os.time() + M.sweep_interval)
            else
                ngx.log(ngx.ERR, "Error enqueuing sweeper to run in "..M.sweep_interval.." seconds: "..err)
            end
            sweep_lock:unlock()
            return false
        end
        sweep_lock:unlock()
        return true
    end
    return true
end

--
-- Reaper function that examines containers to see if they have been idle for longer than
-- M.timeout and then marks them for cleanup
-- updates those with active connections
--
marker = function()
    ngx.log(ngx.INFO, "marker running")
    local now = os.time()
    local timeout = now - M.timeout
    -- get locker
    local dock_lock = locklib:new(M.lock_name, lock_opts)
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
                        success, err = docker_map:set(id, table.concat(info, " "))
                        if not success then
                            ngx.log(ngx.ERR, "Error setting "..info[3].." from established connections: "..err)
                        end
                    -- past due, mark for reaping
                    elseif tonumber(info[4]) <= timeout then
                        ngx.log(ngx.INFO, "Marking "..info[3].." for reaping - last seen "..os.date("%c", tonumber(info[4])))
                        info[1] = "idle"
                        success, err = docker_map:set(id, table.concat(info, " "))
                        if not success then
                            ngx.log(ngx.ERR, "Error setting "..info[3].." as idle: "..err)
                        end
                    end
                end
            end
            dock_lock:unlock() -- unlock if it worked
        end
    end
    -- reset marker
    proxy_mgr:delete('next_mark')
    -- enqueue sweeper
    check_sweeper()
    -- requeue ourselves
    check_marker()
end

-- This function just checks to make sure there is a marker function in the queue
-- returns true if there was one, false otherwise
check_marker = function(self)
    local mark_lock = locklib:new(M.lock_name, lock_opts)
    local next_run = proxy_mgr:get('next_mark')
    if next_run == nil then -- no marker in the queue, put one into the queue!
        -- lock it
        elapsed, err = mark_lock:lock('next_mark')
        if elapsed == nil then
            ngx.log(ngx.ERR, "Error acquiring marker lock: "..err)
            return false
        end
        -- retry get, if still nil then reset
        next_run = proxy_mgr:get('next_mark')
        if next_run == nil then
            ngx.log(ngx.INFO, "Enqueuing marker to run in "..M.mark_interval.." seconds")
            local success, err = ngx.timer.at(M.mark_interval, marker)
            if success then
                proxy_mgr:set('next_mark', os.time() + M.mark_interval)
            else
                ngx.log(ngx.ERR, "Error enqueuing marker to run in "..M.mark_interval.." seconds: "..err)
            end
            mark_lock:unlock()
            return false
        end
        mark_lock:unlock()
        return true
    end
    return true
end

--
-- Provisoning function that looks in the docker_map to identify how many provisioned
-- containers there are, if less than provion_count, spawns more
-- do not provision containers that would cause total to be > than container_max
provisioner = function()
    ngx.log(ngx.INFO, "provisioner running")
    -- sync maps with existing containers
    sync_containers()
    local queued = 0
    local total = 0
    -- get locker
    local dock_lock = locklib:new(M.lock_name, lock_opts)
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
                total = total + 1
                local info = notemgr:split(val)
                if info[1] == "queued" then
                    queued = queued + 1
                end
            end
            dock_lock:unlock() -- unlock if it worked
        end
    end
    if queued < M.provision_count then
        local to_spawn = M.provision_count - queued
        if (to_spawn + total) > M.container_max then
            to_spawn = M.container_max - total
        end
        if to_spawn > 0 then
            ngx.log(ngx.INFO, "Provisioner spawning "..to_spawn.." containers")
            for i = 1, to_spawn do
                new_container()
            end
        else
            ngx.log(ngx.WARN, "Unable to provision containers, currently running "..total.." for max of "..M.container_max)
        end
    end
    -- reset provisioner
    proxy_mgr:delete('next_provision')
    -- enqueue self
    check_provisioner()
end

-- This function just checks to make sure there is a provisioner function in the queue
-- returns true if there was one, false otherwise
check_provisioner = function(self, now)
    local interval = M.provision_interval
    if now then
        interval = now
    end
    local prov_lock = locklib:new(M.lock_name, lock_opts)
    local next_run = proxy_mgr:get('next_provision')
    if next_run == nil then -- no provisioner in the queue, put one into the queue!
        -- lock it
        elapsed, err = prov_lock:lock('next_provision')
        if elapsed == nil then
            ngx.log(ngx.ERR, "Error acquiring provisioner lock: "..err)
            return false
        end
        -- retry get, if still nil then reset
        next_run = proxy_mgr:get('next_provision')
        if next_run == nil then
            ngx.log(ngx.INFO, "Enqueuing provisioner to run in "..interval.." seconds")
            local success, err = ngx.timer.at(interval, provisioner)
            if success then
                proxy_mgr:set('next_provision', os.time() + interval)
            else
                ngx.log(ngx.ERR, "Error enqueuing provisioner to run in "..interval.." seconds: "..err)
            end
            prov_lock:unlock()
            return false
        end
        prov_lock:unlock()
        return true
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
        M.provision_interval = conf.provision_interval or M.provision_interval
        M.timeout = conf.idle_timeout or M.timeout
        M.provision_count = conf.provision_count or M.provision_count
        M.container_max = conf.container_max or M.container_max
        M.lock_name = conf.lock_name or M.lock_name
        M.image = conf.image or M.image
        session_map = conf.session_map or ngx.shared.session_map
        docker_map = conf.docker_map or ngx.shared.docker_map
        token_cache = conf.token_cache or ngx.shared.token_cache
        proxy_mgr = conf.proxy_mgr or ngx.shared.proxy_mgr
        ngx.log(ngx.INFO, string.format("Initializing proxy manager: sweep_interval %d mark_interval %d idle_timeout %d ",
                                            M.sweep_interval, M.mark_interval, M.timeout))
        ngx.log(ngx.INFO, string.format("Image %s",M.image))
    else
        ngx.log(ngx.INFO, string.format("Initialized at %d, skipping", initialized))
    end
end

-- This function will shut down a running Narrative Docker container immediately
-- Once that's done, the user's token is removed from the cache.
-- The intent is that this is a fast, specific reaping process, accessible from outside.
-- It's set up as a REST call, but a valid user token is required, and that token must come
-- from the user who's instance it's trying to shut down.
-- Only the GET and DELETE methods are implemented. GET returns some info, and DELETE 
-- will shutdown the container under 2 conditions:
-- 1. A valid KBase auth token is given in the cookie given by auth_cookie_name
-- 2. The user specified by that cookie is shutting down their own Narrative instance
narrative_shutdown = function(self)
    local uri_key_rx = ngx.var.uri_base.."/("..key_regex..")"
    local method = ngx.req.get_method()
    local response = {}
    if method == "GET" then
        ngx.say(json.encode(response))
    elseif method == "DELETE" then
        local session_id, err = get_session()
        if session_id then
            local key = string.match(ngx.var.uri, uri_key_rx)
            if key then
                if key == session_id then
                    local target = session_map:get(key)
                    if target == nil then
                        ngx.status = ngx.HTTP_NOT_FOUND
                        response = "Session does not exist: "..key
                    else
                        local dock_lock = locklib:new(M.lock_name, lock_opts)
                        local session = notemgr:split(target)
                        id = session[2]
                        -- lock docker map before read/write
                        elapsed, err = dock_lock:lock(id)
                        if elapsed then -- lock worked
                            response = "Reaping container"
                            ngx.log(ngx.NOTICE, "Manual shutdown of "..id.." by user "..key)
                            local ok, err = pcall(notemgr.remove_notebook, id)
                            if ok then
                                docker_map:delete(id)
                                session_map:delete(key)
                                ngx.log(ngx.INFO, "Notebook "..id.." removed")
                            elseif string.find(err, "does not exist") then
                                docker_map:delete(id)
                                session_map:delete(key)
                                ngx.log(ngx.WARN, "Notebook "..id.." nonexistent - removing references")
                            else
                                ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                                ngx.log(ngx.ERR, "Error: "..err)
                                response = "Error: "..err
                            end
                            dock_lock:unlock() -- unlock if it worked
                        else
                            ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                            ngx.log(ngx.ERR, "Error: "..err)
                            response = "Error: "..err
                        end
                    end
                else
                    ngx.status = ngx.HTTP_UNAUTHORIZED
                    ngx.log(ngx.WARN, "Unauthorized user "..session_id.." attempting to shutdown a Narrative owned by "..key)
                    response = "You do not have permission to shut down this Narrative"
                end
            else
                ngx.status = ngx.HTTP_NOT_FOUND
                response = "No key specified"
            end
        else
            ngx.status = ngx.HTTP_UNAUTHORIZED
            ngx.log(ngx.WARN, "Unauthorized user attempting to shutdown a Narrative")
            response = "Must provide user credentials to shutdown a running server!"
        end
        ngx.say(json.encode(response))
    else
        ngx.exit(ngx.HTTP_METHOD_NOT_IMPLEMENTED)
    end
end

-- This function is used to implement the rest interface
set_proxy = function(self)
    local uri_key_rx = ngx.var.uri_base.."/("..key_regex ..")"
    local uri_id_rx = ngx.var.uri_base.."/("..id_regex ..")"
    local uri_pair_rx = ngx.var.uri_base.."/"..key_regex .."/".."("..id_regex..")$"
    local client_ip = ngx.var.remote_addr
    local method = ngx.req.get_method()
    local new_flag = false
    -- get the provisioning / reaper functions into the run queue if not already
    -- the workers sometimes crash and having it here guarentees it will be running
    check_provisioner()
    check_marker()
    if method == "POST" then
        local response = {}
        -- POST method takes a session key and assigns a queued container to it
        -- If no key given it enqueues a new container
        local key = string.match(ngx.var.uri, uri_key_rx)
        if key then
            local target = session_map:get(key)
            if target == nil then
                target = assign_container(key, client_ip)
                -- if assignment fails, launch new container and try again
                if target == nil then
                    ngx.log(ngx.WARN, "No queued containers to assign, launching new")
                    res = new_container()
                    if res then
                        target = assign_container(key, client_ip)
                    end
                end
                if target then
                    new_container() -- if a queued container is assigned, enqueue another
                    local session = notemgr:split(target)
                    response["msg"] = "Assigned container "..session[2].." to "..key
                else
                    response["error"] = "No available docker containers!"
                    ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                end
            else
                response["error"] = "Entry already exists: "..key
                ngx.status = ngx.HTTP_BAD_REQUEST
            end
        else
            res = new_container()
            if res then
                response["msg"] = "Launched new container: "..res
            else
                response["error"] = "Unable to launch a docker container"
                ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
            end
        end
        ngx.say(json.encode(response))
    elseif method == "GET" then
        local response = {}
        -- Check URI to see if a specific session key or container id is asked for,
        -- if so return that record, else we return all records
        -- info = { state, ip:port, session, last_time, last_ip }
        local key = string.match(ngx.var.uri, uri_key_rx)
        local id = string.match(ngx.var.uri, uri_id_rx)
        local cid = nil
        -- return all records
        if (not key) and (not id) then
            local ids = docker_map:get_keys()
            for num = 1, #ids do
                local id = ids[num]
                local val = docker_map:get(id)
                if val then
                    local info = notemgr:split(val)
                    table.insert(response, {
                        docker_id = id,
                        state = info[1],
                        proxy_target = info[2],
                        session_id = info[3],
                        last_seen = os.date("%c", tonumber(info[4])),
                        last_ip = info[5]
                    })
                end
            end
        -- return a single record
        else
            if key then
                local target = session_map:get(key)
                if target then
                    local session = notemgr:split(target)
                    cid = session[2]
                end
            end
            if id and (not cid) then
                cid = id
            end
            if cid then
                local val = docker_map:get(cid)
                if val then
                    local info = notemgr:split(val)
                    response = {
                       docker_id = cid,
                       state = info[1],
                       proxy_target = info[2],
                       session_id = info[3],
                       last_seen = os.date("%c", tonumber(info[4])),
                       last_ip = info[5]
                    }
                end
            else
                response["error"] = "No valid session key or container Id specified"
                ngx.status = ngx.HTTP_NOT_FOUND
            end
        end
        ngx.say(json.encode(response))
    elseif method == "PUT" then
        local response = {}
        -- PUT method performs changes on memory maps
        -- Check URI for action to perform
        local action = string.match(ngx.var.uri, uri_key_rx)
        if action then
            if action == "sync" then
                -- sync maps with existing containers
                sync_containers()
                response["msg"] = "Synced docker memory map with docker container state"
            else
                response["error"] = "Invalid action specified: "..action
                ngx.status = ngx.HTTP_BAD_REQUEST
            end
        else
            response["error"] = "No action specified"
            ngx.status = ngx.HTTP_NOT_FOUND
        end
        ngx.say(json.encode(response))
    elseif method == "DELETE" then
        local response = {}
        -- Check URI to make sure a specific container id is being asked for,
        -- then queues it for deletion, along with any session thats bound to it
        local key = string.match(ngx.var.uri, uri_key_rx)
        if key then
            -- immediatly delete all provisioned containers
            if key == "provisioned" then
                response = { msg = "", deleted = {}, error = {} }
                -- get locker
                local dock_lock = locklib:new(M.lock_name, lock_opts)
                -- loop through ids
                local ids = docker_map:get_keys()
                local del = 0
                for num = 1, #ids do
                    id = ids[num]
                    -- lock docker map before read/write
                    elapsed, err = dock_lock:lock(id)
                    if elapsed then -- lock worked
                        local val = docker_map:get(id) -- make sure its still there
                        if val then
                            -- info = { state, ip:port, session, last_time, last_ip }
                            local info = notemgr:split(val)
                            -- this is provisioned / unassigned
                            if info[1] == "queued" then
                                ngx.log(ngx.INFO, "Atempting to kill container "..id)
                                local ok, err = pcall(notemgr.remove_notebook, id)
                                if ok then
                                    del = del + 1
                                    table.insert(response.deleted, id)
                                    docker_map:delete(id)
                                    ngx.log(ngx.INFO, "Container "..id.." removed")
                                elseif string.find(err, "does not exist") then
                                    del = del + 1
                                    table.insert(response.deleted, id)
                                    docker_map:delete(id)
                                    ngx.log(ngx.WARN, "Notebook "..id.." nonexistent - removing references")
                                else
                                    table.insert(response.error, id)
                                    ngx.log(ngx.ERR, "Error: "..err)
                                end
                            end
                        end
                        dock_lock:unlock() -- unlock if it worked
                        response["msg"] = "Sucessfully killed "..del.." containers"
                    else
                        ngx.log(ngx.ERR, "Error: "..err)
                        response["msg"] = "Error: "..err
                        ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                    end
                end
            -- mark for deletion container associated with session key
            else
                local target = session_map:get(key)
                if target then
                    local session = notemgr:split(target)
                    local val = docker_map:get(session[2])
                    if val then
                        -- info = { state, ip:port, session, last_time, last_ip }
                        local info = notemgr:split(val)
                        -- mark the proxy instance for deletion
                        info[1] = "idle"
                        local success, err, forcible = docker_map:set(id, table.concat(info, " "))
                        if success then
                            response["msg"] = "Marked for reaping"
                            ngx.log(ngx.INFO, "Marked for reaping: "..key..", "..session[2])
                        else
                            response["error"] = err
                            ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
                        end
                    else
                        response["error"] = "Docker container "..session[2].." does not exist"
                        ngx.status = ngx.HTTP_NOT_FOUND
                    end
                else
                    response["error"] = "Session key "..key.." does not exist"
                    ngx.status = ngx.HTTP_NOT_FOUND
                end
            end
        else 
            response["error"] = "No valid session key specified"
            ngx.status = ngx.HTTP_NOT_FOUND
        end
        ngx.say(json.encode(response))
    else
        ngx.exit(ngx.HTTP_METHOD_NOT_IMPLEMENTED)
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
    local cheader = ngx.unescape_uri(hdrs['Cookie'])
    local token = {}
    local session_id = nil; -- nil return value by default
    if cheader then
        -- ngx.log( ngx.DEBUG, string.format("cookie = %s",cheader))
        local session = string.match(cheader, auth_cookie_name.."=([%S]+);?")
        if session then
            -- ngx.log( ngx.DEBUG, string.format("kbase_session = %s",session))
            session = string.gsub(session, ";$", "")
            session = url_decode(session)
            for k, v in string.gmatch(session, "([%w_]+)=([^|]+);?") do
                token[k] = v
            end
            if token['token'] then
                token['token'] = string.gsub(token['token'], "PIPESIGN", "|")
                token['token'] = string.gsub(token['token'], "EQUALSSIGN", "=")
                -- ngx.log( ngx.DEBUG, string.format("token[token] = %s",token['token']))
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
            ngx.log(ngx.WARN, "Token cache miss: ", token['kbase_sessionid'])
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
    else
        if cheader then
            ngx.log(ngx.ERR, "Error: invalid token / auth format: "..cheader)
        else
            ngx.log(ngx.ERR, "Error: missing 'cookie' header")
        end
    end
    return session_id
end

--
-- Check docker_map and update session_map if missing
-- this for-loop makes me wish lua had a continue statement
-- currently not using this function
--
sync_sessions = function()
    ngx.log(ngx.INFO, "Updating session_map from docker_map")
    -- add any assigned notebooks we don't know about
    local ids = docker_map:get_keys()
    local docker_lock = locklib:new(M.lock_name, lock_opts)
    local session_lock = locklib:new(M.lock_name, lock_opts)
    for num = 1, #ids do
        id = ids[num]
        -- lock memory map before access
        elapsed, err = docker_lock:lock(id)
        if elapsed then -- lock worked
            local val = docker_map:get(id) -- make sure its still there
            if val then
                -- info = { state, ip:port, session, last_time, last_ip }
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
                                ngx.log(ngx.WARN, "session_map is stale, missing "..info[3]..", "..id)
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

-- function to sync docker state with docker memory map
-- remove any containers that don't exist in both
sync_containers = function()
    ngx.log(ngx.INFO, "Syncing docker memory map with docker container state")
    local portmap = notemgr:get_notebooks(M.image)
    local ids = docker_map:get_keys()
    local dock_lock = locklib:new(M.lock_name, lock_opts)
    local session_lock = locklib:new(M.lock_name, lock_opts)
    -- delete from memory if not a container
    for num = 1, #ids do
        id = ids[num]
        -- lock memory map before delete
        elapsed, err = dock_lock:lock(id)
        if elapsed then
            val = docker_map:get(id)  -- make sure its still there
            if val and not portmap[id] then
                -- info = { state, ip:port, session, last_time, last_ip }
                local info = notemgr:split(val)
                ngx.log(ngx.WARN, "memory maps are stale, deleting "..info[3]..", "..id)
                docker_map:delete(id)
                -- delete from session map if deleting from docker_map
                elapsed, err = session_lock:lock(info[3])
                if elapsed then
                    target = session_map:get(info[3])
                    if target then
                        session_map:delete(info[3])
                    end
                    session_lock:unlock() -- unlock if it worked
                end
            end
            dock_lock:unlock() -- unlock if it worked
        end
    end
    -- delete from docker if not in memory
    -- we don't know if it was given a session or not
    for id, _ in pairs(portmap) do
        local mem_id = docker_map:get(id)
        -- its missing, kill / remove
        if mem_id == nil then
            local ok, err = pcall(notemgr.remove_notebook, id)
            if not ok then
                ngx.log(ngx.ERR, "Error: "..err)
            end
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
    local id, info = notemgr:launch_notebook(M.image)
    if id == nil then
        ngx.log(ngx.ERR, "Failed to launch new instance : "..p.write(info))
        return nil
    end
    -- lock key before writing it
    local dock_lock = locklib:new(M.lock_name, lock_opts)
    elapsed, err = dock_lock:lock(id)
    if elapsed == nil then
        ngx.log(ngx.ERR, "Error: failed to update docker cache: "..err)
        return nil
    end
    docker_map:set(id, table.concat(info, " "))
    dock_lock:unlock()
    return id
end

--
-- Assign session to oldest qeueued container
-- edits docker_map and session_map
-- session_id is already locked when this function called
-- returns session info, nil if error
--
assign_container = function(session_id, client_ip)
    -- sync maps with existing containers
    sync_containers()
    ngx.log(ngx.INFO, "Assigning container from queue")
    -- get list of queued ids, oldest to newest
    local ordered = {}
    local ids = docker_map:get_keys()
    for num = 1, #ids do
        local id = ids[num]
        local val = docker_map:get(id)
        if val then
            local info = notemgr:split(val)
            table.insert(ordered, {id, tonumber(info[4])})
        end
    end
    -- sort by time
    table.sort(ordered, function(a,b) return a[2] < b[2] end)
    -- process queued containers: oldest first / lock each in turn
    local dock_lock = locklib:new(M.lock_name, lock_opts)
    for num = 1, #ordered do
        local id = ordered[num][1]
        elapsed, err = dock_lock:lock(id)
        if elapsed then
            local val = docker_map:get(id)
             -- make sure its still there
            if val then
                local info = notemgr:split(val)
                if info[1] == "queued" then
                    if info[3] == "*" then  -- found one
                        session_val = table.concat({info[2], id}, " ")
                        session_map:set(session_id, session_val)
                        docker_map:set(id, table.concat({"active", info[2], session_id, os.time(), client_ip}, " "))
                        dock_lock:unlock()
                        return session_val
                    else -- bad state, session with queued
                        info[1] = "idle"
                        docker_map:set(id, table.concat(info, " "))
                    end
                end
            end
            dock_lock:unlock() -- unlock if it worked
        end
    end
    return nil
end

---
--- Redirect to the login handler in the ui, passing the current uri in the required json encoded structure.
---
auth_redirect = function()
    -- use / to make this relative to the host, but absolute path
    local next_request = json.encode({path = ngx.var.request_uri, external = true})
    return ngx.redirect('/#login?nextrequest=' .. ngx.escape_uri(next_request))
end

--
-- Route to the appropriate proxy
--
use_proxy = function(self)
    local target = nil
    local client_ip = ngx.var.remote_addr

    -- get the provisioning / reaper functions into the run queue if not already
    -- the workers sometimes crash and having it here guarantees it will be running
    check_provisioner()
    check_marker()

    -- get session
    -- If if fails for any reason (there are several possible) redirect to
    -- an end point which can authenticate and hopefully send them back here
    -- NB although the key for the container is called various things through this 
    -- file it is important that it is the USERNAME, and thus it is named in this
    -- function.
    local username = get_session()
    if not username then
        return auth_redirect()
    end

    -- get proxy target
    target = session_map:get(username)

    -- didn't find in session_map, lock and try again
    if target == nil then
        session_lock = locklib:new(M.lock_name, lock_opts)
        elapsed, err = session_lock:lock(username)
        if err then 
            ngx.log(ngx.ERR, string.format("Error obtaining key %s", err))
            return ngx.exit(ngx.HTTP_REQUEST_TIMEOUT, string.format("Error obtaining key %s", err))
        end
        target = session_map:get(username)
        -- still missing, but we would expect that, as it is unlikely that 
        -- a session for this user would be created between the two calls.
        if target == nil then
            -- this updates docker_map with session info
            target = assign_container(username, client_ip)

            -- if assignment fails, launch new container and try again
            if target == nil then
                ngx.log(ngx.WARN, "No queued containers to assign, launching new")
                res = new_container()
                if res then
                    target = assign_container(username, client_ip)
                end
            end

            -- Done with the lock (assign_container assumes the username is locked)
            session_lock:unlock()

            -- can not assign a new one / bad state
            if target == nil then
                ngx.log(ngx.ERR, "No available docker containers!")
                return(ngx.exit(ngx.HTTP_SERVICE_UNAVAILABLE))
            end

            -- if a container is assigned, enqueue another
            new_container()

            -- route to the "loading" page which will wait until the container
            -- is ready before loading the narrative.
            local scheme = ngx.var.src_scheme and ngx.var.src_scheme or 'http'
            local returnurl = string.format("%s://%s%s", scheme, ngx.var.http_host, ngx.var.request_uri)            
            return ngx.redirect(string.format(M.load_redirect, ngx.escape_uri(ngx.var.request_uri)))
        end
        session_lock:unlock()
    end
    -- if we got here, we will have successfully pulled a container from the
    -- session (username) map, and this section updates the entry.
    if target ~= nil then
        -- session = { IP:port, docker_id }
        local session = notemgr:split(target)
        ngx.var.target = session[1]
        -- update docker_map session info, lock first
        local dock_lock = locklib:new(M.lock_name, lock_opts)
        elapsed, err = dock_lock:lock(session[2])
        if err then
            -- TODO: soooo ... why do we go ahead and update the cache entry that
            -- can't be locked?
            ngx.log(ngx.ERR, "Error: failed to lock docker cache: "..err)
        end
        success,err,forcible = docker_map:set(session[2], table.concat({"active", session[1], username, os.time(), client_ip}, " "))
        if not success then
            ngx.log(ngx.WARN, "Error: failed to update docker cache: "..err)
        end
        dock_lock:unlock()
    else
        -- I really don't even see how this condition is possible, or likely
        -- the session should either be found, created, or if it can't be created
        -- an error condition reported.
        return(ngx.exit(ngx.HTTP_NOT_FOUND))
    end
end

check_proxy = function(self)
    local target = nil
    local client_ip = ngx.var.remote_addr

    -- get the provisioning / reaper functions into the run queue if not already
    -- the workers sometimes crash and having it here guarantees it will be running
    check_provisioner()
    check_marker()

    -- get session
    -- If if fails for any reason (there are several possible) redirect to
    -- an end point which can authenticate and hopefully send them back here
    -- NB although the key for the container is called various things through this 
    -- file it is important that it is the USERNAME, and thus it is named in this
    -- function.
    local username = get_session()
    if not username then
        ngx.status = ngx.HTTP_UNAUTHORIZED
        return ngx.exit(ngx.HTTP_OK)
        -- return auth_redirect()
    end

    -- get proxy target
    target = session_map:get(username)

    -- didn't find in session_map, lock and try again
    if target == nil then
        session_lock = locklib:new(M.lock_name, lock_opts)
        elapsed, err = session_lock:lock(username)
        if err then 
            ngx.log(ngx.ERR, string.format("Error obtaining key %s", err))
            
            -- Weird construction, but necessary to set a status code and also
            -- return content.
            ngx.status = ngx.HTTP_REQUEST_TIMEOUT
            ngx.say(string.format("Error obtaining key %s", err))
            return ngx.exit(ngx.HTTP_OK)
        end
        target = session_map:get(username)

        -- still missing, but we would expect that, as it is unlikely that 
        -- a session for this user would be created between the two calls.
        if target == nil then
            -- this updates docker_map with session info
            target = assign_container(username, client_ip)

            -- if assignment fails, launch new container and try again
            if target == nil then
                ngx.log(ngx.WARN, "No queued containers to assign, launching new")
                res = new_container()
                if res then
                    target = assign_container(username, client_ip)
                end
            end

            -- Done with the lock (assign_container assumes the username is locked)
            session_lock:unlock()

            -- can not assign a new one / bad state
            if target == nil then
                ngx.log(ngx.ERR, "No available docker containers!")
                return ngx.exit(ngx.HTTP_SERVICE_UNAVAILABLE)
            end

            -- if a container is assigned, enqueue another
            new_container()

            -- Just return a 200 response as a signal that all is ok.
            return ngx.exit(ngx.HTTP_CREATED)
        end
        session_lock:unlock()
    end
    -- if we got here, we will have successfully pulled a container from the
    -- session (username) map, and this section updates the entry.
    if target ~= nil then
        -- session = { IP:port, docker_id }
        local session = notemgr:split(target)

        ngx.log(ngx.WARN, "target is ");
        ngx.log(ngx.WARN, session[1])

        ngx.var.target = session[1]
        -- update docker_map session info, lock first
        local dock_lock = locklib:new(M.lock_name, lock_opts)
        elapsed, err = dock_lock:lock(session[2])
        if err then
            -- TODO: soooo ... why do we go ahead and update the cache entry that
            -- can't be locked?
            ngx.log(ngx.ERR, "Error: failed to lock docker cache: "..err)
        end
        success,err,forcible = docker_map:set(session[2], table.concat({"active", session[1], username, os.time(), client_ip}, " "))
        if not success then
            ngx.log(ngx.WARN, "Error: failed to update docker cache: "..err)
        end
        dock_lock:unlock()
    else
        -- I really don't even see how this condition is possible, or likely
        -- the session should either be found, created, or if it can't be created
        -- an error condition reported.
        return(ngx.exit(ngx.HTTP_NOT_FOUND))
    end
end

M.check_marker = check_marker
M.check_provisioner = check_provisioner
M.set_proxy = set_proxy
M.check_proxy = check_proxy
M.use_proxy = use_proxy
M.initialize = initialize
M.narrative_shutdown = narrative_shutdown

return M
