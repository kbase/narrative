from IPython.display import Javascript
from jinja2 import Template
from biokbase.narrative import clients
import json


def generate_app_cell(validated_spec=None, spec_tuple=None):
    """Produces an invisible blob of JavaScript that inserts a new cell in the notebook,
    and crams the validated_spec in it. It then removes itself, so it won't happen again
    on page reload.

    For the inputs, validated_spec > spec_tuple. That is, if validated_spec is present,
    that's always used. if spec_tuple is there, and validated_spec is not, then the
    tuple's used.

    Also, the tuple should be (app_id, spec_json, display_yaml), all as strings.
    """

    if spec_tuple is not None and validated_spec is None:
        nms = clients.get("narrative_method_store")
        validated = nms.validate_method(dict(zip(['id', 'spec_json', 'display_yaml'], spec_tuple)))
        if validated.get('is_valid', 0) == 1:
            validated_spec = validated['method_spec']
        elif "errors" in validated and validated['errors']:
            raise Exception(validated['errors'])

    js_template = """
        var outputArea = this,
            cellElement = outputArea.element.parents('.cell'),
            cellIdx = Jupyter.notebook.get_cell_elements().index(cellElement),
            thisCell = Jupyter.notebook.get_cell(cellIdx),
            spec_json = '{{spec}}',
            cellData = {
                type: 'devapp',
                appTag: 'dev',
                appSpec: JSON.parse(spec_json)
            };
        Jupyter.narrative.insertAndSelectCell('code', 'below', cellIdx, cellData);
    """
    js_code = Template(js_template).render(spec=json.dumps(validated_spec))

    return Javascript(data=js_code, lib=None, css=None)
