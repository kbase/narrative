
## Deploying with Docker

This document schedules how to deploy the Narrative on a fresh developer’s server instance with Docker provisioning

Last updated: Dan Gunter <dkgunter@lbl.gov> 7/18/2014

Bill Riehl <wjriehl@lbl.gov> 7/15/2014
Keith Keller <kkeller@lbl.gov>
Dan Gunter <dkgunter@lbl.gov>
(based on a document written by Steve Chan, emeritus)

**The Narrative Interface has 3 main components:**

1.  A front end with Nginx 1.3.13+ and some supporting Lua libraries. These implement a dynamic proxy and the provisioning logic that spins up/down docker containers.
2.  A server running Docker to host the containers
3.  A Docker container for the actual image.

This document will walk through the server building process. For this developer’s tutorial, we built a local VM using Vagrant through Virtualbox. The base Vagrant image we used was hashicorp/precise64, which provides a clean Ubuntu 12.04 LTS image.  
<http://www.vagrantup.com>

After installing Vagrant and Virtualbox, run  

    vagrant init hashicorp/trusty64

This will create the base Vagrantfile. You can modify it to use more memory by adding this block
before the final 'end' in the `Vagrantfile` that was created by the previous command.:

    # vi Vagrantfile
    # :set paste
    # go to bottom of file, before 'end' and paste:
    config.vm.provider "virtualbox" do |v|  
        v.memory = 1024  
        v.cpus = 2  
    end  
    config.vm.network :forwarded_port, guest: 80, host: 8080  
    config.vm.network :forwarded_port, guest: 443, host: 8443  


Once you’re done editing, save your work and start Vagrant:

    vagrant up
    vagrant ssh

and you’re in. This might take a little Virtualbox configuring that this walkthrough doesn't cover.

Now that you’re in, you might want to add a couple tools that don’t come by default:

    sudo su - root
    apt-get update
    apt-get install -y vim git
    exit  # back to regular user

Next, bring in the Narrative and Bootstrap repos (as yourself):

    mkdir kb_narr
    cd kb_narr
    git clone http://github.com/kbase/narrative
    git clone http://github.com/kbase/bootstrap
    git clone http://github.com/kbase/ui-common

# Set up the Nginx environment

This uses Nginx with the embedded Lua module from the nginx-extras package, described here: <http://wiki.nginx.org/Install>.


## Install Nginx

    sudo su - root
    # these next two should add the nginx repo properly
    apt-get install-y  python-software-properties
    add-apt-repository ppa:nginx/stable
    apt-get update
    apt-get install -y nginx-extras
    # verify this worked before going on
    exit

## Install the Lua dependencies.

The list of these is in the narrative repo’s docker directory.

    # assuming you are (still) in the 'kb_narr' directory
    sudo bash ./narrative/docker/lua-dependencies.txt
    # answer "y" when prompted

Now we can migrate the Lua libraries we use to a more permanent location:  

    sudo mkdir -p /kb/deployment/services/narrative/docker
    cd narrative/docker
    sudo rsync -avP resty *.lua /kb/deployment/services/narrative/docker/
    cd ../.. # back to kbnarr dir

## Setup Nginx config

Use the Nginx config file in `narrative/src/nginx/default` to sort out Nginx configuration.
There’s a little tweaking that needs to happen here - the `lua_package_path` line should be updated to point to the Lua files:

    # edit the file
    vi narrative/src/nginx/default
    
    # change lua path (all one line)
    lua_package_path "/kb/deployment/services/narrative/docker/?;/kb/deployment/services/narrative/docker/?.lua;;";

## Install npm and grunt

One last step before getting Docker and the Narrative installed is the installation of a couple of Javascript packages. These are used by the build script to concatenate and minify the Narrative front end extensions to the IPython Notebook

    sudo apt-get nodejs           # needed on Ubuntu 14.04/trusty systems
    sudo apt-get nodejs-legacy    # needed on Ubuntu 14.04/trusty systems
    sudo apt-get install npm
    sudo npm install -g grunt-cli

# Install and set up Docker

This includes a few instructions, but some more details are available here:
<http://docs.docker.io/en/latest/installation/ubuntulinux/>

## Upgrade Linux kernel

Docker currently uses (at minimum) the 3.8 Linux kernel, so if your host is running an older
kernel (e.g., Ubuntu 12.04), you’ll need to install the new kernel and restart.

    sudo su - root
    apt-get update
    apt-get install -y linux-image-generic-lts-raring linux-headers-generic-lts-raring
    shutdown -r now
    # now, log back in
    vagrant ssh
    cd kb_narr

## Install Docker

First setup APT to use the proper repository, then refresh the package cache and install the `lxc-docker` package from the newly-added location.

    sudo su - root # need to do all this as root
    apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 36A1D7869245C8950F966E92D8576A8BA88D21E9
    sh -c "echo deb https://get.docker.io/ubuntu docker main > /etc/apt/sources.list.d/docker.list"
    apt-get update
    apt-get install -y lxc-docker
    # stay root for next steps..

