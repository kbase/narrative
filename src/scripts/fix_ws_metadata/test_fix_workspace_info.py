import unittest
import mock
import json
from . import fix_workspace_info
from biokbase.workspace.baseclient import ServerError
from requests.exceptions import HTTPError

FAKE_ADMIN_ID = "fakeadmin"
FAKE_WS_FILE = "fake_workspace_db.json"
FAKE_WS_DB = dict()

def reset_fake_ws_db():
    global FAKE_WS_DB
    with open(FAKE_WS_FILE, "r") as f:
        FAKE_WS_DB = json.loads(f.read().strip())

def mocked_requests_get(*args, **kwargs):
    class MockResponse:
        def __init__(self, data, status_code):
            self.status_code = status_code
            self.content = data
        def raise_for_status(self):
            raise HTTPError(response="Unauthorized")

    if args[0].endswith('/api/V2/token') and 'Authorization' in kwargs['headers']:
        tok = kwargs['headers']['Authorization']
        if 'good' in tok:
            return MockResponse(json.dumps({'user': FAKE_ADMIN_ID}), 200)
        else:
            return MockResponse('Bad!', 401)

class MockWorkspace:
    """
    Some rules for the mock, for each "workspace" by workspace id.
    ws1 - 0 narratives, no metadata
        - should do nothing
    ws2 - 1 narrative, 1 cell, proper metadata
        - should add num cells
    ws3 - 1 narrative, 2 cells, meta name doesn't match, marked temporary
        - should fix meta name to be "Test3", set temporary="false"
        - admin has r permission (should get reset to r)
    ws4 - 1 narrative, 1 cell - markdown, tagged non-temp
        - should add num cells, do nothing else
        - admin has a permission (shouldn't get changed)
    ws5 - 2 narratives, metadata set to one of them
        - should do nothing
    """

    def __init__(self, url=None, token=None):
        global FAKE_WS_DB
        self.url = url
        self.token = token
        self.fake_ws_db = FAKE_WS_DB
        self.max_ws_id = len(self.fake_ws_db.keys())

    def _check_ws_id(self, ws_id):
        if str(ws_id) not in self.fake_ws_db:
            raise ServerError('JSONRPCError', -32500, 'No workspace with id {} exists'.format(ws_id))

    def administer(self, params):
        cmd = params['command']
        cmd_params = params['params']
        if cmd == 'listObjects':
            ws_id = cmd_params['ids'][0]
            self._check_ws_id(ws_id)
            objs = self.fake_ws_db[str(ws_id)]['objects']
            infos = [o['info'] for o in objs.values()]
            return infos

        elif cmd == 'getWorkspaceInfo':
            ws_id = cmd_params['id']
            self._check_ws_id(ws_id)
            return self.fake_ws_db[str(ws_id)]['ws_info']

        elif cmd == 'getObjects':
            # we know there's only one...
            obj_ref = cmd_params['objects'][0]['ref']
            (ws_id, obj_id) = obj_ref.split('/')
            self._check_ws_id(ws_id)
            return {'data': [self.fake_ws_db[str(ws_id)]['objects'][str(obj_id)] ]}

        elif cmd == 'getPermissionsMass':
            # again, we know there's only one being checked
            ws_id = cmd_params['workspaces'][0]['id']
            self._check_ws_id(ws_id)
            return {'perms': [self.fake_ws_db[str(ws_id)]['perms']]}

        elif cmd == 'setPermissions':
            ws_id = cmd_params['id']
            self._check_ws_id(ws_id)
            new_perm = cmd_params['new_permission']
            user_id = cmd_params['users'][0]
            if new_perm is None or new_perm == 'n' and user_id in self.fake_ws_db[str(ws_id)]['perms']:
                del(self.fake_ws_db[str(ws_id)]['perms'][user_id])
            else:
                self.fake_ws_db[str(ws_id)]['perms'][user_id] = new_perm

    def alter_workspace_metadata(self, params):
        ws_id = params['wsi']['id']
        self._check_ws_id(ws_id)
        new_meta = params['new']
        if self.fake_ws_db[str(ws_id)]['perms'].get(FAKE_ADMIN_ID, 'n') == 'n':
            raise ServerError('JSONRPCError', -32500, 'User {} may not alter metadata for workspace {}'.format(FAKE_ADMIN_ID, ws_id))
        self.fake_ws_db[str(ws_id)]['ws_info'][8].update(new_meta)

