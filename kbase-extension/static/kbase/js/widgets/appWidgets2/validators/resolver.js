define(['require', 'bluebird', '../validation'], (require, Promise, Validator) => {
    'use strict';

    const typeToValidator = {
        string: Validator.validateTextString,
    };

    const typeToValidatorModule = {
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
            if (!(fieldType in typeToValidatorModule) && !(fieldType in typeToValidator)) {
                reject(new Error(`No validator for type: ${fieldType}`));
            } else if (fieldType in typeToValidator) {
                resolve(
                    typeToValidator[fieldType](
                        fieldValue,
                        fieldSpec.data.constraints || {},
                        options || {}
                    )
                );
            } else {
                require(['./' + typeToValidatorModule[fieldType]], (validator) => {
                    resolve(validator.validate(fieldValue, fieldSpec, options));
                }, (err) => {
                    console.error('error while loading');
                    console.error(JSON.stringify(err));
                    reject(err);
                });
            }
        });
    }

    return {
        validate,
    };
});
