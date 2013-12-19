--
-- Module for managing notebook container instances running with the docker module
--
local M = {}

local docker = require('docker')
local json = require('json')
local docker_image = 'sychan/narrative:latest'
local p = require('pl.pretty')

--
--  Query the docker container for a list of containers and
-- return a list of the container names that have listeners on
-- port 8888. Keyed on container name, value is IP:Port that can
-- be fed into an nginx proxy target
local function get_notebooks()
   local res = docker.client:containers()
   local portmap = {}
   for index,container in pairs(res.body) do
      name = string.sub(container.Names[1],2,-1)
      portmap[name]={}
      for i, v in pairs(container.Ports) do
	 -- we only care about services listening on port 8888 - IPython notebooks
	 if v.PrivatePort == 8888 then
	    portmap[name] = string.format("127.0.0.1:%u", v.PublicPort)
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
   conf.image = docker_image
   conf.Cmd={name}
   conf.portSpecs = {"8888"}
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

M.docker = docker
M.get_notebooks = get_notebooks
M.launch_notebook = launch_notebook

return M

