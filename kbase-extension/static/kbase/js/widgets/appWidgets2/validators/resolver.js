define(['bluebird', '../validation'], (Promise, Validator) => {
    'use strict';

    const typeToValidatorModule = {
        string: Validator.validateText,
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
            } else if (typeof typeToValidatorModule[fieldType] === 'function') {
                resolve(
                    typeToValidatorModule[fieldType](
                        fieldValue,
                        fieldSpec.data.constraints || {},
                        options || {}
                    )
                );
            } else {
                require(['./' + typeToValidatorModule[fieldType]], (validator) => {
                    resolve(validator.validate(fieldValue, fieldSpec, options));
                }, (err) => {
                    reject(err);
                });
            }
        });
    }

    return {
        validate,
    };
});
