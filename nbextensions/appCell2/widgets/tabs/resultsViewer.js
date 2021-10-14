define([
    'bluebird',
    'jquery',
    'common/ui',
    'common/runtime',
    'common/events',
    'kb_service/client/narrativeMethodStore',
    'kb_common/html',
    'util/display',
    'kbaseReportView',
], (Promise, $, UI, Runtime, Events, NarrativeMethodStore, html, DisplayUtil, KBaseReportView) => {
    'use strict';
    const t = html.tag,
        div = t('div'),
        a = t('a'),
        span = t('span');

    function factory(config) {
        const { model } = config;
        let container,
            ui,
            runtime,
            nms,
            reportRendered = false,
            reportRenderTimeout = null,
            reportParams;

        function start(arg) {
            container = arg.node;
            ui = UI.make({ node: container });
            runtime = Runtime.make();
            nms = new NarrativeMethodStore(runtime.config('services.narrative_method_store.url'));

            const layout = div(
                {
                    class: 'kb-app-results-tab',
                },
                [
                    ui.buildCollapsiblePanel({
                        title: 'Results',
                        name: 'results',
                        hidden: true,
                        type: 'default',
                        classes: ['kb-panel-results'],
                    }),
                    div({ dataElement: 'report' }),
                    div({ dataElement: 'next-steps' }),
                ]
            );
            container.innerHTML = layout;

            return Promise.all([showResults(arg.jobState, arg.isParentJob), showNextApps()]);
        }

        function showResults(jobState, isParentJob) {
            // If there's a "report_name" key in the results, load and show the report.
            const result = model.getItem('exec.outputWidgetInfo');
            let reportParams = null;

            if (isParentJob && result && result.params && result.params.report_name) {
                reportParams = result.params;
                // renderReportView(result.params);
            } else if (
                jobState.widget_info &&
                jobState.widget_info.params &&
                jobState.widget_info.params.report_name
            ) {
                // do report widget.
                reportParams = jobState.widget_info.params;
                // renderReportView(jobState.widget_info.params);
            }

            if (!reportParams) {
                return Promise.try(() => {
                    ui.getElement('results').classList.remove('hidden');
                    ui.setContent(
                        'results.body',
                        ui.buildPresentableJson(jobState.job_output.result)
                    );
                });
            }
            return renderReportView(reportParams);
        }

        function lazyRenderReport() {
            return Promise.try(() => {
                const nbContainer = document.querySelector('#notebook-container');
                // Add scroll event listener to the notebook container on first call.
                if (!reportRenderTimeout) {
                    nbContainer.addEventListener('scroll', lazyRenderReport);
                }
                // Use a debounce timeout to avoid rendering the report _while_ the user is scrolling.
                clearTimeout(reportRenderTimeout);
                reportRenderTimeout = setTimeout(() => {
                    const reportElem = ui.getElement('report-widget');
                    // Once scrolling stops...
                    if (!reportRendered && DisplayUtil.verticalInViewport(reportElem)) {
                        new KBaseReportView($(reportElem), reportParams).loadAndRender();
                        reportRendered = true;
                    }
                    if (reportRendered) {
                        // Remove the scroll event listener if the report has been rendered.
                        nbContainer.removeEventListener('scroll', lazyRenderReport);
                    }
                }, 200);
            });
        }

        /**
         *
         * @param {Object} params - parameters for the report view
         */
        function renderReportView(params) {
            reportParams = JSON.parse(JSON.stringify(params));
            // Override the option to show created objects listed in the report
            // object. For some reason this single option defaults to false!
            reportParams.showCreatedObjects = true;
            ui.setContent('report', div({ dataElement: 'report-widget' }));
            return lazyRenderReport();
        }

        /**
         *
         * @returns a Promise that resolves when the next apps element is rendered
         */
        function showNextApps() {
            const appFullInfo = model.getItem('app.spec.full_info') || {};
            // If there are suggested next apps (er, methods), they'll be listed
            // by app id. Look them up!
            const suggestions = appFullInfo.suggestions || {};
            const tag = model.getItem('app.tag');
            const nextMethods = suggestions.next_methods;
            if (!nextMethods || !nextMethods.length) {
                return Promise.resolve();
            }
            return nms
                .get_method_spec({
                    ids: nextMethods,
                    tag,
                })
                .then((nextApps) => {
                    renderNextApps(nextApps);
                });
        }

        /**
         *
         * @param {*} apps
         */
        function renderNextApps(apps) {
            apps = apps || [];
            if (!apps.length) {
                return;
            }
            const events = Events.make();
            let appList = div([
                'No suggestions available! ',
                a({ href: 'https://www.kbase.us/support/', target: '_blank' }, 'Contact us'),
                ' if you would like to add one.',
            ]);
            // filter out legacy apps with no module name
            apps = apps.filter((app) => {
                return app.info.module_name;
            });
            // If there are no next apps to suggest, don't even show the Suggested Next Steps panel
            if (apps.length > 0) {
                appList = apps
                    .map((app) => {
                        return div([
                            a(
                                {
                                    id: events.addEvent({
                                        type: 'click',
                                        handler: function () {
                                            $(document).trigger('methodClicked.Narrative', [
                                                app,
                                                'dev',
                                            ]);
                                        },
                                    }),
                                },
                                app.info.name
                            ),
                            span(' - ' + app.info.module_name),
                        ]);
                    })
                    .join('\n');
                ui.setContent(
                    'next-steps',
                    ui.buildCollapsiblePanel({
                        title: 'Suggested Next Steps',
                        name: 'next-steps-toggle',
                        hidden: false,
                        type: 'default',
                        classes: ['kb-panel-container'],
                        body: appList,
                    })
                );
                events.attachEvents(container);
            }
        }

        function stop() {}

        return {
            start,
            stop,
        };
    }

    return {
        make: (config) => {
            return factory(config);
        },
    };
});
