define(['bluebird', 'common/html', './jobStateList'], (Promise, html, JobStateList) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        dataElementName = 'kb-job-list-wrapper';

    function factory(config) {
        let container, jobStateListWidget;

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

                jobStateListWidget = JobStateList.make(config);
                return Promise.try(() => {
                    jobStateListWidget.start({
                        node: container.querySelector(`[data-element="${dataElementName}"]`),
                    });
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
                if (jobStateListWidget) {
                    jobStateListWidget.stop();
                }
            });
        }

        return {
            start: start,
            stop: stop,
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
