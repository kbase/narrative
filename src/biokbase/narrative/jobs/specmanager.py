"""Code for managing app specs."""

import json
from typing import Any

from biokbase.narrative import clients
from biokbase.narrative.app_util import app_param, app_version_tags, check_tag
from IPython.display import HTML
from jinja2 import Template


class SpecManager:
    """Class to wrangle app specs."""

    __instance = None

    app_specs: dict[str, Any] = {}
    type_specs: dict[str, Any] = {}

    def __new__(cls: type["SpecManager"]) -> "SpecManager":
        """Generate a new SpecManager instance."""
        if SpecManager.__instance is None:
            SpecManager.__instance = object.__new__(cls)
            SpecManager.__instance.reload()
        return SpecManager.__instance

    def get_spec(self: "SpecManager", app_id: str, tag: str = "release") -> dict[str, Any]:
        """Fetch the specs for an app."""
        self.check_app(app_id, tag, raise_exception=True)
        return self.app_specs[tag][app_id]

    def get_type_spec(
        self: "SpecManager",
        type_id: str,
        raise_exception: bool = True,
        allow_module_match: bool = True,
    ):
        """Fetch the specs for a type."""
        # if we can't find a full match for a type, try to match just the module
        if (type_id not in self.type_specs) and allow_module_match:
            type_id = type_id.split(".")[0]
        if (type_id not in self.type_specs) and raise_exception:
            err_msg = f'Unknown type id "{type_id}"'
            raise ValueError(err_msg)
        return self.type_specs.get(type_id)

    def reload(self: "SpecManager") -> None:
        """Reload all app specs into memory from the latest update."""
        client = clients.get("narrative_method_store")
        for tag in app_version_tags:
            specs = client.list_methods_spec({"tag": tag})
            spec_dict = {}
            for spec in specs:
                spec_dict[spec["info"]["id"]] = spec
            self.app_specs[tag] = spec_dict

        # And let's load all types from the beginning and cache them
        self.type_specs = client.list_categories({"load_types": 1})[3]

    def app_description(self: "SpecManager", app_id: str, tag: str = "release") -> str:
        """Return the app description as a printable object."""
        self.check_app(app_id, tag, raise_exception=True)

        info = clients.get("narrative_method_store").get_method_full_info(
            {"ids": [app_id], "tag": tag}
        )[0]

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

    def available_apps(self: "SpecManager", tag: str = "release") -> str:
        """List the set of available apps in a pretty HTML way.

        Usable only in the Jupyter notebook.
        """
        check_tag(tag, raise_exception=True)

        tmpl = """
        <b>Available {{tag}} apps</b><br>
        <table class="table table-striped table-bordered table-condensed">
        <thead>
            <tr>
                <th>Id</th>
                <th>Name</th>
                <th>Subtitle</th>
            </tr>
        </thead>
        {% for m in apps %}
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

        return HTML(
            Template(tmpl).render(
                tag=tag,
                apps=sorted(self.app_specs[tag].values(), key=lambda m: m["info"]["id"]),
            )
        )

    def app_usage(self: "SpecManager", app_id: str, tag: str = "release"):
        """Display app inputs and outputs.

        Format is as follows:
        App id
        App name
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
        self.check_app(app_id, tag, raise_exception=True)

        spec = self.app_specs[tag][app_id]

        # start with basic info
        usage = {
            "id": app_id,
            "name": spec["info"]["name"],
            "tag": tag,
            "subtitle": spec["info"]["subtitle"],
            "ver": spec["info"]["ver"],
            "params": self.app_params(spec),
        }

        return AppUsage(usage)

    def check_app(
        self: "SpecManager",
        app_id: str,
        tag: str = "release",
        raise_exception: bool = False,
    ) -> bool:
        """Check if a method (and release tag) is available for running and such.

        If raise_exception==True, and either the tag or app_id are invalid, a ValueError is raised.
        If raise_exception==False, and there's something invalid, it just returns False.
        If everything is hunky-dory, it returns True.
        """
        tag_ok = check_tag(tag, raise_exception=raise_exception)
        if not tag_ok:
            return False

        if app_id not in self.app_specs[tag]:
            if raise_exception:
                err_msg = f'Unknown app id "{app_id}" tagged as "{tag}"'
                raise ValueError(err_msg)
            return False

        return True

    def app_params(self: "SpecManager", spec: dict[str, Any]) -> list[dict[str, Any]]:
        """Return a list of dicts of params.

        Params are in the form key = id, val =
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
        params = [app_param(p) for p in spec["parameters"]]

        for p in spec.get("parameter_groups", []):
            p_info = {
                "id": p.get("id", ""),
                "is_group": True,
                "optional": p.get("optional", 0) == 1,
                "short_hint": p.get("short_hint", ""),
                "description": p.get("ui_name", ""),
                "parameter_ids": p.get("parameter_ids", []),
                "id_mapping": p.get("id_mapping", {}),
                "allow_multiple": p.get("allow_multiple", 0),
                "type": "group",
            }
            params.append(p_info)

        return sorted(params, key=lambda p: (p.get("optional", False), p.get("is_output", False)))


class AppUsage:
    """A tiny class for representing app usage in HTML (or as a pretty string)."""

    def __init__(self: "AppUsage", usage: dict[str, Any]) -> None:
        """Initialise a new AppUsage instance."""
        self.usage = usage

    def _repr_html_(self: "AppUsage") -> str:
        """Generate an HTML representation of the instance."""
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

    def __repr__(self: "AppUsage") -> str:
        """Generate a string representation of the instance."""
        return self.__str__()

    def __str__(self: "AppUsage") -> str:
        """Generate a string representation of the instance."""
        s = "\n".join(
            [
                f'id: {self.usage["id"]}',
                f'name: {self.usage["name"]}',
                f'subtitle: {self.usage["subtitle"]}',
                "parameters (*required):",
                "-----------------------",
            ]
        )
        for p in self.usage["params"]:
            if not p.get("is_constant", False):
                p_def = "\n{}{} - {}".format("*" if not p["optional"] else "", p["id"], p["type"])
                if "allowed_types" in p:
                    p_def = f"{p_def} - is a data object where the type is one of:" + json.dumps(
                        p["allowed_types"]
                    )
                # ??? indentation error?
                if "allowed_values" in p:
                    p_def = f"{p_def} - must be one of {json.dumps(p['allowed_values'])}"
                s = s + p_def

        return s
