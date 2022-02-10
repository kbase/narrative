define(['bluebird', './constants'], (Promise, Constants) => {
    'use strict';

    function importString(stringValue) {
        return stringValue.trim();
    }

    function validate() {
        return Promise.resolve({
            isValid: true,
            errorMessage: null,
            diagnosis: Constants.DIAGNOSIS.VALID,
        });
    }

    return {
        importString,
        validate,
    };
});
