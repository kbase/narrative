define(['bluebird', './resultsViewer'], (Promise, JobResult) => {
    'use strict';

    function factory(config) {
        let container,
            model = config.model,
            resultsViewer;

        function start(arg) {
            container = arg.node;
            if (arg.model) {
                model = arg.model;
            }

            const jobState = model.getItem('exec.jobState');
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
