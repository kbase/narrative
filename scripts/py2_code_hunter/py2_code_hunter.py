import sys
import requests
import argparse
import json
from biokbase.workspace.client import Workspace
import biokbase.workspace.baseclient as baseclient

DEFAULT_OUTPUT_FILE = "code_search_results.json"

def find_all_narrative_py2_code(ws_url:str, auth_url:str, token:str, max_id:int, outfile:str):
    assert(ws_url)
    assert(auth_url)
    assert(token)

    user_id = _get_user_id(auth_url, token)
    ws = Workspace(url=ws_url, token=token)
    all_results = {
        "fail": []
    }

    for ws_id in range(1, max_id):
        try:
            result = _find_narrative_py2_code(ws_id, user_id, ws, verbose=True)
        except baseclient.ServerError as e:
            if "No workspace with id" in str(e):
                print(f"WS: {ws_id} does not exist")
            all_results["fail"].append({"id": ws_id, "error": str(e.message)})
    print(f"Done. Results in {outfile}")
    with open(outfile, "w") as f:
        f.write(json.dumps(all_results, indent=4))

def _find_narrative_py2_code(ws_id:int, user_id:str, ws:Workspace, verbose=False):


def _get_user_id(auth_url, token):
    """
    This uses the given token to query the authentication service for information
    about the user who created the token.
    """
    token_api_url = auth_url + "/api/V2/token"
    headers = { "Authorization": token }
    r = requests.get(token_api_url, headers=headers)
    if r.status_code != requests.codes.ok:
        r.raise_for_status()
    auth_info = json.loads(r.content)
    return auth_info['user']

def parse_args(args):
    p = argparse.ArgumentParser(description=__doc__.strip())
    p.add_argument("-t", "--token", dest="token", default=None, help="Auth token for workspace admin")
    p.add_argument("-w", "--ws_url", dest="ws_url", default=None, help="Workspace service endpoint")
    p.add_argument("-a", "--auth_url", dest="auth_url", default=None, help="Auth service endpoint")
    p.add_argument("-m", "--max_id", dest="max_id", default=40000, help="Highest workspace id to scan for code")
    p.add_argument("-o", "--outfile", dest="outfile", default=DEFAULT_OUTPUT_FILE, help="Output file for results of the search")
    args = p.parse_args(args)
    if args.ws_url is None:
        raise ValueError("ws_url - the Workspace service endpoint - is required!")
    if args.auth_url is None:
        raise ValueError("auth_url - the Auth service endpoint - is required!")
    if args.token is None:
        raise ValueError("token - a valid Workspace admin auth token - is required!")
    return args

def main(args):
    args = parse_args(args)
    return find_narrative_py2_code(args.ws_url, args.auth_url, args.token, args.max_id, args.outfile)

if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
