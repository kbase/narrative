--
-- Module for managing notebook container instances running with the docker module
--
-- author: Steve Chan sychan@lbl.gov
--
-- Copyright 2013 The Regents of the University of California,
--                Lawrence Berkeley National Laboratory
--                United States Department of Energy
--               The DOE Systems Biology Knowledgebase (KBase)
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

-- simple function to split string by whitespace and return table
local function split(self, s)
    t = {}
    for x in string.gmatch(s, "%S+") do
        table.insert(t, x)
    end
    return t
end

--
-- Query the docker container for a list of containers and
-- return a list of the container ids that have listeners on
-- port 8888. Keyed on container name, value is IP:Port that can
-- be fed into an nginx proxy target
local function get_notebooks(self, image)
    local ok, res = pcall(docker.client.containers, docker.client)
    local portmap = {}
    if image then
        ngx.log(ngx.INFO, string.format("use image %s", image))
    else
        image=M.repository_image
    end
    ngx.log(ngx.DEBUG, string.format("list containers result: %s", p.write(res.body)))
    if ok then
        for index, container in pairs(res.body) do
            res = docker.client:inspect_container{id=container.Id}
            -- we only care about containers matching repository_image and listening on the proper port
            first, last = string.find(res.body.Config.Image, image)
            if first == 1 then
                for i, v in pairs(container.Ports) do
                    if v.PrivatePort == M.private_port then
                        local ports = res.body.NetworkSettings.Ports
                        local ip = res.body.NetworkSettings.IPAddress
                        local ip_port = string.format("%s:%d", ip, M.private_port)
                        portmap[container.Id] = ip_port
                    end
                end
            end
        end
    else
        ngx.log(ngx.ERR, string.format("Failed to fetch list of containers: %s", p.write(res.body)))
    end
    return portmap
end

--
-- Actually launch a new docker container.
-- Return docker ID and table of info: { state, ip:port, session, last_time, last_ip }
--
local function launch_notebook(self, image)
    -- don't wrap this in a pcall, if it fails let it propagate to
    -- the caller
    local conf = docker.config()
    local bind_syslog = nil
    if image then
        ngx.log(ngx.INFO, string.format("use image %s", image))
        conf.Image = image
    else
        conf.Image = string.format("%s:%s", M.repository_image, M.repository_version)
    end
    conf.PortSpecs = {tostring(M.private_port)}
    if M.syslog_src then
        -- Make sure it exists and is writeable
        local stat = lfs.attributes(M.syslog_src)
        if stat ~= nil and stat.mode == 'socket' then
            conf.HostConfig.Binds={ string.format("%s:%s",M.syslog_src,"/dev/log") }
            ngx.log(ngx.INFO, string.format("Binding %s in container %s", M.syslog_src, id))
        else
            ngx.log(ngx.ERR, string.format("%s is not writeable, not mounting in container %s", M.syslog_src, id))
        end
    end
    ngx.log(ngx.INFO, string.format("Spinning up instance of %s on port %d", conf.Image, M.private_port))
    -- we wrap the next call in pcall because we want to trap the case where we get an
    -- error and try deleting the old container and creating a new one again
    local ok, res = pcall(docker.client.create_container, docker.client, {payload = conf})
    if not ok and res.response.status == "connection refused" then
        ngx.log(ngx.ERR, "Unable to connect to docker API: "..p.write(res))
        return nil, res
    end
    if not ok and res.response.status >= 409 and res.body.Id then
        -- conflict, try to delete it and then create it again
        local id = res.body.Id
        ngx.log(ngx.ERR, string.format("conflicting notebook, removing container: %s", id))
        ok, res = pcall(docker.client.remove_container, docker.client, {id = id})
        ngx.log(ngx.ERR, string.format("response from remove_container: %s", p.write(res.response)))
        -- ignore the response and retry the create, and if it still errors, let that propagate
        ok, res = pcall(docker.client.create_container, docker.client, {payload = conf})
    end
    if ok then
        assert(res.status == 201, "Failed to create container: "..json.encode(res.body))
        local id = res.body.Id
        res = docker.client:start_container{id = id}
        assert(res.status == 204, "Failed to start container "..id.." : "..json.encode(res.body))
        -- get back the container info to pull out the port mapping
        res = docker.client:inspect_container{id=id}
        assert(res.status == 200, "Could not inspect new container: "..id)
        local ports = res.body.NetworkSettings.Ports
        local ip = res.body.NetworkSettings.IPAddress
        local ThePort = string.format("%d/tcp", M.private_port)
        assert(ports[ThePort] ~= nil, string.format("Port binding for port %s not found!", ThePort))
        local ip_port = string.format("%s:%d", ip, M.private_port)
        -- info = { state, ip:port, session, last_time, last_ip }
        local info = {"queued", ip_port, "*", os.time(), ip} -- default values except for ip_port
        return id, info
    else
        ngx.log(ngx.ERR, "Failed to create container: "..p.write(res))
        return nil, res
    end
end

--
--    Kill and remove an existing docker container.
--
local function remove_notebook(id)
   ngx.log(ngx.INFO, "Removing container: "..id)
   local res = docker.client:stop_container{id = id}
   --ngx.log(ngx.INFO,string.format("response from stop_container: %d : %s",res.status,res.body))
   assert(res.status == 204, "Failed to stop container: "..json.encode(res.body))
   res = docker.client:remove_container{id = id}
   --ngx.log(ngx.INFO,string.format("response from remove_container: %d : %s",res.status,res.body))
   assert(res.status == 204, "Failed to remove container "..id.." : "..json.encode(res.body))
   return true
end

M.docker = docker
M.split = split
M.get_notebooks = get_notebooks
M.launch_notebook = launch_notebook
M.remove_notebook = remove_notebook
return M
