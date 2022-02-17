define(['bluebird', 'common/html', './jobStatusTable'], (Promise, html, JobStatusTableModule) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        dataElementName = 'kb-job-list-wrapper',
        { BatchJobStatusTable } = JobStatusTableModule;

    function factory(config) {
        let container, jobStatusTableWidget;

        function renderLayout() {
            return div({
                class: 'kb-job-status-tab__container',
                dataElement: dataElementName,
            });
        }

        /**
         * starts the jobStatus tab
         *
         * @param {object} arg, with key 'node' containing the node where the
         *                      job status tab will be built
         */

        function start(arg) {
            return Promise.try(() => {
                container = arg.node;
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
        };
    }

    return {
        /**
         * This should be (or resemble) the config object from the bulkImportCell
         * with keys 'model' and 'jobManager'
         *
         * @param {object} config
         */
        make: function (config) {
            return factory(config);
        },
    };
});
