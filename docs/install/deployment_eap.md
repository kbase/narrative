
## Deploying with Docker

This document schedules how to deploy the Narrative on a developer workstation in a Vagrant-managed virtual machine, using Docker provisioning.

Last updated: Erik Pearson <eapearson@lbl.gov> 08/30/2016

Erik Pearson <eapearson@lbl.gov>
Bill Riehl <wjriehl@lbl.gov>
Keith Keller <kkeller@lbl.gov>
Dan Gunter <dkgunter@lbl.gov>
(based on a document written by Steve Chan, emeritus)

**The Narrative Interface has 3 main components:**

1.  A front end with Nginx 1.10.1 or above with Lua extensions and KBase Lua libraries. These implement a dynamic proxy and the provisioning logic that spins up/down docker containers.
2.  A server running Docker to host the containers

This document describes the manual procedures for creating a VM with the prerequisite packages, configuration of the VM through Vagrant to support an machine which can build and run the Narrative, and building and deployment of the Narrative and kbase-ui.

## Install VM and OS

### Install VM with Vagrant

After installing Vagrant and Virtualbox, run  

    vagrant init ubuntu/trusty64

This will create the base Vagrantfile set up to install Ubuntu Trusty (14.04). 

On top of this configuration we need to tweak the VM to utilize more memory (for building the Narrative later) and developer-friendly network interface.

Please the following towards the end of the Vagrantfile, before the final "end".

```
config.vm.provider "virtualbox" do |v|  
    v.memory = 2048  
    v.cpus = 2  
    v.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]

end  
config.vm.network "private_network", type: "dhcp"
```

Once you’re done editing, save your work and start Vagrant:

    vagrant up
    vagrant ssh

### Install primary OS dependencies


During the OS configuration, it is easiest just to move into superuser mode:

    sudo su

Get the system updated and select repositories for more up to date versions of primary dependencies (nginx, nodejs):

    apt-get install -y python-software-properties
    add-apt-repository ppa:nginx/stable
    apt-get update
    apt-get upgrade -y
    apt-get dist-upgrade -y
    apt-get autoremove -y
    apt-get install -y git nginx-extras

### Install and set up nodejs

https://github.com/nodesource/distributions

    curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
    sudo apt-get install -y nodejs


### Install and set up Docker

