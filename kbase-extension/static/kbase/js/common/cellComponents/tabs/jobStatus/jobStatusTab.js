define(['bluebird', 'common/html', './jobStatusTable'], (Promise, html, JobStatusTable) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        dataElementName = 'kb-job-list-wrapper';

    function factory(config) {
        let container, jobStatusTableWidget;

        function renderLayout() {
            return div({
                class: 'kb-job__container',
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
                container.classList.add('kb-job__tab_container');
                container.innerHTML = renderLayout();

                jobStatusTableWidget = JobStatusTable.make(config);
                return Promise.try(() => {
                    jobStatusTableWidget.start({
                        node: container.querySelector(`[data-element="${dataElementName}"]`),
                    });
                });
            });
        }

        function stop() {
            container.innerHTML = '';
            if (jobStatusTableWidget) {
                return jobStatusTableWidget.stop();
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
