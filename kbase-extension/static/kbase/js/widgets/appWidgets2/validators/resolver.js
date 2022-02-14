define(['require', 'bluebird'], (require, Promise) => {
    'use strict';

    const typeToValidatorModule = {
        string: 'text',
        int: 'int',
        float: 'float',
        sequence: 'sequence',
        struct: 'struct',
        workspaceObjectName: 'workspaceObjectName',
        workspaceObjectRef: 'workspaceObjectRef',
        subdata: 'subdata',
        customSubdata: 'subdata',
        custom: 'custom',
        dynamicDropdown: 'dynamicDropdown',
    };

    function validate(fieldValue, fieldSpec, options) {
        return new Promise((resolve, reject) => {
            const fieldType = fieldSpec.data.type;
            if (!(fieldType in typeToValidatorModule)) {
                reject(new Error(`No validator for type: ${fieldType}`));
            }
            require(['./' + typeToValidatorModule[fieldType]], (validator) => {
                resolve(validator.validate(fieldValue, fieldSpec, options));
            }, (err) => {
                reject(err);
            });
        });
    }

    return {
        validate,
    };
});
