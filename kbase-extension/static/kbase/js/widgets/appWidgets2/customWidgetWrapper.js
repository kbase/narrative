define(['bluebird', 'jquery', 'base/js/namespace', 'common/runtime', 'common/jobCommChannel'], (
    Promise,
    $,
    Jupyter,
    Runtime,
    JobComms
) => {
    'use strict';
    const jcm = JobComms.JobCommMessages;

    function factory(config) {
        const cellId = config.cellId,
            runtime = Runtime.make(),
            // our state
            appSpec = config.app.spec;
        let container, wrappedWidget;

        /*
         * This is a fake widget finder for now...
         * At the moment widget ids are still jquery widget ids which operate
         * under the given widget id as both a jquery widget name and
         * amd module name (see narrative_paths.js for the mapping)
         */
        function findWidget(widgetId) {
            return {
                modulePath: widgetId,
            };
        }

        function runCustomWidget() {
            const widgetDef = findWidget(appSpec.widgets.input);
            require([widgetDef.modulePath], (Widget) => {
                wrappedWidget = new Widget($(container), {
                    appSpec,
                    workspaceName: Jupyter.narrative.getWorkspaceName(),
                });
                appSpec.parameters.forEach((parameter) => {
                    wrappedWidget.addInputListener(parameter.id, (data) => {
                        runtime.bus().send(
                            {
                                id: parameter.id,
                                value: data.val,
                            },
                            {
                                channel: {
                                    [jcm.CHANNELS.CELL]: cellId,
                                },
                                key: {
                                    type: 'parameter-changed',
                                },
                            }
                        );
                    });
                });
            });
        }

        function start(params) {
            return Promise.try(() => {
                const parent = params.root;

                container = parent.appendChild(document.createElement('div'));

                // Get sorted out with the app and the input widget.
                // container.innerHTML = render();
                runCustomWidget();

                runtime.bus().send(
                    {},
                    {
                        channel: {
                            [jcm.CHANNELS.CELL]: cellId,
                        },
                        key: {
                            type: 'sync-params',
                        },
                    }
                );
                // listen for cell-related bus messages
                runtime.bus().listen({
                    channel: {
                        [jcm.CHANNELS.CELL]: cellId,
                    },
                    key: {
                        type: 'parameter-value',
                    },
                    handle: function (message) {
                        wrappedWidget.setParameterValue(message.id, message.value);
                    },
                });

                runtime.bus().on('workspace-changed', () => {
                    wrappedWidget.refresh();
                });
            });
        }

        function stop() {
            // no op
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
