"""Utils for implementing the KBase Narrative manager."""


def base_model(name, path):
    """Build the common base of a contents model."""
    return {
        "name": name,
        "path": path,
        "last_modified": "00-00-0000",
        "created": "00-00-0000",
        "content": None,
        "format": None,
        "mimetype": None,
        # XXX - if this is a "real" path to a narrative, it should
        # look up the narrative and see if it's really writable.
        # For now, assume it's not, and set it otherwise.
        "writable": False,
        "type": None,
    }
