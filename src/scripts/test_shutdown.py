"""
Very very simplistic tester for the narrative_shutdown REST call.

This authenticates a user with a valid token, then tries 3 things:
1. Test shutting down without sending credentials
2. Test shutting down another user's container with creds
3. Test shutting down the user's container with creds.

TODO:
 - have it spin up a narrative instance first
 - wrap this in an actual Pythonic unittest apparatus

Bill Riehl <wjriehl@lbl.gov>
2/2/2015
"""

import argparse
import requests
import json
import sys

DEFAULT_HOST = "narrative-dev"
DEFAULT_USER = "kbasetest"
DEFAULT_WRONG_USER="wstester1"
DELETE_CMD = "narrative_shutdown"

def main(args):
    url = "https://{}.kbase.us".format(args.host_url)

    # 1. get an auth token and cookie-ize it
    login_payload = {'user_id': args.user, 
                     'password': args.pw, 
                     'cookie': 1,
                     'fields': 'name,kbase_sessionid,user_id,token'}
    r = requests.post("https://kbase.us/services/authorization/Sessions/Login", data=login_payload)
    res = json.loads(r.content)

    formatted_token = res['token'].replace('|', 'PIPESIGN').replace('=', 'EQUALSSIGN')
    cookie_string = 'un%3D{}%7Ckbase_sessionid%3D{}%7Cuser_id%3D{}%7Ctoken%3D{}'.format(res['user_id'], 
                                                                                        res['kbase_sessionid'], 
                                                                                        res['user_id'], 
                                                                                        formatted_token)
    # 2. test unauthorized
    print "Testing shutdown without authentication"
    r = requests.delete("{}/{}/{}".format(url, DELETE_CMD, args.user))
    print(r.content)

    # 3. test authenticated, wrong user
    print "Testing shutdown of another user's container"
    auth_cookie = dict(kbase_session=cookie_string)
    r = requests.delete("{}/{}/{}".format(url, DELETE_CMD, args.wrong_user), cookies=auth_cookie)
    print(r.content)

    # 4. test authenticated, correct user
    print "Testing valid shutdown of user's container"
    r = requests.delete("{}/{}/{}".format(url, DELETE_CMD, args.user), cookies=auth_cookie)
    print(r.content)

def parse_args():
    p = argparse.ArgumentParser(description=__doc__.strip())
    p.add_argument("-u", "--testuser", dest="user", default=DEFAULT_USER, help="User to use for authenticated test (default=%(default)s)")
    p.add_argument("-p", "--password", dest="pw", default=None, help="Test user password -- REQUIRED")
    p.add_argument("-w", "--wronguser", dest="wrong_user", default=DEFAULT_WRONG_USER, help="User for attempting disallowed shutdown (default=%(default)s)")
    p.add_argument("-H", "--hosturl", dest="host_url", default=DEFAULT_HOST, help="Name of host to test on (e.g. narrative-dev) (default=%(default)s)")

    args = p.parse_args()
    if args.pw is None:
        print 'A password is required for user "{}". Not testing.'.format(args.user)
        sys.exit(0)
    return args

if __name__ == '__main__':
    sys.exit(main(parse_args()))