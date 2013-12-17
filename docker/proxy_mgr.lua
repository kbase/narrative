--
-- REST based HTTP service that allows you to query/modify the contents of an
-- nginx shared memory DICT object.
--
-- bind this via an access_by_lua_file directive in nginx.conf
-- make sure that there is an nginx variable called uri_base in the current
-- context - it is used in parsing out the URI path
-- Used to implement a dynamic reverse proxy for KBase Narrative project
--
-- Steve Chan
-- sychan@lbl.gov
--

local M={}
-- regexes for matching/validating keys and values
local key_regex = "[%w_%-%.]+"
local val_regex = "[%w_%-:%.]+"

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
	 local proxy_map = ngx.shared.proxy_map
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
      local proxy_map = ngx.shared.proxy_map

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
      local proxy_map = ngx.shared.proxy_map

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
      local proxy_map = ngx.shared.proxy_map

      -- Check URI to make sure a specific key is being asked for
      local uri_base = ngx.var.uri_base
      local key = string.match(ngx.var.uri,uri_key_rx)
      if key then
	 local target, flags = proxy_map:get(key)
	 if target == nil then
	    ngx.status = ngx.HTTP_NOT_FOUND
	 else
	    proxy_map:delete(key)
	    response = "deleted"
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

local function use_proxy()
   ngx.log( ngx.ERR, "In /narrative/ handler")
   local proxy_key = string.match(ngx.var.uri,"/narrative/([%w_-]+)")
   if proxy_key then
      local proxy_map = ngx.shared.proxy_map
      local target, flags = proxy_map:get(proxy_key)
      if target == nil then
	 ngx.log( ngx.ERR, "Bad proxy key:" .. proxy_key)
	 ngx.exit(ngx.HTTP_NOT_FOUND)
      else
	 ngx.var.target = target
	 ngx.log( ngx.ERR, "Redirect to " .. ngx.var.target )
      end
   else
      ngx.log( ngx.ERR, "No proxy key given")
      ngx.exit(ngx.HTTP_NOT_FOUND)
   end
end

M.set_proxy = set_proxy
M.use_proxy = use_proxy
return M