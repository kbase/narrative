/*


*/


(function( $, undefined ) {


    $.widget("kbase.formBuilder", $.kbase.widget, {
        version: "1.0.0",
        options: {
            elements : [],
            defaultSize : 50,
            defaultRowSize : 5,
            defaultMultiSelectSize : 5,
            labelWidth : 150,
            dispatch : {
                text : 'buildTextField',
                textarea : 'buildTextArea',
                password : 'buildSecureTextField',
                checkbox : 'buildCheckbox',
                select : 'buildSelectbox',
                multiselect : 'buildSelectbox',
                radio : 'buildRadioButton',

                string : 'buildTextField',
                secure : 'buildSecureTextField',
                enum   : 'buildSelectbox',
                boolean: 'buildCheckbox',
            },

        },

        _init: function() {
            this.element.append(this._buildForm(this.options.elements));
            return this;

        },

        resizeToMinimum : function() {
            var maxWidth = 0;

            $('span', this.element).each(
                function (idx, val) {
                    $(val).css('width', '');
                    if ($(val).width() > maxWidth) {
                        maxWidth = $(val).width();
                    }
                }
            );

            var minWidth = maxWidth > this.options.labelWidth
                ? this.options.labelWidth
                : maxWidth;

            $('span', this.element).css('width', minWidth);
        },

        getFormValues : function() {
            var ret = [];

            var formValues = this.data('formValues');
            var form = this.data('form').get(0);

            for (key in formValues) {
                var val = formValues[key];
                var field = val.name;
                var type = val.type;

                var fields = form[field];
                console.log(fields);
                console.log($.isArray(fields));
                console.log($.isArray([]));
                console.log("F IS " + fields);
                if ($.isArray(fields)) {
                    console.log("HAS ARRAY! HLY FUCK");
                    console.log(fields);
                    console.log(typeof fields);
                }

                if (type == 'checkbox') {
                    if (form[field].checked) {
                        ret.push([key]);
                    }
                }
                else if (type == 'multiselect') {
                    var selectedValues = [key];
                    var hasSelection = 0;
                    for (var i = 0; i < form[field].length; i++) {
                        if (form[field][i].selected) {
                            hasSelection = 1;
                            selectedValues.push(form[field][i].value);
                        }
                    }
                    if (hasSelection) {
                        ret.push(selectedValues);
                    }
                }
                else if (type == 'radio') {
                    var selectedValues = [key];
                    var hasSelection = 0;
                    for (var i = 0; i < form[field].length; i++) {
                        if (form[field][i].checked) {
                            hasSelection = 1;
                            selectedValues.push(form[field][i].value);
                        }
                    }
                    if (hasSelection) {
                        ret.push(selectedValues);
                    }
                }
                else {
                    if (form[field].value.length) {
                        ret.push([key, this.split(form[field].value, val.split)]);
                    }
                }

            }

            return ret;
        },

        split : function(strings, delimiters) {

            if (typeof strings == 'string') {
                strings = [strings];
            }

            if (delimiters == undefined || typeof delimiters == 'string') {
                delimiters = [delimiters];
            }

            delimiters = delimiters.slice(0);

            var ret = [];

            var delim = delimiters.shift();

            if (delim != undefined) {
                var delimRegex = new RegExp(' *' + delim + ' *');

                jQuery.each(
                    strings,
                    jQuery.proxy(
                        function (idx, str) {
                            ret.push(
                                this.split(
                                    str.split(delimRegex),
                                    delimiters
                                )
                            );
                        },
                        this
                    )
                );
            }
            else {
                ret = strings;
            }

            return ret.length == 1
                ? ret[0]
                : ret;

        },

        escapeValue : function(val) {
            val = val.replace(/"/g, '\\"');
            return '"' + val + '"';
        },

        getFormValuesAsString : function() {
            var extractedFormValues = this.getFormValues();

            var returnValue = [];


            for (var i = 0; i < extractedFormValues.length; i++) {

                var field = extractedFormValues[i];

                if (field.length == 1) {
                    returnValue.push(field[0]);
                }
                else {
                    for (var j = 1; j < field.length; j++) {
                        if (this.data('formValues')[field[0]].valOnly) {
                            returnValue.push( field[j] );
                        }
                        else {
                            if (typeof field[j] == 'string') {
                                returnValue.push(field[0] + ' ' + this.escapeValue(field[j]));
                            }
                            else {
                                console.log("COMPLEX OBJECT");console.log(field[j]);
                                console.log(this.escapeValue(JSON.stringify(field[j])));
                                returnValue.push(field[0] + ' ' + this.escapeValue(JSON.stringify(field[j])));
                            }
                        }
                    }
                }
            }

            return returnValue.join(' ');
        },

        _buildForm : function(data) {

            var $form = $('<form></form>')
                .bind('submit', function (evt) {return false});

            this.data('form', $form);
            var formValues = this.data('formValues', {});

            var $lastFieldset = undefined;

            var passedValues = {};

            if (this.options.values != undefined) {
                $.each(
                    this.options.values,
                    function (idx, val) {
                        passedValues[val[0]] = val[1] || 1; //set to true for checkboxes, etc.
                    }
                );
            }

            $.each(
                data,
                $.proxy(
                    function(idx, value) {

                        if (formValues[value.key] != undefined) {
                            var errorMsg = "FORM ERROR. KEY " + value.key + ' IS DOUBLE DEFINED';
                            $form = errorMsg;
                            return false;
                        }
                        formValues[value.key] = value;

                        if (value.fieldset) {
                            if ($lastFieldset == undefined || $lastFieldset.attr('name') != value.fieldset) {
                                $lastFieldset = $('<fieldset></fieldset>')
                                    .attr('name', value.fieldset)
                                    .append(
                                        $("<legend></legend>")
                                            .append(value.fieldset)
                                    )
                                ;


                                $form.append($lastFieldset);
                            }
                        }
                        else {
                            $lastFieldset = $form;
                        }

                        var labelText = value.label != undefined
                            ? value.label
                            : value.name;

                        var $label = $('<label></label>')
                            .attr('style', 'clear : both; display : block')
                            .append(
                                $('<span></span>')
                                    .attr('style', 'width : ' + this.options.labelWidth + 'px; text-align : right; margin-right : 5px; padding : 2px; float : left')
                                    .attr('title', value.label || value.name)
                                    .append(labelText)
                                    .tooltip(
                                        {
                                            content : value.description,
                                            position : {my : 'left', at : 'right', collision : 'none'},
                                            disabled : (value.description == undefined)
                                        }
                                    )
                            )
                        ;

                        if (passedValues[value.key] != undefined) {
                            value.value = value.checked = value.selected = passedValues[value.key];
                        }

                        var $field;

                        if (this.options.dispatch[value.type]) {
                            $field = this[this.options.dispatch[value.type]](value);
                        }
                        else if (value.type == undefined) {
                            var errorMsg = "FORM ERROR. KEY " + value.key + ' HAS NO TYPE';
                            $form = errorMsg;
                            return false;
                        }
                        else {
                            $field = this.buildTextField(value);
                        }

                        var $container = $('<span></span>');
                        $container.css('display', 'inline-block');


                        $label.append($container);
                        $container.append($field);

                        var $button = $('<button></button>')
                                        .append('Add more\n')
                                        .css({width : '19px', height : '18px'})
                                        .button({text : false, icons : {primary : 'ui-icon-plus'}});

                        $button.bind(
                                            'click',
                                            function (evt) {
                                                //alert("Add more!");
                                                $container.append($('<br/>'));
                                                $container.append($field.clone());
                                                evt.stopPropagation();
                                            }
                                        );

                        if (value.multi) {
                            $container.append($button);
                        }

                        $form.append($label);

                    },
                    this
                )
            );

            return $form;

        },

        buildTextField : function(data) {
            return $('<input/>')
                    .attr('type', 'text')
                    .attr('size', data.size || this.options.defaultSize)
                    .attr('value', data.value)
                    .attr('name', data.name)
            ;
        },

        buildTextArea : function(data) {
            return $('<textarea></textarea>')
                    .attr('cols', data.size || this.options.defaultSize)
                    .attr('rows', data.rows || this.options.defaultRowSize)
                    .attr('name', data.name)
                    .append(data.value)
            ;
        },

        buildSecureTextField : function(data) {
            return $('<input/>')
                    .attr('type', 'password')
                    .attr('size', data.size || this.options.defaultSize)
                    .attr('value', data.value)
                    .attr('name', data.name)
            ;
        },

        buildCheckbox : function(data) {

            var $checkbox =  $('<input/>')
                    .attr('type', 'checkbox')
                    .attr('name', data.name)
                    .attr('value', data.value);
            ;

            if (data.checked) {
                $checkbox.attr('checked', 'checked');
            }

            return $checkbox;

        },

        buildRadioButton : function(data) {

            var $radioSpan = $('<span></span>')
                .css('display', 'inline-block')
            ;

            $.each(
                data.values,
                $.proxy(
                    function (idx, val) {

                        var $radio = $('<input/>')
                            .attr('type', 'radio')
                            .attr('name',  data.name)
                            .attr('value', val);

                        if (data.checked == val) {
                            $radio.attr('checked', 'checked');
                        }

                        var $l = $('<label></label')
                            .append($radio)
                            .append(data.names[idx] || data.values[idx])
                            .css('clear', 'both')
                            .css('float', 'left')
                        ;


                        $radioSpan.append($l);

                    },
                    this
                )
            );

            return $radioSpan;

        },

        buildSelectbox : function(data) {
            var $selectbox =  $('<select></select>')
                    .attr('name', data.name)
            ;

            if (data.type == 'multiselect') {
                $selectbox
                    .attr('multiple', 'multiple')
                    .attr('size', data.size || this.options.defaultMultiSelectSize);
            }

            if (data.names == undefined) {
                data.names = [];
            }

            $.each(
                data.values,
                function(idx, value) {
                    var name = data.names[idx] || data.values[idx];
                    var $option = $('<option></option>')
                        .attr('value', value)
                        .append(name);

                    if (typeof data.selected == 'string' && data.selected == value) {
                        $option.attr('selected', 'selected');
                    }
                    else if (typeof data.selected == 'object') {
                        $.each(
                            data.selected,
                            function (idx, selectedValue) {
                                if (selectedValue == value) {
                                    $option.attr('selected', 'selected');
                                }
                            }
                        );
                    }

                    $selectbox.append($option);
                }
            );

            return $selectbox;

        },

    });

}( jQuery ) );
