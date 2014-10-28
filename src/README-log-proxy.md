# How to test/start the narrative logging

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


