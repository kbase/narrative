"""
Some functions to play around with things.
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'
__date__ = '9/30/14'

## Imports
# Stdlib
import json
# Local
import biokbase.narrative.common.service as service
from biokbase.narrative.common.service import init_service, method, finalize_service

## Globals
VERSION = (0, 0, 1)
NAME = "Bill Test"

# Initialize
init_service(name=NAME, desc="Bill Demo!", version=VERSION)


@method(name="Try some Perl")
def _try_perl(meth):
    """Run a Perl command. Maybe. 
    
    :return: A string
    :rtype: kbtypes.Unicode
    """
    meth.stages = 2  # for reporting progress
    meth.advance("Starting...")

    from IPython import get_ipython
    ipy = get_ipython()

    meth.advance("Running")
    ipy.run_cell_magic('perl', 
                       '--out perl_lines', 
                       'use JSON;'
                       'my $token = $ENV{"KB_AUTH_TOKEN"};'
                       'my @arr = ("foo", "bar", "baz");'
                       'my $foo;'
                       '$foo->{"what"}=\@arr;'
                       '$foo->{"token"}=$token;'
                       'print encode_json($foo);')
    
    res = ipy.user_variables(['perl_lines'])['perl_lines']['data']['text/plain'][1:-1]
    res = json.loads(res)
    return json.dumps({'lines' : res})



# Finalize (registers service)
finalize_service()
