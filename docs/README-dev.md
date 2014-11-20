# Contents

* Introduction
* Deployment
* Logging
* Source

# Introduction
Contents

## Narrative development

Last updated: Dan Gunter <dkgunter@lbl.gov> 7/31/2014

To report bugs, login using your KBase developer user/pass at: https://atlassian.kbase.us

This is the IPython based Narrative Interface repository.
All relevant code lives under the src/directory. A virtualenv based installer
and standard KBase Makefile targets are in the works (still!). But a Docker-based
provisioning system exists and has been deployed.

This document will go over the installation and instantiation process of a local
version of the Narrative Interface for development purposes. It's divided into 
four parts:

1. Preparing your system
2. Installing the Narrative virtual environment
3. Starting your Narrative
4. Managing your Narrative during development

### Preparing your system

The first stage involves the local installation of the packages needed to make
the Narrative work. These are all Python based.

1.  **Python 2.7**

    You must have Python 2.7 and a matching version of pip. Pip is not installed by default, so it is possible to upgrade Python and keep a version of pip that only updates the libraries for a previous version. If you do not have a 2.7 version of pip installed, you can upgrade with easy_install (which comes with Python):

    `> easy_install-2.7 pip`

2.  **Install Python dependencies**
    
    The set of Python dependencies you'll need to install are located in the KBase Bootstrap git repo. Grab that and use pip to install the list of dependencies.

        > git clone kbase@git.kbase.us:bootstrap
        > pip install -r bootstrap/kb_python_runtime/python-pip-list-narrative

    If you have any problems at this stage, make sure that your Python and pip versions are up to date and in sync with each other.

