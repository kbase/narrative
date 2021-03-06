define([], () => {
    'use strict';

    function factory(config) {
        function attach(node) {
            node.innerHTML = 'Undefined widget';
        }

        return {
            attach: attach,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
