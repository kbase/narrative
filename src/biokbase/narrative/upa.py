"""
This is a reasonably tiny API for serializing and deserializing UPAs for storage in Narrative
documents.

"""

import re
from app_util import system_variable

external_tag = "&"


def is_upa(upa):
    """
    Returns True if the given upa string is valid, False, otherwise.
    """
    return re.match("^\d+(\/\d+){2}(;\d+(\/\d+){2})*$", upa) is not None


def is_ref(ref):
    """
    Returns True if the given string is a reference or upa, False otherwise.
    That is, if it has this structure:
    blahblah/blahblah
    or
    1/2
    or
    1/2/3
    or
    blahblah/blahblah/1
    """
    if is_upa(ref):
        return True
    else:
        split_path = ref.split(";")
        for sub_ref in split_path:
            c = sub_ref.count("/")
            if c < 1 or c > 2:
                return False
        return True


def _prepare_upa_serialization(upa):
    if isinstance(upa, list):
        upa = ";".join(upa)
    if not is_upa(upa):
        raise ValueError('"{}" is not a valid UPA. It may have already been serialized.'
                         .format(upa))
    return upa


def serialize(upa):
    """
    Serializes an UPA - prepares it for storage as a part of Narrative cell metadata.
    This means a bit of a tweak to the UPA itself. Currently, we want to store it in a way
    that designates it as a serialized string, and gives an easy path to substitute the
    initial workspace part of the UPA with a different workspace.
    So it gets transformed from:
    ws1/obj1/ver1;ws2/obj2/ver2;...
    to
    [ws1]/obj1/ver1;ws2/obj2/ver2;...

    If the passed upa is not properly formatted, this will raise a ValueError.
    """
    upa = _prepare_upa_serialization(upa)
    return re.sub("^(\d+)\/", r"[\1]/", upa)


def serialize_external(upa):
    """
    In the case of UPAs representing objects that are located in a different workspace all
    together (e.g. set items that aren't copied into the Narrative with the set container
    object), they get flagged with a special character. In that case, the UPA is maintained,
    but transformed into:
    &ws1/obj1/ver1;ws2/obj2/ver2;...

    This is an explicit method for handling that serialization. Deserialization of both is handled
    by the deserialize function.

    If the passed upa is not properly formatted, this will raise a ValueError.
    """
    upa = _prepare_upa_serialization(upa)
    return external_tag + upa


def deserialize(serial_upa):
    """
    Deserializes a serialized UPA to one that is valid for use with the Workspace (or other
    services that consume Workspace objects).
    A serialized UPA is either of the form:
    [ws]/obj/ver;ws/obj/ver;...
    or
    &ws/obj/ver;ws/obj/ver
    In the [ws] case, the current workspace id replaces that whole token. In the &ws case,
    the & tag is removed.
    """
    if not isinstance(serial_upa, basestring):
        raise ValueError("Can only deserialize UPAs from strings.")
    if serial_upa.startswith(external_tag):
        deserial = serial_upa[len(external_tag):]
    else:
        ws_id = system_variable("workspace_id")
        if ws_id is None:
            raise RuntimeError("Currently loaded workspace is unknown! Unable to deserialize UPA.")
        deserial = re.sub("^\[(\d+)\]\/", str(ws_id) + "/", serial_upa)
    if not is_upa(deserial):
        raise ValueError('Deserialized UPA: "{}" is invalid!'.format(deserial))
    return deserial
