/*global define*/
/*jslint browser:true,white:true,single:true,multivar:true */

/*
 * Provides app spec functionality.
 */

define([
], function () {
    'use strict';

    function toInteger(value) {
        switch (typeof value) {
            case 'number':
                if (value !== Math.floor(value)) {
                    throw new Error('Integer is a non-integer number');
                }
                return value;
            case 'string':
                if (value.match(/^[-+]?[\d]+$/)) {
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

    function validateWorkspaceObjectNameString(spec, value) {
        var parsedValue,
            messageId, shortMessage, errorMessage, diagnosis = 'valid';

        if (typeof value !== 'string') {
            diagnosis = 'invalid';
            errorMessage = 'value must be a string in workspace object name format';
        } else {
            parsedValue = value.trim();
            if (!parsedValue) {
                if (spec.data.constraints.required) {
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
            } else if (/^[+\-]*\d+$/.test(parsedValue)) {
                messageId = 'obj-name-not-integer';
                diagnosis = 'invalid';
                errorMessage = 'an object name may not be in the form of an integer';
            } else if (!(/^[A-Za-z0-9|\.|\||_\-]+$/).test(parsedValue)) {
                messageId = 'obj-name-invalid-characters';
                diagnosis = 'invalid';
                errorMessage = 'one or more invalid characters detected; an object name may only include alphabetic characters, numbers, and the symbols "_",  "-",  ".",  and "|"';
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
            parsedValue: parsedValue
        };
    }

    function validateString(spec, value) {
        var parsedValue,
            errorMessage, diagnosis = 'valid',
            c = spec.data.constraints,
            regexp = c.regexp ? new RegExp(c.regexp) : false;

        if (c.type) {
            switch (c.type) {
                case 'WorkspaceObjectName':
                    return validateWorkspaceObjectNameString(spec, value);
            }
        }

        if (isEmptyString(value)) {
            parsedValue = '';
            if (c.required) {
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
            if (parsedValue.length < c.min) {
                diagnosis = 'invalid';
                errorMessage = 'the minimum length for this parameter is ' + c.min;
            } else if (parsedValue.length > c.max) {
                diagnosis = 'invalid';
                errorMessage = 'the maximum length for this parameter is ' + c.max;
            } else if (regexp && !regexp.test(parsedValue)) {
                diagnosis = 'invalid';
                errorMessage = 'The text value did not match the regular expression constraint ' + c.regexp;
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

    function validateStruct(spec, value) {
        var parsedValue,
            errorMessage, diagnosis = 'valid',
            c = spec.data.constraints;

        // make sure it is a plain object

        // is it empty? what does it mean for it to be empty?
        // each member is empty.
        console.log('validating struct', spec, value);

        // use the spec to validate each member
        var result = {};
            
        spec.parameters.layout.forEach(function (id) {
            var fieldValue = value[id];
            var fieldSpec = spec.parameters.specs[id];
            result[id] = {
                id: id,
                result: validateModel(fieldSpec, fieldValue)
            };
        });

        return result;
    }
    function validateStructList(spec, value) {
        var parsedValue,
            errorMessage, diagnosis = 'valid',
            c = spec.data.constraints;

        // make sure it is a plain object

        console.log('validataing struct list', spec, value);

        // is it empty? what does it mean for it to be empty?
        // each member is empty.
        var empty = false;
        if (value === undefined || value === null) {
            empty = true;
        } else if (value.length === 0) {
            empty= true;
        }
        if (empty) {
            if (spec.data.constraints.required) {
                return {
                    isValid: false,
                    errorMessage: 'Required but empty',
                    diagnosis: 'required-missing',
                    value: value,
                    parsedValue: spec.nullValue
                };
            } else {
                return {
                    isValid: true,
                    diagnosis: 'empty-optional',
                    value: value,
                    parsedValue: spec.nullValue
                };
            }
        }

        // use the spec to validate each member
        
        // validate eacn item in the value.
        
       var results = value.map(function (item) {
            // yes, the spec for a struct list is identical (for now) to 
            // a struct. 
            // TODO: we need an ordered set type to wrap the struct!!!!!!
            return validateStruct(spec.parameters.specs.item, item);
        });

        return results;
    }

    function validateTrue(value) {
        return {
            isValid: true,
            errorMessage: null,
            diagnosis: 'valid',
            value: value,
            parsedValue: value
        };
    }
    function resolveValidator(spec) {
        var fun;
        switch (spec.data.type) {
            case 'text':
            case 'string':
                fun = validateString;
                break;
            case 'struct':
                fun = validateStruct;
                break;
            case '[]struct':
                fun = validateStructList;
                break;
            default:
                console.warn('no validator for ', spec);
                fun = validateTrue;
        }

        return function (value) {
            return fun(spec, value);
        };
    }

    function validateModel(spec, value) {
        var validator = resolveValidator(spec),
            result = validator(value);

        return result;
    }

    function factory(config) {
        return Object.freeze({
            validateModel: validateModel
        });
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});