define([], function () {
    'use strict';

    function factory() {
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
