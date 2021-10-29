/**
 * This renders a list of KBase Report objects. Each one is expandable and loads up under a caret.
 */
define(['bluebird', 'jquery', 'common/html', 'common/ui', 'common/events', 'kbaseReportView'], (
    Promise,
    $,
    html,
    UI,
    Events,
    KBaseReportView
) => {
    'use strict';

    const tag = html.tag,
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
                // clean up objInfo before rendering / passing to toggleReportView
                let name = objInfo.name;
                if (!name) {
                    if (objInfo.ref) {
                        name = `Object ${objInfo.ref} not found, may have been deleted`;
                    } else {
                        name = 'Object not found';
                    }
                }

                let reportElem = '';
                if (objInfo.reportRef) {
                    reportElem = a(
                        {
                            class: 'kb-report__toggle collapsed',
                            dataToggle: 'collapse',
                            ariaExpanded: false,
                            id: events.addEvent({
                                type: 'click',
                                handler: (e) => toggleReportView(e, objInfo.reportRef),
                            }),
                        },
                        name
                    );
                } else {
                    reportElem = name + ' (report not found)';
                }
                return div([reportElem]);
            });
        }

        /**
         * Toggles viewing of a report. If it's currently viewed, then this will remove the
         * report view. Otherwise, it will instantiate a new report view widget.
         * @param {Event} e - a DOM event that triggered this report.
         * @param {String} reportRef - from the arg, same as used to render the list of reports
         *  this is required to have the reportRef key, which is an object UPA
         */
        function toggleReportView(e, reportRef) {
            const toggleHeader = e.target;
            if (!toggleHeader.classList.contains('collapsed')) {
                toggleHeader.parentElement.lastElementChild.remove();
            } else {
                const reportContainer = document.createElement('div');
                toggleHeader.parentElement.appendChild(reportContainer);
                new KBaseReportView($(reportContainer), {
                    report_ref: reportRef,
                    autoRender: false,
                }).loadAndRender();
            }
            toggleHeader.classList.toggle('collapsed');
        }

        /**
         * Attaches the widget to its DOM node and renders the report options.
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
            const events = Events.make();
            // this is the main layout div. don't do anything yet.
            container.innerHTML = div({
                dataElement: 'reports-view',
                class: 'kb-reports-view',
            });

            let content = '';
            if (arg.objectData && arg.objectData.length) {
                content = ui.buildCollapsiblePanel({
                    title: 'Reports',
                    name: 'reports-view-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: renderReports(arg.objectData, events),
                });
            }

            ui.setContent('reports-view', content);

            events.attachEvents(container);
        }

        /**
         *
         * @param {object} arg
         * - node - the DOM node to build this under
         * - objectData - a list of objectData elements, used to produce reports.
         *   Each element has these keys:
         *   - description - string, description of the object
         *   - name - string, name of the object
         *   - ref - string, the object UPA
         *   - reportRef - string, the report UPA
         *   - type - string, the registered workspace type of the object
         * - workspaceClient - a workspace client to use
         */
        function start(arg) {
            // send parent the ready message
            return Promise.resolve(doAttach(arg)).catch((err) => {
                console.error('Error while starting the created objects view', err);
            });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

        return {
            start,
            stop,
            toggleReportView,
        };
    }

    return {
        make: ReportWidget,
    };
});
