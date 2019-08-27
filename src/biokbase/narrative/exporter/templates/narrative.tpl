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

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.css">
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
            'jquery-ui': 'components/jquery-ui/jquery-ui.min',
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
{%- endblock html_head -%}
</head>
{%- endblock header -%}

<body>
{% block body %}
  <div class="container">
    <div class="row">
      <div class="col-md-1"><h1><img src="{{ resources['kbase']['host'] }}/modules/plugins/mainwindow/resources/images/kbase_logo.png"/></h1></div>
      <div class="col-md-11">
        <h1>{{ resources['kbase']['title'] }}</h1>
        <div class="kb-author-list">
          {%- for author in resources['kbase']['authors'] -%}
            <a href="{{ resources.kbase.host }}{{ author.path }}">{{ author.name }}</a>
            {%- if not loop.last -%}, {% endif -%}
          {%- endfor -%}
        </div>
      </div>
    </div>
  </div>
  <div tabindex="-1" id="notebook" class="border-box-sizing">
    <div class="container" id="notebook-container">
{{ super() }}
    </div>
  </div>
  <style type="text/css">
    .white-text{color:white !important;}
  </style>
  <script>

  function toggleAppView(btn) {
    const appIdx = btn.dataset.idx;
    const id = 'app-' + appIdx;
    const view = btn.dataset.view;
    document.querySelectorAll('div[id^="' + id + '"]').forEach(node => {
      node.hidden = true;
    });
    document.querySelectorAll('button.app-view-toggle[data-idx="' + appIdx + '"]').forEach(node => {
      node.classList.remove('selected');
    });
    document.querySelector('div[id^="' + id + '-' + view + '"]').hidden = false;
    btn.classList.add('selected');
  }
  document.querySelectorAll('button.app-view-toggle').forEach((node) => {
    node.addEventListener('click', (e) => {
      toggleAppView(node);
    });
  });

  let fileSetServUrl = null,
      lastFSSUrlLookup = 0;
  function getFileServUrl(servWizardUrl) {
    const now = new Date();
    const fiveMin = 300000;  //ms
    if (fileSetServUrl == null || now.getTime() > lastFSSUrlLookup + fiveMin) {
      return fetch(servWizardUrl, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          method: 'ServiceWizard.get_service_status',
          params: [{
            module_name: 'HTMLFileSetServ',
            version: null
          }],
          version: '1.1',
          id: String(Math.random()).slice(2)
        })
      })
      .then(response => response.json())
      .then((res) => {
        fileSetServUrl = res.result[0].url;
        return fileSetServUrl;
      });
    }
    else {
      return new Promise((resolve) => {
        resolve(fileSetServUrl);
      });
    }
  }
  getFileServUrl("https://ci.kbase.us/services/service_wizard")
    .then((fssUrl) => {
      document.querySelectorAll('div.kb-app-report').forEach((node) => {
        const reportUrl = fssUrl + node.dataset.path;
        const iframe = document.createElement('iframe');
        iframe.setAttribute('id', 'iframe-' + String(Math.random()).slice(2));
        iframe.classList.add('kb-app-report-iframe');
        node.appendChild(iframe);
        iframe.setAttribute('src', reportUrl);
      });
    });


  </script>
{%- endblock body %}
</body>

{% block footer %}
{% endblock footer %}
</html>
