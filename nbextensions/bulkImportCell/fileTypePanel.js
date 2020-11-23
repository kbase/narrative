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
        button = html.tag('button'),
        baseCss = 'kb-bulk-import__category_panel',
        completeIcon = 'fa-check-circle',
        incompleteIcon = 'fa-circle-thin';

    /**
     * This displays a vertical list of "categories" that can be selected on and
     * toggled. It's intended to be fairly generic, in that the categories are
     * really just labels with keys, and displays whether or not the process
     * associated with those categories is "complete" - it's up to the invoking
     * class to determine what completion means.
     *
     * When running this factory, the key object it needs is a set of categories,
     * with the following format:
     * {
     *   category1: {
     *     label: 'Some Category'
     *   },
     *   category2: {
     *     label: 'Some Other Category'
     *   }
     * }
     * The keys "category1" and "category2" are expected to be used later in
     * the state, and are returned when one or the other category is clicked on.
     * @param {object} options
     * - bus - a message bus
     * - categories - an object describing the categories (see above)
     * - header - an object with a "icon" and "label" properties for the header.
     *      the icon should be a font-awesome class set (fa fa-whatever)
     *      the label should just be a string
     * - toggleAction - a function with a single input of 'key' - the category
     *      that's been clicked on. Note that this will not be fired if the
     *      clicked category is already selected.
     */
    function CategoryPanel(options) {
        const bus = options.bus,
            categories = options.categories,
            header = options.header,
            toggleCategory = options.toggleAction;
        let container = null,
            ui = null,
            /*
             * Basic state structure:
             * {
             *   selected: some_category,
             *   completed: {
             *      category1: boolean,  // if true, then this category is completed
             *      category2: boolean   // if absent or falsy, then the category is incomplete
             *   }
             */
            state;

        /**
         * Renders the initial layout. This returns a series of divs with no
         * actual container, so it should be placed in one.
         */
        function renderLayout() {
            const events = Events.make(),
                content = [renderHeader()].concat(renderCategories(events)).join('');
            return {
                content: content,
                events: events
            };
        }

        /**
         * Renders the header - this should just be a non-clickable label.
         */
        function renderHeader() {
            return div({
                class: `${baseCss}__header`
            }, [
                span({class: `${baseCss}__header_icon ${header.icon}`}),
                span({class: `${baseCss}__header_label`}, header.label)
            ]);
        }

        /**
         * Renders each of the category elements. These have an icon and a label. Each one
         * has a click event bound to it. If the clicked element is not currently selected
         * (as judged by the state), then it calls the toggleCategory function with the
         * key of the clicked category.
         * @param {Events} events - an events object used to bind the DOM event
         */
        function renderCategories(events) {
            const layout = Object.keys(categories).sort().map(key => {
                return button({
                    class: `${baseCss}__category_button`,
                    dataElement: key,
                    id: events.addEvent({
                        type: 'click',
                        handler: () => {
                            if (key !== state.selected) {
                                toggleCategory(key);
                            }
                        }
                    }),
                    role: 'button',
                    'aria-label': `toggle ${categories[key].label}`
                }, [
                    div({
                        class: `${baseCss}__category_icon fa ${incompleteIcon}`,
                        dataElement: 'icon'
                    }),
                    div({
                        class: `${baseCss}__category_label`
                    }, categories[key].label)
                ]);
            });
            return layout;
        }

        /**
         * The state of this component handles what category is currently selected,
         * and which categories are completed. The basic structure of the state is
         * expected to be:
         * {
         *    selected: category_key,
         *    completed: {
         *      category1: true,
         *      category2: false,
         *      ...etc
         *    }
         * }
         * @param {object} newState - the state object
         */
        function updateState(newState) {
            state = newState;
            const selected = `${baseCss}__category_button--selected`;
            state.completed = state.completed || {};  // double-check we have the completed set
            /**
             * Tweaking the visual state -
             * 1. deselect everything
             * 2. remove all icons
             * 3. put in the completion icon for each category
             */
            Object.keys(categories).forEach(key => {
                ui.getElement(key).classList.remove(selected);
                ui.getElement(`${key}.icon`).classList.remove(completeIcon, incompleteIcon);
                let icon = state.completed[key] ? completeIcon : incompleteIcon;
                ui.getElement(`${key}.icon`).classList.add(icon);
            });
            // if the "selected" category is real, select it
            if (state.selected in categories) {
                ui.getElement(state.selected).classList.add(selected);
            }
        }

        /**
         * Start up the component. This does the work of rendering and initializing the
         * component.
         * @param {object} args the startup args should have
         *  - node - a DOM node to build this component under
         *  - state - the initial state for this component (see updateState for structure)
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
                updateState(args.state);
            });
        }

        /**
         * Stop the component. Not used just yet.
         */
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
