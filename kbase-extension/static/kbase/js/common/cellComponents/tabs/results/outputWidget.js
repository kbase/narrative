/**
 * Should get fed data to view.
 */
define([
    'bluebird',
    'base/js/namespace',
    'common/html',
    'common/ui',
    'util/kbaseApiUtil',
    'jquery',
    'jquery-dataTables',
], (Promise, Jupyter, html, UI, APIUtil, $) => {
    'use strict';

    const tag = html.tag,
        div = tag('div'),
        tr = tag('tr'),
        th = tag('th'),
        thead = tag('thead'),
        table = tag('table'),
        a = tag('a'),
        tablePageLength = 50,
        cssBaseClass = 'kb-output-widget';

    function OutputWidget() {
        let container, ui;

        /**
         * Renders the table of created output objects. Each row will have 3 elements:
         * - name - the name of the created object. This will be a link that, when clicked, will spawn a
         *    viewer cell for that object
         * - type - a string for the object's type
         * - description - a string for the object's description
         * - wsInfo - the object info array from the Workspace service,
         * - ref - string - the object's workspace reference
         * @param {Array} objectData an array of object data. Each element is expected
         *  to have the properties detailed above. If any are missing, they'll get placeholder values instead.
         */
        function renderOutput(objectData) {
            if (objectData.length === 0) {
                return div('No objects created');
            }

            return table(
                {
                    class: `table table-striped ${cssBaseClass}__table`,
                    style: 'width: 100%',
                    dataElement: 'objects-table',
                },
                [thead(tr([th('Created Object Name'), th('Type'), th('Description')]))]
            );
        }

        /**
         * 1. Make the main layout
         * 2. Put the layout in place
         * 3. Add the ui.buildCollapsiblePanel thing, with the table in the body
         * @param {object}
         *  - node - the DOM node to attach to
         *  - objectData -
         * @returns {Promise} resolves when the layout is complete
         */
        function doAttach(arg) {
            container = arg.node;
            ui = UI.make({
                node: container,
            });
            // this is the main layout div. don't do anything yet.
            container.innerHTML = div({
                dataElement: 'created-objects',
                class: 'kb-created-objects',
            });

            ui.setContent(
                'created-objects',
                ui.buildCollapsiblePanel({
                    title: 'Objects',
                    name: 'created-objects-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: renderOutput(arg.objectData),
                })
            );

            if (arg.objectData.length) {
                const $objTable = $(ui.getElement('objects-table'));

                const tableData = arg.objectData.map((obj) => {
                    let name = obj.name;
                    if (!name) {
                        name = obj.wsInfo ? obj.wsInfo[1] : 'Unknown object name';
                    }
                    let type = obj.type;
                    if (!type) {
                        type = obj.wsInfo ? obj.wsInfo[2] : 'Missing type';
                    }
                    const parsedType = APIUtil.parseWorkspaceType(type) || { type };
                    const description = obj.description || 'Missing description';
                    return {
                        wsInfo: obj.wsInfo,
                        name,
                        type,
                        parsedType,
                        description,
                    };
                });

                $objTable.DataTable({
                    data: tableData,
                    dom: "<'row'<'col-sm-12'tr>><'row'<'col-sm-5'i><'col-sm-7'p>>",
                    lengthChange: false,
                    pageLength: tablePageLength,
                    paging: arg.objectData.length > tablePageLength,
                    searching: false,
                    columns: [
                        {
                            render: (data, type, row) => {
                                if (!row.wsInfo) {
                                    return row.name;
                                }

                                return a(
                                    {
                                        class: `${cssBaseClass}__object_link`,
                                        dataObjRef: row.ref,
                                        type: 'button',
                                        ariaLabel: 'show viewer for ' + row.name,
                                    },
                                    [row.name]
                                );
                            },
                        },
                        {
                            render: (data, type, row) => {
                                return row.parsedType.type;
                            },
                        },
                        {
                            render: (data, type, row) => {
                                return row.description || 'Missing description';
                            },
                        },
                    ],
                    createdRow: (el, row) => {
                        if (row.wsInfo) {
                            const objLink = el.querySelector('.kb-output-widget__object_link');
                            $(objLink).on('click', () => {
                                Jupyter.narrative.addViewerCell(row.wsInfo);
                            });
                        }
                    },
                });
            }
        }

        /**
         * Starts the widget. This gets fed its data to render directly, so this just
         * wraps a Promise around the rendering process.
         * @param {object} arg
         * - node - the DOM node to build this under
         * - objectData - an array of object data to render
         */
        function start(arg) {
            // send parent the ready message
            return Promise.try(() => doAttach(arg)).catch((err) => {
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
        };
    }

    return {
        make: OutputWidget,
    };
});
