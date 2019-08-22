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
        <div class="kb-app-report">
            Link idx - {{ html_info.link_idx }}<br>
            Links - {{ html_info.links }}<br>
            Direct - {{ html_info.direct }}<br>
            {% if html_info.link_idx is not none %}
            Link: {{ html_info.links[html_info.link_idx].URL }}
            {% elif html_info.direct %}
            Some directly injected HTML up in here!
            {% endif %}
        </div>
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
