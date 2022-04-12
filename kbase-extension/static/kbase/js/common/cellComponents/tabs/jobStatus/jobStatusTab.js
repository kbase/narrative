define(['bluebird', 'common/html', './jobStatusTable'], (Promise, html, JobStatusTableModule) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        dataElementName = 'kb-job-list-wrapper',
        { BatchJobStatusTable } = JobStatusTableModule;

    function JobStatusTab(config = {}) {
        const launchMode = config.launchMode || false;

        let container, jobStatusTableWidget;

        function mode() {
            return launchMode ? 'launchMode' : 'runMode';
        }

        function renderLayout() {
            return div({
                class: 'kb-job-status-tab__container',
                dataElement: dataElementName,
            });
        }

        function renderLaunchingLayout() {
            return div(
                {
                    class: 'kb-job-status-tab__container',
                },
                'Batch job submitted; waiting for response from job runner.'
            );
        }

        /**
         * starts the jobStatus tab
         *
         * @param {object} arg, with key 'node' containing the node where the
         *                      job status tab will be built
         */

        function start(arg) {
            container = arg.node;
            if (launchMode) {
                return Promise.try(() => {
                    container.innerHTML = renderLaunchingLayout();
                });
            }
            return Promise.try(() => {
                container.innerHTML = renderLayout();
                jobStatusTableWidget = new BatchJobStatusTable(config);
                return Promise.try(() => {
                    jobStatusTableWidget.start({
                        node: container.querySelector(`[data-element="${dataElementName}"]`),
                    });
                });
            });
        }

        function stop() {
            if (jobStatusTableWidget) {
                jobStatusTableWidget.stop();
            }
            if (container) {
                container.innerHTML = '';
            }
            return Promise.resolve();
        }

        return {
            start,
            stop,
            mode,
        };
    }

    return {
        launchMode: {
            make: (options) => {
                return JobStatusTab(Object.assign({}, options, { launchMode: true }));
            },
        },

        runMode: {
            make: (options) => {
                return JobStatusTab(options);
            },
        },

        /**
         * This should be (or resemble) the config object from the bulkImportCell
         * with keys 'model' and 'jobManager'
         *
         * @param {object} config
         */
        make: JobStatusTab,
    };
});
