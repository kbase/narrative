define(['common/runtime', 'common/events', 'common/ui', 'kb_common/html', 'base/js/namespace'], (
    Runtime,
    Events,
    UI,
    html,
    Jupyter
) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        th = t('td'),
        td = t('td'),
        p = t('p'),
        ul = t('ul'),
        li = t('li');

    function factory(config) {
        const runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({ description: 'Output Widget Bus' }),
            cellId = config.cellId,
            model = {
                currentJobState: null,
                outputs: null,
            };
        let root, container, ui;

        function findCellForId(id) {
            const matchingCells = Jupyter.notebook.get_cells().filter((cell) => {
                // console.log('REMOVING', JSON.parse(JSON.stringify(cell.metadata)));
                if (cell.metadata && cell.metadata.kbase && cell.metadata.kbase.attributes) {
                    return cell.metadata.kbase.attributes.id === id;
                }
                return false;
            });
            if (matchingCells.length === 1) {
                return matchingCells[0];
            }
            return null;
        }

        function doRemoveOutputCell(index) {
            const output = model.outputs[index];
            let currentOutput, content;

            if (model.currentJobState && output.jobId === model.currentJobState.job_id) {
                currentOutput = true;
            } else {
                currentOutput = false;
            }

            if (currentOutput) {
                content = div([
                    p('This will:'),
                    ul([
                        li('Remove the output cell from the Narrative'),
                        li('Remove this output record'),
                        li('Reset the app to edit mode'),
                    ]),
                    p('Note: This action is not reversible.'),
                    p(
                        'Data produced in this output will remain in your narrative, and may be found in the Data panel.'
                    ),
                    p('Are you sure you want to remove the output cell?'),
                ]);
            } else {
                content = div([
                    p('This will:'),
                    ul([
                        li('Remove the output cell from the Narrative'),
                        li('Remove this output record'),
                    ]),
                    p('Note: This action is not reversible.'),
                    p(
                        'Data produced in this output will remain in your narrative, and may be found in the Data panel.'
                    ),
                    p('Are you sure you want to remove the output cell?'),
                ]);
            }
            ui.showConfirmDialog({ title: 'Confirm Deletion of Cell Output', body: content }).then(
                (answer) => {
                    if (!answer) {
                        return;
                    }
                    // remove the output cell
                    const modelOutput = model.outputs[index],
                        outputCell = findCellForId(modelOutput.cellId);
                    let cellIndex;

                    if (outputCell) {
                        cellIndex = Jupyter.notebook.find_cell_index(outputCell);
                        Jupyter.notebook.delete_cell(cellIndex);
                    }

                    // send a message on the cell bus bus, parent should pick it up, remove the
                    // output from the model, and update us.
                    bus.bus().send(
                        {
                            jobId: output.jobId,
                        },
                        {
                            channel: {
                                cell: cellId,
                            },
                            key: {
                                type: 'output-cell-removed',
                            },
                        }
                    );
                }
            );
        }

        function render() {
            const events = Events.make();
            let content;

            if (!model.outputs || model.outputs.length === 0) {
                content = 'No output yet!';
            } else {
                content = model.outputs
                    .sort((b, a) => {
                        if (a.createdTime < b.createdTime) {
                            return -1;
                        }
                        if (a.createdTime > b.createdTime) {
                            return 1;
                        }
                        return 0;
                    })
                    .map((output, index) => {
                        const rowStyle = {
                            border: '1px solid silver',
                            padding: '3px',
                        };
                        let message = '';
                        // console.log('JOB MATCH?', output.jobId, model.currentJobState);
                        if (
                            model.currentJobState &&
                            output.jobId === model.currentJobState.job_id
                        ) {
                            rowStyle.border = '2px solid blue';
                            message = 'This is the most recent output for this app.';
                        }
                        return div({ class: 'row', style: rowStyle }, [
                            div({ class: 'col-md-8' }, [
                                table({ class: 'table table-striped' }, [
                                    tr([th('Job Id'), td(output.jobId)]),
                                    tr([th('Cell Id'), td(output.cellId)]),
                                    tr([th('Created'), td(output.createdTime.toISOString())]),
                                ]),
                            ]),
                            div({ class: 'col-md-4', style: { textAlign: 'right' } }, [
                                button(
                                    {
                                        class: 'btn btn-sm btn-standard',
                                        type: 'button',
                                        id: events.addEvent({
                                            type: 'click',
                                            handler: function () {
                                                doRemoveOutputCell(index);
                                            },
                                        }),
                                    },
                                    '&times;'
                                ),
                                div(
                                    { style: { marginTop: '20px' }, dataElement: 'message' },
                                    message
                                ),
                            ]),
                        ]);
                    })
                    .join('\n');
            }
            container.innerHTML = content;
            events.attachEvents(container);
            if (!Jupyter.notebook.writable || Jupyter.narrative.readonly) {
                toggleReadOnly(true);
            }
        }

        function importModel(outputs) {
            let output;
            if (outputs.byJob) {
                model.outputs = Object.keys(outputs.byJob).map((jobId) => {
                    output = outputs.byJob[jobId];
                    // console.log(output);
                    return {
                        jobId: jobId,
                        cellId: output.cell.id,
                        createdTime: new Date(output.createdAt),
                    };
                });
            }
        }

        function start() {
            bus.on('run', (message) => {
                root = message.node;
                if (root) {
                    container = root.appendChild(document.createElement('div'));
                    ui = UI.make({ node: container });
                    model.currentJobState = message.jobState;
                    if (message.output) {
                        importModel(message.output);
                    }
                    render();
                }

                bus.on('update', (_message) => {
                    model.currentJobState = _message.jobState;
                    importModel(_message.output);
                    render();
                });
            });
            runtime.bus().on('read-only-changed', (msg) => {
                toggleReadOnly(msg.readOnly);
            });
        }

        function toggleReadOnly(readOnly) {
            if (readOnly) {
                container
                    .querySelector('.col-md-4 button.btn.btn-sm.btn-standard')
                    .classList.add('hidden');
            } else {
                container
                    .querySelector('.col-md-4 button.btn.btn-sm.btn-standard')
                    .classList.remove('hidden');
            }
        }

        function getBus() {
            return bus;
        }

        const api = Object.freeze({
            start: start,
            bus: getBus,
        });
        return api;
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
