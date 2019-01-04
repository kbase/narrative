import re
from biokbase.workspace.baseclient import ServerError

class PermissionsError(ServerError):
    """Raised if user does not have permission to
    access the workspace.
    """
    @staticmethod
    def is_permissions_error(err):
        """Try to guess if the error string is a permission-denied error
        for the narrative (i.e. the workspace the narrative is in).
        """
        pat = re.compile("(\s*[Uu]sers?\s*(\w+)?\s*may not \w+ workspace.*)|(\s*[Tt]oken validation failed)")
        return pat.search(err) is not None

    def __init__(self, name=None, code=None, message=None, **kw):
        ServerError.__init__(self, name, code, message, **kw)


