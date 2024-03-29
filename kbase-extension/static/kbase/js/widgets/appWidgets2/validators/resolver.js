define(['require', 'bluebird', 'widgets/appWidgets2/validation'], (require, Promise, Validator) => {
    'use strict';

    const typeToValidator = {
        string: 'validateTextString',
        int: 'validateIntString',
        float: 'validateFloatString',
        custom: 'validateCustomInput',
        customSubdata: 'validateCustomInput',
        subdata: 'validateCustomInput',
        multiselection: 'validateTextSet',
    };

    const typeToValidatorModule = {
        sequence: 'sequence',
        struct: 'struct',
        workspaceObjectName: 'workspaceObjectName',
        workspaceObjectRef: 'workspaceObjectRef',
    };

    const typeToArrayValidator = {
        workspaceObjectName: 'validateWorkspaceObjectNameArray',
    };

    function validate(fieldValue, fieldSpec, options) {
        return new Promise((resolve, reject) => {
            let fieldType = fieldSpec.data.type;
            // is this a select element with multiple selection enabled?
            try {
                if (
                    fieldSpec.data.constraints.options.length > 0 &&
                    fieldSpec.data.constraints.multiselection
                ) {
                    fieldType = 'multiselection';
                }
            } catch (err) {
                // no op
            }
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
        const paramType = parameterSpec.data.type;
        if (!(paramType in typeToArrayValidator)) {
            return Promise.all(values.map((value) => validate(value, parameterSpec, options)));
        }
        return Promise.resolve(
            Validator[typeToArrayValidator[paramType]](
                values,
                parameterSpec.data.constraints || {},
                options || {}
            )
        );
    }

    return {
        validate,
        validateArray,
        typeToValidator,
        typeToValidatorModule,
        typeToArrayValidator,
    };
});
