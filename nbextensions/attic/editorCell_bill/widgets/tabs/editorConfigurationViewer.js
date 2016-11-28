/*global define,require*/
/*eslint-env browser*/
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
            viewerMap = {
                'reads_set_editor': 'widgets/appWidgets/editors/readsSetEditorView'
            },
            editorWidget;

        function loadViewer(model) {
            return Promise.try(function() {
                editorType = model.getItem('app.spec.widgets.input');
                var viewerWidgetPath = viewerMap[editorType];
                if (viewerWidgetPath) {
                    require(viewerMap[editorType], function(Editor) {
                        editorWidget = Editor.make(config);
                        return editorWidget.start({
                            node: container
                        });
                    });
                }
            });
        }

        function start(arg) {
            container = arg.node;
            return loadViewer(arg.model);
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
