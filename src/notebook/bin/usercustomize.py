#
# This is a file to deal with bad behavior introduced by setuptools that overrides
# the PYTHONPATH settings.
# see http://python.6.x6.nabble.com/Weird-PYTHONPATH-etc-issue-td4989274.html
import os
import sys
basepath = os.path.dirname(os.path.abspath(__file__))
#sys.path = [ basepath, basepath+"/KBNB"] + sys.path 

