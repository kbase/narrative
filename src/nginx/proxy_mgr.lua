local method = ngx.req.get_method()
if method == "POST" then
   local response = {}
   ngx.req.read_body()
   local args = ngx.req.get_post_args()
   if not args then
      response["msg"] = "failed to get post args: "
      ngx.status = ngx.HTTP_BAD_REQUEST
   else
      local proxy_map = ngx.shared.proxy_map
      for key, val in pairs(args) do
	 if type(val) == "table" then
	    response["msg"] = "bad post argument: " .. key
	    ngx.status = ngx.HTTP_BAD_REQUEST
	    break
	 else
	    ngx.log( ngx.ERR, "Inserting: " .. key .. " -> " .. val)
	    success, err, force = proxy_map:add(key, val)
	    if not success then
	       ngx.status = ngx.HTTP_BAD_REQUEST
	       response["msg"] = "key insertion error " .. key .. " : " ..err
	    end
	 end
      end
      if response["msg"] == nil then
	 ngx.status = ngx.HTTP_CREATED
	 response["msg"] = "Successfully added :"
	 local keys = proxy_map:get_keys() 
	 for key = 1, #keys do
	    local target, flags = proxy_map:get( keys[key])
	    response["msg"] = response["msg"] .. " " .. target
	 end
	 
      end
   end
   ngx.say(cjson.encode( response ))
elseif method == "GET" then
   local response = {}
   local proxy_map = ngx.shared.proxy_map

   -- Check URI to see if a specific proxy entry is being asked for
   -- or if we just dump it all out
   local uri_base = ngx.var.uri_base
   local rx = ngx.var.uri_base.."/([%w_-]+)"
   ngx.log( ngx.ERR, "Regex for matching is " .. rx )
   local key = string.match(ngx.var.uri,rx)
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
	 ngx.log( ngx.ERR, "Checking " .. keys[key] )
	 local target, flags = proxy_map:get( keys[key])
	 response[keys[key]] = target
      end
   end
   ngx.say(cjson.encode( response ))
elseif method == "UPDATE" then
   ngx.say("UPDATE handler at your service")
elseif method == "DELETE" then
   ngx.say("DELETE handler at your service")
else
   ngx.exit( ngx.HTTP_METHOD_NOT_IMPLEMENTED )
end
