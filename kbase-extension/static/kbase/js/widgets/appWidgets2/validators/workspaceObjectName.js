define(['bluebird', 'kb_service/utils', 'kb_service/client/workspace', './constants'], (
    Promise,
    serviceUtils,
    Workspace,
    Constants
) => {
    'use strict';

    function getObjectInfo(workspaceId, objectName, authToken, serviceUrl) {
        const workspace = new Workspace(serviceUrl, {
            token: authToken,
        });

        return workspace
            .get_object_info_new({
                objects: [{ wsid: workspaceId, name: objectName }],
                ignoreErrors: 1,
            })
            .then((data) => {
                if (data[0]) {
                    return serviceUtils.objectInfoToObject(data[0]);
                }
            });
    }

    function importString(value) {
        return value.trim();
    }

    function validateWorkspaceObjectName(value, constraints, options) {
        let messageId,
            shortMessage,
            errorMessage,
            diagnosis = Constants.DIAGNOSIS.VALID;

        return Promise.try(() => {
            if (!value) {
                if (constraints.required) {
                    messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (/\s/.test(value)) {
                messageId = Constants.MESSAGE_IDS.OBJ_NO_SPACES;
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'an object name may not contain a space';
            } else if (/^[+-]*\d+$/.test(value)) {
                messageId = Constants.MESSAGE_IDS.OBJ_NO_INT;
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'an object name may not be in the form of an integer';
            } else if (!/^[A-Za-z0-9|._-]+$/.test(value)) {
                messageId = Constants.MESSAGE_IDS.OBJ_INVALID;
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage =
                    'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
            } else if (value.length > 255) {
                messageId = Constants.MESSAGE_IDS.OBJ_LONG;
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'an object name may not exceed 255 characters in length';
            } else if (constraints.shouldNotExist || options.shouldNotExist) {
                return getObjectInfo(
                    options.workspaceId,
                    value,
                    options.authToken,
                    options.workspaceServiceUrl
                ).then((objectInfo) => {
                    if (objectInfo) {
                        const type = objectInfo.typeModule + '.' + objectInfo.typeName,
                            matchingType = constraints.types.some((typeId) => {
                                return typeId === type;
                            });
                        if (!matchingType) {
                            messageId = Constants.MESSAGE_IDS.OBJ_OVERWRITE_DIFF_TYPE;
                            errorMessage =
                                'an object already exists with this name and is not of the same type';
                            diagnosis = Constants.DIAGNOSIS.INVALID;
                        } else {
                            messageId = Constants.MESSAGE_IDS.OBJ_OVERWRITE_WARN;
                            shortMessage = 'an object already exists with this name';
                            diagnosis = Constants.DIAGNOSIS.SUSPECT;
                        }
                    }
                });
            }
        }).then(() => {
            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                shortMessage,
                diagnosis,
            };
        });
    }

    function validate(value, spec, options) {
        return validateWorkspaceObjectName(value, spec.data.constraints, options);
    }

    return {
        importString,
        validate,
    };
});
