/*
 * KBase Service Widget Cell
 *
 * This module serves as the entrypoint for the Service Widget Cell. 
 *
 */
define(
    [
        'util/cellSupport/CellManager',
        './ServiceWidgetCell',
        './constants'
    ],
    (
        CellManager,
        ServiceWidgetCell,
        {typeName}
    ) => {
        function load_ipython_extension() {
            // We essentially punt all work to the service widget cell manager class, although 
            // we do specify some simple configuration for this widget.
            const cellManager = new CellManager({
                type: typeName,
                icon: {name: 'thumbs-down', color: 'red'},
                title: 'Service Widget Demo', // should be replaced when the widget runs
                className: 'kb-service-widget-cell',
                name: 'Service Widget Cell',
                instanceClass: ServiceWidgetCell
            });
            cellManager.initialize();
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
