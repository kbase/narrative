define(['require', 'bluebird', 'widgets/appWidgets2/validation'], (require, Promise, Validator) => {
    'use strict';

    const typeToValidator = {
        string: 'validateTextString',
        int: 'validateIntString',
        float: 'validateFloatString',
        custom: 'validateCustomInput',
        customSubdata: 'validateCustomInput',
        subdata: 'validateCustomInput',
    };

    const typeToValidatorModule = {
        sequence: 'sequence',
        struct: 'struct',
        workspaceObjectName: 'workspaceObjectName',
        workspaceObjectRef: 'workspaceObjectRef',
    };

    const typeToArrayValidator = {
        workspaceObjectName: 'workspaceObjectNameArray',
        string: 'stringArray'
    };

    function validate(fieldValue, fieldSpec, options) {
        return new Promise((resolve, reject) => {
            const fieldType = fieldSpec.data.type;
            if (!(fieldType in typeToValidatorModule) && !(fieldType in typeToValidator)) {
                reject(new Error(`No validator for type: ${fieldType}`));
            } else if (fieldType in typeToValidator) {
                resolve(
                    Validator[typeToValidator[fieldType]](
                        fieldValue,
                        fieldSpec.data.constraints || {},
                        options || {}
                    )
                );
            } else {
                require(['widgets/appWidgets2/validators/' + typeToValidatorModule[fieldType]], (
                    validator
                ) => {
                    resolve(validator.validate(fieldValue, fieldSpec, options));
                }, (err) => {
                    console.error('error while loading');
                    console.error(JSON.stringify(err));
                    reject(err);
                });
            }
        });
    }

    function validateArray(values, parameterSpec, options) {
        return new Promise((resolve, reject) => {
            const paramType = parameterSpec.data.type;
            if (!(paramType in typeToArrayValidator)) {
                reject(new Error(`No array validator for type: ${paramType}`));
            }
            resolve(Validator[typeToArrayValidator[paramType]](
                values,
                parameterSpec.data.constraints || {},
                options || {}
            ));
        });
    }

    return {
        validate,
        validateArray,
        typeToValidator,
        typeToValidatorModule,
    };
});
