define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'common/format',
    'kb_common/html',
    './jobStateListRow'
], function(
    Promise,
    Runtime,
    UI,
    format,
    html,
    JobStateListRow
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


    function renderTable(){
        return table({class: 'table'},[
            tr([
                th('Job Id'),
                th("Status")
            ])
        ]);
    }

    function factory(config) {
        var container, ui, listeners = [],
            runtime = Runtime.make(),
            widgets = {},
            model = config.model;

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                ui = UI.make({ node: container });
                container.innerHTML = renderTable();

                arg.childJobs.forEach((job) => {
                    var jobId = job.job_id;
                    widgets[jobId] = JobStateListRow.make({
                        model:model
                    })
                })
                var clickFunction = arg.clickFunction;
                return Promise.all([
                    Object.keys(widgets).forEach((jobId) => {
                        widgets[jobId].start({
                            node: container.getElementsByTagName('tbody')[0],
                            jobId: jobId,
                            clickFunction: arg.clickFunction
                        })
                    })
                ])
            });
        }

        function stop() {
            return Promise.try(function() {
                // runtime.bus().removeListeners(listeners);
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };

});