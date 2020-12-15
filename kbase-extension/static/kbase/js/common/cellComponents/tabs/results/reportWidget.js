define(['bluebird', 'jquery', 'common/html', 'common/ui', 'common/events'], function (
    Promise,
    $,
    html,
    UI,
    Events
) {
    'use strict';

    let tag = html.tag,
        div = tag('div');

    function ReportWidget() {
        let container, ui;

        function renderReport(data) {
            return new Promise((resolve) => {
                console.log('ready to render report with data: ', data);
                resolve(true);
            });
        }

        function renderLayout() {
            const events = Events.make();

            const content = ui.buildCollapsiblePanel({
                title: 'Report',
                name: 'report-section-toggle',
                hidden: false,
                type: 'default',
                classes: ['kb-panel-container'],
                body: div,
            });

            const reportContainer = div({ dataElement: 'report-widget' }, [content]);
            const reportPanel = div({ dataElement: 'html-panel' }, [reportContainer]);

            return {
                content: reportPanel,
                events: events,
            };
        }

        function doAttach(node) {
            container = node;
            ui = UI.make({
                node: container,
            });

            let layout = renderLayout();

            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
        }

        function start(arg) {
            // send parent the ready message
            doAttach(arg.node);

            return renderReport(arg.data).catch(function (err) {
                // do somethig with the error.
                console.error('ERROR in start', err);
            });
        }

        function stop() {
            return Promise.try(() => {
                container.innerHTML = '';
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: ReportWidget,
    };
});
