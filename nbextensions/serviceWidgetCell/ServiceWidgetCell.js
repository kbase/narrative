define(['common/cellUtils', 'common/pythonInterop', 'util/cellSupport/CellBase', './constants'], (
    cellUtils,
    pythonInterop,
    CellBase,
    constants
) => {
    'use strict';

    const { CELL_TYPE_NAME } = constants;

    function textOnlyThanks(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return class ServiceWidgetCell extends CellBase {
        constructor(params) {
            super(params);
            this.icon = { name: 'thumbs-down', color: 'red' };
        }

        // Optional methods
        // the onXyz() methods are called by CellBase if they exist; the methods
        // they are called from named xyz().

        /**
         * Called when the cell is first started.
         *
         * The widget may not be rendered yet, so code here should not rely
         * upon that.
         */
        onStart() {
            this.eventManager.add(
                this.cellBus.on('widget-state', (payload) => {
                    const thisCell = this.findCell();

                    // TODO: This is double-wrapped in the widget. Need to deal with
                    // that very soon.
                    const { widgetState } = payload;

                    cellUtils.setCellMeta(
                        thisCell,
                        `kbase.${CELL_TYPE_NAME}.widgetState`,
                        widgetState
                    );
                })
            );

            // Preserves height of cell.
            this.resizeObserver = new ResizeObserver((entries) => {
                if (entries.length !== 1) {
                    return;
                }
                const height = entries[0].contentRect.height;
                const thisCell = this.findCell();
                cellUtils.setCellMeta(
                    thisCell,
                    `kbase.${CELL_TYPE_NAME}.widgetState.height`,
                    height
                );
            });
            this.resizeObserver.observe(this.cell.element.find('.output_wrapper>.output').get(0));

            // Set the output area height according to the last saved height.
            const height = cellUtils.getCellMeta(
                this.findCell(),
                `kbase.${CELL_TYPE_NAME}.widgetState.height`
            );
            if (height) {
                this.cell.element.find('.output_wrapper>.output').css('height', `${height}px`);
            }

            this.renderCellToolbar();
        }

        onStop() {
            // Nothing to do, but we must define it.
            if (this.resizeObserver) {
                this.resizeObserver.unobserve(
                    this.cell.element.find('.output_wrapper>.output').get(0)
                );
            }
        }

        // Implementation of "abstract" methods

        getCellClass() {
            return 'nbextensions-serviceWidgetCell';
        }

        getCellTitle(cell) {
            const { title } = this.getExtensionMetadata(cell, 'service');
            if (title) {
                return textOnlyThanks(title);
            }
            return `Service Widget`;
        }

        getCellSubtitle(cell) {
            const { subtitle, moduleName, widgetName } = this.getExtensionMetadata(cell, 'service');
            if (subtitle) {
                return `${textOnlyThanks(subtitle)} <i>(${moduleName}/${widgetName})</i>`;
            }
            return `<i>(${moduleName}/${widgetName})</i>`;
        }

        generatePython() {
            const { moduleName, widgetName, params, isDynamicService } =
                this.getExtensionMetadata('service');
            return pythonInterop.buildServiceWidgetRunner({
                cellId: this.cell.metadata.kbase.attributes.id,
                moduleName,
                widgetName,
                params,
                isDynamicService,
                widgetState: this.getExtensionMetadata('widgetState') || null,
            });
        }
    };
});
