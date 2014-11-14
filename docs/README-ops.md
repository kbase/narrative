   The narrative has 3 main components:

1. A front end that uses Nginx 1.3.13+, and some supporting Lua libraries to implement a dynamic proxy and the provisioning logic that spins up/down docker containers

    1. I’m using nginx with the embedded Lua module from the **nginx-extras** package. You can get this by using the NGINX Stable PPA repo as described here [http://wiki.nginx.org/Install](http://wiki.nginx.org/Install) then apt-get install nginx-extras (don’t install nginx, the packages may conflict)

    2. The lua packages are installed using normal Lua installer tools, and the list of lua modules is here: [https](https://git.kbase.us/narrative.git/blob/HEAD:/docker/lua-dependencies.txt)[://git.kbase.us/narrative.git/blob/HEAD:/docker/lua-dependencies.txt](https://git.kbase.us/narrative.git/blob/HEAD:/docker/lua-dependencies.txt)( using ssh, the git repo is at ssh://kbase@[git.kbase.us/narrative.git](http://git.kbase.us/narrative.git) )

    3. The lua files are currently here, but I can move them around some and get the makefile into shape to put them in /kb/deployment/service/… [https://git.kbase.us/narrative.git/tree/HEAD:/docker](https://git.kbase.us/narrative.git/tree/HEAD:/docker)

    4. There is a sample nginx config file here - you would obviously tweak it, or just templatize it for production use - it goes in /etc/nginx/sites-available/default:[https://git.kbase.us/narrative.git/blob/HEAD:/src/nginx/default](https://git.kbase.us/narrative.git/blob/HEAD:/src/nginx/default)

    5. The nginx config file above makes reference to several lua files, these files are currently deployed in in /kb/deployment/services/narrative/docker/ and the nginx config file needs to have the lua path set to point there (see the lua_package_path directive)

    6. The front end has web listener bound to localhost that can be used to monitor the proxy state.This URL returns the mapping of sessions to IP:ports, status of sessions, displaying the last client IP, last time activity was seen and whether it is marked for reaping:http://localhost/proxy_map

2. A server that runs docker and hosts the containers.

    7. The docker packages are installed from Docker Ubuntu package repo that you can configure using these instructions: [http://docs.docker.io/en/latest/installation/ubuntulinux/](http://docs.docker.io/en/latest/installation/ubuntulinux/)

    8. The host image needs to be running at least a 3.8+ kernel, you can grab the linux-image-extra-`uname -r` package as described in the link above. I am pretty sure that apt-get just pulls it from the normal Ubuntu repos

    9. Some other UFW tweaks as necessary in the link above.

    10. Setup an nginx proxy as a network listener to proxy requests from the network to the unix domain socket that the docker service listens on. Alternatively you can just tell docker to listen directly on a network interface, but I used the nginx proxy since that gives me more control over securing the listener

    11. The docker service keeps it logs in /var/log/upstart/docker.log, this is a good reference to see when containers were started, stopped and deleted.

    12. Once the base docker environment is setup, we need to pull down the Ubuntu 12.04 LTS image and make that available in the local docker environment by running this command from the command line:docker pull ubuntu:12.04

3. A docker container for the actual narrative.

    13. This has to be either built on the docker host above, or on a docker enabled host and then push the containers to a docker container registry. For now, I just assume there is no registry and we directly run on the docker host.

    14. The dockerfile to build the container can be found here: [https://git.kbase.us/narrative.git/blob/HEAD:/docker/Dockerfile](https://git.kbase.us/narrative.git/blob/HEAD:/docker/Dockerfile)

    15. The dockerfile wants to be at a directory level above where the actual narrative repo lives, so that is some staging of the dockerfile and narrative repo necessary before you can build the container

    16. Once you’ve staged the file properly, you can just run "docker build -q -t  {username}/narrative ." and it will grind away to build you an image called {username}/narrative:latest (unless you version it otherwise)

        1. The -t directive specifies the repository (name) call it. You can also give it a tag as well, otherwise it will simply tag it as "latest" and when a new version that is “latest” arrives this version will give up the name/tag and fallback on a UUID.

        2. The recommended procedure is to build a new image and have it tagged as "latest" and then add another tag with a timestamp, so that you would build “sychan/narrative:latest” and then subsequently tag it as “sychan/narrative:20140425” so that if the latest tag moves, the old image can still be identified as a narrative image.

        3. **The current Nginx front end code is set to spin up a container named:tagged as "sychan/narrative:latest", this can be changed in the Lua module docker/notelauncher.lua config section.**

        4. **The Nginx front end code is also configured to recognize any containers currently running of the form sychan/narrative:* as legitimate running narratives during the container discovery. If you create a new container and there isn’t an sychan/narrative:{notlatest} image name on the running containers, they won’t be recognized as narrative containers and user consternation may ensue**

        5. The -q tag is for "quiet" mode because the current container builds generate lots of output and reach some internal docker limit of how much log output can be stored. A symptom of this problem is that the build will halt with the error "invalid byte in chunk length". Re-run with -q

            1. This can be avoided by going to a "stable" base narrative OS image build and a subsequent narrative python code install build against the base image

4. You have to to configure the front end so that it can find the docker host’s docker service endpoint. I don’t think I parameterized that yet, so it requires editing the Lua source, but that’s easy to fix. We also need to figure out how we want to secure the Docker listener. We can keep it as simple as SSL+Basic Auth, or else come up with something more elaborate. This seem like it might be pretty cool: [http://www.tarsnap.com/spiped.html](http://www.tarsnap.com/spiped.html)

Monitoring Considerations

We are already monitoring the docker using checkmk

Docker containers 

# Notes on updating the narrative and functional site on demo.kbase.us

The narrative and functional/landing-pages are kept in the narrative and ui-common git repos respectively.

The narrative is launched by docker, which always uses "sychan/narrative:latest" as the docker image to spin up. This image can be rebuilt by going to /root/src/docker-build and building it there like this:

cd /root/src/docker-build

docker build -t sychan/narrative .

docker tag sychan/narrative:latest sychan/narrative:YYYYMMDD

This makes a whole pile of intermediate containers. Any container with a status of "Exit" is one that can be pretty safely thrown away. Do this for all of them with:

> docker ps -a | grep Exit | awk '{print $1}' | xargs docker rm

This will launch a rebuild of the container and give it the name sychan/narrative with the tag YYMMDD (where YYMMDD are the current year,month,day). After the "build" command is the command which tags this most recent build as the “latest” version. The docker infrastructure will recognize any container named sychan/narrative with a listener on port 8888 as a legit narrative that should be served, but will only try to create new narratives against the version tagged as “latest”.

If you look in the docker-build directory you will see the following set of files:

root@demo:/root/src/docker-build# ls -l /root/src/docker-build

total 16

drwxr-xr-x 49 root root 4096 Feb  6 15:12 bootstrap

-rwxr-xr-x  1 root root 2637 Feb  6 15:13 Dockerfile

drwxr-xr-x  7 root root 4096 Feb  6 15:11 narrative

-rwxr-xr-x  1 root root 3668 Feb  6 15:13 sources.list

   The bootstrap and narrative directories correspond to the KBase git repos by the same name. The Dockerfile makes reference to both directories to contruct the new image. The sources.list file is used to configure the docker image to use the ANL Ubuntu repos for their images.

   The narrative repo in /root/src/docker-build/narrative tracks the master-demo branch, which is the master branch, but with code cells deactivated

   The Dockerfile is copied from narrative/docker/Dockerfile

The following link will give you a cleaned up screen log of a complete build of a new image on the narrative.kbase.us dev server:

[https://docs.google.com/a/lbl.gov/file/d/0B3cs3NOXf_IkQTlBV01VWndMd3M/edit](https://docs.google.com/a/lbl.gov/file/d/0B3cs3NOXf_IkQTlBV01VWndMd3M/edit)

   The link should be accessible by anyone at LBL with the link.

(before getting the docker container going…)

On my vanilla vagrant box (hashicorp/precise64, or an Ubuntu 12.04 LTS 64bit VM), you need an updated version of R and a couple dependencies for the Dockerfile to build properly.

**Installing R and dependencies:**

1. You’ll need an updated version of R, >= 3.0

	> apt-get remove r-base-core (if it’s there)

	Then follow instructions here: [http://cran.rstudio.com/bin/linux/ubuntu/](http://cran.rstudio.com/bin/linux/ubuntu/)

	(the short-short version below:)

	

	add "deb http://cran.rstudio.com/bin/linux/ubuntu precise/" to /etc/apt/sources.list

	> apt-key adv --keyserver keyserver.ubuntu.com --recv-keys E084DAB9

	> add-apt-repository ppa:marutter/rdev

	> apt-get update

	> apt-get install r-base

	> apt-get install r-base-dev

1. Next, you need libcurl4 (for curl-config)

> sudo apt-get install libcurl4-gnutls-dev

1. Finally, I updated the r-packages.R script to include recompiled versions of bitops, digest, and evaluate (though these might just be because the R update didn’t include those and there was a little snafu with my first compilation using docker).

===============

kkeller log 12jun2014

`# sync bootstrap, ui-common, and narrative repos`

`mkdir kb_narr`

`mv bootstrap narrative kb_narr`

`apt-get update`

`apt-get install vim`

`# add nginx sources above (don’t actually need to do?)`

`# vim /etc/apt/sources.list.d/nginx-stable-precise.list`

`# these next two should add nginx repo properly`

`apt-get install python-software-properties`

`add-apt-repository ppa:nginx/stable`

`apt-get update`

`apt-get install nginx-extras`

`# verify this worked before going on`

`# lua`

`bash /path/to/narrative/docker/lua-dependencies.txt`

`# see `[https://github.com/fperrad/lua-TestLongString/issues/1](https://github.com/fperrad/lua-TestLongString/issues/1)

`# not sure what comment is supposed to mean`

`# main moonrocks server does not have 0.2.0-2`

`#luarocks --only-server=http://rocks.moonscript.org search lua-testlongstring`

`#Search results:`

`#===============`

`#Rockspecs and source rocks:`

`#---------------------------`

`#lua-testlongstring`

`#   0.2.0-1 (rockspec) - http://rocks.moonscript.org`

`#   0.2.0-1 (src) - http://rocks.moonscript.org`

`#   0.1.3-2 (rockspec) - http://rocks.moonscript.org`

`#   0.1.3-2 (src) - http://rocks.moonscript.org`

`#   0.1.2-1 (rockspec) - http://rocks.moonscript.org`

`#   0.1.2-1 (src) - http://rocks.moonscript.org`

`#   0.1.1-1 (rockspec) - http://rocks.moonscript.org`

`#   0.1.0-2 (rockspec) - http://rocks.moonscript.org`

`#   0.1.0-2 (src) - http://rocks.moonscript.org`

`#   0.1.0-1 (rockspec) - http://rocks.moonscript.org`

`# work around MD5 error`

`luarocks download lua-testlongstring`

`vim lua-testlongstring-0.2.0-2.rockspec`

`# md5 is 9b02dd72b41807c5325daeb8fcdd9b70`

`luarocks build lua-testlongstring-0.2.0-2.rockspec`

`# get luaspore`

`bash lua-dependencies.txt`

`# docker`

`apt-get update`

`apt-get install linux-image-generic-lts-raring \`

`    linux-headers-generic-lts-raring`

`shutdown -r now`

`apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys \`

`    36A1D7869245C8950F966E92D8576A8BA88D21E9`

`sh -c "echo deb https://get.docker.io/ubuntu docker main \`

`    > /etc/apt/sources.list.d/docker.list"`

`apt-get update`

`apt-get install lxc-docker`

`# add docker to www-data, and add www-data to docker`

`vigr`

`service docker stop`

`service nginx stop`

`service docker start`

`mkdir -p /kb/deployment/services/narrative/docker`

`cd /path/to/narrative/docker`

`rsync -avP resty *.lua /kb/deployment/services/narrative/docker/`

`cp narrative/docker/Dockerfile narrative/docker/r-packages.R \`

`    narrative/docker/sources.list .`

`docker build -q -t sychan/narrative .`

`# take a nap`

`cd /path/to/narrative`

`cp src/nginx/default /etc/nginx/sites-available/`

`vim /etc/nginx/sites-available/default`

`# change lua path (all one line)`

`#lua_package_path "/kb/deployment/services/narrative/docker/?;/kb/deployment/services/narrative/docker/?.lua;;";`

`# add location`

`#       location / {`

`#                root /kb/deployment/ui-common;`

`#                index index.html;`

`#                #ssi on;`

`#                ssi_silent_errors off;`

`#                allow all;`

`#       }`

`service nginx start`

`cd ~/ui-common`

`./deployFunctionalSite.sh`

`# end log, it worked!`

