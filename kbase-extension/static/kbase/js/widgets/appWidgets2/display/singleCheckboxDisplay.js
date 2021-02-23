define([
    'bluebird',
    'kb_common/html',
    'common/props',
    'bootstrap',
    'css!font-awesome'
], (Promise, html, Props) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div');

    function factory(config) {
        let options = {},
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
            return Promise.try(() => {
                container = node;
            });
        }

        function start() {
            return Promise.try(() => {
                bus.on('update', (message) => {
                    model.setItem('value', message.value);
                });
                bus.emit('sync');
            });
        }

        function run(params) {
            return Promise.try(() => {
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
