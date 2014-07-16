Last updated: Bill Riehl <wjriehl@lbl.gov> 7/15/2014

Deploying the Narrative on a fresh developer’s server instance with Docker provisioning
=======================================================================================
Bill Riehl <wjriehl@lbl.gov>  
Keith Keller <kkeller@lbl.gov>  
(based on a document written by Steve Chan, emeritus)

**The Narrative Interface has 3 main components:**  

1.  A front end with Nginx 1.3.13+ and some supporting Lua libraries. These implement a dynamic proxy and the provisioning logic that spins up/down docker containers.
2.  A server running Docker to host the containers
3.  A Docker container for the actual image.

This document will walk through the server building process. For this developer’s tutorial, we built a local VM using Vagrant through Virtualbox. The base Vagrant image we used was hashicorp/precise64, which provides a clean Ubuntu 12.04 LTS image.  
<http://www.vagrantup.com>

After installing Vagrant and Virtualbox, run  
```
> vagrant init hashicorp/precise64
```

This will create the base Vagrantfile. You can modify it to use more memory by adding this block:
```
config.vm.provider "virtualbox" do |v|  
    v.memory = 1024  
    v.cpus = 2  
end  
config.vm.network :forwarded_port, guest: 80, host: 8080  
config.vm.network :forwarded_port, guest: 443, host: 8443  
```

Once you’re done here, run:
```
> vagrant up
> vagrant ssh
```
and you’re in. This might take a little Virtualbox configuring that this walkthrough doesn't cover.

Now that you’re in, you might want a couple tools that don’t come default:
```
# sync bootstrap, ui-common, and narrative repos
> apt-get update
> apt-get install vim git
```

Bring in the Narrative and Bootstrap repos
```
> mkdir kb_narr
> cd kb_narr
> git clone http://github.com/kbase/narrative
> git clone http://github.com/kbase/bootstrap
> git clone http://github.com/kbase/ui-common
```

Set up the Nginx environment
===
This uses Nginx with the embedded Lua module from the nginx-extras package, described here: <http://wiki.nginx.org/Install>.
```
# these next two should add the nginx repo properly
> apt-get install python-software-properties
> add-apt-repository ppa:nginx/stable
> apt-get update
> apt-get install nginx-extras
# verify this worked before going on
```

Next, install the Lua dependencies. The list of this is in the narrative repo’s docker directory.  
```
> bash /path/to/narrative/docker/lua-dependencies.txt
```

Now we can migrate the Lua libraries we use to a more permanent location:  
```
> mkdir -p /kb/deployment/services/narrative/docker
> cd /path/to/narrative/docker
> rsync -avP resty *.lua /kb/deployment/services/narrative/docker/
```

Use the Nginx config file in /path/to/narrative/src/nginx/default to sort out Nginx configuration.
There’s a little tweaking that needs to happen here - the lua_package_path line should be updated to point to the Lua files
```
# change lua path (all one line)
> lua_package_path "/kb/deployment/services/narrative/docker/?;/kb/deployment/services/narrative/docker/?.lua;;";
```

Install and set up Docker
===
This includes a few instructions, but some more details are available here:
<http://docs.docker.io/en/latest/installation/ubuntulinux/>

Docker currently uses (at minimum) the 3.8 Linux kernel, so you’ll need to install that and restart.
```
> apt-get update
> apt-get install linux-image-generic-lts-raring linux-headers-generic-lts-raring
> shutdown -r now
```

Install Docker
```
> apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
> sh -c "echo deb https://get.docker.io/ubuntu docker main > /etc/apt/sources.list.d/docker.list"
> apt-get update
> apt-get install lxc-docker
```

Set up groups so docker and www-data can play nice with each other (so we can get proxied external access to the deployed containers that’ll be running the Narrative).  
```
# add docker to www-data, and add www-data to docker
> vigr
> service docker stop
> service nginx stop
> service docker start
> service nginx start
```

The containers that run Narratives are also based on the Ubuntu 12.04 LTS image, so we need to pull that with Docker to make it available.
```
> docker pull ubuntu:12.04
```

The Dockerfile that builds the Narrative can be found in /path/to/narrative/docker/Dockerfile. This is essentially a build script that constructs the Docker container image. To do so, it needs to be placed on directory above the narrative, along with a couple other dependency files (also in /path/to/narrative/docker):
```
> cd /path/to/narrative/..
> cp narrative/docker/Dockerfile narrative/docker/r-packages.R narrative/docker/sources.list .
```

Build the Narrative Docker container
===
Now we can build our Docker container.  
The Lua provisioning library (currently) looks for containers named sychan/narrative:latest, so that’s the name we’ll give it.

