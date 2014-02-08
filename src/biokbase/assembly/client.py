import collections
import datetime
import json
import requests
import subprocess
import os


from shock import Shock

#Debug
import sys
import traceback
""" Assembly Service client library.

REST interface:

Resources:
* http://assembly.kbase.us/api/

** user/current
** user/USER_ID/

*** jobs/current
*** jobs/JOB_ID
**** status
**** download
**** runtime
**** data_id
**** ... other metadata

*** data/current
*** data/DATA_ID
**** files
**** files/FILE_ID(?)
***** filename
***** filesize


Admin
-----
Create user                       POST URL/users
Run job                           POST URL/user/USER_ID/job/new --data JSON_MSG
Get status of recent jobs         GET  URL/user/USER_ID/job/status?records=<>

# TODO
Get status of one job             GET  URL/user/USER_ID/job/JOB_ID/status
Get list of user's data           GET  URL/user/USER_ID/data/current/status
Get list of files for data_id     GET  URL/user/USER_ID/data/DATA_ID/status


#TODO
format from html??

"""


class Client:
    def __init__(self, url, user, token):
        self.port = 8000 ## change
        if url.find(':') == -1: # Port not included
            self.url = url + ':{}'.format(self.port)
        else:
            self.url = url
        self.user = user
        self.token = token
        self.headers = {'Authorization': '{}'.format(self.token),
                        'Content-type': 'application/json', 
                        'Accept': 'text/plain'}
        shockres = requests.get('http://{}/shock'.format(self.url), headers=self.headers).text
        self.shockurl = 'http://{}/'.format(json.loads(shockres)['shockurl'])
        self.shock = Shock(self.shockurl, self.user, self.token)

    def get_job_data(self, job_id=None, outdir=None):
        if not job_id:
            raise NotImplementedError('Job id required')
        # Get node id
        res = requests.get('http://{}/user/{}/job/{}/shock_node'.format(
                self.url, self.user, job_id), headers=self.headers)
        # Download files
        try:
            nodes_map = json.loads(res.text)
            for node_id in nodes_map.values():
                self.shock.download_file(node_id, outdir=outdir)
        except:
            print traceback.format_tb(sys.exc_info()[2])
            print sys.exc_info()
            raise Exception("Error retrieving results")
        return 

    def get_assemblies(self, job_id=None, asm_id=None, stdout=False, outdir=None):
        if not job_id:
            raise NotImplementedError('Job id required')
        # Get node id
        res = requests.get('http://{}/user/{}/job/{}/assembly'.format(
                self.url, self.user, job_id), headers=self.headers)

        # Download files
        try:
            nodes_map = json.loads(res.text)
            if stdout: # Get first one and print
                asm_file = self.shock.download_file(nodes_map.values()[0], outdir=outdir)
                with open(asm_file) as f:
                    for line in f:
                        print line
            elif asm_id:
                ordered = collections.OrderedDict(sorted(nodes_map.items()))
                id = ordered.values()[int(asm_id)-1]
                self.shock.download_file(id , outdir=outdir)

            else:
                for node_id in nodes_map.values():
                    self.shock.download_file(node_id, outdir=outdir)
        except:
            print traceback.format_tb(sys.exc_info()[2])
            print sys.exc_info()
            raise Exception("Error retrieving results")
        return 
        
    def upload_data_shock(self, filename, curl=False):
        res = self.shock.upload_reads(filename, curl=curl)
        shock_info = {'filename': os.path.basename(filename),
                                  'filesize': os.path.getsize(filename),
                                  'shock_url': self.shockurl,
                                  'shock_id': res['data']['id'],
                                  'upload_time': str(datetime.datetime.utcnow())}
        return res, shock_info

    def upload_data_file_info(self, filename, curl=False):
        """ Returns FileInfo Object """
        res = self.shock.upload_reads(filename, curl=curl)
        return FileInfo(self.shockurl, res['data']['id'], os.path.getsize(filename),
                            os.path.basename(filename), str(datetime.datetime.utcnow()))

    def submit_job(self, data):
        url = 'http://{}/user/{}/job/new'.format(self.url, self.user)
        r = requests.post(url, data=data, headers=self.headers)
        return r.content

    def submit_data(self, data):
        url = 'http://{}/user/{}/data/new'.format(self.url, self.user)
        r = requests.post(url, data=data, headers=self.headers)
        return r.content

    def get_job_status(self, stat_n, job_id=None):
        if job_id:
            url = 'http://{}/user/{}/job/{}/status'.format(self.url, self.user, job_id)
        else:
            url = 'http://{}/user/{}/job/status?records={}'.format(
                self.url, self.user, stat_n)
        r = requests.get(url, headers=self.headers)
        return r.content

    def get_available_modules(self):
        url = 'http://{}/module/all/avail/'.format(self.url, self.user)
        r = requests.get(url, headers=self.headers)
        return r.content

    def kill_jobs(self, job_id=None):
        if job_id:
            url = 'http://{}/user/{}/job/{}/kill'.format(self.url, self.user, job_id)
        else:
            url = 'http://{}/user/{}/job/all/kill'.format(
                self.url, self.user)
        r = requests.get(url, headers=self.headers)
        return r.content

    def get_config(self):
        return requests.get('http://{}/admin/system/config'.format(self.url)).content


##### ARAST JSON SPEC METHODS #####

class FileInfo(dict):
    def __init__(self, shock_url, shock_id, filesize, filename, create_time, metadata=None, *args):
        dict.__init__(self, *args)
        self.update({'shock_url': shock_url,
                     'shock_id' : shock_id,
                     'filesize': filesize,
                     'filename': filename,
                     'create_time': create_time,
                     'metadata': metadata})

class FileSet(dict):
    def __init__(self, set_type, file_infos, 
                 **kwargs):
        dict.__init__(self, **kwargs)
        self.update({'type': set_type,
                     'file_infos': []})
        if type(file_infos) is list:
            for f in file_infos:
                self['file_infos'].append(f)
        else:
            self['file_infos'] = [file_infos]

class AssemblyData(dict):
    def __init__(self, *args):
        dict.__init__(self, *args)
        self['file_sets'] = []

    def add_set(self, file_set):
        self['file_sets'].append(file_set)
