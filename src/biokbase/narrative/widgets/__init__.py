"""

Module for support of KBase widgets in the narrative

Currently just a prototype that wraps some static widget declarations.

"""

import os
import string
import random
from jinja2 import Template

widgetdef = {}
basepath = os.path.dirname(os.path.realpath(__file__))

# Return the basic javascript source for a widget
def get_widget_js( jsfile ):
    try:
        with open( os.path.join(basepath,"js",jsfile), 'r') as f:
            file_contents = f.read()
    except Exception, e:
        raise
    return file_contents

# Widget declarations as jinja 2 templates
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

widgetdef['kbaseGenomeOverview'] = """
<div id="widget_container_{{rand_id}}"></div>
<script>
%s
</script>
<script>
var $newDiv = $("<div/>");
$('#widget_container_{{rand_id}}').append($newDiv);
$newDiv.KBaseGenomeOverview({ genomeID: "{{object_id}}" });
</script>
""" % get_widget_js('genomes/kbaseGenomeOverview.js')

widgetdef['network-coex'] = """
<div id="widget_container_{{rand_id}}"></div>
<script>
    var token = $("#login-widget").kbaseLogin("session", "token");
    $('#widget_container_{{rand_id}}').ForceDirectedNetwork({
        new_workspaceID: "{{workspace_id}}",
        token: token
    });
</script>
"""

def new_widget( widget_name, **kwargs):
    """
    This method takes a widget_name and a dictionary of values to be evaluated in
    the widget template

    Eventually the kwargs will be used to populate things that matter like initializing the widget with data and callbacks 
    """
    try:
        wtemp = widgetdef[widget_name]
    except KeyError, e:
        raise Exception("%s not a recognized widget" % widget_name)
    except:
        raise
    try:
        if not 'rand_id' in kwargs:
            kwargs['rand_id'] = ''.join(random.choice(string.ascii_uppercase + string.digits) for x in range(10))
        wtemp = Template(wtemp)
        res = wtemp.render( kwargs)
    except:
        raise
    return res


