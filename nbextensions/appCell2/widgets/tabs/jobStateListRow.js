define([
    'bluebird',
    'common/ui',
    'kb_common/html'
], function(
    Promise,
    UI,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        td = t('td'),
        th = t('th'),
        span = t('span');

    function niceState(jobState) {
        var label, icon, color;
        switch (jobState) {
        case 'completed':
            label = 'success';
            icon = 'fa fa-check';
            color = 'green';
            break;
        case 'queued':
            label = jobState;
            icon = 'fa fa-angle-double-right';
            color = 'green';
            break;
        case 'in-progress':
            label = jobState;
            icon = 'fa fa-spinner';
            color = 'green';
            break;
        case 'suspend':
            label = 'suspended';
            icon = 'fa fa-pause';
            color = 'red';
            break;
        case 'error':
            label = jobState;
            icon = 'fa fa-times';
            color = 'red';
            break;
        case 'canceled':
            label = jobState;
            icon = 'fa fa-times';
            color = 'orange';
            break;
        case 'does_not_exist':
            label = 'does not exist';
            icon = 'fa fa-question';
            color = 'orange';
            break;
        default:
            label = jobState;
            icon = 'fa fa-question';
            color = 'black';
        }

        return td({
            style: {
                color: color,
                fontWeight: 'bold'
            },
        }, [
            span({
                class: icon
            }),
            ' ' + label
        ]);
    }

    function factory() {
        var container,
            ui,
            name,
            jobId,
            clickFunction,
            isParentJob;

        function updateRowStatus(jobStatus) {
            jobStatus = jobStatus ? jobStatus : 'Job still pending.';
            var jobIdDiv = '';
            if (jobId) {
                jobIdDiv = div({'style': 'font-size:8pt; color:gray'}, [jobId]);
            }
            container.innerHTML = th({}, [div(isParentJob ? name.toUpperCase() : name), jobIdDiv]) + niceState(jobStatus);
        }

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;               // this is the row (tr) that this renders
                container.onclick = () => {
                    if (jobId) {
                        clickFunction(container, jobId, isParentJob);
                    }
                };
                ui = UI.make({ node: container });

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
            let status = newState.job_state ? newState.job_state : null;
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