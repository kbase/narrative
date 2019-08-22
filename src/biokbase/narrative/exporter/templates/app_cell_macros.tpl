{%- macro result_tab(metadata) -%}
    {% if metadata.output.report %}
        {% if metadata.output.report.objects|count > 0 %}
            <div class="kb-app-result-objects">
                <table class="table table-striped table-bordered">
                    <tr>
                        <th style="width:30%">Created Object Name</th>
                        <th style="width:20%">Type</th>
                        <th style="width:30%">Description</th>
                    <tr>
                    {% for o in metadata.output.report.objects %}
                        <tr>
                            <td>{{o.name}}</td>
                            <td>{{o.type}}</td>
                            <td>{{o.description}}</td>
                        </tr>
                    {% endfor %}
                </table>
            </div>
        {% endif %}
        <div class="kb-app-result-report">
            # if there's a report, it gets embedded here.
            # this one'll be tricksy...
        </div>
    {% else %}
        <div>No output found.</div>
    {% endif %}
{%- endmacro -%}