Eventually, it might be nice to have an external container repository that manages this, and every night or so, we just pull the most recent container and deploy it.
```
> cd /path/to/narrative/..
> docker build -q -t sychan/narrative .
```

This will take around half an hour to pull, compile, and deploy the various components. So go get a cup of coffee or take a nap at this point.

A quick breakdown of this function:
**“docker build .”** translates to “Build a new Docker container from the Dockerfile in the present working directory.”

**-q** : this directive is for “quiet” mode. The current container builds generate lots of output and reach some internal docker limit of how much log output can be stored. A symptom of this problem is that the build will halt with the error "invalid byte in chunk length".

**-t &lt;username&gt;/&lt;container name&gt;** : this tags the new container with a given name, instead of just a UUID. You can give it an additional :tag (e.g. sychan/narrative:tag) on the end, otherwise it’ll tag it as “latest”. When a new version is made, the current “latest” tagged container will give up its name and fall back on a UUID.

To keep track of older container when a new one is produced, we create a new tag with a datestamp
```
> docker tag sychan/narrative:latest sychan/narrative:YYYYMMDD
```

This creates a whole slew of intermediate container layers that all get built on top of each other. Once the final container is built, these are superfluous and should be deleted. You can see which ones are active or exited with:
```
> docker ps -a
CONTAINER ID        IMAGE               COMMAND                CREATED             STATUS              PORTS               NAMES
1ac7e90b1fd1        307229146f62        /bin/bash /kb/deploy   16 minutes ago      Exit 0                                  angry_hawking            
fd422e25764d        c5fed90988a7        /bin/sh -c chown -R    16 minutes ago      Exit 0                                  dreamy_brattain          
bfbbc43c4891        b85d26996925        /bin/bash /kb/deploy   16 minutes ago      Exit 0                                  agitated_galileo         
b0777eb1a986        0fdb9a76b30b        /bin/sh -c #(nop) CM   16 minutes ago      Exit 0                                  furious_poincare         
46c6d2d7d4d0        f8c50afbfbe4        /bin/sh -c cd /tmp/n   16 minutes ago      Exit 0                                  angry_archimedes         
```
...etc

All of those with status “Exit 0” can be safely deleted. This command will find them and remove them, saving quite a bit of disk space.
```
> docker ps -a | grep Exit | awk '{print $1}' | xargs docker rm
```

Finally, deploy the rest of the functional site (this is external to the Narrative apparatus, but should be on the same system, so it can handle login, etc.)
```
> cd ~/ui-common
> ./deployFunctionalSite.sh
```

That’s it! Your Narrative provisioning system is ready to go. You might need to kick the Nginx service so that it points to the right containers.

For running things locally from your Vagrant VM, there’s an easy SSH tunneling trick you can do:
add this line to your /etc/hosts file
```
127.0.0.1 localhost localhost.kbase.us
```

Then connect to your Vagrant instance at:  
<http://localhost.kbase.us:8080>

This will give you a login prompt, and should act like the rest of the functional site. Most narratives at this stage point to narrative.kbase.us, however, so once you’re logged in, go to:  
<http://localhost.kbase.us:8080/narrative>

Some tips for interacting with Docker and the Narrative
===
**Checking Docker logs**  
Different logs can be checked in a couple ways.  
`/var/log/upstart/docker.log`  
contains the startup and shutdown commands for the logs.

`/var/log/nginx/access.log`  
and  
`/var/log/nginx/error.log`  
contain the usual Nginx info, but they’re handy for debugging Lua problems.

To look into a container for potential Narrative problems, run:
```
> docker ps
```

This shows a list of all running containers along with the username of the person running it (sorry for formatting)
```
CONTAINER ID        IMAGE                       COMMAND                CREATED             STATUS              PORTS                     NAMES
972f371bc2fc        sychan/narrative:20140624   /bin/bash /kb/deploy   3 minutes ago       Up 3 minutes        0.0.0.0:49153->8888/tcp   wjriehl  
```
You can use the container ID to look at the container’s stdout and stderr with the command
```
> docker logs 972f371bc2fc
```
(or other ID)  

That’s a fragment of a longer UUID. If that’s not unique in your list, you can get the whole thing with
```
> docker ps --no-trunc
```

**Stopping and removing a running container**  
A container will remain up as long as a user maintains a websocket connection to their Narrative. Once the session is closed for more than a few minutes, a reaping daemon will come through and remove that container. 

There have been a few cases where this didn’t happen properly and users don’t see updated changes. A container can be manually shut down and removed with this command:
```
docker stop <container UUID>
docker rm <container UUID>
```

Though this might cause inconsistencies in the Nginx/Lua proxy cache.