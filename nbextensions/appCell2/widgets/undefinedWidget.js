define([], () => {
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
        make: function () {
            return factory();
        },
    };
});
