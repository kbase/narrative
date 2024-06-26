"""Some tests for the User Service module.

A stubby no-op now. But putting this in so we have some boilerplate to update when we get to that
phase of the project.
"""

import unittest

from biokbase.narrative.services.user import UserService


class UserServiceTestCase(unittest.TestCase):
    def test_user_trust(self):
        us = UserService()
        assert us.is_trusted_user("anybody")
