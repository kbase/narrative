"""
Describes a Narrative Ref and has utilities for dealing with it.
"""
import biokbase.narrative.clients as clients
from biokbase.workspace.baseclient import ServerError
from exceptions import PermissionsError

class NarrativeRef(object):
    def __init__(self, ref):
        """
        :param ref: dict with keys wsid, objid, ver (either present or None)
        wsid is required, this will raise a ValueError if it is not present, or not a number
        objid, while required, can be gathered from the wsid. If there are problems with
        fetching the objid, this will raise a ValueError
        ver is not required
        """
        (self.wsid, self.objid, self.ver) = (ref.get("wsid"), ref.get("objid"), ref.get("ver"))
        try:
            self.wsid = int(self.wsid)
        except ValueError:
            raise ValueError("A numerical Workspace id is required for a Narrative ref, not {}".format(self.wsid))

        if self.ver is not None:
            try:
                self.ver = int(self.ver)
            except ValueError:
                raise ValueError("If ver is present in the ref, it must be numerical, not {}".format(self.ver))
        if self.objid is not None:
            try:
                self.objid = int(self.objid)
            except ValueError:
                raise ValueError("objid must be numerical, not {}".format(self.objid))
        else:
            self.objid = self._get_narrative_objid()

    def __str__(self):
        ref_str = "{}/{}".format(self.wsid, self.objid)
        if self.ver is not None:
            ref_str = ref_str + "/{}".format(self.ver)
        return ref_str

    def __eq__(self, other):
        return self.wsid == other.wsid and \
               self.objid == other.objid and \
               self.ver == other.ver

    def _get_narrative_objid(self):
        """
        Attempts to find the Narrative object id given a workspace id.
        This is only called on the internal wsid, which must be an int.
        Can raise:
            - PermissionsError
                - if the current user doesn't have access to that workspace
            - RuntimeError
                - if there's anything wrong with the workspace metadata that's
                  supposed to contain the narrative object id (either missing
                  or not an int)
            - ServerError
                - if anything else bad happens from the Workspace
        """
        objid = None
        try:
            ws_meta = clients.get("workspace").get_workspace_info({"id": self.wsid})[8]
            objid = int(ws_meta.get("narrative"))
            return objid
        except (ValueError, TypeError):
            raise RuntimeError(
                "Expected an integer while looking up the Narrative id, "
                "got '{}'".format(ws_meta.get("narrative")))
        except ServerError as err:
            raise self._ws_err_to_perm_err(err)

    def _ws_err_to_perm_err(self, err):
        if PermissionsError.is_permissions_error(err.message):
            return PermissionsError(name=err.name, code=err.code,
                                    message=err.message, data=err.data)
        else:
            return err
