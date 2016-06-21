/*global define*/
/*jslint white:true,browser:true*/

define([
    'common/runtime',
    'common/events',
    'common/dom',
    'kb_common/html',
    'base/js/namespace'
], function (
    Runtime,
    Events,
    Dom,
    html,
    Jupyter
    ) {
    'use strict';

    var t = html.tag,
        div = t('div'), button = t('button'),
        table = t('table'), tr = t('tr'), th = t('td'), td = t('td');

    function factory(config) {
        var runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus(null, 'Output Widget Bus'),
            cellId = config.cellId,
            root, container, dom,
            model = {
                currentJobState: null,
                outputs: null
            };

        function findCellForId(id) {
            var matchingCells = Jupyter.notebook.get_cells().filter(function (cell) {
                if (cell.metadata && cell.metadata.kbase) {
                    return (cell.metadata.kbase.attributes.id === id);
                }
                return false;
            });
            if (matchingCells.length === 1) {
                return matchingCells[0];
            }
            if (matchingCells.length > 1) {
                addNotification('Too many cells matched the given id: ' + id);
            }
            return null;
        }
        function doRemoveOutput(index) {
            var confirmed = dom.confirmDialog('Are you sure you want to remove the output cell? This is not reversable. (Any associated data will remain in your narrative, and may be found in the Data panel.)', 'Yes', 'No');
            if (!confirmed) {
                return;
            }
            // remove the output cell
            var output = model.outputs[index],
                outputCell = findCellForId(output.cellId),
                cellIndex;

            if (outputCell) {
                //alert('Could not find this cell');
                //return;
                cellIndex = Jupyter.notebook.find_cell_index(outputCell);
                Jupyter.notebook.delete_cell(cellIndex);
            }

            // send a message on the cell bus bus, parent should pick it up, remove the 
            // output from the model, and update us.
            bus.bus().send({
                jobId: output.jobId
            }, {
                channel: {
                    cell: cellId
                },
                key: {
                    type: 'output-cell-removed'
                }
            });
            bus.bus().send({
                jobId: output.jobId
            }, {
                channel: {
                    cell: cellId
                },
                key: {
                    type: 'delete-job'
                }
            });

        }
        function doRemoveOutputCell(index) {
            var confirmed = dom.confirmDialog('This will remove the output cell from the Narrative, as well as this output record. This action is not reversable. Any associated data will remain in your narrative, and may be found in the Data panel.\n\nAre you sure you want to remove the output cell?', 'Yes', 'No');
            if (!confirmed) {
                return;
            }
            // remove the output cell
            var output = model.outputs[index],
                outputCell = findCellForId(output.cellId),
                cellIndex;

            if (outputCell) {
                //alert('Could not find this cell');
                //return;
                cellIndex = Jupyter.notebook.find_cell_index(outputCell);
                Jupyter.notebook.delete_cell(cellIndex);
            }

            // send a message on the cell bus bus, parent should pick it up, remove the 
            // output from the model, and update us.
            bus.bus().send({
                jobId: output.jobId
            }, {
                channel: {
                    cell: cellId
                },
                key: {
                    type: 'output-cell-removed'
                }
            });


        }

        function render() {
            var events = Events.make(),
                content;

            if (!model.outputs || model.outputs.length === 0) {
                content = 'No output yet!';
            } else {
                content = model.outputs
                    .sort(function (b, a) {
                        if (a.createdTime < b.createdTime) {
                            return -1;
                        }
                        if (a.createdTime > b.createdTime) {
                            return 1;
                        }
                        return 0;
                    })
                    .map(function (output, index) {
                        var rowStyle = {
                            border: '1px silver solid',
                            padding: '3px'
                        }, message = '';
                        // console.log('JOB MATCH?', output.jobId, model.currentJobState);
                        if (model.currentJobState && output.jobId === model.currentJobState.job_id) {
                            rowStyle.border = '2px blue solid';
                            message = 'This is the most recently run job for this app.'
                        }
                        return div({class: 'row', style: rowStyle}, [
                            div({class: 'col-md-8'}, [
                                table({class: 'table table-striped'}, [
                                    tr([
                                        th('Job Id'), td(output.jobId)
                                    ]),
                                    tr([
                                        th('Cell Id'), td(output.cellId)
                                    ]),
                                    tr([
                                        th('Created'), td(output.createdTime.toISOString())
                                    ])
                                ])
                            ]),
                            div({class: 'col-md-4', style: {textAlign: 'right'}}, [
//                                button({
//                                    class: 'btn btn-sm btn-standard',
//                                    type: 'button',
//                                    id: events.addEvent({
//                                        type: 'click',
//                                        handler: function () {
//                                            doRemoveOutput(index);
//                                        }
//                                    })}, 'delete'),
                                button({
                                    class: 'btn btn-sm btn-standard',
                                    type: 'button',
                                    id: events.addEvent({
                                        type: 'click',
                                        handler: function () {
                                            doRemoveOutputCell(index);
                                        }
                                    })}, 'Remove Ouput Cell'),
                                
                                div({style: {marginTop: '20px'}, dataElement: 'message'}, message)

                            ])
                        ]);
                    }).join('\n');
            }
            container.innerHTML = content;
            events.attachEvents(container);
        }

        function importModel(outputs) {
            var output;
            if (outputs.byJob) {
                model.outputs = Object.keys(outputs.byJob).map(function (jobId) {
                    output = outputs.byJob[jobId];
                    // console.log(output);
                    return {
                        jobId: jobId,
                        cellId: output.cell.id,
                        createdTime: new Date(output.cell.createdAt)
                    };
                });
            }
        }

        function start() {
            bus.on('run', function (message) {
                root = message.node;
                container = root.appendChild(document.createElement('div'));
                dom = Dom.make({node: container});
                model.currentJobState = message.jobState;
                if (message.output) {
                    importModel(message.output);
                }

                render();

                bus.on('update', function (message) {
                    model.currentJobState = message.jobState;
                    importModel(message.output);
                    render();
                });
            });
        }

        var api = Object.freeze({
            start: start,
            bus: bus
        });
        return api;
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});