define([
    'require',
    'common/jupyter',
    'common/utils',
    'common/runtime'
], function (
    require,
    jupyter,
    utils,
    Runtime
) {
    /*
     id: '{{input_id}}',
                    data: {{input_data}},
                    state: {{output_state}},
                    cellId: {{cell_id}},
                    title: '{{cell_title}}',
                    time: {{timestamp}}
    */

    function outputWidgetSupport(config) {
        function factory (config) {
            var cell = jupyter.getCell(config.cellId);
            var runtime = Runtime.make();
            var bus = runtime.bus().connect();            

            // Save a plain object (json) to 
            // a specific path on the kbase-compatible metadata:
            // kbase.viewCell.output.state
            function saveState(state) {
                // Save a copy to the metadata
                utils.setCellMeta(cell, 'viewCell.outputWidgetState', JSON.parse(JSON.stringify(state)));
            }

            function getState() {
                return utils.getCellMeta(cell, 'viewCell.outputWidgetState');
            }

            function emit(key, message) {
                bus.channel({cell: config.cellId}).emit(key, message);
            }

            return {
                saveState: saveState,
                getState: getState,
                emit: emit
            };
        }
        return factory(config);
    }

    function launchWidget(arg) {
        var node = document.getElementById(arg.id);
        require([
            'widgets/custom/' + arg.widget
        ], function (widget) {
            widget.make({
                node: node,
                data: arg.data,
                state: arg.state,
                api: outputWidgetSupport({
                    cellId: arg.cellId,
                    initialState: arg.state
                })
            }).start()
            .catch(function (err) {
                node.innerHTML = 'ERROR: ' + err.message;
            });
        });

    }

    return {
        launchWidget: launchWidget
    };
});