class TestWSInfoFix(unittest.TestCase):
    # Test command line arg combinations for errors
    def test_parse_args(self):
        token = 'abcde'
        auth_url = 'https://some/url/auth'
        ws_url = 'https://some/url/ws'
        good_args_set = [
            ['-t', token, '-a', auth_url, '-w', ws_url],
            ['--token', token, '--auth_url', auth_url, '--ws_url', ws_url],
            ['--token', token, '--auth_url', auth_url, '-w', ws_url],
            ['--token', token, '-a', auth_url, '--ws_url', ws_url],
            ['-t', token, '--auth_url', auth_url, '--ws_url', ws_url],
            ['-t', token, '-a', auth_url, '--ws_url', ws_url],
            ['-t', token, '--auth_url', auth_url, '-w', ws_url]
        ]
        bad_args_set = [
            [['-t', token, '-a', auth_url], "ws_url - the Workspace service endpoint - is required!"],
            [['-a', auth_url, '-w', ws_url], "token - a valid Workspace admin auth token - is required!"],
            [['-t', token, '-w', ws_url], "auth_url - the Auth service endpoint - is required!"]
        ]
        for input_args in good_args_set:
            args = fix_workspace_info.parse_args(input_args)
            self.assertEqual(args.token, token)
            self.assertEqual(args.auth_url, auth_url)
            self.assertEqual(args.ws_url, ws_url)
        for bad_args in bad_args_set:
            with self.assertRaises(ValueError) as e:
                fix_workspace_info.parse_args(bad_args[0])
            self.assertIn(bad_args[1], str(e.exception))

    def test__admin_update_metadata(self):
        reset_fake_ws_db()
        ws = MockWorkspace()
        new_meta = {'foo': 'bar'}

        ws_id = 1
        fix_workspace_info._admin_update_metadata(ws, FAKE_ADMIN_ID, ws_id, new_meta)
        self.assertEqual(ws.fake_ws_db[str(ws_id)]["ws_info"][8]['foo'], 'bar')
        self.assertNotIn(FAKE_ADMIN_ID, ws.administer({
            'command': 'getPermissionsMass',
            'params': {
                'workspaces': [{'id': ws_id}]
            }
        })['perms'][0])

        ws_id = 3
        fix_workspace_info._admin_update_metadata(ws, FAKE_ADMIN_ID, ws_id, new_meta)
        self.assertEqual(ws.fake_ws_db[str(ws_id)]["ws_info"][8]['foo'], 'bar')
        self.assertEqual(ws.administer({
            'command': 'getPermissionsMass',
            'params': {
                'workspaces': [{'id': ws_id}]
            }
        })['perms'][0].get(FAKE_ADMIN_ID), 'r')

    @mock.patch('src.scripts.fix_ws_metadata.fix_workspace_info.requests.get', side_effect=mocked_requests_get)
    def test__get_user_id(self, request_mock):
        userid = fix_workspace_info._get_user_id('some_endpoint', 'goodtoken')
        self.assertEqual(userid, FAKE_ADMIN_ID)
        with self.assertRaises(HTTPError):
            fix_workspace_info._get_user_id('some_endpoint', 'badtoken')

    @mock.patch('src.scripts.fix_ws_metadata.fix_workspace_info.requests.get', side_effect=mocked_requests_get)
    @mock.patch('src.scripts.fix_ws_metadata.fix_workspace_info.Workspace')
    def test_fix_all_workspace_info(self, ws_mock, request_mock):
        reset_fake_ws_db()
        fake_ws = MockWorkspace()
        fix_workspace_info.Workspace = MockWorkspace
        with self.assertRaises(HTTPError):
            fix_workspace_info.fix_all_workspace_info('fake_ws', 'fake_auth', 'bad_token')

        fix_workspace_info.fix_all_workspace_info('fake_ws', 'fake_auth', 'good_token')
        # TODO: add actual tests for results of "database"
        # ws1 - no change to metadata
        self.assertEqual(fake_ws.fake_ws_db['1']['ws_info'][8], {})

        # ws2 - add cell_count = 1
        self.assertEqual(fake_ws.fake_ws_db['2']['ws_info'][8], {
            'is_temporary': 'false',
            'narrative': '1',
            'narrative_nice_name': 'Test',
            'cell_count': '1',
            'searchtags': 'narrative'
        })

        # ws3 - not temp, fix name, add num-cells
        self.assertEqual(fake_ws.fake_ws_db['3']['ws_info'][8], {
            'is_temporary': 'false',
            'narrative': '1',
            'narrative_nice_name': 'Test3',
            'cell_count': '2',
            'searchtags': 'narrative'
        })

        # ws4 - not temp, 1 cell
        self.assertEqual(fake_ws.fake_ws_db['4']['ws_info'][8], {
            'is_temporary': 'false',
            'narrative': '1',
            'narrative_nice_name': 'Test4',
            'cell_count': '1',
            'searchtags': 'narrative'
        })

        # ws5 - add num cells. even though there's > 1, it's configured.
        self.assertEqual(fake_ws.fake_ws_db['5']['ws_info'][8], {
            'is_temporary': 'false',
            'narrative': '1',
            'narrative_nice_name': 'Test5'
        })

        #ws6 - fix id, add cell count
        self.assertEqual(fake_ws.fake_ws_db['6']['ws_info'][8], {
            'is_temporary': 'false',
            'narrative': '3',
            'narrative_nice_name': 'Test6',
            'cell_count': '1',
            'searchtags': 'narrative'
        })

        # ws7 - fix id, cell count
        self.assertEqual(fake_ws.fake_ws_db['7']['ws_info'][8], {
            'is_temporary': 'false',
            'narrative': '3',
            'narrative_nice_name': 'Test7',
            'cell_count': '1',
            'searchtags': 'narrative'
        })
