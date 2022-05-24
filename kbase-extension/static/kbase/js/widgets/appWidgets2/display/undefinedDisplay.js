define(['bluebird', 'common/html', 'bootstrap'], (Promise, html) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div');

    function factory(config) {
        const options = {},
            spec = config.parameterSpec,
            model = {
                value: undefined,
            };

        let container;
        // Validate configuration.
        // Nothing to do...

        options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
        options.multiple = spec.multipleItems();
        options.required = spec.required();
        options.enabled = true;

        function render() {
            return {
                content: div('undefined display widget'),
            };
        }

        // LIFECYCLE API

        function init() {}

        function attach(node) {
            return Promise.try(() => {
                container = node.appendChild(document.createElement('div'));
            });
        }

        function start() {
            return Promise.try(() => {
                //
            });
        }

        function run(params) {
            return Promise.try(() => {
                model.value = params.value;
                const result = render();
                container.innerHTML = result.content;
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
