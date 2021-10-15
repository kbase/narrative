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

    /**
     *
     * @param {Object} config should just have a single object - the model from the App Cell
     * @returns an object representing the widget with `start`, `stop`, and `reportRenderingPromise`
     *   keys. The `start` and `stop` function both return Promises, and are used as the lifecycle
     *   functions. `reportRenderingPromise`, if not null, is the Promise that resolves when the
     *   viewed report is done rendering. It's not generally used in practice, but useful for testing.
     */
    function factory(config) {
        const { model } = config;
        let container,
            ui,
            runtime,
            reportRendered = false,
            reportRenderTimeout = null,
            reportParams,
            reportWidget = null,
            reportRenderingPromise = null;

        /**
         *
         * @param {Object} arg initial startup argument object, with keys:
         *   - node {DOMElement} the node to attach this viewer
         *   - jobState {Object} the state of the job in this app cell
         *   - isParentJob {boolean} if true, this is a batch job
         * @returns
         */
        function start(arg) {
            container = arg.node;
            ui = UI.make({ node: container });
            runtime = Runtime.make();

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

        /**
         * Shows the results of a job run. This returns a Promise that resolves when
         * the rendering is done.
         * @param {Object} jobState - object describing the state of a job
         * @param {boolean} isParentJob - true if this job is a parent of a batch job
         * @returns
         */
        function showResults(jobState, isParentJob) {
            // there's a couple of ways to find report parameters.
            let reportParams = null;
            const result = model.getItem('exec.outputWidgetInfo');

            // this way first - if this is a parent job of a batch, and we have
            // a report_name in the result, then show the batch result
            if (isParentJob && result && result.params && result.params.report_name) {
                reportParams = result.params;
            } else if (
                jobState.widget_info &&
                jobState.widget_info.params &&
                jobState.widget_info.params.report_name
            ) {
                // otherwise, if there's some report info in the jobState, show that
                // report
                reportParams = jobState.widget_info.params;
            }

            // if there are no report parameters, then just dump the info given in
            // the job output
            if (!reportParams) {
                return Promise.try(() => {
                    const jobOutput = jobState.job_output
                        ? jobState.job_output.result
                        : 'no output found';
                    ui.getElement('results').classList.remove('hidden');
                    ui.setContent('results.body', ui.buildPresentableJson(jobOutput));
                });
            }
            // otherwise, render the report
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
                    if (
                        !reportRendered &&
                        reportWidget === null &&
                        DisplayUtil.verticalInViewport(reportElem)
                    ) {
                        reportWidget = new KBaseReportView($(reportElem), reportParams);
                        reportRenderingPromise = reportWidget.loadAndRender().then(() => {
                            reportRendered = true;
                            nbContainer.removeEventListener('scroll', lazyRenderReport);
                        });
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
            const nms = new NarrativeMethodStore(
                runtime.config('services.narrative_method_store.url')
            );
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

        function stop() {
            return Promise.try(() => {
                clearTimeout(reportRenderTimeout);
            });
        }

        return {
            start,
            stop,
            reportRenderingPromise,
        };
    }

    return {
        make: (config) => {
            return factory(config);
        },
    };
});
