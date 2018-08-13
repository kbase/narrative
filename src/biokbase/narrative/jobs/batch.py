"""
A collection of helpful utilities for running batches of jobs.
"""
from biokbase.narrative.staging.helper import Helper as StagingHelper
from specmanager import SpecManager
import biokbase.narrative.clients as clients
from biokbase.narrative.app_util import (
    system_variable
)
import re

def get_input_scaffold(app, tag='release', use_defaults=False):
    """
    Builds a "scaffold" structure of what app inputs are used, in the structure that's
    expected by 'run_app_batch' (also the structure expected by 'run_app'). This will
    effectively be a dictionary of keys to None (except for the case of group parameters,
    those will fill out the group with the proper keys, and wrap them in a list if necessary)

    Note that this will return a single dictionary - running a batch will require
    making a list of these.

    See also SpecManager.app_usage

    app - the app id (in the format "module/app_name")
    tag - the release state of the app. one of ["release", "beta", "dev"] (default "release")
    use_defaults - if True, include the default value for parameters that have one. (default False)
    """
    sm = SpecManager()
    spec = sm.get_spec(app, tag=tag)
    spec_params = sm.app_params(spec)
    spec_params_dict = dict()
    grouped_params = set()  # set of param ids that are used in groups.
    for p in spec_params:
        spec_params_dict[p['id']] = p
        # groupify the parameters - identify params that are part of groups, and don't include
        # them in the list separately.
        if p.get('parameter_ids'):
            grouped_params.update(p.get('parameter_ids'))

    input_scaffold = dict()
    for p in spec_params:
        if p['id'] not in grouped_params:
            input_scaffold[p['id']] = _make_scaffold_input(p, spec_params_dict, use_defaults)
    return input_scaffold

def _make_scaffold_input(param, params_dict, use_defaults):
    """
    param = dict of info about one param - id, is it a group, what types are allowed, etc.
            this is the one that we are providing the info about for the scaffold.
    params_dict = dict of all params.
    """
    if param.get('is_group', False):
        group_dict = dict()
        for group_param_id in param.get('parameter_ids', []):
            group_dict[group_param_id] = _make_scaffold_input(params_dict[group_param_id], params_dict, use_defaults)
        if param.get('allow_multiple'):
            return [group_dict]
        else:
            return group_dict
    if use_defaults and param.get('default'):
        return param.get('default')
    return None


def list_objects(obj_type=None, name=None, fuzzy_name=True):
    """
    Returns a list of all objects in the current workspace with type=obj_type
    obj_type is a string. if None, return all visible objects (no reports, data palettes, etc.)
    name is a string. if None, then return everything. if not None, use that string to filter the search. if fuzzy_name is set to True, use that string
    as a search filter. e.g., "foo" would match "Foobar" and "Bazfoo"
    However, it doesn't go the other way. If name="Foobar" it will not match an object named "foo"
    If fuzzy_name is False, only exact (case-insensitive) matches are allowed.
    This has limited use, I know, but it's useful for fetching UPAs for objects you know, or names you're iterating over another way.

    This first prototype just returns a list of dictionaries, where each dict contains 'type', 'upa', and 'name' keys for each object.
    """
    ws_name = system_variable('workspace')
    service = clients.get('service')
    service_params = {
        'ws_name': ws_name
    }
    if obj_type is not None:
        # matches:
        # foo.bar
        # foo.bar-1.0
        # doesn't match:
        # foo
        # foo.bar-
        # foobar-
        # foo.bar-1.2.0
        if not re.match(r"[A-Za-z]+\.[A-Za-z]+(-\d+\.\d+)?$", obj_type):
            raise ValueError('{} is not a valid type. Valid types are of the format "Module.Type" or "Module.Type-Version"'.format(obj_type))
        service_params['types'] = [obj_type]
    all_obj = service.sync_call('NarrativeService.list_objects_with_sets', [service_params])[0]
    obj_list = list()
    for obj in all_obj['data']:
        # filtration!
        # 1. ignore narratives
        if 'KBaseNarrative.Narrative' in obj['object_info'][2]:
            continue
        # 2. name filter
        if name is not None:
            name = str(name).lower()
            # if we're not strict, just search for the string
            if fuzzy_name is True and name not in obj['object_info'][1].lower():
                continue
            elif fuzzy_name is False and name != obj['object_info'][1].lower():
                continue
        upa_prefix = ''                               # gavin's gonna wreck me.
        if 'dp_info' in obj:                          # seriously.
            upa_prefix = obj['dp_info']['ref'] + ';'  # not like I want to support this, either...
        info = obj['object_info']
        obj_list.append({
            "upa": "{}{}/{}/{}".format(upa_prefix, info[6], info[0], info[4]),
            "name": info[1],
            "type": info[2]
        })
    return obj_list

def list_files(name=None):
    """
    Returns a list of all files in the user's staging area. It uses the 'name' as a case-insensitive
    search string to filter the files. E.g., looking for files named "foo" will return files named
    "Foo.txt", "FOO", "myfoobar", etc.
    If name is None, returns all files.
    This simply returns a list of strings, where each string is the file path that the App can use.
    """
    staging = StagingHelper()
    files = staging.list()
    if not name:
        return files
    filter_files = list()
    name = name.lower()
    filter_files = [f for f in files if name in f.lower()]
    return filter_files

def generate_input_batch(app, tag='release', **kwargs):
    """
    This will be tricky.
    It should take in the app and version, and a set/list/whatever of inputs and make a range of those.
    The inputs should range from a list, or tuple, or something else in order to make a matrix from.
    It should then return the list of dictionaries for batch inputs.
    Example, the MEGAHIT inputs are a simple dictionary. They have a single read library as input,
    a string output for the name of the contigs, and a few advanced parameters for controlling the process,
    including a min_contig_len.
    If I want to run a batch over several min_contig_len values, and several read libraries, with different
    output values, how do I do that?
    I would want to give the following:
    1. a list of the read library refs to use
    2. Either a list of min_contig_length values or a way to represent a range
    3. Either a list of all the outputs, a way to generate those based on inputs, or just let the app decide
       some unique output name for each run.
    Sooo... how to do this.
    I think the following.
    1. It's easy to fetch the app info, make a scaffold, etc. (Got that scaffold function up there ^^^).
    let each element of kwargs be one key in the app structure. In this example, we have:
    min_contig_len - int > 0
    output_contigset_name - string, output object name
    read_library_ref - UPA of read library

    The input kwargs would look like:
    read_libary_ref = [list of ref strings]
    output_contigset_name - either leave blank and let the function generate them, or give a list of names, OR a template? something like:
        "MEGAHIT.contigs_{read_library_ref}_{min_contig_len}" ?
    min_contig_len =
        * either a single value (apply to all)
        * or a list of values
        * or a 3-tuple - (min, interval, max) - as a generator. (maybe make a Python generator?) e.g.: (0, 5, 20) would turn into a list [0, 5, 10, 15, 20]
    the rest of the inputs would then be the default values.
    """
    return list()