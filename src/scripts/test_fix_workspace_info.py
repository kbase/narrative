import unittest
import fix_workspace_info as fix_ws

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