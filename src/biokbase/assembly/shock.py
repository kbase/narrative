
""" Module for shock """
import logging
import requests
import json
import os
import subprocess
import StringIO
import time
import tempfile
import sys

def download(url, node_id, outdir):
    logging.info("Downloading id: %s" % node_id)
    u = url
    u += "/node/%s" % node_id
    print u
    r = get(u)
    print r
    print r.text
    res = json.loads(r.text)
    filename = res['data']['file']['name']
    durl = url + "/node/%s?download" % node_id
    try:
        os.makedirs(outdir)
    except:
        pass
    dfile = outdir + filename
    print dfile
    r = get(durl)
    with open(dfile, "wb") as code:
        code.write(r.content)
    logging.info("File downloaded: %s" % dfile)
    print "File downloaded: %s" % dfile
    return dfile

def post(url, files, user, password):
	r = None
	if user and password:
            r = requests.post(url, auth=(user, password), files=files)
	else:
            r = requests.post(url, files=files)

        res = json.loads(r.text)
        logging.info(r.text)
	return res


def get(url, user='assembly', password='service1234'):
    
    r = None
    r = requests.get(url, auth=(user, password), timeout=20)       

    return r


def curl_download_file(url, node_id, token, outdir=None):
    print 'downloading'
    # cmd = ['curl', '-H', 'Authorization: Globus-Goauthtoken {} '.format(token),
    #        '-X', 'GET', '{}/node/{}'.format(url, node_id)]

    cmd = ['curl',
           '-X', 'GET', '{}/node/{}'.format(url, node_id)]

    print cmd

    r = subprocess.check_output(cmd)
    filename = json.loads(r)['data']['file']['name']
    if outdir:
        try:
            os.makedirs(outdir)
        except:
            pass
            #raise Exception('Unable to create download directory:\n{}'.format(outdir))
        
    else:
        outdir = os.getcwd()
    d_url = '{}/node/{}?download'.format(url, node_id)
    # cmd = ['curl', '-H', 'Authorization: Globus-Goauthtoken {} '.format(token),
    #        '-o', filename, d_url]

    cmd = ['curl', 
           '-o', filename, d_url]

    p = subprocess.Popen(cmd, cwd=outdir)
    p.wait()
    print "File downloaded: {}/{}".format(outdir, filename)
    return os.path.join(outdir, filename)

def parse_handle(sn_handle):
    handle_parts = sn_handle.split('.')
    if handle_parts[-1] == 'shock': # Is shock file
        shockfile = open(sn_handle)
        shockinfo = json.loads(shockfile.read())
        try:
            shock_id = shockinfo['id']
            shock_url = shockinfo['url']
            return shock_url, shock_id
        except:
            return False
    return False

class Shock:
    def __init__(self, shockurl, user, token):
        self.shockurl = shockurl
        self.user = user
        self.token = token
        self.attrs = {'user': user}

    def upload_reads(self, filename, curl=False):
        if curl:
            return self._curl_post_file(filename, filetype='reads')
        return self._post_file(filename, filetype='reads')

    def upload_contigs(self, filename, curl=False):
        if curl:
            return self._curl_post_file(filename, filetype='contigs')
        return self._post_file(filename, filetype='contigs')

    def upload_results(self, filename, curl=False):
        if curl:
            return self._curl_post_file(filename, filetype='reads')
        return self._post_file(filename, filetype='reads')

    def upload_misc(self, filename, ftype, curl=False):
        if curl:
            return self._curl_post_file(filename, filetype=ftype)
        return self._post_file(filename, filetype=ftype)


    def curl_download_file(self, node_id, outdir=None):
        cmd = ['curl', 
               '-X', 'GET', '{}/node/{}'.format(self.shockurl, node_id)]
        r = subprocess.check_output(cmd)
        filename = json.loads(r)['data']['file']['name']
        if outdir:
            try:
                os.makedirs(outdir)
            except:
                pass
                #raise Exception('Unable to create download directory:\n{}'.format(outdir))

        else:
            outdir = os.getcwd()
        d_url = '{}/node/{}?download'.format(self.shockurl, node_id)
        cmd = ['curl', 
               '-o', filename, d_url]

        p = subprocess.Popen(cmd, cwd=outdir)
        p.wait()

        downloaded = os.path.join(outdir, filename)
        if os.path.exists(downloaded):
            print "File downloaded: {}".format(downloaded)
            return downloaded
        else:
            raise Exception ('Data does not exist')

    def download_file(self, node_id, outdir=None):
        r = requests.get('{}/node/{}'.format(self.shockurl, node_id))
        filename = json.loads(r.content)['data']['file']['name'].split('/')[-1]
        if outdir:
            try:
                os.makedirs(outdir)
            except:
                pass
        else:
            outdir = os.getcwd()

        d_url = '{}/node/{}?download'.format(self.shockurl, node_id)
        downloaded = os.path.join(outdir, filename)
        r = requests.get(d_url, stream=True)
        with open(downloaded, 'wb') as f:
            for chunk in r.iter_content(chunk_size=1024): 
                if chunk: # filter out keep-alive new chunks
                    f.write(chunk)
                    f.flush()

        if os.path.exists(downloaded):
            print "File downloaded: {}".format(downloaded)
            return downloaded
        else:
            raise Exception ('Data does not exist')


    def create_attr_file(self, attrs, outname):
        """ Writes to attr OUTFILE from dict of attrs """ 
        f = tempfile.NamedTemporaryFile(delete=False)
        outjson = f.name
        f.write(json.dumps(attrs))
        f.close()
        return outjson

        

    ######## Internal Methods ##############
    def _create_attr_mem(self, attrs):
        """ Create in mem filehandle """
        return StringIO.StringIO(json.dumps(attrs))

    def _post_file(self, filename, filetype=''):
        """ Upload using requests """
        tmp_attr = dict(self.attrs)
        tmp_attr['filetype'] = filetype
        attr_fd = self._create_attr_mem(tmp_attr)
        r = None
        files = None
        try:
            with open(filename) as f:
                files = {'upload': f, 
                         'attributes': attr_fd}
                r = requests.post('{}/node/'.format(self.shockurl), files=files)

        except:
            print "ERROR: python-requests error, try with --curl flag"
            return

        attr_fd.close()
        res = json.loads(r.text)
        logging.info(r.text)
        try:
            if res['status'] == 200:
                print >> sys.stderr, "Upload complete: {}".format(filename)
            else:
                print >> sys.stderr, "Upload error: {}".format(res['status'])
        except: 
            print >> sys.stderr, "Upload error"
	return res

    def _curl_post_file(self, filename, filetype=''):
        tmp_attr = dict(self.attrs)
        tmp_attr['filetype'] = filetype
        attr_file = self.create_attr_file(tmp_attr, 'attrs')
        cmd = ['curl', 
               '-X', 'POST', 
               '-F', 'attributes=@{}'.format(attr_file),
               '-F', 'upload=@{}'.format(filename),
               '{}node/'.format(self.shockurl)]
        ret = subprocess.check_output(cmd)
        res = json.loads(ret)
        return res
