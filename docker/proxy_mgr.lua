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
-- proxy_map
-- proxy_state
-- proxy_last
-- proxy_mgr
--
-- Steve Chan
-- sychan@lbl.gov
--

local M={}
-- regexes for matching/validating keys and values
local key_regex = "[%w_%-%.]+"
local val_regex = "[%w_%-:%.]+"
local json = require('json')
local notemgr = require('notelauncher')

-- this are name/value pairs referencing ngx.shared.DICT objects
-- that we use to track docker containers. The ngx.shared.DICT
-- implementation only supports basic scalar types, so we need a
-- couple of these instead of using a common table object
-- proxy_map maps a URL component ('sychan') to an
--           ip/port proxy target ('127.0.0.1:49000')
-- proxy_last maps a URL component('sychan') to a time value
--           (output from os.time()) when the proxy target was
--           last seen to be active
-- proxy_state maps a URL component ('sychan') to a boolean that
--           flags if that proxy has been marked for reaping
--           a true value means that the proxy is considered alive
--           and a false value means the instance is ready to be
--           reaped
local proxy_map = nil
local proxy_last = nil
local proxy_state = nil

-- This is a dictionary for storing proxy manager internal state
-- The following names are currentl supported
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

-- How often (in seconds) does the reaper wake up
-- we don't have an internal timer based worker thread for this yet,
-- but it is supposed to be in the HttpLuaModule repo, and waiting to be
-- released
M.interval = 300

-- How long (in seconds) since we last saw activity on a container should we wait before
-- shutting it down?
M.timeout = 180

-- How long (in seconds) after we mark an instance for deletion should we try to sweep it?
M.sweep_delay = 30


--
-- Function that runs a netstat and returns a table of foreign IP:PORT
-- combinations and the number of observed ESTABLISHED connetions (at
-- least 1)
--
local function est_connections()
   local connections = {}
   local handle = io.popen( NETSTAT, 'r')
   if handle then
      netstat = handle:read('*a')
      handle:close()
      for conn in string.gmatch(netstat,"[%d%.]+:[%d]+ + ESTABLISHED") do
	 ipport = string.match( conn, "[%d%.]+:[%d]+")
	 if connections[ipport] then
	    connections[ipport] = connections[ipport] + 1
	 else
	    connections[ipport] = 1
	 end
      end
   else
      ngx.log( ngx.ERR, string.format("Error trying to execute %s", NETSTAT))
   end
   return connections
end

--
-- Reaper function that looks in the proxy_state table for instances that need to be
-- removed and removes them
local function reap_sweeper ()
   ngx.log( ngx.INFO, "reap_sweeper running")
   proxy_mgr:delete('next_sweep')

   local keys = proxy_state:get_keys() 
   for key = 1, #keys do
      name = keys[key]
      if proxy_state:get(name) == false then
	 ngx.log( ngx.INFO, "reap_sweeper removing ",name)
	 notemgr.remove_notebook(name)
	 proxy_map:delete(key)
	 proxy_state:delete(key)
	 proxy_last:delete(key)
      end
   end
   -- enqueue ourself again
   ngx.log( ngx.INFO, string.format("Scheduling another sweeper run in %d seconds", M.interval))
   local success, err = ngx.timer.at(M.sweep_delay, reap_sweeper)
   if not success then
      ngx.log( ngx.ERR, string.format("Error enqueuing reap_sweeper to run in %d seconds: %s",
				      M.sweep_delay,err ))
   end
   proxy_mgr:set('next_sweep', os.time() + M.sweep_delay)
end


