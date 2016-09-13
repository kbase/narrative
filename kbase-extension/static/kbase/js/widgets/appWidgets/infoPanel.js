/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'common/runtime',
    'kb_service/client/catalog',
    'kb_service/client/narrativeMethodStore',
    'handlebars',
    'text!kbase/templates/app_info_panel.html'
],
function(
    Promise,
    Runtime,
    Catalog,
    NarrativeMethodStore,
    Handlebars,
    appInfoPanelTmpl
) {
    'use strict';
    function factory(config) {
        var container,
            runtime = Runtime.make(),
            nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url')),
            catalog = new Catalog(runtime.config('services.catalog.url')),
            appId = config.appId,
            appVersion = config.appVersion,
            appAuthors = config.appAuthors,
            infoPanel = Handlebars.compile(appInfoPanelTmpl);

        function start(arg) {
            return Promise.try(function () {
                container = arg.node;
                // var info = {
                //     description: 'Lorem ipsum dolor sit amit... yadda yadda yadda. This is a description and stuff.',
                //     authorList: appAuthors.join(', '),
                //     updateDate: 'NEVER',
                //     runCount: 42
                // };
                // container.html(infoPanel(info));
            });
        }

        function stop() {
            return Promise.try(function () {
                container.innerHTML = '';
            });
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