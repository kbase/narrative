"""
Build a simple HTML page showing all current icons in icons.json
"""
import json

f = open("icons.json")
page = """<html>
<head>
<link rel="stylesheet" href="http://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css">
</head>
<body>
<h1>KBase Icons<h1>
<h2>Apps and Methods</h2>
<table>
{methods}
</table>
<h2>Data types</h2>
<table>
{data}
</table>
</body>
</html>
"""
data = json.load(f)
def color_lookup(name):
    colors = data['colors']
    if name == "Genome":
        return '#2196F3'
    if name ==  "FBAModel":
        return '#4CAF50'
    if name ==  "FBA":
        return '#F44336'
    if name ==  "ContigSet":
        return '#FF9800'
    if name ==  "ProteomeComparison":
        return '#3F51B5'
    if name ==  "Tree":
        return '#795548'
    code = sum([ord(c) for c in name])
    return colors[ code % len(colors) ]

def row(name, icons):
    r = '<tr><td style="padding-top: 2em">{}</td>'.format(name)
    r += '<td class="fa-stack fa-2x" >'
    color = color_lookup(name)
    r += '<i class="fa fa-circle fa-stack-2x" style="color: {}"></i>'.format(color)
    for icon in icons:
        r += '<i class="fa fa-inverse fa-stack-1x {}"></i>'.format(icon)
    r += '</td></tr>'
    return r
def section(data):
    return '\n'.join([row(key, data[key]) for key in sorted(data.keys())])

kw = {k: section(data[k]) for k in ('methods', 'data')}
print(page.format(**kw))
