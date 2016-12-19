/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'nbextensions/appCell2/widgets/jobLogViewer'
], function(Promise, LogViewer) {
    'use strict';

    function loadLogViewer(args) {
        return new Promise(function(resolve, reject) {
            var logViewer = LogViewer.make();
            logViewer.start()
                .then(function() {
                    logViewer.bus.emit('run', {
                        node: args.node,
                        jobId: args.jobId
                    });
                    resolve(logViewer);
                })
                .catch(function(err) {
                    reject(err);
                });
        });
    }

    function factory(config) {
        var container, widget, model = config.model;

        function start(arg) {
            return Promise.try(function() {
                container = arg.node;
                return loadLogViewer({
                        node: container,
                        jobId: model.getItem('exec.jobState.job_id')
                    })
                    .then(function(w) {
                        widget = w;
                    });
            });
        }

        function stop() {
            return Promise.try(function() {
                if (widget) {
                    return widget.stop();
                }
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});