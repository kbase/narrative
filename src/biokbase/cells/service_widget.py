import json
import uuid

from IPython.display import Javascript
from jinja2 import Template


#
# Provides rendering functions for the dynamic service cell.
#
def render(cell_id, module_name, widget_name, params, is_dynamic_service, widget_state):
    """
    Renders the initial Javascript for a service widget, specifically the "Root" widget,
    which accepts the parameters, and itself inserts the "Main" logic component.
    """
    root_element_id = uuid.uuid4()

    # Technicall there is no reason a service widget needs to be served from a
    # dynamic service. A core service could also offer small web apps, for instance to
    # display or visualize data from calls back to itself.
    # TODO: We may remove this ability, as we don't have any concrete plans to use
    # service widgets beyond dynamic services.
    if is_dynamic_service:
        dynamic_service = "true"
    else:
        dynamic_service = "false"

    # A mechanism for restoring widget state from the cell.
    widget_state_json = json.dumps(widget_state)
    params_json = json.dumps(params)

    # Note that "element" referenced below as a free variable, is guaranteed by the
    # iPython environment in which the code is injected. See
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
            state: {{widget_state}},
            moduleName: '{{module_name}}',
            widgetName: '{{widget_name}}',
            params: {{params}},
            isDynamicService: {{dynamic_service}}
        });
    });
    """
    js = Template(template).render(
        cell_id=cell_id,
        root_element_id=root_element_id,
        module_name=module_name,
        widget_name=widget_name,
        params=params_json,
        dynamic_service=dynamic_service,
        widget_state=widget_state_json,
    )

    return Javascript(data=js, lib=None, css=None)
