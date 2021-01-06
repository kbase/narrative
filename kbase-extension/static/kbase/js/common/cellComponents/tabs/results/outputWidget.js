/**
 * Should get fed data to view.
 */
define(['bluebird', 'common/html', 'common/ui'], function (
    Promise,
    html,
    UI
) {
    'use strict';

    let tag = html.tag,
        div = tag('div'),
        tr = tag('tr'),
        th = tag('th'),
        td = tag('td'),
        table = tag('table');

    function OutputWidget() {
        let container, ui;

        /**
         *
         * @param {Array} reports
         * @param {Object} workspaceClient
         * @returns a Promise resolving into a list of objects, with keys name, ref, description, and type:
         */
        function fetchCreatedObjectData(reports, workspaceClient) {
            // making a list of the following will just fetch the
            // 'objects_created' lists from each report. Should be a more
            // lightweight call.
            const reportLookupParam = reports.map((ref) => {
                return {
                    ref: ref,
                    included: ['objects_created']
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
            let createdObjects = {};
            let objectKeys = [];
            return workspaceClient.get_objects2({objects: reportLookupParam})
                .then((reportData) => {
                    reportData.data.forEach(report => {
                        if ('objects_created' in report.data) {
                            report.data.objects_created.forEach(obj => {
                                createdObjects[obj.ref] = obj;
                            });
                        }
                    });
                    // we'll use this later to unpack object infos, and JS doesn't guarantee
                    // the same order.
                    objectKeys = Object.keys(createdObjects);
                    // turn the refs into an array: [{"ref": ref}]
                    const infoLookupParam = objectKeys.map(ref => ({'ref': ref}));
                    return workspaceClient.get_object_info_new({objects: infoLookupParam});
                })
                .then((objectInfo) => {
                    objectInfo.forEach((info, idx) => {
                        const ref = objectKeys[idx];
                        createdObjects[ref].name = info[1];
                        createdObjects[ref].type = info[2];
                    });
                    return Object.values(createdObjects);
                });
        }

        /**
         *
         * @param {Array} reports an array of report object references
         * @param {Object} workspaceClient an authenticated workspace client
         */
        function renderOutput(reports, workspaceClient) {
            const emptyData = div('No objects created');
            if (reports.length === 0) {
                return Promise.resolve(emptyData);
            }
            return fetchCreatedObjectData(reports, workspaceClient)
                .then((data) => {
                    if (data.length === 0) {
                        return emptyData;
                    }
                    let objectTable = table({class: 'table table-bordered table-striped'}, [
                        tr([
                            th('Created Object Name'),
                            th('Type'),
                            th('Description')
                        ]),
                        ...data.map(obj => {
                            return tr([
                                td(obj.name),
                                td(obj.type),
                                td(obj.description)
                            ]);
                        })
                    ]);
                    return objectTable;
                })
                .catch(() => {
                    return div('Unable to fetch created objects!');
                });
        }

        /**
         * 1. Make the main layout
         * 2. Fetch the data, build the table as detached DOM elems
         * 3. Put the layout in place
         * 4. Add the ui.buildCollapsiblePanel thing, with the table in the body
         * @param {object}
         *  - node the DOM node to attach to
         *  - reports
         *  - workspaceClient
         * @returns {Promise} resolves when the layout is complete
         */
        function doAttach(arg) {
            container = arg.node;
            ui = UI.make({
                node: container,
            });
            // this is the main layout div. don't do anything yet.
            // TODO: maybe include a loading spinner so it can look busy?
            container.innerHTML = div({
                dataElement: 'created-objects',
                class: 'kb-created-objects'
            });
            return renderOutput(arg.reports, arg.workspaceClient)
                .then((renderedOutput) => {
                    ui.setContent('created-objects',
                        ui.buildCollapsiblePanel({
                            title: 'Objects',
                            name: 'created-objects-toggle',
                            hidden: false,
                            type: 'default',
                            classes: ['kb-panel-container'],
                            body: renderedOutput,
                        }));
                });
        }

        /**
         *
         * @param {object} arg
         * - node - the DOM node to build this under
         * - reports - a list of report ids to fetch the relevant info from
         * - workspaceClient - a workspace client to use
         */
        function start(arg) {
            // send parent the ready message
            return doAttach(arg)
                .catch((err) => {
                    console.error('Error while starting the created objects view', err);
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
        make: OutputWidget,
    };
});
