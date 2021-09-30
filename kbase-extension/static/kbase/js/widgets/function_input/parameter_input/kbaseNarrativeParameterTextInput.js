/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

define([
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'kbaseNarrativeParameterInput',
    'common/runtime',
    'base/js/namespace',
    'util/timeFormat',
    'util/string',
    'select2',
    'bootstrap',
], (
    KBWidget,
    $,
    Config,
    kbaseNarrativeParameterInput,
    Runtime,
    Jupyter,
    TimeFormat,
    StringUtil
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeParameterTextInput',
        parent: kbaseNarrativeParameterInput,
        version: '1.0.0',
        options: {
            loadingImage: Config.get('loading_gif'),
            parsedParameterSpec: null,
            wsObjSelectPageSize: 20,
            isInSidePanel: false,
        },
        IGNORE_VERSION: true,
        // properties inherited from kbaseNarrativeParameterInput
        // $mainPanel:null,
        // spec:null,

        isUsingSelect2: false,
        enabled: true,
        isOutputName: false,
        required: true,
        validDataObjectList: [],
        allow_multiple: false,
        $rowsContainer: null,
        $addRowController: null,
        rowInfo: null,
        // set the widths of the columns
        nameColClass: 'col-md-2',
        inputColClass: 'col-md-5',
        hintColClass: 'col-md-5',
        init: function (input) {
            this._super(input);
            var self = this,
                runtime = Runtime.make(),
                ev = runtime.bus().listen({
                    channel: 'data',
                    key: {
                        type: 'workspace-data-updated',
                    },
                    handle: function (message) {
                        if (!$.contains(document, self.$elem[0])) {
                            // console.warn('widget no longer in dom, detaching event');
                            runtime.bus().removeListener(ev);
                        } else {
                            self.updateDataList(message.data);
                        }
                    },
                });
        },
        render: function () {
            const self = this;
            if (self.options.isInSidePanel) {
                self.nameColClass = 'col-md-12';
                self.inputColClass = 'col-md-12';
                self.hintColClass = 'col-md-12';
            }

            const spec = self.spec;

            this.validateAs = 'string';
            if (spec.text_options && spec.text_options.validate_as) {
                this.validateAs = spec.text_options.validate_as;
            }
            // check if we need to allow multiple values
            self.allow_multiple = false;
            if (spec.allow_multiple) {
                if (spec.allow_multiple === true || spec.allow_multiple === 1) {
                    self.allow_multiple = true;
                }
            }
            // check if this is a required field
            self.required = true;
            if (spec.optional) {
                self.required = false;
            }

            // check if this is an output name
            if (spec.text_options) {
                if (spec.text_options.is_output_name) {
                    self.isOutputName = true;
                }
            }

            self.rowInfo = [];
            self.$rowsContainer = $('<div>');
            self.$mainPanel.append(self.$rowsContainer);
            self.$addRowController = $('<div>');

            var d = spec.default_values;

            // based on whether we have one or allow multiple, render the output rows...
            if (!self.allow_multiple) {
                var defaultValue = '';
                if (spec.default_values) {
                    if (spec.default_values.length >= 1) {
                        var d = spec.default_values;
                        defaultValue = d[0] !== '' && d[0] !== undefined ? d[0] : '';
                    }
                }
                self.addRow(defaultValue, true, true);
            } else {
                // for multiple elements, hover on entire panel
                self.$mainPanel
                    .addClass('kb-method-parameter-row')
                    .mouseenter(function () {
                        $(this).addClass('kb-method-parameter-row-hover');
                    })
                    .mouseleave(function () {
                        $(this).removeClass('kb-method-parameter-row-hover');
                    });

                var defaultValue = '';
                if (spec.default_values) {
                    if (spec.default_values.length >= 1) {
                        var d = spec.default_values;
                        defaultValue = d[0] !== '' && d[0] !== undefined ? d[0] : '';
                    }
                }
                self.addRow(defaultValue, true, false);
                if (spec.default_values) {
                    var d = spec.default_values;
                    for (let i = 1; i < d.length; d++) {
                        defaultValue = d[i] !== '' && d[i] !== undefined ? d[i] : '';
                        self.addRow(defaultValue, false, false);
                    }
                }
                self.addTheAddRowController();
            }
            self.refresh();
        },
        addTheAddRowController: function () {
            const self = this;
            const $nameCol = $('<div>')
                .addClass(self.nameColClass)
                .addClass('kb-method-parameter-name');
            if (self.options.isInSidePanel)
                $nameCol.css({ 'text-align': 'left', 'padding-left': '10px' });
            const $buttonCol = $('<div>')
                .addClass(self.inputColClass)
                .addClass('kb-method-parameter-input')
                .append(
                    $('<button>')
                        .addClass('kb-default-btn kb-btn-sm')
                        .append(
                            $('<span class="kb-parameter-data-row-add">').addClass('fa fa-plus')
                        )
                        .append(' add another ' + self.spec.ui_name)
                        .on('click', () => {
                            self.addRow();
                        })
                );
            self.$addRowController = $('<div>')
                .addClass('row kb-method-parameter-row')
                .append($nameCol)
                .append($buttonCol);
            self.$mainPanel.append(self.$addRowController);
        },
        removeRow: function (uuid) {
            const self = this;
            for (let i = 0; i < self.rowInfo.length; i++) {
                if (self.rowInfo[i].uuid === uuid) {
                    self.rowInfo[i].$all.remove();
                    self.rowInfo.splice(i, 1);
                    break;
                }
            }
        },
        /* row number should only be set when first creating this row */
        addRow: function (defaultValue, showHint, useRowHighlight) {
            const self = this;
            const spec = self.spec;

            let placeholder = '';
            if (spec.text_options) {
                if (spec.text_options.placeholder) {
                    placeholder = spec.text_options.placeholder;
                    placeholder = placeholder.replace(/(\r\n|\n|\r)/gm, '');
                }
            }
            if (!defaultValue) {
                defaultValue = '';
            }

            const form_id = spec.id;
            let $input = $(
                '<input id="' +
                    form_id +
                    '" placeholder="' +
                    placeholder +
                    '"' +
                    ' value="' +
                    defaultValue +
                    '" type="text" style="width:100%"/>'
            )
                .addClass('form-control')
                .on('input', () => {
                    self.isValid();
                });

            if (
                spec.text_options &&
                spec.text_options.valid_ws_types &&
                spec.text_options.valid_ws_types.length > 0
            ) {
                self.isUsingSelect2 = true;
                $input = $('<select id="' + form_id + '" type="text" style="width:100%" />').on(
                    'change',
                    () => {
                        self.isValid();
                    }
                );
                //this.validDataObjectList = []; - why was this here? ...
            }

            const $feedbackTip = $('<span>').removeClass();
            if (self.required && showHint) {
                // it must be required, and it must be the first element (showHint is only added on first row)
                $feedbackTip
                    .addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left')
                    .prop('title', 'required field');
            }

            const $row = $('<div>').addClass('row kb-method-parameter-row');
            if (useRowHighlight) {
                $row.mouseenter(function () {
                    $(this).addClass('kb-method-parameter-row-hover');
                }).mouseleave(function () {
                    $(this).removeClass('kb-method-parameter-row-hover');
                });
            }

            const $nameCol = $('<div>')
                .addClass(self.nameColClass)
                .addClass('kb-method-parameter-name');
            if (self.options.isInSidePanel)
                $nameCol.css({ 'text-align': 'left', 'padding-left': '10px' });
            if (showHint) {
                $nameCol.append(spec.ui_name);
            }
            const $inputCol = $('<div>')
                .addClass(self.inputColClass)
                .addClass('kb-method-parameter-input')
                .append($('<div>').css({ width: '100%', display: 'inline-block' }).append($input))
                .append($('<div>').css({ display: 'inline-block' }).append($feedbackTip));
            const $hintCol = $('<div>')
                .addClass(self.hintColClass)
                .addClass('kb-method-parameter-hint');
            const uuidForRemoval = StringUtil.uuid();
            let $removalButton = null;
            if (showHint) {
                $hintCol.append(spec.short_hint);
                if (spec.description && spec.short_hint !== spec.description) {
                    $hintCol.append(
                        $('<span>')
                            .addClass('fa fa-info kb-method-parameter-info')
                            .tooltip({ title: spec.description, html: true, container: 'body' })
                    );
                }
            } else {
                $removalButton = $('<button>')
                    .addClass('kb-default-btn kb-btn-sm')
                    .append(
                        $('<span class="kb-parameter-data-row-remove">').addClass('fa fa-remove')
                    )
                    .append(' remove ' + spec.ui_name)
                    .on('click', () => {
                        self.removeRow(uuidForRemoval);
                    });
                $hintCol.append($removalButton);
            }
            $row.append($nameCol).append($inputCol).append($hintCol);
            const $errorPanel = $('<div>').addClass('kb-method-parameter-error-mssg').hide();
            const $errorRow = $('<div>')
                .addClass('row')
                .append($('<div>').addClass(self.nameColClass))
                .append($errorPanel.addClass(self.inputColClass));

            const $allRowComponents = $('<div>').append($row).append($errorRow);
            self.$rowsContainer.append($allRowComponents);
            self.rowInfo.push({
                uuid: uuidForRemoval,
                $row: $row,
                $input: $input,
                $error: $errorPanel,
                $feedback: $feedbackTip,
                $all: $allRowComponents,
                $removalButton: $removalButton,
            });

            /* for some reason, we need to actually have the input added to the main panel before this will work */
            if (self.isUsingSelect2) {
                if (placeholder === '') {
                    placeholder = ' ';
                } // this allows us to cancel selections in select2
                this.setupSelect2($input, placeholder);
            }
            // if a default value is set, validate it.
            if (defaultValue) {
                this.isValid();
            }
        },
        getLookupTypes: function () {
            let lookupTypes = [],
                foundTypes = {},
                validWsTypes;
            if (this.spec.text_options && this.spec.text_options.valid_ws_types) {
                validWsTypes = this.spec.text_options.valid_ws_types;
                if (validWsTypes.length > 0) {
                    validWsTypes.forEach((type) => {
                        lookupTypes.push(type);
                        foundTypes[type] = true;
                    });
                }
            }
            return foundTypes;
        },
        updateDataList: function (workspaceObjectInfo) {
            const lookupTypes = this.getLookupTypes();

            this.validDataObjectList = workspaceObjectInfo
                .filter((info) => {
                    const type = info[2].split('-')[0];
                    return lookupTypes[type];
                })
                .map((info) => {
                    return {
                        name: info[1],
                        info: info,
                    };
                });

            // refresh the input options
            if (this.isUsingSelect2) {
                this.$elem.find('#' + this.spec.id).trigger('change');
            }
        },
        refresh: function () {
            const self = this;

            let needToMakeCall = false;
            const lookupTypes = [];
            const foundTypes = {};

            // could also check if we are using select2... that for now is only used for ws types
            if (self.spec.text_options) {
                if (self.spec.text_options.valid_ws_types) {
                    if (self.spec.text_options.valid_ws_types.length > 0) {
                        const types = self.spec.text_options.valid_ws_types;
                        for (let i = 0; i < types.length; i++) {
                            if (!foundTypes.hasOwnProperty(types[i])) {
                                lookupTypes.push(types[i]);
                                foundTypes[types[i]] = 1;
                                needToMakeCall = true;
                            }
                        }
                    }
                }
            }
            if (!needToMakeCall) {
                return;
            }

            // update the validDataObjectList
            this.trigger('dataLoadedQuery.Narrative', [
                lookupTypes,
                this.IGNORE_VERSION,
                $.proxy(function (objects) {
                    // we know from each parameter what each input type is.
                    // we also know how many of each type there is.
                    // so, iterate over all parameters and fulfill cases as below.
                    // extract the object infos
                    const allObjInfo = [];
                    for (const typeName in objects) {
                        if (objects.hasOwnProperty(typeName)) {
                            for (var i = 0; i < objects[typeName].length; i++) {
                                allObjInfo.push(objects[typeName][i]);
                            }
                        }
                    }
                    // sort them by date, then by name
                    allObjInfo.sort((a, b) => {
                        if (a[3] > b[3]) return -1; // sort by date
                        if (a[3] < b[3]) return 1; // sort by date
                        if (a[1] < b[1]) return -1; // sort by name
                        if (a[1] > b[1]) return 1; // sort by name
                        return 0;
                    });
                    /* object info
                     0: id
                     1: name
                     2: type
                     3: timestamp
                     4: version
                     5: owner
                     6: ws id
                     7: ws name
                     8: checksum
                     9: size
                     10: metadata*/

                    // populate the valid data object list
                    self.validDataObjectList = [];
                    for (var i = 0; i < allObjInfo.length; i++) {
                        self.validDataObjectList.push({
                            id: allObjInfo[i][1],
                            text: allObjInfo[i][1],
                            name: allObjInfo[i][1],
                            info: allObjInfo[i],
                        });
                    }

                    // refresh the input options
                    if (self.isUsingSelect2) {
                        self.setupSelect2(
                            self.$elem.find('#' + this.spec.id),
                            ' ',
                            null,
                            self.validDataObjectList
                        );
                    }
                }, this),
            ]);
        },
        /* private method - note: if placeholder is empty, then users cannot cancel a selection*/
        setupSelect2: function ($input, placeholder, defaultValue, data) {
            const self = this;
            let noMatchesFoundStr = 'No matching data found.';
            let tags = false;
            if (self.isOutputName) {
                noMatchesFoundStr = 'Enter a name for the output data object.';
                tags = true;
            }
            $input.select2({
                data: data,
                language: {
                    noResults: function () {
                        return noMatchesFoundStr;
                    },
                },
                tags: tags,
                placeholder: placeholder,
                allowClear: true,
                selectOnBlur: true,
                templateSelection: function (object) {
                    const display =
                        '<span class="kb-parameter-data-selection">' + object.text + '</span>';
                    return $(display);
                },
                templateResult: function (object) {
                    let display =
                        '<span style="word-wrap:break-word;"><b>' + object.text + '</b></span>';
                    if (object.info) {
                        // we can add additional info here in the dropdown ...
                        display = display + ' (v' + object.info[4] + ')<br>';
                        if (object.mm) {
                            display = display + '&nbsp&nbsp&nbsp<i>' + object.mm + '</i><br>';
                        }
                        display =
                            display +
                            '&nbsp&nbsp&nbsp<i>updated ' +
                            TimeFormat.getTimeStampStr(object.info[3]) +
                            '</i>';
                    }
                    return $(display);
                },
            });
        },
        /* private method */
        select2Matcher: function (term, text) {
            return text.toUpperCase().indexOf(term.toUpperCase()) >= 0;
        },
        /*
         * This is called when this method is run to allow you to check if the parameters
         * that the user has entered is correct.  You need to return an object that indicates
         * if the input is valid, or if not, if there are any error messages.  When this is
         * called, you should visually indicate which parameters are invalid by marking them
         * red (see kbaseNarrativeMethodInput for default styles).
         */
        isValid: function () {
            const self = this;
            if (!self.enabled) {
                return { isValid: true, errormssgs: [] }; // do not validate if disabled
            }
            let p = self.getParameterValue(true);
            if (p === null && !self.required) {
                return { isValid: true, errormssgs: [] };
            }
            let errorDetected = false;
            const errorMessages = [];
            if (p instanceof Array) {
            } else {
                p = [p];
            }
            for (let i = 0; i < p.length; i++) {
                let errorDetectedHere = false;
                if (p[i] === null) {
                    continue;
                }
                const pVal = p ? p[i].trim() : '';
                // if it is a required field and not empty, keep the required icon around but we have an error (only for the first element)
                if (pVal === '' && self.required && i === 0) {
                    self.rowInfo[i].$row.removeClass('kb-method-parameter-row-error');
                    self.rowInfo[i].$feedback
                        .removeClass()
                        .addClass(
                            'kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left'
                        )
                        .prop('title', 'required field');
                    self.rowInfo[i].$feedback.show();
                    self.rowInfo[i].$error.hide();
                    errorDetectedHere = true;
                    errorMessages.push('required field ' + self.spec.ui_name + ' missing.');
                } else {
                    if (self.spec.text_options) {
                        if (self.spec.text_options.validate_as) {
                            const fieldtype = self.spec.text_options.validate_as;
                            // int | float | nonnumeric | nospaces | none
                            if ('int' === fieldtype.toLowerCase()) {
                                if (pVal !== '') {
                                    var n = ~~Number(pVal);
                                    if (String(n) !== pVal) {
                                        self.rowInfo[i].$row.addClass(
                                            'kb-method-parameter-row-error'
                                        );
                                        self.rowInfo[i].$error.html('value must be an integer');
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                        errorDetectedHere = true;
                                        errorMessages.push(
                                            'value must be an integer in field ' + self.spec.ui_name
                                        );
                                    } else {
                                        if (self.spec.text_options.max_int) {
                                            if (n > self.spec.text_options.max_int) {
                                                self.rowInfo[i].$row.addClass(
                                                    'kb-method-parameter-row-error'
                                                );
                                                self.rowInfo[i].$error.html(
                                                    'the maximum value for this parameter is ' +
                                                        self.spec.text_options.max_int
                                                );
                                                self.rowInfo[i].$error.show();
                                                self.rowInfo[i].$feedback.removeClass();
                                                errorDetectedHere = true;
                                                errorMessages.push(
                                                    'the maximum value for this parameter is ' +
                                                        self.spec.text_options.max_int +
                                                        ' in ' +
                                                        self.spec.ui_name
                                                );
                                            }
                                        }
                                        if (self.spec.text_options.min_int) {
                                            if (n < self.spec.text_options.min_int) {
                                                self.rowInfo[i].$row.addClass(
                                                    'kb-method-parameter-row-error'
                                                );
                                                self.rowInfo[i].$error.html(
                                                    'the minimum value for this parameter is ' +
                                                        self.spec.text_options.min_int
                                                );
                                                self.rowInfo[i].$error.show();
                                                self.rowInfo[i].$feedback.removeClass();
                                                errorDetectedHere = true;
                                                errorMessages.push(
                                                    'the minimum value for this parameter is ' +
                                                        self.spec.text_options.min_int +
                                                        ' in ' +
                                                        self.spec.ui_name
                                                );
                                            }
                                        }
                                    }
                                }
                            } else if ('float' === fieldtype.toLowerCase()) {
                                if (isNaN(pVal)) {
                                    self.rowInfo[i].$row.addClass('kb-method-parameter-row-error');
                                    self.rowInfo[i].$error.html('value must be numeric');
                                    self.rowInfo[i].$error.show();
                                    self.rowInfo[i].$feedback.removeClass();
                                    errorDetectedHere = true;
                                    errorMessages.push(
                                        'value must be a number in field ' + self.spec.ui_name
                                    );
                                } else {
                                    var n = parseFloat(pVal);
                                    if (self.spec.text_options.max_float) {
                                        if (n > self.spec.text_options.max_float) {
                                            self.rowInfo[i].$row.addClass(
                                                'kb-method-parameter-row-error'
                                            );
                                            self.rowInfo[i].$error.html(
                                                'the maximum value for this parameter is ' +
                                                    self.spec.text_options.max_float
                                            );
                                            self.rowInfo[i].$error.show();
                                            self.rowInfo[i].$feedback.removeClass();
                                            errorDetectedHere = true;
                                            errorMessages.push(
                                                'the maximum value for this parameter is ' +
                                                    self.spec.text_options.max_float +
                                                    ' in ' +
                                                    self.spec.ui_name
                                            );
                                        }
                                    }
                                    if (self.spec.text_options.min_float) {
                                        if (n < self.spec.text_options.min_float) {
                                            self.rowInfo[i].$row.addClass(
                                                'kb-method-parameter-row-error'
                                            );
                                            self.rowInfo[i].$error.html(
                                                'the minimum value for this parameter is ' +
                                                    self.spec.text_options.min_float
                                            );
                                            self.rowInfo[i].$error.show();
                                            self.rowInfo[i].$feedback.removeClass();
                                            errorDetectedHere = true;
                                            errorMessages.push(
                                                'the minimum value for this parameter is ' +
                                                    self.spec.text_options.min_float +
                                                    ' in ' +
                                                    self.spec.ui_name
                                            );
                                        }
                                    }
                                }
                            }
                        }
                        if (self.spec.text_options.valid_ws_types) {
                            if (self.spec.text_options.valid_ws_types.length > 0) {
                                if (/\s/.test(pVal)) {
                                    if (self.rowInfo[i]) {
                                        self.rowInfo[i].$row.addClass(
                                            'kb-method-parameter-row-error'
                                        );
                                        self.rowInfo[i].$error.html(
                                            'spaces are not allowed in data object names'
                                        );
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                    }
                                    errorDetectedHere = true;
                                    errorMessages.push(
                                        'spaces are not allowed in data object names, in field ' +
                                            self.spec.ui_name
                                    );
                                } else if (/^\d+$/.test(pVal)) {
                                    if (self.rowInfo[i]) {
                                        self.rowInfo[i].$row.addClass(
                                            'kb-method-parameter-row-error'
                                        );
                                        self.rowInfo[i].$error.html(
                                            'data object names cannot be a number'
                                        );
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                    }
                                    errorDetectedHere = true;
                                    errorMessages.push(
                                        'data object names cannot be a number, in field ' +
                                            self.spec.ui_name
                                    );
                                } else if (!/^[a-z0-9|\.|\||_\-]*$/i.test(pVal)) {
                                    if (self.rowInfo[i]) {
                                        self.rowInfo[i].$row.addClass(
                                            'kb-method-parameter-row-error'
                                        );
                                        self.rowInfo[i].$error.html(
                                            'object names can only include symbols: _ - . |'
                                        );
                                        self.rowInfo[i].$error.show();
                                        self.rowInfo[i].$feedback.removeClass();
                                    }
                                    errorDetectedHere = true;
                                    errorMessages.push(
                                        "object names can only include symbols: '_','-','.','|', in field " +
                                            self.spec.ui_name
                                    );
                                }
                            }
                        }
                    }
                }

                // no error, so we hide the error if any, and show the "accepted" icon if it is not empty
                if (!errorDetectedHere || !self.enabled) {
                    if (self.rowInfo[i]) {
                        self.rowInfo[i].$row.removeClass('kb-method-parameter-row-error');
                        self.rowInfo[i].$error.hide();
                        self.rowInfo[i].$feedback.removeClass();
                        if (pVal !== '') {
                            self.rowInfo[i].$feedback
                                .removeClass()
                                .addClass(
                                    'kb-method-parameter-accepted-glyph glyphicon glyphicon-ok'
                                );
                        }
                    }
                } else {
                    if (pVal === '' && self.required && i === 0) {
                        //code
                    } else {
                        self.rowInfo[i].$feedback
                            .removeClass()
                            .addClass(
                                'kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left'
                            );
                    }
                }
                if (errorDetectedHere) {
                    errorDetected = true;
                }
            }
            return { isValid: !errorDetected, errormssgs: errorMessages };
        },
        /*
         * Necessary for Apps to disable editing parameters that are automatically filled
         * from a previous step.  Returns nothing.
         */
        disableParameterEditing: function () {
            // disable the input
            this.enabled = false;
            for (let i = 0; i < this.rowInfo.length; i++) {
                this.rowInfo[i].$input.prop('disabled', true);
                this.rowInfo[i].$feedback.removeClass();
                if (this.rowInfo[i].$removalButton) {
                    this.rowInfo[i].$removalButton.hide();
                }
            }
            this.$addRowController.hide();
        },
        /*
         * Allows those parameters to be renabled, which may be an option for advanced users.
         */
        enableParameterEditing: function () {
            // enable the input
            this.enabled = true;
            for (let i = 0; i < this.rowInfo.length; i++) {
                this.rowInfo[i].$input.prop('disabled', false);
                if (this.rowInfo[i].$removalButton) {
                    this.rowInfo[i].$removalButton.show();
                }
            }
            this.$addRowController.show();
            this.isValid();
        },
        lockInputs: function () {
            if (this.enabled) {
                for (var i = 0; i < this.rowInfo.length; i++) {
                    this.rowInfo[i].$input.prop('disabled', true);
                }
            }
            for (var i = 0; i < this.rowInfo.length; i++) {
                this.rowInfo[i].$feedback.removeClass();
                if (this.rowInfo[i].$removalButton) {
                    this.rowInfo[i].$removalButton.hide();
                }
            }
            this.$addRowController.hide();
        },
        unlockInputs: function () {
            if (this.enabled) {
                for (let i = 0; i < this.rowInfo.length; i++) {
                    this.rowInfo[i].$input.prop('disabled', false);
                    if (this.rowInfo[i].$removalButton) {
                        this.rowInfo[i].$removalButton.show();
                    }
                }
            }
            this.$addRowController.show();
            this.isValid();
        },
        addInputListener: function (onChangeFunc) {
            if (this.isUsingSelect2) {
                this.$elem.find('#' + this.spec.id).on('change', onChangeFunc);
            } else {
                this.$elem.find('#' + this.spec.id).on('input', onChangeFunc);
            }
        },
        /*
         * An App (or a narrative that needs to auto populate certain fields) needs to set
         * specific parameter values based on the App spec, so we need a way to do this.
         */
        setParameterValue: function (value) {
            if (value === null) {
                return;
            }
            if (value instanceof Array) {
            } else {
                value = [value];
            }

            for (let i = 0; i < value.length; i++) {
                const v = value[i].trim();
                if (i < this.rowInfo.length) {
                    if (v) {
                        this.setSpecificRowValue(i, v);
                    }
                } else {
                    this.addRow();
                    if (v) {
                        this.setSpecificRowValue(i, value[i]);
                    }
                }
            }
            this.isValid();
        },
        setSpecificRowValue: function (i, value) {
            if (this.isUsingSelect2) {
                if (this.enabled) {
                    this.rowInfo[i].$input.select2('data', { id: value, text: value });
                } else {
                    this.rowInfo[i].$input.prop('disable', false);
                    this.rowInfo[i].$input.select2('data', { id: value, text: value });
                    this.rowInfo[i].$input.prop('disable', true);
                }
            } else {
                this.rowInfo[i].$input.val(value);
            }
        },
        /*
         * We need to be able to retrieve any parameter value from this method.  Valid parameter
         * values may be strings, numbers, objects, or lists, but must match what is declared
         * in the method spec.
         */
        getParameterValue: function (ignoreType) {
            const value = [];
            const isOptional = this.spec.optional === 1 ? true : false;

            /* Shove everything into an array.
             * If we don't allow multiple, just take the first one.
             * If we allow optional, then allow for returning nulls.
             * If we're not ignoring the validate as type, then coerce the type into
             *    what it's expected to validate as.
             */
            for (let i = 0; i < this.rowInfo.length; i++) {
                let val = this.rowInfo[i].$input.val() || '';
                val = val.trim();
                if (!isOptional || val.length > 0) {
                    if (!ignoreType) {
                        val = this.coerceType(val);
                        if (val !== null) {
                            value.push(val);
                        }
                    } else {
                        value.push(val);
                    }
                } else {
                    if (val.length === 0) {
                        value.push(null);
                    }
                }
            }
            if (!this.allow_multiple) {
                if (value.length > 0) {
                    return value[0];
                } else {
                    return [];
                }
            }
            return value;
        },

        /**
         * Expects to start with a string.
         */
        coerceType: function (value) {
            if (value.length === 0) {
                return value;
            }
            switch (this.validateAs) {
                default:
                    return value;
                    break;
                case 'int':
                    return Number(value);
                    break;
                case 'float':
                    return Number(value);
                    break;
            }
        },

        // make a randomized string, assuming it's for an output.
        generateRandomOutputString: function (generProps) {
            const strArr = [];
            let symbols = 8;
            if (generProps['symbols']) symbols = generProps['symbols'];
            for (let i = 0; i < symbols; i++)
                strArr.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
            let ret = strArr.join('');
            if (generProps['prefix']) ret = generProps['prefix'] + ret;
            if (generProps['suffix']) ret = ret + String(generProps['suffix']);
            return ret;
        },
        prepareValueBeforeRun: function (methodSpec) {
            if (
                this.spec.text_options &&
                this.spec.text_options.is_output_name === 1 &&
                this.rowInfo.length === 1 &&
                this.rowInfo[0].$input.val().length === 0 &&
                this.spec.optional === 1
            ) {
                //var e = new Error('dummy');
                //var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
                //	.replace(/^\s+at\s+/gm, '')
                //	.replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
                //	.split('\n');
                //console.log(stack);
                const paramId = this.spec.id;
                var inputMapping = null;
                let isScript = false;
                var inputMapping = methodSpec['behavior']['kb_service_input_mapping'];
                if (!inputMapping) {
                    inputMapping = methodSpec['behavior']['script_input_mapping'];
                    isScript = true;
                }
                let generatedValueMapping = null;
                for (const i in inputMapping) {
                    const mapping = inputMapping[i];
                    const aParamId = mapping['input_parameter'];
                    if (aParamId && aParamId === paramId && mapping['generated_value']) {
                        generatedValueMapping = mapping['generated_value'];
                        break;
                    }
                }
                if (generatedValueMapping) {
                    this.setParameterValue(this.generateRandomOutputString(generatedValueMapping));
                }
            }
        },
    });
});
