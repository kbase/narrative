"""
A collection of helpful utilities for running batches of jobs.
"""
from biokbase.narrative.staging.helper import Helper as StagingHelper
import specmanager
import biokbase.narrative.clients as clients
from biokbase.narrative.app_util import (
    system_variable
)
import re
from decimal import Decimal
from itertools import product
from pprint import pprint
from copy import deepcopy

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
    sm = specmanager.SpecManager()
    spec = sm.get_spec(app, tag=tag)  # will raise an exception if it's not found.
    spec_params = sm.app_params(spec)
    (spec_params_dict, grouped_params) = _index_spec_params(spec_params)

    input_scaffold = dict()
    for p in spec_params:
        if p['id'] not in grouped_params:
            input_scaffold[p['id']] = _make_scaffold_input(p, spec_params_dict, use_defaults)
    return input_scaffold

def _index_spec_params(spec_params):
    """
    Makes an index of the spec parameters. It dict-ifies the list of spec params
    provided by the SpecManager, and also returns the set of param ids that are
    used in groups.
    This gets returned as a tuple (indexed params, group param ids)
    """
    spec_params_dict = dict()
    grouped_parents = dict()
    for p in spec_params:
        spec_params_dict[p['id']] = p
        # groupify the parameters - identify params that are part of groups, and don't include
        # them in the list separately.
        children = p.get('parameter_ids')
        if children:
            for child in children:
                grouped_parents[child] = p['id']
    return (spec_params_dict, grouped_parents)

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
    This takes in an app, tag, and set of loosely-defined kwargs to build a batch of app runs.
    app is the app id, in the format "Module/method", e.g.("MEGAHIT/run_megahit")
    tag should be one of 'dev', 'beta', or 'release'

    The rest is where it gets tricky.

    kwargs is, as usual for Python, a set of keys and values. In this case, the keys are the app parameter ids
    as defined by the app spec, and the values are a range of values for each parameter.

    These sets of ranges are then shuffled together in such a way that all permutations define different
    runs of the app.

    Effectively, each value of the kwargs is expected to be a list. Parameters that are defined by
    the spec to be lists (the "allow_multiple" flag is truthy) are expected to be lists of lists.

    For example, the MEGAHIT inputs are a simple dictionary with several keys. For this example, they have
    "read_library_ref", "min_contig_len", and "output_assembly" as keys, all of which are expected to have
    a single value. So a normal set of inputs for a single run might look like this:
    {
        "read_library_ref": "1/2/1",
        "min_contig_len": 500,
        "output_assembly": "assembled_reads"
    }

    The goal in building a batch of MEGAHIT runs is to assemble multiple read libraries into their successive
    assemblies, possibly over a range of minimum contig lengths to select the best assembly. So I might have
    the following in kwargs:
    read_library_ref = ["1/2/1", "1/3/1", "1/4/1"]
    min_contig_len = [500, 1000]

    output_assembly gets tricky, since that's the output. We know it's the output from the spec as well, so
    we can know what to do with it. The options are to let this function pick a random name appended to
    the default output name of "MEGAHIT.contigs", or a list of strings (one for each run), or to create a
    template that will have either a random number appended (the run index) or some combination of values
    from the inputs. This would be a Jinja2-based template, something like:
    "MEGAHIT.contigs_{{read_library_ref}}_{{min_contig_len}}"

    In the end, this should form a list of 6 app runs:
    [{
        "read_library_ref": "1/2/1",
        "min_contig_len": 500,
        "output_assembly": "MEGAHIT.contigs1"
    },{
        "read_library_ref": "1/2/1",
        "min_contig_len": 1000,
        "output_assembly": "MEGAHIT.contigs2"
    },{
        "read_library_ref": "1/3/1",
        "min_contig_len": 500,
        "output_assembly": "MEGAHIT.contigs3"
    },{
        "read_library_ref": "1/3/1",
        "min_contig_len": 1000,
        "output_assembly": "MEGAHIT.contigs4"
    },{
        "read_library_ref": "1/4/1",
        "min_contig_len": 500,
        "output_assembly": "MEGAHIT.contigs5"
    },{
        "read_library_ref": "1/4/1",
        "min_contig_len": 1000,
        "output_assembly": "MEGAHIT.contigs6"
    }]

    which is what gets returned.

    Any input not specified in kwargs is left as default as described in the spec, or None if there is no
    description.

    So, again, the optional values for each kwarg are:
    * a single value (applied to all runs)
    * a list of values (used to build a set of runs)
    * for numeric values, a 3-tuple - (min, interval, max) - to be used as a generator

    Very little validation will be done here for the various values. Values expected by the spec to be
    numbers of some range will be checked, UPAs will be validated to be formatted correctly, and
    output object name strings will have their formatting validated (e.g. no spaces are allowed in workspace
    object names)
    """
    sm = specmanager.SpecManager()
    spec = sm.get_spec(app, tag=tag)
    spec_params = sm.app_params(spec)
    (spec_params_dict, grouped_params) = _index_spec_params(spec_params)
    pprint(grouped_params)
    # Initial checking, make sure all kwargs exist as params.
    input_errors = list()         # errors that occur while parsing inputs
    input_vals = dict()
    for k, v in kwargs.iteritems():
        if k not in spec_params_dict:
            input_errors.append("{} is not a parameter".format(k))
        if isinstance(v, tuple):
            # if it's a tuple, unravel it to generate values.
            input_vals[k] = _generate_vals(v)
        elif _is_singleton(v, spec_params_dict[k]):
            # if it's a singleton, wrap it as a list.
            # lists can be singletons, too, if that parameter has allow_multiple == True.
            input_vals[k] = [v]
        else:
            input_vals[k] = v
    if input_errors:
        for e in input_errors:
            print("Error in input: {}".format(e))
        raise ValueError("Errors found in your inputs! See above for details.")

    # makes the scaffold that we're going to adjust for each iteration
    input_scaffold = get_input_scaffold(app, tag=tag, use_defaults=True)
    batch_inputs = list()
    param_ids = input_vals.keys()
    product_inputs = [input_vals[k] for k in param_ids]
    for p in product(*product_inputs):
        print(p)
        next_input = deepcopy(input_scaffold)
        for idx, name in enumerate(param_ids):
            if name in grouped_params:
                next_input[grouped_params[name]][name] = p[idx]
            else:
                next_input[name] = p[idx]
        batch_inputs.append(next_input)
    return batch_inputs

def _is_singleton(input_value, param_info):
    """
    Returns True if the given input value is a singleton of that parameter. E.g., if it's a
    single string or number for a text parameter, or a list of strings/numbers if the parameter
    allows multiples, or it's a dict if the parameter is a group param.

    That is, if the input parameter is treated as a list by the app, and a list of strings is
    given as the value to iterate over, that's still a "singleton". For example, if the input_type
    is a list of reads to assemble together, and the goal is to build a batch run with several
    lists, that should be a list of lists.

    Doesn't do any validation or anything. Shouldn't raise any errors. It just checks
    whether we have a list / dict / (int or str) where allow_multiple=True.
    """
    if input_value and isinstance(input_value, list):
        if not param_info.get("allow_multiple", False):
            return False
        elif isinstance(input_value[0], list):
            return False
    return True

def _generate_vals(t):
    """
    Interpolates values from a 3-tuple (min, interval, max)
    E.g. (0, 5, 20) would return [0, 5, 10, 15, 20]
    (0, 5, 19) would return [0, 5, 10, 15]
    (100, -5, 80) would return [100, 95, 90, 85, 80]
    ...etc.
    If the values are non-numeric, raises an exception.
    If they don't make numeric sense, like (0, -5, 20) where the max will never be
    reached, raises an exception.
    If it's not a 3-tuple, raises an exception.
    """
    if len(t) != 3:
        raise ValueError('The input tuple must have 3 values')
    try:
        # deals with floating point errors
        start = Decimal(str(t[0]))
        interval = Decimal(str(t[1]))
        target = Decimal(str(t[2]))
    except:
        raise ValueError('The input tuple must be entirely numeric')
    if interval == 0:
        raise ValueError('The interval value must not be 0')
    if (start < target and interval < 0) or (start > target and interval > 0):
        raise ValueError('The maximum value of this tuple will never be reached based on the interval value')
    vals = [start]

    while (vals[-1] < target and vals[-1] + interval <= target) or \
          (vals[-1] > target and vals[-1] + interval >= target):
        vals.append(vals[-1] + interval)
    # turn them back into floats at the end.
    return [float(v) for v in vals]