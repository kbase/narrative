"""App-related utility functions."""

import json
import re
from typing import Any

from biokbase.narrative import clients, upa
from biokbase.narrative.system import system_variable

"""
Some utility functions for running KBase Apps or Methods or whatever they are this week.
"""

app_version_tags = ["release", "beta", "dev"]


def check_tag(tag: str, *, raise_exception: bool = False) -> bool:
    """Checks if the given tag is one of "release", "beta", or "dev".

    Returns a boolean.
    if raise_exception == True and the tag is bad, raises a ValueError.
    """
    tag_exists = tag in app_version_tags
    if not tag_exists and raise_exception:
        msg = f"Can't find tag {tag} - allowed tags are {', '.join(app_version_tags)}"
        raise ValueError(msg)
    return tag_exists


def map_inputs_from_job(job_inputs: list[Any], app_spec: dict[str, Any]) -> dict[str, Any]:
    """Unmaps the actual list of job inputs back to the parameters specified by app_spec.

    For example, the inputs given to a method might be a list like this:
    ['input1', {'ws': 'my_workspace', 'foo': 'bar'}]
    and the input mapping looks like:
    [{
        'target_position': 0,
        'input_parameter': 'an_input'
    },
    {
        'target_position': 1,
        'target_property': 'ws',
        'input_parameter': 'workspace'
    },
    {
        'target_position': 1,
        'target_property': 'foo',
        'input_parameter': 'baz'
    }]
    this would return:
    {
        'an_input': 'input1',
        'workspace': 'my_workspace',
        'baz': 'bar'
    }
    This only covers those parameters from the input_mapping that come with an input_parameter
    field. system variables, constants, etc., are ignored - this function just goes back to the
    original inputs set by the user.
    """
    input_dict = {}
    spec_inputs = app_spec["behavior"]["kb_service_input_mapping"]

    # expect the inputs to be valid. so things in the expected position should be the
    # right things (either dict, list, singleton)
    for param in spec_inputs:
        if "input_parameter" not in param:
            continue
        input_param = param.get("input_parameter", None)
        position = param.get("target_position", 0)
        prop = param.get("target_property", None)
        value = job_inputs[position]
        if prop is not None:
            value = value.get(prop, None)

        # that's the value. Now, if it was transformed, try to transform it back.
        if "target_type_transform" in param:
            transform_type = param["target_type_transform"]
            if transform_type.startswith("list") and isinstance(value, list):
                inner_transform = transform_type[5:-1]
                for i in range(len(value)):
                    value[i] = _untransform(inner_transform, value[i])
            else:
                value = _untransform(transform_type, value)

        input_dict[input_param] = value
    return input_dict


def _untransform(transform_type: str, value):  # noqa: ANN001 , ANN202
    """If the value is a string and we have a reference (not UPA) transform type, untransform it.

    This turns it back into either the object name or id.
    Note that value can be Any and this can return Any, which ruffles ruff.
    """
    if transform_type in ["ref", "putative-ref", "unresolved-ref"] and isinstance(value, str):
        # shear off everything before the first '/' - there should just be one.
        slash = value.find("/")
        if slash == -1:
            return value
        return value[(slash + 1) :]
    return value