The [Docker installation page for Ubuntu](https://www.docker.com/products/docker) include detailed instructions for how to install Docker on various operating systems. For the OS used in this tutorial - Ubuntu 14.04 - follow the instructions given at that link. That will walk you through everything you need, just follow the Trusty/14.04 steps.

#### Ubuntu 14.04

The instructions, condensed from the ubuntu installation page:

https://docs.docker.com/engine/installation/linux/ubuntulinux/

    apt-get install -y linux-image-extra-$(uname -r) linux-image-extra-virtual 
    apt-key adv --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 58118E89F3A912897C070ADBF76221572C52609D
    echo "deb https://apt.dockerproject.org/repo ubuntu-trusty main" > /etc/apt/sources.list.d/docker.list 
    apt-get update
    apt-get -y install docker-engine
    usermod -G docker www-data
    service docker start
    docker run hello-world

This accomplishes the following:

- Update Linux to provide the aufs file system for Docker.
- Install the keys and Docker package repository
- Install docker
- Add docker to the standard web-server group, so they can play nice with each other (so we can get proxied external access to the deployed containers that’ll be running the Narrative).  

### Install npm and grunt

One last step before getting Docker and the Narrative installed is the installation of a couple of Javascript packages. These are used by the build script to concatenate and minify the Narrative front end extensions to the IPython Notebook

    npm install -g grunt-cli

Okay, that is it for a while as superuser, go back to your mortal self, or rather the vagrant user.

    exit

## Set up the narrative

You should be in the vagrant user directory, which is file. We'll create a directory in which to work here. It will be named kb_narr just as a documentation convention -- the name does not matter.

    mkdir kb_narr
    cd kb_narr

We'll be working with some branch of the narrative and kbase-ui repos. For development or testing work, this may be develop, staging, or master (in which case you can leave off the -b option).

    git clone -b develop http://github.com/kbase/narrative
    git clone -b develop http://github.com/kbase/kbase-ui


## Install the Lua dependencies.

The lua dependencies are stored in a separate file and invoked as a shell script.

> I don't see why these should not be in the normal OS preparation section. In fact, we should probably have a per-OS-per-version installation shell script.

We'll have super powers for a while

    sudo su

Run the Lua dependencies installer script:

    sh ./narrative/docker/lua-dependencies.txt

Now copy the Lua libraries we use the deployment location. This is actually all of the Narrative that is deployed, in the normal sense (the rest is contained within the Docker image created later.)

    mkdir -p /kb/deployment/services/narrative/docker
    cd narrative/docker
    rsync -avP resty *.lua /kb/deployment/services/narrative/docker/
    cd ../..

## Setup Nginx config

nginx serves as the controller for the narrative, and the heart of that control is an nginx config file.

We need to copy that file into the nginx configuration, replacing the default file, and make a few tweaks to integrate the current installation of the Narrative and kbase-ui.

> It seems to me that many of these tweaks could just be integrated into the config file. Is there a reason they aren't?

    rm /etc/nginx/sites-available/default
    cp narrative/src/nginx/default /etc/nginx/sites-available/kbase.conf
    ln -s /etc/nginx/sites-available/kbase.conf /etc/nginx/sites-enabled/kbase.conf

edit the file

    vi /etc/nginx/sites-available/kbase.conf
    
 change the Lua package path path (all one line)

    lua_package_path "/kb/deployment/services/narrative/docker/?;/kb/deployment/services/narrative/docker/?.lua;;";

Make kbase-ui the default document root (all narrative access is on the /narrative path which is set up in the nginx config).

    root /kb/deployment/services/kbase-ui;

You'll need to make the the docker defaults sane to prevent your machine from thrashing:

```
provision_count = 2
container_max = 5
server_name localhost localhost.kbase.us local-dev.kbase.us;
```

Add we really should operate in secure mode. (And part of the Narrative installation will attempt to contact the narrative server on a secure port, so we do need this.)

Add this in the server section at the top:

```
listen 443 ssl;
ssl_certificate /kb/deployment/ssl/server.crt;
ssl_certificate_key /kb/deployment/ssl/server.key.insecure;
ssl_protocols TLSv1 TLSv1.1 TLSv1.2; 
```

### Install the ssl certs

We'll use self signed certs -- if you need to use official kbase certs (wildcard) you can just use those.

Note -- when creating the initial key you need to provide a pass key. This will be removed on the line which caretes the insecure key.

We are still operating in superuser mode.

```
mkdir ssl
cd ssl
openssl genrsa -des3 -out server.key 2048
openssl req -new -key server.key -out server.csr
```

Enter, approximately:

```
ountry Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:California
Locality Name (eg, city) []:Berkeley
Organization Name (eg, company) [Internet Widgits Pty Ltd]:KBase
Organizational Unit Name (eg, section) []:web dev
Common Name (e.g. server FQDN or YOUR name) []:local-dev.kbase.us
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

then continue

```
openssl rsa -in server.key -out server.key.insecure
sudo openssl x509 -req -days 365 -in server.csr -signkey server.key.insecure -out server.crt
rm server.key
rm server.csr
cd ..
mv ssl /kb/deployment
```

### Let's Encrypt

```
wget https://dl.eff.org/certbot-auto
chmod a+x certbot-auto
```

create first ...

```

```






## install kbase-ui

We don't need to be useruser, but might as well stay so since we will need it shortly.

```
cd /vagrant/kbase-ui
make init
make build config=local-dev
```

back to superuser for a while...

```
sudo su
sudo ./deploybuild.sh
```

> Er, for the time being -- sudo sh ./deploybuild.sh.sh

> Note: do not need this step if you are mapping your local kbase-ui directly into /kb/deployment/services/kbase-ui


## ensure the nginx is configured correctly

```
nginx -t
```

# restart services

```
service docker restart
service nginx restart
```

## Build the Narrative Docker images

Once Docker is installed, you can now build the Narrative images, using the build_narrative_container.sh script.

    cd kb_narr/narrative
    ./scripts/build_narrative_container.sh

This will take around 30-40 minutes to pull, compile, and deploy the three images. These are:

- kbase/narrprereq - the "pre required" system level requirements, including several Ubuntu, Python, and R packages.
- kbase/narrbase - this layer has the versions of the Jupyter Notebook and IPywidgets (now its own component) we use for the Narrative.
- kbase/narrative - the narrative image itself.

These three images are built separately for easier management. Since the Narrative code will likely be changing the most often, it is built last. The base dependencies are least likely to change (and take the longest to build), so we try to minimize building them.

A quick breakdown of the Docker build process function:

- `docker build`:
    translates to “Build a new Docker container from the Dockerfile in the present working directory.”

- `-q`:
    this directive is for “quiet” mode. The current container builds generate lots of output and reach some internal docker limit of how much log output can be stored. A symptom of this problem is that the build will halt with the error "invalid byte in chunk length".

- `-t <username>/<container name>`:
    this tags the new container with a given name, instead of just a hash id. You can give it an additional :tag (e.g. kbase/narrative:tag) on the end, otherwise it’ll tag it as “latest”. When a new version is made, the current “latest” tagged container will give up its name and fall back on a hash.

To keep track of older containers when a new one is produced, we create a new tag with a datestamp

    sudo docker tag kbase/narrative:latest kbase/narrative:`date +%Y%m%d`

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

The `docker_cleanup.sh` script in the narrative/scripts directory will take care of this for you.

## set up local host mapping

[ do this elsewhere ]

### get the ip address

From within the VM, determine the IP address:

    ifconfig

### edit /etc/hosts

Open a local (host) terminal window and edit the `/etc/hosts` file:

    sudo vi /etc/hosts

add the line

    123.456.789.012 local-dev.kbase.us

where 123... is the ip address of the VM.

## Troubleshooting

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

That’s a fragment of a longer id. If that’s not unique in your list, you can get the whole thing with

    docker ps --no-trunc

### Stopping and removing a running container

A container will remain up as long as a user maintains a websocket connection to their Narrative. Once the session is closed for more than a few minutes, a reaping daemon will come through and remove that container. 

There have been a few cases where this didn’t happen properly and users don’t see updated changes. A container can be manually shut down and removed with this command:

    docker stop <container id>
    docker rm <container id>

Though this might cause inconsistencies in the Nginx/Lua proxy cache.


## Zap Docker Artifacts
```
#!/bin/bash
# Stop all running containers
docker stop $(docker ps -q)
# Delete all containers
docker rm $(docker ps -a -q)
# Delete all images
docker rmi $(docker images -q)
```

## Install Specific Docker



## Remove Existing DOcker and REplace

```
apt-get remove docker-engine
apt-cache showpkg docker-engine
apt-cache install docker-engine=<pick one from the list>
```

## hacking on lua?

Edit locally.

Resync with the deployment

```
cd /vagrant/narrative/docker
rsync -avP resty *.lua /kb/deployment/services/narrative/docker/
```

reload nginx

```
service nginx reload
```