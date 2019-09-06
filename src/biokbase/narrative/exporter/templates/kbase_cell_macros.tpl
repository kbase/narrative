{%- macro result_tab(metadata) -%}
    {% if metadata.output.report %}
        {% set rep = metadata.output.report %}
        {% if rep.objects|count > 0 %}
            {{ objects_panel(rep.objects, metadata.idx) }}
        {% endif %}
        {% if rep.html.links or rep.html.direct %}
            {{ report_panel(rep.html, metadata.idx) }}
        {% endif %}
        {% if rep.summary %}
            {{ summary_panel(rep.summary, metadata.idx) }}
        {% endif %}
    {% else %}
        <div>No output found.</div>
    {% endif %}
{%- endmacro -%}

{#
 Renders the report panel with embedded report iframe...
 #}
{% macro report_panel(html_info, idx) %}
    {% call render_panel("Report", idx) -%}
        {% if html_info.link_idx is not none and html_info.paths %}
            <div class="kb-app-report" data-path="{{ html_info.paths[html_info.link_idx] }}"></div>
        {% elif html_info.direct %}
            Some directly injected HTML up in here!
        {% endif %}
    {%- endcall %}
{% endmacro %}

{# Renders the report's text summary #}
{% macro summary_panel(summary, idx) %}
    {% call render_panel("Summary", idx) -%}
        <div class="kb-app-report-summary">{{ summary }}</div>
    {%- endcall %}
{% endmacro %}

{#
 Renders the objects panel. Shows a table of the created objects, embedded in a panel.
 #}
{% macro objects_panel(objects, idx) %}
    {% call render_panel("Objects", idx) %}
        <div class="kb-app-result-objects">
            <table class="table table-striped table-bordered">
                <tr>
                    <th style="width:30%">Created Object Name</th>
                    <th style="width:20%">Type</th>
                    <th style="width:30%">Description</th>
                <tr>
                {% for o in objects %}
                    <tr>
                        <td>{{o.name}}</td>
                        <td>{{o.type}}</td>
                        <td>{{o.description}}</td>
                    </tr>
                {% endfor %}
            </table>
        </div>
    {% endcall %}
{% endmacro %}

{#
 Renders a KBase-ified Bootstrap panel with content from the caller.
 #}
{% macro render_panel(title, idx) -%}
    <div class="panel panel-default">
        <div class="panel-heading">
            <div class="panel-title">
                <span data-toggle="collapse" data-target="#app-report-objects-{{idx}}">{{title}}</span>
            </div>
        </div>
        <div id="app-report-objects-{{idx}}" class="panel-collapse collapse in">
            <div class="panel-body">
                {{ caller() }}
            </div>
        </div>
    </div>
{%- endmacro %}

{%- macro render_output_cell(metadata, narrative_link) -%}
    {% call render_kbase_cell(metadata,
                              metadata.attributes.title|default('Output Cell', True),
                              metadata.attributes.subtitle|default('', True)) %}
        <div class="kb-temp-output-cell">
            <div>
                The viewer for the output created by this App is available at the original Narrative here:
                <a href="{{ narrative_link }}">{{ narrative_link }}</a>
            </div>
        </div>
    {% endcall %}
{%- endmacro -%}

{%- macro render_data_cell(metadata, narrative_link) -%}
    {% call render_kbase_cell(metadata,
                              metadata.attributes.title|default('Data Cell', True),
                              metadata.attributes.subtitle|default('', True)) %}
        <div class="kb-temp-data-cell">
            <div>
                The viewer for the data in this Cell is available at the original Narrative here:
                <a href="{{ narrative_link }}">{{ narrative_link }}</a>
            </div>
        </div>
    {% endcall %}
{%- endmacro -%}

{%- macro render_app_cell(metadata) -%}
    {% call render_kbase_cell(metadata,
                              metadata.attributes.title|default('App Cell', True),
                              metadata.attributes.subtitle|default('', True)) %}
        <div class="kb-app-controls-wrapper">
            <div class="kb-app-status">
                This app is {{ metadata.job.state }}
            </div>
            <div class="kb-app-controls">
                <button type="button" class="btn btn-primary kb-app-cell-btn app-view-toggle" data-idx={{metadata.idx}} data-view="config">
                    View Configure
                </button>
                <button type="button" class="btn btn-primary kb-app-cell-btn app-view-toggle selected" data-idx={{metadata.idx}} data-view="result">
                    Result
                </button>
            </div>
        </div>
        <div class="kb-app-body">
            <div id="app-{{ metadata.idx }}-config" class="kb-app-config" hidden>
            {% for b in [('input', 'Input Objects'), ('parameter', 'Parameters'), ('output', 'Output Objects')] %}
              {% if metadata.params[b[0]]|count > 0 %}
                <div class="kb-app-config-block">
                  <div class="kb-app-config-block-title">{{ b[1] }}</div>
                  {% for p in metadata.params[b[0]] %}
                    <div class="kb-app-param">
                      <div class="kb-app-param-name">{{ p.ui_name }}</div>
                      <div class="kb-app-param-field">{{ p.value }}</div>
                    </div>
                  {% endfor %}
                </div>
              {% endif %}
            {% endfor %}
            </div>

            <div id="app-{{metadata.idx}}-result" class="kb-app-results">
              {{ result_tab(metadata) }}
            </div>
        </div>
    {% endcall %}
{%- endmacro -%}

{%- macro render_kbase_cell(metadata, title, subtitle) -%}
    <div class="kb-cell-widget">
        <div style="display: flex">
            <div class="prompt input_prompt"></div>
            <div class="kb-app-cell">
                <div class="kb-app-header-container">
                    <div class="kb-app-header-title">
                        <div class="kb-app-header-icon">
                            {% if metadata.icon.type == 'image' %}
                            <div style="padding-top: 3px">
                                <img src="{{metadata.icon.icon}}" style="max-width: 50px; max-height: 50px; margin: 0"/>
                            </div>
                            {% elif metadata.icon.type == 'class' %}
                            <div>
                                <span class="fa-stack fa-2x">
                                    <span class="fa fa-{{ metadata.icon.shape }} fa-stack-2x" style="color: {{ metadata.icon.color }}"></span>
                                    <span class="fa fa-inverse fa-stack-1x {{ metadata.icon.icon }}"></span>
                                </span>
                            </div>
                            {% endif %}
                        </div>
                        <div class="kb-app-header-title-text">
                            <div class="title">{{ title }}</div>
                            <div class="subtitle">{{ subtitle }}</div>
                        </div>
                        {% if metadata.external_link %}
                        <div class="kb-external-link">
                            <a href="{{ metadata.external_link }}">
                                <span class="fa-stack fa-2x">
                                    <span class="fa fa-square fa-stack-2x"></span>
                                    <span class="fa fa-inverse fa-stack-1x fa-external-link"></span>
                                </span>
                            </a>
                        </div>
                        {% endif %}
                    </div>
                </div>
                <div class="kb-cell-body">
                    {{ caller() }}
                </div>
            </div>
        </div>
    </div>
{%- endmacro -%}