3.  **Install SciPy and NumPy**

    These are better to install as packages on their own. Linux users can use the usual frameworks (dpkg, apt-get, yum, and so on). Or you can fetch them from SourceForge:

    SciPy: [http://sourceforge.net/projects/scipy/files/scipy/](http://sourceforge.net/projects/scipy/files/scipy/)  
    NumPy: [http://sourceforge.net/projects/numpy/files/NumPy/](http://sourceforge.net/projects/numpy/files/NumPy/)

Once this is all done successfully, you can move on to installing the Narrative itself.

### Installing the Narrative virtual environment

The Narrative Interface uses a virtual environment that captures the Python dependency state of your system, makes an copy of that environment (so to speak), and prevents all of the different IPython dependencies from trickling out into your system and colliding with different things once it gets installed. All this means is that a Narrative's virtual environment is protected from changes to your system environment, and vice-versa.

First, however, you'll need to get a necessary submodule initialized:

    git submodule init
    git submodule update    

If there are any problems with this step, run the following commands:

    cd modules/ui-common
    git checkout hardy
    git pull

Now you're set up with the correct Narrative environment.


The installation process takes a little time to run, as it downloads the IPython core code, builds a virtual environment to encapsulate it in, and puts that in a specified directory.

The `install.sh` script in the root of this repo does all the work. There are a few options of how to use it.

1.  **`> ./install.sh`**

    This creates a `narrative-venv/` directory where it's run, which contains your Narrative.

2.  **`> ./install.sh -v my-narrative-venv`**

    The -v tag allows you to specify the name of the narrative venv directory.

3. **`> ./install.sh -p /Users/kbaseuser/ -v my-narrative-venv`**

    The -p tag allows you to specify where your narrative venvs should be stored.

4. **Example**

    `> ./install.sh -p ~/.virtualenvs -v kbase-narr`

    This uses the ~/.virtualenvs directory (a common use case for virtualenv) for your environment and makes a new kbase-narr virtual environment.

#### Alternate installation for those with virtualenv already set up

If you are comfortable with virtualenv, and already have it set up, there is another way to install:

1. ** Activate your virtual environment **

2. ** Run the Makefile **

    make -f Makefile.narrative

3. ** Use the `run_notebook` script ** The script file generated is called "run_notebook" instead of "run_notebook.sh", and does not require the extra "notebook" argument, so ignore the whole next section and just use:

    run_notebook
    
### Running the KBase Narrative

Now that you have your Narrative installed, you need to route your system path to use the virtual environment you created, then fire up the system.

1.  **Activate the virtual environment**

    `> source <my virtual environment>/bin/activate`

    (Optional) If you use the [virtualenvwrapper](http://virtualenvwrapper.readthedocs.org/en/latest/) module, and have installed the notebook under your usual virtual environment location, you can also simply use `workon <name>`, where `<name>` is whatever you chose to call the environment.

2.  **Fire up the Narrative**

    `> profile_name=narrative run_notebook.sh notebook`

    This will start the Narrative server and open a browser window for you with the heavily modified IPython Notebook running in it.

    (Optional) Leaving off the last 'notebook' part and just running `> run_notebook.sh` will open a command-line only version of the Narrative. This doesn't have very strong support, but can be useful for testing small things or debugging.

### Managing your Narrative during development

A developer's guide to building Narrative content can be found here: [KBase Narrative Documentation](http://matgen6.lbl.gov:8080/) (todo: move this to kbase.us/docs)

This section covers how and when to reset your Narrative during development.

1.  **Modifying Python service code**

    Much of the Narrative involves writing service wrappers that invoke KBase services. If any of these (or any other part of the Python code in src/biokbase) is modified, you'll need to do the following steps to update your virtual environment.

    A.  Exit the Narrative (Ctrl-c a couple times on your running narrative console)  
    B.  (Option 1, the clean but slow way) Remove and reinstall the virtual environment  
    C.  (Option 2, the slightly-less-clean but much faster way) Run the part of the installer that compiles the src/biokbase directory  
        
        With your virtual environment still active:  
        `> python src/setup.py install || abort`  
    D.  Restart your Narrative as above.

2.  **Modifying KBase widget code (or any other front-end Javascript/HTML code)**

    If you're just tweaking visualization or widget code, you only need to do whatever compilation process you use for your personal code, then do a cache-clearing refresh of your page (shift-F5 on most browsers). You don't need to reset the entire virtual environment.


# Deployment
Contents


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

    vagrant init hashicorp/precise64

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


# Logging
Contents

## Narrative logging

The narrative instances perform their logging through a 2-step process, where the data passes from the Docker container out to a "log proxy" on the host, and then from there to other sinks (currently MongoDB).

    +----------------------+
    |Narrative UI in Docker   | -- logging --> /tmp/kbase-narrative.log 
    +----------------------+
           |        
           | logging
           v        
    +----------------------+
    |  Log proxy on host           |
    +----------------------+
           |        
           | logging
           v        
    +----------------------+
    |    MongoDB, Syslog             |
    +----------------------+

The narrative logging proxy was created to deal with security and networking issues for the Docker containers used for the KBase Narrative IPython Notebook backend (which is a mouthful, but basically is a web server that provides a bi-directional pipe to a Python interpreter). We want to log data to a remote location, like a MongoDB or Splunk server, from within the Docker container. However, within the Docker container we don't want to store the credentials needed to access the database. In addition, we don't want the management overhead and hassle of making socket connections to the Internet from within each Docker container.

So, what the logging proxy really does is run a simple server that listens on a socket for Python logging messages (in the format sent by the standard logging module's SocketHandler class), and forward them to the remote destination of choice.

The rest of this README describes the configuration and various tasks with the proxy.

### Log format

The narrative will log to both socket and a local file `/tmp/kbase-narrative.log`. This is useful for debugging in stand-alone versions of the notebook.

The log format in this file is the same as the format that will be sent to syslog by the narrative log proxy. An example log entry is shown below. It will all be in a single line, the backslashes are added for legibility.

    INFO 2014-11-20 02:05:44,386 biokbase.narrative open;client_ip=127.0.0.1 \
    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36" \
    user=dangunter \
    session_id=3265e4f5b7557afa2ad62018cdc6af6f66679a0290e89ffbcdb53016dd9e40e1 \
    narr=ws.2632.obj.3

The format is:

    <Level> <Date> <Time> <log-module> <event>;<key1>=<value1> <key2>=<value2> ...

The Date and Time are in UTC.

### Code

The code for the narrative logging proxy is in the biokbase.narrative.common package:

* log_proxy.py - Implement the proxy
* kblogging.py - This is the client library for the narratives to do their logging

### Configuration

For the most part, the logging proxy is configured from a single YAML file.

* File location: /etc/kbase/narrative-log-proxy.conf
* File format: YAML
* Sample:

        # proxy listen host and port
        host: 172.17.42.1
        port: 32001
        # mongodb server user/pass and database
        db_host: db3.chicago.kbase.us
        db_port: 27017
        user: narlog
        password: "put-password-here"
        db: mongoDBName
        collection: mongoCollectionName
        # syslog destination
        syslog_facility: user
        syslog_host: localhost
        syslog_port: 514
        syslog_proto: udp

In addition, some environment variables have special meaning:

* KBASE_DEBUG=1 - Turn on a high level
* KBASE_PROXY_CONFIG=/etc/kbase/narrative-log-proxy.conf - Config file location, for clients

### Update, test, or restart the proxy

* Get to narrative-dev

        ssh kb1
        # ssh login1.berkeley.kbase.us

        ssh dev
        # ssh narrative-dev

* Become root

        sudo su - root

* Go to narrative root

        cd /root/narrative-test
        . narrative-env/bin/activate

* Update the code

        # git checkout <branch>
        git pull

* Get into dev. mode

        cd src
        pip install -r requirements.txt # gets deps installed
        python setup.py develop # live changes!

* Stop current proxy

        psg '[k]b-log-proxy'|cut -c10-15|xargs kill
        
* Restart the proxy

        # run-forever mode:
        nohup kb-log-proxy -f /etc/kbase/narrative-log-proxy.conf > /var/log/kbase/narrative-log-proxy.log &
        # debug mode:
        kb-log-proxy  -vv -f /etc/kbase/narrative-log-proxy.conf &

* Test the proxy

    - Send a message

        export KBASE_PROXY_CONFIG=/etc/kbase/narrative-log-proxy.conf
        kb-log-proxy -v -f  $KBASE_PROXY_CONFIG &
        python ./biokbase/narrative/common/log_client.py hello towhom=world

        tail /tmp/kbase-narrative.log  
        # Last line should look like:
        # INFO 2014-10-28 05:21:45,958 biokbase.test hello;towhom=world []

    - Fetch last thing from DB
    
        python -c '
import pymongo, yaml, os, pprint
conf = os.environ["KBASE_PROXY_CONFIG"]
info = yaml.load(open(conf))
db = pymongo.MongoClient(info["db_host"], info["db_port"])[info["db"]]
db.authenticate(info["user"], info["password"])
c = db[info["collection"]]
pprint.pprint(c.find_one({}, sort=[("created", -1)]))'

    # Expected output:
    
    {u'_id': ObjectId('544fcb828ef90759a0f617a6'),
     u'created': 1414515586.423574,
     u'created_date': datetime.datetime(2014, 10, 28, 16, 59, 46, 423000),
     u'created_tz': u'PDT',
     u'event': u'hello',
     u'filename': u'log_client.py',
     u'funcName': u'send_message',
     u'levelname': u'INFO',
     u'lineno': 43,
     u'message': u'',
     u'module': u'log_client',
     u'msecs': 423.57397079467773,
     u'name': u'biokbase.test',
     u'process': 26374,
     u'processName': u'MainProcess',
     u'towhom': u'world'}



# Source
Contents


# Introduction

This document describes the Python code in the KBase narrative repo.

# Package biokbase

The subdirectory, biokbase/, is a Python package.

## Description

This Python package contains all the KBase Python libraries to support the Python narrative UI, which is built on the IPython notebook.

## Dependencies

See ``requirements.txt``.

IPython Notebook (KBNB) dependencies are here: http://ipython.org/ipython-doc/dev/install/install.html

## Install

Installation uses setup.py and pip. If you don't have 'pip' installed, do that first. See http://www.pip-installer.org/en/latest/installing.html 

Then run the install script:

    ./install.sh

## Running

A script to run the notebook, `run_notebook.sh`, is placed in your path from install.sh in the parent directory so you can run it like this:

    run_notebook.sh notebook

# Other packages

MG-RAST_Retina
  Retina/STM are packages to support a widget framework that Folker's group has developed

MG-RAST_ipy-mkmq
  So far this module seems to have an external dependency on R and the MatR R library.
  The instructions indicate that it can be downloaded and installed using the following
  R code snippet:
     > install.packages("matR", repo="http://dunkirk.mcs.anl.gov/~braithwaite/R", type="source")
     > library(matR)
     > dependencies()

  Please see: https://github.com/MG-RAST/matR
***Dependencies***

   There are some dependencies for the modules in this directory.
   Please make sure they are in your environment before trying to run the notebooks.

   IPython Notebook (KBNB) dependencies
      They are all spelled out here: http://ipython.org/ipython-doc/dev/install/install.html

      For the impatient, here's a summary:
         Python 2.6+
         readline
         nose
         pexpect
         ZeroMQ libraries
         pyzmq
         Qt libraries
         PyQt
         pygments
         Tornado
         MathJax

      These are taken care of in the KBase bootstrap as of 6/27/2013 for KBase images,
      but if you are running the notebook outside of a KBase, or using a KBase image V22
      or older, you will have to handle the installation manually.


   MG-RAST_Retina
      Retina/STM are packages to support a widget framework that Folker's group has developed

   MG-RAST_ipy-mkmq
      So far this module seems to have an external dependency on R and the MatR R library.
      The instructions indicate that it can be downloaded and installed using the following
      R code snippet:
         > install.packages("matR", repo="http://dunkirk.mcs.anl.gov/~braithwaite/R", type="source")
         > library(matR)
         > dependencies()

      Please see: https://github.com/MG-RAST/matR


***Contents***

   Here is an explanation of the files found in this directory:

   MG-RAST_ipy-mkmq - glue code to connect Retina and R stuff into IPython
   MG-RAST_Retina   - viz libraries from Folker's group
   biokbase/        - root of kbase python libraries to support the notebook
   notebook/        - contains all ipython specific styling, customizations, etc
      ipython.sh        - helper script that runs ipython with narrative stuff loaded
      ipython_profiles/ - the equivalent of ~/.ipython for storing configs, used with ipython.sh script for configuration
          extensions/   - directory for ipython extensions (the type used with %load_ext)
      usercustomize.py  - Ugly hack needed to deal with PYTHONPATH being munged when the kbase notebook forks a 
                          process. See http://python.6.x6.nabble.com/Weird-PYTHONPATH-etc-issue-td4989274.html

      # the following directories may need some cleanup and consolidation, they include support libraries and other content

      css
      img
      js/
         jquery
