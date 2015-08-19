#!/bin/bash

# nuke all exited, stale containers
docker ps -a | grep Exit | awk '{print $1}' | xargs docker rm

# nuke all dangling images that aren't tagged and aren't components of tagged images
docker rmi $(sudo docker images -f "dangling=true" -q)
