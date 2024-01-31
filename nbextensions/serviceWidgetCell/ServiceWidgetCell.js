define(['common/pythonInterop', 'util/cellSupport/CellBase'], (pythonInterop, CellBase) => {
    'use strict';

    return class ServiceWidgetCell extends CellBase {
        constructor(params) {
            super(params);
            this.icon = { name: 'thumbs-down', color: 'red' };
        }

        // -----------------------------------------
        // Optional methods
        // the onXyz() methods are called by CellBase if they exist; the methods
        // they are called from named xyz().
        // -----------------------------------------

        /**
         * Called when the cell is first started.
         *
         * The widget may not be rendered yet, so code here should not rely
         * upon that.
         *
         * @overrides
         * @returns {void} nothing
         */
        onStart() {
            this.cellBus.on('widget-state', (payload) => {
                const { widgetState } = payload;
                this.setWidgetState(widgetState);
            });

            // Preserves height of cell.
            this.resizeObserver = new ResizeObserver((entries) => {
                if (entries.length !== 1) {
                    return;
                }
                const height = entries[0].contentRect.height;
                this.setWidgetState({ height: height });
            });
            this.resizeObserver.observe(this.cell.element.find('.output_wrapper>.output').get(0));

            // Set the output area height according to the last saved height.
            const { height } = this.getWidgetState();
            if (height) {
                this.cell.element.find('.output_wrapper>.output').css('height', `${height}px`);
            }

            this.renderCellToolbar();
        }

        /**
         * Removes any resources set up when the cell started.
         * At present this is the resize observer.
         *
         * @overrides
         * @returns {void} nothing
         */
        onStop() {
            if (this.resizeObserver) {
                this.resizeObserver.unobserve(
                    this.cell.element.find('.output_wrapper>.output').get(0)
                );
            }
        }

        // -----------------------------------------
        // Required methods
        //
        // These correspond to abstract methods in the base class.
        // -----------------------------------------

        /**
         * Returns a CSS classname to be set on the cell element.
         *
         * @override
         * @returns {string} The class string that should be added to the top level cell element
         */
        getCellClass() {
            return 'nbextensions-serviceWidgetCell';
        }

        /**
         * Generates Python code text to be inserted into the cell and executed.
         *
         * Implements the "abstract" method in the base class CellBase.js.
         *
         * @override
         * @returns {string} A snippet of Python code in text form.
         */
        generatePython() {
            const { moduleName, widgetName, params, isDynamicService } = this.getParams('service');

            return pythonInterop.buildServiceWidgetRunner({
                cellId: this.getMetadata('attributes.id'),
                moduleName,
                widgetName,
                params,
                isDynamicService,
                widgetState: this.getParams('widgetState') || null,
            });
        }

        // -----------------------------------------
        // Own methods
        // -----------------------------------------

        /**
         * Obtains the current value of the widget state from the "widgetState" property
         * of the cell's KBase metadata.
         *
         * @returns {object} An object continaining the widget state
         */
        getWidgetState() {
            return this.getMetadata('widgetState', {});
        }

        /**
         * Updates the current value of the widget state from a full or partial widget
         * state object.
         *
         * It merges the provided widget state update object with the current widget
         * state, with the updates overriding any existing top level widget state
         * properties, with any untouched top level widget state properties left alone.
         *
         * @param {object} widgetStateUpdate
         * @returns {void} nothing
         */
        setWidgetState(widgetStateUpdate) {
            const widgetState = Object.assign(
                {},
                this.getMetadata('widgetState', {}),
                widgetStateUpdate
            );
            this.setMetadata('widgetState', widgetState);
        }
    };
});
