/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    '../../props',
    'bootstrap',
    'css!font-awesome'
], function (Promise, html, Props) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            container,
            bus = config.bus,
            model;

        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;

        function render() {
            container.innerHTML = div(String(model.getItem('value')));
        }

        // LIFECYCLE API

        function init() {
        }

        function attach(node) {
            return Promise.try(function () {
                container = node;
            });
        }

        function start() {
            return Promise.try(function () {
                bus.on('update', function (message) {
                    model.setItem('value', message.value);
                });
                bus.emit('sync');
            });
        }

        function run(params) {
            return Promise.try(function () {
//                model.value = params.value;
//                var result = render();
//                container.innerHTML = result.content;
            });
        }
        
        model = Props.make({
            onUpdate: function (props) {
                render();
            }
        });

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