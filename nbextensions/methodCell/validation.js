/*global define, minLength*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_service/client/workspace'
], function (Promise, Workspace) {
    'use strict';

    function Validators() {

        function toInteger(value) {
            switch (typeof value) {
                case 'number':
                    if (value !== Math.floor(value)) {
                        throw new Error('Integer is a non-integer number');
                    }
                    return value;
                case 'string':
                    if (value.match(/^[\d]+$/)) {
                        return parseInt(value, 10);
                    }
                    throw new Error('Invalid integer format');
                default:
                    throw new Error('Type ' + (typeof value) + ' cannot be converted to integer');
            }
        }

        function isEmptyString(value) {
            if (value === null) {
                return true;
            }
            if (typeof value === 'string' && value.trim() === '') {
                return true;
            }
            return false;
        }

        function validateSet(value, options) {
            var errorMessage, diagnosis;
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
                if (!options.values.some(function (setValue) {
                    return (setValue === value);
                })) {
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
                parsedValue: value
            };
        }

        /*
         * A workspace ref, but using names ... 
         */
        function validateWorkspaceObjectNameRef(value, options) {
            var parsedValue,
                errorMessage, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string in workspace object name format';
            } else {
                parsedValue = value.trim();
                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (!/^\d+\/\d+\/\d+/.test(value)) {
                    diagnosis = 'invalid';
                    errorMessage = 'Invalid object reference format (#/#/#)';
                } else {
                    diagnosis = 'valid';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue
            };
        }

        function validateWorkspaceObjectRef(value, options) {
            var parsedValue,
                errorMessage, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string in workspace object name format';
            } else {
                parsedValue = value.trim();
                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (!/^\d+\/\d+\/\d+/.test(value)) {
                    diagnosis = 'invalid';
                    errorMessage = 'Invalid object reference format (#/#/#)';
                } else {
                    diagnosis = 'valid';
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue
            };
        }

        function workspaceObjectExists(workspaceId, objectName, authToken, serviceUrl) {
            var workspace = new Workspace(serviceUrl, {
                token: authToken
            });

            /*
             * Crude to ignore errors, but we are checking for existence, which under
             * normal conditions in a narrative will be the only condition under
             * which the requested object info will be null.
             * However, it is certainly possible that this will mask other errors.
             * One solution is to let the failure trigger an exception, but then
             * the user's browser log will contain scary red error messages.
             */
            return workspace.get_object_info_new({
                objects: [{wsid: workspaceId, name: objectName}],
                ignoreErrors: 1
            })
                .then(function (data) {
                    if (data[0]) {
                        return true;
                    }
                    // but should never get here
                    return false;
                });
//                .catch(function (err) {
//                    if (err.error.error.match(/us\.kbase\.workspace\.database\.exceptions\.NoSuchObjectException/)) {
//                        return false;
//                    }
//                    throw err;
//                });
        }

        function validateWorkspaceObjectName(value, options) {
            var parsedValue,
                errorMessage, diagnosis = 'valid';

            return Promise.try(function () {
                if (typeof value !== 'string') {
                    diagnosis = 'invalid';
                    errorMessage = 'value must be a string in workspace object name format';
                } else {
                    parsedValue = value.trim();
                    if (!parsedValue) {
                        if (options.required) {
                            diagnosis = 'required-missing';
                            errorMessage = 'value is required';
                        } else {
                            diagnosis = 'optional-empty';
                        }
                    } else if (/\s/.test(parsedValue)) {
                        diagnosis = 'invalid';
                        errorMessage = 'spaces are not allowed in data object names';
                    } else if (/^\d+$/.test(parsedValue)) {
                        diagnosis = 'invalid';
                        errorMessage = 'data object names cannot be a number';
                    } else if (!/^[A-Za-z0-9|\.|\||_\-]*$/.test(parsedValue)) {
                        diagnosis = 'invalid';
                        errorMessage = 'object names can only include the symbols _ - . |';
                    } else if (options.shouldNotExist) {
                        return workspaceObjectExists(options.workspaceId, parsedValue, options.authToken, options.workspaceServiceUrl)
                            .then(function (exists) {
                                if (exists) {
                                    errorMessage = 'an object already exists with this name';
                                    diagnosis = 'invalid';
                                }
                            });
                    }
                }
            })
                .then(function () {
                    return {
                        isValid: errorMessage ? false : true,
                        errorMessage: errorMessage,
                        diagnosis: diagnosis,
                        value: value,
                        parsedValue: parsedValue
                    };
                });
        }

        function validateInteger(value, min, max) {
            if (max && max < value) {
                return 'the maximum value for this parameter is ' + max;
            }
            if (min && min > value) {
                return 'the minimum value for this parameter is ' + min;
            }
        }

        function validateIntString(value, options) {
            var plainValue,
                parsedValue,
                errorMessage, diagnosis = 'valid',
                min = options.min_int,
                max = options.max_int;

            if (isEmptyString(value)) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string (it is of type "' + (typeof value) + '")';
            } else {
                plainValue = value.trim();
                try {
                    parsedValue = toInteger(plainValue);
                    errorMessage = validateInteger(parsedValue, min, max);
                } catch (error) {
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
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                plainValue: plainValue,
                parsedValue: parsedValue
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
            var normalizedValue,
                parsedValue,
                errorMessage, diagnosis,
                min = options.min_float,
                max = options.max_float;

            if (isEmptyString(value)) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string (it is of type "' + (typeof value) + '")';
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
                parsedValue: parsedValue
            };
        }

        function validateTextString(value, options) {
            var parsedValue,
                errorMessage, diagnosis = 'valid',
                minLength = options.min_length,
                maxLength = options.max_length,
                regexp = options.regexp_constraint ? new RegExp(regexp) : false;

            if (isEmptyString(value)) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (typeof value !== 'string') {
                diagnosis = 'invalid';
                errorMessage = 'value must be a string (it is of type "' + (typeof value) + '")';
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
                    errorMessage = 'The text value did not match the regular expression constraint ' + options.regexp_constraint;
                } else {
                    diagnosis = 'valid';
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue
            };
        }

        function validateStringSet(set, options) {
            var errorMessage, diagnosis,
                parsedSet;
            // values are raw, no parsing.

            if (set === null) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else {
                parsedSet = set.filter(function (setValue) {
                    return !isEmptyString(setValue);
                });
                if (parsedSet.length === 0) {
                    if (options.required) {
                        diagnosis = 'required-missing';
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = 'optional-empty';
                    }
                } else if (options.values) {
                    var matchedSet = parsedSet.filter(function (setValue) {
                        return (options.values.indexOf(setValue) >= 0);
                    });
                    if (matchedSet.length !== parsedSet.length) {
                        diagnosis = 'invalid';
                        errorMessage = 'Value not in the set';
                    } else {
                        diagnosis = 'valid';
                    }
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: set,
                parsedValue: parsedSet
            };
        }

        return {
            validateWorkspaceObjectName: validateWorkspaceObjectName,
            validateWorkspaceObjectRef: validateWorkspaceObjectRef,
            validateInteger: validateInteger,
            validateIntString: validateIntString,
            validateIntegerField: validateIntString,
            validateFloat: validateFloat,
            validateFloatString: validateFloatString,
            validateTextString: validateTextString,
            validateSet: validateSet,
            validateStringSet: validateStringSet
        };
    }

    return Validators();
});
