/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'kb_common/html',
    'common/ui',
    'util/jobLogViewer',
    './jobStateViewer'
], function (
    Promise,
    html,
    UI,
    LogViewer,
    JobStateViewer
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function loadLogViewer(args) {
        return new Promise(function (resolve, reject) {
            var logViewer = LogViewer.make();
            logViewer.start()
                .then(function () {
                    logViewer.bus.emit('run', {
                        node: args.node,
                        jobId: args.jobId
                    });
                    resolve(logViewer);
                })
                .catch(function (err) {
                    reject(err);
                });
        });
    }

    function factory(config) {
        // The node donated by the caller.
        var hostNode;

        // The top level node used by this widget.
        var container;
            
        // The handy UI module interface to this container.
        var ui;
            
        // A cheap widget collection.
        var widgets = {};

        // The data model from the app cell.
        var model = config.model;

        function layout() {
            return div({}, [
                ui.buildPanel({
                    title: 'Job Status',
                    name: 'jobState',
                    classes: [
                        'kb-panel-light'
                    ]
                }),
                ui.buildPanel({
                    title: 'Job Log',
                    name: 'log',
                    classes: [
                        'kb-panel-light'
                    ]
                })
            ]);
        }

        function start(arg) {
            return Promise.try(function () {
                hostNode = arg.node;
                container = arg.node.appendChild(document.createElement('div'));
                ui = UI.make({
                    node: container
                });
                container.innerHTML = layout();
                widgets.log = LogViewer.make();
                widgets.jobState = JobStateViewer.make({
                    model: model
                });
                return Promise.all([
                    widgets.log.start({
                        node: ui.getElement('log.body'),
                        jobId: model.getItem('exec.jobState.job_id')
                    }),
                    widgets.jobState.start({
                        node: ui.getElement('jobState.body'),
                        jobId: model.getItem('exec.jobState.job_id')
                    })
                ]);
            });
        }

        function stop() {
            return Promise.try(function () {
                if (widgets) {
                    return Promise.all(Object.keys(widgets).map(function (key) {
                        return widgets[key].stop();
                    }));
                }
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});