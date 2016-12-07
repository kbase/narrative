define([
    'bluebird',
    'kb_service/utils',
    'kb_service/client/workspace'
], function(Promise, serviceUtils, Workspace) {
    'use strict';

    function getObjectInfo(workspaceId, objectName, authToken, serviceUrl) {
        var workspace = new Workspace(serviceUrl, {
            token: authToken
        });

        return workspace.get_object_info_new({
                objects: [{ wsid: workspaceId, name: objectName }],
                ignoreErrors: 1
            })
            .then(function(data) {
                if (data[0]) {
                    return serviceUtils.objectInfoToObject(data[0]);
                }
            });
    }

    function importString(value) {
        return value.trim();
    }

    function validateWorkspaceObjectName(value, constraints, options) {
        var messageId, shortMessage, errorMessage, diagnosis = 'valid';

        return Promise.try(function() {
                if (value === null) {
                    if (constraints.required) {
                        messageId = 'required-missing';
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (/\s/.test(value)) {
                    messageId = 'obj-name-no-spaces';
                    diagnosis = 'invalid';
                    errorMessage = 'an object name may not contain a space';
                } else if (/^[\+\-]*\d+$/.test(value)) {
                    messageId = 'obj-name-not-integer';
                    diagnosis = 'invalid';
                    errorMessage = 'an object name may not be in the form of an integer';
                } else if (!/^[A-Za-z0-9|\.|\||_\-]+$/.test(value)) {
                    messageId = 'obj-name-invalid-characters';
                    diagnosis = 'invalid';
                    errorMessage = 'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
                } else if (value.length > 255) {
                    messageId = 'obj-name-too-long';
                    diagnosis = 'invalid';
                    errorMessage = 'an object name may not exceed 255 characters in length';
                } else if (constraints.shouldNotExist) {
                    return getObjectInfo(options.workspaceId, value, options.authToken, options.workspaceServiceUrl)
                        .then(function(objectInfo) {
                            if (objectInfo) {
                                var type = objectInfo.typeModule + '.' + objectInfo.typeName,
                                    matchingType = constraints.types.some(function(typeId) {
                                        if (typeId === type) {
                                            return true;
                                        }
                                        return false;
                                    });
                                if (!matchingType) {
                                    messageId = 'obj-overwrite-diff-type';
                                    errorMessage = 'an object already exists with this name and is not of the same type';
                                    diagnosis = 'invalid';
                                } else {
                                    messageId = 'obj-overwrite-warning';
                                    shortMessage = 'an object already exists with this name';
                                    diagnosis = 'suspect';
                                }
                            }
                        });
                }
            })
            .then(function() {
                return {
                    isValid: errorMessage ? false : true,
                    messageId: messageId,
                    errorMessage: errorMessage,
                    shortMessage: shortMessage,
                    diagnosis: diagnosis
                };
            });
    }

    function validate(value, spec, options) {
        return validateWorkspaceObjectName(value, spec.data.constraints, options)
    }

    return {
        importString: importString,
        validate: validate
    };
});