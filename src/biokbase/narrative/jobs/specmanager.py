import biokbase.narrative.clients as clients
from .method_util import (
    method_version_tags,
    check_tag
)
import json
from jinja2 import Template
from IPython.display import HTML

class SpecManager(object):
    __instance = None

    method_specs = dict()

    def __new__(cls):
        if SpecManager.__instance is None:
            SpecManager.__instance = object.__new__(cls)
            SpecManager.__instance.reload_methods()
        return SpecManager.__instance

    def get_method_spec(self, method_id, tag='release'):
        self.check_method(method_id, tag, raise_exception=True)

        return self.method_specs[tag][method_id]

    def reload_methods(self):
        """
        Reloads all method specs into memory from the latest update.
        """
        for tag in method_version_tags:
            specs = clients.get('narrative_method_store').list_methods_spec({'tag': tag})

            spec_dict = dict()
            for spec in specs:
                spec_dict[spec['info']['id']] = spec
            self.method_specs[tag] = spec_dict

    def method_description(self, method_id, tag='release'):
        """
        Returns the method description as a printable object. Makes it kinda pretty? repr_html, maybe?
        """
        self.check_method(method_id, tag, raise_exception=True)

        info = clients.get('narrative_method_store').get_method_full_info({'ids': [method_id], 'tag': tag})[0]

        tmpl = """
        <div class="bg-info" style="padding:15px">
            <h1>{{info.name}} <small>{{info.module_name}}</small></h1>
            <p class='lead'>{{info.id}} - v{{info.ver}}</p>
        </div>
        <p class='lead'>{{info.subtitle}}</p>
        <hr>
        {{info.description}}
        """

        return HTML(Template(tmpl).render(info=info))

    def list_available_methods(self, tag="release"):
        """
        Lists the set of available methods in a pretty HTML way.
        Usable only in the Jupyter notebook.
        """
        check_tag(tag, raise_exception=True)

        tmpl="""
        <b>Available {{tag}} methods</b><br>
        <table class="table table-striped table-bordered table-condensed">
        <thead>
            <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Subtitle</th>
            </tr>
        </thead>
        {% for m in methods %}
            <tr>
                <td>
                    {{ m.info.id }}
                </td>
                <td>
                    {{ m.info.name }}
                </td>
                <td>
                    {{ m.info.subtitle }}
                </td>
            </tr>
        {% endfor %}
        </table>
        """

        return HTML(Template(tmpl).render(tag=tag,
                                          methods=sorted(list(self.method_specs[tag].values()), key=lambda m: m['info']['id'])))

    def method_usage(self, method_id, tag='release'):
        """
        Should show method inputs and outputs. Something like this:
        Method id
        Method name
        Subtitle
        Parameters
            1. xxx - string - data object - [type1, type2, type3]
            (subtitle, description, etc)
            2. yyy - int - from x to y
            (subtitle, description, etc)
            3. zzz - list of strings
            ...
            4. aaa - OUTPUT - ....
        """
        self.check_method(method_id, tag, raise_exception=True)

        spec = self.method_specs[tag][method_id]

        # start with basic info
        usage = {'id': method_id,
                 'name': spec['info']['name'],
                 'tag': tag,
                 'subtitle': spec['info']['subtitle'],
                 'ver': spec['info']['ver'],
                 'params': self.method_params(spec)}

        return MethodUsage(usage)

    def check_method(self, method_id, tag='release', raise_exception=False):
        """
        Checks if a method (and release tag) is available for running and such.
        If raise_exception==True, and either the tag or method_id are invalid, a ValueError is raised.
        If raise_exception==False, and there's something invalid, it just returns False.
        If everything is hunky-dory, it returns True.
        """
        tag_ok = check_tag(tag, raise_exception=raise_exception)
        if not tag_ok:
            return False

        if method_id not in self.method_specs[tag]:
            if raise_exception:
                raise ValueError('Unknown method id "{}" tagged as "{}"'.format(method_id, tag))
            return False

        return True

    def method_params(self, spec):
        """
        Should return a dict of params with key = id, val =
        {
            optional = boolean,
            is_constant = boolean,
            value = (whatever, optional),
            type = [text|int|float|list],
            is_output = boolean,
            short_hint = string,
            description = string,
            allowed_values = list (optional),
        }
        """
        params = list()
        for p in spec['parameters']:
            p_info = {'id': p['id']}

            if p['optional']==0:
                p_info['optional'] = False
            else:
                p_info['optional'] = True

            p_info['short_hint'] = p['short_hint']
            p_info['description'] = p['description']
            p_info['type'] = p['field_type']
            p_info['is_output'] = False

            p_info['allow_multiple'] = False
            if p['allow_multiple'] == 1:
                p_info['allow_multiple'] = True

            if p_info['type'].lower() == 'dropdown':
                p_info['allowed_values'] = [ opt['value'] for opt in p['dropdown_options']['options'] ]
            if p_info['type'] == 'checkbox':
                p_info['allowed_values'] = [True, False]

            defaults = p['default_values']
            if p_info['allow_multiple']:
                p_info['default'] = defaults
            else:
                p_info['default'] = defaults[0] if len(defaults) > 0 else None

            if 'checkbox_options' in p and len(p['checkbox_options'].keys()) == 2:
                p_info['checkbox_map'] = [p['checkbox_options']['checked_value'], p['checkbox_options']['unchecked_value']]

            if 'text_options' in p:
                opts = p['text_options']
                if 'is_output_name' in opts:
                    p_info['is_output'] = opts['is_output_name']
                if 'valid_ws_types' in opts and len(opts['valid_ws_types']) > 0:
                    p_info['allowed_types'] = opts['valid_ws_types']
                if 'validate_as' in opts and p_info['type'] != 'checkbox':
                    p_info['type'] = opts['validate_as']
                if 'min_float' in opts:
                    p_info['min_val'] = opts['min_float']
                if 'min_int' in opts:
                    p_info['min_val'] = opts['min_int']
                if 'max_float' in opts:
                    p_info['max_val'] = opts['max_float']
                if 'max_int' in opts:
                    p_info['max_val'] = opts['max_int']
                if 'regex_constraint' in opts and len(opts['regex_constraint']):
                    p_info['regex_constraint'] = opts['regex_constraint']

            params.append(p_info)

        return sorted(params, key=lambda p: (p['optional'], p['is_output']))



