/*global define*/
/*jslint white:true,browser:true*/

define([
    'common/runtime',
    'common/busEventManager',
    'common/Props',
    'common/ui',
    'common/html',
    'common/jupyter'
], function (
    Runtime,
    BusEventManager,
    Props,
    UI,
    html,
    Jupyter
    ) {
    'use strict';
    
    var t = html.tag,
        div = t('div'), p = t('p');

    function factory(config) {
        var cell = config.cell,
            runtime = Runtime.make(),
            eventManager = BusEventManager.make({
                bus: runtime.bus()
            }),
            bus = runtime.bus().makeChannelBus(null, 'data cell bus'),
            
            // To be instantiated at attach()
            container, ui,
            
            // To be instantiated in start()
            cellBus;               
        
        function doDeleteCell() {
            var content = div([
                p([
                    'Deleting this cell will remove the data visualization, ',
                    'but will not delete the data object, which will still be avaiable ',
                    'in the data panel.'                    
                ]),
                p('Continue to delete this data cell?')
            ]);
            ui.showConfirmDialog({title: 'Confirm Cell Deletion', body: content})
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    bus.emit('stop');
                    
                    Jupyter.deleteCell(cell);
                });
        }
        
        
        
        // Widget API
        
        eventManager.add(bus.on('run', function (message) {                
            container = message.node;
            ui = UI.make({node:container});

            // Events for comm from the parent.
            eventManager.add(bus.on('stop', function () {
                eventManager.removeAll();
            }));


            // The cell bus is for communication via the common id.
            // This allows disassociated elements to communicate with us
            // without a physical handle on the widget object.

            cellBus = runtime.bus().makeChannelBus({
                cell: Props.getDataItem(cell.metadata, 'kbase.attributes.id')
            }, 'A cell channel');

            eventManager.add(cellBus.on('delete-cell', function () {
                doDeleteCell();
            }));

        }));

        return {
            bus: bus
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});