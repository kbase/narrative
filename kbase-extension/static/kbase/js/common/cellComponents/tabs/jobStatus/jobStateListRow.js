define([
    'bluebird',
    'kb_common/html',
    'common/events',
    'jquery'
], function(
    Promise,
    html,
    Events,
    $
) {
    'use strict';

    var container;

    const t = html.tag,
        div = t('div'),
        td = t('td'),
        span = t('span'),
        a = t('a'),
        i = t('i'),
        cssBaseClass = 'kb-job-status',
        events = Events.make();

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

    function selectRow(e) {
        $('.kb-job-status__row').removeClass('active');
        $(e.target).closest('tr').addClass('active');
    }

    function unselectRow(e) {
        $(e.target).closest('tr').addClass('active');
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
                class: `${cssBaseClass}__cell_log_btn show_log`,
                role: 'button',
                id: events.addEvent({
                    type: 'click',
                    handler: function (e) {
                        selectRow(e);
                    },
                })
            }, [
                'Show log'
            ]),
            a({
                class: `${cssBaseClass}__cell_log_btn selected_log`,
                role: 'button',
                id: events.addEvent({
                    type: 'click',
                    handler: function (e) {
                        unselectRow(e);
                    },
                })
            }, [
                'Showing log',
                i({
                    class: `fa fa-caret-right kb-pointer ${cssBaseClass}__icon`
                })
            ]),
        ]);
    }

    function factory() {

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
                events.attachEvents(container);
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
