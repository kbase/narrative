import unittest
import mock
import json
import fix_workspace_info as fix_ws
from biokbase.workspace.baseclient import ServerError

FAKE_ADMIN_ID = "fakeadmin"
FAKE_WS_FILE = "fake_workspace_db.json"

class MockWorkspace(object):
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
        self.url = url
        self.token = token
        self.fake_ws_db = self._build_fake_workspace_db()
        self.max_ws_id = len(self.fake_ws_db.keys())

    def _build_fake_workspace_db(self):
        with open(FAKE_WS_FILE, "r") as f:
            fake_ws_db = json.loads(f.read().strip())
        return fake_ws_db

    def _check_ws_id(self, ws_id):
        if ws_id > self.max_ws_id:
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
            return {'data': [self.fake_ws_db[str()]]}

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
            args = fix_ws.parse_args(input_args)
            self.assertEqual(args.token, token)
            self.assertEqual(args.auth_url, auth_url)
            self.assertEqual(args.ws_url, ws_url)
        for bad_args in bad_args_set:
            with self.assertRaises(ValueError) as e:
                fix_ws.parse_args(bad_args[0])
            self.assertIn(bad_args[1], str(e.exception))

    def test__admin_update_metadata(self):
        ws = MockWorkspace()
        new_meta = {'foo': 'bar'}

        ws_id = 1
        fix_ws._admin_update_metadata(ws, FAKE_ADMIN_ID, ws_id, new_meta)
        self.assertEqual(ws.fake_ws_db[str(ws_id)]["ws_info"][8]['foo'], 'bar')
        self.assertNotIn(FAKE_ADMIN_ID, ws.administer({
            'command': 'getPermissionsMass',
            'params': {
                'workspaces': [{'id': ws_id}]
            }
        })['perms'][0])

        ws_id = 3
        fix_ws._admin_update_metadata(ws, FAKE_ADMIN_ID, ws_id, new_meta)
        self.assertEqual(ws.fake_ws_db[str(ws_id)]["ws_info"][8]['foo'], 'bar')
        self.assertEqual(ws.administer({
            'command': 'getPermissionsMass',
            'params': {
                'workspaces': [{'id': ws_id}]
            }
        })['perms'][0].get(FAKE_ADMIN_ID), 'r')