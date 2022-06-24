/* This is a special widget, because it is a factory factory! */

define(['common/html', 'bootstrap'], (html) => {
    'use strict';
    const t = html.tag,
        div = t('div'),
        span = t('span');

    function factoryFactory(factoryConfig) {
        function factory() {
            function attach(node) {
                node.innerHTML = div(
                    {
                        class: 'alert alert-danger',
                        role: 'alert',
                    },
                    [span({ style: { fontWeight: 'bold' } }, 'Error! '), factoryConfig.message]
                );
            }

            return {
                attach: attach,
            };
        }
        return {
            make: function () {
                return factory();
            },
        };
    }

    return {
        make: function (config) {
            return factoryFactory(config);
        },
    };
});
