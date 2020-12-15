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
            //TODO: is this the right endpoint to call? we should have access to get_object_info3 but for some reason it's not showing up on the workspaceClient

            //also need to figure out how to fake out the data we expect so i can get some results here to play around with

            //finally not sure if this method or call makes sense here, i was assuming we would get all report data and then hand it off to the requisite widgets. however if we are only retrieving object info here we can just do that as part of buildOutputWidget
            return workspaceClient
                .get_object_info_new({
                    objects: [
                        {
                            ref: params.report_ref,
                        },
                    ],
                })
                .then((result) => {
                    console.log('data: ', result);
                    return result;
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

                const result = model.getItem('exec.outputWidgetInfo');

                loadReportData(result.params).then((data) => {
                    //TODO: check first that we have objects created to display
                    //report.objects_created && report.objects_created.length

                    //then build output object and report widgets
                    let objectNode = document.createElement('div');
                    container.appendChild(objectNode);

                    let reportNode = document.createElement('div');
                    container.appendChild(reportNode);

                    buildOutputWidget({
                        node: objectNode,
                        data: data,
                    }).then(() => {
                        events.attachEvents(container);
                    });

                    buildReportWidget({
                        node: reportNode,
                        data: data,
                    }).then(() => {
                        events.attachEvents(container);
                    });
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
