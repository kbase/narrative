"""
Narrative preprocessor for nbconvert exporting
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'


from nbconvert.preprocessors import Preprocessor

class NarrativePreprocessor(Preprocessor):
    """
    A KBase Narrative specific pre-processor.
    Right now it simply extracts the narrative title and
    provides it as a resource under resources['kbase']['title']

    Something to build on!
    """

    def __init__(self, **kw):
        super(NarrativePreprocessor, self).__init__(**kw)
        self.host = 'https://narrative-dev.kbase.us'

    def preprocess(self, nb, resources):
        resources['kbase'] = {'title': nb['metadata']['name'], 'host': self.host }
        return nb, resources