/*global define*/
/*jslint white:true,browser:true*/

define([
    'bluebird',
    'require',
    './input/errorInput'
], function(
    Promise,
    require,
    ErrorInputWidget
) {
    'use strict';

    function factory(config) {

        /*
         * For a given parameter spec, return a more canonical, simpler
         * representation.
         * The paramter spec is rather baroque, and undocumented.
         * We want the input widgets to rely on documented structures, which
         * assists in documentation and testing, and also in generation of
         * specs for subwidgets.
         * Also as this just concerns constraints for the base type,
         * the
         */
        function getParamConstraints(parameterSpec) {
            var dataType = parameterSpec.data.type,
                spec = parameterSpec.spec,
                fieldType = spec.ui.fieldType;

            // NOTE:
            // field_type is text or dropdown, but does not always correspond to the
            // type of control to build. E.g. selecting a workspace object is actually
            // a dropdown even though the field_type is 'text'.

            switch (dataType) {
                case 'string':
                case 'text':
                    switch (fieldType) {
                        case 'text':
                            return {};
                        case 'dropdown':
                            return {};
                        default:
                            throw new Error('Unknown text param field type');
                    }
                case 'int':
                    switch (fieldType) {
                        case 'text':
                            return {};
                        case 'checkbox':
                            return {};
                        default:
                            return {};
                    }
                case 'float':
                    return {};
                case 'workspaceObjectName':
                    switch (parameterSpec.ui.class) {
                        case 'input':
                            return {
                                required: spec.data.contraints.required,
                                types: spec.text_options.valid_ws_types,
                                defaultValues: spec.default_values
                            };
                        case 'output':
                            return {
                                required: spec.required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValues: spec.default_values
                            };
                        case 'parameter':
                            return {
                                required: spec.required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValues: spec.default_values
                            };
                        default:
                            throw new Error('Unknown workspaceObjectName ui class');
                    }
                case '[]string':
                    switch (fieldType) {
                        case 'dropdown':
                            return {};
                        case 'textarea':
                            return {};
                        default:
                            throw new Error('Unknown []string field type');
                    }
                case 'unspecified':
                    // a bunch of field types are untyped:
                    switch (fieldType) {
                        case 'text':
                            return {};
                        case 'checkbox':
                            return {};
                        case 'textarea':
                            return {};
                        case 'dropdown':
                            return {};
                        case 'custom_button':
                            return {};
                        case 'textsubdata':
                            return {};
                        case 'file':
                            return {};
                        case 'custom_textsubdata':
                            return {};
                        case 'custom_widget':
                            return {};
                        case 'tab':
                            return {};
                        case 'reads_group_editor':
                            return {};
                        default:
                            throw new Error('Unknown unspecified field type');
                    }
                default:
                    throw new Error('Unknown data type');

            }
        }

        function getInputWidgetModule(spec) {
            var dataType = spec.data.type,
                controlType = spec.ui.control;

            // NOTE:
            // field_type is text or dropdown, but does not always correspond to the
            // type of control to build. E.g. selecting a workspace object is actually
            // a dropdown even though the field_type is 'text'.

            // console.log('get input widget module', dataType, spec, fieldType);

            switch (dataType) {
                case 'string':
                case 'text':
                    if (spec.multipleItems) {
                        return 'undefinedInput';
                    }
                    switch (controlType) {
                        case 'dropdown':
                            return 'singleSelectInput';
                        case 'textarea':
                            return 'singleTextareaInput';
                        case 'file':
                            return 'singleFileInput';
                        case 'custom_textsubdata':
                            return 'customSubdata';
                        case 'autocomplete':
                            return 'autocompleteSingleTextInput';
                        case 'text':
                        default:
                            // A string type is normally entered as a 
                            // simple text input.
                            return 'singleTextInput';
                    }
                case 'int':
                    switch (controlType) {
                        case 'text':
                            if (spec.multipleItems) {
                                return 'multiIntInput';
                            }
                            return 'singleIntInput';
                        case 'checkbox':
                            return 'singleCheckboxInput';
                        default:
                            if (spec.multipleItems) {
                                return 'multiIntInput';
                            }
                            return 'singleIntInput';
                    }
                case '[]int':
                    switch (controlType) {
                        case 'checkbox':
                            return 'undefinedInput';
                        case 'text':
                        default:
                            return 'multiIntInput';
                    }
                case 'float':
                    return 'singleFloatInput';
                case '[]float':
                    return 'multiFloatInput';
                case 'workspaceObjectName':
                    switch (spec.ui.class) {
                        case 'input':
                            return 'singleObjectInput';
                        case 'output':
                            return 'singleNewObjectInput';
                        case 'parameter':
                            return 'singleObjectInput';
                        default:
                            return 'undefinedInput';
                    }
                case '[]workspaceObjectName':
                    switch (spec.ui.class) {
                        case 'input':
                            return 'multiObjectInput';
                        case 'output':
                            return ErrorInputWidget.make({
                                message: 'A set of workspace object names does not make sense for an output'
                            });
                        case 'parameter':
                            return 'multiObjectInput';
                        default:
                            return 'undefinedInput';
                    }
                case 'workspaceObjectRef':
                    switch (spec.ui.class) {
                        case 'input':
                            return 'singleObjectRefInput';
                        case 'output':
                            return 'undefinedInput';
                        case 'parameter':
                            return 'singleObjectRefInput';
                        default:
                            return 'undefinedInput';
                    }
                case 'subdata':
                    return 'singleSubdata';
                case '[]string':
                    switch (controlType) {
                        case 'dropdown':
                            return 'multiSelectInput';
                        case 'textarea':
                            return 'multiTextareaInput';
                        case 'custom_textsubdata':
                            return 'CustomSubdata';
                        case 'custom_widget':
                            if (spec.multipleItems) {
                                return 'multiCustomSelect';
                            }
                            return 'singleCustomSelect';
                        default:
                            return 'multiTextInput';
                    }
                case 'boolean':
                    if (spec.multipleItems) {
                        return 'undefinedInput';
                    }
                    return 'singleToggleButton';
                case 'struct':
                    return 'structInput';
                case '[]struct':
                    return 'multiStructInput';
                case '{}string':
                    return 'mapInput';


                    //case 'sample_property':
                    //    return singleCustomSubdata;
                case 'unspecified':
                    // a bunch of field types are untyped:
                    switch (controlType) {
                        case 'text':
                            if (spec.multipleItems) {
                                return 'multiTextInput';
                            }
                            return 'singleTextInput';
                        case 'checkbox':
                            return 'singleCheckboxInput';
                        case 'textarea':
                            return 'singleTextareaInput';
                        case 'dropdown':
                            if (spec.multipleItems) {
                                return 'undefinedInput';
                            }
                            return 'singleSelectInput';
                        case 'custom_button':
                            return 'undefinedInput';
                        case 'textsubdata':
                            if (spec.multipleItems) {
                                return 'undefinedInput';
                            }
                            return 'singleSubdata';
                        case 'file':
                            if (spec.multipleItems) {
                                return ErrorInputWidget.make({
                                    message: 'multiple item "file" parameter type is not currently supported'
                                });
                            }
                            return 'singleFileInput';
                        case 'custom_textsubdata':
                            if (spec.multipleItems) {
                                return 'undefinedInput';
                            }
                            return 'singleSubdata';
                        case 'custom_widget':
                            return 'singleCustomSelect';
                        case 'tab':
                            return 'undefinedInput';
                        case 'reads_group_editor':
                            return 'ReadsGroupEditor';
                        default:
                            return 'undefinedInput';
                    }
                default:
                    return 'undefinedInput';
                    // return makeUnknownInput;
            }
        }

        function loadModule(name) {
            return new Promise(function(resolve, reject) {
                require(['./input/' + name], function(Module) {
                    resolve(Module);
                }, function(err) {
                    reject(err);
                });
            });
        }

        function getInputWidgetFactory(parameterSpec) {
            //console.log('getting input widget...', parameterSpec);
            var module = getInputWidgetModule(parameterSpec);
            // console.log('got it', module);
            if (typeof module === 'string') {
                return loadModule(module);
            } else {
                return Promise.try((function() {
                    return module;
                }));
            }
        }

        return {
            getInputWidgetFactory: getInputWidgetFactory
        };
    }
    return {
        make: function(config) {
            return factory(config);
        }
    };
});