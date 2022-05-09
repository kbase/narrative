define(['bluebird', './resultsViewer'], (Promise, JobResult) => {
    'use strict';

    function factory(config) {
        let container, resultsViewer;
        const { model, jobManager } = config;

        function start(arg) {
            container = arg.node;
            const jobState = jobManager.getJob();

            return Promise.try(() => {
                resultsViewer = JobResult.make({ model });
                return resultsViewer.start({
                    node: container,
                    jobId: jobState.job_id,
                    jobState,
                    isParentJob: true,
                });
            });
        }

        function stop() {
            const stopProms = [];
            if (resultsViewer) {
                stopProms.push(resultsViewer.stop());
            }
            return Promise.all(stopProms);
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
