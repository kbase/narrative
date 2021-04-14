define(['bluebird', 'common/html', './jobStateList'], (Promise, html, JobStateList) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        dataElementName = 'kb-job-list-wrapper';

    function factory(config) {
        const widgets = {},
            { model } = config;
        let container;

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

                // rows are widgets to enable live updates
                widgets.stateList = JobStateList.make(config);
                return Promise.all([
                    widgets.stateList.start({
                        node: container.querySelector(`[data-element="${dataElementName}"]`),
                        jobState: model.getItem('exec.jobState'),
                    }),
                ]);
            });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
                if (widgets) {
                    return Promise.all(
                        Object.keys(widgets).map((key) => {
                            return widgets[key].stop();
                        })
                    );
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
         * Requires a Props object with the current jobState object at
         * `exec.jobState`
         *
         * @param {object} config
         */
        make: function (config) {
            return factory(config);
        },
    };
});
