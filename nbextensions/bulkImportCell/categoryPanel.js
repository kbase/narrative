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
        span = html.tag('span');

    function CategoryPanel(options) {
        /**
         * should be something like:
         * {
         *  header: {
         *      label: string,
         *      icon: string
         *  }
         *  categoryId1: {
         *      label: 'test label',
         *  }
         * }
         * @param {object} categories
         */
        const bus = options.bus,
            categories = options.categories,
            header = options.header;
        let container = null,
            ui = null;

        function renderLayout() {
            const events = Events.make(),
                content = div({}, [
                    renderHeader(),
                    renderCategories()
                ]);
            return {
                content: content,
                events: events
            };
        }

        function renderHeader() {
            return div({}, [
                span({class: header.icon}),
                span({}, header.label)
            ]);
        }

        function renderCategories() {
            return div({},
                Object.keys(categories).sort().map(key => {
                    return div({}, [
                        span({class: 'fa fa-check-circle'}),
                        span(categories[key].label)
                    ]);
                })
            );
        }

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

        function stop() {
            return Promise.try(() => {

            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: CategoryPanel
    };
});
