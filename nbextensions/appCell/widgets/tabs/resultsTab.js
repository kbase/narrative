/*global define*/
/*jslint white:true,browser:true,nomen:true*/

define([
    'bluebird',
    'common/ui'
], function (Promise, UI) {
    'use strict';

    function factory(config) {
        var container, model = config.model, ui;
        function start(arg) {
            return Promise.try(function () {
                container = arg.node;
                ui = UI.make({node: container});

                // Very simple for now, just render the results json in a prettier than normal fashion.
                var result = model.getItem('exec.jobState.result');

                container.innerHTML = ui.buildPresentableJson(result);
            });
        }

        function stop() {
            return Promise.try(function () {
                container.innerHTML = 'Bye from results';
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