def app_param(p: dict[str, Any]) -> dict[str, Any]:  # noqa: C901, PLR0912
    """Converts a param dictionary from a NarrativeMethodStore param spec.

    Creates the following structure with optional keys:
    {
        "id": string
        "is_group": boolean
        "optional: boolean
        "short_hint": string
        "description": string
        "type": string
        "is_output": boolean
        "allow_multiple": boolean
        "allowed_values": present if type == "dropdown" or "checkbox", a list of allowed dropdown
            values
        "default": None, singleton, or list if "allow_multiple" is True
        "checkbox_map": [checked_value, unchecked_value] if type == checkbox
        The following only apply if the "text_options" field is present in the original spec
        "is_output": 1, 0, True, or False
        "allowed_types": list[str] - valid workspace object types
        "min_val": either the "min_float" or "min_int" field, if present
        "max_val": either the "max_float" or "max_int" field, if present
        "regex_constraint": string
    }.
    TODO: create an AppParam class to hold and validate this.
    TODO: create a Spec class to hold, validate, and process App Specs
    """
    p_info = {"id": p["id"], "is_group": False}

    if p["optional"] == 0:
        p_info["optional"] = False
    else:
        p_info["optional"] = True

    p_info["short_hint"] = p["short_hint"]
    p_info["description"] = p["description"]
    p_info["type"] = p["field_type"].lower()
    p_info["is_output"] = False

    p_info["allow_multiple"] = False
    if p["allow_multiple"] == 1:
        p_info["allow_multiple"] = True

    if p_info["type"] == "dropdown":
        p_info["allowed_values"] = [opt["value"] for opt in p["dropdown_options"]["options"]]
    if p_info["type"] == "checkbox":
        p_info["allowed_values"] = [True, False]

    defaults = p["default_values"]
    # remove any empty strings, because that's silly
    defaults = [x for x in defaults if x]
    if p_info["allow_multiple"]:
        p_info["default"] = defaults
    else:
        p_info["default"] = defaults[0] if len(defaults) > 0 else None

    if "checkbox_options" in p and len(p["checkbox_options"].keys()) == 2:  # noqa: PLR2004
        p_info["checkbox_map"] = [
            p["checkbox_options"]["checked_value"],
            p["checkbox_options"]["unchecked_value"],
        ]

    if "text_options" in p:
        opts = p["text_options"]
        if "is_output_name" in opts:
            p_info["is_output"] = opts["is_output_name"]
        if "valid_ws_types" in opts and len(opts["valid_ws_types"]) > 0:
            p_info["allowed_types"] = opts["valid_ws_types"]
        if "validate_as" in opts and p_info["type"] != "checkbox" and p_info["type"] != "custom":
            p_info["type"] = opts["validate_as"]
        if "min_float" in opts:
            p_info["min_val"] = opts["min_float"]
        if "min_int" in opts:
            p_info["min_val"] = opts["min_int"]
        if "max_float" in opts:
            p_info["max_val"] = opts["max_float"]
        if "max_int" in opts:
            p_info["max_val"] = opts["max_int"]
        if "regex_constraint" in opts and len(opts["regex_constraint"]):
            p_info["regex_constraint"] = opts["regex_constraint"]
    return p_info


def map_outputs_from_state(
    state: dict[str, Any], params: dict[str, Any], app_spec: dict[str, Any]
) -> tuple[str, dict[str, Any]]:  # noqa: C901
    """Returns the dict of output values from a completed app.

    Also returns the output widget.
    """
    if "behavior" not in app_spec:
        err_str = "Invalid app spec - unable to map outputs"
        raise ValueError(err_str)
    widget_params = {}
    out_mapping_key = "kb_service_output_mapping"
    if out_mapping_key not in app_spec["behavior"]:
        # for viewers or short-running things, but the inner keys are the same.
        out_mapping_key = "output_mapping"

    spec_params = {
        app_spec_param["id"]: app_param(app_spec_param) for app_spec_param in app_spec["parameters"]
    }

    for out_param in app_spec["behavior"].get(out_mapping_key, []):
        value = None
        input_param_id = None
        if "narrative_system_variable" in out_param:
            value = system_variable(out_param["narrative_system_variable"])
        elif "constant_value" in out_param:
            value = out_param["constant_value"]
        elif "input_parameter" in out_param:
            input_param_id = out_param["input_parameter"]
            value = params.get(input_param_id)
        elif "service_method_output_path" in out_param:
            value = get_result_sub_path(
                state["job_output"]["result"], out_param["service_method_output_path"]
            )

        spec_param = None
        if input_param_id:
            spec_param = spec_params.get(input_param_id)
        value = transform_param_value(out_param.get("target_type_transform"), value, spec_param)

        p_id = out_param.get("target_property")
        if p_id is not None:
            widget_params[p_id] = value
        else:
            widget_params = value

    output_widget = app_spec.get("widgets", {}).get("output", "kbaseDefaultNarrativeOutput")
    # Yes, sometimes silly people put the string 'null' in their spec.
    if output_widget == "null":
        output_widget = "kbaseDefaultNarrativeOutput"

    return (output_widget, widget_params)


