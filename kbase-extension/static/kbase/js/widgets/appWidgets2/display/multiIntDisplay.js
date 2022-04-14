define(['bluebird', 'common/html', 'common/props', 'bootstrap'], (Promise, html, Props) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        span = t('span');

    function factory(config) {
        let container;

        const options = {},
            spec = config.parameterSpec,
            bus = config.bus,
            model = Props.make({
                onUpdate: function () {
                    render();
                },
            });

        // Validate configuration.
        // Nothing to do...

        options.required = spec.required();

        function render() {
            const values = model.getItem('values');
            let displayValue;
            if (values === null) {
                displayValue = span({ style: { fontStyle: 'italic', color: 'orange' } }, 'NA');
            } else {
                displayValue = values
                    .map((value) => {
                        return span(
                            {
                                style: {
                                    fontFamily: 'monospace',
                                    fontWeight: 'bold',
                                    color: 'gray',
                                },
                            },
                            String(value)
                        );
                    })
                    .join(', ');
            }
            container.innerHTML = div({ class: 'form-control-static' }, displayValue);
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    container = message.node;
                    bus.emit('sync');
                });
                bus.on('update', (message) => {
                    model.setItem('values', message.value);
                });
            });
        }

        return {
            start: start,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
