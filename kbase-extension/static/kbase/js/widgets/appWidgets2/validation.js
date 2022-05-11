define([
    'bluebird',
    'kb_service/client/workspace',
    'kb_service/utils',
    'util/util',
    'util/string',
    'widgets/appWidgets2/validators/constants',
], (Promise, Workspace, serviceUtils, Util, StringUtil, Constants) => {
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
            let errorMessage, messageId, diagnosis;
            // values are raw, no parsing.

            // the only meaningful value for an empty value is 'undefined'.
            if (value === undefined) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else {
                if (!options.values.some((setValue) => setValue === value)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    messageId = Constants.MESSAGE_IDS.VALUE_NOT_FOUND;
                    errorMessage = 'Value not in the set';
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                diagnosis,
                value,
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
            let parsedValue, errorMessage, messageId, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.VALUE_NOT_STRING;
                errorMessage = 'value must be a string in data reference format';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length === 0) {
                    parsedValue = null;
                }

                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (!/^\d+\/\d+(\/\d+)?(;\d+\/\d+(\/\d+)?)*$/.test(value)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    messageId = Constants.MESSAGE_IDS.INVALID;
                    errorMessage = 'Invalid object reference path -  ( should be #/#/#;#/#/#;...)';
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }
            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                messageId,
                diagnosis,
                value,
                parsedValue,
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
            let parsedValue, errorMessage, messageId, diagnosis;

            if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.VALUE_NOT_STRING;
                errorMessage = 'value must be a string in workspace object reference format';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length === 0) {
                    parsedValue = null;
                }
                if (!parsedValue) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (!/^\d+\/\d+\/\d+$/.test(value)) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    messageId = Constants.MESSAGE_IDS.INVALID;
                    errorMessage = 'Invalid object reference format, should be #/#/#';
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }
            return {
                isValid: errorMessage ? false : true,
                messageId,
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
                diagnosis = Constants.DIAGNOSIS.VALID;

            return Promise.try(() => {
                ({ errorMessage, shortMessage, messageId, diagnosis, parsedValue } =
                    validateWorkspaceObjectNameString(value, options));
                if (errorMessage) {
                    return;
                }
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
                    value,
                    parsedValue,
                };
            });
        }

        /**
         * Validates a number. If the value is invalid or infinite, this returns a small message
         * structure with keys:
         * id {string} - a simple id for the message
         * message {string} - a printable error message
         * @param {Number} value
         * @param {Number} min (optional) if present, will return an error message if value is below this
         * @param {Number} max (optional) if present, will return an error message if value is above this
         * @returns
         */
        function validateNumber(value, min, max) {
            if (isNaN(value)) {
                return {
                    messageId: Constants.MESSAGE_IDS.NAN,
                    errorMessage: 'value must be numeric',
                };
            }
            if (!isFinite(value)) {
                return {
                    messageId: Constants.MESSAGE_IDS.INFINITE,
                    errorMessage: 'value must be finite',
                };
            }
            if (max && max < value) {
                return {
                    messageId: Constants.MESSAGE_IDS.VALUE_OVER_MAX,
                    errorMessage: 'the maximum value for this parameter is ' + max,
                };
            }
            if (min && min > value) {
                return {
                    messageId: Constants.MESSAGE_IDS.VALUE_UNDER_MIN,
                    errorMessage: 'the minimum value for this parameter is ' + min,
                };
            }
        }

        /**
         * Validates an integer string against a set of optional constraints. Will fail if:
         * - required and missing,
         * - has a min, and is lower
         * - has a max, and is higher
         * - resolves to infinity
         *
         * @param {string} value
         * @param {object} constraints
         * - required - boolean
         * - min - int
         * - max - int
         * @param {object} options (optional). if present, the only option right now is
         * nonIntError. If that is given, and the value to validate is non-parseable,
         * this error will be substituted.
         * @returns {Object} with keys:
         *  isValid: boolean,
         *  errorMessage: string or undefined,
         *  messageId: string or undefined (one of Constants.MESSAGE_IDS),
         *  diagnosis: string or undefined (one of Constants.DIAGNOSIS),
         *  value: the original value,
         *  plainValue: if value was a string, this is the trimmed version
         *  parsedValue: the parsed integer
         */
        function validateIntString(value, constraints, options = {}) {
            let plainValue,
                parsedValue,
                messageId,
                errorMessage,
                diagnosis = Constants.DIAGNOSIS.VALID;
            const min = constraints.min,
                max = constraints.max;

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string' && typeof value !== 'number') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.VALUE_NOT_PARSEABLE;
                errorMessage =
                    'value must be a string or number (it is of type "' + typeof value + '")';
            } else {
                plainValue = value;
                if (typeof plainValue === 'string') {
                    plainValue = plainValue.trim();
                }
                try {
                    parsedValue = Util.toInteger(plainValue);
                    const errorObject = validateNumber(parsedValue, min, max);
                    if (errorObject) {
                        ({ messageId, errorMessage } = errorObject);
                    }
                } catch (error) {
                    messageId = Constants.MESSAGE_IDS.ERROR;
                    errorMessage = options.nonIntError ? options.nonIntError : error.message;
                }
                if (errorMessage) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                messageId,
                errorMessage,
                diagnosis,
                value,
                plainValue,
                parsedValue,
            };
        }

        /**
         * Validates a number string against a set of optional constraints. Will fail if:
         * - required and missing,
         * - has a min, and is lower
         * - has a max, and is higher
         * - resolves to infinity
         *
         * @param {string} value
         * @param {object} constraints
         * - required - boolean
         * - min - int
         * - max - int
         * @param {object} options (optional). if present, the only option right now is
         * nonFloatError. If that is given, and the value to validate is non-parseable,
         * this error will be substituted.
         * @returns {Object} with keys:
         *  isValid: boolean,
         *  errorMessage: string or undefined,
         *  messageId: string or undefined (one of Constants.MESSAGE_IDS),
         *  diagnosis: string or undefined (one of Constants.DIAGNOSIS),
         *  value: the original value,
         *  plainValue: if value was a string, this is the trimmed version
         *  parsedValue: the parsed number
         */
        function validateFloatString(value, constraints, options = {}) {
            let plainValue, parsedValue, errorMessage, messageId, diagnosis;
            const min = constraints.min,
                max = constraints.max;

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string' && typeof value !== 'number') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.VALUE_NOT_PARSEABLE;
                errorMessage =
                    'value must be a string or number (it is of type "' + typeof value + '")';
            } else {
                try {
                    plainValue = value;
                    if (typeof plainValue === 'string') {
                        plainValue = plainValue.trim();
                    }
                    parsedValue = Util.toFloat(plainValue);
                    const errorObject = validateNumber(parsedValue, min, max);
                    if (errorObject) {
                        ({ messageId, errorMessage } = errorObject);
                    }
                } catch (error) {
                    messageId = Constants.MESSAGE_IDS.ERROR;
                    errorMessage = options.nonFloatError ? options.nonFloatError : error.message;
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
                messageId,
                diagnosis,
                value,
                plainValue,
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
                        messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        errorMessage = 'value is required';
                    } else {
                        diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                    }
                } else if (/\s/.test(parsedValue)) {
                    messageId = Constants.MESSAGE_IDS.OBJ_NO_SPACES;
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not contain a space';
                } else if (/^[+-]*\d+$/.test(parsedValue)) {
                    messageId = Constants.MESSAGE_IDS.OBJ_NO_INT;
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage = 'an object name may not be in the form of an integer';
                } else if (!/^[A-Za-z0-9.|_-]+$/.test(parsedValue)) {
                    messageId = Constants.MESSAGE_IDS.OBJ_INVALID;
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    errorMessage =
                        'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
                } else if (parsedValue.length > 255) {
                    messageId = Constants.MESSAGE_IDS.OBJ_LONG;
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

        /**
         * Validates a text string against a set of optional constraints. Will fail if:
         * - required and missing,
         * - has a min_length, and is shorter
         * - has a max_length, and is longer
         * - has a regexp and doesn't match it
         * - is a type option of "WorkspaceObjectName", and isn't a valid workspace object name
         * (ignoring all other constraints)
         *
         * @param {string} value
         * @param {object} constraints
         * - required - boolean
         * - min_length - int
         * - max_length - int
         * - regexp - regex (bare string of form /regex/)
         * - type - string, only available now is "WorkspaceObjectName" - if that's present, this
         *      gets validated as a workspace object name (meaning that string lengths and regexp
         *      are ignored)
         * @param {object} options (optional). if present, optional values are
         * - invalidValues {Set<string>} set of values that are always invalid
         * - invalidError {string} string to respond with if an invalid value is present
         * - validValues {Set<string>} set of allowed values - if present, and the value doesn't
         *   match one of these, it will resolve to invalid.
         */
        function validateTextString(value, constraints, options = {}) {
            let parsedValue,
                errorMessage,
                messageId,
                diagnosis = Constants.DIAGNOSIS.VALID;
            const minLength = constraints.min_length,
                maxLength = constraints.max_length;

            if (constraints.type && constraints.type === 'WorkspaceObjectName') {
                return validateWorkspaceObjectNameString(value, constraints);
            }

            if (StringUtil.isEmptyString(value)) {
                if (constraints.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.VALUE_NOT_STRING;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else if (
                (options.invalidValues && options.invalidValues.has(value)) ||
                (options.validValues && !options.validValues.has(value))
            ) {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.INVALID;
                errorMessage = options.invalidError ? options.invalidError : 'value is invalid';
            } else {
                parsedValue = value.trim();
                if (parsedValue.length < minLength) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    messageId = Constants.MESSAGE_IDS.VALUE_UNDER_MIN;
                    errorMessage = 'the minimum length for this parameter is ' + minLength;
                } else if (parsedValue.length > maxLength) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    messageId = Constants.MESSAGE_IDS.VALUE_OVER_MAX;
                    errorMessage = 'the maximum length for this parameter is ' + maxLength;
                } else if (constraints.regexp) {
                    const regexps = constraints.regexp.map((item) => {
                        return {
                            regexp: new RegExp(item.regex),
                            message: item.error_text,
                            invert: item.match ? false : true,
                        };
                    });
                    const regexpErrorMessages = [];
                    regexps.forEach((item) => {
                        let matches = item.regexp.test(parsedValue);
                        if (item.invert) {
                            matches = !matches;
                        }
                        if (!matches) {
                            regexpErrorMessages.push(
                                item.message ||
                                    `Failed regular expression ${item.regexp.toString()}`
                            );
                        }
                    });
                    if (regexpErrorMessages.length) {
                        diagnosis = Constants.DIAGNOSIS.INVALID;
                        messageId = Constants.MESSAGE_IDS.INVALID;
                        errorMessage = regexpErrorMessages.join('; ');
                    }
                } else {
                    diagnosis = Constants.DIAGNOSIS.VALID;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                messageId,
                diagnosis,
                value,
                parsedValue,
            };
        }

        /**
         * Validates that all values in the given "set" (an Array) are present in options.values.
         * If any are missing, this will not validate.
         * @param {Array} value
         * @param {*} options
         */
        function validateTextSet(set, options) {
            let errorMessage, messageId, diagnosis, parsedSet;
            // values are raw, no parsing.

            if (set === null) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (!(set instanceof Array)) {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.VALUE_NOT_ARRAY;
                errorMessage = 'value must be an array';
            } else {
                parsedSet = set.filter((setValue) => {
                    return !StringUtil.isEmptyString(setValue);
                });
                if (parsedSet.length === 0) {
                    if (options.required) {
                        diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                        messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
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
                        messageId = Constants.MESSAGE_IDS.VALUE_NOT_FOUND;
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
                messageId,
                diagnosis,
                value: set,
                parsedValue: parsedSet,
            };
        }

        function stringToBoolean(value) {
            switch (value.toLowerCase()) {
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
                messageId,
                diagnosis = Constants.DIAGNOSIS.VALID;

            if (StringUtil.isEmptyString(value)) {
                if (options.required) {
                    diagnosis = Constants.DIAGNOSIS.REQUIRED_MISSING;
                    messageId = Constants.MESSAGE_IDS.REQUIRED_MISSING;
                    errorMessage = 'value is required';
                } else {
                    diagnosis = Constants.DIAGNOSIS.OPTIONAL_EMPTY;
                }
            } else if (typeof value !== 'string') {
                diagnosis = Constants.DIAGNOSIS.INVALID;
                messageId = Constants.MESSAGE_IDS.VALUE_NOT_PARSEABLE;
                errorMessage = 'value must be a string (it is of type "' + typeof value + '")';
            } else {
                try {
                    parsedValue = stringToBoolean(value);
                } catch (ex) {
                    diagnosis = Constants.DIAGNOSIS.INVALID;
                    messageId = Constants.MESSAGE_IDS.VALUE_NOT_PARSEABLE;
                    errorMessage = ex.message;
                }
            }

            return {
                isValid: errorMessage ? false : true,
                errorMessage,
                messageId,
                diagnosis,
                value,
                parsedValue,
            };
        }

        function validateCustomInput() {
            return {
                isValid: true,
                errorMessage: null,
                diagnosis: Constants.DIAGNOSIS.VALID,
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

        /**
         * Return the correct structure for a result that's always invalid.
         * For use with widgets that need to trigger validation errors, but the value
         * might be technically valid. E.g. a dynamic dropdown search result was not
         * found with an existing value. Technically, the value would pass validation,
         * but it's not really a valid result.
         *
         * The diagnosis is optional, if given, it should be in the Constants.DIAGNOSIS
         * structure. Otherwise, this will default to Constants.DIAGNOSIS.INVALID.
         * @param {any} value
         * @param {string} diagnosis (optional) - should be one of Constants.DIAGNOSIS
         * @returns an invalid validation structure.
         */
        function validateFalse(value, diagnosis) {
            const defaultDiagnosis = Constants.DIAGNOSIS.INVALID;

            if (!Object.values(Constants.DIAGNOSIS).includes(diagnosis)) {
                diagnosis = defaultDiagnosis;
            }

            return {
                isValid: false,
                errorMessage: 'error',
                diagnosis,
                value,
            };
        }

        /**
         * Basically casts undefined -> null, otherwise returns the given string.
         * @param {String} value the value to verify
         * @returns the imported string or null
         */
        function importTextString(value) {
            if (value === undefined || value === null) {
                return null;
            }
            return value;
        }

        /**
         * This imports an integer string under the following restrictions.
         * 1. Returns null if the value is undefined, null, or a whitespace-only string.
         * 2. Throws an error if the value is not a string
         * 3. Attempts to cast the string to an integer. If it fails, throws an Error.
         * 4. If nonIntError is given and an error occurs, then nonIntError is thrown.
         * @param {String} value expected to be an integer string, will be cast into an int if so.
         * @param {String} nonIntError
         * @returns
         */
        function importIntString(value, nonIntError) {
            if (value === undefined || value === null) {
                return null;
            }

            if (typeof value !== 'string') {
                throw new Error('value must be a string (it is of type "' + typeof value + '")');
            }

            const plainValue = value.trim();
            if (plainValue === '') {
                return null;
            }
            try {
                return Util.toInteger(plainValue);
            } catch (err) {
                if (nonIntError) {
                    throw new Error(nonIntError);
                }
                throw err;
            }
        }

        /**
         * Imports a string into a Number format. This is distinct from importIntString, as it accepts
         * any non-infinite number. It operates under these restrictions:
         * 1. Returns null if the value is undefined, null, or a whitespace-only string.
         * 2. Throws an error if the value is not a string.
         * 3. Attempts to cast the string to an Number. If it fails, throws an Error, with an option
         *    for a custom error of nonFloatError is given.
         * @param {string} value the string to import into a Number
         * @param {string} nonFloatError (optional) if the parse fails, this custom error gets returned
         * @returns
         */
        function importFloatString(value, nonFloatError) {
            if (value === undefined || value === null) {
                return null;
            }

            if (typeof value !== 'string') {
                throw new Error('value must be a string (it is of type "' + typeof value + '")');
            }
            const plainValue = value.trim();
            if (plainValue === '') {
                return null;
            }
            try {
                return Util.toFloat(plainValue);
            } catch (err) {
                if (nonFloatError) {
                    throw new Error(nonFloatError);
                }
                throw err;
            }
        }

        return {
            validateWorkspaceDataPaletteRef,
            validateWorkspaceObjectName,
            validateWorkspaceObjectRef,
            validateNumber,
            validateIntString,
            validateFloatString,
            validateTextString,
            validateSet,
            validateTextSet,
            validateStringSet: validateTextSet,
            validateBoolean,
            validateCustomInput,
            validateTrue,
            validateFalse,
            importTextString,
            importIntString,
            importFloatString,
        };
    }

    return Validators();
});
