define([
    'bluebird',
    'common/runtime',
    'common/ui',
    'common/format',
    'kb_common/html',
    './jobStateListRow'
], function(
    Promise,
    Runtime,
    UI,
    format,
    html,
    JobStateListRow
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        th = t('th'),
        tbody = t('tbody');


    function renderTable() {
        return table({class: 'table'}, [
            tbody()
        ]);
    }

    function factory(config) {
        var container, ui, listeners = [],
            runtime = Runtime.make(),
            widgets = {},
            model = config.model,
            parentJobId,
            parentListener;

        function createTableRow(id) {
            var table = container.getElementsByTagName('tbody')[0];
            var newRow = document.createElement('tr');
            newRow.setAttribute('data-element-job-id', id);
            newRow.classList.add('job-info');
            table.appendChild(newRow);
            return newRow;
        }

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                container.classList.add('batch-mode-list');
                ui = UI.make({ node: container });
                container.innerHTML = renderTable();
                parentJobId = arg.parentJobId;

                return Promise.try(() => {
                    createJobStateWidget('parent', parentJobId, model.getItem('exec.jobState.job_state'), arg.clickFunction, true);
                    container.getElementsByTagName('tr')[0].classList.add('job-selected'); // start with the parent selected

                    for (var i=0; i<Math.max(arg.batchSize, arg.childJobs.length); i++) {
                        var jobId = null,
                            initialState = null;
                        if (i < arg.childJobs.length) {
                            jobId = arg.childJobs[i].job_id;
                            initialState = arg.childJobs[i].job_state;
                        }
                        createJobStateWidget(i, jobId, initialState, arg.clickFunction);  // can make null ones. these need to be updated.
                    }
                })
                .then(() => { startParentListener() });
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
         * Each job state widget knows which child job index it's in, so it can look up its
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
                clickFunction: function(jobRow, jobId, isParentJob) {
                    Array.from(container.getElementsByTagName('tr')).forEach((elem) => {
                        elem.classList.remove('job-selected');
                    });
                    if (jobId) {
                        jobRow.classList.add('job-selected');
                        clickFunction({
                            jobId: jobId,
                            isParentJob: isParentJob,
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