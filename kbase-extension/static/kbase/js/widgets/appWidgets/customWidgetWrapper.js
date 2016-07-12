/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'kb_common/html',
    'base/js/namespace'
], function (
    Promise,
    html,
    Jupyter
    ) {
    'use strict';
    
    var t = html.tag,
        div = t('div'), pre = t('pre');

    function factory(config) {
        var parent, container,
            // our state
            appId = config.app.id, 
            appVersion = config.app.version, 
            appTag = config.app.tag,
            appSpec = config.app.spec;
        
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
                
                new Widget($(container), {
                    appSpec: appSpec,
                    workspaceName: Jupyter.narrative.getWorkspaceName()
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