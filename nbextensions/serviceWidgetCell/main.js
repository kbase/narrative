/*
 * KBase Service Widget Cell
 *
 * This module serves as the entrypoint for the Service Widget Cell.
 */
define(
    ['util/cellSupport/CellManager', './ServiceWidgetCell', './constants'],
    (CellManager, ServiceWidgetCell, constants) => {
        'use strict';

        // eslint-disable-next-line no-unused-vars
        let cellManager;

        const { CELL_TYPE_NAME } = constants;

        /**
         * Implements the nbextensions api.
         *
         * @returns {void} nothing
         */
        function load_ipython_extension() {
            // We essentially punt all work to the service widget cell manager class, although
            // we do specify some simple configuration for this widget.
            cellManager = new CellManager({
                type: CELL_TYPE_NAME,
                // Default icon - so that there is is
                icon: { type: 'generic', params: { name: 'thumbs-down', color: 'red' } },
                // Default title - should be replaced with the widget runs
                title: 'Service Widget',
                className: 'nbextensions-serviceWidgetCell',
                name: 'Service Widget Cell',
                instanceClass: ServiceWidgetCell,
            });
        }

        return {
            load_ipython_extension,
        };
    },
    (err) => {
        // TODO: use the error reporting mechanism from the app cell
        'use strict';
        console.error('ERROR loading serviceWidgetCell main', err);
    }
);
