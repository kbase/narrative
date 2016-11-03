/*global define*/
/*jslint white:true,browser:true*/

define([
    './input/singleTextInput',
    './input/multiTextInput',
    './input/singleSelectInput',
    './input/singleIntInput',
    './input/multiIntInput',
    './input/singleObjectInput',
    './input/multiObjectInput',
    './input/singleNewObjectInput',
    './input/undefinedInput',
    './input/singleCheckbox',
    './input/singleFloatInput',
    './input/singleSubdata',
    './input/customSubdata',
    './input/singleTextareaInput',
    './input/multiFloatInput',
    './input/multiSelectInput',
    './input/singleFileInput',
    './input/multiTextareaInput',
    './input/errorInput',
    './input/singleToggleButton',
    './input/singleCustomSelect',
    './input/multiCustomSelect',
    './input/readsGroupEditor'
], function (
    SingleTextInputWidget,
    MultiTextInputWidget,
    SingleSelectInputWidget,
    SingleIntInputWidget,
    MultiIntInputWidget,
    SingleObjectInputWidget,
    MultiObjectInputWidget,
    SingleNewObjectInputWidget,
    UndefinedInputWidget,
    SingleCheckboxInputWidget,
    SingleFloatInputWidget,
    SingleSubdataWidget,
    CustomSubdataWidget,
    SingleTextareaInputWidget,
    MultiFloatInputWidget,
    MultiSelectInputWidget,
    SingleFileInputWidget,
    MultiTextareaInputWidget,
    ErrorInputWidget,
    SingleToggleButtonWidget,
    SingleCustomSelectWidget,
    MultiCustomSelectWidget,
    ReadsGroupEditor
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
            var dataType = parameterSpec.dataType(),
                spec = parameterSpec.spec,
                fieldType = spec.field_type;

            // NOTE:
            // field_type is text or dropdown, but does not always correspond to the
            // type of control to build. E.g. selecting a workspace object is actually
            // a dropdown even though the field_type is 'text'.

            switch (dataType) {
                case 'string':
                case 'text':
                    switch (fieldType) {
                        case 'text':
                            return {
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
                    switch (parameterSpec.uiClass()) {
                        case 'input':
                            return {
                                required: spec.required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValues: spec.default_values,
                            };
                        case 'output':
                            return {
                                required: spec.required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValues: spec.default_values,
                            };
                        case 'parameter':
                            return {
                                required: spec.required(),
                                types: spec.text_options.valid_ws_types,
                                defaultValues: spec.default_values,
                            };
                        default:
                            throw new Error('Unknown workspaceObjectName ui class');
                    }
                case '[]string':
                    switch (fieldType) {
                        case 'dropdown':
                            return {
                            };
                        case 'textarea':
                            return {
                            };
                        default:
                            throw new Error('Unknown []string field type');
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
                        case 'reads_group_editor':
                            return {
                            };
                        default:
                            throw new Error('Unknown unspecified field type');
                    }
                default:
                    throw new Error('Unknown data type');

            }
        }

        function getInputWidgetFactory(parameterSpec) {
            var dataType = parameterSpec.dataType(),
                spec = parameterSpec.spec,
                fieldType = spec.field_type;

            // NOTE:
            // field_type is text or dropdown, but does not always correspond to the
            // type of control to build. E.g. selecting a workspace object is actually
            // a dropdown even though the field_type is 'text'.

            switch (dataType) {
                case 'string':
                case 'text':
                    if (parameterSpec.multipleItems()) {
                        return UndefinedInputWidget;
                    }
                    switch (fieldType) {
                        case 'text':
                            return SingleTextInputWidget;
                        case 'dropdown':
                            return SingleSelectInputWidget;
                        case 'textarea':
                            return SingleTextareaInputWidget;
                        case 'file':
                            return SingleFileInputWidget;
                        case 'custom_textsubdata':
                            return CustomSubdataWidget;
                        default:
                            return UndefinedInputWidget;
                    }
                case 'int':
                    switch (fieldType) {
                        case 'text':
                            if (parameterSpec.multipleItems()) {
                                return MultiIntInputWidget;
                            }
                            return SingleIntInputWidget;
                        case 'checkbox':
                            return SingleCheckboxInputWidget;
                        default:
                            if (parameterSpec.multipleItems()) {
                                return MultiIntInputWidget;
                            }
                            return SingleIntInputWidget;
                    }
                case '[]int':
                    switch (fieldType) {
                        case 'checkbox':
                            return UndefinedInputWidget;
                        case 'text':
                        default:
                            return MultiIntInputWidget;
                    }
                case 'float':
                    return SingleFloatInputWidget;
                case '[]float':
                   return  MultiFloatInputWidget;
                case 'workspaceObjectName':
                    switch (parameterSpec.uiClass()) {
                        case 'input':
                            return SingleObjectInputWidget;
                        case 'output':
                            return SingleNewObjectInputWidget;
                        case 'parameter':
                            return SingleObjectInputWidget;
                        default:
                            return UndefinedInputWidget;
                    }
                case '[]workspaceObjectName':
                    switch (parameterSpec.paramClass()) {
                        case 'input':
                            return MultiObjectInputWidget;
                        case 'output':
                            return ErrorInputWidget.make({
                                message: 'A set of workspace object names does not make sense for an output'
                            });
                        case 'parameter':
                            return UndefinedInputWidget;
                        default:
                            return UndefinedInputWidget;
                    }
                case 'subdata':
                    return SingleSubdataWidget;
                case '[]string':
                    switch (fieldType) {
                        case 'dropdown':
                            return MultiSelectInputWidget;
                        case 'textarea':
                            return MultiTextareaInputWidget;
                        case 'custom_textsubdata':
                            return CustomSubdataWidget;
                        case 'custom_widget':
                            if (parameterSpec.multipleItems()) {
                                return MultiCustomSelectWidget;
                            }
                            return SingleCustomSelectWidget;
                        default:
                            return MultiTextInputWidget;
                    }
                case 'boolean':
                    if (parameterSpec.multipleItems()) {
                        return UndefinedInputWidget;
                    }
                    return SingleToggleButtonWidget;

                //case 'sample_property':
                //    return SingleCustomSubdataWidget;
                case 'unspecified':
                    // a bunch of field types are untyped:
                    switch (fieldType) {
                        case 'text':
                            if (parameterSpec.multipleItems()) {
                                return MultiTextInputWidget;
                            }
                            return SingleTextInputWidget;
                        case 'checkbox':
                            return SingleCheckboxInputWidget;
                        case 'textarea':
                            return SingleTextareaInputWidget;
                        case 'dropdown':
                            if (parameterSpec.multipleItems()) {
                                return UndefinedInputWidget;
                            }
                            return SingleSelectInputWidget;
                        case 'custom_button':
                            return UndefinedInputWidget;
                        case 'textsubdata':
                            if (parameterSpec.multipleItems()) {
                                return UndefinedInputWidget;
                            }
                            return SingleSubdataWidget;
                        case 'file':
                            if (parameterSpec.multipleItems()) {
                                return ErrorInputWidget.make({
                                    message: 'multiple item "file" parameter type is not currently supported'
                                });
                            }
                            return SingleFileInputWidget;
                        case 'custom_textsubdata':
                            if (parameterSpec.multipleItems()) {
                                return UndefinedInputWidget;
                            }
                            return SingleSubdataWidget;
                        case 'custom_widget':
                            return SingleCustomSelectWidget;
                        case 'tab':
                            return UndefinedInputWidget;
                        case 'reads_group_editor':
                            return ReadsGroupEditor;
                        default:
                            return UndefinedInputWidget;
                    }
                default:
                    return UndefinedInputWidget;
                    // return makeUnknownInput;
            }
        }
        return {
            getInputWidgetFactory: getInputWidgetFactory
        };
    }
    return {
        make: function (config) {
            return factory(config);
        }
    };
});
