local docker = {}
local Spore = require('Spore')
docker.client = Spore.new_from_string [[{ "name" : "docker remote api",
					  "base_url" : 'http://127.0.0.1:65000',
					  "version" : '0.1.0',
					  "expected_status" : [ 200 ],
					  "formats" : "json",
					  "methods" : {
					     "list_containers" : { 
						"path" : "/containers/json",
						"method" : "GET",
						"optional_params" : [
						   'all',
						   'limit',
						   'since',
						   'before',
						   'size']
					     },
					     "inspect_container" : { 
						"path" : "/containers/:id/json",
						"method" : "GET",
						"required_params" : [
						   "id"
						],
						"optional_params" : [
						   'all',
						   'limit',
						   'since',
						   'before',
						   'size']
					     },
					     "list_images" : { 
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
						"optional_params" : [
						   'all',
						   'limit',
						   'since',
						   'before',
						   'size']
					     }
					  }
				       }]]

local pretty = require('pl.pretty')
local res = docker.client:list_containers{ all = 1 }
pretty.dump(res)
print "\n=========\n"
res = docker.client:list_images{ all = 1 }
pretty.dump(res)
return docker