def get_result_sub_path(result, path: list[str]):  # noqa: ANN201, ANN001
    """Peels the right value out of the result with the given path.

    Inputs and results are complicated, hence the poor typing. See below
    TODO: rewrite to, well, make more sense.
    result - list
        This is a list of objects - each object is either a singleton, list, or object.
    path - list
        This is a list of strings

    A typical run looks like this:
    result = [{'report': 'asdf', 'report_ref': 'xyz'}]
    path = ['0', 'report_ref']
    pos = 0

    So it recursively works through.
    look at path[pos] - that's a 0, so get the 0th element of result (the dict that's there.)
    since result is a list (it almost always is, to start with, since that's what run_job
    returns), we get:
    result[path[0]] = {'report': 'asdf', 'report_ref': 'xyz'}
    path = ['0', 'report_ref']
    pos = 1

    and do it again.
    Now, since result is NOT a list (it's the terminal element), do one of 2 things.
    1. if there's no part of the path left (e.g. path == []), return the result object.
    2. otherwise (as in this case), continue.
    now, result = result[path[1]] = result['report_ref'] = 'xyz'
    path = unchanged
    pos = 2
    and repeat

    Finally, pos = 2, pos > len(path), so just return the final result - 'xyz'

    In total, we use path to get to the exact value we want out of the result list.
    Kinda complex for a few lines of code.

    Returns None if the expected value isn't there - either the key doesn't exist or
    the array element is out of range.
    """
    # When we have an empty path, it is the identity of the result.
    if len(path) == 0:
        return result

    # if we have a list, assume the first element of the path is an integer
    # in string's clothing
    path_head = path[0]
    path_tail = path[1:]
    if isinstance(result, list):
        elem = int(path_head)
        if elem >= len(result):
            return None
        return get_result_sub_path(result[elem], path_tail)
    return get_result_sub_path(result.get(path_head), path_tail)


def extract_ws_refs(
    app_id: str, tag: str, spec_params: list[dict[str, Any]], params: dict[str, Any]
) -> list[str]:  # noqa: ARG001
    """Returns a list of UPAs from the given parameters if they are actual workspace objects."""
    # Cheater way for making a dict of params with param[id] => param
    params_dict = {spec_params[i]["id"]: spec_params[i] for i in range(len(spec_params))}
    workspace = system_variable("workspace")
    ws_input_refs = []
    for p in spec_params:
        if p["id"] in params:
            (wsref, _) = check_parameter(p, params[p["id"]], workspace, all_params=params_dict)
            if wsref is not None:
                if isinstance(wsref, list):
                    for ref in wsref:
                        if ref is not None:
                            ws_input_refs.append(ref)  # noqa: PERF401 too complex for a list comp.
                else:
                    ws_input_refs.append(wsref)
    return ws_input_refs


