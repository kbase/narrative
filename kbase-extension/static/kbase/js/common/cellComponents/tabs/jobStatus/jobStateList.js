define([
    'jquery',
    'bluebird',
    'common/ui',
    'kb_common/html',
    './jobStateListRow',
    'jquery-dataTables'
], function(
    $,
    Promise,
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
        i = t('i'),
        cssBaseClass = 'kb-job-status';

    function createTable() {
        return table({
            class: `${cssBaseClass}__table container`
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
                        class: `${cssBaseClass}__table_head_cell col-sm-5`
                    }, [
                        'Object'
                    ]),
                    th({
                        class: `${cssBaseClass}__table_head_cell col-sm-2`
                    }, [
                        'Status'
                    ]),
                    th({
                        class: `${cssBaseClass}__table_head_cell col-sm-5`
                    }, [
                        'CANCEL/RETRY ALL',
                        i({
                            class: `fa fa-caret-down kb-pointer ${cssBaseClass}__icon`
                        }),
                    ]),
                ])
            ]),
            tbody({
                class: `${cssBaseClass}__table_body`,
            })

        ]);
    }

    // Convert the table to a datatable object to get functionality
    function renderTable(container, numberOfChildJobs){
        container.find('table').dataTable({
            searching: false,
            pageLength: 50,
            lengthChange: false,
            columnDefs: [{
                targets: 2,
                orderable: false

            }],
            fnDrawCallback: function() {
                // Hide pagination controls if length is less than 51
                if (numberOfChildJobs < 51) {
                    $('.dataTables_paginate').hide();
                }
            }
        });

    }

    function factory(config) {
        let model = config.model,
            widgets = {},
            container;

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

                let numberOfChildJobs = arg.childJobs.length;

                return Promise.try(() => {
                    arg.childJobs.forEach((childJob, index) => {
                        createJobStateWidget(index, childJob.job_id, childJob.status);
                    });
                }).then(() => {
                    renderTable(container, numberOfChildJobs);
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
            return Promise.try(() => {
                widgets[jobIndex] = JobStateListRow.make({
                    model: model
                });

                widgets[jobIndex].start({
                    node: createTableRow(jobIndex),
                    jobId: jobId,
                    initialState: initialState,
                    // This should be taken from child job info for the params....
                    name: 'Brca1Reads.fastq_reads_' + jobIndex,
                });
            }).catch((err) => {
                throw new Error('Unable to create job state widget: ', err);
            });

        }

        function stop() {
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
