define([
    'common/runtime',
    'common/busEventManager',
    'common/props',
    'common/ui',
    'common/html',
    'common/jupyter',
    'common/jobCommChannel',
], (Runtime, BusEventManager, Props, UI, html, JupyterInterop, JobComms) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        p = t('p'),
        jcm = JobComms.JobCommMessages;

    function factory(config) {
        const cell = config.cell,
            runtime = Runtime.make(),
            eventManager = BusEventManager.make({
                bus: runtime.bus(),
            }),
            bus = runtime.bus().makeChannelBus({ description: 'output cell bus' });
        // To be instantiated at attach()
        let ui,
            // To be instantiated in start()
            cellBus;

        function doDeleteCell() {
            const parentCellId = Props.getDataItem(cell.metadata, 'kbase.outputCell.parentCellId');
            const content = div([
                p([
                    'Deleting this cell will remove the data visualization, ',
                    'but will not delete the data object, which will still be available ',
                    'in the data panel.',
                ]),
                p(['Parent cell id is ', parentCellId]),
                p('Continue to delete this data cell?'),
            ]);
            ui.showConfirmDialog({ title: 'Confirm Cell Deletion', body: content }).then(
                (confirmed) => {
                    if (!confirmed) {
                        return;
                    }
                    runtime.bus().send(
                        {
                            jobId: Props.getDataItem(cell.metadata, 'kbase.outputCell.jobId'),
                            outputCellId: Props.getDataItem(cell.metadata, 'kbase.attributes.id'),
                        },
                        {
                            channel: {
                                [jcm.CHANNELS.CELL]: parentCellId,
                            },
                            key: {
                                type: 'output-cell-removed',
                            },
                        }
                    );

                    bus.emit('stop');

                    JupyterInterop.deleteCell(cell);
                }
            );
        }

        // Widget API

        eventManager.add(
            bus.on('run', (message) => {
                ui = UI.make({ node: message.node });

                // Events for comm from the parent.
                eventManager.add(
                    bus.on('stop', () => {
                        eventManager.removeAll();
                    })
                );

                cellBus = runtime.bus().makeChannelBus({
                    name: {
                        cell: Props.getDataItem(cell.metadata, 'kbase.attributes.id'),
                    },
                    description: 'A cell channel',
                });

                eventManager.add(
                    cellBus.on('delete-cell', () => {
                        doDeleteCell();
                    })
                );
            })
        );

        return {
            bus,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
