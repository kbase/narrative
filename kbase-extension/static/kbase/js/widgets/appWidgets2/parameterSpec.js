/*global define*/
/*jstlint white:true,browser:true,single:true*/

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

        function customTextSubdata() {
            // try dispatching on name...
            switch (spec.id) {
                case 'input_property_x':
                    return 'sample_property';
                case 'input_property_y':
                    return 'sample_property';
            }
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
                case 'custom_textsubdata':
                    if (spec.allow_multiple) {
                        return '[]string';
                    }
                    return 'string';
                    //var custom = customTextSubdata();
                    //if (custom) {
                    //    return custom;
                    //}
                case 'custom_button':
                    switch (spec.id) {
                        case 'input_check_other_params':
                            return 'boolean';
                        default:
                            return 'unspecified';
                    }
                case 'custom_widget':
                    if (spec.dropdown_options) {
                        return '[]string';
                    }
                    break;
                case 'group':
                    return 'struct';
                // case 'reads_group_editor':
                //     return 'reads_group_editor';
            }

            /*
             * Otherwise, we rely on text options to provide type information.
             */
            if (!spec.text_options) {
                // consider it plain, unconstrained text.
                if (spec.allow_multiple) {
                    return '[]string';
                }
                return 'string';
            }
            var validateAs = spec.text_options.validate_as;
            if (validateAs) {
                if (spec.allow_multiple) {
                    return '[]' + validateAs;
                }
                return validateAs;
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
                case 'boolean':
                    return coerceToBoolean(defaultValue);
                default:
                    // Assume it is a string...
                    return defaultValue;
            }
        }

        /*
         * Coerce a string, undefined, or null to an "integer boolean" value --
         * an integer which is 1 for true, 0 for false.
         */
        function coerceToIntBoolean(value) {
            if (!value) {
                return 0;
            }
            var intValue = parseInt(value);
            if (!isNaN(intValue)) {
                if (value > 0) {
                    return 1;
                }
                return 0;
            }
            if (typeof value !== 'string') {
                return 0;
            }
            switch (value.toLowerCase(value)) {
                case 'true':
                case 't':
                case 'yes':
                case 'y':
                    return 1;
                case 'false':
                case 'f':
                case 'no':
                case 'n':
                    return 0;
                default:
                    return 0;
            }
        }

        function defaultValue() {
            var defaultValues = spec.default_values || [];
            // No default value and not required? null value

            // special special cases.
            switch (spec.field_type) {
                case 'checkbox':
                    /*
                     * handle the special case of a checkbox with no or empty
                     * default value. It will promote to the "unchecked value"
                     * TODO: more cases of bad default value? Or a generic
                     * default value validator?
                     */
                    if (!defaultValues ||
                        defaultValues.length === 0) {
                        return spec.checkbox_options.unchecked_value;
                    } else {
                        return coerceToIntBoolean(defaultValues[0]);
                    }
                case 'custom_textsubdata':
                    if (!defaultValues) {

                    }
            }


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
            return false;
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
                                type: spec.text_options ? spec.text_options.data_type : null,
                                min: spec.text_options ? spec.text_options.min_length : null,
                                max: spec.text_options ? spec.text_options.max_length : null
                            };
                        case 'dropdown':
                            return {
                            };
                        case 'textarea':
                            return {
                                required: required(),
                                defaultValue: defaultValue(),
                                min:  spec.text_options ? spec.text_options.min_length : null,
                                max:  spec.text_options ? spec.text_options.max_length : null,
                                rows: spec.text_options ? spec.text_options.n_rows : null
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
                    switch (paramClass()) {
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
                    switch (paramClass()) {
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
                                defaultValues: defaultValue()
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
                            };
                        case 'textarea':
                            return {
                                required: required()
                            };
                        default:
                            throw new Error('Unknown []string field type: ' + fieldType);
                    }
                case 'subdata':
                    return {
                        multiple: false,
                        // The parameter containing the object name we derive data from
                        referredParameter: spec.subdata_selection.parameter_id,
                        // The "included" parameter to for the workspace call
                        subdataIncluded: spec.subdata_selection.subdata_included,
                        // These are for navigating the results.

                        // This is the property path to the part of the subdata
                        // we want to deal with.
                        path: spec.subdata_selection.path_to_subdata,
                        // This is used to pluck a value off of the leaf array
                        // items, object properties (if object), object values (if 'value'),
                        // or otherwise just use the property key. This becomes the "id"
                        // of the subdata item.
                        selectionId: spec.subdata_selection.selection_id,
                        // Used to generate a description for each item. Becomes the "desc".
                        displayTemplate: spec.subdata_selection.description_template
                    };
                case 'xxinput_property_x':
                    return {
                        defaultValue: defaultValue(),
                        referredParameter: 'input_sample_property_matrix',
                        subdataIncluded: 'metadata/column_metadata',
                        path: 'metadata/column_metadata',
                        // custom function to collect
                        mapper: {
                            before: function () {
                                return {
                                    collected: {}
                                };
                            },
                            during: function (values, state) {
                                values.forEach(function (value) {
                                    if (value.entity === 'Condition') {
                                        state.collected[value.property_name] = true;
                                    }
                                });
                            },
                            after: function (state) {
                                return Object.keys(state.collected).map(function (key) {
                                    return {
                                        id: key,
                                        desc: key
                                    };
                                });
                            }
                        }
                    };
                case 'sample_property':
                    return {
                        required: required(),
                        defaultValue: defaultValue(),
                        referredParameter: 'input_sample_property_matrix',
                        subdataIncluded: 'metadata/column_metadata',
                        subdataPath: 'metadata.column_metadata',
                        // custom function to collect
                        map: function (subdata) {
                            var collected = {};
                            Object.keys(subdata).forEach(function (key) {
                                    var id, name, column = subdata[key];
                                    column.forEach(function (value) {
                                        if (value.category === 'DataSeries' && value.property_name === 'SeriesID') {
                                            id = value.property_value;
                                        } else if (value.category === 'Property' && value.property_name === 'Name') {
                                            name = value.property_value;
                                        }
                                        if (id && name) {
                                            collected[id] = name;
                                        }
                                    });
                                });
                                return Object.keys(collected).map(function (key) {
                                    return {
                                        id: key,
                                        desc: collected[key]
                                    };
                                })
                                    .sort(function (a, b) {
                                        if (a.desc < b.desc) {
                                            return -1;
                                        } else if (a.desc > b.desc) {
                                            return 1;
                                        }
                                        return 0;
                                    });
                        }
                    };
                case 'struct':
                    return {
                        required: required(),
                        defaultValue: defaultValue()                        
                    };
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
                    console.error('Unknown data type', dataType());
                    throw new Error('Unknown data type');

            }
        }

        /*
         * The parameter class is either input, output, or parameter.
         * This method both determines the class and ensures that the param
         * is set up in a manner consistent with the class.
         */
        var attributes = {
            paramClass: null
        };
        function setupParamClass() {
            // The primary flag for the param class is the ui_class property.
            // Perhaps not the best name for this property.

            var paramClassName = spec.ui_class;
            if (!paramClassName) {
                throw new Error('Parameter ' + spec.id + ' has no ui_class set');
            }

            switch (paramClassName) {
                case 'input':
                    // do stuff
                    if (spec.text_options && spec.text_options.is_output_name) {
                        throw new Error('Parameter ' + spec.id + ' is an input type, but has text_options.is_output_name specified');
                    }
                    break;
                case 'output':
                    // must have the isOutputName = spec.text_options && spec.text_options.is_output_name;
                    // do more stuff
                    if (!spec.text_options || !spec.text_options.is_output_name) {
                        throw new Error('Parameter ' + spec.id + ' is an output type, but does not have text_options.is_output_name specified');
                    }
                    // Workaround if a parameter is multiple object names, turn it
                    // into an input.
                    // console.log('PARAM CLASS output?', spec, dataType());
                    if (dataType() === '[]workspaceObjectName') {
                        paramClassName = 'input';
                    }
                    break;
                case 'parameter':
                    // do outlandish things
                    // TODO: these two conditions are inconsistent, but we honor the is_output_name as per mike.
                    // The ui_class is really just for the man page and app cell ui organization, so it is relatively minor
                    // to override it with is_output_name which is actually functional!
                    if (spec.text_options && spec.text_options.is_output_name) {
                        // console.error('Parameter ' + spec.id + ' is a parameter type, but has text_options.is_output_name specified', spec);
                        //throw new Error('Parameter ' + spec.id + ' is a parameter type, but has text_options.is_output_name specified');
                        paramClassName = 'output';
                    }
                    break;
            }

            attributes.paramClass = paramClassName;

        }

        function paramClass() {
            return attributes.paramClass;
        }

        setupParamClass();

        // NEW -- validate and completely set up normalized param first,
        // so that errors are caught early.


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
            getConstraints: getConstraints,
            paramClass: paramClass
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
