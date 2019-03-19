"""
Code to run a narrative headless from the command line
Eventually this will be incorporated into a service

sychan@lbl.gov
"""

from traitlets.config import Config
from nbconvert.preprocessors.execute import ExecutePreprocessor, CellExecutionError
from biokbase.narrative.exporter.preprocessor import NarrativePreprocessor
from biokbase.narrative.contents.narrativeio import KBaseWSManagerMixin as NIO
import nbformat
import json
import os
from pprint import pprint, pformat
import argparse
from os.path import abspath, dirname, join, isfile
import logging

logging.getLogger("tornado.application").addHandler(logging.StreamHandler())


def get_output(notebook, all=False, codecells=False):
    # return the output cells in a notebook. If all cells are asked for
    # then go through them start to finish and apply the print_cell function
    # if all is False then we return the last code cell that has output

    def get_cell_output(cell):
        # return output from cell in a notebook
        output = ""
        if cell['cell_type'] == 'code':
            if codecells and \
               (len(cell['outputs']) > 0 or 'kbase' in cell['metadata']):
                output = cell['source'] + "\n"
            if 'kbase' in cell['metadata']:
                output = output + pformat(cell['metadata']['kbase']) + "\n"
            for outputs in cell['outputs']:
                if outputs['output_type'] == 'stream' and \
                   outputs['name'] == 'stdout':
                    # try parsing it as json and printing that, if it fails
                    # just print out the raw test
                    try:
                        output_json = json.loads(outputs['text'])
                        output = output + pformat(output_json) + "\n"
                    except:
                        output = output + pformat(outputs['text']) + "\n"
        return(output)

    if all:
        output = ""
        for cell in notebook['cells']:
            cell_output = get_cell_output(cell)
            if cell_output:
                output += cell_output + "\n"
    else:
        for cell in reversed(notebook['cells']):
            output = get_cell_output(cell)
            if output:
                break
    return(output)


def get_notebook(narrative_ref):
    # Get the narrative from the workspace and convert it into a notebook obj
    narr_fetcher = NIO()
    nar = narr_fetcher.read_narrative(narrative_ref)
    nar = nar['data']
    return(nbformat.reads(json.dumps(nar), as_version=4))


def execute_notebook(notebook):
    # Configure the notebook executor and then run the notebook
    # given, returning the results to the call
    c = Config()
    c.ScriptExporter.preprocessors = [NarrativePreprocessor]
    nar_templates = os.path.join(os.environ.get('NARRATIVE_DIR', '.'), 'src',
                                 'biokbase', 'narrative', 'exporter',
                                 'templates')
    c.TemplateExporter.template_path = ['.', nar_templates]

    # Initialize the notebook execution object, and run the notebook. If a
    # timeout (in seconds) is defined in KB_CELL_TIMEOUT, use that for
    # how long we allow a cell to run before timing it out, otherwise use
    # a default value of 60 minutes.
    # /tmp is the directory where the notebook will be run.
    if 'KB_CELL_TIMEOUT' in os.environ:
        timeout = int(os.environ['KB_CELL_TIMEOUT'])
    else:
        timeout = 3600
    ep = ExecutePreprocessor(timeout=timeout)
    resources = {'metadata': {'path': '/tmp'}}
    return(ep.preprocess(notebook, resources))


def check_environment():
    # Check for required environment variables that will cause errors when
    # trying to run the narrative
    for x in ['KB_AUTH_TOKEN']:
        if x not in os.environ:
            raise KeyError('The environment variable ' + x +
                           ' must be defined to run this script')
    # Try NARRATIVE_DIR, if it isn't set, try to guess the location
    # based on the directory for this script. Test our guess by
    # checking if there is a jupyter narrative config file beneath it, if
    # our guess fails then throw the KeyError
    if 'NARRATIVE_DIR' not in os.environ:
        msg = 'The environment variable NARRATIVE_DIR must be defined to run' \
              ' this script. '
        n_dir = dirname(dirname(dirname(dirname(dirname(abspath(__file__))))))
        if (isfile(join(n_dir, 'kbase-extension/jupyter_notebook_config.py'))):
            msg = msg + 'Try setting it to ' + n_dir
        raise KeyError(msg)


def run_narrative(narrative):
    # Do the top level task of running the narrative:
    # get the notebook from workspace and then run it. Raise an exception
    # if it fails to execute
    kb_notebook = get_notebook(narrative)
    os.environ['KB_WORKSPACE_ID'] = kb_notebook['metadata']['ws_name']
    try:
        result_notebook, resources_out = execute_notebook(kb_notebook)
    except CellExecutionError:
        msg = "CellExecutionError. Dumping state of code cells:"
        print(msg)
        for cell in kb_notebook['cells']:
            if cell['cell_type'] == 'code':
                pprint(cell)
        raise
    return(result_notebook)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("narrative_ref",
                        help="ID for narrative - \"ws_id/obj_id/version_id\"")
    parser.add_argument("--all", action='store_true',
                        help="Show all cells that have run")
    parser.add_argument("--codecells", action='store_true',
                        help="Show code cells source along w/outputs")
    args = parser.parse_args()

    check_environment()
    result_nb = run_narrative(args.narrative_ref)
    print(get_output(result_nb, all=args.all, codecells=args.codecells))
