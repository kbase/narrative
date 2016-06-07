/*global define*/
/*jstlint white:true,browser:true*/

define([
], function () {
    'use strict';

    function factory(config) {
        var spec = config.parameterSpec,
            multiple = spec.allow_multiple ? true : false,
            _required = spec.optional ? false : true,
            isOutputName = spec.text_options && spec.text_options.is_output_name;
        
        function id() {
            return spec.id;
        }
        
        function name() {
            return spec.id;
        }

        function label() {
            return spec.ui_name;
        }

        function hint() {
            return spec.short_hint;
        }

        function description() {
            return spec.description;
        }

        function info() {
            return 'info disabled for now';
//            return table({class: 'table table-striped'}, [
//                tr([
//                    th('Types'),
//                    tr(td(table({class: 'table'}, spec.text_options.valid_ws_types.map(function (type) {
//                        return tr(td(type));
//                    }))))
//                ])
//            ]);
        }

        function multipleItems() {
            return multiple;
        }

        function fieldType() {
            return spec.field_type;
        }

        function type() {
            return spec.type;
        }
        
        function isAdvanced() {
            if (spec.advanced === 1) {
                return true;
            }
            return false;
        }

        function dataType() {
            /*
             * Special case here --
             * is actually an int, although Mike says it can be any type...
             */
            switch (spec.field_type) {
                case 'checkbox':
                    return 'int';
                case 'dropdown':
                    if (spec.allow_multiple) {
                        return '[]string';
                    } else {
                        return 'string';
                    }
                case 'textsubdata':
                    return 'subdata';
            }
            
            /*
             * Otherwise, we rely on text options to provide type information.
             */
            if (!spec.text_options) {
                return 'unspecified';
            }
            var validateAs = spec.text_options.validate_as;
            if (validateAs) {
                if (spec.allow_multiple) {
                    return '[]' + validateAs;
                } 
                else return validateAs;
            }

            // Some parameter specs have valid_ws_types as an empty set, which 
            // does not mean what it could, it means that it is not an option.
            if (spec.text_options.valid_ws_types && spec.text_options.valid_ws_types.length > 0) {
                if (spec.allow_multiple) {
                    return '[]workspaceObjectName';
                } else {
                    return 'workspaceObjectName';
                }
            }
            
            // Okay, if it has no specific type assigned (validate_as), and is
            // not flagged from the various properties above by grousing through
            // the text_options, we assume it is a string.

            switch (spec.field_type) {
                case 'text':
                    if (spec.allow_multiple) {
                        return '[]string';
                    } else {
                        return 'string';
                    }
            }

            return 'unspecified';
        }
        
        function nullValue() {
            if (multipleItems()) {
                return [];
            }
            switch (dataType()) {
                case 'string':
                    return '';
                case 'int':
                    return null;
                case 'float':
                    return null;
                case 'workspaceObjectName':
                    return null;
                default:
                    return null;
            }
        }
        
        /*
         * Default values are strings.
         */
        function defaultToNative(defaultValue) {
            switch (dataType()) {
                case 'string':
                    return defaultValue;
                case 'int':
                    return parseInt(defaultValue);
                case 'float':
                    return parseFloat(defaultValue);
                case 'workspaceObjectName':
                    return defaultValue;
                default:
                    // Assume it is a string...
                    return defaultValue;
            }
        }
        
        function defaultValue() {
            var defaultValues = spec.default_values;
            // No default value and not required? null value
            if (!defaultValues && !required()) {
                return nullValue();
            }
            if (defaultValues.length === 0) {
                return nullValue();
            } 
            // also weird case of a default value of the empty string, which is really
            // the same as null...
            if (defaultValues[0] === '') {
                return nullValue();
            } 
            
            // Singular item?
            if (!multipleItems()) {
                return defaultToNative(defaultValues[0]);
            } else {
                return defaultValues.map(function (defaultValue) {
                    return defaultToNative(defaultValue);
                });
            }            
        }
        
        function isEmpty(value) {
            if (value === undefined) {
                return true;
            }
            if (value === null) {
                return true;
            }
            switch (dataType()) {
                case 'string':
                    if (value.length === 0) {
                        return true;
                    } 
                    break;
                case 'workspaceObjectName':
                    if (value.length === 0) {
                        return true;
                    } 
                    break;
            }
            return false
        }

        function uiClass() {
            return spec.ui_class;
        }

        function required() {
            return _required;
        }
        
         function getConstraints() {
            var fieldType = spec.field_type;

            // NOTE:
            // field_type is text or dropdown, but does not always correspond to the 
            // type of control to build. E.g. selecting a workspace object is actually
            // a dropdown even though the field_type is 'text'.

            switch (dataType()) {
                case 'string':
                case 'text':
                    switch (fieldType) {
                        case 'text':
                            return {    
                                required: required(),
                                defaultValue: defaultValue(),
                                min: spec.text_options.min_length,
                                max: spec.text_options.max_length
                            };
                        case 'dropdown':
                            return {                                
                            };
                        default:
                            throw new Error('Unknown text param field type');
                    }
                case 'int':
                    switch (fieldType) {
                        case 'text':
                            return {                                
                            };
                        case 'checkbox':
                            return {                                
                            };
                        default:
                            return {                                
                            };
                    }
                case 'float':
                    return {                                
                    };
                case 'workspaceObjectName':
                    switch (uiClass()) {
                        case 'input':                            
                            return {
                                required: required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValue: defaultValue()
                            };
                        case 'output':
                            return {
                                required: required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValue: defaultValue()
                            };
                        case 'parameter':
                            return {
                                required: required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValue: defaultValue()
                            };
                        default:
                            throw new Error('Unknown workspaceObjectName ui class');
                    }
                case '[]workspaceObjectName':
                    switch (uiClass()) {
                        case 'input':                            
                            return {
                                required: required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValues: defaultValue()
                            };
                        case 'parameter':
                            return {
                                required: required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValues: defaultValue(),
                            };
                        default:
                            throw new Error('Unknown []workspaceObjectName ui class');
                    }                    
                case '[]string':
                    switch (fieldType) {
                        case 'dropdown':
                            return {                                
                            };
                        case 'text':
                            return {
                                required: required()
                            }
                        default:
                            throw new Error('Unknown []string field type: ' + fieldType);
                    }                    
                case 'unspecified':
                    // a bunch of field types are untyped:
                    switch (fieldType) {
                        case 'text':
                            return {                                
                            };
                        case 'checkbox':
                            return {                                
                            };
                        case 'textarea':
                            return {                                
                            };
                        case 'dropdown':
                            return {                                
                            };
                        case 'custom_button':
                            return {                                
                            };
                        case 'textsubdata':
                            return {                                
                            };
                        case 'file':
                            return {                                
                            };
                        case 'custom_textsubdata':
                            return {                                
                            };
                        case 'custom_widget':
                            return {                                
                            };
                        case 'tab':
                            return {                                
                            };
                        default:
                            throw new Error('Unknown unspecified field type');
                    }
                default:
                    throw new Error('Unknown data type');

            }
        }

        return {
            id: id,
            spec: spec,
            name: name,
            label: label,
            hint: hint,
            description: description,
            info: info,
            multipleItems: multipleItems,
            fieldType: fieldType,
            type: type,
            dataType: dataType,
            uiClass: uiClass,
            required: required,
            isAdvanced: isAdvanced,
            isEmpty: isEmpty,
            nullValue: nullValue,
            defaultValue: defaultValue,
            getConstraints: getConstraints
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});