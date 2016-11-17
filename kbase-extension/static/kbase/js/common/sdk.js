/*global define*/
/*jslint browser:true,white:true,single:true*/

define([], function () {
    'use strict';

    function coerceToBoolean(value) {
        if (!value) {
            return false;
        }
        var intValue = parseInt(value);
        if (!isNaN(intValue)) {
            if (value > 0) {
                return 1;
            }
            return false;
        }
        if (typeof value !== 'string') {
            return false;
        }
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
            return false;
        }
    }

    function coerceToIntBoolean(value) {
        return coerceToBoolean(value) ? 1 : 0;
    }

    function nullValue(converted) {
        if (converted.multipleItems) {
            return [];
        }
        var nullValue = (function () {
            switch (converted.data.type) {
            case 'string':
                return '';
            case 'int':
                return null;
            case 'float':
                return null;
            case 'workspaceObjectName':
                return null;
            case 'struct':
                return {};
            case '[]struct':
                return [];
            default:
                return null;
            }
        }());
        return nullValue;
    }

    function updateNullValue(converted) {
        converted.data.nullValue = nullValue(converted);
    }

    /*
     * Default values are strings.
     */
    function defaultToNative(converted, defaultValue) {
        switch (converted.data.type) {
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

    function defaultValue(converted, spec) {
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
            }
            return coerceToIntBoolean(defaultValues[0]);
        case 'custom_textsubdata':
            if (!defaultValues) {
                // ??
            }
            break;
        }

        // No default in spec, yet required.
        if (!defaultValues && converted.required) {
            return converted.data.nullValue;
        }

        if (defaultValues.length === 0) {
            return converted.data.nullValue;
        }
        // also weird case of a default value of the empty string, which is really
        // the same as null...
        if (defaultValues[0] === '') {
            return converted.data.nullValue;
        }

        // Singular item?
        if (!spec.allow_multiple) {
            return defaultToNative(converted, defaultValues[0]);
        }
        return defaultValues.map(function (defaultValue) {
            return defaultToNative(converted, defaultValue);
        });
    }

    function updateDefaultValue(converted, spec) {
        converted.data.defaultValue = defaultValue(converted, spec);
    }

    function grokDataType(spec) {
        /*
         * Special case here --
         * is actually an int, although Mike says it can be any type...
         */
        switch (spec.field_type) {
        case 'checkbox':
            return 'int';
        case 'textarea':
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
            // For int and float, "validateAs" overrides the type.
            if (validateAs === 'int' || validateAs === 'float') {
                if (spec.allow_multiple) {
                    return '[]' + validateAs;
                }
                return validateAs;
            }
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

    /*
     * These need to be really fleshed out...
     */
    function updateConstraints(converted, spec) {
        var dataType = converted.data.type;
        var fieldType = converted.ui.type;
        var paramClass = converted.ui.class;
        var constraints = {};

        // NOTE:
        // field_type is text or dropdown, but does not always correspond to the
        // type of control to build. E.g. selecting a workspace object is actually
        // a dropdown even though the field_type is 'text'.

        switch (dataType) {
        case 'string':
        case 'text':
            switch (fieldType) {
            case 'text':
                if (spec.text_options) {
                    constraints = {
                        min: spec.text_options.min_length,
                        max: spec.text_options.max_length,
                        validate: spec.text_options.validate_as
                    };
                }
                break;
            case 'dropdown':
                if (spec.dropdown_options) {
                    constraints = {
                        options: spec.dropdown_options.options
                    };
                }
                break;
            case 'textarea':
                if (spec.text_options) {
                    constraints = {
                        min: spec.text_options.min_length,
                        max: spec.text_options.max_length,
                        nRows: spec.text_options.n_rows
                    };
                }
                break;
            default:
                throw new Error('Unknown text param field type');
            }
            break;
        case 'int':
            switch (fieldType) {
            case 'text':
                if (spec.text_options) {
                    constraints = {
                        min: spec.text_options.min_int,
                        max: spec.text_options.max_int
                    };
                }
                break;
            case 'checkbox':
                // In theory, the checkbox
                constraints = {
                    min: 0,
                    max: 0
                };
                break;
            }
            break;
        case 'float':
            if (spec.text_options) {
                constraints = {
                    min: spec.text_options.min_float,
                    max: spec.text_options.max_float
                };
            }
            break;
        case 'workspaceObjectName':
            var validTypes = spec.text_options ? spec.text_options.valid_ws_types : [];
            switch (paramClass) {
            case 'input':
                constraints = {
                    types: validTypes
                };
                break;
            case 'output':
                constraints = {
                    types: validTypes
                };
                break;
            case 'parameter':
                constraints = {
                    types: validTypes
                };
                break;
            default:
                throw new Error('Unknown workspaceObjectName ui class');
            }
            break;
        case '[]workspaceObjectName':
            var validTypes = spec.text_options ? spec.text_options.valid_ws_types : [];
            switch (paramClass) {
            case 'input':
                constraints = {
                    types: validTypes
                };
                break;
            case 'parameter':
                constraints = {
                    types: validTypes
                };
                break;
            default:
                throw new Error('Unknown []workspaceObjectName ui class');
            }
            break;
        case '[]string':
            switch (fieldType) {
            case 'dropdown':
                break;
            case 'text':
                break;
            case 'textarea':
                break;
            default:
                throw new Error('Unknown []string field type: ' + fieldType);
            }
            break;
        case 'subdata':
            if (spec.subdata_selection) {
                constraints = {
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
            }
            constraints.multiple = false;
            break;
            //                case 'xxinput_property_x':
            //                    return {
            //                        defaultValue: defaultValue(),
            //                        referredParameter: 'input_sample_property_matrix',
            //                        subdataIncluded: 'metadata/column_metadata',
            //                        path: 'metadata/column_metadata',
            //                        // custom function to collect
            //                        mapper: {
            //                            before: function () {
            //                                return {
            //                                    collected: {}
            //                                };
            //                            },
            //                            during: function (values, state) {
            //                                values.forEach(function (value) {
            //                                    if (value.entity === 'Condition') {
            //                                        state.collected[value.property_name] = true;
            //                                    }
            //                                });
            //                            },
            //                            after: function (state) {
            //                                return Object.keys(state.collected).map(function (key) {
            //                                    return {
            //                                        id: key,
            //                                        desc: key
            //                                    };
            //                                });
            //                            }
            //                        }
            //                    };
            //                case 'sample_property':
            //                    return {
            //                        required: required(),
            //                        defaultValue: defaultValue(),
            //                        referredParameter: 'input_sample_property_matrix',
            //                        subdataIncluded: 'metadata/column_metadata',
            //                        subdataPath: 'metadata.column_metadata',
            //                        // custom function to collect
            //                        map: function (subdata) {
            //                            var collected = {};
            //                            Object.keys(subdata).forEach(function (key) {
            //                                    var id, name, column = subdata[key];
            //                                    column.forEach(function (value) {
            //                                        if (value.category === 'DataSeries' && value.property_name === 'SeriesID') {
            //                                            id = value.property_value;
            //                                        } else if (value.category === 'Property' && value.property_name === 'Name') {
            //                                            name = value.property_value;
            //                                        }
            //                                        if (id && name) {
            //                                            collected[id] = name;
            //                                        }
            //                                    });
            //                                });
            //                                return Object.keys(collected).map(function (key) {
            //                                    return {
            //                                        id: key,
            //                                        desc: collected[key]
            //                                    };
            //                                })
            //                                    .sort(function (a, b) {
            //                                        if (a.desc < b.desc) {
            //                                            return -1;
            //                                        } else if (a.desc > b.desc) {
            //                                            return 1;
            //                                        }
            //                                        return 0;
            //                                    });
            //                        }
            //                    };
        case 'struct':
            break;
        case 'unspecified':
            // a bunch of field types are untyped, and there are no
            // options for them...
            switch (fieldType) {
            case 'text':
            case 'checkbox':
            case 'textarea':
            case 'dropdown':
            case 'custom_button':
            case 'textsubdata':
            case 'file':
            case 'custom_textsubdata':
            case 'custom_widget':
            case 'tab':
                break;
            default:
                throw new Error('Unknown unspecified field type');
            }
            break;
        default:
            console.error('Unknown data type', dataType);
            throw new Error('Unknown data type');
        }
        if (constraints) {
            Object.keys(constraints).forEach(function (key) {
                converted.data.constraints[key] = constraints[key];
            });
        }
    }


    // Stepwise conversion

    // now with grouped params

    function convertParameter(spec) {
        var dataType = grokDataType(spec);
        var multiple = (spec.allow_multiple ? true : false);
        var required = (spec.optional ? false : true);
        var converted = {
            id: spec.id,
            multipleItems: multiple,
            ui: {
                label: spec.ui_name,
                hint: spec.short_hint,
                description: spec.description,
                class: spec.ui_class,
                type: spec.field_type,
                control: spec.field_type
            },
            data: {
                type: dataType,
                constraints: {
                    required: required
                }
            }
        };

        updateNullValue(converted, spec);
        updateDefaultValue(converted, spec);
        updateConstraints(converted, spec);

        return converted;
    }

    function convertGroupList(group, params) {
        var defaultValue = [];
        var nullValue = [];
        var structSpec = {
            id: group.id,
            multipleItems: true,
            ui: {
                label: group.ui_name,
                description: group.description,
                hint: group.short_hint,
                class: group.ui_class || 'parameter',
                control: '',
                layout: group.parameter_ids
            },
            data: {
                type: '[]struct',
                constraints: {
                    required: (function () {
                        if (group.optional === 1) {
                            return false;
                        }
                        return true;
                    })
                },
                defaultValue: defaultValue,
                nullValue: nullValue
            },
            // may not need this, but it is consistent with struct.
            parameters: {
                layout: ['item'],
                specs: {
                    item: convertGroupToStruct(group, params)
                }
            }
        };
        params[group.id] = structSpec;

        return structSpec;
    }

    function convertGroupToStruct(group, params) {
        // Collect params into group and remove from original params collection.
        var groupParams = {};
        group.parameter_ids.forEach(function (id) {
            groupParams[id] = params[id];
            delete params[id];
        });
        var defaultValue = {};
        var nullValue = {};
        // Default value is a struct of default values of the
        // struct members. Note that this is fundamentally different
        // from a list of structs/ groups.
        Object.keys(groupParams).forEach(function (id) {
            // console.log('STRUCT DEF', id, groupParams)
            defaultValue[id] = groupParams[id].data.defaultValue;
            nullValue[id] = groupParams[id].data.nullValue;
        });
        var required;
        if (group.optional === 1) {
            required = false;
        } else {
            required = true;
        }
        var structSpec = {
            id: group.id,
            multipleItems: false,
            ui: {
                label: group.ui_name,
                description: group.description,
                hint: group.short_hint,
                class: group.ui_class || 'parameter',
                control: '',
                layout: group.parameter_ids
            },
            data: {
                type: 'struct',
                constraints: {
                    required: required
                },
                defaultValue: defaultValue,
                nullValue: nullValue
            },
            parameters: {
                layout: group.parameter_ids,
                specs: groupParams
            }
        };
        return structSpec;
    }

    function convertGroup(group, params) {
        if (group.allow_multiple === 1) {
            return convertGroupList(group, params);
        }
        var structSpec = convertGroupToStruct(group, params);
        params[group.id] = structSpec;
    }

    function convertAppSpec(sdkAppSpec) {
        // Parameters

        var parameterSpecs = {},
            parameterLayout;

        // First convert all parameters

        // Then for all groups, create a parameter of type struct,
        // and populate it with the specified parameters, removing them from
        // the top level of parameters.

        sdkAppSpec.parameters.forEach(function (parameter) {
            parameterSpecs[parameter.id] = convertParameter(parameter);
        });

        sdkAppSpec.parameter_groups.forEach(function (group) {
            convertGroup(group, parameterSpecs);
            // don't know how the group is ordered in the spec ... so just append it later.
        });

        // first filter out the paramters which have been moved into groups,
        // and then add the groups in.
        parameterLayout = sdkAppSpec.parameters
            .filter(function (parameter) {
                if (parameterSpecs[parameter.id]) {
                    return true;
                }
                return false;
            })
            .map(function (parameter) {
                return parameter.id;
            })
            .concat(sdkAppSpec.parameter_groups.map(function (group) {
                return group.id;
            }));

        return {
            parameters: {
                layout: parameterLayout,
                specs: parameterSpecs
            }
        };

        // wrap the rest of the app?


        //        return  {
        //            id: 'name',
        //
        //            multipleItems: false,
        //
        //            ui: {
        //                label: 'Reads Set Name',
        //                description: 'Name of the reads set',
        //                hint: 'The name of the set of sequence reads',
        //                class: 'parameter',
        //                control: null
        //            },
        //            data: {
        //                type: 'string',
        //                constraints: {
        //                    required: true,
        //                    rule: 'WorkspaceObjectName' // ws data_type
        //                },
        //                defaultValue: ''
        //            }
        //        };
    }

    return {
        convertAppSpec: convertAppSpec
    };
});
