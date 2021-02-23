define([
    'bluebird'
], (Promise) => {
    'use strict';

    function importString(stringValue) {
        return stringValue.trim();
    }

    function validate() {
        return Promise.try(() => {
            return {
                isValid: true,
                errorMessage: null,
                diagnosis: 'valid'
            };
        });
    }

    return {
        importString: importString,
        validate: validate
    };
});