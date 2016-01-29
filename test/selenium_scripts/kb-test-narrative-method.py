#!/usr/bin/env python

import json
import os
import re
import subprocess
import sys
import time
import uuid
import urllib2
import base64

from optparse import OptionParser
from selenium import webdriver
from selenium.common.exceptions import TimeoutException
from selenium.common.exceptions import UnexpectedAlertPresentException
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait # available since 2.4.0
from selenium.webdriver.support import expected_conditions as EC # available since 2.26.0

VERSION = '1'
API_URL = "http://api.metagenomics.anl.gov/"+VERSION
AUTH_LIST = "Jared Bischof, Travis Harrison, Folker Meyer, Tobias Paczian, Andreas Wilke"
PAGE_LOAD_TIMEOUT = 120  # seconds
METHOD_RUN_TIMEOUT = 120 # seconds
SUPPORTED_FIELD_TYPES = [ "text", "dropdown" ]

prehelp = """
NAME
    kb-test-narrative-method

VERSION
    %s

SYNOPSIS
    kb-test-narrative-method [ --help, --config_file <json input file>, --user <string>, --passwd <string>, --url <string> --output <png output file> ]

DESCRIPTION
    Tool to test a narrative method.
"""

posthelp = """
Input
    1. A json input file with the ws ID, method name, and method parameters (config_file, required).
    2. KBase username (user, required to login to web UI - may be embedded in config_file)
    3. KBase password (passwd, required to login to web UI - may be embedded in config_file)
    4. The base url for the narrative server (url, default=https://narrative-test.kbase.us)

Output
    1. A screenshot (png format) of the narrative interface upon method test completion (output, default=<wsid>.<method_name>.png).
    2. Test report to STDOUT.

EXAMPLES
    kb-test-narrative-method --help

SEE ALSO
    -

AUTHORS
    %s
"""

def get_auth_token(opts):
    if 'KB_AUTH_TOKEN' in os.environ:
        return os.environ['KB_AUTH_TOKEN']
    if opts.user or opts.passwd:
        if opts.user and opts.passwd:
            return token_from_login(opts.user, opts.passwd)
        else:
            sys.stderr.write("ERROR: both username and password are required\n")
            sys.exit(1)
    else:
        return None

def token_from_login(user, passwd):
    auth = 'kbgo4711'+base64.b64encode('%s:%s' %(user, passwd)).replace('\n', '')
    data = obj_from_url(API_URL, auth=auth)
    return data['token']

# return python struct from JSON output of MG-RAST API
def obj_from_url(url, auth=None, data=None, debug=False):
    header = {'Accept': 'application/json'}
    if auth:
        header['Auth'] = auth
    if data:
        header['Content-Type'] = 'application/json'
    if debug:
        if data:
            print "data:\t"+data
        print "header:\t"+json.dumps(header)
        print "url:\t"+url
    try:
        req = urllib2.Request(url, data, headers=header)
        res = urllib2.urlopen(req)
    except urllib2.HTTPError, error:
        if debug:
            sys.stderr.write("URL: %s\n" %url)
        try:
            eobj = json.loads(error.read())
            sys.stderr.write("ERROR (%s): %s\n" %(error.code, eobj['ERROR']))
        except:
            sys.stderr.write("ERROR (%s): %s\n" %(error.code, error.read()))
        finally:
            sys.exit(1)
    if not res:
        if debug:
            sys.stderr.write("URL: %s\n" %url)
        sys.stderr.write("ERROR: no results returned\n")
        sys.exit(1)
    obj = json.loads(res.read())
    if obj is None:
        if debug:
            sys.stderr.write("URL: %s\n" %url)
        sys.stderr.write("ERROR: return structure not valid json format\n")
        sys.exit(1)
    if len(obj.keys()) == 0:
        if debug:
            sys.stderr.write("URL: %s\n" %url)
        sys.stderr.write("ERROR: no data available\n")
        sys.exit(1)
    if 'ERROR' in obj:
        if debug:
            sys.stderr.write("URL: %s\n" %url)
        sys.stderr.write("ERROR: %s\n" %obj['ERROR'])
        sys.exit(1)
    return obj

