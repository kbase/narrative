/*global define*/
/*jslint white:true,browser:true*/

define([
    'common/runtime',
    'common/events',
    'common/ui',
    'kb_common/html',
    'base/js/namespace'
], function (
    Runtime,
    Events,
    UI,
    html,
    Jupyter
    ) {
    'use strict';

    var t = html.tag,
        div = t('div'), button = t('button'),
        table = t('table'), tr = t('tr'), th = t('td'), td = t('td'), p = t('p');

    function factory(config) {
        var runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus(null, 'Output Widget Bus'),
            cellId = config.cellId,
            root, container, ui,
            model = {
                currentJobState: null,
                outputs: null
            },
            api;

        function findCellForId(id) {
            var matchingCells = Jupyter.notebook.get_cells().filter(function (cell) {
                // console.log('REMOVING', JSON.parse(JSON.stringify(cell.metadata)));
                if (cell.metadata && cell.metadata.kbase && cell.metadata.kbase.attributes) {
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

        function doRemoveOutputCell(index) {
            var content = div([
                p('This will remove the output cell from the Narrative, as well as this output record. This action is not reversable. Any associated data will remain in your narrative, and may be found in the Data panel.'),
                p('Are you sure you want to remove the output cell?')
            ]);
            ui.showConfirmDialog('Confirm Deletion of Cell Output', content, 'Yes', 'No')
                .then(function (answer) {
                    if (!answer) {
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
                    key: {
                        type: 'request-job-deletion'
                    }
                });
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
                            message = 'This is the most recent output for this app.';
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
                                    })}, 'Remove Output Cell'),

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
                ui = UI.make({node: container});
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

        function getBus() {
            return bus;
        }

        api = Object.freeze({
            start: start,
            bus: getBus
        });
        return api;
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});