define(['bluebird', 'kb_common/html'], (Promise, html) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        td = t('td'),
        th = t('th'),
        span = t('span');

    function niceState(jobState) {
        let label, icon, color;
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
            case 'running':
                label = jobState;
                icon = 'fa fa-spinner';
                color = 'green';
                break;
            case 'error':
                label = jobState;
                icon = 'fa fa-times';
                color = 'red';
                break;
            case 'terminated':
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

        return td(
            {
                style: {
                    color: color,
                    fontWeight: 'bold',
                },
            },
            [
                span({
                    class: icon,
                }),
                ' ' + label,
            ]
        );
    }

    function factory() {
        let container, name, jobId, clickFunction, isParentJob;

        function updateRowStatus(jobStatus) {
            jobStatus = jobStatus ? jobStatus : 'Job still pending.';
            const jobIdDiv = '';
            container.innerHTML =
                th({}, [div(isParentJob ? name.toUpperCase() : name), jobIdDiv]) +
                niceState(jobStatus);
        }

        function start(arg) {
            return Promise.try(() => {
                container = arg.node; // this is the row (tr) that this renders
                container.onclick = () => {
                    if (jobId) {
                        clickFunction(container, jobId, isParentJob);
                    }
                };

                jobId = arg.jobId; // id of child job
                name = arg.name;
                isParentJob = arg.isParentJob;
                clickFunction = arg.clickFunction; // called on click (after some ui junk)
                updateRowStatus(arg.initialState);
            });
        }

        function stop() {}

        function updateState(newState) {
            if (!jobId) {
                jobId = newState.job_id;
            }
            const status = newState.status ? newState.status : null;
            updateRowStatus(status);
        }

        return {
            start: start,
            stop: stop,
            updateState: updateState,
        };
    }

    return {
        make: function () {
            return factory();
        },
    };
});