def validate_parameters(
    app_id: str, tag: str, spec_params: list[dict[str, Any]], params: dict[str, Any]
) -> tuple[dict[str, Any], list[str]]:  # noqa: C901, PLR0912
    """Validates the dict of params against the spec_params.

    If all is good, it updates a few parameters that need it - checkboxes go from
    True/False to 1/0, and sets default values where necessary.
    Then it returns a tuple like this:
    (dict_of_params, list_of_ws_refs)
    where list_of_ws_refs is the list of workspace references for objects
    being passed into the app.

    If it fails, this will raise a ValueError with a description of the
    problem and a (hopefully useful!) hint for the user as to what went
    wrong.
    """
    spec_param_ids = [p["id"] for p in spec_params]

    # Cheater way for making a dict of params with param[id] => param
    params_dict = {spec_params[i]["id"]: spec_params[i] for i in range(len(spec_params))}

    # First, test for presence.
    missing_params = [
        p["id"]
        for p in spec_params
        if not p["optional"] and not p["default"] and not params.get(p["id"], None)
    ]
    if len(missing_params):
        msg = (
            f"Missing required parameters {json.dumps(missing_params)} - try executing app_usage("
            f'"{app_id}", tag="{tag}") for more information'
        )
        raise ValueError(msg)

    # Next, test for extra params that don't make sense
    extra_params = [p for p in params if p not in spec_param_ids]
    if len(extra_params):
        msg = (
            f"Unknown parameters {json.dumps(extra_params)} - maybe something was misspelled?\n"
            f'execute app_usage("{app_id}", tag="{tag}") for more information'
        )
        raise ValueError(msg)

    # Now, validate parameter values.
    # Should also check if input (NOT OUTPUT) object variables are
    # present in the current workspace
    workspace = system_variable("workspace")
    ws_id = system_variable("workspace_id")
    if workspace is None or ws_id is None:
        msg = (
            "Unable to retrive current Narrative workspace "
            f"information! workspace={workspace}, workspace_id={ws_id}"
        )
        raise ValueError(msg)

    param_errors = []
    # If they're workspace objects, track their refs in a list we'll pass
    # to run_job as a separate param to track provenance.
    ws_input_refs = []
    for p in spec_params:
        if p["id"] in params:
            (wsref, err) = check_parameter(p, params[p["id"]], workspace, all_params=params_dict)
            if err is not None:
                param_errors.append(f"{p['id']} - {err}")
            if wsref is not None:
                if isinstance(wsref, list):
                    ws_input_refs = [ref for ref in wsref if ref is not None]
                else:
                    ws_input_refs.append(wsref)
    if len(param_errors):
        err_msg = "Parameter value errors found!\n" + "\n".join(param_errors)
        raise ValueError(err_msg)

    # Hooray, parameters are validated. Set them up for transfer.
    for p in spec_params:
        # If any param is a checkbox, need to map from boolean to actual
        # expected value in p['checkbox_map']
        # note that True = 0th elem, False = 1st
        if p["type"] == "checkbox" and p["id"] in params:
            checkbox_idx = 0 if params[p["id"]] else 1
            params[p["id"]] = p["checkbox_map"][checkbox_idx]
        # While we're at it, set the default values for any
        # unset parameters that have them
        if p.get("default", "") and p["id"] not in params:
            params[p["id"]] = p["default"]

    return (params, ws_input_refs)


def check_parameter(
    param: dict[str, Any], value, workspace: str, all_params: dict[str, Any] | None = None
) -> str | None:  # noqa: ANN001
    """Checks if the given value matches the rules provided in the param dict.

    If yes, returns None
    If no, returns a String with an error.

    This is a pretty light wrapper around validate_param_value that
    handles the case where the given value is a list.

    Parameters:
    -----------
    param : dict
        A dict representing a single KBase App parameter, generated by the
        Spec Manager
    value : any
        A value input by the user
    workspace : string
        The name of the current workspace to search against (if needed)
    all_params : dict (param id -> param dict)
        All spec parameters. Really only needed when validating a parameter
        group, because it probably needs to dig into all of them.
    """
    if all_params is None:
        all_params = {}
    if param["allow_multiple"] and isinstance(value, list):
        ws_refs = []
        error_list = []
        for v in value:
            if param["type"] == "group":
                # returns ref and err as a list
                (ref, err) = validate_group_values(param, v, workspace, all_params)
                if err:
                    error_list += err
                if ref:
                    ws_refs += ref
            else:
                # returns a single ref / err pair
                (ref, err) = validate_param_value(param, v, workspace)
                if err:
                    error_list.append(err)
                if ref:
                    ws_refs.append(ref)
        if len(error_list):
            return (None, "\n\t".join(error_list))
        return (ws_refs, None)
    return validate_param_value(param, value, workspace)