Set up groups so docker and www-data can play nice with each other (so we can get proxied external access to the deployed containers that’ll be running the Narrative).  

    usermod -G docker www-data

Then stop and restart docker and Nginx.

    service docker stop
    service nginx stop
    service docker start
    service nginx start


Next, run buildNarrativeContainer.sh to build the base Docker container for narrative instances.

    cd ~/kb_narr/narrative
    ./buildNarrativeContainer.sh

This will take around half an hour to pull, compile, and deploy the various components. So go get a cup of coffee or take a nap at this point.

A quick breakdown of this function:

* `docker build`: translates to “Build a new Docker container from the Dockerfile in the present working directory.”
* `-q`: this directive is for “quiet” mode. The current container builds generate lots of output and reach some internal docker limit of how much log output can be stored. A symptom of this problem is that the build will halt with the error "invalid byte in chunk length".
* `-t <username>/<container name>`: this tags the new container with a given name, instead of just a UUID. You can give it an additional :tag (e.g. kbase/narrative:tag) on the end, otherwise it’ll tag it as “latest”. When a new version is made, the current “latest” tagged container will give up its name and fall back on a UUID.

To keep track of older container when a new one is produced, we create a new tag with a datestamp

    sudo docker tag kbase/narrative:latest kbase/narrative:`date +%Y%m%d`

### Intermediate containers

In previous incarnations of this script this would create a whole slew of intermediate container layers that all get built on top of each other. Currently, the intermediate containers are deleted as we go. Still, it may be useful to know how to deal with this situation. 

You can see which containers are active or exited with:

    sudo docker ps -a
    
This will produce output like the following:

    CONTAINER ID        IMAGE               COMMAND                CREATED             STATUS              PORTS               NAMES
    1ac7e90b1fd1        307229146f62        /bin/bash /kb/deploy   16 minutes ago      Exit 0                                  angry_hawking            
    fd422e25764d        c5fed90988a7        /bin/sh -c chown -R    16 minutes ago      Exit 0                                  dreamy_brattain          
    bfbbc43c4891        b85d26996925        /bin/bash /kb/deploy   16 minutes ago      Exit 0                                  agitated_galileo         
    b0777eb1a986        0fdb9a76b30b        /bin/sh -c #(nop) CM   16 minutes ago      Exit 0                                  furious_poincare         
    46c6d2d7d4d0        f8c50afbfbe4        /bin/sh -c cd /tmp/n   16 minutes ago      Exit 0                                  angry_archimedes         
    ...

All of those with status “Exit 0” can be safely deleted. This command will find them and remove them, saving quite a bit of disk space:

    docker ps -a | grep Exit | awk '{print $1}' | xargs docker rm

## Deploy KBase Functional Site

Finally, deploy the rest of the functional site (this is external to the Narrative apparatus, but should be on the same system, so it can handle login, etc.)

    cd ~/kb_narr/ui-common
    sudo ./deployFunctionalSite.sh

# Using your deployment

Now your Narrative provisioning system is ready to go. You might need to kick the Nginx service, e.g.:

    sudo nginx -s reload
    
so that it points to the right containers.

## Running

For running things locally from your Vagrant VM, there’s an easy SSH tunneling trick you can do:
add this line to your `/etc/hosts` file:

    127.0.0.1 localhost localhost.kbase.us

Then connect to your Vagrant instance at:  
<http://localhost.kbase.us:8080>

This will give you a login prompt, and should act like the rest of the functional site. Most narratives at this stage point to narrative.kbase.us, however, so once you’re logged in, go to:  
<http://localhost.kbase.us:8080/narrative>

## Tips and tricks

Some tips for interacting with Docker and the Narrative.

### Troubleshooting

Different logs can be checked in a couple ways.  
`/var/log/upstart/docker.log`  
contains the startup and shutdown commands for the logs.
`/var/log/nginx/access.log`  
and  
`/var/log/nginx/error.log`  
contain the usual Nginx info, but they’re handy for debugging Lua problems.

To look into a container for potential Narrative problems, run:

    docker ps

This shows a list of all running containers along with the username of the person running it (sorry for formatting)

    CONTAINER ID        IMAGE                       COMMAND                CREATED             STATUS              PORTS                     NAMES
    972f371bc2fc        kbase/narrative:20140624   /bin/bash /kb/deploy   3 minutes ago       Up 3 minutes        0.0.0.0:49153->8888/tcp   wjriehl  

You can use the container ID to look at the container’s stdout and stderr with the command

    docker logs 972f371bc2fc

(or other ID)  

That’s a fragment of a longer UUID. If that’s not unique in your list, you can get the whole thing with

    docker ps --no-trunc

### Stopping and removing a running container

A container will remain up as long as a user maintains a websocket connection to their Narrative. Once the session is closed for more than a few minutes, a reaping daemon will come through and remove that container. 

There have been a few cases where this didn’t happen properly and users don’t see updated changes. A container can be manually shut down and removed with this command:

    docker stop <container UUID>
    docker rm <container UUID>

Though this might cause inconsistencies in the Nginx/Lua proxy cache.
