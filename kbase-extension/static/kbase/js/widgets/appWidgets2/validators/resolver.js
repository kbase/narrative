define([
    'require',
    'bluebird'
], (
    require,
    Promise) => {
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
        customSubdata: 'customSubdata',
        custom: 'custom',
        dynamicDropdown: 'dynamicDropdown'
    };

    function getValidatorModule(fieldSpec) {
        const moduleName = typeToValidatorModule[fieldSpec.data.type];
        if (!moduleName) {
            throw new Error('No validator for type: ' + fieldSpec.data.type);
        }
        return moduleName;
    }

    function validate(fieldValue, fieldSpec) {
        return new Promise((resolve, reject) => {
            try {
                var validatorModule = getValidatorModule(fieldSpec);
            } catch (ex) {
                reject(ex);
            }
            require(['./' + validatorModule], (validator) => {
                resolve(validator.validate(fieldValue, fieldSpec));
            }, (err) => {
                reject(err);
            });
        });
    }

    return {
        validate: validate
    }
});
