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
        baseCss = 'kb-bulk-import__filetype_panel',
        completeIcon = 'fa-check-circle',
        incompleteIcon = 'fa-circle-thin';

    /**
     * This displays a vertical list of "fileTypes" that can be selected on and
     * toggled. It's intended to be fairly generic, in that the fileTypes are
     * really just labels with keys, and displays whether or not the process
     * associated with those fileTypes is "complete" - it's up to the invoking
     * class to determine what completion means.
     *
     * When running this factory, the key object it needs is a set of fileTypes,
     * with the following format:
     * {
     *   fileType1: {
     *     label: 'Some File Type'
     *   },
     *   fileType2: {
     *     label: 'Some Other File Type'
     *   }
     * }
     * The keys "fileType1" and "fileType2" are expected to be used later in
     * the state, and are returned when one or the other file type is clicked on.
     * @param {object} options
     * - bus - a message bus
     * - fileTypes - an object describing the fileTypes (see above)
     * - header - an object with a "icon" and "label" properties for the header.
     *      the icon should be a font-awesome class set (fa fa-whatever)
     *      the label should just be a string
     * - toggleAction - a function with a single input of 'key' - the file type
     *      that's been clicked on. Note that this will not be fired if the
     *      clicked file type is already selected.
     */
    function FileTypePanel(options) {
        const bus = options.bus,
            fileTypes = options.fileTypes,
            header = options.header,
            toggleFileType = options.toggleAction;
        let container = null,
            ui = null,
            /*
             * Basic state structure:
             * {
             *   selected: string (a file type id),
             *   completed: {
             *      fileType1: boolean,  // if true, then this file type is completed
             *      fileType2: boolean   // if absent or falsy, then the file type is incomplete
             *   }
             */
            state;

        /**
         * Renders the initial layout. This returns a series of divs with no
         * actual container, so it should be placed in one.
         */
        function renderLayout() {
            const events = Events.make(),
                content = [renderHeader()].concat(renderFileTypes(events)).join('');
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
         * Renders each of the file type elements. These have an icon and a label. Each one
         * has a click event bound to it. If the clicked element is not currently selected
         * (as judged by the state), then it calls the toggleFileType function with the
         * key of the clicked file type.
         * @param {Events} events - an events object used to bind the DOM event
         */
        function renderFileTypes(events) {
            const layout = Object.keys(fileTypes).sort().map(key => {
                return button({
                    class: `${baseCss}__filetype_button`,
                    dataElement: key,
                    id: events.addEvent({
                        type: 'click',
                        handler: () => {
                            if (key !== state.selected) {
                                toggleFileType(key);
                            }
                        }
                    }),
                    role: 'button',
                    'aria-label': `toggle ${fileTypes[key].label}`
                }, [
                    div({
                        class: `${baseCss}__filetype_icon fa ${incompleteIcon}`,
                        dataElement: 'icon'
                    }),
                    div({
                        class: `${baseCss}__filetype_label`
                    }, fileTypes[key].label)
                ]);
            });
            return layout;
        }

        /**
         * The state of this component handles what file type is currently selected,
         * and which fileTypes are completed. The basic structure of the state is
         * expected to be:
         * {
         *    selected: file_type_key,
         *    completed: {
         *      fileType1: true,
         *      fileType2: false,
         *      ...etc
         *    }
         * }
         * @param {object} newState - the state object
         */
        function updateState(newState) {
            state = newState;
            const selected = `${baseCss}__filetype_button--selected`;
            state.completed = state.completed || {};  // double-check we have the completed set
            /**
             * Tweaking the visual state -
             * 1. deselect everything
             * 2. remove all icons
             * 3. put in the completion icon for each file type
             */
            Object.keys(fileTypes).forEach(key => {
                ui.getElement(key).classList.remove(selected);
                ui.getElement(`${key}.icon`).classList.remove(completeIcon, incompleteIcon);
                let icon = state.completed[key] ? completeIcon : incompleteIcon;
                ui.getElement(`${key}.icon`).classList.add(icon);
            });
            // if the "selected" file type is real, select it
            if (state.selected in fileTypes) {
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
        make: FileTypePanel
    };
});
