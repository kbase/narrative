/*global define, minLength*/
/*jslint white:true,browser:true*/
define([
], function () {
    'use strict';

    function Validators() {

        function toInteger(value) {
            var numericValue = Number(value);
            if (isNaN(numericValue)) {
                return false;
            }
            if (numericValue === Math.floor(numericValue)) {
                return numericValue;
            }
            return false;
        }

        function toFloat(value) {
            var floatValue = parseFloat(value);
            if (isNaN(floatValue)) {
                return false;
            }
            return floatValue;
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
                if (!options.values.some(function(setValue) {
                    return (setValue === value);
                })) {
                    diagnosis = 'invalid',
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

        function validateWorkspaceObjectName(value, options) {
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
                } else if (/\s/.test(parsedValue)) {
                    diagnosis = 'invalid';
                    errorMessage = 'spaces are not allowed in data object names';
                } else if (/^\d+$/.test(parsedValue)) {
                    diagnosis = 'invalid';
                    errorMessage = 'data object names cannot be a number';
                } else if (!/^[A-Za-z0-9|\.|\||_\-]*$/.test(parsedValue)) {
                    diagnosis = 'invalid';
                    errorMessage = 'object names can only include the symbols _ - . |';
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

        function validateInteger(value, options) {
            var plainValue = value.trim(),
                parsedValue,
                errorMessage, diagnosis,
                min = options.min_int,
                max = options.max_int;

            if (!plainValue) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else {
                parsedValue = toInteger(plainValue);
                if (parsedValue === false) {
                    diagnosis = 'invalid';
                    errorMessage = 'value must be an integer';
                } else if (max && max < parsedValue) {
                    diagnosis = 'invalid';
                    errorMessage = 'the maximum value for this parameter is ' + max;
                } else if (min && min > parsedValue) {
                    diagnosis = 'invalid';
                    errorMessage = 'the minimum value for this parameter is ' + min;
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

        function validateFloat(value, options) {
            var plainValue = value.trim(),
                parsedValue,
                errorMessage, diagnosis,
                min = options.min_float,
                max = options.max_float;
            
             if (!plainValue) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else {
                parsedValue = parseFloat(plainValue);
                if (isNaN(parsedValue)) {
                    diagnosis = 'invalid';
                    errorMessage = 'value must be numeric';
                } else if (!isFinite(parsedValue)) {
                    diagnosis = 'invalid';
                    errorMessage = 'value must be a finite float';
                } else if (max && max < parsedValue) {
                    diagnosis = 'invalid';
                    errorMessage = 'the maximum value for this parameter is ' + max;
                } else if (min && min > parsedValue) {
                    diagnosis = 'invalid';
                    errorMessage = 'the minimum value for this parameter is ' + min;
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

        function validateText(value, options) {
            var parsedValue = value.trim(),
                errorMessage, diagnosis,
                minLength = options.min_length,
                maxLength = options.max_length,
                regexp = options.regexp_constraint ? new RegExp(regexp) : false;

            if (!parsedValue) {
                if (options.required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                } else {
                    diagnosis = 'optional-empty';
                }
            } else if (parsedValue.length < minLength) {
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

            return {
                isValid: errorMessage ? false : true,
                errorMessage: errorMessage,
                diagnosis: diagnosis,
                value: value,
                parsedValue: parsedValue
            };
        }

        return {
            validateWorkspaceObjectName: validateWorkspaceObjectName,
            validateWorkspaceObjectRef: validateWorkspaceObjectRef,
            validateInteger: validateInteger,
            validateFloat: validateFloat,
            validateText: validateText,
            validateSet: validateSet
        };
    }


    return Validators();
});
