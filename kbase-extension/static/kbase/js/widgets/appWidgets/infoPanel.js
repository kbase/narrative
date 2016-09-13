/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'common/runtime',
    'kb_service/client/catalog',
    'kb_service/client/narrativeMethodStore',
    'util/timeFormat',
    'handlebars',
    'text!kbase/templates/app_info_panel.html'
],
function(
    Promise,
    Runtime,
    Catalog,
    NarrativeMethodStore,
    TimeFormat,
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
            appModule = config.appModule,
            tag = config.tag || 'release',
            infoPanel = Handlebars.compile(appInfoPanelTmpl),
            panelInfo = {}

        function start(arg) {
            return Promise.try(function () {
                container = arg.node;

                return nms.get_method_full_info({'ids': [appId], 'tag': tag});
            })
            .then(function(methodInfo) {
                methodInfo = methodInfo[0];
                panelInfo = {
                    description: new Handlebars.SafeString(methodInfo.description),
                    authorList: methodInfo.authors.join(', '),
                    multiAuthors: methodInfo.authors.length > 1
                };
                return catalog.get_exec_aggr_stats({'full_app_ids': [appId]});
            })
            .then(function(appStats) {
                panelInfo['runCount'] = appStats[0]['number_of_calls'];
                return catalog.get_module_info({'module_name': appModule});
            })
            .then(function(moduleInfo) {
                panelInfo['updateDate'] = new Date(moduleInfo[tag].timestamp).toLocaleDateString(),

                container.html(infoPanel(panelInfo));
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