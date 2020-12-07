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
        let label, icon;
        switch (jobState) {
            case 'completed':
                label = 'success';
                icon = 'fa fa-check';
                break;
            case 'created':
            case 'queued':
                label = jobState;
                icon = 'fa fa-angle-double-right';
                break;
            case 'running':
                label = jobState;
                icon = 'fa fa-spinner';
                break;
            case 'error':
            case 'terminated':
                label = jobState;
                icon = 'fa fa-times';
                break;
            case 'does_not_exist':
                label = 'does not exist';
                icon = 'fa fa-question';
                break;
            case 'estimating':
            default:
                label = jobState;
                icon = 'fa fa-question';
        }

        return td({
            class: `${cssBaseClass}__cell--status`,
        }, [
            span({
                class: `${icon} ${cssBaseClass}__icon--${jobState}`
            }),
            ' ' + label
        ]);
    }

    function createActionCell(jobState) {
        let label;
        switch (jobState) {
            case 'completed':
                label = 'Go to results';
                break;
            case 'queued':
                label = 'Cancel';
                break;
            case 'running':
                label = 'Cancel';
                break;
            case 'error':
                label = 'Retry';
                break;
            case 'terminated':
                label = 'Retry';
                break;
            case 'does_not_exist':
                label = 'does not exist';
                break;
            default:
                label = jobState;
        }
        return td({
            class: `${cssBaseClass}__cell--action`,
        }, [
            label
        ]);
    }

    function createLogLinkCell(jobState) {
        return td({
            class: `${cssBaseClass}__cell--log-view`,
        }, [
            span({
                class: `${cssBaseClass}__log_link--${jobState}`
            }, [
                'View logs'
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
            + createActionCell(jobStatus)
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
