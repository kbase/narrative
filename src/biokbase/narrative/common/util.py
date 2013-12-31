"""
Utility code for biokbase/narrative
"""
__author__ = ["Dan Gunter <dkgunter@lbl.gov>", "William Riehl <wjriehl@lbl.gov>"]
__version__ = "0.0.1"

import os, sys
from setuptools import Command

class BuildDocumentation(Command):
    """Setuptools command hook to build Sphinx docs
    """
    description = "build Sphinx documentation"
    user_options = []

    def initialize_options(self):
        self.doc_dir = "biokbase-doc"

    def finalize_options(self):
        pass

    def run(self):
        filedir = os.path.dirname(os.path.realpath(__file__))
        p = filedir.find("/biokbase/")
        top = filedir[:p + 1]
        doc = top + self.doc_dir
        os.chdir(doc)
        os.system("make html")