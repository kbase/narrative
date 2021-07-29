define(['common/props'], (Props) => {
    'use strict';

    function coerceToBoolean(value) {
        if (!value) {
            return false;
        }
        const intValue = parseInt(value);
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
        const nullValue = (function () {
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
        })();
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
        const defaultValues = spec.default_values || [];
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
                if (!defaultValues || defaultValues.length === 0) {
                    return spec.checkbox_options.unchecked_value;
                }
                return coerceToIntBoolean(defaultValues[0]);
            case 'custom_textsubdata':
                if (!defaultValues) {
                    // ??
                }
                break;
            case 'textsubdata':
                if (spec.default_values) {
                    if (spec.default_values.length === 1 && spec.default_values[0] === '') {
                        return [];
                    }
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
        return defaultToNative(converted, defaultValues[0]);
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
            case 'file':
                // file datatype is really a file which is uploaded to shock, which results in a
                // shock file handle. maybe this field type should be "shock_file"
                return 'string';
            case 'textarea':
                return 'string';
            case 'dropdown':
                return 'string';
            case 'dynamic_dropdown':
                return 'string';
            case 'textsubdata':
                return 'subdata';
            case 'custom_textsubdata':
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
            case 'autocomplete':
                return 'string';
            case 'custom':
                return 'custom';
        }

        /*
         * Otherwise, we rely on text options to provide type information.
         */
        if (!spec.text_options) {
            // consider it plain, unconstrained text.
            return 'string';
        }
        const validateAs = spec.text_options.validate_as;
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
                    throw new Error(
                        'Unspecified ui_class, cannot determine object param data type'
                    );
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
        const dataType = converted.data.type;

        switch (dataType) {
            case 'subdata':
                converted.ui.multiSelection = spec.textsubdata_options.multiselection
                    ? true
                    : false;
                converted.ui.showSourceObject = spec.textsubdata_options.show_src_obj
                    ? true
                    : false;
                break;
            case 'customSubdata':
                if (spec.textsubdata) {
                    converted.ui.multiSelection = spec.textsubdata_options.multiselection
                        ? true
                        : false;
                } else {
                    converted.ui.multiSelection = false;
                }
                break;
        }
    }

    /*
     * These need to be really fleshed out...
     */
    function updateConstraints(converted, spec) {
        const dataType = converted.data.type;
        const fieldType = converted.ui.type;
        let constraints;

        // NOTE:
        // field_type is text or dropdown, but does not always correspond to the
        // type of control to build. E.g. selecting a workspace object is actually
        // a dropdown even though the field_type is 'text'.

        switch (dataType) {
            case 'custom':
                constraints = {
                    type: Props.getDataItem(spec, 'text_options.validate_as'),
                };
                // HACK
                converted.ui.class = 'parameter';
                break;
            case 'sequence':
                constraints = {};
                break;
            case 'string':
            case 'text':
                switch (fieldType) {
                    case 'dynamic_dropdown':
                        constraints = {
                            options: spec.text_options,
                            min_length: Props.getDataItem(spec, 'text_options.min_length', 1),
                            max_length: Props.getDataItem(spec, 'text_options.max_length', 10000),
                        };
                        break;
                    case 'text':
                        constraints = {
                            min: Props.getDataItem(spec, 'text_options.min_length'),
                            max: Props.getDataItem(spec, 'text_options.max_length'),
                            regexp: Props.getDataItem(spec, 'text_options.regex_constraint'),
                            validate: Props.getDataItem(spec, 'text_options.validate_as'),
                        };
                        break;
                    case 'dropdown':
                        constraints = {
                            options: spec.dropdown_options ? spec.dropdown_options.options : {},
                        };
                        break;
                    case 'textarea':
                        constraints = {
                            min: Props.getDataItem(spec, 'text_options.min_length'),
                            max: Props.getDataItem(spec, 'text_options.max_length'),
                            nRows: Props.getDataItem(spec, 'text_options.n_rows', 5),
                        };
                        break;
                    case 'autocomplete':
                        constraints = {};
                        break;
                    case 'file':
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
                            max: Props.getDataItem(spec, 'text_options.max_int'),
                        };
                        break;
                    case 'checkbox':
                        // In theory, the checkbox
                        constraints = {
                            min: 0,
                            max: 0,
                        };
                        break;
                }
                break;
            case 'float':
                constraints = {
                    min: Props.getDataItem(spec, 'text_options.min_float'),
                    max: Props.getDataItem(spec, 'text_options.max_float'),
                };
                break;
            case 'workspaceObjectRef':
            case 'workspaceObjectName':
                constraints = {
                    types: spec.text_options.valid_ws_types,
                };
                break;
            case '[]string':
                switch (fieldType) {
                    case 'dynamic_dropdown':
                        constraints = {
                            options: spec.text_options,
                        };
                        break;
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
                    subdataSelection: spec.textsubdata_options.subdata_selection,
                };
                break;
            case 'customSubdata':
                constraints = {
                    multiple: false,
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
                    case 'dynamic_dropdown':
                    case 'custom_button':
                    case 'textsubdata':
                    case 'file':
                    case 'custom_textsubdata':
                    case 'custom_widget':
                    case 'tab':
                        break;
                    default:
                        console.error('ERROR unspecified field type', converted, spec);
                        throw new Error('Unknown unspecified field type');
                }
                break;
            default:
                console.error('Unknown data type', dataType);
                throw new Error('Unknown data type: ' + dataType);
        }
        if (constraints) {
            Object.keys(constraints).forEach((key) => {
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
        const dataType = grokDataType(spec);

        const required = spec.optional ? false : true;

        // This is the spec that applies to each item in the sequence.
        // It is essentially like the main spec, but is not a sequence
        // and they don't have a default value.
        // The sequence, if it has a default value sequence, will
        // be responsible for creating a sequence of values using
        // those default values.
        const itemSpec = {
            id: null,
            ui: {
                label: spec.ui_name,
                hint: spec.short_hint,
                description: spec.description,
                class: spec.ui_class,
                type: spec.field_type,
                control: spec.field_type,
                // If embedded in an advanced sequence control,
                // the subcontrol does not need the advanced flag.
                advanced: false,
            },
            data: {
                type: dataType,
                sequence: false,
                constraints: {
                    required: required,
                },
                defaultValue: null,
            },
            original: spec,
        };
        updateNullValue(itemSpec, spec);
        updateDefaultValue(itemSpec, spec);
        updateConstraints(itemSpec, spec);
        updateUI(itemSpec, spec);
        updateData(itemSpec, spec);

        const converted = {
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
                advanced: spec.advanced ? true : false,
            },
            data: {
                type: 'sequence',
                constraints: {
                    required: required,
                },
                defaultValue: [],
                nullValue: null,
            },
            parameters: {
                layout: ['item'],
                specs: {
                    item: itemSpec,
                },
            },
        };

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
                    multiselection: 1,
                };
            } else {
                return convertSequenceParameter(spec);
            }
        }
        const multiple = spec.allow_multiple ? true : false;
        const dataType = grokDataType(spec);

        const required = spec.optional ? false : true;
        const converted = {
            id: spec.id,
            multipleItems: multiple,
            ui: {
                label: spec.ui_name,
                hint: spec.short_hint,
                description: spec.description,
                class: spec.ui_class,
                type: spec.field_type,
                control: spec.field_type,
                advanced: spec.advanced ? true : false,
            },
            data: {
                type: dataType,
                sequence: multiple,
                constraints: {
                    required: required,
                },
            },
            original: spec,
        };

        updateNullValue(converted, spec);
        updateDefaultValue(converted, spec);
        updateConstraints(converted, spec);
        updateUI(converted, spec);
        updateData(converted, spec);

        return converted;
    }

    function convertGroupToStruct(group, params) {
        // Collect params into group and remove from original params collection.
        const groupParams = {};
        group.parameter_ids.forEach((id) => {
            groupParams[id] = params[id];
            delete params[id];

            // TODO: figure out what to do with advanced params within groups
            groupParams[id].ui.advanced = false;
        });
        const required = group.optional ? false : true;

        let defaultValue;
        let nullValue;
        let zeroValue;

        nullValue = null;
        defaultValue = {};
        Object.keys(groupParams).forEach((id) => {
            defaultValue[id] = groupParams[id].data.defaultValue;
        });
        zeroValue = defaultValue;

        const structSpec = {
            id: group.id,
            multipleItems: false,
            ui: {
                label: group.ui_name,
                description: group.description,
                hint: group.short_hint,
                class: group.ui_class || 'parameter',
                control: '',
                layout: group.parameter_ids,
                advanced: group.advanced ? true : false,
            },
            data: {
                type: 'struct',
                constraints: {
                    required: required,
                },
                defaultValue: defaultValue,
                nullValue: nullValue,
                zeroValue: zeroValue,
            },
            parameters: {
                layout: group.parameter_ids,
                specs: groupParams,
            },
        };
        return structSpec;
    }

    // just differs from the makeParameterSequence in that the
    // group spec is not as fully populated, so we have to
    // fill in some gaps.
    function makeGroupSequence(spec, itemSpec) {
        // in the context of a sequence, a struct is always "required",
        // no matter what the spec says.
        // itemSpec.data.constraints.required = true;

        // Okay, we can no longer piggy back the feature which allows a user
        // to collapse a struct with the optional/required constraint.
        // We introduce a new "disableable" - http://www.urbandictionary.com/define.php?term=disableable
        itemSpec.data.constraints.disableable = false;

        const required = spec.optional ? false : true;
        const converted = {
            id: spec.id,
            // TODO we should be able to remove this.
            multipleItems: true,
            ui: {
                label: spec.ui_name,
                hint: spec.short_hint,
                description: spec.description,
                class: 'parameter',
                advanced: spec.advanced ? true : false,
            },
            data: {
                type: 'sequence',
                constraints: {
                    required: required,
                },
                defaultValue: [],
                nullValue: null,
            },
            parameters: {
                layout: ['item'],
                specs: {
                    item: itemSpec,
                },
            },
        };

        updateConstraints(converted, spec);
        updateUI(converted, spec);
        updateData(converted, spec);

        return converted;
    }

    function convertGroup(group, params) {
        const structSpec = convertGroupToStruct(group, params);

        // Skip groups with no parameters.
        // A spec which defines a group with no members should probably not
        // validate locally or when registering in the catalog.
        // Skipping them here because it is not worth coding around this case
        if (structSpec.parameters.layout.length === 0) {
            throw new Error('Empty parameter group not allowed in ' + group.id);
        }

        if (group.allow_multiple === 1) {
            params[group.id] = makeGroupSequence(group, structSpec);
        } else {
            params[group.id] = structSpec;
        }

        // The first parameter defines the position of the group within the parameter layout.
        params[group.id]._position =
            structSpec.parameters.specs[structSpec.parameters.layout[0]]._position;
    }

    function convertAppSpec(sdkAppSpec) {
        // Parameters
        let parameterSpecs = {},
            parameterLayout;

        // First convert all parameters

        // Then for all groups, create a parameter of type struct,
        // and populate it with the specified parameters, removing them from
        // the top level of parameters.

        sdkAppSpec.parameters.forEach((parameter, index) => {
            parameterSpecs[parameter.id] = convertParameter(parameter);
            parameterSpecs[parameter.id]._position = index;
        });

        let groups = [];
        if (sdkAppSpec.parameter_groups) {
            groups = sdkAppSpec.parameter_groups;
            sdkAppSpec.parameter_groups.forEach((group) => {
                convertGroup(group, parameterSpecs);
                // don't know how the group is ordered in the spec ... so just append it later.
            });
        }

        // first filter out the paramters which have been moved into groups,
        // and then add the groups in.
        parameterLayout = sdkAppSpec.parameters
            .filter((parameter) => {
                if (parameterSpecs[parameter.id]) {
                    return true;
                }
                return false;
            })
            .map((parameter) => {
                return {
                    position: parameterSpecs[parameter.id]._position,
                    id: parameter.id,
                };
            })
            .concat(
                groups
                    // first filter out any groups which were not added to the parameters.
                    // This includes ones with no parameters specified
                    .filter((group) => {
                        if (parameterSpecs[group.id]) {
                            return true;
                        }
                        return false;
                    })
                    .map((group) => {
                        return {
                            position: parameterSpecs[group.id]._position,
                            id: group.id,
                        };
                    })
            );

        const sortedLayout = parameterLayout
            .sort((a, b) => {
                if (a.position < b.position) {
                    return -1;
                } else if (a.position === b.position) {
                    return 0;
                }
                return 1;
            })
            .map((item) => {
                return item.id;
            });

        return {
            parameters: {
                layout: sortedLayout,
                specs: parameterSpecs,
            },
        };
    }

    return {
        convertAppSpec: convertAppSpec,
    };
});
