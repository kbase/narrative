define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'common/format',
    'kb_common/html'
], function(
    Promise,
    Runtime,
    UI,
    format,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th');

    function updateRowStatus(ui, params, container) {
        if (!params){
            return;
        }
        Object.keys(params).forEach((key) => {
            var selector = '[data-element-job-id="' + key + '"]';
            var row = container.querySelector(selector);
            if(row === null){
                row = document.createElement('tr');
                row.setAttribute('data-element-job-id', key);
                container.getElementsByTagName('tbody')[0].appendChild(row);
            }        
            row.innerHTML = td(key) + td(params[key]);
        })
    }
    function renderTable(){
        return table({class: 'table'},[
            tr([
                th('Input'),
                th("Value")
            ])
        ]);
    }

    function factory() {
        var container, ui,
            listeningForJob = false,
            params;

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                ui = UI.make({ node: container });
                container.innerHTML = renderTable();

                params = arg.params;
                updateRowStatus(ui, params, container, listeningForJob);
            });
        }

        function stop() {
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function() {
            return factory();
        }
    };

});