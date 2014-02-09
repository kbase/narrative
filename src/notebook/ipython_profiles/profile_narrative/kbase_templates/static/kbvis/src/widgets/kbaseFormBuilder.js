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
            values   : some_object_of_elems
        }
    );

    And you're done! It'll build you your fancy form and stuff it into place for you. Note that this form CANNOT be submitted, you're
    assumed to want to extract out the data yourself. Do that with getFormValuesAsArray:

    var values = $('#container').kbaseFormBuilder('getFormValuesAsArray');

    That'll return a javascript structure to you (suitable to use as JSON!) to do with as you wish. Alternatively, use getFormValuesAsString:
    Note that it's an array of arrays - first element is the key, second element is the value.

    var string = $('#container').kbaseFormBuilder('getFormValuesAsString');

    That just stringifies the JSON for you, plus doing a little automatic escaping of strings. That may be useful for you if you were just
    gonna toss the JSON into a string anyway.

    If order of keys isn't important, you can use getFormValuesAsObject:

    var obj = $('#container').kbaseFormBuilder('getFormValuesAsObject');

    That'll return key/value pairs.

    Now for the meat of it - what those values in 'elements' need to be. Each one is an object with numerous well defined keys:

        name : the name of the form element
        key: the key to this value in the resulting JSON structure.
            NOTE - this is NOT an object key. The resulting structure is an array of arrays. The "key" here is just the first
            element of the array.
        description: Further description to populate under the field.
        label : the text of the label to go to its left
        fieldset: the fieldset to place this element into. Not required.
        split: a string or array containing delimiter(s) to split the resulting value on.
            Example - split is undef. The user types in '1,2,3' the resulting JSON is key => '1,2,3'
            Example - split is ','. The user types in '1,2,3' the resulting JSON is key => [1,2,3]
            Example - split is [';',',']. The user types in 'a,b;1,2;X,Y' the resulting JSON is key => [[a,b],[1,2],[X,Y]]
        json: true/false flag - whether the input value is assumed to contain JSON text. Will parse it out if it does.
        size: Optional. the size of the element.
        valOnly: true/false flag - if true, will not include the key in the text provided to getFormValuesAsString. Useful for bools!
        type : the type of element. You can have:
            text
            textarea
            password
            checkbox
            select
            multiselect
            radio
            file
            hidden

            string  (which is a text field)
            secure  (which is a password field)
            enum    (which is a select box)
            boolean (which is a checkbox)

            They all correspond to the same HTML form element
        value: the value of the input element. NOTE - only applicable to elements with a single value
        values: the possible values of a element which could have multiple values.
                This can either be a string, in which case it is both the value AND the visible string.
                OR an object : {name : "DISPLAYS AND IS VISIBLE", value : "VALUE OF THE OPTION ELEMENT" }
        selected: If an element can have multiple values, the ones selected. This may be an array for multiples, or a single string.
        checked: true/false for a checkbox, or the value of the checked element for a radio button
        multi : true/false if it's a multi-select box
        rows : Optional. how many rows to display in a select box.
        disabled: Optional. Disable this input field.
        action : Optional. The action of the form.
        method : Optional. The method of the form.
        canSubmit : Optional. Whether you can submit the form. defaults to FALSE.

        The second argument to the constructor is an object of values. You can use this instead of setting the value at each spot in the
        initial object, whichever is easier. This is to allow you to have a hardwired set of inputs to hand in universally, and then tack
        on values later if desired. THIS OBJECT HAS PRECEDENCE OVER KEYS IN THE DEFINITION.

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
                    {
                        '-a' : 'FOOVALUE'
                    }
            }
        );

        var vals = $form.getFormValuesAsObject();
        console.log(vals);


    Remember - comments can be terribly misleading. Debug only code. If something doesn't look/sound/work right based upon the docs here,
    it's entirely possible that I just messed up the description. Poke the code as well and see if the usage info is merely wrong, then
    poke Jim and yell at him for something that's missing. :-)

*/

