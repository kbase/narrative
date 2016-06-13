/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kb_common/html',
    'common/validation',
    'common/events',
    'bootstrap',
    'css!font-awesome'
], function ($, html, Validation, Events) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), span = t('span'), button = t('button');


    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            rows = [],
            parent,
            container,
            $container,
            places = {
                addRowController: null,
                rows: null
            };

        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */
        function getParameterValues() {
            return rows.map(function (row) {
                return row.$input.val();
            });
        }

        function validate() {
            if (!options.enabled) {
                return {
                    isValid: true,
                    errorMessages: []
                };
            }

            var values = getParameterValues(),
                someErrorDetected = false,
                errorMessages = [];

            values.forEach(function (rawValue, index) {
                var errorMessage,
                    value  = rawValue.trim(),
                    row = rows[index],
                    fieldType,
                    validationResult;
                    
                // Validate if we need to.
                if (options.required && index === 0 && !value) {
                    errorMessage = 'required field ' + spec.ui_name + ' missing';
                } else if (!options.required && value === '') {
                    // just skip it, it is ok.
                } else {
                    if (spec.text_options) {
                        if (spec.text_options.validate_as) {
                            fieldType = spec.text_options.validate_as.toLowerCase();
                            switch (fieldType) {
                                case 'int':
                                    validationResult = Validation.validateInteger(value, spec.text_options);
                                    if (!validationResult.isValid) {
                                        errorMessage = validationResult.errorMessage;
                                    } else {
                                        // Events may be configured by the widget host.
                                        // TODO: this should be an event and not a callback.
                                        if (config.events.change) {
                                            try {
                                                config.events.change(validationResult.parsedValue);
                                            } catch (ex) {
                                                console.error('ERROR', ex);
                                            }
                                        }
                                    }
                                    break;
                                case 'float':
                                    validationResult = Validation.validateFloat(value, spec.text_options);
                                    if (!validationResult.isValid) {
                                        errorMessage = validationResult.errorMessage;
                                    }
                                    break;
                            }
                        } else if (spec.text_options.valid_ws_types) {
                            // Entry of workspace object names.
                            // TODO any reason this can't be typed like int and float?         
                            validationResult = Validation.validateWorkspaceObjectName(value);
                            if (!validationResult.isValid) {
                                errorMessage = validationResult.errorMessage;
                            }
                        }
                    }
                }

                // todo -- special handling for multiple values.
                if (errorMessage) {
                    setRowError(row, errorMessage, spec.ui_name);
                    if (options.required) {
                        if (value === '') {
                            rowFeedbackRequired(row);
                        } else {
                            rowFeedbackOk(row);
                        }
                    } else {
                        rowFeedbackNone(row);
                    }
                    errorMessages.push(errorMessage + 'in field ' + spec.ui_name);
                    someErrorDetected = true;
                } else {
                    clearRowError(row);
                    if (options.required) {
                        rowFeedbackOk(row);
                    } else {
                        if (value === '') {
                            rowFeedbackNone(row);
                        } else {
                            rowFeedbackOk(row);
                        }
                    }
                }
            });

            return {
                isValid: !someErrorDetected,
                errorMessages: errorMessages
            };
        }

        function removeRow(rowId) {
            rows = rows.map(function (row) {
                if (row.id === rowId) {
                    row.$row.remove();
                    return false;
                }
                return row;
            }).filter(function (row) {
                return row;
            });
        }



        function addRow(defaultValue, showHint, useRowHighlight) {
            var placeholder = '',
                rowId = html.genId(),
                inputControl, feedbackTip, parameterRow, id,
                nameCol, inputCol, removalButton, hintCol,
                events = Events.make();
            if (spec.text_options && spec.text_options.placeholder) {
                placeholder = spec.text_options.placeholder.replace(/(\r\n|\n|\r)/gm, '');
            }
            defaultValue = defaultValue || '';

            inputControl = input({
                id: events.addEvent({type: 'change', handler: validate}),
                placeholder: placeholder,
                value: defaultValue,
                type: 'text',
                dataElement: 'input',
                style: {width: '100%'},
                class: 'form-control'
            });


            // this is a column adjacent to the form controls which provides status flags (error, data required, data complete and ok)
            // TODO: this and other elements should be set up without any styles,
            // and then the initial evaluation of the parameters vis-a-vis the ui will
            // set the correct styles...
            if (options.required && showHint) {
                feedbackTip = span({
                    class: 'kb-method-parameter-required-glyph fa fa-arrow-left',
                    title: 'required field',
                    dataElement: 'feedback'
                });
            } else {
                feedbackTip = span({dataElement: 'feedback'});
            }


            // paremeter name display
            var style = {};
            if (options.environment === 'sidePanel') {
                style = {
                    textAlign: 'left', paddingLeft: '10px'
                };
            }
            nameCol = div({
                class: [options.classes.nameColClass, 'kb-method-parameter-name'].join(' '),
                style: style
            }, [(function () {
                    if (showHint) {
                        return spec.ui_name;
                    }
                })]);

            // Input column display
            inputCol = div({class: [options.classes.inputColClass, 'kb-method-parameter-input'].join(' ')}, [
                div({style: {widgth: '100%', display: 'inline-block'}}, [
                    inputControl
                ]),
                div({style: {display: 'inline-block'}}, [
                    feedbackTip
                ])
            ]);

            if (showHint) {
                var infoTip;
                if (spec.description && spec.short_hint !== spec.description) {
                    infoTip = span({
                        class: 'fa fa-info kb-method-parameter-info',
                        dataToggle: 'tooltip',
                        dataPlacement: 'auto',
                        container: 'body',
                        html: 'true',
                        title: spec.description
                    });
                }
                hintCol = div({class: [options.classes.hintColClass, 'kb-method-parameter-hint'].join(' ')}, [
                    spec.short_hint, infoTip
                ]);
            } else {
                hintCol = div({class: [options.classes.hintColClass, 'kb-method-parameter-hint'].join(' ')}, [
                    button({class: 'kb-default-btn kb-btn-sm', id: events.addEvent({type: 'click', handler: function () {
                                removeRow(rowId);
                            }})}, [
                        span({class: 'kb-parameter-data-row-remove fa fa-remove'}, [
                            'remove ' + spec.ui_name
                        ])
                    ])
                ]);
            }


            // put it all together.

            // The row itself.
            parameterRow = div({class: 'row kb-method-parameter-row', dataElement: 'row'}, [
                nameCol, inputCol, hintCol
            ]);
            if (options.useRowHighlight) {
                events.addEvent({type: 'mouseeneter', selector: '#' + rowId + ' [data-element="row"]', handler: function (e) {
                        e.target.classList.add('kb-method-parameter-row-hover');
                    }});
                events.addEvent({type: 'mouseleave', selector: '#' + rowId + ' [data-element="row"]', handler: function (e) {
                        e.target.classList.add('kb-method-parameter-row-hover');
                    }});
            }

            // Error display
            var errorRow = div({class: 'row', dataElement: 'error-panel'}, [
                div({class: options.classes.nameColClass}),
                div({
                    class: ['kb-method-parameter-error-message', options.classes.inputColClass].join(' '),
                    style: {display: 'none'},
                    dataElement: 'error-message'
                })
            ]);

            var row = div({
                dataElement: 'field',
                id: rowId
            }, [parameterRow, errorRow]);

            // Finally, into the DOM!
            $container.find('[data-element="rows-container"]').append(row);

            events.attachEvents($container.get(0));

            // Now we keep a handy copy of nodes around.
            // In truth, we could implement this as an api and avoid this junk, which also 
            // embeds a lot of jquery/dom nonsense.
            var $field = $container.find('#' + rowId);

            // The row exists to provide mount points for the various ui
            // elements for this control.
            rows.push({
                rowId: rowId,
                $row: $field.find('[data-element="row"]'),
                $input: $field.find('[data-element="input"]'),
                $error: $field.find('[data-element="error-message"]'),
                $feedback: $field.find('[data-element="feedback"]'),
                $field: $field,
                $all: $field,
                $removalButton: $field.find('[data-element="removal-button"]')
            });

        }


        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        function render() {
            var defaultValue = '',
                defaultValues;

            if (!options.multiple) {
                if (spec.default_values) {
                    defaultValues = spec.default_values;
                    // TODO!!!
                    // the condition for using the first defaultvalue in the defaultValues 
                    // array is suspect ... 
                    // this says we use the default value if it is not an empty string or set as undefined
                    // (because it can't really be undefined or we would not be here)
                    // so this basically collapses to if it is an empty string use an empty string, otherwise
                    // use the default value.
                    defaultValue = (defaultValues[0] !== '' && defaultValues[0] !== undefined) ? defaultValues[0] : '';
                }
                addRow(defaultValue, true, true);
            } else {

                // TODO: the main panel hover bit...

                if (spec.default_values) {
                    defaultValues = spec.default_values;
                    defaultValue = (defaultValues[0] !== '' && defaultValues[0] !== undefined) ? defaultValues[0] : '';
                }

                // TODO what is the funny bit with using the default value first?

                if (spec.default_values) {
                    defaultValues = spec.default_values;
                    defaultValues.forEach(function (defaultValue) {
                        var betterDefaultValue = (defaultValue !== '' && defaultValue !== undefined) ? defaultValue : '';
                        addRow(betterDefaultValue, false, false);
                    });
                }

                // TODO: addTheAddRowController();

            }
        }

        function layout() {
            var events = Events.make(),
                content;
            if (options.multiple) {
                content = div({
                    class: 'kb-method-parameter-row',
                    dataElement: 'main-panel',
                    id: events.addEvents({events: [
                            {
                                type: 'mouseeneter',
                                handler: function (e) {
                                    e.target.classList.add('kb-method-parameter-row-hover');
                                }
                            },
                            {
                                type: 'mouseleave',
                                handler: function (e) {
                                    e.target.classList.remove('kb-method-parameter-row-hover');
                                }
                            }
                        ]})}, [
                    div({dataElement: 'rows-container'})
                ]);
            } else {
                content = div({
                    dataElement: 'main-panel'
                }, [
                    div({dataElement: 'rows-container'})
                ]);
            }
            return {
                content: content,
                events: events
            };
        }

        // CLIENT API

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
            return '';
        }

        function multipleItems() {
            return options.multiple;
        }

        function fieldType() {
            return spec.field_type;
        }

        function type() {
            return spec.type;
        }

        function dataType() {
            if (!spec.text_options) {
                return 'text';
            }
            var validateAs = spec.text_options.validate_as;
            type;
            if (validateAs) {
                return validateAs;
            }

            if (spec.text_options.valid_ws_types) {
                return 'workspaceObjectName';
            }

            return 'unknown';
        }

        function uiClass() {
            return spec.ui_class;
        }

        function required() {
            return options.required;
        }

        function control() {
            return 'control here';
        }

        // DATA API

        /*
         * If multiple values are supported, we always return an array
         * If not, always return an atomic value
         * // TODO: this data should always be scrubbed!
         */
        function value() {
            console.log('INPUT', rows[0].$input);
            if (options.multiple) {
                return rows.map(function (row) {
                    return row.$input.val();
                });
            }
            return rows[0].$input.val();
        }


        // LIFECYCLE API

        var domId = html.genId();
        var widgetRootNode;
        function id() {
            return domId;
        }

        function init() {
            // Normalize the parameter specification settings.
            // TODO: much of this is just silly, we should be able to use the spec 
            //   directly in most places.
            options.environment = config.isInSidePanel ? 'sidePanel' : 'standard';
            options.classes = classSets[options.environment];
            options.multiple = spec.allow_multiple ? true : false;
            options.required = spec.optional ? false : true;
            options.isOutputName = spec.text_options && spec.text_options.is_output_name;
            options.enabled = true;
            console.log('HMM', spec);
        }

        function attach(node) {
            parent = node;

            widgetRootNode = parent.querySelector('#' + domId);
            if (!widgetRootNode) {
                throw new Error('The domId for this widget does not exist in the parent context');
            }

            // container = node.append(document.createElement('div'));
            $container = $(widgetRootNode);
            var theLayout = layout();
            widgetRootNode.innerHTML = theLayout.content;
            theLayout.events.attachEvents(widgetRootNode);
        }

        function start(params) {
            // return render();
            render(params);
        }

        return {
            id: id,
            init: init,
            attach: attach,
            start: start,
            name: name,
            label: label,
            hint: hint,
            description: description,
            info: description,
            multipleItems: multipleItems,
            fieldType: fieldType,
            type: type,
            dataType: dataType,
            uiClass: uiClass,
            required: required,
            control: control,
            value: value
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});