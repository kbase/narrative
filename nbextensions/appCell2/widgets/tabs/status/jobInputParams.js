define(['bluebird', 'common/runtime', 'common/ui', 'common/format', 'kb_common/html'], (
    Promise,
    Runtime,
    UI,
    format,
    html
) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th');

    function renderTable() {
        return table({ class: 'table' }, [tr([th('Input'), th('Value')])]);
    }

    function factory() {
        let container,
            ui,
            params,
            paramsListener = null,
            jobId,
            runtime = Runtime.make(),
            isParentJob;

        function updateRowStatus(ui, params, container) {
            if (isParentJob) {
                if (params && params.batch_params && params.batch_params.length) {
                    container.innerHTML =
                        'This batch job has ' +
                        params.batch_params.length +
                        ' child jobs. Please click one of those on the left for details';
                } else {
                    container.innerHTML = 'Please click one of the child jobs for details.';
                }
            }
            if (!params) {
                return;
            } else {
                Object.keys(params).forEach((key) => {
                    const selector = '[data-element-job-id="' + key + '"]';
                    let row = container.querySelector(selector);
                    if (row === null) {
                        row = document.createElement('tr');
                        row.setAttribute('data-element-job-id', key);
                        container.getElementsByTagName('tbody')[0].appendChild(row);
                    }
                    row.innerHTML = td(key) + td(params[key]);
                });
            }
        }

        function startParamsListener() {
            paramsListener = runtime.bus().listen({
                channel: {
                    jobId: jobId,
                },
                key: {
                    type: 'job-info',
                },
                handle: (message) => {
                    updateRowStatus(ui, message.jobInfo.job_params[0], container);
                },
            });
        }

        function start(arg) {
            return Promise.try(() => {
                if (container) {
                    // delete existing stuff.
                    detach();
                }
                container = arg.node;
                container.classList.add('batch-input-panel');
                jobId = arg.jobId;
                ui = UI.make({ node: container });
                container.innerHTML = renderTable();
                isParentJob = arg.isParentJob;

                startParamsListener();
                runtime.bus().emit('request-job-info', {
                    jobId: jobId,
                    parentJobId: arg.parentJobId,
                });
                params = arg.params;
                updateRowStatus(ui, params, container);
            });
        }

        function stop() {
            if (paramsListener) {
                runtime.bus().removeListener(paramsListener);
            }
            paramsListener = null;
        }

        function detach() {
            stop();
            container.innerHTML = '';
        }

        return {
            start: start,
            stop: stop,
            detach: detach,
        };
    }

    return {
        make: function () {
            return factory();
        },
    };
});
