/*global define*/
/*jslint browser:true,white:true,single:true*/

define([
    'common/props'
], function(
    Props
) {
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
        var nullValue = (function() {
            switch (converted.data.type) {
                case 'string':
                    return '';
                case 'int':
                    return null;
                case 'float':
                    return null;
                case 'workspaceObjectRef':
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
            case 'workspaceObjectRef':
                if (defaultValue === '') {
                    return null;
                }
                return defaultValue;
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
            case 'text_subdata':
                if (spec.default_values) {
                    return spec.default_values[0].split(',');
                } else {
                    return [];
                }
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
        //if (!spec.allow_multiple) {
            return defaultToNative(converted, defaultValues[0]);
        //}
        //return defaultValues.map(function(defaultValue) {
        //    return defaultToNative(converted, defaultValue);
        //});
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
                return 'string';
                // if (spec.allow_multiple) {
                //     return '[]string';
                // } else {
                //     return 'string';
                // }
            case 'textsubdata':
                return 'subdata';
            case 'custom_textsubdata':
                //if (spec.allow_multiple) {
                //    return '[]string';
                //}
                // return 'string';
                //var custom = customTextSubdata();
                //if (custom) {
                //    return custom;
                //}
                return 'customSubdata';
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
            case 'autocomplete':
                return 'string';
        }

        /*
         * Otherwise, we rely on text options to provide type information.
         */
        if (!spec.text_options) {
            // consider it plain, unconstrained text.
            return 'string';
        }
        var validateAs = spec.text_options.validate_as;
        if (validateAs) {
            // For int and float, "validateAs" overrides the type.
            if (validateAs === 'int' || validateAs === 'float') {
                return validateAs;
            }
        }

        // Some parameter specs have valid_ws_types as an empty set, which
        // does not mean what it could, it means that it is not an option.
        if (spec.text_options.valid_ws_types && spec.text_options.valid_ws_types.length > 0) {
            // we now have refs, but no way of specifying that the 
            switch (spec.ui_class) {
                case 'input':
                case 'parameter':
                    // input objects are any valid ws object reference:
                    // name, traditional ref, ref path.
                    return 'workspaceObjectRef';
                case 'output':
                    return 'workspaceObjectName';
                default:
                    throw new Error('Unspecified ui_class, cannot determine object param data type');
            }
        }

        // Okay, if it has no specific type assigned (validate_as), and is
        // not flagged from the various properties above by grousing through
        // the text_options, we assume it is a string.

        switch (spec.field_type) {
            case 'text':
                return 'string';
        }

        console.error('ERROR could not determine type from spec', spec);

        throw new Error('Type could not be determined from the spec.');
    }

    function updateUI(converted, spec) {
        var dataType = converted.data.type;
        var fieldType = converted.ui.type;
        var paramClass = converted.ui.class;

        switch (dataType) {
            case 'subdata':
                converted.ui.multiSelection = spec.textsubdata_options.multiselection ? true : false;
                converted.ui.showSourceObject = spec.textsubdata_options.show_src_obj ? true : false;
                break;
            case 'customSubdata':
                converted.ui.multiSelection = spec.textsubdata_options.multiselection ? true : false;
                // converted.ui.showSourceObject = spec.textsubdata_options.show_src_obj ? true : false;
                break;
        }

    }

    /*
     * These need to be really fleshed out...
     */
    function updateConstraints(converted, spec) {
        var dataType = converted.data.type;
        var fieldType = converted.ui.type;
        var paramClass = converted.ui.class;
        var constraints;

        // NOTE:
        // field_type is text or dropdown, but does not always correspond to the
        // type of control to build. E.g. selecting a workspace object is actually
        // a dropdown even though the field_type is 'text'.

        switch (dataType) {
            case 'sequence':
                constraints = {};
                break;
            case 'string':
            case 'text':
                switch (fieldType) {
                    case 'text':
                        constraints = {
                            min: Props.getDataItem(spec, 'text_options.min_length'),
                            max: Props.getDataItem(spec, 'text_options.max_length'),
                            validate: Props.getDataItem(spec, 'text_options.validate_as')
                        };
                        break;
                    case 'dropdown':
                        constraints = {
                            options: spec.dropdown_options.options
                        };
                        break;
                    case 'textarea':
                        constraints = {
                            min: Props.getDataItem(spec, 'text_options.min_length'),
                            max: Props.getDataItem(spec, 'text_options.max_length'),
                            nRows: Props.getDataItem(spec, 'text_options.n_rows', 5)
                        };
                        break;
                    case 'autocomplete':
                        constraints = {};
                        break;
                    default:
                        throw new Error('Unknown text param field type "' + fieldType + '"');
                }
                break;
            case 'int':
                switch (fieldType) {
                    case 'text':
                        constraints = {
                            min: Props.getDataItem(spec, 'text_options.min_int'),
                            max: Props.getDataItem(spec, 'text_options.max_int')
                        };
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
                constraints = {
                    min: Props.getDataItem(spec, 'text_options.min_float'),
                    max: Props.getDataItem(spec, 'text_options.max_float')
                };
                break;
            case 'workspaceObjectRef':
            case 'workspaceObjectName':
                constraints = {
                    types: spec.text_options.valid_ws_types
                };
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
                        // throw new Error('Unknown []string field type: ' + fieldType);
                }
                break;
            case 'subdata':

                constraints = {
                    multiple: false,
                    subdataSelection: spec.textsubdata_options.subdata_selection

                    //     // The parameter containing the object name we derive data from
                    //     referredParameter: spec.textsubdata_options.subdata_selection.parameter_id,
                    //     // The "included" parameter to for the workspace call
                    //     subdataIncluded: spec.textsubdata_options.subdata_selection.subdata_included,
                    //     // These are for navigating the results.

                    //     // This is the property path to the part of the subdata
                    //     // we want to deal with.
                    //     path: spec.textsubdata_options.subdata_selection.path_to_subdata,
                    //     // This is used to pluck a value off of the leaf array
                    //     // items, object properties (if object), object values (if 'value'),
                    //     // or otherwise just use the property key. This becomes the "id"
                    //     // of the subdata item.
                    //     selectionId: spec.textsubdata_options.subdata_selection.selection_id,
                    //     // Used to generate a description for each item. Becomes the "desc".
                    //     displayTemplate: spec.textsubdata_options.subdata_selection.description_template
                    // }
                };
                break;
            case 'customSubdata':
                constraints = {
                    multiple: false
                };
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
                        console.log('ERROR unspecified field type', converted, spec)
                        throw new Error('Unknown unspecified field type');
                }
                break;
            default:
                console.error('Unknown data type', dataType);
                throw new Error('Unknown data type: ' + dataType);
        }
        if (constraints) {
            Object.keys(constraints).forEach(function(key) {
                converted.data.constraints[key] = constraints[key];
            });
        }
    }


    // Stepwise conversion
    function updateData(converted, spec) {
        switch (converted.data.type) {
            case 'subdata':
                converted.data.multiple = spec.textsubdata_options.multipleitems ? true : false;
                break;
            default:
        }
    }

    // now with grouped params

    function convertSequenceParameter(spec) {
        var dataType = grokDataType(spec);

        var required = (spec.optional ? false : true);

        // This is the spec that applies to each item in the sequence.
        // It is essentially like the main spec, but is not a sequence
        // and they don't have a default value.
        // The sequence, if it has a default value sequence, will 
        // be responsible for creating a sequence of values using
        // those default values.
        var itemSpec = {
            id: null,
            ui: {
                label: spec.ui_name,
                hint: spec.short_hint,
                description: spec.description,
                class: spec.ui_class,
                type: spec.field_type,
                control: spec.field_type,
                advanced: spec.advanced ? true : false
            },
            data: {
                type: dataType,
                sequence: false,
                constraints: {
                    required: false
                },
                defaultValue: null
            }
        };
        updateNullValue(itemSpec, spec);
        updateDefaultValue(itemSpec, spec);
        updateConstraints(itemSpec, spec);
        updateUI(itemSpec, spec);
        updateData(itemSpec, spec);

        var converted = {
            id: spec.id,
            // TODO we should be able to remove this.
            multipleItems: true,
            ui: {
                label: spec.ui_name,
                hint: spec.short_hint,
                description: spec.description,
                class: spec.ui_class,
                type: spec.field_type,
                control: spec.field_type,
                advanced: spec.advanced ? true : false
            },
            data: {
                type: 'sequence',
                constraints: {
                    required: required
                },
                defaultValue: [],
                nullValue: null
            },
            parameters: {
                layout: ['item'],
                specs: {
                    item: itemSpec
                }
            }
        };

        // updateNullValue(converted, spec);
        // updateDefaultValue(converted, spec);
        updateConstraints(converted, spec);
        updateUI(converted, spec);
        updateData(converted, spec);

        return converted;
    }

    function convertParameter(spec) {
        if (spec.allow_multiple) {
            // except, ahem, for the custom_subdata, at least for now...
            if (spec.field_type === 'custom_textsubdata') {
                spec.allow_multiple === 0;
                spec.textsubdata_options = {
                    multiselection: 1
                };
            } else {
                return convertSequenceParameter(spec);
            }
        }
        var multiple = (spec.allow_multiple ? true : false);
        var dataType = grokDataType(spec);

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
                control: spec.field_type,
                advanced: spec.advanced ? true : false
            },
            data: {
                type: dataType,
                sequence: multiple,
                constraints: {
                    required: required
                }
            },
            original: spec
        };

        updateNullValue(converted, spec);
        updateDefaultValue(converted, spec);
        updateConstraints(converted, spec);
        updateUI(converted, spec);
        updateData(converted, spec);

        return converted;
    }

    function convertGroupList(group, params) {
        var defaultValue = [];
        var nullValue = [];
        var itemSpec = convertGroupToStruct(group, params);
        // A list-embedded struct is always required.
        itemSpec.data.constraints.required = true;
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
                    required: (function() {
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
                    item: itemSpec
                }
            }
        };
        params[group.id] = structSpec;

        return structSpec;
    }

    function convertGroupToStruct(group, params, options) {
        // Collect params into group and remove from original params collection.
        var groupParams = {};
        group.parameter_ids.forEach(function(id) {
            groupParams[id] = params[id];
            delete params[id];

            // TODO: figure out what to do with advanced params within groups
            groupParams[id].ui.advanced = false;
        });
        var required;
        if (group.optional === 1) {
            required = false;
        } else {
            required = true;
        }

        var defaultValue;
        var nullValue;
        var zeroValue;
        // if (required) {
        //     // Default value is a struct of default values of the
        //     // struct members. Note that this is fundamentally different
        //     // from a list of structs/ groups.
        //     defaultValue = {};
        //     nullValue = {};
        //     Object.keys(groupParams).forEach(function(id) {
        //         defaultValue[id] = groupParams[id].data.defaultValue;
        //         nullValue[id] = groupParams[id].data.nullValue;
        //     });
        //     zeroValue = defaultValue;
        // } else {
        //     defaultValue = null;
        //     nullValue = null;
        //     zeroValue = {};
        //     // TODO: use the initial or "0" value for each paramter as well.
        //     Object.keys(groupParams).forEach(function(id) {
        //         zeroValue[id] = groupParams[id].data.defaultValue;
        //     });
        // }


        nullValue = null;
        defaultValue = {};
        Object.keys(groupParams).forEach(function(id) {
            defaultValue[id] = groupParams[id].data.defaultValue;
            //  nullValue[id] = groupParams[id].data.nullValue;
        });
        zeroValue = defaultValue;

        var structSpec = {
            id: group.id,
            multipleItems: false,
            ui: {
                label: group.ui_name,
                description: group.description,
                hint: group.short_hint,
                class: group.ui_class || 'parameter',
                control: '',
                layout: group.parameter_ids,
                advanced: group.advanced ? true : false
            },
            data: {
                type: 'struct',
                constraints: {
                    required: required
                },
                defaultValue: defaultValue,
                nullValue: nullValue,
                zeroValue: zeroValue
            },
            parameters: {
                layout: group.parameter_ids,
                specs: groupParams
            }
        };
        return structSpec;
    }

    // just differs from the makeParameterSequence in that the 
    // group spec is not as fully populated, so we have to
    // fill in some gaps.
    function makeGroupSequence(spec, itemSpec) {

        // in the context of a sequence, a struct is always "required",
        // no matter what the spec says.
        itemSpec.data.constraints.required = true;

        var required = (spec.optional ? false : true);
        var converted = {
            id: spec.id,
            // TODO we should be able to remove this.
            multipleItems: true,
            ui: {
                label: spec.ui_name,
                hint: spec.short_hint,
                description: spec.description,
                class: 'parameter',
                // type: spec.field_type,
                // control: spec.field_type,
                advanced: spec.advanced ? true : false
            },
            data: {
                type: 'sequence',
                constraints: {
                    required: required
                },
                defaultValue: [],
                nullValue: null
            },
            parameters: {
                layout: ['item'],
                specs: {
                    item: itemSpec
                }
            }
        };

        // updateNullValue(converted, spec);
        // updateDefaultValue(converted, spec);
        updateConstraints(converted, spec);
        updateUI(converted, spec);
        updateData(converted, spec);

        return converted;
    }

    function convertGroup(group, params) {
        if (group.allow_multiple === 1) {
            var structSpec = convertGroupToStruct(group, params);
            params[group.id] = makeGroupSequence(group, structSpec);
        } else {
            params[group.id] = convertGroupToStruct(group, params);
        }
    }

    function convertAppSpec(sdkAppSpec) {
        // Parameters

        var parameterSpecs = {},
            parameterLayout;

        // First convert all parameters

        // Then for all groups, create a parameter of type struct,
        // and populate it with the specified parameters, removing them from
        // the top level of parameters.

        sdkAppSpec.parameters.forEach(function(parameter) {
            parameterSpecs[parameter.id] = convertParameter(parameter);
        });

        var groups = [];
        if (sdkAppSpec.parameter_groups) {
            groups = sdkAppSpec.parameter_groups;
            sdkAppSpec.parameter_groups.forEach(function(group) {
                convertGroup(group, parameterSpecs);
                // don't know how the group is ordered in the spec ... so just append it later.
            });
        }

        // first filter out the paramters which have been moved into groups,
        // and then add the groups in.
        parameterLayout = sdkAppSpec.parameters
            .filter(function(parameter) {
                if (parameterSpecs[parameter.id]) {
                    return true;
                }
                return false;
            })
            .map(function(parameter) {
                return parameter.id;
            })
            .concat(groups.map(function(group) {
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