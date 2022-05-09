define([
    'bluebird',
    'require',
    './input/checkboxInput',
    './input/customInput',
    './input/customSubdataInput',
    './input/dynamicDropdownInput',
    './input/fileInput',
    './input/floatInput',
    './input/intInput',
    './input/newObjectInput',
    './input/select2ObjectInput',
    './input/selectInput',
    './input/subdataInput',
    './input/taxonomyRefInput',
    './input/textareaInput',
    './input/textInput',
    './input/toggleButtonInput',
    './input/undefinedInput',
    './view/checkboxView',
    './view/customView',
    './view/customSubdataView',
    './view/dynamicDropdownView',
    './view/fileView',
    './view/floatView',
    './view/intView',
    './view/newObjectView',
    './view/select2ObjectView',
    './view/selectView',
    './view/subdataView',
    './view/taxonomyRefView',
    './view/textareaView',
    './view/textView',
    './view/toggleButtonView',
    './view/undefinedView',
], (
    Promise,
    require,
    checkboxInput,
    customInput,
    customSubdataInput,
    dynamicDropdownInput,
    fileInput,
    floatInput,
    intInput,
    newObjectInput,
    select2ObjectInput,
    selectInput,
    subdataInput,
    taxonomyRefInput,
    textareaInput,
    textInput,
    toggleButtonInput,
    undefinedInput,
    checkboxView,
    customView,
    customSubdataView,
    dynamicDropdownView,
    fileView,
    floatView,
    intView,
    newObjectView,
    select2ObjectView,
    selectView,
    subdataView,
    taxonomyRefView,
    textareaView,
    textView,
    toggleButtonView,
    undefinedView
) => {
    'use strict';

    const inputModules = {
        './input/checkboxInput': checkboxInput,
        './input/customInput': customInput,
        './input/customSubdataInput': customSubdataInput,
        './input/dynamicDropdownInput': dynamicDropdownInput,
        './input/fileInput': fileInput,
        './input/floatInput': floatInput,
        './input/intInput': intInput,
        './input/newObjectInput': newObjectInput,
        './input/select2ObjectInput': select2ObjectInput,
        './input/selectInput': selectInput,
        './input/subdataInput': subdataInput,
        './input/taxonomyRefInput': taxonomyRefInput,
        './input/textareaInput': textareaInput,
        './input/textInput': textInput,
        './input/toggleButtonInput': toggleButtonInput,
        './input/undefinedInput': undefinedInput,
        './view/checkboxView': checkboxView,
        './view/customView': customView,
        './view/customSubdataView': customSubdataView,
        './view/dynamicDropdownView': dynamicDropdownView,
        './view/fileView': fileView,
        './view/floatView': floatView,
        './view/intView': intView,
        './view/newObjectView': newObjectView,
        './view/select2ObjectView': select2ObjectView,
        './view/selectView': selectView,
        './view/subdataView': subdataView,
        './view/taxonomyRefView': taxonomyRefView,
        './view/textareaView': textareaView,
        './view/textView': textView,
        './view/toggleButtonView': toggleButtonView,
        './view/undefinedView': undefinedView,
    };

    function factory() {
        function getWidgetModule(spec) {
            let dataType = null,
                controlType = null;
            try {
                dataType = spec.data.type;
                controlType = spec.ui.control;
            } catch (e) {
                // eslint-disable-next-line no-empty
            }

            switch (dataType) {
                case 'boolean':
                    return 'toggleButton';
                case 'custom':
                case 'customSubdata':
                case 'float':
                case 'sequence':
                case 'struct':
                case 'subdata':
                    return dataType;
                case 'int':
                    return controlType === 'checkbox' ? controlType : dataType;
                case 'string':
                    switch (controlType) {
                        case 'autocomplete':
                            return 'taxonomyRef';
                        case 'custom_textsubdata':
                            return 'customSubdata';
                        case 'dropdown':
                            return 'select';
                        case 'dynamic_dropdown':
                            return 'dynamicDropdown';
                        case 'file':
                        case 'textarea':
                            return controlType;
                        case 'text':
                        default:
                            return 'text';
                    }
                case 'workspaceObjectRef':
                    switch (spec.ui.class) {
                        case 'input':
                        case 'parameter':
                            return 'select2Object';
                        default:
                            return 'undefined';
                    }

                // IS THIS used anywhere other than in output areas??
                case 'workspaceObjectName':
                    switch (spec.ui.class) {
                        case 'parameter':
                        case 'output':
                            return 'newObject';
                        default:
                            return 'undefined';
                    }

                default:
                    console.error('ERROR could not determine control modules for this spec', spec);
                    throw new Error('Could not determine control modules for this spec');
            }
        }

        /**
         *
         * @param {object} parameterSpec - the spec for the parameter
         * @param {string} typeString - module type, either 'input' or 'view'
         * @param {boolean} includeMetadata - whether to return the loaded module or the loaded
         *                                    module and some metadata
         */
        function _loadModule(parameterSpec, typeString, includeMetadata = false) {
            let type;
            try {
                type = typeString.toLowerCase();
            } catch (err) {
                // do nothing
            }
            if (!type || (type !== 'input' && type !== 'view')) {
                return Promise.reject(new Error(`invalid input to ParamResolver: "${typeString}"`));
            }

            let module;
            try {
                module = getWidgetModule(parameterSpec);
            } catch (err) {
                return Promise.reject(err);
            }

            const typeTitle = type.charAt(0).toUpperCase() + type.substr(1).toLowerCase(),
                moduleName = module + typeTitle,
                path = `./${type}/${moduleName}`;

            // the sequence(Input|View) and struct(Input|View) modules
            // require ParamResolver, so have to be loaded dynamically
            if (module === 'sequence' || module === 'struct') {
                return new Promise((resolve, reject) => {
                    require([path], (Module) => {
                        resolve(
                            includeMetadata
                                ? {
                                      module: Module,
                                      path: path,
                                      moduleName: moduleName,
                                  }
                                : Module
                        );
                    }, (err) => {
                        reject(err);
                    });
                });
            }
            return Promise.resolve(
                includeMetadata
                    ? {
                          module: inputModules[path],
                          path: path,
                          moduleName: moduleName,
                      }
                    : inputModules[path]
            );
        }

        function loadControl(parameterSpec, type) {
            return _loadModule(parameterSpec, type);
        }

        function loadInputControl(parameterSpec) {
            return _loadModule(parameterSpec, 'input');
        }

        function loadViewControl(parameterSpec) {
            return _loadModule(parameterSpec, 'view');
        }

        function getControlData(parameterSpec, type) {
            return _loadModule(parameterSpec, type, true);
        }

        return {
            loadControl,
            loadInputControl,
            loadViewControl,
            getControlData,
        };
    }
    return {
        make: function () {
            return factory();
        },
    };
});
