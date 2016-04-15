"""
Narrative exporter
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

from traitlets.config import Config
from nbconvert import HTMLExporter, PDFExporter
from biokbase.workspace.client import Workspace
from biokbase.narrative.common.url_config import URLS
from .preprocessor import NarrativePreprocessor
from biokbase.narrative.narrativeio import KBaseWSManagerMixin as NarrativeIO
import nbformat
import json
import os

class NarrativeExporter():
    def __init__(self):
        c = Config()
        c.HTMLExporter.preprocessors = [NarrativePreprocessor]
        c.TemplateExporter.template_path = ['.', self._narrative_template_path()]
        c.CSSHTMLHeaderPreprocessor.enabled = True
        self.html_exporter = HTMLExporter(config=c)
        self.html_exporter.template_file = 'narrative'
        self.ws_client = Workspace(URLS.workspace)

    def _narrative_template_path(self):
        return os.path.join(os.environ.get('NARRATIVE_DIR', '.'), 'src', 'biokbase', 'narrative', 'exporter', 'templates')

    def export_narrative(self, narrative_ref, output_file):
        narr_fetcher = NarrativeIO()

        nar = narr_fetcher.read_narrative(narrative_ref)['data']

        # # 1. Get the narrative object
        # # (put in try/except)
        # # (should also raise an error if narrative is not public)
        # nar = self.ws_client.get_objects([{'ref': narrative_ref}])

        # # put in separate try/except
        # nar = nar[0]['data']

        # 2. Convert to a notebook object
        kb_notebook = nbformat.reads(json.dumps(nar), as_version=4)

        # 3. make the thing
        (body, resources) = self.html_exporter.from_notebook_node(kb_notebook)

        with open(output_file, 'w') as output_html:
            output_html.write(body)