--
-- Reaper function that examines containers to see if they have been idle for longer than
-- M.timeout and then marks them for cleanup
--
local function reap_marker ()
   ngx.log( ngx.INFO, "reap_marker running")
   proxy_mgr:delete('next_mark')
   local keys = proxy_last:get_keys() 
   local now = os.time()
   local timeout = now - M.timeout

   -- fetch currently open connections
   local conn = est_connections()

   for key = 1, #keys do
      name = keys[key]
      local target = proxy_map:get( name)
      ngx.log( ngx.INFO, string.format("Checking %s -> %s", name, target))
      if conn[target] then
	 ngx.log( ngx.INFO, string.format("Found %s among current connections", name))
	 success, err = proxy_last:set(name, now)
	 if not success then
	    ngx.log( ngx.ERR, string.format("Error setting proxy_last[ %s ] from established connections: %s",
					    name,err ))
	 end
      else -- not among current connections, check for reaping
	 local last, flags = proxy_last:get( name)
	 if last <= timeout then
	    -- reap it
	    ngx.log( ngx.INFO, string.format("Marking %s for reaping - last seen %s",
					     name,os.date("%c",last)))
	    proxy_state:set(name,false)
	 end
      end
   end
   local next_run = proxy_mgr:get('next_sweep')
   if next_run == nil then -- no sweeper in the queue, put one into the queue!
      ngx.log( ngx.ERR, string.format("reaper_sweeper not in run queue, adding to queue with %d second delay",M.sweep_delay))
      local success, err = ngx.timer.at(M.sweep_delay, reap_sweeper)
      if not success then
	 ngx.log( ngx.ERR, string.format("Error enqueuing reap_sweeper to run in %d seconds: %s",
					 M.sweep_delay,err ))
      end
      proxy_mgr:set('next_sweep', os.time() + M.sweep_delay)
   elseif next_run + 60 < now then -- the reap sweeper should have run over a minute ago, warn and run immediately
      ngx.log( ngx.ERR, string.format("reaper_sweeper should have run at %s, forcing immediate run",
				      os.date("%c",next_run)))
      reap_sweeper()
   else
      ngx.log( ngx.INFO, "reap_sweeper already in run queue")
   end
   -- requeue ourselves
   local success, err = ngx.timer.at(M.interval, reap_marker)
   if not success then
      ngx.log( ngx.ERR, string.format("Error requeuing reap_marker to run in %d seconds: %s",
				      M.interval,err ))
   end
   proxy_mgr:set('next_mark', os.time() + M.interval)

end

--
-- Do some initialization for the proxy manager.
-- Named parameters are:
--     reap_interval - number of seconds between runs of the reaper, unused for now
--     idle_timeout  - number of seconds since last activity before a container is reaped
--     proxy_map - name to use for the nginx shared memory proxy_map
--     proxy_last - name to use for the nginx shared memory last connection access time
--
local function initialize( conf )
   if not initialized then
      initialized = os.time()
      M.interval = conf.reap_interval or M.interval
      M.timeout = conf.idle_timeout or M.timeout
      proxy_map = conf.proxy_map or ngx.shared.proxy_map
      proxy_last = conf.proxy_last or ngx.shared.proxy_last
      proxy_state = conf.proxy_state or ngx.shared.proxy_state
      proxy_mgr = conf.proxy_mgr or ngx.shared.proxy_mgr

      ngx.log( ngx.INFO, string.format("Initializing proxy manager: reap_internal %d idle_timeout %d",
				      M.interval,M.timeout))
   else
      ngx.log( ngx.INFO, string.format("Initialized at %d, skipping",initialized))
   end
end


-- This function is used to implement the rest interface
local function set_proxy()
   local uri_key_rx = ngx.var.uri_base.."/("..key_regex ..")"
   local uri_value_rx = ngx.var.uri_base.."/"..key_regex .."/".."("..val_regex..")$"
   local method = ngx.req.get_method()
   if method == "POST" then
      local response = {}
      local argc = 0
      ngx.req:read_body()
      local args = ngx.req:get_post_args()
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
	    elseif val == "" or val2 ~= val then
	       response["msg"] = "malformed value : " .. val
	       ngx.status = ngx.HTTP_BAD_REQUEST
	    elseif type(val) == "table" then
	       response["msg"] = "bad post argument: " .. key
	       ngx.status = ngx.HTTP_BAD_REQUEST
	       break
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
      ngx.say(json.encode( response ))
   elseif method == "GET" then
      local response = {}

      -- Check URI to see if a specific proxy entry is being asked for
      -- or if we just dump it all out
      local uri_base = ngx.var.uri_base
      local key = string.match(ngx.var.uri,uri_key_rx)
      if key then
	 local target, flags = proxy_map:get(key)
	 if target == nil then
	    ngx.status = ngx.HTTP_NOT_FOUND
	 else
	    response = target
	 end
      else 
	 local keys = proxy_map:get_keys() 
	 for key = 1, #keys do
	    local target, flags = proxy_map:get( keys[key])
	    response[keys[key]] = target
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
	 local target, flags = proxy_map:get(key)
	 if target == nil then
	    ngx.status = ngx.HTTP_NOT_FOUND
	 else
	    response = "Marked for reaping"
	    -- mark the proxy instance for deletion
	    proxy_state:set(key,false)
	 end
      else 
	 response = "No key specified"
         ngx.status = ngx.HTTP_NOT_FOUND
      end
      ngx.say(json.encode( response ))
   else
      ngx.exit( ngx.HTTP_METHOD_NOT_IMPLEMENTED )
   end
