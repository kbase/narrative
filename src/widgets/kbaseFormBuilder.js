/*
    This widget is magical.

    It builds a prettily formatted form for you using a JSON structure, then at
    the end lets you extract out the info. Huzzah! Hopefully I will document it
    accurately and without typos.

    Upon init, takes at least one and possibly two arguments - elements and values
    (plus a few defaults that can be set as well. Just look at the options block below).

    $('#container').kbaseFormBuilder(
        {
            elements : some_array_of_elems
            values   : some_array_of_values
        }
    );

    And you're done! It'll build you your fancy form and stuff it into place for you. Note that this form CANNOT be submitted, you're
    assumed to want to extract out the data yourself. Do that with getFormValues:

    var values = $('#container').kbaseFormBuilder('getFormValues');

    That'll return a javascript structure to you (suitable to use as JSON!) to do with as you wish. Alternatively, use getFormValuesAsString:

    var string = $('#container').kbaseFormBuilder('getFormValuesAsString');

    That just stringifies the JSON for you, plus doing a little automatic escaping of strings. That may be useful for you if you were just
    gonna toss the JSON into a string anyway.

    Now for the meet of it - what those values in 'elements' need to be. Each one is an object with numerous well defined keys:

        name : the name of the form element
        key: the key to this value in the resulting JSON structure.
            NOTE - this is NOT an object key. The resulting structure is an array of arrays. The "key" here is just the first
            element of the array.
        description: a tooltip to popup when the element is moused-over.
        label : the text of the label to go to its left
        fieldset: the fieldset to place this element into. Not required.
        split: a string or array containing delimiter(s) to split the resulting value on.
            Example - split is undef. The user types in '1,2,3' the resulting JSON is key => '1,2,3'
            Example - split is ','. The user types in '1,2,3' the resulting JSON is key => [1,2,3]
            Example - split is [':',',']. The user types in 'a,b;1,2;X,Y' the resulting JSON is key => [[a,b],[1,2],[X,Y]]
        json: true/false flag - whether the input value is assumed to contain JSON text. Will parse it out if it does.
        size: the size of the element. uses defaultSize if not given.
        valOnly: true/false flag - if true, will not include the key in the text provided to getFormValuesAsString. Useful for bools!
        type : the type of element. You can have:
            text
            textarea
            password
            checkbox
            select
            multiselect
            radio

            string  (which is a text field)
            secure  (which is a password field)
            enum    (which is a select box)
            boolean (which is a checkbox)

            They all correspond to the same HTML form element
        value: the value of the input element. NOTE - only applicable to elements with a single value
        values: the possible values of a element which could have multiple values.
                NOTE - this is the machine readable value (<option = 'VALUE HERE'></option>) value. Not necessarily what is displayed.
        names: the possible names of an element which could have multiple values.
                NOTE - this is the HUMAN readable name (<option = 'foo'>NAME HERE</option>), not necessarily what is handed out at the end
        selected: If an element can have multiple values, the ones selected. This may be an array for multiples, or a single string.
        multi : true/false if it's a multi-select box
        rows : how many rows to display in a select box. Defaults to defaultRowSize.

        Quick example:

        var $form = $('#foobar').kbaseFormBuilder(
            {
                elements :
                    [
                         {
                            name : 'foo',
                            label : 'This is my first element. Make it purty.',
                            type : 'text',
                            value : 'fill me in, bro',
                            key : '-a',
                            description: "This is routine usage information. How does it work? Why is it here? Why should we use it?",
                        }
                    ],
                values :
                    [
                        'FOOVALUE'
                    ]
            }
        );

        var vals = $form.getFormValues();
        console.log(vals);


    Remember - comments can be terribly misleading. Debug only code. If something doesn't look/sound/work right based upon the docs here,
    it's entirely possible that I just messed up the description. Poke the code as well and see if the usage info is merely wrong, then
    poke Jim and yell at him for something that's missing. :-)

*/

