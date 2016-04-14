"""
widgetmanager.py

Implements the WidgetManager class that programmatically shows
KBase JavaScript widgets.
"""
__author__ = 'Bill Riehl <wjriehl@lbl.gov>'


from biokbase.NarrativeJobService.Client import NarrativeJobService
from biokbase.narrative.common.url_config import URLS
from biokbase.workspace.client import Workspace
from biokbase.narrative_method_store.client import NarrativeMethodStore
from IPython.core.magic import register_line_magic
import os
import re
import json
from IPython.display import Javascript
from jinja2 import Template
import uuid
import time
from pprint import pprint

class WidgetManager:
    widget_info = dict()
    version_tags = ["release", "beta", "dev"]
    default_input_widget = "kbaseNarrativeDefaultInput"
    default_output_widget = "kbaseNarrativeDefaultOutput"

    def __init__(self):
        self.widget_info = self.load_all_widget_info()

    def get_system_variable(self, var):
        """
        Returns a KBase system variable. Just a little wrapper.
        options:
            workspace - returns the KBase workspace name
            token - returns the current user's token credential
            user_id - returns the current user's id

        if anything is not found, returns None
        """
        var = var.lower()
        if var == 'workspace':
            return os.environ.get('KB_WORKSPACE_ID', None)
        elif var == 'token':
            return os.environ.get('KB_AUTH_TOKEN', None)
        elif var == 'user_id':
            token = os.environ.get('KB_AUTH_TOKEN', None)
            if token is None:
                return None
            m = re.match("un=(\w+)|", token)
            if m is not None and len(m.groups()) == 1:
                return m.group(1)
            else:
                return None

    def check_tag(self, tag, raise_exception=False):
        """
        Checks if the given tag is one of "release", "beta", or "dev".
        Returns a boolean.
        if raise_exception == True and the tag is bad, raises a ValueError
        """
        tag_exists = tag in self.version_tags
        if not tag_exists and raise_exception:
            raise ValueError("Can't find tag %s - allowed tags are %s" % (tag, ", ".join(self.version_tags)))
        else:
            return tag_exists

    def load_all_widget_info(self):
        info = dict()
        for tag in self.version_tags:
            info[tag] = self.load_widget_info(tag)
        return info

    def load_widget_info(self, tag="release", verbose=False):
        """
        Loads widget info and mapping.
        Eventually will fetch from perhaps kbase-ui or something.
        For now, it gets known vis widgets from all method specs.

        In the end, this should provide some kind of structure or class that has
        1. a list of all widgets by invocation name
        2. their expected inputs (either taken as a kwargs list by the viewer function or a dict or JSON or whatever)
        """
        self.check_tag(tag, raise_exception=True)

        nms = NarrativeMethodStore(URLS.narrative_method_store)
        methods = nms.list_methods_spec({'tag': tag})
        all_widgets = dict()

        # keys = widget names / namespaced require path / etc.
        # Individual widget values should be:
        # {params: {
        #     name1: {
        #         is_constant: boolean,
        #         value: (***something*** | None) (something = any structure),
        #         allowed: [ list of allowed values, optional ],
        #         type: (string, int, float, boolean, etc. list? hash?)
        #         allowed_types: [ list of allowed ws types, optional ]
        #     },
        #     name2: { is_constant, value }
        # }

        for method in methods:
            if 'output' not in method['widgets']:
                widget_name = self.default_output_widget
            else:
                widget_name = method['widgets']['output']
            if widget_name == 'null':
                if verbose:
                    print "Ignoring a widget named 'null' in {} - {}".format(tag, method['info']['id'])
                continue
            out_mapping = method['behavior'].get('kb_service_output_mapping', method['behavior'].get('output_mapping', None))
            if out_mapping is not None:
                params = {}
                for p in out_mapping:
                    param_name = p['target_property']
                    allowed_values = set()
                    is_constant = False
                    param_value = None
                    param_type = 'string'
                    allowed_types = set()

                    if 'constant_value' in p:
                        # add this val to a set of constant values for that param in that widget.
                        # if more than one possible, this need to be optional
                        is_constant = True
                        allowed_values.add(p['constant_value'])
                    if 'input_parameter' in p:
                        # this is a user given input. look up what it expects from the
                        # associated parameter of that name
                        in_param = p['input_parameter']
                        for spec_param in method['parameters']:
                            if spec_param['id'] == in_param:
                                # want its:
                                # field_type = text, float, number, ...
                                in_type = spec_param['field_type']
                                if in_type == 'text':
                                    param_type = 'string'
                                    if spec_param.has_key('text_options'):
                                        validate_as = spec_param['text_options'].get('validate_as', None)
                                        if validate_as == 'int':
                                            param_type = 'int'
                                        elif validate_as == 'float':
                                            param_type = 'float'
                                        if spec_param['text_options'].has_key('valid_ws_types'):
                                            allowed_types.update(spec_param['text_options']['valid_ws_types'])
                                elif param_type == 'textarea':
                                    param_type = 'string'
                                elif param_type == 'checkbox':
                                    param_type = 'boolean'
                                elif param_type == 'dropdown':
                                    param_type = 'dropdown'
                                    allowed_values.update([o['value'] for o in spec_param['dropdown_options']])
                    if 'narrative_system_variable' in p:
                        # this is something like the ws name or token that needs to get fetched
                        # by the system. Shouldn't be handled by the user.
                        is_constant = True
                        param_value = self.get_system_variable(p['narrative_system_variable'])
                    if 'service_method_output_path' in p:
                        param_type = 'from_service_output'

                    param_info = {
                        'is_constant': is_constant,
                        'param_type': param_type,
                    }
                    if allowed_values:
                        param_info['allowed_values'] = allowed_values
                    if allowed_types:
                        param_info['allowed_types'] = allowed_types
                    if param_value:
                        param_info['param_value'] = param_value
                    params[param_name] = param_info

                if widget_name in all_widgets:
                    # if it's already there, just update the allowed_types and allowed_values for some params that have them
                    for p_name in params.keys():
                        if 'allowed_types' in params:
                            widget_types = all_widgets[widget_name]['params'].get('allowed_types', set())
                            widget_types.add(params['allowed_types'])
                            all_widgets[widget_name]['params']['allowed_types'] = widget_types
                        if 'allowed_values' in params:
                            widget_vals = all_widgets[widget_name]['params'].get('allowed_values', set())
                            widget_vals.add(params['allowed_values'])
                            all_widgets[widget_name]['params']['allowed_values'] = widget_types
                else:
                    all_widgets[widget_name] = { 'params': params }

        # finally, turn all sets into lists
        for w in all_widgets:
            for p in all_widgets[w]["params"]:
                if "allowed_types" in all_widgets[w]["params"][p]:
                    all_widgets[w]["params"][p]["allowed_types"] = list(all_widgets[w]["params"][p]["allowed_types"])
                if "allowed_values" in all_widgets[w]['params'][p]:
                    all_widgets[w]["params"][p]["allowed_values"] = list(all_widgets[w]["params"][p]["allowed_values"])
        return all_widgets

    def get_widget_inputs(self, widget_name, tag="release"):
        self.check_tag(tag, raise_exception=True)

        if widget_name not in self.widget_info[tag]:
            raise ValueError("Widget %s not found!" % widget_name)
        params = self.widget_info[tag][widget_name]["params"]
        print widget_name
        for p in params:
            if not params[p].get("is_constant", False):
                p_def = "%s - %s" % (p, params[p]["param_type"])
                if "allowed_types" in params[p]:
                    p_def = p_def + " - is a workspace object where the type is one of: %s" % (json.dumps(params[p]["allowed_types"]))
                if "allowed_values" in params[p]:
                    p_def = p_def + ", must be one of: %s" % (json.dumps(params[p]["allowed_values"]))
                print p_def

    def get_widget_constants(self, widget_name, tag="release"):
        """
        params should be the structure of widget parameters as defined in the method specs,
        so a dict where keys = param names, and values are a dict of param info
        returns constant values as a key:value dict (key = param name, value = well, it's value)
        """
        self.check_tag(tag, raise_exception=True)

        if widget_name not in self.widget_info[tag]:
            raise ValueError("Widget %s not found!" % widget_name)

        params = self.widget_info[tag][widget_name]["params"]
        constants = dict()
        for p in params:
            if params[p]["is_constant"]:
                if "param_value" in params[p]:
                    constants[p] = params[p]["param_value"]
                elif "allowed_values" in params[p] and len(params[p]["allowed_values"]) == 1:
                    constants[p] = params[p]["allowed_values"][0]
        return constants

    def show_output_widget(self, widget_name, tag="release", **kwargs):
        """
        renders a widget!
        """
        self.check_tag(tag, raise_exception=True)

        if widget_name not in self.widget_info[tag]:
            raise ValueError("Widget %s not found with %s tag!" % (widget_name, tag))

        input_data = kwargs
        input_data.update(self.get_widget_constants(widget_name, tag))
        input_template = """
        element.html("<div id='{{input_id}}'></div>");

        require(['kbaseNarrativeOutputCell', '{{widget_name}}'], function() {
            $('#{{input_id}}').kbaseNarrativeOutputCell({"data": {{input_data}},
            "type":"method",
            "widget": "{{widget_name}}",
            "cellId": "{{input_id}}",
            "title": "{{cell_title}}",
            "time": {{timestamp}} });
        });
        """

        js = Template(input_template).render(input_id=uuid.uuid4(),
                                             widget_name=widget_name,
                                             input_data=json.dumps(input_data),
                                             cell_title="Title Goes Here",
                                             timestamp=int(round(time.time()*1000)))
        return Javascript(data=js, lib=None, css=None)