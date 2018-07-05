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
        th = t('th');


    function renderTable() {
        return table({class: 'table'}, [
            tr([
                th('Job Id'),
                th('Status')
            ])
        ]);
    }

    function factory(config) {
        var container, ui, listeners = [],
            runtime = Runtime.make(),
            widgets = {},
            model = config.model,
            parentJobId,
            parentListener,
            allocatedJobWidgets = 0;

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                ui = UI.make({ node: container });
                container.innerHTML = renderTable();
                parentJobId = arg.parentJobId;

                arg.childJobs.forEach((job) => {
                    var jobId = job.job_id;
                    widgets[jobId] = JobStateListRow.make({
                        model: model
                    });
                });
                return Promise.try(() => {
                    for (var i=0; i<arg.batchSize; i++) {
                        var jobId = null;
                        if (i < arg.childJobs.length) {
                            jobId = arg.childJobs[i].job_id;
                        }
                        createJobStateWidget(i, jobId, arg.clickFunction);  // can make null ones. these need to be updated.
                    }
                    // Object.keys(widgets).forEach((jobId) => {
                    //     widgets[jobId].start({
                    //         node: container.getElementsByTagName('tbody')[0],
                    //         jobId: jobId,
                    //         parentJobId: parentJobId,
                    //         clickFunction: function(jobRow, jobId) {
                    //             // clear all 'selected' from all rows.
                    //             console.log(container.getElementsByTagName('tr'));
                    //             Array.from(container.getElementsByTagName('tr')).forEach((elem) => {
                    //                 console.log(elem);
                    //                 elem.classList.remove('job-selected');
                    //             });
                    //             // // add 'selected' to the clicked one.
                    //             jobRow.classList.add('job-selected');
                    //             arg.clickFunction(jobId);
                    //         }
                    //     });
                    // })
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

        function handleJobStatusUpdate(message) {
            if (message.jobState.child_jobs) {
                var numChildren = message.jobState.child_jobs.length;
                var diffChildren = numChildren - widgets.length;
                if (diffChildren > 0) {
                    for (var i = widgets.length; i < widgets.length + numChildren; i++) {
                        createJobStateWidget(i, message.jobState.child_jobs[i].job_id);
                    }
                }
            }
        }

        /**
         * Creates a job state widget and puts it in the widgets object, keyed by the index.
         * This assumes that all child job states will always be returned in the same order
         * on each state lookup, with new ones added to the end of the list.
         * Each job state widget knows which child job index its in, so it can look up its
         * state as well.
         * @param {int} jobNumber
         * @param {string} jobId
         */
        function createJobStateWidget(jobNumber, jobId, clickFunction) {
            widgets[jobNumber] = JobStateListRow.make({
                model: model
            });
            widgets[jobNumber].start({
                node: container.getElementsByTagName('tbody')[0],
                jobNumber: jobNumber,
                jobId: jobId,
                parentJobId: parentJobId,
                clickFunction: function(jobRow, jobId) {
                    Array.from(container.getElementsByTagName('tr')).forEach((elem) => {
                        elem.classList.remove('job-selected');
                    });
                    if (jobId) {
                        jobRow.classList.add('job-selected');
                        clickFunction(jobId);
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