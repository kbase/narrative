/*global define*/
/*jstlint white:true,browser:true*/

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

        function dataType() {
            if (!spec.text_options) {
                return 'unspecified';
            }
            var validateAs = spec.text_options.validate_as;
            type;
            if (validateAs) {
                return validateAs;
            }

            // Some parameter specs have valid_ws_types as an empty set, which 
            // does not mean what it could, it means that it is not an option.
            if (spec.text_options.valid_ws_types && spec.text_options.valid_ws_types.length > 0) {
                return 'workspaceObjectReference';
            }

            return 'unspecified';
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
                case 'workspaceObjectReference':
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
            return false
        }

        function uiClass() {
            return spec.ui_class;
        }

        function required() {
            return _required;
        }

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
            isEmpty: isEmpty
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});