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
    'util/cellSupport/CellManager',

    // For effect
    'bootstrap',
    'custom/custom',
],
(
    CellManager
) => {

    /**
     * A cheap way to scrub text of html, meant to be applied to external data being
     * injected into the DOM. It has the effect of encoding special characters as html
     * entities, so that they appear as markup and won't act as markup.
     * 
     * @param {*} text 
     * @returns 
     */
    function textOnlyThanks(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    class ServiceWidgetCellManager extends CellManager {

        /** 
        * Should only be called when a cell is first inserted into a narrative.
        *
        * It creates the correct metadata and then sets up the cell.
        *
        */
        getCellTitle(cell) {
            const {title} = this.getCellExtensionMetadata(cell, 'service');
            if (title) {
                return textOnlyThanks(title);
            }
            return `Service Widget Viewer`;
        }

        getCellSubtitle(cell) {
            const {subtitle,  moduleName, widgetName} = this.getCellExtensionMetadata(cell, 'service');
            if (subtitle) {
                return `${textOnlyThanks(subtitle)} <i>(${moduleName}/${widgetName})</i>`;
            }
            return `<i>(${moduleName}/${widgetName})</i>`;
        }

        getCellClass(cell) {
            return 'kb-service-widget-cell';
        }

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
