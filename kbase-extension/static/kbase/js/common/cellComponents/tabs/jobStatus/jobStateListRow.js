define([
    'bluebird',
    'kb_common/html'
], function(
    Promise,
    html
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        td = t('td'),
        span = t('span'),
        cssBaseClass = 'kb-job-state';

    function createStateCell(jobState) {
        let label;
        switch (jobState) {
            case 'completed':
                label = 'Success';
                break;
            case 'created':
            case 'estimating':
            case 'queued':
                label = 'Queued';
                break;
            case 'running':
                label = 'Running';
                break;
            case 'error':
                label = 'Failed';
                break;
            case 'terminated':
                label = 'Cancelled';
                break;
            case 'does_not_exist':
                label = 'Does not exist';
                break;
        }

        return td({}, [
            span({
                class: `fa fa-circle ${cssBaseClass}__icon--${jobState}`
            }),
            ' ' + label
        ]);
    }

    function createLogLinkCell(jobState) {
        return td({}, [
            span({
                class: `${cssBaseClass}__log_link--${jobState}`
            }, [
                'Show log'
            ])
        ]);
    }

    function factory() {
        var container,
            name,
            jobId,
            clickFunction,
            isParentJob;

        function updateRowStatus(jobStatus) {
            jobStatus = jobStatus ? jobStatus : 'Job still pending.';
            var jobIdDiv = '';
            container.innerHTML = td({
                class: `${cssBaseClass}__cell--object`,
            }, [
                div(
                    isParentJob ? name.toUpperCase() : name
                ),
                jobIdDiv
            ])
            + createStateCell(jobStatus)
            + createLogLinkCell(jobStatus);
        }

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;               // this is the row (tr) that this renders
                container.onclick = () => {
                    if (jobId) {
                        clickFunction(container, jobId, isParentJob);
                    }
                };

                jobId = arg.jobId;                  // id of child job
                name = arg.name;
                isParentJob = arg.isParentJob;
                clickFunction = arg.clickFunction;  // called on click (after some ui junk)
                updateRowStatus(arg.initialState);
            });
        }

        function stop() {
        }

        function updateState(newState) {
            if (!jobId) {
                jobId = newState.job_id;
            }
            let status = newState.status ? newState.status : null;
            updateRowStatus(status);
        }

        return {
            start: start,
            stop: stop,
            updateState: updateState
        };
    }

    return {
        make: function() {
            return factory();
        }
    };

});
