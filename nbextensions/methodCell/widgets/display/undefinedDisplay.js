/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    'bootstrap',
    'css!font-awesome'
], function (Promise, html) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            container,
            bus = config.bus,
            model = {
                value: undefined
            };

        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;

        function render() {
            return {
                content: div('undefined display widget')
            };
        }

        // LIFECYCLE API

        function init() {
        }

        function attach(node) {
            return Promise.try(function () {
                parent = node;
                container = node.appendChild(document.createElement('div'));

            });
        }

        function start() {
            return Promise.try(function () {
//                bus.on('update', function (message) {
//                    model.value = message.value;
//                });
//                bus.send({type: 'sync'});
//                return null;
            });
        }

        function run(params) {
            return Promise.try(function () {
                model.value = params.value;
                var result = render();
                container.innerHTML = result.content;
            });
        }

        return {
            init: init,
            attach: attach,
            start: start,
            run: run
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});