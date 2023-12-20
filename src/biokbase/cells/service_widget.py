import json
import uuid

from IPython.display import Javascript
from jinja2 import Template

#
# Provides rendering functions for the dynamic service cell.
#

def render_app(cell_id, module_name, app_name, params, is_dynamic_service, widgetState):
    # note the magic jquery "element"
    root_element_id = uuid.uuid4()
    if is_dynamic_service:
        dynamic_service = "true"
    else:
        dynamic_service = "false"
        
    # Weird how widget state starts as javascript, then json as it transits all the way to pythoninterop
    # where it becomes Python, and now we need to tansform back to json so it
    # can become javascript again!.
    widget_state = json.dumps(widgetState)
    params_json = json.dumps(params)

    # Note that "element" referenced below as a free variable, is guaranteed by the iPython environment
    # in which the code is injected. 
    # See
    # https://ipython.readthedocs.io/en/stable/api/generated/IPython.display.html#IPython.display.Javascript
    
    template = """
    element.html('<div id="{{root_element_id}}"></div>');
    require([
        'nbextensions/serviceWidgetCell/widgets/Root'
    ], (
        Root
    ) => {
        Root({
            hostNodeId: "{{root_element_id}}",
            cellId: "{{cell_id}}",
            state: {{ widget_state }},
            moduleName: '{{module_name}}',
            appName: '{{app_name}}',
            params: {{params}},
            isDynamicService: {{dynamic_service}}
        });
    });
    """
    js = Template(template).render(
        cell_id=cell_id,
        root_element_id=root_element_id,
        module_name=module_name,
        app_name=app_name,
        params=params_json,
        dynamic_service=dynamic_service,
        widget_state=widget_state
    )

    return Javascript(data=js, lib=None, css=None)