end

--
-- Route to the appropriate proxy
--
local function use_proxy()
   ngx.log( ngx.INFO, "In /narrative/ handler")
   local proxy_key = string.match(ngx.var.uri,"/narrative/([%w_-]+)")
   if proxy_key then
      local target, flags = proxy_map:get(proxy_key)
      if target == nil then -- didn't find in proxy map, check containers
	 ngx.log( ngx.WARN, "Unknown proxy key:" .. proxy_key)
	 local notebooks = notemgr:get_notebooks()
	 ngx.log( ngx.INFO, json.encode(notebooks))
	 target = notebooks[proxy_key]
	 if target then
	    ngx.log( ngx.INFO, "Found name among containers, redirecting to " .. target )
	    local success,err,forcible = proxy_map:set(proxy_key,target)
	    if not success then
	       ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
	       ngx.log( ngx.ERR, "Error setting proxy_map: " .. err)
	       response = "Unable to set routing for notebook " .. err
	    end
	 else
	    ngx.log( ngx.INFO, "Creating new notebook instance " )
	    local status, res = pcall(notemgr.launch_notebook,proxy_key)
	    if status then
	       ngx.log( ngx.INFO, "New instance at: " .. res)
	       -- do a none blocking sleep for 2 seconds to allow the instance to spin up
	       ngx.sleep(5)
	       local success,err,forcible = proxy_map:set(proxy_key,res)
	       if not success then
		  ngx.status = ngx.HTTP_INTERNAL_SERVER_ERROR
		  ngx.log( ngx.ERR, "Error setting proxy_map: " .. err)
		  response = "Unable to set routing for notebook " .. err
	       else
		  target = res
	       end
	    else
	       ngx.log( ngx.ERR, "Failed to launch new instance :" .. res)
	    end
	 end
      end
      if target ~= nil then
	 ngx.var.target = target
	 ngx.log( ngx.INFO, "Redirect to " .. ngx.var.target )
	 local success,err,forcible = proxy_last:set(proxy_key,os.time())
	 if not success then
	    ngx.log( ngx.WARN, "Error setting last seen timestamp proxy_last" )
	 end
	 local success,err,forcible = proxy_state:set(proxy_key,true)
      else
	 ngx.exit(ngx.HTTP_NOT_FOUND)
      end
   else
      ngx.log( ngx.ERR, "No proxy key given")
      ngx.exit(ngx.HTTP_NOT_FOUND)
   end
end

local function idle_status()
   local uri_key_rx = ngx.var.uri_base.."/("..key_regex ..")"
   local uri_value_rx = ngx.var.uri_base.."/"..key_regex .."/".."("..val_regex..")$"
   local method = ngx.req.get_method()
   local response = {}

   -- run the reap marker to update state of all containers if there isn't one in the queue
   local next_mark = proxy_mgr:get('next_mark')
   if next_mark == nil or next_mark + 10 < os.time() then
      ngx.log( ngx.WARN, "No reap_marker in queue, performing immediate marker run")
      reap_marker()
   end

   -- Check URI to see if a specific proxy entry is being asked for
   -- or if we just dump it all out
   local uri_base = ngx.var.uri_base
   local key = string.match(ngx.var.uri,uri_key_rx)
   if key then
      local last, flags = proxy_last:get(key)
      if last == nil then
	 ngx.status = ngx.HTTP_NOT_FOUND
      else
	 -- return the date seen plus the status value
	 response = os.date("%c",last) .. " " .. tostring(proxy_state:get(key))
      end
   else 
      local keys = proxy_last:get_keys() 
      for key = 1, #keys do
	 local last, flags = proxy_last:get( keys[key])
	 -- return either just the last seen date,
	 -- or the last seen date plus " _reap_" indicating it is awaiting reaping
	 response[keys[key]] = os.date("%c",last) .. " " .. tostring(proxy_state:get(keys[key]))
      end
   end
   ngx.say(json.encode( response ))
end

M.set_proxy = set_proxy
M.use_proxy = use_proxy
M.initialize = initialize
M.idle_status = idle_status
M.est_connections = est_connections

return M