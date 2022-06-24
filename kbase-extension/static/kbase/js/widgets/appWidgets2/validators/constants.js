define([], () => {
    'use strict';

    // validation diagnoses
    const DIAGNOSIS = {
        REQUIRED_MISSING: 'required-missing',
        OPTIONAL_EMPTY: 'optional-empty',
        INVALID: 'invalid',
        VALID: 'valid',
        SUSPECT: 'suspect',
        DISABLED: 'disabled',
        ERROR: 'error',
    };

    // error message ids. these are controlled, messages themselves are not,
    // and should be user readable
    const MESSAGE_IDS = {
        INFINITE: 'infinite-value',
        REQUIRED_MISSING: 'required-missing',
        OPTIONAL_EMPTY: 'optional-empty',

        OBJ_OVERWRITE_DIFF_TYPE: 'obj-overwrite-diff-type',
        OBJ_OVERWRITE_WARN: 'obj-overwrite-warning',
        OBJ_NO_SPACES: 'obj-name-no-spaces',
        OBJ_NO_INT: 'obj-name-not-integer',
        OBJ_INVALID: 'obj-name-invalid-characters',
        OBJ_LONG: 'obj-name-too-long',

        VALUE_OVER_MAX: 'value-above-maximum',
        VALUE_UNDER_MIN: 'value-below-minimum',
        VALUE_NOT_PARSEABLE: 'value-not-string-or-number',
        VALUE_NOT_ARRAY: 'value-not-array',
        VALUE_NOT_FOUND: 'value-not-found',
        VALUE_NOT_STRING: 'value-not-string',
        INVALID: 'value-not-valid',

        NAN: 'value-non-numeric',
        ERROR: 'internal-error',
    };

    return {
        DIAGNOSIS,
        MESSAGE_IDS,
    };
});
