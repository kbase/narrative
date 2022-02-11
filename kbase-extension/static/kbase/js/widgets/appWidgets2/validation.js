define([
    'bluebird',
    'kb_service/client/workspace',
    'kb_service/utils',
    'util/util',
    'util/string',
    './validators/constants',
], (Promise, Workspace, serviceUtils, Util, StringUtil, Constants) => {
    'use strict';

    function Validators() {
        function validateSet(value, options) {
            let errorMessage, diagnosis;
            // values are raw, no parsing.

            // the only meaningful value for an empty value is 'undefined'.
            if (value === undefined) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else {
                if (
                    !options.values.some((setValue) => {
                        return setValue === value;
                    })
                ) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'Value not in the set';
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value,
                parsedValue: value,
            };
        }

        function validateWorkspaceObjectRef(value, options) {
            let parsedValue, errorMessage, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string in workspace object name format';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length === 0) {
                    parsedValue = null;
                }
                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (!/^\d+\/\d+\/\d+/.test(value)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'Invalid object reference format (#/#/#)';
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value,
                parsedValue,
            };
        }

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

        function validateWorkspaceObjectName(value, options) {
            let parsedValue,
                messageId,
                shortMessage,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;

            return Promise.try(() => {
                if (typeof value !== 'string') {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'value must be a string in workspace object name format';
                } else {
                    parsedValue = value.trim();
                    if (parsedValue.length === 0) {
                        parsedValue = null;
                    }

                    if (!parsedValue) {
                        if (options.required) {
                            messageId = Constants.DIAGNOSIS.REQUIRED_MISSING;
                            diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                            errorMessage = 'value is required';
                        } else {
                            diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                            parsedValue = null;
                        }
                    } else if (/\s/.test(parsedValue)) {
                        messageId = 'obj-name-no-spaces';
                        diagnosis = Constants.DIAGNOSIS.INVALID;
                        errorMessage = 'an object name may not contain a space';
                    } else if (/^[+-]*\d+$/.test(parsedValue)) {
                        messageId = 'obj-name-not-integer';
                        diagnosis = Constants.DIAGNOSIS.INVALID;
                        errorMessage = 'an object name may not be in the form of an integer';
                    } else if (!/^[A-Za-z0-9|._-]+$/.test(parsedValue)) {
                        messageId = 'obj-name-invalid-characters';
                        diagnosis = Constants.DIAGNOSIS.INVALID;
                        errorMessage =
                            'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
                    } else if (parsedValue.length > 255) {
                        messageId = 'obj-name-too-long';
                        diagnosis = Constants.DIAGNOSIS.INVALID;
                        errorMessage = 'an object name may not exceed 255 characters in length';
                    } else if (options.shouldNotExist) {
                        return getObjectInfo(
                            options.workspaceId,
                            parsedValue,
                            options.authToken,
                            options.workspaceServiceUrl
                        ).then((objectInfo) => {
                            if (objectInfo) {
                                const type = objectInfo.typeModule + '.' + objectInfo.typeName,
                                    matchingType = options.types.some((typeId) => {
                                        if (typeId === type) {
                                            return true;
                                        }
                                        return false;
                                    });
                                if (!matchingType) {
                                    messageId = 'obj-overwrite-diff-type';
                                    errorMessage =
                                        'an object already exists with this name and is not of the same type';
                                    diagnosis = Constants.DIAGNOSIS.INVALID;
                                } else {
                                    messageId = 'obj-overwrite-warning';
                                    shortMessage = 'an object already exists with this name';
                                    diagnosis = Constants.DIAGNOSIS.SUSPECT;
                                }
                            }
                        });
                    }
                }
            }).then(() => {
                return {
                    isValid: errorMessage ? false : true,
                    messageId,
                    errorMessage,
                    shortMessage,
                    diagnosis,
                    value,
                    parsedValue,
                };
            });
        }

        function validateWorkspaceObjectRefSet(value, options) {
            // TODO: validate each item.
            let parsedValue,
                messageId,
                shortMessage,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;
            return Promise.try(() => {
                if (!(value instanceof Array)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'value must be an array';
                } else {
                    parsedValue = value;
                    if (parsedValue.length === 0) {
                        if (options.required) {
                            messageId = Constants.DIAGNOSIS.REQUIRED_MISSING;
                            diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                            errorMessage = 'value is required';
                        } else {
                            diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                        }
                    } else {
                        // TODO: validate each object name and report errors...
                    }
                }
            }).then(() => {
                return {
                    isValid: errorMessage ? false : true,
                    messageId,
                    errorMessage,
                    shortMessage,
                    diagnosis,
                    value,
                    parsedValue,
                };
            });
        }

        function validateInteger(value, min, max) {
            if (max && max < value) {
                return {
                    id: 'int-above-maximum',
                    message: 'the maximum value for this parameter is ' + max,
                };
            }
            if (min && min > value) {
                return {
                    id: 'int-below-minimum',
                    message: 'the minimum value for this parameter is ' + min,
                };
            }
        }

        function validateIntString(value, constraints) {
            let plainValue,
                parsedValue,
                errorObject,
                messageId,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;
            const min = constraints.min,
                max = constraints.max;

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = 'incoming-value-not-string';
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                plainValue = value.trim();
                try {
                    parsedValue = Util.toInteger(plainValue);
                    errorObject = validateInteger(parsedValue, min, max);
                    if (errorObject) {
                        messageId = errorObject.id;
                        errorMessage = errorObject.message;
                    }
                } catch (error) {
                    messageId = 'internal-error';
                    errorMessage = error.message;
                }
                if (errorMessage) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                message: errorMessage,
                diagnosis,
                value,
                plainValue,
                parsedValue,
            };
        }

        function validateFloat(value, min, max) {
            if (isNaN(value)) {
                return 'value must be numeric';
            }
            if (!isFinite(value)) {
                return 'value must be a finite float';
            }
            if (max && max < value) {
                return 'the maximum value for this parameter is ' + max;
            }
            if (min && min > value) {
                return 'the minimum value for this parameter is ' + min;
            }
        }

        function validateFloatString(value, constraints) {
            let normalizedValue, parsedValue, errorMessage, diagnosis;
            const min = constraints.min,
                max = constraints.max;

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                try {
                    normalizedValue = value.trim();
                    parsedValue = parseFloat(normalizedValue);
                    errorMessage = validateFloat(parsedValue, min, max);
                } catch (error) {
                    errorMessage = error.message;
                }
                if (errorMessage) {
                    parsedValue = undefined;
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value,
                normalizedValue,
                parsedValue,
            };
        }

        function validateWorkspaceObjectNameString(value, options) {
            let parsedValue,
                messageId,
                shortMessage,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;

            if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string in workspace object name format';
            } else {
                parsedValue = value.trim();
                if (!parsedValue) {
                    if (options.required) {
                        messageId = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (/\s/.test(parsedValue)) {
                    messageId = 'obj-name-no-spaces';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not contain a space';
                } else if (/^[+-]*\d+$/.test(parsedValue)) {
                    messageId = 'obj-name-not-integer';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not be in the form of an integer';
                } else if (!/^[A-Za-z0-9|.|_-]+$/.test(parsedValue)) {
                    messageId = 'obj-name-invalid-characters';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage =
                        'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
                } else if (parsedValue.length > 255) {
                    messageId = 'obj-name-too-long';
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not exceed 255 characters in length';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                shortMessage,
                diagnosis,
                value,
                parsedValue,
            };
        }

        function validateText(value, constraints) {
            let parsedValue,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;
            const minLength = constraints.min_length,
                maxLength = constraints.max_length,
                regexp = constraints.regexp ? new RegExp(constraints.regexp) : false;

            if (constraints.type) {
                switch (constraints.type) {
                    case 'WorkspaceObjectName':
                        return validateWorkspaceObjectNameString(value, constraints);
                }
            }

            if (StringUtil.isEmptyString(value)) {
                parsedValue = '';
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                // parsedValue = value.trim();
                parsedValue = value;
                if (parsedValue.length < minLength) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'the minimum length for this parameter is ' + minLength;
                } else if (parsedValue.length > maxLength) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'the maximum length for this parameter is ' + maxLength;
                } else if (regexp && !regexp.test(parsedValue)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage =
                        'The text value did not match the regular expression constraint ' +
                        constraints.regexp;
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value,
                parsedValue,
            };
        }

        function validateTextSet(set, options) {
            let errorMessage, diagnosis, parsedSet;
            // values are raw, no parsing.

            if (set === null) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else {
                parsedSet = set.filter((setValue) => {
                    return !StringUtil.isEmptyString(setValue);
                });
                if (parsedSet.length === 0) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (options.values) {
                    const matchedSet = parsedSet.filter((setValue) => {
                        return options.values.indexOf(setValue) >= 0;
                    });
                    if (matchedSet.length !== parsedSet.length) {
                        diagnosis = Constants.DIAGNOSIS.INVALID;
                        errorMessage = 'Value not in the set';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.VALID;
                    }
                } else {
                    // no more validation, just having a set is ok.
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value: set,
                parsedValue: parsedSet,
            };
        }

        function stringToBoolean(value) {
            switch (value.toLowerCase(value)) {
                case 'true':
                case 't':
                case 'yes':
                case 'y':
                    return true;
                case 'false':
                case 'f':
                case 'no':
                case 'n':
                    return false;
                default:
                    throw new Error('Invalid format for boolean: ' + value);
            }
        }

        // As with all validators, the key is that this validates form input,
        // in its raw form. For booleans is a string taking the form of a boolean
        // symbol. E.g. a checkbox may have a value of "true" or falsy, or a boolean
        // may be represented as a two or three state dropdown or set of radio buttons,
        // etc.
        function validateBoolean(value, options) {
            let parsedValue,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;

            if (StringUtil.isEmptyString(value)) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                try {
                    parsedValue = stringToBoolean(value);
                } catch (ex) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = ex.message;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                diagnosis,
                value,
                parsedValue,
            };
        }

        function validateTrue(value) {
            return {
                isValid: true,
                errorMessage: null,
                diagnosis: Constants.DIAGNOSIS.VALID,
                value,
                parsedValue: value,
            };
        }

        return {
            validateWorkspaceObjectName,
            validateWorkspaceObjectRef,
            validateWorkspaceObjectRefSet,
            validateInteger,
            validateIntString,
            validateIntegerField: validateIntString,
            validateFloat,
            validateFloatString,
            validateText,
            validateTextString: validateText,
            validateSet,
            validateTextSet,
            validateStringSet: validateTextSet,
            validateBoolean,
            validateTrue,
        };
    }

    return Validators();
});
