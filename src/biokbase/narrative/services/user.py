"""
The goal of this file is to provide a service that deals with user interactions with other users.
It will provide some truth as to whether to trust another user's Narratives, and some kernel-side
knowledge about whether what teams or groups or labs (or whatever the term will be) that a user
is on.

(3/19/2018) For now, it's just a stub.
"""

__author__ = "Bill Riehl <wjriehl@lbl.gov>"


class UserService(object):
    def __init__(self):
        pass

    def is_trusted_user(self, user):
        # TODO: once we have a concept of user groups, teams, labs, etc., this will be more
        # generally useful and interesting.
        # For now, as a no op, return True
        return True
