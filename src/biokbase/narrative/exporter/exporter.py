"""
Narrative exporter
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'

from traitlets.config import Config
from nbconvert import HTMLExporter, PDFExporter
from biokbase.workspace.client import Workspace
from biokbase.workspace.baseclient import ServerError
from biokbase.narrative.common.exceptions import WorkspaceError
from biokbase.narrative.common.url_config import URLS
import biokbase.narrative.exporter.preprocessor as preprocessor
from biokbase.narrative.contents.narrativeio import KBaseWSManagerMixin as NarrativeIO
import nbformat
import json
import os

class NarrativeExporter():
    def __init__(self):
        c = Config()
        c.HTMLExporter.preprocessors = [preprocessor.NarrativePreprocessor]
        c.TemplateExporter.template_path = ['.', self._narrative_template_path()]
        c.CSSHTMLHeaderPreprocessor.enabled = True
        c.NarrativePreprocessor.enabled = True
        c.ClearMetadataPreprocessor.enabled = False
        self.html_exporter = HTMLExporter(config=c)
        self.html_exporter.template_file = 'narrative'
        self.ws_client = Workspace(URLS.workspace)
        self.narr_fetcher = NarrativeIO()

    def _narrative_template_path(self):
        return os.path.join(os.environ.get('NARRATIVE_DIR', '.'), 'src', 'biokbase', 'narrative', 'exporter', 'templates')

    def export_narrative(self, narrative_ref, output_file):
        # 1. Get the Narrative object
        try:
            nar = self.narr_fetcher.read_narrative(narrative_ref)
            nar = nar['data']
            nar['metadata']['wsid'] = narrative_ref.wsid
        except ServerError as e:
            raise WorkspaceError(e, narrative_ref.wsid, "Error while exporting Narrative")

        # 2. Convert to a notebook object
        kb_notebook = nbformat.reads(json.dumps(nar), as_version=4)

        # 3. make the thing
        (body, resources) = self.html_exporter.from_notebook_node(kb_notebook)

        with open(output_file, 'w') as output_html:
            output_html.write(body)
