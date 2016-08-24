/*global define*/
/*jslint white:true,browser:true*/

define([
    './display/singleTextDisplay',
    './display/multiTextDisplay',
    './display/undefinedDisplay',
    './display/singleObjectDisplay',
    './display/singleSelectDisplay',
    './display/singleCheckboxDisplay',
    './display/singleIntDisplay',
    './display/multiIntDisplay',
    './display/multiObjectDisplay'
], function (
    // Display widgets
    SingleTextDisplayWidget,
    MultiTextDisplayWidget,
    UndefinedDisplayWidget,
    SingleObjectDisplayWidget,
    SingleSelectDisplay,
    SingleCheckboxDisplay,
    SingleIntDisplay,
    MultiIntDisplay,
    MultiObjectDisplayWidget
    ) {
    'use strict';

    function factory(config) {

        function getWidgetFactory(parameterSpec) {
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
                        return SingleTextDisplayWidget;
                    }
                    switch (fieldType) {
                        case 'text':
                            return SingleTextDisplayWidget;
                        case 'dropdown':
                            return SingleSelectDisplay;
                        default:
                            return UndefinedDisplayWidget;
                    }
                case 'int':
                    switch (fieldType) {
                        case 'text':
                            if (parameterSpec.multipleItems()) {
                                return MultiIntDisplay;
                            }
                            return SingleIntDisplay;
                        case 'checkbox':
                            return SingleCheckboxDisplay;
                        default:
                            if (parameterSpec.multipleItems()) {
                                return UndefinedDisplayWidget;
                            }
                            return UndefinedDisplayWidget;
                    }
                case 'float':
                    if (parameterSpec.multipleItems()) {
                        return UndefinedDisplayWidget;
                    }
                    return SingleTextDisplayWidget;
                case 'workspaceObjectName':
                    switch (parameterSpec.uiClass()) {
                        case 'input':
                            return SingleObjectDisplayWidget;
                        case 'output':
                            return SingleTextDisplayWidget;
                        case 'parameter':
                            return SingleObjectDisplayWidget;
                        default:
                            return SingleObjectDisplayWidget;
                    }
                case '[]workspaceObjectName':
                    switch (parameterSpec.uiClass()) {
                        case 'input':
                            return MultiObjectDisplayWidget;
                        case 'output':
                            return SingleTextDisplayWidget;
                        case 'parameter':
                            return SingleObjectDisplayWidget;
                        default:
                            return SingleObjectDisplayWidget;
                    }
                case '[]string':
                    switch (fieldType) {
                        case 'dropdown':
                            if (parameterSpec.multipleItems()) {
                                return UndefinedDisplayWidget;
                            }
                            return SingleSelectDisplay;
                        default:
                            return UndefinedDisplayWidget;
                    }
                case 'unspecified':
                    // a bunch of field types are untyped:
                    switch (fieldType) {
                        case 'text':
                            if (parameterSpec.multipleItems()) {
                                return MultiTextDisplayWidget;
                            }
                            return SingleTextDisplayWidget;
                        case 'checkbox':
                            return SingleCheckboxDisplay;
                        case 'textarea':
                            return UndefinedDisplayWidget;

                        case 'custom_button':
                            return UndefinedDisplayWidget;
                        case 'textsubdata':
                            console.log('TEXTSUBDATA', parameterSpec);
                            if (parameterSpec.multipleItems()) {
                                return UndefinedDisplayWidget;
                            }
                            return UndefinedDisplayWidget;
                        case 'file':
                            return UndefinedDisplayWidget;
                        case 'custom_textsubdata':
                            console.log('CUSTOM_TEXTSUBDATA', parameterSpec);
                            if (parameterSpec.multipleItems()) {
                                return UndefinedDisplayWidget;
                            }
                            return UndefinedDisplayWidget;
                        case 'custom_widget':
                            return UndefinedDisplayWidget;
                        case 'tab':
                            return UndefinedDisplayWidget;
                        default:
                            return UndefinedDisplayWidget;
                    }
                default:
                    return UndefinedDisplayWidget;
                    // return makeUnknownInput;
            }
        }
        return {
            getWidgetFactory: getWidgetFactory
        };
    }
    return {
        make: function (config) {
            return factory(config);
        }
    };
});