def validate_group_values(
    param: dict[str, Any], value: dict[str, Any], workspace: str, spec_params: list[dict[str, Any]]
) -> tuple[list[str], list[str]]:
    """Validates group parameter values and returns the references or errors."""
    ref = []
    err = []

    if not isinstance(value, dict):
        return (None, "A parameter-group must be a dictionary")

    for param_id in value:
        if param_id not in spec_params:
            err.append(f'Unknown parameter id "{param_id}" in parameter group')
            continue
        if param_id not in param.get("parameter_ids", []):
            err.append(f'Unmappable parameter id "{param_id}" in parameter group')
            continue
        (param_ref, param_err) = validate_param_value(
            spec_params[param_id], value[param_id], workspace
        )
        if param_ref:
            ref.append(param_ref)
        if param_err:
            err.append(param_err)
    return (ref, err)


def validate_param_value(param: dict[str, Any], value, workspace: str) -> tuple[str, str | None]:  # noqa: ANN001, C901, PLR0911, PLR0912
    """Tests a value to make sure it's valid, based on the rules given in the param dict.

    Returns a tuple with the value transformed to a workspace reference (if applicable, or None),
    and either and error string or None if valid.

    TODO: Wow this is too complex. Rewrite someday.

    Parameters:
    -----------
    param : dict
        A dict representing a single KBase App parameter, generated by the
        Spec Manager. This contains the rules for processing any given
        values.
    value : any
        A value input by the user - likely either None, int, float, string,
        list, or dict. Which is pretty much everything, right?
    workspace : string
        The name of the current workspace to test workspace object types
        against, if required by the parameter.
    """
    # The workspace reference for the parameter. Can be None.
    ws_ref = None

    # allow None to pass, we'll just pass it to the method.
    if value is None:
        return (ws_ref, None)

    # Also, for strings, an empty string is the same as null/None
    if (
        param["type"] in ["string", "dropdown", "checkbox"]
        and isinstance(value, str)
        and value == ""
    ):
        return (ws_ref, None)

    # cases - value == list (checked by wrapping function,
    #  check_parameter), int, float, others get rejected
    if param["type"] == "group" and not (isinstance(value, dict | list)):
        return (ws_ref, "a parameter group must be of type list or dict")
    if param["type"] == "mapping" and not isinstance(value, dict):
        return (ws_ref, "a parameter of type 'mapping' must be a dict")
    if param["type"] == "textsubdata" and not (isinstance(value, list | str)):
        return (
            ws_ref,
            "input value not supported for 'textsubdata' type - " "only str or list is supported",
        )
    if param["type"] == "custom_textsubdata" and not (isinstance(value, list | str)):
        return (
            ws_ref,
            "input value not supported for 'custom_textsubdata' type - "
            "only str or list is supported",
        )
    if param["type"] not in [
        "group",
        "mapping",
        "textsubdata",
        "custom_textsubdata",
        "custom",
    ] and not (isinstance(value, float | int | str)):
        return (
            ws_ref,
            "input value not supported for '"
            + str(param["type"])
            + "' type - only str, int or float",
        )

    # check types. str is pretty much anything (it'll just get
    # casted), but ints, floats, or lists are funky.
    if param["type"] == "int" and not isinstance(value, int):
        return (ws_ref, f"Given value {value} is not an int")
    if param["type"] == "float" and not (isinstance(value, float | int)):
        return (ws_ref, f"Given value {value} is not a number")

    # if it's expecting a workspace object, check if that's present,
    # and a valid type
    if "allowed_types" in param and len(param["allowed_types"]) > 0 and not param["is_output"]:
        try:
            # If we see a / , assume it's already an object reference.
            if "/" in value:
                path_items = [item.strip() for item in value.split(";")]
                for path_item in path_items:
                    if len(path_item.split("/")) > 3:  # noqa: PLR2004
                        return (
                            ws_ref,
                            (
                                f"Data reference named {value} does not "
                                "have the right format - should be "
                                "workspace/object/version(optional)"
                            ),
                        )
                info = clients.get("workspace").get_object_info_new({"objects": [{"ref": value}]})[
                    0
                ]
                path_items[len(path_items) - 1] = f"{info[6]}/{info[0]}/{info[4]}"
                ws_ref = ";".join(path_items)
            # Otherwise, assume it's a name, not a reference.
            else:
                info = clients.get("workspace").get_object_info_new(
                    {"objects": [{"workspace": workspace, "name": value}]}
                )[0]
                ws_ref = f"{info[6]}/{info[0]}/{info[4]}"
            type_ok = False
            for t in param["allowed_types"]:
                if t == "*" or re.match(t, info[2]):
                    type_ok = True
            if not type_ok:
                msg = f"Type of data object, {info[2]}, does not match allowed types"
                return (ws_ref, msg)
        except Exception as e:  # noqa: BLE001
            print(e)  # noqa: T201  this error might be useful to get printed out for the user.
            msg = f"Data object named {value} not found with this Narrative."
            return (ws_ref, msg)

    # if it expects a set of allowed values, check if this one matches
    if "allowed_values" in param and value not in param["allowed_values"]:
        return (
            ws_ref,
            f"Given value '{value}' is not permitted in the allowed set.",
        )

    # if it expects a numerical value in a certain range, check that.
    if "max_val" in param:
        try:
            if float(value) > param["max_val"]:
                return (
                    ws_ref,
                    f"Given value {value} should be <= {param['max_val']}",
                )
        except TypeError:
            return (ws_ref, f"Given value {value} must be a number")

    if "min_val" in param:
        try:
            if float(value) < param["min_val"]:
                return (
                    ws_ref,
                    f"Given value {value} should be >= {param['min_val']}",
                )
        except TypeError:
            return (ws_ref, f"Given value {value} must be a number")

    # if it's an output object, make sure it follows the data object rules.
    if param.get("is_output", False):
        if re.search(r"\s", value):
            return (ws_ref, "Spaces are not allowed in data object names.")
        if re.match(r"^\d+$", value):
            return (ws_ref, "Data objects cannot be just a number.")
        if not re.match(r"^[a-z0-9|\.|\||_\-]*$", value, re.IGNORECASE):
            return (ws_ref, "Data object names can only include symbols: _ - . |")

    # Last, regex. not being used in any extant specs, but cover it anyway.
    # Disabled for now - the regex string that works in javascript may not work
    # in python and vice versa
    # if 'regex_constraint' in param:
    #     for regex in param['regex_constraint']:
    #         regex_string = regex.get('regex')  # noqa: ERA001
    #         if not re.match(regex_string, value):
    #             return (ws_ref,
    #                     'Value {} does not match required regex {}'.format(
    #                         value, regex))

    # Whew. Passed all filters!
    return (ws_ref, None)


