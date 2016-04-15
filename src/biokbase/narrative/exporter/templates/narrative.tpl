{%- extends 'narrative_basic.tpl' -%}
{% from 'mathjax.tpl' import mathjax %}


{%- block header -%}
<!DOCTYPE html>
<html>
<head>
{%- block html_head -%}
<meta charset="utf-8" />
<title>KBase Narrative - {{ resources['kbase']['title'] }}</title>

<script src="https://cdnjs.cloudflare.com/ajax/libs/require.js/2.1.10/require.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>

{% for css in resources.inlining.css -%}
    <style type="text/css">
    {{ css }}
    </style>
{% endfor %}

<style type="text/css">
/* Overrides of notebook CSS for static HTML export */
body {
  overflow: visible;
  padding: 8px;
}

div#notebook {
  overflow: visible;
  border-top: none;
}

@media print {
  div.cell {
    display: block;
    page-break-inside: avoid;
  }
  div.output_wrapper {
    display: block;
    page-break-inside: avoid;
  }
  div.output {
    display: block;
    page-break-inside: avoid;
  }
}
</style>

<link rel="stylesheet" href="https://narrative-dev.kbase.us/static/ext_components/font-awesome/css/font-awesome.min.css">
<link rel="stylesheet" href="{{ resources['kbase']['host'] }}/static/kbase/css/landing-pages.css">
<link rel="stylesheet" href="{{ resources['kbase']['host'] }}/static/kbase/css/kbaseEditor.css">
<link rel="stylesheet" href="{{ resources['kbase']['host'] }}/static/kbase/css/kbaseNotify.css">
<link rel="stylesheet" href="{{ resources['kbase']['host'] }}/static/kbase/css/contigBrowserStyles.css">
<!-- Loading mathjax macro -->
{{ mathjax() }}

<script src="{{ resources['kbase']['host'] }}/static/narrative_paths.js"></script>
<script>
    require.config({
        baseUrl: "{{ resources['kbase']['host'] }}/static/",
        paths: {
            jquery: 'components/jquery/jquery-min',
            underscore : 'components/underscore/underscore-min',
            backbone : 'components/backbone/backbone-min',
            bootstrap: 'components/bootstrap/js/bootstrap.min',
            'jquery-ui': 'components/jquery-ui/ui/minified/jquery-ui.min',
            kbaseAuthenticatedWidget: 'kbase/js/widgets/kbaseStaticAuthenticatedWidget'
        },
        shim: {
            underscore: {
                exports: '_'
            },
            backbone: {
                deps: ["underscore", "jquery"],
                exports: "Backbone"
            },
            bootstrap: {
                deps: ["jquery"],
                exports: "bootstrap"
            },
            'jquery-ui': {
                deps: ['jquery'],
                exports: '$'
            }
        },
        map: {
            '*':{
                'jqueryui': 'jquery-ui',
            }
        }
    });
</script>
<script src="{{ resources['kbase']['host'] }}/static/kbase/js/widgets/narrative_core/kbaseNarrativeOutputCell.js"></script>
{%- endblock html_head -%}
</head>
{%- endblock header -%}

<body>
{% block body %}
  <div class="container">
    <div class="row">
      <div class="col-md-1"><h1><img src="{{ resources['kbase']['host'] }}/static/kbase/images/kbase_logo.png"/></h1></div>
      <div class="col-md-11">
        <h1>{{ resources['kbase']['title'] }}</h1>
      </div>
    </div>
  </div>
  <div tabindex="-1" id="notebook" class="border-box-sizing">
    <div class="container" id="notebook-container">
{{ super() }}
    </div>
  </div>
  <div style="bottom:20px;right:20px;position:fixed;opacity:.8;z-index:100" class="btn btn-lg btn-info hide-input">Toggle Widget Inputs</div>
  <style type="text/css">
    .white-text{color:white !important;}
  </style>
  <script>
  $('.hide-input').click(function() {
    $('div[class^=kb-cell-]').closest('div.cell').find('div.input').toggle();
    $('div[class^=kb-cell-]').closest('div.cell').find('div.output_prompt').toggleClass('white-text');
  });
  $('.hide-input').click();
  </script>
{%- endblock body %}
</body>

{% block footer %}
{% endblock footer %}
</html>
