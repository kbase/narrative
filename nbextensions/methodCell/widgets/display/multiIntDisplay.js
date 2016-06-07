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
        div = t('div'), span = t('span');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            container,
            bus = config.bus,
            model;

        // Validate configuration.
        // Nothing to do...

        options.required = spec.required();

        function render() {
            var values = model.getItem('values'), displayValue;
            if (values === null) {
                displayValue = span({style: {fontStyle: 'italic', color: 'orange'}}, 'NA');
            } else {
                displayValue = values.map(function (value) {                    
                    return span({style: {fontFamily: 'monospace', fontWeight: 'bold', color: 'gray'}}, String(value));
                }).join(', ');
            }
            container.innerHTML = div({class: 'form-control-static'}, displayValue);
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    container = message.node;
                    bus.emit('sync');
                });
                bus.on('update', function (message) {
                    model.setItem('values', message.value);
                });
                
            });
        }
        
        model = Props.make({
            onUpdate: function (props) {
                render();
            }
        });

        return {
            start: start
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});