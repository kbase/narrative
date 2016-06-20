/*global define*/
/*jslint white:true,browser:true*/
define([
    
], function () {
    'use strict';
    
    function factory(config) {        
        var spec = config.spec,
            min = config.min,
            max = config.max,
            required = config.required,
            
            errorMessage,
            diagnosis,
            nativeValue,
            stringValue,
            parsedStringValue;
        
        function initFromSpec(spec) {
            min =  spec.text_options.min_int;
            max = spec.text_options.max_int;
            required = (spec.optional ? false : true);
        }
        
        function fromString(plainValue) {
             if (!plainValue) {
                if (required) {
                    diagnosis = 'required-missing';
                    errorMessage = 'value is required';
                    return;
                } else {
                    diagnosis = 'optional-empty';
                }
            } else {
                try {
                    parsedValue = toInteger(plainValue);
                    errorMessage = validateInteger(value, min, max);
                } catch (error) {
                    errorMessage = error.message;
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
        
        return {
            initFromSpec: initFromSpec,
            fromString: fromString,
            fromNative: fromNative
        };
    }
    
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});