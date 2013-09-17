"""

Module for support of KBase widgets in the narrative

Currently just a prototype that wraps some static widget declarations.

"""

widgetdef = {}

widgetdef['rickroll'] = """
<object width="840" height="630">
    <param name="movie"
value="//www.youtube.com/v/oHg5SJYRHA0?version=3&amp;hl=en_US"></param>
    <param name="allowFullScreen" value="true"></param>
    <param name="allowscriptaccess" value="always"></param>
    <embed src="//www.youtube.com/v/dQw4w9WgXcQ?version=3&amp;hl=en_US;autoplay=1"
type="application/x-shockwave-flash" width="840" height="630"
allowscriptaccess="always" allowfullscreen="true">
    </embed>
    </object>
"""

def new_widget( widget_name, **kwargs):
    """
    This method takes a cell index in the notebook and a widget name and populates that cell with the contents of the
    widgetdef that matches the name.

    Eventually the kwargs will be used to populate things that matter like initializing the widget with data and callbacks 
    """
    try:
        html = widgetdef[widgetname]
    except KeyError, e:
        raise Exception("%s not a recognized widget" % widgetname)
    # Use a dict to return a response object
    res = { 'html' : html,
            '_' : _,
            'finish_callback' : None
            }
    return res


