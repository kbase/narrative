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

    Also, the tuple should be (spec_json, display_yaml), all as strings.
    """

    if spec_tuple is not None and validated_spec is None:
        nms = clients.get("narrative_method_store")
        validated = nms.validate_method({
            "id": "some_test_app",
            "spec_json": spec_tuple[0],
            "display_yaml": spec_tuple[1]
        })
        if validated.get('is_valid', 0) == 1:
            validated_spec = validated['method_spec']
        elif "errors" in validated and validated['errors']:
            raise Exception(validated['errors'])

    # Each of the values of the validated spec needs to be escaped for JS.
    # Specifically we turn " -> &quot; and ' -> &apos;
    # This isn't done so much on the frontend because of how it's already interpreted and
    # injected into the cell metadata,
    # but it's necessary for this little function.

    if "info" in validated_spec:
        for key in ["name", "subtitle", "tooltip"]:
            validated_spec["info"][key] = _fix_quotes(validated_spec["info"].get(key, ""))

    if "parameters" in validated_spec:
        for i in range(len(validated_spec["parameters"])):
            p = validated_spec["parameters"][i]
            for key in ["ui_name", "short_hint", "description"]:
                p[key] = _fix_quotes(p.get(key, ""))

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

def _fix_quotes(s: str) -> str:
    return s.replace('"', "&quot;").replace("'", "&apos;")
