"""
Narrative preprocessor for nbconvert exporting
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'


from nbconvert.preprocessors import Preprocessor
from pprint import pprint

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
        (nb, resources) = super(NarrativePreprocessor, self).preprocess(nb, resources)

        # Get some more stuff to show in the page into resources
        resources['kbase'] = {'title': nb['metadata']['name'],
                              'host': self.host,
                              'creator': nb['metadata']['creator'] }

        return nb, resources

    def preprocess_cell(self, cell, resources, index):
        # for output in cell.get('outputs', []):
        #     if 'application/javascript' in output.get('data', {}):
        #         output['data']['application/javascript'][]
        # outputs = print cell.get('outputs', [])
        return cell, resources