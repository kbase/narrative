define(['bluebird', 'common/events', './outputWidget', './reportWidget'], (
    Promise,
    Events,
    OutputWidget,
    ReportWidget
) => {
    'use strict';

    function ResultsTab(config) {
        const model = config.model,
            workspaceClient = config.workspaceClient;
        let container = null;

        function loadReportData(params) {
            workspaceClient
                .get_objects2({
                    objects: [
                        {
                            ref: params.report_ref,
                        },
                    ],
                })
                .then((data) => {
                    console.log('got object data: ', data);
                })
                .catch((err) => {
                    console.error('error looking up object data: ', err);
                });
        }

        function buildOutputWidget(arg) {
            const outputWidget = OutputWidget.make();

            return outputWidget.start({
                node: arg.node,
                data: arg.data,
            });
        }

        function buildReportWidget(arg) {
            const reportWidget = ReportWidget.make();

            return reportWidget.start({
                node: arg.node,
                data: arg.data,
            });
        }

        function start(arg) {
            return Promise.try(() => {
                container = arg.node;
                let events = Events.make();

                //TODO: not entirely certian this is the right data to send to each widget, or if there should be any other checks here. Will need to confirm by digging deeper into the resultsViewer widget, line 76
                const jobState = model.getItem('exec.jobState');
                const result = model.getItem('exec.outputWidgetInfo');

                loadReportData(result.params);

                //TODO: check first that we have objects created to display
                //report.objects_created && report.objects_created.length

                //then build output object and report widgets
                let objectNode = document.createElement('div');
                container.appendChild(objectNode);

                let reportNode = document.createElement('div');
                container.appendChild(reportNode);

                buildOutputWidget({
                    node: objectNode,
                    data: jobState.job_output.result,
                }).then(() => {
                    events.attachEvents(container);
                });

                buildReportWidget({
                    node: reportNode,
                    data: result.params,
                }).then(() => {
                    events.attachEvents(container);
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: ResultsTab,
    };
});
