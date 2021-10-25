/**
 * Should get fed data to view.
 */
define([
    'bluebird',
    'base/js/namespace',
    'common/html',
    'common/ui',
    'util/kbaseApiUtil',
    'common/events',
    'jquery',
    'jquery-dataTables',
], (Promise, Jupyter, html, UI, APIUtil, Events, $) => {
    'use strict';

    const tag = html.tag,
        div = tag('div'),
        tr = tag('tr'),
        th = tag('th'),
        td = tag('td'),
        thead = tag('thead'),
        tbody = tag('tbody'),
        table = tag('table'),
        a = tag('a'),
        tablePageLength = 50;

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
                return {
                    layout: div('No objects created'),
                };
            }
            const events = Events.make();
            const layout = table(
                {
                    class: 'table table-bordered',
                    dataElement: 'objects-table',
                },
                [
                    thead(tr([th('Created Object Name'), th('Type'), th('Description')])),
                    tbody([
                        ...objectData.map((obj) => {
                            const name = obj.name
                                ? obj.name
                                : obj.wsInfo
                                ? obj.wsInfo[1]
                                : 'Unknown object name';
                            const type = obj.type
                                ? obj.type
                                : obj.wsInfo
                                ? obj.wsInfo[2]
                                : 'Missing type';
                            const parsedType = APIUtil.parseWorkspaceType(type) || { type };
                            const description = obj.description || 'Missing description';
                            let objLink = '';
                            if (obj.wsInfo) {
                                objLink = a(
                                    {
                                        class: 'kb-output-widget__object_link',
                                        dataObjRef: obj.ref,
                                        type: 'button',
                                        ariaLabel: 'show viewer for ' + name,
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: () => {
                                                Jupyter.narrative.addViewerCell(obj.wsInfo);
                                            },
                                        }),
                                    },
                                    [name]
                                );
                            } else {
                                objLink = name;
                            }
                            return tr([td(objLink), td(parsedType.type), td(description)]);
                        }),
                    ]),
                ]
            );

            return { layout, events };
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
            const renderedOutput = renderOutput(arg.objectData);
            ui.setContent(
                'created-objects',
                ui.buildCollapsiblePanel({
                    title: 'Objects',
                    name: 'created-objects-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: renderedOutput.layout,
                })
            );
            if (arg.objectData.length) {
                const $objTable = $(ui.getElement('objects-table'));
                $objTable.DataTable({
                    searching: false,
                    pageLength: tablePageLength,
                    lengthChange: false,
                    fnDrawCallback: () => {
                        // Hide pagination controls if length is less than or equal to table length
                        if (arg.objectData.length <= tablePageLength) {
                            $(container).find('.dataTables_paginate').hide();
                        }
                    },
                });
                renderedOutput.events.attachEvents(container);
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
