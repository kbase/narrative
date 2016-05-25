from __future__ import print_function

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
from biokbase.narrative.jobs.method_util import (
    check_tag,
    system_variable
)
from IPython.core.magic import register_line_magic
import os
import re
import json
from IPython.display import Javascript
from jinja2 import Template
import uuid
import time
from pprint import pprint
from biokbase.narrative.jobs import SpecManager

class WidgetManager(object):
    """
    Manages data (and other) visualization widgets for use in the KBase Narrative.

    Basic flow for use:
    1. Instantiate the manager:
       wm = WidgetManager()

    This loads the widget info. If things have changed, reload_info can be used to update the known widgets.

    2. wm.widget_info
    This contains a large dictionary of KBase widget info as reported by the Narrative Method Store.

    2a. wm.widget_info['release'].keys()
    This returns a list of available widget names

    3. wm.print_widget_inputs(widget_name, release_tag)
    This will print out all non-constant variable names and their required values

    4. wm.show_output_widget(widget_name, tag="release", **kwargs)
    This will render the widget with the given name and tag. The kwargs are the list of variables from print_widget_inputs

    5. wm.show_external_widget({see method for details})
    This will fetch and render a widget and its required environment from the configured external CDN.
    """
    widget_info = dict()
    _version_tags = ["release", "beta", "dev"]
    _cell_id_prefix = "kb-vis-"
    _default_input_widget = "kbaseNarrativeDefaultInput"
    _default_output_widget = "kbaseNarrativeDefaultOutput"

    def __init__(self):
        self._sm = SpecManager()
        self.reload_info()

    def reload_info(self):
        """
        Fetches all widget information from the method store and contains it in this object.
        """
        self.widget_info = self._load_all_widget_info()

    def _load_all_widget_info(self):
        """
        Loads all widget info and stores it in this object.
        It does this by calling load_widget_info on all available tags.
        """
        info = dict()
        for tag in self._version_tags:
            info[tag] = self.load_widget_info(tag)
        return info

    def load_widget_info(self, tag="release", verbose=False):
        """
        Loads widget info and mapping.
        Eventually will fetch from kbase-ui, a kbase CDN, or the catalog service.
        For now, it gets known vis widgets from all method specs.

        This returns the a Dict where all keys are the name of a widget, and all values
        contain widget information in this structure:
        {
            "params": {
                "param_name": {
                    "is_constant": boolean,
                    "param_type": one of (string|boolean|dropdown),
                    "allowed_values": list of strings (exists when param_type==dropdown),
                    "allowed_types": list of data types (when param_type==string),
                    "param_value": something, mainly when is_constant==True
                }
        }
        """
        check_tag(tag, raise_exception=True)

        nms = NarrativeMethodStore(URLS.narrative_method_store)
        # methods = nms.list_methods_spec({'tag': tag})
        methods = self._sm.app_specs[tag].values()
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
                widget_name = self._default_output_widget
            else:
                widget_name = method['widgets']['output']
            if widget_name == 'null':
                if verbose:
                    print("Ignoring a widget named 'null' in {} - {}".format(tag, method['info']['id']))
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
                        param_value = system_variable(p['narrative_system_variable'])
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
                        if 'allowed_types' in params[p_name]:
                            if p_name not in all_widgets[widget_name]['params']:
                                all_widgets[widget_name]['params'][p_name] = params[p_name]
                            else:
                                widget_types = all_widgets[widget_name]['params'].get(p_name, {}).get('allowed_types', set())
                                widget_types.update(params[p_name]['allowed_types'])
                                all_widgets[widget_name]['params'][p_name]['allowed_types'] = widget_types
                        if 'allowed_values' in params[p_name]:
                            if p_name not in all_widgets[widget_name]['params']:
                                all_widgets[widget_name]['params'][p_name] = params[p_name]
                            else:
                                widget_vals = all_widgets[widget_name]['params'].get(p_name, {}).get('allowed_values', set())
                                widget_vals.update(params[p_name]['allowed_values'])
                                all_widgets[widget_name]['params'][p_name]['allowed_values'] = widget_vals
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

    def print_widget_inputs(self, widget_name, tag="release"):
        """
        Prints a list of expected user inputs for a widget.
        These are printed as the following:
        variable name - variable type - <extra information>

        for example:

        id - string - is a workspace object where the type is one of [KBaseGenomes.Genome, KBaseGenome.GenomeSet]
        or
        object_name - string - must be one of ["x", "y", "z"]

        Parameters
        ----------
        widget_name : string
            The name of the widget to print the inputs for.
        tag : string, default="release"
            The version tag to use when looking up widget information.
        """
        check_tag(tag, raise_exception=True)

        if widget_name not in self.widget_info[tag]:
            raise ValueError("Widget %s not found!" % widget_name)
        params = self.widget_info[tag][widget_name]["params"]
        print(widget_name)
        for p in params:
            if not params[p].get("is_constant", False):
                p_def = "%s - %s" % (p, params[p]["param_type"])
                if "allowed_types" in params[p]:
                    p_def = p_def + " - is a workspace object where the type is one of: %s" % (json.dumps(params[p]["allowed_types"]))
                if "allowed_values" in params[p]:
                    p_def = p_def + " - must be one of: %s" % (json.dumps(params[p]["allowed_values"]))
                print(p_def)

    def get_widget_constants(self, widget_name, tag="release"):
        """
        Returns a Dict with constants required for each widget.
        These constants are either part of the widget spec itself, or are provided by the current
        Narrative environment (e.g. Workspace name, user name).

        Parameters
        ----------
        widget_name : string
            The name of the widget to print the constants for.
        tag : string, default="release"
            The version tag to use when looking up widget information.

        """
        check_tag(tag, raise_exception=True)

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
        Renders a widget using the generic kbaseNarrativeOutputWidget container.

        Parameters
        ----------
        widget_name : string
            The name of the widget to print the widgets for.
        tag : string, default="release"
            The version tag to use when looking up widget information.
        **kwargs:
            These vary, based on the widget. Look up required variable names
            with WidgetManager.print_widget_inputs()
        """
        check_tag(tag, raise_exception=True)

        if widget_name not in self.widget_info[tag]:
            raise ValueError("Widget %s not found with %s tag!" % (widget_name, tag))

        input_data = self.get_widget_constants(widget_name, tag)
        # Let the kwargs override constants
        input_data.update(kwargs)

        input_template = """
        element.html("<div id='{{input_id}}' class='kb-vis-area'></div>");

        require(['kbaseNarrativeOutputCell'], function(KBaseNarrativeOutputCell) {
            var w = new KBaseNarrativeOutputCell($('#{{input_id}}'), {"data": {{input_data}},
                "type":"method",
                "widget":"{{widget_name}}",
                "cellId":"{{input_id}}",
                "title":"{{cell_title}}",
                "time":{{timestamp}}
            });
        });
        """

        js = Template(input_template).render(input_id=self._cell_id_prefix + str(uuid.uuid4()),
                                             widget_name=widget_name,
                                             input_data=json.dumps(input_data),
                                             cell_title="Title Goes Here",
                                             timestamp=int(round(time.time()*1000)))
        return Javascript(data=js, lib=None, css=None)


    def show_external_widget(self, widget, widget_title, objects, options, auth_required=True):
        """
        Renders a JavaScript widget as loaded from a very simple hosted CDN.
        The CDN information is fetched dynamically from the local configuration.

        Parameters
        ----------
        widget: string or list
            If a string, should just be the name of the widget
            If a list, should be components on the versioned CDN path to that widget.
            E.g. "pairedEndLibrary" vs. ["widgets", "0.1.0", "pairedEndLibrary"]

        widget_title: string
            The title that appears in the header of the created widget.

        objects: dictionary
            This dict has the object information that feeds into the widget.

        options: dictionary
            This dict has widget-specific options used for rendering

        auth_required: boolean, default == True
            Whether or not authentication is required for fetching object data
        """
        #  Interface from Narrative's Python layer.
        #  The template placeholders will be substituted.
        #  widget_name - the registered widget name
        #  input_data - the expected input data (aka params) for the widget
        #  token - the current auth token, made available within the containing python function
        #  element - the output cell DOM node, as visible to this code due to the environment it is inserted into.
        #
        #  The Javascript functions doc from Jupyter:
        #  "When this object is returned by an expression or passed to the
        #  display function, it will result in the data being displayed
        #  in the frontend. If the data is a URL, the data will first be
        #  downloaded and then displayed.
        #
        #  In the Notebook, the containing element will be available as `element`,
        #  and jQuery will be available.  Content appended to `element` will be
        #  visible in the output area.""

        input_template = """
        element.html("<div id='{{input_id}}' class='kb-vis-area'>");

        require([
            'narrativeDataWidget'
        ], function (Jupyter, NarrativeDataWidget) {

            var widgetDef = JSON.parse('{{widget_def}}'),
                objectRefs = JSON.parse('{{object_refs}}'),
                options = JSON.parse('{{options}}'),
                config = JSON.parse('{{config}}'),
                packageName = widgetDef.package,
                packageVersion = widgetDef.package_version,
                widgetName = widgetDef.name,
                widgetParentNode = $('#{{input_id}}')[0];

            var dataWidget = NarrativeDataWidget.make({
                package: packageName,
                version: packageVersion,
                widget: widgetName,
                title: widgetDef.title,
                parent: widgetParentNode,
                authRequired: config.authRequired
            });

            dataWidget.runWidget(objectRefs, options)
                .then(function () {
                    console.log('FINISHED');
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                    dataWidget.showErrorMessage(err.message);
                });
        });
        """

        # Prepare data for export into the Javascript.

        if type(widget) is list:
            widget_package = widget[0]
            widget_package_version = widget[1]
            widget_name = widget[2]
        else:
            widget_package = None
            widget_package_version = None
            widget_name = widget

        # Note: All Python->Javascript data flow is serialized as JSON strings.
        widget_def = {
            'id': self._cell_id_prefix + str(uuid.uuid4()),
            'package': widget_package,
            'package_version': widget_package_version,
            'name': widget_name,
            'title': widget_title
        }

        config = {
            'auth_required': auth_required
        }

        # context - Data for building the Javascript prior to insertion is provided
        # input_data - raw widget input data as provided by the caller
        js = Template(input_template).render(input_id=widget_def['id'],
                                             widget_def=json.dumps(widget_def),
                                             object_refs=json.dumps(objects),
                                             options=json.dumps(options),
                                             config=json.dumps(config))

        return Javascript(data=js, lib=None, css=None)