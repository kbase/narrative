define(['bluebird', 'common/html', 'common/props', 'bootstrap'], (Promise, html, Props) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        span = t('span');

    function factory(config) {
        const options = {},
            spec = config.parameterSpec,
            bus = config.bus,
            model = Props.make({
                onUpdate: function () {
                    render();
                },
            });
        let container;
        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;

        function render() {
            const value = model.getItem('value');
            let displayValue;
            if (value === null || value.length === 0) {
                displayValue = span({ style: { fontStyle: 'italic', color: 'orange' } }, 'NA');
            } else {
                displayValue = span(value);
            }
            container.innerHTML = div({ class: 'form-control-static' }, displayValue);
        }

        // LIFECYCLE API

        function init() {}

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

        function run() {
            return Promise.try(() => {
                //
            });
        }

        return {
            init: init,
            attach: attach,
            start: start,
            run: run,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
