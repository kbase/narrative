define(['bluebird', 'common/ui', 'common/events', './outputWidget', './reportWidget'], (
    Promise,
    UI,
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
            const jobindex = model.getItem('exec.jobs.byId');
            const jobStates = Object.values(jobindex);

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
        function buildOutputWidget(node, objectData) {
            const outputWidget = OutputWidget.make();

            return outputWidget.start({
                node,
                objectData,
                workspaceClient,
            });
        }

        function buildReportWidget(node, objectData) {
            const reportWidget = ReportWidget.make();

            return reportWidget.start({
                node,
                objectData,
                workspaceClient,
            });
        }

        /**
         * Returns a Promise that resolves into the following structure (repeat the object info structure):
         * [{
         *     name: string,
         *     type: string,
         *     description: string,
         *     reportRef: string,      // the report that references this object
         *     ref: string              // the created object
         * }]
         * @param {Array} reports an array of report workspace references
         * @param {Object} workspaceClient an authenticated workspace client
         * @returns a Promise resolving into a list of objects, with keys name, ref, description, and type:
         */
        function fetchReportData(reports) {
            // making a list of the following will just fetch the
            // 'objects_created' lists from each report. Should be a more
            // lightweight call.
            const reportLookupParam = reports.map((ref) => {
                return {
                    ref: ref,
                    included: ['objects_created'],
                };
            });
            /* when we do the lookup, data will get returned as:
             * {
             *    data: [{
             *       data: {
             *          objects_created: [{
             *             description: str,
             *             ref: str
             *          }]
             *       }
             *    }]
             * }
             */
            // key this off of the object id to make lookups easier once we
            // fetch the names later.
            const createdObjects = {};
            let objectKeys = [];
            return workspaceClient
                .get_objects2({ objects: reportLookupParam })
                .then((reportData) => {
                    reportData.data.forEach((report, idx) => {
                        if ('objects_created' in report.data) {
                            report.data.objects_created.forEach((obj) => {
                                createdObjects[obj.ref] = obj;
                                createdObjects[obj.ref].reportRef = reportLookupParam[idx].ref;
                            });
                        }
                    });
                    // we'll use this later to unpack object infos, and JS doesn't guarantee
                    // the same order.
                    objectKeys = Object.keys(createdObjects);
                    // turn the refs into an array: [{"ref": ref}]
                    const infoLookupParam = objectKeys.map((ref) => ({ ref: ref }));
                    return workspaceClient.get_object_info_new({ objects: infoLookupParam });
                })
                .then((objectInfo) => {
                    objectInfo.forEach((info, idx) => {
                        const ref = objectKeys[idx];
                        createdObjects[ref].name = info[1];
                        createdObjects[ref].type = info[2];
                        createdObjects[ref].wsInfo = info;
                    });
                    return Object.values(createdObjects);
                });
        }

        /**
         *
         * @param {object} arg startup arguments
         */
        function start(arg) {
            container = arg.node;
            const events = Events.make();

            const reports = getReportRefs();

            const spinnerNode = document.createElement('div');
            spinnerNode.classList.add('kb-loading-spinner');
            spinnerNode.innerHTML = UI.loading({ size: '2x' });
            container.appendChild(spinnerNode);

            const objectNode = document.createElement('div');
            const reportNode = document.createElement('div');
            return fetchReportData(reports)
                .then((reportData) => {
                    container.appendChild(objectNode);
                    objectNode.classList.add('hidden');

                    container.appendChild(reportNode);
                    reportNode.classList.add('hidden');

                    return Promise.all([
                        buildOutputWidget(objectNode, reportData),
                        buildReportWidget(reportNode, reportData),
                    ]);
                })
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
