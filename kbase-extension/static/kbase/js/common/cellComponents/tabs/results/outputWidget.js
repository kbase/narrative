/**
 * Should get fed data to view.
 */
define(['bluebird', 'common/html', 'common/ui', 'util/kbaseApiUtil'], (
    Promise,
    html,
    UI,
    APIUtil
) => {
    'use strict';

    const tag = html.tag,
        div = tag('div'),
        tr = tag('tr'),
        th = tag('th'),
        td = tag('td'),
        table = tag('table');

    function OutputWidget() {
        let container, ui;

        /**
         *
         * @param {Array} objectData an array of report object references
         */
        function renderOutput(objectData) {
            const emptyData = div('No objects created');
            if (objectData.length === 0) {
                return emptyData;
            }
            const objectTable = table({ class: 'table table-bordered table-striped' }, [
                tr([th('Created Object Name'), th('Type'), th('Description')]),
                ...objectData.map((obj) => {
                    const parsedType = APIUtil.parseWorkspaceType(obj.type);
                    return tr([td(obj.name), td(parsedType.type), td(obj.description)]);
                }),
            ]);
            return objectTable;
        }

        /**
         * 1. Make the main layout
         * 2. Put the layout in place
         * 3. Add the ui.buildCollapsiblePanel thing, with the table in the body
         * @param {object}
         *  - node - the DOM node to attach to
         *  - objectData -
         *  - workspaceClient
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
                    body: renderedOutput,
                })
            );
        }

        /**
         * Starts the widget. This gets fed its data to render directly, so this just
         * wraps a Promise around the rendering process.
         * @param {object} arg
         * - node - the DOM node to build this under
         * - reports - a list of report ids to fetch the relevant info from
         * - workspaceClient - a workspace client to use
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
            start: start,
            stop: stop,
        };
    }

    return {
        make: OutputWidget,
    };
});
