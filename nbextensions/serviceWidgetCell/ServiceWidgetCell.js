define(
    [
        'common/cellUtils',
        'common/pythonInterop',
        'util/cellSupport/CellBase',
        './constants',

        // For effect
        'css!./ServiceWidgetCell.css'
    ],
    (
        cellUtils,
        pythonInterop,
        CellBase,
        {typeName}
    ) => {
        return class ServiceWidgetCell extends CellBase {
            resizeObserver = null;
            /**
             * Called when the cell is first started.
             * 
             * The widget may not be rendered yet, so code here should not rely
             * upon that. 
             */
            async onStart() {
                this.eventManager.add(this.cellBus.on('widget-state', (payload) => {
                    const thisCell = this.findCell();

                    // TODO: This is double-wrapped in the widget. Need to deal with
                    // that very soon.
                    const {widgetState} = payload;

                    cellUtils.setCellMeta(thisCell, `kbase.${typeName}.widgetState`, widgetState);
                }));

                // Preserves height of cell.
                this.resizeObserver = new ResizeObserver((entries) => {
                    if (entries.length !== 1) {
                        return;
                    }
                    const height = entries[0].contentRect.height;
                    const thisCell = this.findCell();
                    cellUtils.setCellMeta(thisCell, `kbase.${typeName}.widgetState.height`, height);
                });
                this.resizeObserver.observe(this.cell.element.find('.output_wrapper>.output').get(0));

                // Set the output area height according to the last saved height.
                const height = cellUtils.getCellMeta(this.findCell(), `kbase.${typeName}.widgetState.height`);
                if (height) {
                    this.cell.element.find('.output_wrapper>.output').css('height', `${height}px`);
                }
            }

            onStop() {
                // Nothing to do, but we must define it.
                if (this.resizeObserver) {
                    this.resizeObserver.unobserve(this.cell.element.find('.output_wrapper>.output').get(0));
                }
            }

            generatePython() {
                const {moduleName, widgetName, params, isDynamicService} = this.getExtensionMetadata('service');
                return pythonInterop.buildServiceWidgetRunner({
                    cellId: this.cell.metadata.kbase.attributes.id, 
                    moduleName, 
                    widgetName, 
                    params, 
                    isDynamicService,
                    widgetState: this.getExtensionMetadata('widgetState') || null
                });
            }
        }
    });
