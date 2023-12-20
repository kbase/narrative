/*
 * KBase Service Widget Cell Manager
 *
 * 
 *
 * @param {type} $
 * @param {type} Jupyter
 * @param {type} html
 *
 */
define(
[
    './ServiceWidgetCell',
    'util/cellSupport/CellManager',

    // For effect
    'bootstrap',
    'custom/custom',
],
(
    ServiceWidgetCell,
    CellManager
) => {
    
    class ServiceWidgetCellManager extends CellManager {

        /** 
        * Should only be called when a cell is first inserted into a narrative.
        *
        * It creates the correct metadata and then sets up the cell.
        *
        */
        getCellTitle(cell) {
            const {moduleName, widgetName} = this.getCellExtensionMetadata(cell, 'service');
            return `Service Widget Demo (module: ${moduleName}, widget: ${widgetName})`;
        }

        getCellClass(cell) {
            return 'kb-service-widget-cell';
        }

        // onSetupCell(cell) {
        //     cell.element[0].classList.add('kb-service-widget-cell');
        // }

        // getCellInstance(cell) {
        //     return new ServiceWidgetCell({
        //         name: 'Service Widget Cell', 
        //         type: 'serviceWidget',
        //         cell, 
        //     });
        // }

        populateCell(serviceWidgetCell) {
            // TODO: the cell should "know" what params it needs to populate it (i.e.
            // generate python.)
            serviceWidgetCell.create(serviceWidgetCell.getExtensionMetadata('service'));
        }

        /**
         * Sets up a cell of this type (serviceWidgetCell) at run time, after the 
         * cell is first rendered by Jupyter, or after a cell of this type is inserted
         * into an existing notebook.
         * 
         * @param {*} cell 
         */
        async startCell(serviceWidgetCell) {
            const {kbase: {[this.type]: {service: {moduleName, widgetName, params}}}} = serviceWidgetCell.cell.metadata;
            serviceWidgetCell.start({
                moduleName,
                widgetName,
                params,
                isDynamicService: false
            });
        }
    }
    
    return ServiceWidgetCellManager;
});
