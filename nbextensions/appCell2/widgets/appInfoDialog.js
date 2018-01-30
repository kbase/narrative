/*global define*/
/*jslint white:true,browser:true*/
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
    'common/html',
    'common/ui',
    'kb_service/client/catalog',
    'kb_service/client/narrativeMethodStore'
], function(
    Promise,
    Runtime,
    html,
    UI,
    Catalog,
    NarrativeMethodStore
) {
    'use strict';

    function render(data) {
        var t = html.tag,
            div = t('div'),
            span = t('span'),
            ul = t('ul'),
            li = t('li');

        return div({ class: 'row' }, [
            div({ class: 'col-md-8' }, div({ class: 'kb-app-cell-info-desc' }, [
                div({
                    style: {
                        maxHeight: '400px',
                        overflowY: 'scroll'
                    }
                }, data.description)
            ])),
            div({ class: 'col-md-4' }, div({ class: 'kb-app-cell-info' }, [
                div({ class: 'header' }, 'Information'),
                div([
                    'Author', (data.authors.length > 1 ? 's' : ''), ': ',
                    span({ class: 'value' }, (function() {
                        if (data.authors.length === 1) {
                            return data.authors[0];
                        }
                        return ul(data.authors.map(li));
                    }()))
                ]),
                //div([
                //    'ID: ', span({class: 'value'}, data.id)
                //]),                
                div([
                    'Tag: ', span({ class: 'value' }, data.tag)
                ]),
                div([
                    'Version: ', span({ class: 'value' }, data.version)
                ]),
                div([
                    'Updated: ', span({ class: 'value' }, data.updateDate)
                ]),
                div([
                    'Run count: ', span({ class: 'value' }, data.runCount)
                ])
            ]))
        ]);
    }

    function show(arg) {
        var runtime = Runtime.make(),
            nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url')),
            catalog = new Catalog(runtime.config('services.catalog.url'));
        return Promise.all([
                nms.get_method_full_info({ ids: [arg.id], tag: arg.tag, ver: arg.version }),
                catalog.get_exec_aggr_stats({ full_app_ids: [arg.id] }),
                catalog.get_module_info({ module_name: arg.module })
            ])
            .spread(function(methodInfo, aggregateStats, moduleInfo) {
                // if any of these results are unexpected, we just show an error message.
                var title = [
                        methodInfo[0].name
                    ].join(''),
                    info = {
                        id: arg.id,
                        tag: arg.tag,
                        version: (arg.tag === 'release' ? methodInfo[0].ver : methodInfo[0].git_commit_hash.substr(0, 7)),
                        description: methodInfo[0].description || '',
                        authors: methodInfo[0].authors || [],
                        runCount: aggregateStats[0] ? aggregateStats[0].number_of_calls : 'n/a',
                        updateDate: new Date(moduleInfo[arg.tag].timestamp).toLocaleDateString()
                    },
                    url = [window.location.origin, '#appcatalog/app', arg.id, arg.tag].join('/');

                return UI.showDialog({
                    title: title,
                    body: render(info),
                    cancelLabel: 'Close',
                    buttons: [{
                        action: 'link',
                        label: 'View in App Catalog',
                        handler: function() {
                            return {
                                url: url,
                                name: methodInfo[0].name
                            };
                        }
                    }],
                    options: {
                        width: '70%'
                    }
                });
            })
            .then(function(result) {
                switch (result.action) {
                    case 'link':
                        window.open(result.result.url, result.result.name);
                        break;
                }
            })
            .catch(function(err) {
                console.error('ERROR', err);
                return UI.showInfoDialog({
                    title: 'Error fetching app info',
                    body: err.message
                });
            });
    }

    return {
        show: show
    };
});