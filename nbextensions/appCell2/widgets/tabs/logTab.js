/**
 * This is the entrypoint module for the job status / log viewer tab of the app cell.
 */
define(['bluebird', 'common/html', 'common/ui', 'util/jobLogViewer'], (
    Promise,
    html,
    UI,
    JobLogViewerModule
) => {
    'use strict';

    const { JobLogViewer } = JobLogViewerModule;

    const t = html.tag,
        div = t('div'),
        p = t('p');

    const BATCH_MODE_TEXT =
        'This app is running in batch mode. The status and log of the parent job are shown below.';

    /**
     *
     * @param {object} config with key 'model', containing the cell model
     * @returns log tab instance
     */
    function factory(config) {
        let container, // The top level node used by this widget
            ui; // UI module interface to this container
        const { model } = config,
            widgets = {};

        function generateLayout(isBatchJob = false) {
            let intro = '';
            if (isBatchJob) {
                intro = p(BATCH_MODE_TEXT);
            }
            return intro + div({ dataElement: 'log' });
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
            const childJobs = model.getItem('exec.jobState.child_jobs');
            if ((childJobs && childJobs.length > 0) || model.getItem('user-settings.batchMode')) {
                isBatchJob = true;
            }

            return Promise.try(() => {
                container.innerHTML = generateLayout(isBatchJob);
                widgets.log = new JobLogViewer({ showHistory: true });
                return widgets.log.start({
                    node: ui.getElement('log'),
                    jobId: model.getItem('exec.jobState.job_id'),
                });
            });
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
