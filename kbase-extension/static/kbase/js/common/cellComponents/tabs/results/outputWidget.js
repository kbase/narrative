define(['bluebird', 'jquery', 'common/html', 'common/ui', 'common/events'], function (
    Promise,
    $,
    html,
    UI,
    Events
) {
    'use strict';

    let tag = html.tag,
        div = tag('div');

    function OutputWidget() {
        let container, ui;

        function renderOutput(data) {
            return new Promise((resolve) => {
                console.log('ready to render object output with data: ', data);
                resolve(true);
            });
        }

        function renderLayout() {
            const events = Events.make();

            const content = ui.buildCollapsiblePanel({
                title: 'Objects',
                name: 'created-objects-toggle',
                hidden: false,
                type: 'default',
                classes: ['kb-panel-container'],
                body: div,
            });

            let objectContainer = div({ dataElement: 'created-objects' }, [content]);

            return {
                content: objectContainer,
                events: events,
            };
        }

        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
            });

            let layout = renderLayout();

            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
        }

        function start(arg) {
            // send parent the ready message
            doAttach(arg.node);

            return renderOutput(arg.data).catch(function (err) {
                // do somethig with the error.
                console.error('ERROR in start', err);
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
