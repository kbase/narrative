/*global define*/
/*jslint white:true,browser:true*/

define([
    'common/runtime',
    'common/busEventManager',
    'common/props',
    'common/ui',
    'common/html',
    'common/jupyter'
], function(
    Runtime,
    BusEventManager,
    Props,
    UI,
    html,
    Narrative
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p');

    function factory(config) {
        var cell = config.cell,
            runtime = Runtime.make(),
            eventManager = BusEventManager.make({
                bus: runtime.bus()
            }),
            bus = runtime.bus().makeChannelBus({ description: 'code cell bus' }),

            // To be instantiated at attach()
            container, ui,

            // To be instantiated in start()
            cellBus;

        function doDeleteCell() {
            var content = div([
                p([
                    'Deleting this cell will remove the code and any generated code ouput.',
                ]),
                p('Continue to delete this code cell?')
            ]);
            ui.showConfirmDialog({ title: 'Confirm Cell Deletion', body: content })
                .then(function(confirmed) {
                    if (!confirmed) {
                        return;
                    }

                    bus.emit('stop');

                    Narrative.deleteCell(cell);
                });
        }



        // Widget API

        eventManager.add(bus.on('run', function(message) {
            container = message.node;
            ui = UI.make({ node: container || document.body });

            // Events for comm from the parent.
            eventManager.add(bus.on('stop', function() {
                eventManager.removeAll();
            }));


            // The cell bus is for communication via the common id.
            // This allows disassociated elements to communicate with us
            // without a physical handle on the widget object.

            console.warn('making code cell bus - ' + Props.getDataItem(cell.metadata, 'kbase.attributes.id'));
            cellBus = runtime.bus().makeChannelBus({
                name: {
                    cell: Props.getDataItem(cell.metadata, 'kbase.attributes.id')
                },
                description: 'A cell channel'
            });

            eventManager.add(cellBus.on('delete-cell', function() {
                doDeleteCell();
            }));

        }));

        return {
            bus: bus
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
