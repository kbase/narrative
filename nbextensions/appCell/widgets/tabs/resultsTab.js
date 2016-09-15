/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'jquery',
    'common/ui',
    'common/runtime',
    'common/events',
    'kb_service/client/narrativeMethodStore',
    'kb_common/html',
    'kbaseReportView'
], function (Promise, $, UI, Runtime, Events, NarrativeMethodStore, html, KBaseReportView) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        p = t('p'),
        a = t('a'),
        span = t('span');

    function factory(config) {
        var container,
            model = config.model,
            ui,
            runtime,
            nms;
        function start(arg) {
            return Promise.try(function () {
                container = arg.node;
                model = arg.model;
                ui = UI.make({node: container}),
                runtime = Runtime.make(),
                nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'));

                var result = model.getItem('exec.outputWidgetInfo');
                var jobState = model.getItem('exec.jobState');
                var finishDate = new Date(jobState.finish_time);

                var layout = div([
                    div({dataElement: 'summary'}),
                    div({dataElement: 'results'}),
                    div({dataElement: 'report'}),
                    div({dataElement: 'next-steps'})
                ]);
                container.innerHTML = layout;

                ui.setContent('summary', p([
                    'Results from run finished on ',
                    finishDate.toLocaleDateString(),
                    ' at ',
                    finishDate.toLocaleTimeString()
                ].join('')));


                // If there's a "report_ref" key in the results, load and show the report.
                if (result.params.report_name) {
                    // do report widget.
                    renderReportView(result.params);
                } else {
                    ui.setContent('results', ui.buildPresentableJson(result));
                }

                // Look up this app's info to get it's suggested next steps.
                return nms.get_method_full_info({
                    ids: [model.getItem('app.id')],
                    tag: model.getItem('app.tag')
                });
            })
            .then(function(appInfo) {
                // If there are suggested next apps (er, methods), they'll be listed
                // by app id. Look them up!
                var suggestions = appInfo[0].suggestions || {};
                var tag = model.getItem('app.tag');
                if (suggestions.next_methods) {
                    return nms.get_method_spec({
                        ids: suggestions.next_methods,
                        tag: tag
                    });
                }
            })
            .then(function(nextApps) {
                renderNextApps(nextApps);
            });
        }

        function renderReportView(params) {
            ui.setContent('report',
                ui.buildCollapsiblePanel({
                    title: 'Report',
                    name: 'report-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: [
                        div({dataElement: 'report-widget'})
                    ]
                })
            );
            new KBaseReportView($(ui.getElement('report-widget')), params);
        }

        function renderNextApps(apps) {
            apps = apps || [];
            var events = Events.make();
            var appList = div([
                'No suggestions available! ',
                a({ href:'https://kbase.us/contact-us/', target: '_blank' }, 'Contact us'),
                ' if you would like to add one.'
            ]);
            // filter out legacy apps with no module name
            apps = apps.filter(function(app) {
                return app.info.module_name;
            });
            if (apps.length > 0) {
                appList = apps.map(function(app, index) {
                    if (!app.info.module_name) {
                        return;
                    }
                    return div([
                        a({
                            id: events.addEvent({
                                type: 'click',
                                handler: function () {
                                    $(document).trigger('methodClicked.Narrative', [app, 'dev']);
                                }
                            })},
                            app.info.name
                        ),
                        span(' - ' + (app.info.module_name || '(legacy app - will not run.)'))
                    ]);
                }).join('\n');
            }
            ui.setContent('next-steps',
                ui.buildCollapsiblePanel({
                    title: 'Suggested Next Steps',
                    name: 'next-steps-toggle',
                    hidden: false,
                    type: 'default',
                    classes: ['kb-panel-container'],
                    body: appList
                })
            );
            events.attachEvents(container);
        }

        function stop() {
            return Promise.try(function () {
                container.innerHTML = 'Bye from results';
            });
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