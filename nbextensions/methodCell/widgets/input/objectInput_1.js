/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    './validation',
    './events',
    'bootstrap',
    'css!font-awesome'
], function ($, Promise, html, Workspace, serviceUtils, Validation, Events) {
    'use strict';

    // Constants
    var classSets = {
        standard: {
            nameColClass: 'col-md-2',
            inputColClass: 'col-md-5',
            hintColClass: 'col-md-5'
        },
        sidePanel: {
            nameColClass: 'col-md-12',
            inputColClass: 'col-md-12',
            hintColClass: 'col-md-12'
        }
    },
    t = html.tag,
        div = t('div'), input = t('input'), span = t('span'), button = t('button'),
        select = t('select'), option = t('option'),
        table = t('table'), tr = t('tr'), th = t('th'), td = t('td');


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
            },
            workspaceId = config.workspaceId,
            workspaceUrl = config.workspaceUrl,
            authToken = config.authToken || null,
            commBus = config.commBus;
        
        // Validate configuration.
        if (!workspaceId) {
            throw new Error('Workspace id required for the object widget');
        }
        if (!workspaceUrl) {
            throw new Error('Workspace url is required for the object widget');
        }
        
        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */
        function getInputValues() {
            return rows.map(function (row) {
                return row.$input.val();
            });
        }

        function setRowError(row, errorMessage, uiName) {
            row.$row.addClass('kb-method-parameter-row-error');
            row.$error
                .html(errorMessage)
                .show();
            row.$feedback.removeClass();
        }

        function clearRowError(row) {
            row.$row.removeClass('kb-method-parameter-row-error');
            row.$error
                .html('')
                .hide();
        }

        function hideError(row, value) {
            if (!row) {
                return;
            }
            row.$row.removeClass('kb-method-parameter-row-error');
            row.$error.hide();
            row.$feedback.removeClass();
        }

        function rowFeedbackNone(row) {
            row.$feedback
                .removeClass()
                .hide();
        }


        function rowFeedbackOk(row) {
            row.$feedback
                .removeClass()
                .addClass('kb-method-parameter-accepted-glyph fa fa-check')
                .prop('title', 'required field')
                .show();
        }


        function rowFeedbackRequired(row) {
            row.$feedback
                .removeClass()
                .addClass('kb-method-parameter-required-glyph fa fa-arrow-left')
                .prop('title', 'required field')
                .show();
        }

        function validate() {
            if (!options.enabled) {
                return {
                    isValid: true,
                    errorMessages: []
                };
            }

            var values = getInputValues(),
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
                    // Truth be told, we cannot even get here unless this condition
                    // is met.
                    if (spec.text_options && spec.text_options.valid_ws_types) {
                        // Entry of workspace object names.
                        // TODO any reason this can't be typed like int and float?         
                        validationResult = Validation.validateObjectRef(value);
                        if (!validationResult.isValid) {
                            errorMessage = validationResult.errorMessage;
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
                errorMessages: errorMessages,
                value: validationResult.parsedValue
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
        
        function getObjectsByType(type) {
            var workspace = new Workspace(workspaceUrl, {
                token: authToken
            });
            return workspace.list_objects({
                type: type,
                ids: [workspaceId]
            })
                .then(function (data) {
                    return data.map(function (objectInfo) {
                        return serviceUtils.objectInfoToObject(objectInfo);
                    });
                });
                
        }
        
        function fetchData() {
            var types = spec.text_options.valid_ws_types;
            return Promise.all(types.map(function (type) {
                return getObjectsByType(type);
            }))
                .then(function (objectSets) {
                    return Array.prototype.concat.apply([], objectSets);
                })
                .then(function (objects) {
                    objects.sort(function (a, b) {
                        if (a.name < b.name) {
                            return -1;
                        } else if (a.name === b.name) {
                            return 0;
                        }
                        else return 1;
                    });
                    return objects
                });
        }

        function addRow(defaultValue, data, showHint, useRowHighlight) {
            var placeholder = '',
                rowId = html.genId(),
                fieldControl, inputControl, selectControl,
                feedbackTip, parameterRow, id,
                nameCol, inputCol, removalButton, hintCol,
                events = Events.make();
            if (spec.text_options && spec.text_options.placeholder) {
                placeholder = spec.text_options.placeholder.replace(/(\r\n|\n|\r)/gm, '');
            }
            defaultValue = defaultValue || '';
            
            
            // There is an input control, and a dropdown,
            // TODO select2 after we get a handle on this...
            var selectOptions = data.map(function (objectInfo) {
                return option({
                    value: objectInfo.ref
                }, objectInfo.name);
            });
            
            
            selectControl = select({
                id: events.addEvent({type: 'change', handler: function (e) {
                    var result = validate();
                    if (result.isValid) {
                        commBus.send('changed', {
                           value: result.value
                        });
                    }
                }}),
                class: 'form-control',
                dataElement: 'input'
            }, [option({value: ''}, '')].concat(selectOptions));
            fieldControl = selectControl;


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
                    fieldControl
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
        function render(params, data) {
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
                addRow(defaultValue, data, true, true);
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
                        addRow(betterDefaultValue, data, false, false);
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
            return table({class: 'table table-striped'}, [
                tr([
                    th('Types'),
                    tr(td(table({class: 'table'}, spec.text_options.valid_ws_types.map(function (type) {
                        return tr(td(type));
                    }))))
                ])
            ]);
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
                return 'workspaceObjectReference';
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
            fetchData(params)
                .then(function (data) {
                    render(params, data);
                });
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
            info: info,
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