--
-- Module for managing notebook container instances running with the docker module
--
-- author: Steve Chan sychan@lbl.gov
--
-- Copyright 2013 The Regents of the University of California,
--                Lawrence Berkeley National Laboratory
--                United States Department of Energy
--          	 The DOE Systems Biology Knowledgebase (KBase)
-- Made available under the KBase Open Source License
--

local M = {}

local docker = require('docker')
local json = require('json')
local p = require('pl.pretty')
local lfs = require('lfs')

-- This is the repository name, can be set by whoever instantiates a notelauncher
M.repository_image = 'kbase/narrative'
-- This is the tag to use, defaults to latest
M.repository_version = 'latest'
-- This is the port that should be exposed from the container, the service in the container
-- should have a listener on here configured
M.private_port = 8888
-- This is the path to the syslog Unix socket listener in the host environment
-- it is imported into the container via a Volumes argument
M.syslog_src = '/dev/log'

--
--  Query the docker container for a list of containers and
-- return a list of the container names that have listeners on
-- port 8888. Keyed on container name, value is IP:Port that can
-- be fed into an nginx proxy target
local function get_notebooks()
   local ok, res = pcall(docker.client.containers,docker.client)
   local portmap = {}
   ngx.log( ngx.DEBUG, string.format("list containers result: %s",p.write(res.body)))
   if ok then
      for index,container in pairs(res.body) do
	 -- we only care about containers matching repository_image and listening on the proper port
	 first,last = string.find(container.Image,M.repository_image)
	 if first == 1 then
	    name = string.sub(container.Names[1],2,-1)
	    portmap[name]={}
	    for i, v in pairs(container.Ports) do
	       if v.PrivatePort == M.private_port then
		  portmap[name] = string.format("127.0.0.1:%u", v.PublicPort)
	       end
	    end
	 end
      end
      return portmap
   else
      local msg = string.format("Failed to fetch list of containers: %s",p.write(res.body))
      ngx.log(ngx.ERR,msg)
      error(msg)
   end
end

--
--    Actually launch a new docker container.
--
local function launch_notebook( name )
   -- don't wrap this in a pcall, if it fails let it propagate to
   -- the caller
   portmap = get_notebooks()
   assert(portmap[name] == nil, "Notebook by this name already exists: " .. name)
   local conf = docker.config()
   local bind_syslog = nil
   conf.Image = string.format("%s:%s",M.repository_image,M.repository_version)
   conf.Cmd={name}
   conf.PortSpecs = {tostring(M.private_port)}
   ngx.log(ngx.INFO,string.format("Spinning up instance of %s on port %d",conf.Image, M.private_port))
   -- we wrap the next call in pcall because we want to trap the case where we get an
   -- error and try deleting the old container and creating a new one again
   local ok,res = pcall(docker.client.create_container, docker.client, { payload = conf, name = name})
   if not ok and res.response.status >= 409 then
      -- conflict, try to delete it and then create it again
      ngx.log(ngx.ERR,string.format("conflicting notebook, removing notebook named: %s",name))   
      ok, res = pcall( docker.client.remove_container, docker.client, { id = name })
      ngx.log(ngx.ERR,string.format("response from remove_container: %s", p.write(res.response)))
      -- ignore the response and retry the create, and if it still errors, let that propagate
      ok, res = pcall(docker.client.create_container, docker.client, { payload = conf, name = name})
   end
   if ok then
      assert(res.status == 201, "Failed to create container: " .. json.encode(res.body))
      local id = res.body.Id
      if M.syslog_src then
	 -- Make sure it exists and is writeable
	 local stat = lfs.attributes(M.syslog_src)
	 if stat ~= nil and stat.mode == 'socket' then
	    bind_syslog = { string.format("%s:%s",M.syslog_src,"/dev/log") }
	    --ngx.log(ngx.ERR,string.format("Binding %s in container %s", bind_syslog[1], name))
	 else
	    --ngx.log(ngx.ERR,string.format("%s is not writeable, not mounting in container %s",M.syslog_src, name))
	 end
      end
      if bind_syslog ~= nil then
	 res = docker.client:start_container{ id = id, payload = { PublishAllPorts = true, Binds = bind_syslog }}
      else
	 res = docker.client:start_container{ id = id, payload = { PublishAllPorts = true }}
      end      
      assert(res.status == 204, "Failed to start container " .. id .. " : " .. json.encode(res.body))
      -- get back the container info to pull out the port mapping
      res = docker.client:inspect_container{ id=id}
      --p.dump(res)
      assert(res.status == 200, "Could not inspect new container: " .. id)
      local ports = res.body.NetworkSettings.Ports
      local ThePort = string.format("%d/tcp", M.private_port)

      local log, occ = string.gsub(res.body.HostsPath,"hosts","root/tmp/kbase-narrative.log")
      local ct=5
      local ready=0
      while (ct and not ready) do
         local f=io.open(name,"r")
         if f ~= nil then 
            io.close(f) 
            ready = 1 
         end
         ct = ct - 1
         ngx.sleep(2)
      end
      if not ready then
         local msg = "Time out starting container: " .. id
         ngx.log(ngx.ERR,msg)
         error(msg)
      end

      assert(ports[ThePort] ~= nil, string.format("Port binding for port %s not found!",ThePort))
      return(string.format("%s:%d","127.0.0.1", ports[ThePort][1].HostPort))
   else
      local msg = "Failed to create container: " .. p.write(res)
      ngx.log(ngx.ERR,msg)
      error(msg)
   end
end

--
--    Kill and remove an existing docker container.
--
local function remove_notebook( name )
   local portmap = get_notebooks()
   assert(portmap[name], "Notebook by this name does not exist: " .. name)
   local id = string.format('/%s',name)
   --ngx.log(ngx.INFO,string.format("removing notebook named: %s",id))
   local res = docker.client:stop_container{ id = id }
   --ngx.log(ngx.INFO,string.format("response from stop_container: %d : %s",res.status,res.body))
   assert(res.status == 204, "Failed to stop container: " .. json.encode(res.body))
   res = docker.client:remove_container{ id = id}
   --ngx.log(ngx.INFO,string.format("response from remove_container: %d : %s",res.status,res.body))
   assert(res.status == 204, "Failed to remove container " .. id .. " : " .. json.encode(res.body))
   return true
end

M.docker = docker
M.get_notebooks = get_notebooks
M.launch_notebook = launch_notebook
M.remove_notebook = remove_notebook
return M

