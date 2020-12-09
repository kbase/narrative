define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'kb_common/html',
    './jobStateListRow'
], function(
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
        icon = t('icon'),
        button = t('button'),
        cssBaseClass = 'kb-job-state',
        selectedJobCssClass = 'job-selected';

    let jobsIndexStart,
        jobsIndexEnd,
        totalJobsCount;



    function renderTable() {
        jobsIndexStart = 1;
        jobsIndexEnd = 7;
        totalJobsCount = 7;

        return [
            table({
                class: `table ${cssBaseClass}__table`
            }, [
                thead({
                    class: `${cssBaseClass}__table_head`,
                },
                [
                    tr({
                        class: `${cssBaseClass}__table_head_row`,
                    },
                    [
                        th({
                            class: `${cssBaseClass}__table_head_cell--object`
                        }, [
                            'Object',
                            icon({
                                class: 'fa fa-sort'
                            })
                        ]),
                        th({
                            class: `${cssBaseClass}__table_head_cell--status`
                        }, [
                            'Status',
                            icon({
                                class: 'fa fa-sort'
                            })
                        ]),
                        th({
                            class: `${cssBaseClass}__table_head_cell--log-view`
                        }, [
                            'Cancel/Retry All',
                            icon({
                                class: 'fa fa-caret-down kb-pointer'
                            })
                        ]),
                    ])
                ]),
                tbody({
                    class: `${cssBaseClass}__table_body`,
                })
            ]),
            div({}[
                span({
                    class: `${cssBaseClass}__table_footer`,
                },[
                    `Showing ${jobsIndexStart} to ${jobsIndexEnd} `,
                    icon({
                        class: 'fa fa-caret-down kb-pointer'
                    }),
                    ` of ${totalJobsCount} entries`,

                ]),
                span({
                    class: `${cssBaseClass}__table_footer`,
                },[
                    button({}[
                        'Previous'
                    ]),
                    button({}[
                        '1'
                    ]),
                    button({}[
                        'Next'
                    ]),
                ])
            ])
        ].join('');
    }

    function factory(config) {
        let runtime = Runtime.make(),
            model = config.model,
            widgets = {},
            container,
            parentJobId,
            parentListener;

        function createTableRow(id) {
            let jobTable = container.getElementsByTagName('tbody')[0],
                newRow = document.createElement('tr');
            newRow.setAttribute('data-element-job-id', id);
            newRow.classList.add('job-info');
            newRow.classList.add(`${cssBaseClass}__row`);
            jobTable.appendChild(newRow);
            return newRow;
        }

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                container.classList.add(`${cssBaseClass}__container`);
                container.classList.add('batch-mode-list');
                UI.make({ node: container });
                container.innerHTML = renderTable();
                parentJobId = arg.parentJobId;

                return Promise.try(() => {
                    createJobStateWidget('parent', parentJobId, model.getItem('exec.jobState.status'), arg.clickFunction, true);
                    container.getElementsByTagName('tr')[0].classList.add(selectedJobCssClass); // start with the parent selected

                    for (let i=0; i<Math.max(arg.batchSize, arg.childJobs.length); i++) {
                        let jobId = null,
                            initialState = null;
                        if (i < arg.childJobs.length) {
                            jobId = arg.childJobs[i].job_id;
                            initialState = arg.childJobs[i].status;
                        }
                        createJobStateWidget(i, jobId, initialState, arg.clickFunction);  // can make null ones. these need to be updated.
                    }
                })
                    .then(() => { startParentListener(); });
            });
        }

        function startParentListener() {
            parentListener = runtime.bus().listen({
                channel: {
                    jobId: parentJobId
                },
                key: {
                    type: 'job-status'
                },
                handle: handleJobStatusUpdate
            });
        }

        /**
         * Pass the job state to all row widgets, if it exists.
         * @param {Object} message
         */
        function handleJobStatusUpdate(message) {
            if (message.jobState.batch_size && message.jobState.child_jobs.length === 0) {
                if (message.jobState.job_output.result[0].batch_results) {
                    message.jobState.child_jobs = Object.keys(message.jobState.job_output.result[0].batch_results)
                        .map((item) => {
                            return message.jobState.job_output.result[0].batch_results[item].final_job_state;
                        });
                }
            }

            if (message.jobState.child_jobs) {
                message.jobState.child_jobs.forEach((state, idx) => {
                    widgets[idx].updateState(state);
                });
            }
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
        function createJobStateWidget(jobIndex, jobId, initialState, clickFunction, isParentJob) {
            widgets[jobIndex] = JobStateListRow.make({
                model: model
            });
            widgets[jobIndex].start({
                node: createTableRow(jobIndex),
                name: isParentJob ? 'Parent Job' : 'Child Job ' + (jobIndex+1),
                jobId: jobId,
                initialState: initialState,
                isParentJob: isParentJob ? true : false,
                clickFunction: function(jobRow, _jobId, _isParentJob) {
                    Array.from(container.getElementsByClassName(selectedJobCssClass)).forEach((elem) => {
                        elem.classList.remove(selectedJobCssClass);
                    });
                    if (_jobId) {
                        jobRow.classList.add(selectedJobCssClass);
                        clickFunction({
                            jobId: _jobId,
                            isParentJob: _isParentJob,
                            jobIndex: jobIndex
                        });
                    }
                }
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