def resolve_single_ref(workspace: str, value: str) -> str:
    """Resolves a reference to an UPA, if it isn't one already.

    This contacts the workspace (by the workspace name) and returns an UPA form
    of the input value if it's not already in a reference format.
    """
    ret = None
    if "/" in value:
        path_items = [item.strip() for item in value.split(";")]
        for path_item in path_items:
            if len(path_item.split("/")) > 3:  # noqa: PLR2004
                err_str = (
                    f"Object reference {value} has too many slashes - should be ws/object/version"
                )
                raise ValueError(err_str)
        info = clients.get("workspace").get_object_info_new({"objects": [{"ref": value}]})[0]
        path_items[len(path_items) - 1] = f"{info[6]}/{info[0]}/{info[4]}"
        ret = ";".join(path_items)
    # Otherwise, assume it's a name, not a reference.
    else:
        info = clients.get("workspace").get_object_info_new(
            {"objects": [{"workspace": workspace, "name": value}]}
        )[0]
        ret = f"{info[6]}/{info[0]}/{info[4]}"
    return ret


def resolve_ref(workspace: str, value: str | list[str]) -> str | list[str]:
    """Resolves a reference to ensure it's an UPA."""
    if isinstance(value, list):
        return [resolve_single_ref(workspace, v) for v in value]
    return resolve_single_ref(workspace, value)


