define([
    'bluebird',
    'common/html',
    'common/ui',
    'common/jobStateViewer',
    'common/simpleLogViewer',
], (Promise, html, UI, JobStateViewerModule, SimpleLogViewerModule) => {
    'use strict';

    const { JobStateViewer } = JobStateViewerModule;
    const JobLogViewer = SimpleLogViewerModule.SimpleLogViewer;

    const t = html.tag,
        div = t('div'),
        p = t('p');

    const BATCH_MODE_TEXT =
        'This app is running in batch mode. The status and log of the parent job are shown below.';

    /**
     * This is the entrypoint module for the job status / log viewer tab of the app cell.
     *
     * @param {object} config with key 'model', containing the cell model
     * @returns log tab instance
     */
    function factory(config) {
        let container, // The top level node used by this widget
            ui; // UI module interface to this container
        const { model, jobManager } = config,
            widgets = {};

        function generateLayout(isBatchJob = false) {
            let intro = '';
            if (isBatchJob) {
                intro = p(BATCH_MODE_TEXT);
            }
            return intro + div({ dataElement: 'state' }) + div({ dataElement: 'log' });
        }

        /**
         * Start the job status tab.
         *
         * @param {object} arg
         *  - node - the node to attach this tab to
         */
        function start(arg) {
            container = arg.node.appendChild(document.createElement('div'));
            ui = UI.make({
                node: container,
            });

            let isBatchJob = false;
            const jobState = jobManager.getJob();
            const childJobs = jobState.child_jobs;
            if ((childJobs && childJobs.length > 0) || model.getItem('user-settings.batchMode')) {
                isBatchJob = true;
            }

            container.innerHTML = generateLayout(isBatchJob);
            widgets.log = new JobLogViewer({ jobManager });
            widgets.state = new JobStateViewer({ jobManager, showHistory: true });
            const startPromises = [
                widgets.log.start({
                    jobId: jobState.job_id,
                    node: ui.getElement('log'),
                }),
                widgets.state.start({
                    jobId: jobState.job_id,
                    node: ui.getElement('state'),
                }),
            ];
            return Promise.all(startPromises);
        }

        function stop() {
            return Promise.try(() => {
                return Promise.all(
                    Object.keys(widgets).map((key) => {
                        return widgets[key].stop();
                    })
                );
            });
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
        batchModeText: BATCH_MODE_TEXT,
    };
});
