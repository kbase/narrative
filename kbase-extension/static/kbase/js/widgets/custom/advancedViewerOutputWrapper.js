define([
    'require',
    'common/jupyter',
    'common/cellUtils',
    'common/runtime',
    'common/jobCommChannel',
], (require, jupyter, utils, Runtime, JobComms) => {
    'use strict';
    const jcm = JobComms.JobCommMessages;
    /*
     id: '{{input_id}}',
                    data: {{input_data}},
                    state: {{output_state}},
                    cellId: {{cell_id}},
                    title: '{{cell_title}}',
                    time: {{timestamp}}
    */

    function outputWidgetSupport(config) {
        function factory(config) {
            const cell = jupyter.getCell(config.cellId);
            const runtime = Runtime.make();
            const bus = runtime.bus().connect();

            // Save a plain object (json) to
            // a specific path on the kbase-compatible metadata:
            // kbase.viewCell.output.state
            function saveState(state) {
                // Save a copy to the metadata
                utils.setCellMeta(
                    cell,
                    'viewCell.outputWidgetState',
                    JSON.parse(JSON.stringify(state))
                );
            }

            function getState() {
                return utils.getCellMeta(cell, 'viewCell.outputWidgetState');
            }

            function emit(key, message) {
                bus.channel({ [jcm.CHANNEL.CELL]: config.cellId }).emit(key, message);
            }

            return {
                saveState,
                getState,
                emit,
            };
        }
        return factory(config);
    }

    function launchWidget(arg) {
        const node = document.getElementById(arg.id);
        require(['widgets/custom/' + arg.widget], (widget) => {
            widget
                .make({
                    node,
                    data: arg.data,
                    state: arg.state,
                    api: outputWidgetSupport({
                        cellId: arg.cellId,
                        initialState: arg.state,
                    }),
                })
                .start()
                .catch((err) => {
                    node.innerHTML = 'ERROR: ' + err.message;
                });
        });
    }

    return {
        launchWidget,
    };
});
