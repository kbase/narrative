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

    class ConfigureWidget {
        constructor(bus) {
            this.bus = bus;
            this.container = null;
        }

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         *  - something something inputs and parameters
         * @param {object} args
         */
        start(args) {
            return Promise.try(() => {
                this.container = args.node;
                this.ui = UI.make({
                    node: this.container,
                    bus: this.bus
                });
                const layout = this.renderLayout();
                this.container.innerHTML = layout.content;
                layout.events.attachEvents(this.container);
            });
        }

        renderLayout() {
            let events = Events.make(),
                formContent = [
                    this.ui.buildPanel({
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
                    this.ui.buildPanel({
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

        stop() {
            this.container.innerHTML = '';
        }
    }

    return ConfigureWidget;
});
