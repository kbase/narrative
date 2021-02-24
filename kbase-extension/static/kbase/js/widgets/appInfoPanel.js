/**
 * Creates an informational panel for Apps, based on some general app info.
 * Needs the following keys in its config:
 * appId - the full id of the app (module/app_name)
 * appModule - the name of the module that the app comes from
 * tag - the tag of the app to display (release, beta, or dev)
 * node - the jQuery node (I know...) where this panel should show itself
 */
define([
    'bluebird',
    'common/runtime',
    'kb_service/client/catalog',
    'kb_service/client/narrativeMethodStore',
    'handlebars',
    'text!kbase/templates/app_info_panel.html'
], (
    Promise,
    Runtime,
    Catalog,
    NarrativeMethodStore,
    Handlebars,
    appInfoPanelTmpl
) => {
    'use strict';

    function factory(config) {
        const runtime = Runtime.make(),
            nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url')),
            catalog = new Catalog(runtime.config('services.catalog.url')),
            appId = config.appId,
            appModule = config.appModule,
            tag = config.tag || 'release',
            infoPanel = Handlebars.compile(appInfoPanelTmpl);
        let container,
            info = {};

        function start(arg) {
            container = arg.node;

            const infoProms = [
                /* Get the method full info so we can populate the description */
                nms.get_method_full_info({ 'ids': [appId], 'tag': tag })
                    .then((methodInfo) => {
                        methodInfo = methodInfo[0] || {};
                        const desc = methodInfo.description || '';
                        info.description = new Handlebars.SafeString(desc);

                        const authorList = methodInfo.authors || [];
                        info.authorList = authorList.join(', ');
                        info.multiAuthors = authorList.length > 1;
                    }),

                /* Get the method stats so we know how many times it was run. */
                catalog.get_exec_aggr_stats({ 'full_app_ids': [appId] })
                    .then((appStats) => {
                        appStats = appStats[0] || {};
                        info.runCount = appStats.number_of_calls || 'unknown';
                    }),

                /* Get the module info so we know when it was last updated. */
                catalog.get_module_info({ 'module_name': appModule })
                    .then((moduleInfo) => {
                        moduleInfo = moduleInfo[tag] || {};
                        const timestamp = moduleInfo.timestamp || 'unknown';
                        let dateString = 'unknown';
                        try {
                            dateString = new Date(timestamp).toLocaleDateString();
                        } catch (e) {
                            //pass
                        }
                        info.updateDate = dateString;
                    })
            ];
            return Promise.all(infoProms)
                .then(() => {
                    container.html(infoPanel(info));
                });
        }

        function stop() {
            return Promise.resolve(container.html(''));
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
