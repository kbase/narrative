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
        baseCss = 'kb-bulk-import__category_panel',
        completeIcon = 'fa-check-circle',
        incompleteIcon = 'fa-circle-thin';

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
            header = options.header,
            toggleCategory = options.toggleAction;
        let container = null,
            ui = null,
            /*
             * {
             *   selected: some_category,
             *   completed: {
             *      category1: boolean,        // if true, then this category is completed
             *      category2: boolean
             *   }
             */
            state;

        function renderLayout() {
            const events = Events.make(),
                content = [renderHeader()].concat(renderCategories(events)).join('');
            return {
                content: content,
                events: events
            };
        }

        function renderHeader() {
            return div({
                class: `${baseCss}__header`
            }, [
                span({class: `${baseCss}__header__icon header.icon`}),
                span({class: `${baseCss}__header__label`}, header.label)
            ]);
        }

        function renderCategories(events) {
            const layout = Object.keys(categories).sort().map(key => {
                return div({
                    class: `${baseCss}__category`,
                    dataElement: key,
                    id: events.addEvent({
                        type: 'click',
                        handler: () => {
                            if (key !== state.selected) {
                                toggleCategory(key);
                            }
                        }
                    })
                }, [
                    div({
                        class: `${baseCss}__category__icon fa ${incompleteIcon}`,
                        dataElement: 'icon'
                    }),
                    div({
                        class: `${baseCss}__category__label`
                    }, categories[key].label)
                ]);
            });
            return layout;
        }

        /**
         * State here just maintains what element is selected.
         * @param {object} newState
         *  - selected - string, the selected category key
         *  - completed - kvp of categories with their boolean completion state
         */
        function updateState(newState) {
            state = newState;
            const selected = `${baseCss}__category__selected`;
            Object.keys(categories).forEach(key => {
                ui.getElement(key).classList.remove(selected);
                ui.getElement(`${key}.icon`).classList.remove(completeIcon, incompleteIcon);
                let icon = state.completed[key] ? completeIcon : incompleteIcon;
                ui.getElement(`${key}.icon`).classList.add(icon);
            });
            ui.getElement(state.selected).classList.add(selected);
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
                updateState(args.state);
            });
        }

        function stop() {
            return Promise.try(() => {

            });
        }

        return {
            start: start,
            stop: stop,
            updateState: updateState
        };
    }

    return {
        make: CategoryPanel
    };
});
