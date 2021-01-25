/**
 * This renders a list of KBase Report objects. Each one is expandable and loads up under a caret.
 */
define([
    'bluebird',
    'jquery',
    'common/html',
    'common/ui',
    'common/events',
    'kbaseReportView'
], (
    Promise,
    $,
    html,
    UI,
    Events,
    KBaseReportView
) => {
    'use strict';

    let tag = html.tag,
        div = tag('div'),
        a = tag('a');

    function ReportWidget() {
        let container, ui;

        /**
         *
         * @param {Array} objectData - an Array of object data, each element is an Object with
         *   these properties:
         *   - ref - string, the object ref
         *   - reportRef - string, the report object ref that this object is from
         *   - description - string, object description
         *   - name - string, the object name
         *   - type - string, the type of workspace object (full form - Module.Type-Major.Minor)
         * @param {Object} events - the events object
         */
        function renderReports(objectData, events) {
            return objectData.map((objInfo) => {
                return div([
                    a({
                        class: 'kb-report__toggle collapsed',
                        dataToggle: 'collapse',
                        ariaExpanded: false,
                        id: events.addEvent({
                            type: 'click',
                            handler: (e) => toggleReportView(e, objInfo)
                        })
                    }, objInfo.name)
                ]);
            });
        }

        function toggleReportView(e, objInfo) {
            const toggleHeader = e.target;
            if (!toggleHeader.classList.contains('collapsed')) {
                toggleHeader.parentElement.lastElementChild.remove();
            }
            else {
                const reportContainer = document.createElement('div');
                toggleHeader.parentElement.appendChild(reportContainer);
                new KBaseReportView($(reportContainer), {report_ref: objInfo.reportRef});
            }
            toggleHeader.classList.toggle('collapsed');
        }

        /**
         *
         * @param {object} arg
         * - node - the DOM node to attach to
         * - objectData - an array of report references to render from
         * - workspaceClient - a workspace client to use to fetch report info
         */
        function doAttach(arg) {
            container = arg.node;
            ui = UI.make({
                node: container,
            });
            let events = Events.make();
            // this is the main layout div. don't do anything yet.
            container.innerHTML = div({
                dataElement: 'created-objects',
                class: 'kb-created-objects'
            });

            ui.setContent('created-objects',
                ui.buildCollapsiblePanel({
                    title: 'Reports',
                    name: 'created-objects-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: renderReports(arg.objectData, events),
                }));

            events.attachEvents(container);
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
            return Promise.resolve(doAttach(arg))
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
        make: ReportWidget,
    };
});
