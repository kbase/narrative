/*global define,require*/
/*eslint-env browser*/
/**
 * A really lightweight configuration widget.
 * This might be useful for generalizing the editor cells.
 * It mainly loads up a specific editor widget based on the given input widget
 * in the app spec.
 */
define([
    'jquery',
    'bluebird'
], function (
    $,
    Promise
) {
    'use strict';

    function factory(config) {
        var container,
            editorType,
            editorMap = {
                'reads_set_editor': 'widgets/appWidgets/editors/readsSetEditor'
            },
            editorWidget,
            cellBus;

        function loadEditor(model, runtime) {
            return new Promise(function(resolve, reject) {
                editorType = model.getItem('app.spec.widgets.input');
                require([editorMap[editorType]], function(Editor) {
                    var bus = runtime.bus().makeChannelBus(null, "Parent comm bus for editor widget"),
                        editorWidget = Editor.make({
                            bus: bus,
                            cellBus: cellBus
                        });

                    return editorWidget.start({
                        node: container,
                        model: model
                    });
                }, function (err) {
                    reject(err);
                });
            });
        }

        function start(arg) {
            container = arg.node;
            cellBus = arg.cellBus;
            console.log("configurator starting up", arg);
            return loadEditor(arg.model, arg.runtime, arg.env);
        }

        function stop() {
            if (editorWidget) {
                editorWidget.stop();
            }
            container.innerHTML = "Good bye.";
        }

        return {
            start: start,
            stop: stop
        }
    }

    return {
        make: function(config) {
            return factory(config);
        }
    }
});
