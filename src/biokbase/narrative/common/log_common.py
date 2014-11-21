"""
Common stuff for kbase logging
"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '11/20/14'

# Constants
EVENT_MSG_SEP = ';'  # separates event name from msg in log

def format_event(event, mapping):
    return "{}{}{}".format(event, EVENT_MSG_SEP, format_kvps(mapping))

def format_kvps(mapping, prefix=''):
    """Formats a mapping as key=value pairs.

    Values may be strings, numbers, or nested mappings.
    Nested mappings, e.g. host:{ip:'0.0.0.1',name:'the.dude.abides'},
    will be handled by prefixing keys in the sub-mapping with the key,
    e.g.: host.ip=0.0.0.1 host.name=the.dude.abides.
    """
    kvp_list = []
    for k, v in mapping.iteritems():
        if hasattr(v, 'keys'):  # nested mapping
            new_prefix = prefix + '.' + k if prefix else k
            kvps = format_kvps(v, prefix=new_prefix) # format as string
            kvp_list.append(kvps)
            continue # already prefixed with key; go to next
        if isinstance(v, int) or isinstance(v, float):
            v = "{}".format(v)
        elif ' ' in v:
            v = '"' + v.replace('"', '\\"') + '"'
        if prefix:
            k = prefix + "." + k
        kvp_list.append("{}={}".format(k, v))
    return " ".join(kvp_list)
