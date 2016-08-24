-- author: Steve Chan sychan@lbl.gov
--
-- Copyright 2013 The Regents of the University of California,
--                Lawrence Berkeley National Laboratory
--                United States Department of Energy
--          	 The DOE Systems Biology Knowledgebase (KBase)
-- Made available under the KBase Open Source License
--

local M = {}
local Spore = require('Spore')
local json = require('json')

-- For creating new containers the config object must contain certain fields
-- Example config contains:
local function config()
   local hc = { Binds={}}
   local config = { Hostname = "",
		    User = "nobody",
		    Memory = 0,
		    MemorySwap = 0,
		    AttachStdin = false,
		    AttachStdout = false,
		    AttachStderr = false,
		    PortSpecs = json.util.null,
		    Privileged = false,
		    Tty = false,
		    OpenStdin = false,
		    StdinOnce = false,
		    Env = json.util.null,
		    Cmd = {'/bin/bash'},
		    Dns = json.util.null,
		    Image = "base",
		    HostConfig=hc,
		    Volumes = {},
		    VolumesFrom = json.util.null,
		    WorkingDir = ""
		 }
   config.Volumes['/dev/log'] = {}
   return config
end

M.config = config

local client = Spore.new_from_string [[{ "name" : "docker remote api",
					  "base_url" : 'http://127.0.0.1:65000',
					  "version" : '0.1.0',
					  "expected_status" : [
					     200,
					     201,
					     204
					  ],
					  "formats" : ["json"],
					  "methods" : {
					     "containers" : { 
						"path" : "/containers/json",
						"method" : "GET",
						"optional_params" : [
						   'all',
						   'limit',
						   'since',
						   'before',
						   'size'
						]
					     },
					     "create_container" : { 
						"path" : "/containers/create",
						"method" : "POST",
						"optional_params" : [
						   'name'],
						"required_payload" : true,
					     },
					     "inspect_container" : { 
						"path" : "/containers/:id/json",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
					     },
					     "fs_changes_container" : { 
						"path" : "/containers/:id/changes",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
					     },
					     "start_container" : { 
						"path" : "/containers/:id/start",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
					     },
					     "stop_container" : { 
						"path" : "/containers/:id/stop",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
					     },
					     "restart_container" : { 
						"path" : "/containers/:id/restart",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
					     },
					     "kill" : { 
						"path" : "/containers/:id/kill",
						"method" : "POST",
						"required_params" : [
						   "id"
						],
					     },
					     "remove_container" : { 
						"path" : "/containers/:id",
						"method" : "DELETE",
						"required_params" : [
						   "id"
						],
					     },
					     "top" : { 
						"path" : "/containers/:id/top",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
						"optional_params" : [
						   'ps_args',
						   ]
					     },
					     "images" : { 
						"path" : "/images/json",
						"method" : "GET",
						"optional_params" : [
						   'all',
						   'limit',
						   'since',
						   'before',
						   'size']
					     },
					     "inspect_image" : { 
						"path" : "/images/:name/json",
						"method" : "GET",
						"required_params" : [
						   "name"
						],
					     },
					     "history_image" : { 
						"path" : "/images/:name/history",
						"method" : "GET",
						"required_params" : [
						   "name"
						],
					     },
					     "info" : { 
						"path" : "/info",
						"method" : "GET",
					     },
					     "version" : { 
						"path" : "/info",
						"method" : "GET",
					     },
					     "search_images" : { 
						"path" : "/images/search",
						"method" : "GET",
						"required_params" : [
						   "term"
						],
					     },
					  }
				       }]]
client:enable('Format.JSON')
M.client = client
--[[
local pretty = require('pl.pretty')
local res = client:list_containers{ all = 1 }
pretty.dump(res)
print "\n=========\n"
res = client:list_images{ all = 1 }
pretty.dump(res)
--]]

return M
