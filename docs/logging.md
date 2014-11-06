## Narrative logging

The narrative instances perform their logging through a 2-step process, where the data passes from the Docker container out to a "log proxy" on the host, and then from there to other sinks (currently MongoDB).

    +----------------------+
    |Narrative UI in Docker|
    +----------------------+
           |        
           | logging
           v        
    +----------------------+
    |  Log proxy on host      |
    +----------------------+
           |        
           | logging
           v        
    +----------------------+
    |    MongoDB, etc.     |
    +----------------------+

The narrative logging proxy was created to deal with security and networking issues for the Docker containers used for the KBase Narrative IPython Notebook backend (which is a mouthful, but basically is a web server that provides a bi-directional pipe to a Python interpreter). We want to log data to a remote location, like a MongoDB or Splunk server, from within the Docker container. However, within the Docker container we don't want to store the credentials needed to access the database. In addition, we don't want the management overhead and hassle of making socket connections to the Internet from within each Docker container.

So, what the logging proxy really does is run a simple server that listens on a socket for Python logging messages (in the format sent by the standard logging module's SocketHandler class), and forward them to the remote destination of choice.

The rest of this README describes the configuration and various tasks with the proxy.

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


