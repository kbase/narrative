define(['bluebird', 'common/events', './outputWidget', './reportWidget'], (
    Promise,
    Events,
    OutputWidget,
    ReportWidget
) => {
    'use strict';

    /**
     *
     * @param {object} config each tab for a cell needs the following:
     * - model - a Props object containing the data model for the cell
     * - workspaceClient - a workspace client authenticated to the current user
     */
    function ResultsTab(config) {
        const model = config.model,
            workspaceClient = config.workspaceClient;
        let container = null;

        /**
         * This should know how to examine the model for report info. Not sure how to do that yet,
         * but we can make some assumptions.
         * 1. There will be a list of outputs for each data type.
         * 2. That will be processed and put in place by whatever controlling cell. (as of 12/17/20,
         *    this is focused on the bulk processing / import cells, so start there).
         * 3. Those outputs will include a list of report object ids for each data type.
         * 4. At this point, this function should just return the list of report object UPAs /
         *    references. To minimize service calls and data transfer, the individual components
         *    should just fetch the data they need.
         *    That means the "created objects" view should just fetch down that path and collate them
         *    all, and the report view should know how to fetch and render an individual report on
         *    request.
         * @returns {Array} an array of report ids.
         */
        function getReportRefs() {
            const jobStates = model.getItem('exec.jobState.child_jobs');
            const reportRefs = [];
            jobStates.forEach((job) => {
                if ('result' in job && job.result.length > 0) {
                    job.result.forEach((result) => {
                        if ('report_ref' in result) {
                            reportRefs.push(result.report_ref);
                        }
                    });
                }
            });
            return reportRefs;
        }

        /**
         *
         * @param {*} arg
         */
        function buildOutputWidget(node, reports) {
            const outputWidget = OutputWidget.make();

            return outputWidget.start({
                node,
                reports,
                workspaceClient,
            });
        }

        function buildReportWidget(node, reports) {
            const reportWidget = ReportWidget.make();

            return reportWidget.start({
                node,
                reports,
                workspaceClient,
            });
        }

        /**
         *
         * @param {object} arg startup arguments
         */
        function start(arg) {
            container = arg.node;
            let events = Events.make();

            const reports = getReportRefs();

            let spinnerNode = document.createElement('div');
            spinnerNode.classList.add('kb-loading-spinner');
            spinnerNode.innerHTML = '<i class="fa fa-spinner fa-spin fa-2x"/>';
            container.appendChild(spinnerNode);

            let objectNode = document.createElement('div');
            container.appendChild(objectNode);
            objectNode.classList.add('hidden');

            let reportNode = document.createElement('div');
            container.appendChild(reportNode);
            reportNode.classList.add('hidden');

            return Promise.all([
                buildOutputWidget(objectNode, reports),
                buildReportWidget(reportNode, reports),
            ])
                .then(() => {
                    events.attachEvents(container);
                    reportNode.classList.remove('hidden');
                    objectNode.classList.remove('hidden');
                })
                .finally(() => {
                    container.removeChild(spinnerNode);
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
