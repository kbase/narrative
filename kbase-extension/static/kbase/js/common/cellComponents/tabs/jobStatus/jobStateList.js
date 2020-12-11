define([
    'jquery',
    'bluebird',
    'common/runtime',
    'common/ui',
    'kb_common/html',
    './jobStateListRow',
    'jquery-dataTables'
], function(
    $,
    Promise,
    Runtime,
    UI,
    html,
    JobStateListRow
) {
    'use strict';

    const t = html.tag,
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        div = t('div'),
        span = t('span'),
        i = t('i'),
        button = t('button'),
        cssBaseClass = 'kb-job-status';

    function createTable() {
        return table({
            class: `${cssBaseClass}__table`
        }, [
            thead({
                class: `${cssBaseClass}__table_head panel-heading`,
            },
            [
                tr({
                    class: `${cssBaseClass}__table_head_row`,
                },
                [
                    th({
                        class: `${cssBaseClass}__table_head_cell--object col-sm-6`
                    }, [
                        'Object'
                    ]),
                    th({
                        class: `${cssBaseClass}__table_head_cell--status col-sm-2`
                    }, [
                        'Status'
                    ]),
                    th({
                        class: `${cssBaseClass}__table_head_cell--log-view col-sm-4`
                    }, [
                        'Cancel/Retry All',
                        i({
                            class: `fa fa-caret-down kb-pointer ${cssBaseClass}__icon`
                        }),
                    ])
                ])
            ]),
            tbody({
                class: `${cssBaseClass}__table_body`,
            })

        ]);
    }

    function renderTable(container){
        container.find('table').dataTable({
            'searching': false,
            'pageLength': 50,
            'lengthChange': false
        });

    }

    function factory(config) {
        let runtime = Runtime.make(),
            model = config.model,
            widgets = {},
            container,
            parentListener;

        function createTableRow(id) {
            let jobTable = container.find('tbody')[0],
                newRow = document.createElement('tr');
            newRow.setAttribute('data-element-job-id', id);
            newRow.classList.add('job-info');
            newRow.classList.add(`${cssBaseClass}__row`);
            jobTable.appendChild(newRow);
            return newRow;
        }

        function start(arg) {
            return Promise.try(function() {
                container = $(arg.node);
                container.addClass([`${cssBaseClass}__container`, 'batch-mode-list']);
                UI.make({ node: container });
                container.append($(createTable()));

                return Promise.try(() => {
                    for (let i=0; i<Math.max(arg.batchSize, arg.childJobs.length); i++) {
                        let jobId = null,
                            initialState = null;
                        if (i < arg.childJobs.length) {
                            jobId = arg.childJobs[i].job_id;
                            initialState = arg.childJobs[i].status;
                        }
                        createJobStateWidget(i, jobId, initialState);  // can make null ones. these need to be updated.
                    }
                }).then(() => {
                    renderTable(container);
                });
            });
        }

        /**
         * Creates a job state widget and puts it in the widgets object, keyed by the index.
         * This assumes that all child job states will always be returned in the same order
         * on each state lookup, with new ones added to the end of the list. This also adds
         * to the bottom of the job state list table.
         *
         * Each job state widget knows which child job index its in, so it can look up its
         * state as well.
         * @param {int} jobIndex
         * @param {string} jobId
         */
        function createJobStateWidget(jobIndex, jobId, initialState) {
            widgets[jobIndex] = JobStateListRow.make({
                model: model
            });
            widgets[jobIndex].start({
                node: createTableRow(jobIndex),
                jobId: jobId,
                initialState: initialState,
                // This should be taken from child job info for the params....
                name: config.name + '_' + jobIndex,
            });
        }

        function stop() {
            return Promise.try(function() {
                runtime.bus().removeListener(parentListener);
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };

});
