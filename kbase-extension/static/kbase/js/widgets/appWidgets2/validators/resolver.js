define([
    'require',
    'bluebird'
], function(
    require,
    Promise) {
    'use strict';

    var typeToValidatorModule = {
        string: 'text',
        int: 'int',
        float: 'float',
        sequence: 'sequence',
        struct: 'struct',
        workspaceObjectName: 'workspaceObjectName',
        workspaceObjectRef: 'workspaceObjectRef',
        subdata: 'subdata'
    }

    function getValidatorModule(fieldSpec) {
        var moduleName = typeToValidatorModule[fieldSpec.data.type];
        if (!moduleName) {
            throw new Error('No validator for type: ' + fieldSpec.data.type);
        }
        return moduleName;
    }

    function validate(fieldValue, fieldSpec) {
        return new Promise(function(resolve, reject) {
            try {
                var validatorModule = getValidatorModule(fieldSpec);
            } catch (ex) {
                reject(ex);
            }
            require(['./' + validatorModule], function(validator) {
                resolve(validator.validate(fieldValue, fieldSpec));
            }, function(err) {
                reject(err);
            });
        });
    }

    return {
        validate: validate
    }
});