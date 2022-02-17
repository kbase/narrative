define([], () => {
    'use strict';

    const DIAGNOSIS = {
        REQUIRED_MISSING: 'required-missing',
        OPTIONAL_EMPTY: 'optional-empty',
        INVALID: 'invalid',
        VALID: 'valid',
        SUSPECT: 'suspect',
        DISABLED: 'disabled',
        ERROR: 'error',
    };

    return {
        DIAGNOSIS,
    };
});
