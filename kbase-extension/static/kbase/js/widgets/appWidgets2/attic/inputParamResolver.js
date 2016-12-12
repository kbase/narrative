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

        function getInputWidgetModule(spec) {
            var dataType = spec.data.type,
                controlType = spec.ui.control;

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
                case 'sequence':
                    return 'sequenceInput';
                case 'int':
                    switch (controlType) {
                        case 'text':
                            if (spec.multipleItems) {
                                return 'arrayInput';
                            }
                            return 'singleIntInput';
                        case 'checkbox':
                            return 'singleCheckboxInput';
                        default:
                            if (spec.multipleItems) {
                                return 'arrayInput';
                            }
                            return 'singleIntInput';
                    }
                case '[]int':
                    switch (controlType) {
                        case 'checkbox':
                            return 'undefinedInput';
                        case 'text':
                        default:
                            return 'arrayInput';
                    }
                case 'float':
                    return 'singleFloatInput';
                case '[]float':
                    return 'multiFloatInput';
                case 'workspaceObjectRef':
                    switch (spec.ui.class) {
                        case 'input':
                            //return 'singleObjectInput';
                            return 'select2ObjectInput';
                        case 'parameter':
                            // return 'singleObjectInput';
                            return 'select2ObjectInput';
                        default:
                            return 'undefinedInput';
                    }
                case 'workspaceObjectName':
                    switch (spec.ui.class) {
                        // case 'input':
                        //     return 'singleObjectInput';
                        //     // return 'select2ObjectInput';
                        case 'output':
                            return 'singleNewObjectInput';
                        case 'parameter':
                            return 'singleObjectInput';
                            // return 'select2ObjectInput';
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
                    // case 'workspaceObjectRef':
                    //     switch (spec.ui.class) {
                    //         case 'input':
                    //             return 'singleObjectInput';
                    //             // return 'select2ObjectInput';
                    //         case 'output':
                    //             return 'undefinedInput';
                    //         case 'parameter':
                    //             return 'singleObjectInput';
                    //             // return 'select2ObjectInput';
                    //         default:
                    //             return 'undefinedInput';
                    //     }
                case 'subdata':
                    return 'singleSubdata';
                case 'customSubdata':
                    return 'customSubdata';
                    // case '[]string':
                    //     switch (controlType) {
                    //         case 'dropdown':
                    //             return 'multiSelectInput';
                    //         case 'textarea':
                    //             return 'multiTextareaInput';
                    //         case 'custom_textsubdata':
                    //             return 'CustomSubdata';
                    //         case 'custom_widget':
                    //             if (spec.multipleItems) {
                    //                 return 'multiCustomSelect';
                    //             }
                    //             return 'singleCustomSelect';
                    //         default:
                    //             return 'multiTextInput';
                    //     }
                case 'boolean':
                    if (spec.multipleItems) {
                        return 'undefinedInput';
                    }
                    return 'singleToggleButton';
                case 'struct':
                    return 'singleStructInput';
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
            var module = getInputWidgetModule(parameterSpec);
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