define('kbaseFormBuilder',
    [
        'jquery',
        'kbwidget',
        'kbasePrompt',
    ],
    function ($) {



    $.KBWidget({

		   name: "kbaseFormBuilder",

        version: "1.0.0",
        options: {
            elements    : [],
            values      : {},

            //don't mess with the dispatch.
            dispatch : {
                text        : 'buildTextField',
                textarea    : 'buildTextArea',
                password    : 'buildSecureTextField',
                checkbox    : 'buildCheckbox',
                select      : 'buildSelectbox',
                multiselect : 'buildSelectbox',
                radio       : 'buildRadioButton',
                hidden      : 'buildHiddenField',
                //file        : 'buildFileField',   //this one doesn't actually work...

                string      : 'buildTextField',
                secure      : 'buildSecureTextField',
                enum        : 'buildSelectbox',
                boolean     : 'buildCheckbox',
            },

            canSubmit : false,
            resetButton : 'Reset',
            submitButton : 'Submit',

        },

        init: function(options) {
            this._super(options);
            this.$elem.empty();
            this.$elem.append(this._buildForm(this.options.elements));
            return this;
        },

        getFormValuesAsObject : function() {

            var formValues = this.data('formValues');

            var values = this.getFormValuesAsArray();

            var ret = {};

            $.each(
                values,
                function (idx, val) {
                    ret[val[0]] = val.slice(1);
                    if (val.length == 1) {
                        ret[val[0]] = true;
                    }

                    var type = formValues[val[0]].type;
                    var multi = formValues[val[0]].multi;

                    if (val.length == 2 && ! multi && type != 'multiselect') {
                        ret[val[0]] = ret[val[0]][0];
                    }

                }
            );

            return ret;
        },

        getFormValuesAsArray : function() {
            var ret = [];

            var formValues  = this.data('formValues');
            var form        = this.data('form').get(0);

            for (key in formValues) {
                var val     = formValues[key];
                var field   = val.name;
                var type    = val.type;

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
                else if (type == 'file') {
                    var files = form[field].files || form[field].dataTransfer.files;

                    $.each(
                        files,
                        $.proxy(
                            function (idx, file) {

                                ret.jobs++;
                                var response = [key];
                                ret.push(response);

                                var reader = new FileReader();

                                reader.onload = $.proxy(
                                    function(e) {
                                        ret.jobs--;
                                        response.push(e.target.result);
                                    },
                                    this
                                );

                                reader.readAsBinaryString(file);

                            },
                            this
                        )
                    );

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
            var extractedFormValues = this.getFormValuesAsArray();

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

            var $form = $.jqElem('form')
                .addClass('form-horizontal')

            if (this.options.action) {
                $form.attr('action', this.options.action);
            }
            if (this.options.method) {
                $form.attr('method', this.options.method);
            }

            if (! this.options.canSubmit) {
                $form.on('submit', function (evt) {return false});
            }

            if (this.options.submitCallback) {
                $form.on('submit', $.proxy(function (e) { return this.options.submitCallback(e, $form, this) }, this) );
            }

            this.data('form', $form);
            var formValues = this.data('formValues', {});

            var $lastFieldset = undefined;

            $.each(
                data,
                $.proxy(
                    function(idx, formInput) {

                        if (typeof formInput == 'string') {
                            formInput = {key : formInput};
                        }

                        if (formInput.name == undefined) {
                            formInput.name = formInput.key;
                        }

                        if (formValues[formInput.key] != undefined) {
                            var errorMsg = "FORM ERROR. KEY " + formInput.key + ' IS DOUBLE DEFINED';
                            $form = errorMsg;
                            return false;
                        }

                        formValues[formInput.key] = formInput;

                        if (formInput.fieldset) {
                            if ($lastFieldset == undefined || $lastFieldset.attr('name') != formInput.fieldset) {
                                $lastFieldset = $.jqElem('fieldset')
                                    .attr('name', formInput.fieldset)
                                    .append(
                                        $.jqElem('legend')
                                            .append(formInput.fieldset)
                                    )
                                ;


                                $form.append($lastFieldset);
                            }
                        }
                        else {
                            $lastFieldset = $form;
                        }

                        var labelText = formInput.label != undefined
                            ? formInput.label
                            : formInput.name.charAt(0).toUpperCase() + formInput.name.slice(1);

                        var $label = $.jqElem('label')
                            .addClass('control-label col-sm-4')
                            .append(
                                $.jqElem('span')
                                    .attr('title', labelText)
                                    .append(labelText + ' : ')
                            )
                            //a smarter set of CSS would allow me to embed the inputbox INSIDE the label element so that the browser
                            //could just pick up the targetting for me. But this is bootstrap and if I did that it'd break the layout
                            //so I have to do it myself. Thanks, bootstrap!
                            .bind('click', function(e) {
                                $(this).next().children().first().focus();
                            })
                        ;

                        if (this.options.values[formInput.key] != undefined) {
                            formInput.value = formInput.checked = formInput.selected = this.options.values[formInput.key];
                        }

                        var $field;

                        if (formInput.type == undefined) {
                            formInput.type = 'text';
                        }

                        if (this.options.dispatch[formInput.type]) {
                            $field = this[this.options.dispatch[formInput.type]](formInput);
                        }
                        else {
                            $field = this.buildTextField(formInput);
                        }

                        if (formInput.kb_bind) {
                            $field.kb_bind(formInput.kb_bind[0], formInput.kb_bind[1]);
                        }

                        if (formInput.validate) {

                            if (typeof(formInput.validate) != 'function') {
                                formInput.validate = this.buildValidationRegexFunction(
                                    formInput.key,
                                    formInput.validate.regex,
                                    formInput.validate.msg
                                );
                            }

                            $field.on(
                                'change',
                                $.proxy(function (e) {
                                    e.stopPropagation(); e.preventDefault();
                                    formInput.validate(formInput.key, this)
                                }, this)
                            )
                        };

                        var $container = $.jqElem('div')
                            .addClass('col-sm-8');
                            ;//.addClass('input-group-addon');

                        var $description;
                        if (formInput.description) {
                            $description = $.jqElem('span')
                                .addClass('help-block')
                                .append(formInput.description)
                        };

                        var $error = $.jqElem('span')
                            .addClass('help-block')

                        if (formInput.multi) {
                            var $fb = this;
                            $container.append(
                                $.jqElem('span')
                                    .addClass('input-group')
                                    .append($field)
                                    .append(
                                        $.jqElem('div')
                                            .addClass('input-group-btn')
                                            .append(
                                                $('<button></button>')
                                                    .addClass('btn btn-default')
                                                    .attr('title', 'Add more')
                                                    .append($('<i></i>').addClass('fa fa-plus'))
                                                    .bind(
                                                        'click',
                                                        function (evt) {
                                                            evt.stopPropagation(); evt.preventDefault();
                                                            var $newgroup = $container.children().first().clone();
                                                            var $newerror = $error.clone();
                                                            $newgroup.find('i').toggleClass('fa fa-plus fa fa-minus');
                                                            $newgroup.find('button').unbind('click');
                                                            $newgroup.find('button').bind('click', function (e) {
                                                                e.stopPropagation(); e.preventDefault();
                                                                $newgroup.remove();
                                                                $newerror.remove();
                                                                $container.find(':input:not(button)').trigger('change')
                                                            });
                                                            $newgroup.find(':input:not(button)').val(undefined);
                                                            $newgroup.find(':input:not(button)').off('change');
                                                            $newgroup.find(':input:not(button)').on(
                                                                'change',
                                                                $.proxy(function (e) {
                                                                    e.stopPropagation(); e.preventDefault();
                                                                    formInput.validate(formInput.key, $fb)
                                                                }, $fb)
                                                            );
                                                            $container.append($newgroup, $newerror);
                                                        }
                                                    )
                                            )
                                    )
                            )
                            .append($error)
                            .append($description);
                        }
                        else {
                            $container
                                .append($field)
                                .append($error)
                                .append($description);
                        }

                        if (formInput.disabled) {
                            $field.prop('disabled', true);
                        }


                        var $block = $.jqElem('div')
                            .addClass('form-group')
                            .attr('id', formInput.key + '-group')
                            .append($label)
                            .append($container);

                        if (formInput.type == 'hidden') {
                            $block.css('display', 'none');
                        }

                        $form.append($block);

                    },
                    this
                )
            );

            if (this.options.canSubmit || this.options.canReset) {
                var $div =
                    $.jqElem('div')
                        .addClass('pull-right')
                ;

                if (this.options.canReset) {
                    $div.append(
                        $.jqElem('input')
                            .addClass('btn btn-default btn-warning')
                            .attr('type', 'button')
                            .val(this.options.resetButton)
                            .on(
                                'click',
                                function(e) {
                                    var $resetModal = $.jqElem('div').kbasePrompt(
                                        {
                                            title : 'Begin again',
                                            body : 'Really start over?',
                                            controls : [
                                                'cancelButton',
                                                {
                                                    name : 'Reset',
                                                    type : 'primary',
                                                    callback : function (e, $prompt) {
                                                        e.stopPropagation(); e.preventDefault();
                                                        $form.get(0).reset();
                                                        $prompt.closePrompt();
                                                    }
                                                }
                                            ],
                                        }
                                    );

                                    $resetModal.openPrompt();
                                }
                            )
                    )
                }

                if (this.options.canReset && this.options.canSubmit) {
                    $div.append(' ');
                };

                if (this.options.canSubmit) {
                    $div.append(
                        $.jqElem('input')
                            .addClass('btn btn-primary')
                            .attr('type', 'submit')
                            .val(this.options.submitButton)
                    )
                }

                $form.append($div);
            }

            this._rewireIds($form, this);

            return $form;

        },

        validateForm : function() {
            var ret = true;
            var $fb = this;
            $.each(
                this.options.elements,
                function (idx, formInput) {
                    if (formInput.validate) {
                        var retA = formInput.validate(formInput.key, $fb);
                        ret = ret && retA;
                    }
                }
            );

            return ret;
        },

        formGroup : function (key) {
            return this.data(key + '-group');
        },

        errmsg : function ($field, msg) {

            var errmsg = $field.next('span');

            if (errmsg.length == 0) {
                errmsg = $field.parent().next();
            }
            var $errmsg = $(errmsg);
            $errmsg.text(msg);
        },

        buildValidationRegexFunction : function(key, regex, msg) {
            var $fb = this;

            if (typeof regex == 'string') {
                regex = new RegExp(regex);

            }

            return function (key, $fb) {

                var ret = true;

                var $group = $fb.formGroup(key);
                $group.removeClass('has-error');

                $.each(
                    $fb.fieldsForKey(key),
                    function (idx, field) {
                        var $field = $(field);

                        $fb.errmsg($field, '');

                        if (!$field.val().match(regex)) {
                            ret = false;
                            $group.addClass('has-error');
                            $fb.errmsg($field, msg);
                        }
                    }
                )

                return ret;
            }
        },


        fieldsForKey : function(key) {
            var $group = this.formGroup(key);
            return $group.find(':input:not(button)');
        },

        buildHiddenField : function(data) {
            return $.jqElem('input')
                    .attr('type', 'hidden')
                    .attr('value', data.value)
                    .attr('name', data.name)
            ;
        },

        buildTextField : function(data) {
            return $.jqElem('input')
                    .attr('type', 'text')
                    .attr('value', data.value)
                    .attr('name', data.name)
                    .addClass('form-control')
            ;
        },

        buildFileField : function(data) {
            return $.jqElem('input')
                    .attr('type', 'file')
                    .attr('value', data.value)
                    .attr('name', data.name)
                    .addClass('form-control')
            ;
        },

        buildTextArea : function(data) {
            var $textArea = $.jqElem('textarea')
                    .attr('name', data.name)
                    .addClass('form-control')
                    .append(data.value)
            ;

            if (data.rows) {
                $textArea.attr('rows', data.rows);
            }

            return $textArea;
        },

        buildSecureTextField : function(data) {
            return $.jqElem('input')
                    .attr('type', 'password')
                    .attr('value', data.value)
                    .attr('name', data.name)
                    .addClass('form-control')
            ;
        },

        buildCheckbox : function(data) {

            var $checkbox =  $.jqElem('input')
                    .attr('type', 'checkbox')
                    .addClass('form-control')
                    .attr('name', data.name)
                    .attr('value', data.value);
            ;

            if (data.checked == true) {
                $checkbox.prop('checked', true);
            }

            return $checkbox;

        },

        buildRadioButton : function(data) {

            var $radioDiv = $.jqElem('div');

            $.each(
                data.values,
                $.proxy(
                    function (idx, val) {

                        var value = val;
                        var name = val;

                        if (typeof val != 'string') {
                            value = val.value;
                            name = val.name;
                        }


                        var $buttonDiv = $.jqElem('div')
                            .addClass('radio')
                        ;

                        var $radio = $.jqElem('input')
                            .attr('type', 'radio')
                            .attr('name',  data.name)
                            .attr('value', value)

                        if (data.checked == value) {
                            $radio.prop('checked', true);
                        }

                        var $l = $.jqElem('label')
                            .addClass('control-label')
                            .append($radio)
                            .append(name)
                        ;


                        $buttonDiv.append($l);
                        $radioDiv.append($buttonDiv);

                    },
                    this
                )
            );

            return $radioDiv;

        },

        buildSelectbox : function(data) {
            var $selectbox =  $.jqElem('select')
                    .attr('name', data.name)
                    .addClass('form-control')
            ;

            if (data.type == 'multiselect') {
                $selectbox
                    .prop('multiple', true);
                if (data.size) {
                    $selectbox.attr('size', data.size);
                }
            }

            if (data.names == undefined) {
                data.names = [];
            }

            $.each(
                data.values,
                function(idx, val) {

                    var value = val;
                    var name = val;

                    if (typeof val != 'string') {
                        value = val.value;
                        name = val.name;
                    }

                    var $option = $.jqElem('option')
                        .attr('value', value)
                        .append(name);

                    if (typeof data.selected == 'string' && data.selected == value) {
                        $option.prop('selected', true);
                    }
                    else if (typeof data.selected == 'object') {
                        $.each(
                            data.selected,
                            function (idx, selectedValue) {
                                if (selectedValue == value) {
                                    $option.prop('selected', true);
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

});
