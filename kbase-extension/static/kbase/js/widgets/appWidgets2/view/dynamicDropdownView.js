define(['../input/dynamicDropdownInput'], (DynamicDropdown) => {
    'use strict';
    return {
        make: function (config) {
            return DynamicDropdown.make(Object.assign({ isViewOnly: true }, config));
        },
    };
});