def resolve_ref_if_typed(value: str, spec_param: dict[str, Any]) -> str:
    """If the parameter expects a typed object input, resolve the reference.

    For a given value and associated spec, if this is not an output param,
    then ensure that the reference points to an object in the current
    workspace, and transform the value into an absolute reference to it.
    """
    is_output = "is_output" in spec_param and spec_param["is_output"] == 1
    if "allowed_types" in spec_param and not is_output:
        allowed_types = spec_param["allowed_types"]
        if len(allowed_types) > 0:
            workspace = system_variable("workspace")
            return resolve_ref(workspace, value)
    return value


def transform_param_value(  # noqa: C901, PLR0912, PLR0911, ANN201
    transform_type: str | None,
    value,
    spec_param: dict[str, Any] | None,  # noqa: ANN001
):
    """Transforms an input using the rules in NarrativeMethodStore.ServiceMethodInputMapping.

    Really, there are three types of transforms possible:
      1. ref - turns the input string into a workspace ref.
      2. int - tries to coerce the input string into an int.
      3. list<type> - turns the given list into a list of the given type.
      (4.) none or None - doesn't transform.

    Returns a transformed (or not) value.

    Rules and logic, esp for objects being sent.
    1. Test if current transform applies. (None is a valid transform)
        A. Check if input is an object - valid transforms are ref, resolved-ref, list<ref>,
            list<resolved-ref>, None
        B. If not object, int, list<int>, and None are allowed.
    2. If object and not output field, apply transform as follows:
        A. None -> returns only object name
        B. ref -> returns workspace_name/object_name
        C. resolved-ref -> returns UPA
        D. (not in docs yet) upa -> returns UPA
        E. any of the above can be applied in list<X>
    3. Exception: if the input is an UPA path or reference path, it should only get transformed
        to an UPA path.

    This function will attempt to transform value according to the above rules. If value looks
    like a ref (ws_name/obj_name) and transform_type is None, then obj_name will be returned.
    Likewise, if resolved-ref is given, and value looks like an UPA already, then the already
    resolved-ref will be returned.

    Parameters:
    transform_type - str/None - should be one of the following, if not None:
        * string
        * int
        * ref
        * resolved-ref
        * upa
        * list<X> where X is any of the above
    value - anything or None. Parameter values are expected, by the KBase app stack, to
        generally be either a singleton or a list of singletons. In practice, they're usually
        strings, ints, floats, None, or a list of those.
    spec_param - either None or a spec parameter dictionary as defined by
        SpecManager.app_params. That is:
        {
            optional = boolean,
            is_constant = boolean,
            value = (whatever, optional),
            type = [text|int|float|list|textsubdata],
            is_output = boolean,
            short_hint = string,
            description = string,
            allowed_values = list (optional),
        }
    """
    if transform_type is not None:
        transform_type = transform_type.lower()
        if transform_type == "none":
            transform_type = None

    is_input_object_param = False
    if (
        spec_param is not None
        and spec_param["type"] == "text"
        and not spec_param["is_output"]
        and len(spec_param.get("allowed_types", []))
    ):
        is_input_object_param = True

    if transform_type is None and spec_param is not None and spec_param["type"] == "textsubdata":
        transform_type = "string"

    if not is_input_object_param and transform_type is None:
        return value

    if transform_type in [
        "ref",
        "unresolved-ref",
        "resolved-ref",
        "putative-ref",
        "upa",
    ] or (is_input_object_param and transform_type is None):
        if isinstance(value, list):
            return [transform_object_value(transform_type, v) for v in value]
        return transform_object_value(transform_type, value)

    if transform_type == "int":
        # make it an integer, OR 0.
        if value is None or len(str(value).strip()) == 0:
            return None
        return int(value)

    if transform_type == "string":
        if value is None:
            return value
        if isinstance(value, list):
            return ",".join(value)
        if isinstance(value, dict):
            return ",".join([f"{key}={value[key]}" for key in value])
        return str(value)

    if transform_type.startswith("list<") and transform_type.endswith(">"):
        # make it a list of transformed types.
        list_type = transform_type[5:-1]
        if isinstance(value, list):
            return [transform_param_value(list_type, v, None) for v in value]
        return [transform_param_value(list_type, value, None)]

    err_msg = f"Unsupported Transformation type: {transform_type}"
    raise ValueError(err_msg)


