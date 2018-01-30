/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'kb_common/html',
    'base/js/namespace',
    'common/runtime'
], function (
    Promise,
    html,
    Jupyter,
    Runtime
    ) {
    'use strict';

    var t = html.tag,
        div = t('div'), pre = t('pre');

    function factory(config) {
        var parent, container,
            cellId = config.cellId,
            cellBus,
            runtime = Runtime.make(),
            // our state
            appId = config.app.id,
            appVersion = config.app.version,
            appTag = config.app.tag,
            appSpec = config.app.spec,
            wrappedWidget;

        /*
         * This is a fake widget finder for now...
         * At the moment widget ids are still jquery widget ids which operate
         * under the given widget id as both a jquery widget name and 
         * amd module name (see narrative_paths.js for the mapping)
         */
        function findWidget(widgetId) {
            return {
                modulePath: widgetId
            };
        }

        function runCustomWidget() {
            var widgetDef = findWidget(appSpec.widgets.input);
            require([
                widgetDef.modulePath
            ], function (Widget) {
                wrappedWidget = new Widget($(container), {
                    appSpec: appSpec,
                    workspaceName: Jupyter.narrative.getWorkspaceName()
                });
                appSpec.parameters.forEach(function (parameter) {
                    wrappedWidget.addInputListener(parameter.id, function (data) {
                        runtime.bus().send({
                            id: parameter.id,
                            value: data.val
                        }, {
                            channel: {
                                cell: cellId
                            },
                            key: {
                                type: 'parameter-changed'
                            }
                        });

                        // changedParameters[parameter.id] = data.val;
                        // console.log('CHANGED', data);
                        // Update the param in the metadata ...
                    });
                });
            });
        }

        function start(params) {
            return Promise.try(function () {
                var parent = params.root;

                container = parent.appendChild(document.createElement('div'));

                // Get sorted out with the app and the input widget.
                // container.innerHTML = render();
                runCustomWidget();
                
                runtime.bus().send({}, {
                    channel: {
                        cell: cellId
                    },
                    key: {
                        type: 'sync-params'
                    }
                });
                runtime.bus().listen({
                    channel: {
                        cell: cellId
                    },
                    key: {
                        type: 'parameter-value'
                    },
                    handle: function (message) {
                        wrappedWidget.setParameterValue(message.id, message.value);
                    }                    
                })
                
                runtime.bus().on('workspace-changed', function () {
                    wrappedWidget.refresh();
                });
            });
        }

        function stop() {

        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});