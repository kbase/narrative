define([
    'bluebird',
    'require'
], function(
    Promise,
    require
) {
    'use strict';

    function factory(config) {

        function getWidgetModule(spec) {
            var dataType = spec.data.type,
                controlType = spec.ui.control;

            switch (dataType) {
                case 'string':
                    switch (controlType) {
                        case 'dropdown':
                            return {
                                input: 'selectInput',
                                view: 'selectView'
                            };
                        case 'textarea':
                            return {
                                input: 'textareaInput',
                                view: 'textareaView'
                            };
                        case 'file':
                            return {
                                input: 'fileInput',
                                view: 'fileView'
                            };
                        case 'custom_textsubdata':
                            return {
                                input: 'customSubdataInput',
                                view: 'customSubdataView'
                            };
                        case 'autocomplete':
                            return {
                                input: 'autocompleteInput',
                                view: 'autocompleteView'
                            };
                        case 'text':
                        default:
                            // A string type is normally entered as a 
                            // simple text input.
                            return {
                                input: 'textInput',
                                view: 'textView'
                            }
                    }
                case 'sequence':
                    return {
                        input: 'sequenceInput',
                        view: 'sequenceView'
                    };
                case 'int':
                    switch (controlType) {
                        case 'checkbox':
                            return {
                                input: 'checkboxInput',
                                view: 'checkboxView'
                            };
                        case 'text':
                        default:
                            return {
                                input: 'intInput',
                                view: 'intView'
                            };
                    }
                case 'float':
                    return {
                        input: 'floatInput',
                        view: 'floatView'
                    };
                case 'workspaceObjectRef':
                    switch (spec.ui.class) {
                        case 'input':
                            //return 'singleObjectInput';                            
                            return {
                                input: 'select2ObjectInput',
                                view: 'select2ObjectView'
                            };
                        case 'parameter':
                            // return 'singleObjectInput';
                            return {
                                input: 'select2ObjectInput',
                                view: 'select2ObjectView'
                            };
                        default:
                            return {
                                input: 'undefinedInput',
                                view: 'undefinedView'
                            };
                    }
                    // IS THIS used anywhere other than in output areas?? 
                case 'workspaceObjectName':
                    switch (spec.ui.class) {
                        case 'parameter':
                        case 'output':
                            return {
                                input: 'newObjectInput',
                                view: 'newObjectView'
                            };
                        default:
                            return {
                                input: 'undefinedInput',
                                view: 'undefinedView'
                            };
                    }
                case 'subdata':
                    return {
                        input: 'subdataInput',
                        view: 'subdataView'
                    };
                case 'customSubdata':
                    return {
                        input: 'customSubdataInput',
                        view: 'customSubdataView'
                    };
                case 'boolean':
                    return {
                        input: 'toggleButtonInput',
                        view: 'toggleButtonView'
                    };
                case 'struct':
                    return {
                        input: 'structInput',
                        view: 'structView'
                    };
                default:
                    console.error('ERROR could not detremine control modules for this spec', spec);
                    throw new Error('Could not determine control modules for this spec');
            }
        }

        function loadModule(type, name) {
            return new Promise(function(resolve, reject) {
                require(['./' + type + '/' + name], function(Module) {
                    resolve(Module);
                }, function(err) {
                    reject(err);
                });
            });
        }

        function loadInputControl(parameterSpec) {
            var module = getWidgetModule(parameterSpec);
            return loadModule('input', module.input);
        }

        function loadViewControl(parameterSpec) {
            var module = getWidgetModule(parameterSpec);
            return loadModule('view', module.view);
        }

        return {
            loadInputControl: loadInputControl,
            loadViewControl: loadViewControl
        };
    }
    return {
        make: function(config) {
            return factory(config);
        }
    };
});