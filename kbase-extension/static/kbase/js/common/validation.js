define([
    'bluebird',
    'kb_service/client/workspace',
    'kb_service/utils',
    'util/util',
    'util/string',
], (Promise, Workspace, serviceUtils, Util, StringUtil) => {
    'use strict';

    function Validators() {
        /**
         * This validates a single value against a set of acceptable values. For example, if
         * value = 'a', and and options.values = ['a', 'b', 'c'], this will return
         * {isValid: true}, since all the elements of value are present in options.values.
         *
         * This doesn't do any parsing, but will set an errorMessage in the return if a required
         * value is undefined.
         * @param {Array} value - the value to validate
         * @param {Object} options
         *  - required = boolean (default false)
         *  - values = Array, the set of acceptable values
         */
        function validateSet(value, options) {
            let errorMessage, diagnosis;
            // values are raw, no parsing.

            // the only meaningful value for an empty value is 'undefined'.
            if (value === undefined) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else {
                if (
                    !options.values.some((setValue) => {
                        return setValue === value;
                    })
                ) {
                    diagnosis = 'invalid';
                    errorMessage = 'Value not in the set';
                } else {
                    diagnosis = 'valid';
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: value,
            };
        }

        /**
         * Validates whether the value is a valid object data palette reference path,
         * consisting of only numerical values in the reference (e.g.: 1/2/3;4/5/6;7/8/9)
         * Note that this doesn't check to see if the path is real, just if it's syntactically
         * valid.
         * @param {string} value
         * @param {Object} options
         * - required - boolean
         * @returns {Object}
         */
        function validateWorkspaceDataPaletteRef(value, options) {
            let parsedValue, errorMessage, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string in data reference format';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length === 0) {
                    parsedValue = null;
                }

                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (!/^\d+\/\d+(\/\d+)?(;\d+\/\d+(\/\d+)?)*$/.test(value)) {
                    diagnosis = 'invalid';
                    errorMessage = 'Invalid object reference path -  ( should be #/#/#;#/#/#;...)';
                } else {
                    diagnosis = 'valid';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue,
            };
        }

        /**
         * Validates whether the given string is a workspace object reference. In this case,
         * specifically, an UPA. That means it must have the format ##/##/## to be valid.
         *
         * It can also be valid if options.required == true and value is not present.
         * @param {string} value
         * @param {object} options
         * - required - boolean
         */
        function validateWorkspaceObjectRef(value, options) {
            let parsedValue, errorMessage, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string in workspace object reference format';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length === 0) {
                    parsedValue = null;
                }
                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (!/^\d+\/\d+\/\d+$/.test(parsedValue)) {
                    diagnosis = 'invalid';
                    errorMessage = 'Invalid object reference format, should be #/#/#';
                } else {
                    diagnosis = 'valid';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue,
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
                    console.error(data);
                    if (data[0]) {
                        return serviceUtils.objectInfoToObject(data[0]);
                    } else {
                        return null;
                    }
                });
        }

        /**
         * Validate that a workspace object name is syntactically valid, and exists as a real workspace
         * object.
         * @param {string} value
         * @param {object} options
         * - required - boolean
         * - shouldNotExist - boolean
         * - workspaceId - int
         * - workspaceServiceUrl - string(url),
         * - types - Array
         */
        function validateWorkspaceObjectName(value, options) {
            let parsedValue,
                messageId,
                shortMessage,
                errorMessage,
                diagnosis = 'valid';

            return Promise.try(() => {
                const validateName = validateWorkspaceObjectNameString(value, options);
                errorMessage = validateName.errorMessage;
                shortMessage = validateName.shortMessage;
                messageId = validateName.messageId;
                diagnosis = validateName.diagnosis;
                parsedValue = validateName.parsedValue;
                if (options.shouldNotExist) {
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
                                diagnosis = 'invalid';
                            } else {
                                messageId = 'obj-overwrite-warning';
                                shortMessage = 'an object already exists with this name';
                                diagnosis = 'suspect';
                            }
                        }
                    });
                }
            }).then(() => {
                return {
                    isValid: errorMessage ? false : true,
                    messageId: messageId,
                    errorMessage: errorMessage,
                    shortMessage: shortMessage,
                    diagnosis: diagnosis,
                    value: value,
                    parsedValue: parsedValue,
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

        function validateIntString(value, options) {
            let plainValue,
                parsedValue,
                errorObject,
                messageId,
                errorMessage,
                diagnosis = 'valid';
            const min = options.min_int,
                max = options.max_int;

            if (StringUtil.isEmptyString(value)) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    messageId = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (typeof value !== 'string') {
                diagnosis = 'invalid';
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
                    diagnosis = 'invalid';
                } else {
                    diagnosis = 'valid';
                }
            }

            return {
                isValid: errorMessage ? false : true,
                messageId: messageId,
                errorMessage: errorMessage,
                message: errorMessage,
                diagnosis: diagnosis,
                value: value,
                plainValue: plainValue,
                parsedValue: parsedValue,
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

        function validateFloatString(value, options) {
            let normalizedValue, parsedValue, errorMessage, diagnosis;
            const min = options.min_float,
                max = options.max_float;

            if (StringUtil.isEmptyString(value)) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                normalizedValue = value.trim();
                parsedValue = parseFloat(normalizedValue);
                errorMessage = validateFloat(parsedValue, min, max);
                if (errorMessage) {
                    parsedValue = undefined;
                    diagnosis = 'invalid';
                } else {
                    diagnosis = 'valid';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                normalizedValue: normalizedValue,
                parsedValue: parsedValue,
            };
        }

        function validateWorkspaceObjectNameString(value, options) {
            let parsedValue,
                messageId,
                shortMessage,
                errorMessage,
                diagnosis = 'valid';

            if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string in workspace object name format';
            } else {
                parsedValue = value.trim();
                if (!parsedValue) {
                    if (options.required) {
                        messageId = 'required-missing';
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (/\s/.test(parsedValue)) {
                    messageId = 'obj-name-no-spaces';
                    diagnosis = 'invalid';
                    errorMessage = 'an object name may not contain a space';
                } else if (/^[+-]*\d+$/.test(parsedValue)) {
                    messageId = 'obj-name-not-integer';
                    diagnosis = 'invalid';
                    errorMessage = 'an object name may not be in the form of an integer';
                } else if (!/^[A-Za-z0-9|._-]+$/.test(parsedValue)) {
                    messageId = 'obj-name-invalid-characters';
                    diagnosis = 'invalid';
                    errorMessage =
                        'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
                } else if (parsedValue.length > 255) {
                    messageId = 'obj-name-too-long';
                    diagnosis = 'invalid';
                    errorMessage = 'an object name may not exceed 255 characters in length';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                messageId: messageId,
                errorMessage: errorMessage,
                shortMessage: shortMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue,
            };
        }

        /**
         * Validates a text string against a set of optional constraints. Will fail if:
         * - required and missing,
         * - has a min_length, and is shorter
         * - has a max_length, and is longer
         * - has a regexp_constraint and doesn't match it
         * - is a type option of "WorkspaceObjectName", and isn't a valid workspace object name
         * (ignoring all other constraints)
         *
         * @param {string} value
         * @param {object} options
         * - required - boolean
         * - min_length - int
         * - max_length - int
         * - regexp_constraint - regex (bare string of form /regex/)
         * - type - string, only available now is "WorkspaceObjectName" - if that's present, this
         *      gets validated as a workspace object name (meaning that string lengths and regexp
         *      are ignored)
         */
        function validateText(value, options) {
            let parsedValue,
                errorMessage,
                diagnosis = 'valid';
            const minLength = options.min_length,
                maxLength = options.max_length,
                regexp = options.regexp_constraint ? new RegExp(options.regexp_constraint) : false;

            if (options.type) {
                switch (options.type) {
                    case 'WorkspaceObjectName':
                        return validateWorkspaceObjectNameString(value, options);
                }
            }

            if (StringUtil.isEmptyString(value)) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length < minLength) {
                    diagnosis = 'invalid';
                    errorMessage = 'the minimum length for this parameter is ' + minLength;
                } else if (parsedValue.length > maxLength) {
                    diagnosis = 'invalid';
                    errorMessage = 'the maximum length for this parameter is ' + maxLength;
                } else if (regexp && !regexp.test(parsedValue)) {
                    diagnosis = 'invalid';
                    errorMessage =
                        'The text value did not match the regular expression constraint ' +
                        options.regexp_constraint;
                } else {
                    diagnosis = 'valid';
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue,
            };
        }

        /**
         * Validates that all values in the given "set" (an Array) are present in options.values.
         * If any are missing, this will not validate.
         * @param {Array} value
         * @param {*} options
         */
        function validateTextSet(value, options) {
            let errorMessage, diagnosis, parsedSet;
            // values are raw, no parsing.
            if (value === null) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (!(value instanceof Array)) {
                diagnosis = 'invalid';
                errorMessage = 'value must be an array';
            } else {
                parsedSet = value.filter((setValue) => {
                    return !StringUtil.isEmptyString(setValue);
                });
                if (parsedSet.length === 0) {
                    if (options.required) {
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (options.values) {
                    const matchedSet = parsedSet.filter((setValue) => {
                        return options.values.indexOf(setValue) >= 0;
                    });
                    if (matchedSet.length !== parsedSet.length) {
                        diagnosis = 'invalid';
                        errorMessage = 'Value not in the set';
                    } else {
                        diagnosis = 'valid';
                    }
                } else {
                    // no more validation, just having a set is ok.
                    diagnosis = 'valid';
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
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

        /**
         * As with all validators, the key is that this validates form input,
         * in its raw form. For booleans is a string taking the form of a boolean
         * symbol. E.g. a checkbox may have a value of "true" or falsy, or a boolean
         * may be represented as a two or three state dropdown or set of radio buttons,
         * etc.
         * @param {string|boolean} value
         * @param {*} options
         * - required - boolean
         */
        function validateBoolean(value, options) {
            let parsedValue,
                errorMessage,
                diagnosis = 'valid';

            if (StringUtil.isEmptyString(value)) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                try {
                    parsedValue = stringToBoolean(value);
                } catch (ex) {
                    diagnosis = 'invalid';
                    errorMessage = ex.message;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue,
            };
        }

        function validateTrue(value) {
            return {
                isValid: true,
                errorMessage: null,
                diagnosis: 'valid',
                value: value,
                parsedValue: value,
            };
        }

        return {
            validateWorkspaceDataPaletteRef,
            validateWorkspaceObjectName,
            validateWorkspaceObjectRef,
            validateInteger,
            validateIntString,
            validateIntegerField: validateIntString,
            validateFloat,
            validateFloatString,
            validateTextString: validateText,
            validateText,
            validateSet,
            validateStringSet: validateTextSet,
            validateTextSet,
            validateBoolean,
            validateTrue,
        };
    }

    return Validators();
});
