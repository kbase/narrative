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
        if (!params) {
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

    function renderTable() {
        return table({class: 'table'},[
            tr([
                th('Input'),
                th('Value')
            ])
        ]);
    }

    function factory() {
        var container, ui,
            params,
            paramsListener = null,
            jobId,
            runtime = Runtime.make();

        function startParamsListener() {
            paramsListener = runtime.bus().listen({
                channel: {
                    jobId: jobId
                },
                key: {
                    type: 'job-info'
                },
                handle: (message) => {
                    updateRowStatus(ui, message.jobInfo.job_params[0], container);
                }
            });
        }

        function start(arg) {
            return Promise.try(function() {
                if (container) {    // delete existing stuff.
                    detach();
                }
                container = arg.node;
                jobId = arg.jobId;
                ui = UI.make({ node: container });
                container.innerHTML = renderTable();

                startParamsListener();
                runtime.bus().emit('request-job-info', {
                    jobId: jobId,
                    parentJobId: arg.parentJobId
                });
                params = arg.params;
                updateRowStatus(ui, params, container);
            });
        }

        function stop() {
            if (paramsListener) {
                runtime.bus().removeListener(paramsListener);
            }
            paramsListener = null;
        }

        function detach() {
            stop();
            container.innerHTML = '';
        }

        return {
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function() {
            return factory();
        }
    };

});