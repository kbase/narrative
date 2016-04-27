method_version_tags = ['release', 'beta', 'dev']

def check_tag(tag, raise_exception=False):
    """
    Checks if the given tag is one of "release", "beta", or "dev".
    Returns a boolean.
    if raise_exception == True and the tag is bad, raises a ValueError
    """
    tag_exists = tag in method_version_tags
    if not tag_exists and raise_exception:
        raise ValueError("Can't find tag %s - allowed tags are %s" % (tag, ", ".join(method_version_tags)))
    else:
        return tag_exists