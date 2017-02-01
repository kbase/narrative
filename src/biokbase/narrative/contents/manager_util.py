"""
Utils for implementing the KBase Narrative manager
"""

def base_model(name, path):
    """Build the common base of a contents model"""

    model = {}
    model['name'] = name #path.rsplit('/', 1)[-1]
    model['path'] = path
    model['last_modified'] = "00-00-0000"
    model['created'] = "00-00-0000"
    model['content'] = None
    model['format'] = None
    model['mimetype'] = None
    # XXX - if this is a "real" path to a narrative, it should
    # look up the narrative and see if it's really writable.
    # For now, assume its not, and set it otherwise.
    model['writable'] = False
    model['type'] = None

    return model
