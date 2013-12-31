"""
Root of all services.

"""
__author__ = 'Dan Gunter <dkgunter@lbl.gov>'
__date__ = '12/11/13'

import biokbase.narrative.common.service as service
# load all modules in services dir (see services/__init__.py),
# which will register themselves on import
from biokbase.narrative.services import *
