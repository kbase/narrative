"""
REST client for the Globus Online identity management service (Globus Nexus).

Supports three methods of authentication:
    - username and password
    - oauth (deprecated)
    - goauth (new oauth based authentication service)

Username and password may be appropriate for testing, but goauth is the
recommended auth method going forward. Use nexus.client.NexusClient
request_client_credential or get_access_token_from_code to obtain an
access token.

TODO: refactor and merge with NexusClient.
"""
__author__ = 'Mattias Lidman'

import logging
import json
import urllib
import httplib2
import time
from oauth2 import Request as OAuthRequest
from oauth2 import SignatureMethod_HMAC_SHA1, Consumer, generate_nonce
import pprint

class GlobusOnlineRestClient():
    # NOTE: GraphRestClient would be more accurate, but if we want to release 
    # this publically GlobusOnlineRestClient is probably a more pedagogical name.

    def __init__(self, go_host, username=None, password=None,
                 oauth_secret=None, goauth_token=None):
        # Initial login supported either using username+password or
        # username+oauth_secret. The client also supports unauthenticated calls.
        if not go_host.startswith('http'):
            # Default to https
            go_host = 'https://' + go_host
        self.go_host = go_host
        self.oauth_secret = oauth_secret
        self.goauth_token = goauth_token
        self.session_cookies = {}
        self.default_password = 'sikrit' # Don't tell anyone.
        self.current_user = None
        if username:
            if oauth_secret:
                self.username_oauth_secret_login(username, oauth_secret)
            elif goauth_token:
                self.username_goauth_token_login(username, goauth_token)
            else:
                self.username_password_login(username, password=password)

    # GROUP OPERATIONS
    def get_group_list(self, root_id=None, depth=1):
        root_id_str = '' if not root_id else str(root_id)
        depth_str = '' if not depth else str(depth)
        url = '/groups/list?depth=' + depth_str + '&root=' + root_id_str 
        return self._issue_rest_request(url)

    def get_group_summary(self, gid):
        url = '/groups/' + gid
        return self._issue_rest_request(url)

    def get_group_members(self, gid):
        url = '/groups/' + gid + '/members'
        return self._issue_rest_request(url)

    def get_group_member(self, gid, username):
        url = '/groups/' + gid + '/members/' + username
        return self._issue_rest_request(url)

    def get_group_policies(self, gid):
        url = '/groups/' + gid + '/policies'
        return self._issue_rest_request(url)

    def get_group_email_templates(self, gid):
        # Returned document does not include the message of each template. 
        # Use get_group_email_template for that.
        url = '/groups/' + gid + '/email_templates'
        return self._issue_rest_request(url)

    def get_group_email_template(self, gid, template_id):
        # Get a single email template, including message. The template_id can
        # be gotten by using get_group_email_templates.
        url = '/groups/' + gid + '/email_templates/' + template_id
        return self._issue_rest_request(url)

    def get_rendered_group_email_template(self, gid, template_id):
        url = '/groups/' + gid + '/email_templates/' + template_id
        return self._issue_rest_request(url, params={'mode': 'view'})

    def post_group(self, name, description=None, parent=None, is_active=True):
        # Create a new group.
        if not description:
            description = 'A group called "' + name + '"'
        params = { 'name': name, 'description': description, 'is_active': is_active }
        if parent:
            params['parent'] = parent
        return self._issue_rest_request('/groups/', http_method='POST', params=params)

    def put_group_summary(self, gid, name=None, description=None, is_active=None):
        # Edit group. Group name, description, and whether the group is active or not
        # are the only things that can be set using this method.
        url = '/groups/' + gid
        params = {}
        if name:
            params['name'] = name
        if description:
            params['description'] = description
        if is_active:
            params['is_active'] = is_active
        return self._issue_rest_request(url, http_method='PUT', params=params)

    def put_group_policies(self, gid, policies):
        # PUT policies in dict policies. Utility function build_policy_dictionary()
        # may be used to simplify building the document.
        url = '/groups/' + gid + '/policies'
        return self._issue_rest_request(url, http_method='PUT', params=policies)

    def set_single_policy(self, gid, policy, new_policy_options):
        # Wrapper function for easily setting a single policy. For a given policy,
        # all policy options specified in new_policy_options are set to true,
        # all others to false. new_policy_options may be a string for single-value
        # policies and must be a list for multi-value policies.
        if type(new_policy_options) == str:
            new_policy_options = [new_policy_options]

        response, policies = self.get_group_policies(gid)
        existing_policy_options = policies[policy]['value']

        for policy_option in existing_policy_options.keys():
            if policy_option in new_policy_options:
                existing_policy_options[policy_option]['value'] = True
            else:
                existing_policy_options[policy_option]['value'] = False
        policies[policy]['value'] = existing_policy_options

        return self.put_group_policies(gid, policies)

    def post_group_email_templates(self, gid, params):
        # Create one or more new email templates.
        url = '/groups/' + gid + '/email_templates'
        return self._issue_rest_request(url, http_method='POST', params=params)

    def put_group_email_template(self, gid, template_id, params):
        # Update an email template.
        url = '/groups/' + gid + '/email_templates/' + template_id
        return self._issue_rest_request(url, http_method='PUT', params=params)

    # GROUP MEMBERSHIP OPERATIONS

    def post_membership(self, gid, usernames=None, emails=None):
        # POSTing a membership corresponds to inviting a user identified by a 
        # username or an email address to a group, or requesting to join a group
        # (if the actor is among the listed usernames). 
        url = '/groups/' + gid + '/members'
        params = {}
        if usernames:
            if type(usernames) == str:
                usernames = [ usernames ]
            params['users'] = usernames
        if emails:
            if type(emails) == str:
                emails = [ emails ]
            params['emails'] = emails
        return self._issue_rest_request(url, http_method='POST', params=params)

    def put_group_membership(self, gid, username, email, role, status, status_reason, 
            last_changed=None, user_details=None):
        # PUT is used for accepting invitations and making other changes to a membership.
        # The document is validated against the following schema:
        # https://raw.github.com/globusonline/goschemas/integration/member.json
        # membership_id == invite_id for purposes of accepting an invitation.

        url = '/groups/' + gid + '/members/' + username
        return self._put_group_membership(url, username, email, role, status, 
            status_reason, user_details)

    def put_group_membership_by_id(self, invite_id, username, email, role, status,     
            status_reason, last_changed=None, user_details=None):
        # put_group_membership_by_id() is used for tying an email invite to a GO user, 
        # use put_group_membership() otherwise.
        url = '/memberships/' + membership_id
        return self._put_group_membership(url, username, email, role, status, 
            status_reason, user_details)
        

    def put_group_membership_role(self, gid, username, new_role):
        response, member = self.get_group_member(gid, username)
        member['role'] = new_role
        return self.put_group_membership(
            gid,
            username,
            member['email'],
            member['role'],
            member['status'],
            member['status_reason'])
            
    def claim_invitation(self, invite_id):
        # claim_invitation ties an email invite to a GO user, and must be done
        # before the invite can be accepted.
        url = '/memberships/' + invite_id
        response, user = self.get_user(self.current_user)
        response, membership = self._issue_rest_request(url)
        membership['username'] = user['username']
        membership['email'] = user['email']
        params = {
            'username' : user['username'],
            'status' : membership['status'],
            'status_reason' : membership['status_reason'],
            'role' : membership['role'],
            'email' : user['email'],
            'last_changed' : '2007-03-01T13:00:00',
        }

        return self._issue_rest_request(url, http_method='PUT', params=params)



    def accept_invitation(self, gid, username, status_reason=None):
        return self._put_membership_status_wrapper(
            gid,
            username,
            'pending',
            'invited',
            'Only invited users can accept an invitation.')
 
    def reject_invitation(self, gid, username, status_reason=None):
        return self._put_membership_status_wrapper(
            gid,
            username,
            'rejected',
            'invited',
            'Only an invited user can reject an invitation.')
  
    def reject_pending(self, gid, username, status_reason=None):
        return self._put_membership_status_wrapper(
            gid,
            username,
            'rejected',
            'pending',
            'Only possible to reject membership for pending users.')
                   
    def approve_join(self, gid, username, status_reason=None):
        return self._put_membership_status_wrapper(
            gid,
            username,
            'active',
            'pending',
            'Only invited users can accept an invitation.')

    def suspend_group_member(self, gid, username, new_status_reason=''):
        return self._put_membership_status_wrapper(
            gid,
            username,
            'suspended',
            'active',
            'Only active members can be suspended.',
            new_status_reason)
 
    def unsuspend_group_member(self, gid, username, new_status_reason=''):
        return self._put_membership_status_wrapper(
            gid,
            username,
            'active',
            'suspended',
            'Only suspended members can be unsuspended.',
            new_status_reason)
                      

    # USER OPERATIONS

    def get_user(self, username, fields=None, custom_fields=None, use_session_cookies=False):
        # If no fields are explicitly set the following will be returned by Graph:
        # ['fullname', 'email', 'username', 'email_validated', 'system_admin', 'opt_in']
        # No custom fields are returned by default.
        
        query_params = {}
        if fields:
            query_params['fields'] = ','.join(fields)
        if custom_fields:
            query_params['custom_fields'] = ','.join(custom_fields)
        url = '/users/' + username + '?' + urllib.urlencode(query_params)
        url = '/users/' + username + '?' + urllib.urlencode(query_params)
        return self._issue_rest_request(url, use_session_cookies=use_session_cookies)

    def get_user_secret(self, username, use_session_cookies=False):
        # Gets the secret used for OAuth authentication.
        return self.get_user(username, fields=['secret'], use_session_cookies=use_session_cookies)

    def post_user(self, username, fullname, email, password, **kwargs):
        # Create a new user.
        
        accept_terms = True if not kwargs.has_key('accept_terms') else kwargs['accept_terms']
        opt_in = True if not kwargs.has_key('opt_in') else kwargs['opt_in']

        params = { 'username': username, 'fullname': fullname, 'email': email,
            'password': password, 'accept_terms' : accept_terms, 'opt_in': opt_in }

        return self._issue_rest_request('/users', 'POST', params=params)

    def put_user(self, username, **kwargs):
        # Edit existing user.
        kwargs['username'] = username
        path = '/users/' + username

        response, content = self._issue_rest_request(path, 'PUT', params=kwargs)
        return self._issue_rest_request(path, 'PUT', params = kwargs)

    def put_user_custom_fields(self, username, **kwargs):
        response, content = self.get_user(username)
        content['custom_fields'] = kwargs
        content.pop('username')
        return self.put_user(username, **content)

    def get_user_policies(self, username):
        url = '/users/' + username + '/policies'
        return self._issue_rest_request(url)

    def put_user_policies(self, username, policies):
        url = '/users/' + username + '/policies'
        return self._issue_rest_request(url, http_method='PUT', params=policies)

    def put_user_membership_visibility(self, username, new_visibility):
        response, policies = self.get_user_policies(username)
        visibility_policy = policies['user_membership_visibility']['value']
        for policy_option in visibility_policy.keys():
            visibility_policy[policy_option]['value'] = policy_option == new_visibility
        policies['user_membership_visibility']['value']
        response, content = self.put_user_policies(username, policies)
        return response, content

    def simple_create_user(self, username, accept_terms=True, opt_in=True):
        # Wrapper function that only needs a username to create a user. If you
        # want full control, use post_user instead.
        fullname = username.capitalize() + ' ' + (username + 'son').capitalize()
        email = username + '@' + username + 'son.com'
        password = self.default_password
        return self.post_user(username, fullname, email, password, 
            accept_terms=accept_terms, opt_in=opt_in)

    def delete_user(self, username):
        path = '/users/' + username 
        return self._issue_rest_request(path, 'DELETE')

    def username_password_login(self, username, password=None):
        # After successful username/password authentication the user's OAuth secret
        # is retrieved and used in all subsequent calls until the user is logged out.
        # If no username is provided, authentication will be attempted using the default
        # password used by the simple_create_user() method.
        path = '/authenticate'
        if not password:
            password = self.default_password
        params = {'username': username, 'password': password}
        response, content = self._issue_rest_request(path, http_method='POST', 
            params=params, use_session_cookies=True)
        if response['status'] != '200':
            return response, content
        # Also get user secret so that subsequent calls can be made using OAuth:
        secret_response, secret_content = self.get_user_secret(username, use_session_cookies=True)
        if secret_response['status'] != '200':
            raise UnexpectedRestResponseError(
                "Could not retrieve user secret.")
        self.oauth_secret = secret_content['secret']
        self.current_user = username
        self.session_cookies = None
        return response, content

    def username_oauth_secret_login(self, username, oauth_secret):
        # login_username_oauth_secret() tries to retrieve username's user object
        # using the provided oauth_secret. If succesfull, the username and 
        # oauth_secret will be used for all subsequent calls until user is logged
        # out. The result of the get_user() call is returned.
        old_oauth_secret = self.oauth_secret
        old_current_user = self.current_user
        self.oauth_secret = oauth_secret
        self.current_user = username
        response, content = self.get_user(username)
        if response['status'] != '200':
            self.oauth_secret = old_oauth_secret
            self.current_user = old_current_user
        return response, content

    def username_goauth_token_login(self, username, goauth_token):
        old_goauth_token = self.goauth_token
        old_current_user = self.current_user
        self.goauth_token = goauth_token
        self.current_user = username
        response, content = self.get_user(username)
        if response['status'] != '200':
            self.goauth_token = old_goauth_token
            self.current_user = old_current_user
        return response, content

    def logout(self):
        response, content = self._issue_rest_request('/logout')
        self.current_user = None
        self.session_cookies = None
        self.oauth_secret = None
        return response, content

    def post_email_validation(self, validation_code):
        url = '/validation'
        params = {'validation_code': validation_code}
        return self._issue_rest_request(url, http_method='POST', params=params)

    # UTILITY FUNCTIONS

    def build_policy_dictionary(self, **kwargs):
        # Each kwargs must be a dictionary named after a policy, containing policy 
        # options and values. For example:
        #    approval = { 'admin': True, 'auto_if_admin': False, 'auto': False, }
        # go_rest_client_tests.py contains an example setting all policies available 
        # as of this writing.
        policies = {}
        for policy in kwargs.keys():
            policy_options = {}
            policy_options_source = kwargs[policy]
            for option_key in kwargs[policy].keys():
                policy_options[option_key] = {
                    'value': kwargs[policy][option_key]
                }
            policies[policy] = {
                'value': policy_options
            }
        return policies

    def _issue_rest_request(self, path, http_method='GET', content_type='application/json',
        accept='application/json', params=None, use_session_cookies=False):
        
        http = httplib2.Http(disable_ssl_certificate_validation=True, timeout=10)
        
        url = self.go_host + path
        headers = {}
        headers['Content-Type'] = content_type
        headers['Accept'] = accept 
        # Use OAuth authentication, session cookies, or no authentication?
        if use_session_cookies:
            if self.session_cookies:
                headers['Cookie'] = self.session_cookies
        elif self.current_user and self.oauth_secret:
            auth_headers = self._get_auth_headers(http_method, url)
            # Merge dicts. In case of a conflict items in headers take precedence.
            headers = dict(auth_headers.items() + headers.items())
        elif self.current_user and self.goauth_token:
            headers["Authorization"] = "Globus-Goauthtoken %s" \
                                       % self.goauth_token

        body = None
        if params:
            if content_type == 'application/x-www-form-urlencoded':
                body = urllib.urlencode(params)
            else:
                body = json.dumps(params)
        response, content = http.request(url, http_method, headers=headers, body=body)
        
        if response.has_key('set-cookie'):
            self.session_cookies = response['set-cookie']
        if 'application/json' in response['content-type'] and content != '':
            return response, json.loads(content)
        else:
            return response, {}
    
    def _get_auth_headers(self, method, url):
        oauth_params = {
            'oauth_version': "1.0",
            'oauth_nonce': generate_nonce(),
            'oauth_timestamp': int(time.time())
        }
        oauth_request = OAuthRequest(method, url, parameters=oauth_params)
        consumer = Consumer(self.current_user, self.oauth_secret)
        oauth_request.sign_request(SignatureMethod_HMAC_SHA1(), consumer, None)
        auth_headers = oauth_request.to_header()
        auth_headers['Authorization'] = auth_headers['Authorization'].encode('utf-8')
        return auth_headers

    def _put_group_membership(self, url, username, email, role, status, status_reason, 
            user_details=None):
        params = {
            'username': username,
            'status': status,
            'status_reason': status_reason,
            'role': role,
            'email': email,
        }
        # last_changed needs to be set or validation will fail, but the value 
        # will get overwritten by Graph anyway.
        params['last_changed'] = '2007-03-01T13:00:00'
        if user_details:
            params['user'] = user_details
        return self._issue_rest_request(url, http_method='PUT', params=params)

    def _put_membership_status_wrapper(self, gid, username, new_status, expected_current, 
            transition_error_message, new_status_reason=''):
        response, member = self.get_group_member(gid, username)
        if member['status'] != expected_current:
            raise StateTransitionError(member['status'], new_status,
                transition_error_message)
        member['status'] = new_status
        member['status_reason'] = new_status_reason
        return self.put_group_membership(
            gid,
            username,
            member['email'],
            member['role'],
            member['status'],
            member['status_reason'])

 
class StateTransitionError(Exception):
    def __init__(self, prev_state, next_state, message):
        self.message = "Can't transition from '" + prev_state + "' to '" + next_state + "'. " + message

    def __str__(self):
        return self.message

class UnexpectedRestResponseError(Exception):
    def __init__(self, message):
        self.message = message

    def __str__(self):
        return self.message