class MethodUsage(object):
    """
    A tiny class for representing method usage in HTML (or as as a pretty string)
    """
    def __init__(self, usage):
        self.usage = usage

    def _repr_html_(self):
        tmpl = """
        <h1>{{usage.name}}</h1>
        id = {{usage.id}}<br>
        {{usage.subtitle}}<br>
        Parameters (<span class="bg-warning">required</span>)
        <table class="table table-striped table-bordered table-condensed">
        <thead>
            <tr>
                <th>Id</th>
                <th>Type</th>
                <th>Allowed Types</th>
                <th>Description</th>
                <th>Allowed Values</th>
                <th>Default</th>
            </tr>
        </thead>
        {% for p in usage.params %}
            <tr {% if not p.optional %}class="warning"{% endif %}>
            <td>{{ p.id|e }}</td>
            <td>{{ p.type|e }}{% if p.is_output %} (output){% endif %}</td>
            <td>
            {% if p.allowed_types %}
                {% for t in p.allowed_types %}
                    {{t}}<br>
                {% endfor %}
            {% else %}
                N/A
            {% endif %}
            </td>
            <td>{{ p.short_hint|e }}</td>
            <td>
            {% if p.allowed_values %}
                {% for v in p.allowed_values %}
                    {{v}}<br>
                {% endfor %}
            {% else %}
                N/A
            {% endif %}
            </td>
            <td>
            {% if p.default %}
                {{ p.default }}
            {% endif %}
            </tr>
        {% endfor %}
        </table>
        """

        return Template(tmpl).render(usage=self.usage)

        # return "<h1>" + self.usage['name'] + "</h1>" + self.usage['id'] + "<br>"

    def __repr__(self):
        return self.__str__()

    def __str__(self):
        s = "id: {}\nname: {}\nsubtitle: {}\nparameters (*required):\n-----------------------".format(self.usage['id'], self.usage['name'], self.usage['subtitle'])

        for p in self.usage['params']:
            if not p.get("is_constant", False):
                p_def = "\n{}{} - {}".format('*' if not p['optional'] else '', p['id'], p['type'])
                if "allowed_types" in p:
                    p_def = p_def + " - is a data object where the type is one of: {}".format(json.dumps(p['allowed_types']))
                if "allowed_values" in p:
                    p_def = p_def + " - must be one of {}".format(json.dumps(p['allowed_values']))
                s = s + p_def

        return s