(function( $, undefined ) {


    $.KBWidget({

		  name: "kbaseFormBuilder",

        version: "1.0.0",
        options: {
            elements : [],
            defaultSize : 50,
            defaultRowSize : 5,
            defaultMultiSelectSize : 5,

            //don't mess with the dispatch.
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

        init: function(options) {
            this._super(options);
            this.$elem.append(this._buildForm(this.options.elements));
            return this;
        },

        getFormValuesAsObject : function() {
            var values = this.getFormValues();

            var ret = {};

            $.each(
                values,
                function (idx, val) {
                    ret[val[0]] = val.slice(1)
                }
            );

            return ret;
        },

        getFormValues : function() {
            var ret = [];

            var formValues = this.data('formValues');
            var form = this.data('form').get(0);

            for (key in formValues) {
                var val = formValues[key];
                var field = val.name;
                var type = val.type;

                var fields = [];

                if (form[field] == '[object NodeList]') {
                    for (var i = 0; i < form[field].length; i++) {
                        fields.push(form[field][i]);
                    }
                }
                else {
                    fields = [ form[field] ];
                }

                if (type == 'checkbox') {
                    if (form[field].checked) {
                        ret.push([key]);
                    }
                }
                else if (type == 'multiselect') {
                    var selectedValues = [key];
                    var fieldValues = selectedValues;

                    if (val.asArray) {
                        fieldValues = [];
                        selectedValues.push(fieldValues);
                    }

                    var hasSelection = 0;
                    for (var i = 0; i < form[field].length; i++) {
                        if (form[field][i].selected) {
                            hasSelection = 1;
                            fieldValues.push(form[field][i].value);
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

                    var res = [];
                    for (var i = 0; i < fields.length; i++) {

                        if (val.json) {
                            var json = JSON.parse(fields[i].value);
                            if (val.asArray) {
                                json = [ json ];
                            }
                            res.push(json);
                        }
                        else {
                            res.push( this.carve(fields[i].value, val.split, val.asArray) );
                        }
                    }

                    if (res.length > 0) {

                        if (res.length == 1) {
                            res = res[0];
                            if (res.length == 0) {
                                continue;
                            }
                        }

                        ret.push([key, res]); //this.carve(form[field].value, val.split)]);
                    }
                }

            }

            if (this.options.returnArrayStructure != undefined) {
                var newRet = [];
                var keyed = {};
                for (var i = 0; i < ret.length; i++) {
                    keyed[ret[i][0]] = ret[i][1];
                }

                for (var i = 0; i < this.options.returnArrayStructure.length; i++) {
                    newRet.push(keyed[this.options.returnArrayStructure[i]]);
                }

                ret = newRet;
            }


            return ret;
        },

        carve : function (strings, delimiters, asArray) {

            delimiters = delimiters == undefined
                //nothing passed, make it an empty array
                ? []
                //otherwise, is it a string?
                : typeof delimiters == 'string'
                    //put it into an array if we have delimiters
                    ? [ delimiters ]
                    //failing all that, assume it's an array and make a copy of it
                    : delimiters.slice(0);

            var delim = delimiters.shift();

            if (delim == undefined) {
                if (asArray && typeof strings == 'string') {
                    strings = [strings];
                }
                return strings;
            }

            var delimRegex = new RegExp(' *' + delim + ' *');

            if (typeof strings == 'string') {
                return this.carve(strings.split(delimRegex), delimiters, asArray);
            }
            else {
                delimiters.push(delim);
                jQuery.each(
                    strings,
                    $.proxy(
                        function (idx, str) {
                            strings[idx] = this.carve(str, delimiters, asArray);
                        },
                        this
                    )
                )
            }

            return strings;

        },

        escapeValue : function(val) {
            val = val.replace(/"/g, '\\"');
            return '"' + val + '"';
        },

        getFormValuesAsString : function() {
            var extractedFormValues = this.getFormValues();

            if (this.options.returnArrayStructure != undefined) {
                return JSON.stringify(extractedFormValues);
            }

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
                .addClass('form-horizontal')
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
                            .addClass('control-label')
                            .css('margin-right', '10px')
                            .append(
                                $('<span></span>')
                                    .attr('title', value.label || value.name)
                                    .append(labelText)
                                    .attr('title', value.description)
                            )
                            //a smarter set of CSS would allow me to embed the inputbox INSIDE the label element so that the browser
                            //could just pick up the targetting for me. But this is bootstrap and if I did that it'd break the layout
                            //so I have to do it myself. Thanks, bootstrap!
                            .bind('click', function(e) {
                                $(this).next().children().first().focus();
                            })
                        ;

                        var $span = $label.find('span');
                        if (value.description) {
                            $span.tooltip();
                        }

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

                        $container.append($field);

                        var $button = $('<button></button>')
                                        .addClass('btn btn-default')
                                        .attr('title', 'Add more')
                                        .append($('<i></i>').addClass('icon-plus'))
                                        .bind(
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

                        $form.append(
                            $('<div></div>')
                                .addClass('control-group')
                                .append($label)
                                .append($container)
                        );

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
