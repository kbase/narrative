--
-- Module for managing notebook container instances running with the docker module
--
local M = {}

local docker = require('docker')
local json = require('json')
local docker_image = 'sychan/narrative:latest'
local p = require('pl.pretty')
local private_port = 8888
--
--  Query the docker container for a list of containers and
-- return a list of the container names that have listeners on
-- port 8888. Keyed on container name, value is IP:Port that can
-- be fed into an nginx proxy target
local function get_notebooks()
   local res = docker.client:containers()
   local portmap = {}
   for index,container in pairs(res.body) do
      -- we only care about containers running docker_image and listening on the proper port
      if container.Image == docker_image then
	 name = string.sub(container.Names[1],2,-1)
	 portmap[name]={}
	 for i, v in pairs(container.Ports) do
	    if v.PrivatePort == private_port then
	       portmap[name] = string.format("127.0.0.1:%u", v.PublicPort)
	    end
	 end
      end
   end
   return portmap
end

--
--    Actually launch a new docker container.
--
local function launch_notebook( name )
   local res = docker.client:containers()
   local portmap = get_notebooks()
   assert(portmap[name] == nil, "Notebook by this name already exists: " .. name)
   local conf = docker.config()
   conf.Image = docker_image
   conf.Cmd={name}
   conf.PortSpecs = {"8888"}
   --p.dump(conf)
   local res = docker.client:create_container{ payload = conf, name = name}
   --p.dump(res)
   assert(res.status == 201, "Failed to create container: " .. json.encode(res.body))
   local id = res.body.Id
   res = docker.client:start_container{ id = id, payload = { PublishAllPorts = true }}
   --p.dump(res)
   assert(res.status == 204, "Failed to start container " .. id .. " : " .. json.encode(res.body))
   -- get back the container info to pull out the port mapping
   res = docker.client:inspect_container{ id=id}
   --p.dump(res)
   assert(res.status == 200, "Could not inspect new container: " .. id)
   local ports = res.body.NetworkSettings.Ports
   assert( ports["8888/tcp"] ~= nil, "Port binding for port 8888/tcp not found!")
   return(string.format("%s:%d","127.0.0.1", ports['8888/tcp'][1].HostPort))
end

--
--    Kill and remove an existing docker container.
--
local function remove_notebook( name )
   local portmap = get_notebooks()
   assert(portmap[name], "Notebook by this name does not exist: " .. name)
   local id = string.format('/%s',name)
   ngx.log(ngx.INFO,string.format("removing notebook named: %s",id))
   local res = docker.client:stop_container{ id = id }
   ngx.log(ngx.INFO,string.format("response from stop_container: %d : %s",res.status,res.body))
   assert(res.status == 204, "Failed to stop container: " .. json.encode(res.body))
   res = docker.client:remove_container{ id = id}
   ngx.log(ngx.INFO,string.format("response from remove_container: %d : %s",res.status,res.body))
   assert(res.status == 204, "Failed to remove container " .. id .. " : " .. json.encode(res.body))
   return true
end

M.docker = docker
M.get_notebooks = get_notebooks
M.launch_notebook = launch_notebook
M.remove_notebook = remove_notebook
return M