def transform_object_value(transform_type: str | None, value: str | None) -> str | None:  # noqa: PLR0911, C901
    """Transforms an input value according to the app spec.

    Cases:
    transform = ref, unresolved-ref, or putative-ref:
        - should return wsname / object name
    transform = upa or resolved-ref:
        - should return UPA
    transform = None:
        - should return object name
    Note that if it is a reference path, it was always get returned as an UPA-path
    for the best compatibility.

    value can be either object name, ref, upa, or ref-path
    can tell by testing with UPA api

    If we can't find any object info on the value, just return the value as-is

    "putative-ref" is a special case where the value is an object name and the object may or
    may not exist. It is used to deal with the input from SpeciesTreeBuilder; if that app gets
    fixed, it can be removed.
    """
    if value is None:
        return None

    # 1. get object info
    is_upa = upa.is_upa(value)
    is_ref = upa.is_ref(value)
    is_path = (is_upa or is_ref) and ";" in value

    # simple cases:
    # 1. if is_upa and we want resolved-ref or upa, return the value
    # 2. if is_ref and not is_upa and we want ref or unresolved-ref, return the value
    # 3. if is neither upa or ref and transform is None, then we want the string, so return that
    # 4. Otherwise, look up the object and return what's desired from there.

    if is_upa and transform_type in ["upa", "resolved-ref"]:
        return value
    if not is_upa and is_ref and transform_type in ["ref", "unresolved-ref", "putative-ref"]:
        return value
    if not is_upa and not is_ref and transform_type is None:
        return value

    search_ref = value
    if not is_upa and not is_ref:
        search_ref = f"{system_variable('workspace')}/{value}"
    try:
        obj_info = clients.get("workspace").get_object_info3({"objects": [{"ref": search_ref}]})
    except Exception as e:
        # a putative-ref can be an extant or a to-be-created object; if the object
        # is not found, the workspace name/object name can be returned
        if transform_type == "putative-ref" and (
            "No object with name" in str(e) or "No object with id" in str(e)
        ):
            return search_ref

        transform = transform_type
        if transform is None:
            transform = "object name"
        err_str = (
            f"Unable to find object reference '{search_ref}' to transform as {transform}: " + str(e)
        )
        raise ValueError(err_str) from e

    if is_path or transform_type in ["resolved-ref", "upa"]:
        return ";".join(obj_info["paths"][0])
    if transform_type in ["ref", "unresolved-ref", "putative-ref"]:
        obj = obj_info["infos"][0]
        return f"{obj[7]}/{obj[1]}"
    if transform_type is None:
        return obj_info["infos"][0][1]
    return value