def main(args):
    OptionParser.format_description = lambda self, formatter: self.description
    OptionParser.format_epilog = lambda self, formatter: self.epilog
    parser = OptionParser(usage='', description=prehelp%VERSION, epilog=posthelp%AUTH_LIST)
    parser.add_option("", "--user", dest="user", default=None, help="OAuth username")
    parser.add_option("", "--passwd", dest="passwd", default=None, help="OAuth password")
    parser.add_option("", "--config_file", dest="config_file", default=None, help="A json input file with the method parameters")
    parser.add_option("", "--url", dest="url", default="https://narrative-test.kbase.us", help="The base url for the narrative server")
    parser.add_option("", "--output", dest="output", default=None, help="Output filename for screenshot of browser after test completion")

    (opts, args) = parser.parse_args()
    if not opts.config_file:
        sys.stderr.write("ERROR: missing required parameter: config_file\n")
        return 1

    indata = open(opts.config_file, 'r').read()
    config = json.loads(indata)
    if config is None:
        sys.stderr.write("ERROR: config_file structure not valid json format\n")
        sys.exit(1)

    for i,j in enumerate(config):
        if j == 'wsid':
            opts.wsid = config[j]
        elif j == 'user':
            opts.user = config[j]
        elif j == 'passwd':
            opts.passwd = config[j]
        elif j == 'method_name':
            opts.method_name = config[j]

    for i,j in enumerate(config["params"]):
        for k in ['name', 'type', 'value']:
            if k not in config["params"][i]:
                sys.stderr.write("ERROR: config_file contains a parameter missing one of the required fields (name, type, value)\n")
                sys.exit(1)
            if k == 'type' and config["params"][i][k] not in SUPPORTED_FIELD_TYPES:
                sys.stderr.write("ERROR: parameter type not supported: %s\n"%config["params"][i][k])
                sys.exit(1)

    for o in ['user', 'passwd', 'wsid', 'method_name']:
        if not getattr(opts, o):
            sys.stderr.write("ERROR: missing required parameter: " + o + "\n")
            return 1

    if not opts.output:
        opts.output = "screenshot." + opts.method_name + "." + opts.wsid + ".png"

    token = get_auth_token(opts)

    # create a new instance of the Firefox driver
    print "Creating Selenium Firefox driver..."
    driver = webdriver.Firefox()

    # get login page
    print "Retrieving KBase login web page: " + opts.url + " ..."
    driver.get(opts.url)

    # we have to wait for the login page to be fully loaded
    WebDriverWait(driver, PAGE_LOAD_TIMEOUT).until(EC.presence_of_element_located((By.ID, "kbase_username")))
    print "Retrieved login page with title = " + driver.title

    # get username and password elements
    userElement = driver.find_element_by_id("kbase_username")
    pwdElement = driver.find_element_by_id("kbase_password")

    # login
    print "Logging into KBase narrative website..."
    userElement.send_keys(opts.user)
    pwdElement.send_keys(opts.passwd)
    userElement.submit()

    # we have to wait until the narrative page has loaded
    WebDriverWait(driver, PAGE_LOAD_TIMEOUT).until(EC.presence_of_element_located((By.ID, "kbase-navbar")))
    print "Retrieved default narrative, ready for testing."

    workspaceTest = str(uuid.uuid1())
    print "Setting the current workspace to: " + opts.wsid
    command = ['ws-workspace', opts.wsid]
    proc = subprocess.Popen(command, stdout = subprocess.PIPE)
    stdout, stderr = proc.communicate()
    if stderr:
        print "ERROR: " + stderr
        sys.exit()

    print "Cloning the template workspace: " + opts.wsid + " into test workspace: " + workspaceTest
    command = ['ws-clone', '-w', opts.wsid, workspaceTest]
    proc = subprocess.Popen(command, stdout = subprocess.PIPE)
    stdout, stderr = proc.communicate()
    if stderr:
        print "ERROR: " + stderr
        sys.exit()

    output = stdout.split()
    workspaceId = output[len(output)-1]
    print "Narrative cloned successfully to: " + workspaceId
    narrativeUrl = opts.url + "/narrative/ws." + workspaceId + ".obj.1"
    print "Retrieving narrative url: " + narrativeUrl

    # Open a new window to avoid narrative popup when leaving a narrative page
    driver.execute_script("$(window.open('http://www.google.com'))")
    driver.switch_to_window(driver.window_handles[-1])
    driver.get(narrativeUrl)
    time.sleep(5)

    # we have to wait until the narrative page has loaded
    WebDriverWait(driver, PAGE_LOAD_TIMEOUT).until(EC.presence_of_element_located((By.ID, "kb-save-btn")))
    print "Identified element specific to narrative interface (kb-save-btn), narrative has been loaded."

    panel_divs = driver.find_elements_by_class_name("kb-data-list-name")
    for i,j in enumerate(panel_divs):
        if j.text == opts.method_name:
            link = j.find_element_by_link_text(opts.method_name)
            link.click()
            time.sleep(5)
            break

    params = driver.find_elements_by_class_name("select2-choice")
    for i,p in enumerate(params):
        ptype = config["params"][i]["type"]
        pval = config["params"][i]["value"]
        if ptype == "text":
            p.click()
            time.sleep(1)
            p.send_keys(pval + "\n")
        elif ptype == "dropdown":
            p.click()
            time.sleep(1)
            inputs = driver.find_elements_by_id("select2-drop")
            for i,j in enumerate(inputs):
                if j.is_displayed():
                    values = j.find_elements_by_class_name("select2-result-label")
                    for k,l in enumerate(values):
                        if l.text == pval:
                            l.click()
                            time.sleep(1)
                            break
                    else:
                        continue
                    break

    methodCount = 0
    source = driver.page_source
    for line in source.split('\n'):
        matches = re.findall('kb-cell-\S+-run', line)
        for m in matches:
            button = driver.find_element_by_id(m)
            print "  Identified 'Run' button: " + m
            button.click()
            print "  Button clicked."
            methodCount = methodCount + 1
            time.sleep(5)

    startTime = time.time()
    methodsRunning = 0
    methodsWithOutput = 0
    methodsWithError = 0
    methodsWithAlert = 0
    while(methodsWithOutput < methodCount):
        currentTime = time.time()
        if currentTime - startTime > METHOD_RUN_TIMEOUT:
            print "Timed out waiting for narrative methods to complete."
            break
        methodsRunning = 0
        methodsWithOutput = 0
        methodsWithError = 0
        methodsWithAlert = 0
        source = driver.page_source
        delimiter = 'cell text_cell border-box-sizing'
        divs = source.split(delimiter)
        for index in range(1, len(divs)):
            div = divs[index]
            if re.search('div id="kb-cell-\d+-', div) and re.search('kb-app-step-running', div):
                methodsRunning = methodsRunning + 1
            elif re.search('div id="kb-cell-out', div):
                methodsWithOutput = methodsWithOutput + 1
                if re.search('App Error', div):
                    methodsWithError = methodsWithError + 1
                elif re.search('alert-danger', div):
                    methodsWithAlert = methodsWithAlert + 1
        
    print "Total number of methods in narrative: " + str(methodCount)
    print "Methods still running: " + str(methodsRunning)
    print "Methods with output widget: " + str(methodsWithOutput)
    print "Methods with output widget and App Error: " + str(methodsWithError)
    print "Methods with output widget and Error that is not App Error: " + str(methodsWithAlert)

    driver.set_window_size(1400, 950)
    driver.execute_script("window.scrollTo(0,0);")
    driver.get_screenshot_as_file(opts.output)
    print "Saved screenshot to: " + opts.output + "\n"

    print "Done."
    driver.quit()
    return 0

if __name__ == "__main__":
    sys.exit( main(sys.argv) )
