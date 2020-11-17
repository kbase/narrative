define([
    'bluebird',
    'common/ui',
    'common/html',
    'common/events'
], (
    Promise,
    UI,
    html,
    Events
) => {
    'use strict';

    const div = html.tag('div'),
        span = html.tag('span'),
        form = html.tag('form');

    function ConfigureWidget(options) {
        const bus = options.bus;
        let container = null,
            ui = null;

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         *  - something something inputs and parameters
         * @param {object} args
         */
        function start(args) {
            return Promise.try(() => {
                container = args.node;
                ui = UI.make({
                    node: container,
                    bus: bus
                });
                const layout = renderLayout();
                container.innerHTML = layout.content;
                layout.events.attachEvents(container);
            });
        }

        function renderLayout() {
            let events = Events.make(),
                formContent = [
                    ui.buildPanel({
                        title: span([
                            'File Paths',
                            span({
                                dataElement: 'advanced-hidden-message',
                                style: {
                                    marginLeft: '6px',
                                    fontStyle: 'italic'
                                }
                            })]),
                        name: 'file-paths-area',
                        body: div({ dataElement: 'file-path-fields' }),
                        classes: ['kb-panel-light']
                    }),
                    ui.buildPanel({
                        title: span([
                            'Parameters',
                            span({
                                dataElement: 'advanced-hidden-message',
                                style: {
                                    marginLeft: '6px',
                                    fontStyle: 'italic'
                                }
                            })]),
                        name: 'parameters-area',
                        body: div({ dataElement: 'parameter-fields' }),
                        classes: ['kb-panel-light']
                    }),
                ];
            const content = form({ dataElement: 'input-widget-form' }, formContent);
            return {
                content: content,
                events: events
            };

        }

        function stop() {
            container.innerHTML = '';
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: ConfigureWidget
    };
});
