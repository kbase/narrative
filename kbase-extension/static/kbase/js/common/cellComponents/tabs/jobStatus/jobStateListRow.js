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
        button = t('button'),
        a = t('a'),
        cssBaseClass = 'kb-job-status';

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

        return td({
            class: `${cssBaseClass}__cell`
        }, [
            span({
                class: `fa fa-circle ${cssBaseClass}__icon--${jobState}`
            }),
            ' ' + label
        ]);
    }

    function createActionCell(jobState){
        let label;
        switch (jobState) {
            case 'completed':
                label = 'Go to Results';
                break;
            case 'created':
            case 'estimating':
            case 'queued':
            case 'running':
                label = 'Cancel';
                break;
            case 'error':
            case 'does_not_exist':
            case 'terminated':
                label = 'Retry';
                break;
        }

        return td({
            class: `${cssBaseClass}__cell_container`
        }, [
            a({
                class: `${cssBaseClass}__cell_action--${jobState}`
            }, [
                label
            ]),
            a({
                class: `${cssBaseClass}__cell_log_btn`,
                role: 'button'
            }, [
                'Show log'
            ])
        ]);
    }

    function factory() {
        var container;

        function updateRowStatus(jobStatus, name) {
            var jobIdDiv = '';
            container.innerHTML = td({
                class: `${cssBaseClass}__cell`
            }, [
                div(
                    name
                ),
                jobIdDiv
            ])
            + createStateCell(jobStatus)
            + createActionCell(jobStatus);
        }

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                updateRowStatus(arg.initialState, arg.name);
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
        make: function() {
            return factory();
        }
    };

});
