define(['bluebird', 'kb_common/html', 'common/events', 'jquery'], (Promise, html, Events, $) => {
    'use strict';

    let container;

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

        return td(
            {
                class: `${cssBaseClass}__cell`,
            },
            [
                span({
                    class: `fa fa-circle ${cssBaseClass}__icon--${jobState}`,
                }),
                ' ' + label,
            ]
        );
    }

    function selectRow(e) {
        const $currentRow = $(e.target).closest('tr');

        const $allRows = $('.kb-job-status__row');

        if ($currentRow.hasClass(`${cssBaseClass}__row_selected`)) {
            $currentRow.removeClass(`${cssBaseClass}__row_selected`);
            $currentRow.find('.selected_log').css('display', 'none');
        } else {
            // unselect previously selected row
            $allRows.removeClass(`${cssBaseClass}__row_selected`);
            $allRows.find('.selected_log').css('display', 'none');

            // add clasees to selected row
            $currentRow.addClass(`${cssBaseClass}__row_selected`);
            $currentRow.find('.selected_log').css('display', 'inline');
        }
    }

    function createActionCell(jobState) {
        let label;
        switch (jobState) {
            case 'completed':
                label = 'GO TO RESULTS';
                break;
            case 'created':
            case 'estimating':
            case 'queued':
            case 'running':
                label = 'CANCEL';
                break;
            case 'error':
            case 'does_not_exist':
            case 'terminated':
                label = 'RETRY';
                break;
        }

        return td(
            {
                class: `${cssBaseClass}__cell_container`,
            },
            [
                span({}, [
                    a(
                        {
                            class: `${cssBaseClass}__cell_action--${jobState}`,
                        },
                        [label]
                    ),
                ]),
                span(
                    {
                        class: `${cssBaseClass}__cell_container_btn`,
                    },
                    [
                        a(
                            {
                                class: `${cssBaseClass}__cell_log_btn show_log`,
                                role: 'button',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function (e) {
                                        selectRow(e);
                                    },
                                }),
                            },
                            [
                                'Show log',
                                i({
                                    class: `fa fa-caret-right kb-pointer ${cssBaseClass}__icon`,
                                }),
                            ]
                        ),
                        a(
                            {
                                class: `${cssBaseClass}__cell_log_btn selected_log`,
                                role: 'button',
                                id: events.addEvent({
                                    type: 'click',
                                    handler: function (e) {
                                        selectRow(e);
                                    },
                                }),
                            },
                            [
                                'Showing log',
                                i({
                                    class: `fa fa-caret-right kb-pointer ${cssBaseClass}__icon`,
                                }),
                            ]
                        ),
                    ]
                ),
            ]
        );
    }

    function factory() {
        function updateRowStatus(jobStatus, name) {
            const jobIdDiv = '';
            container.innerHTML =
                td(
                    {
                        class: `${cssBaseClass}__cell`,
                    },
                    [div(name), jobIdDiv]
                ) +
                createStateCell(jobStatus) +
                createActionCell(jobStatus);
        }

        function start(arg) {
            return Promise.try(() => {
                container = arg.node;
                updateRowStatus(arg.initialState, arg.name);
                events.attachEvents(container);
            }).catch((err) => {
                throw new Error(`Unable to start Job State List Row widget: ${err}`);
            });
        }

        function stop() {}

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function () {
            return factory();
        },
    };
});
