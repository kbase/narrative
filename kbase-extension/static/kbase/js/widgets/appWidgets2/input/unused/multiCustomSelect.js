define([
    'bluebird',
    'base/js/namespace',
    'kb_common/html',
    '../validation',
    'common/events',
    'common/ui',
    'common/runtime',
    './singleCustomSelect',
    'bootstrap',

    'css!font-awesome',
], (Promise, Jupyter, html, Validation, Events, UI, Runtime, SingleSelectInputWidget) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        button = t('button');

    function factory(config) {
        let options = {},
            spec = config.parameterSpec,
            constraints = spec.getConstraints(),
            container,
            parent,
            bus = config.bus,
            ui,
            model = {
                value: [],
            },
            runtime = Runtime.make(),
            widgets = [];

        function normalizeModel() {
            const newModel = model.value.filter((item) => {
                return item ? true : false;
            });
            model.value = newModel;
        }

        function setModelValue(value, index) {
            return Promise.try(() => {
                if (index !== undefined) {
                    if (value) {
                        model.value[index] = value;
                    } else {
                        model.value.splice(index, 1);
                    }
                } else {
                    if (value) {
                        model.value = value.map((item) => {
                            return item;
                        });
                    } else {
                        unsetModelValue();
                    }
                }
                normalizeModel();
            })
                .then(() => {
                    render();
                })
                .catch((err) => {
                    console.error('Error setting model value', err);
                });
        }

        function addModelValue(value) {
            return Promise.try(() => {
                model.value.push(value);
            }).then(() => {
                render();
            });
        }

        function unsetModelValue() {
            return Promise.try(() => {
                model.value = [];
            }).then((changed) => {
                render();
            });
        }

        function resetModelValue() {
            if (spec.spec.default_values && spec.spec.default_values.length > 0) {
                setModelValue(spec.spec.default_values);
            } else {
                unsetModelValue();
            }
        }

        /*
         * If the parameter is optional, and is empty, return null.
         * If it allows multiple values, wrap single results in an array
         * There is a weird twist where if it ...
         * well, hmm, the only consumer of this, isValid, expects the values
         * to mirror the input rows, so we shouldn't really filter out any
         * values.
         */

        function getInputValue() {
            return ui.getElement('input-container.input').value;
        }

        /*
         *
         * Text fields can occur in multiples.
         * We have a choice, treat single-text fields as a own widget
         * or as a special case of multiple-entry --
         * with a min-items of 1 and max-items of 1.
         *
         *
         */

        function copyProps(from, props) {
            const newObj = {};
            props.forEach((prop) => {
                newObj[prop] = from[prop];
            });
            return newObj;
        }

        function validate(rawValue) {
            return Promise.try(() => {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled',
                    };
                }

                const validationOptions = copyProps(spec.spec.dropdown_options, ['options']);

                validationOptions.required = spec.required();
                return Validation.validateTextString(rawValue, validationOptions);
            });
        }

        function updateValue() {}

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */

        function makeInputControl(events, bus) {
            let items = model.value.map((value, index) => {
                return makeSingleInputControl(value, index, events, bus);
            });

            items = items.concat(makeNewInputControl('', events, bus));

            const content = items.join('\n');
            return content;
        }

        function makeSingleInputControl(currentValue, index, events, bus) {
            // CONTROL
            let preButton,
                postButton,
                widgetId = html.genId(),
                inputBus = runtime.bus().makeChannelBus(null, 'Multi text input'),
                inputWidget = SingleSelectInputWidget.make({
                    bus: inputBus,
                    // initialValue: config.initialValue,
                    // does not make sense to have a text item be required,
                    // nor multiple
                    //                    constraints: {
                    //                        min: constraints.min,
                    //                        max: constraints.max,
                    //                        regexp: constraints.regexp
                    //                    },
                    parameterSpec: spec,
                    fieldSpec: config.fieldSpec,
                }),
                widgetWrapper = {
                    id: widgetId,
                    instance: inputWidget,
                    bus: inputBus,
                    index: index,
                },
                placeholder = div({ id: widgetId });

            widgets.push(widgetWrapper);

            // set up listeners for the input
            inputBus.on('sync', (message) => {
                const value = model.value[index];
                if (value) {
                    inputBus.emit('update', {
                        value: value,
                    });
                }
            });
            inputBus.on('validation', (message) => {
                if (message.diagnosis === 'optional-empty') {
                    // alert('delete me!');
                    model.value.splice(widgetWrapper.index, 1);
                    bus.emit('changed', {
                        newValue: model.value,
                    });
                    render();
                }
            });
            inputBus.on('changed', (message) => {
                model.value[index] = message.newValue;
                // TODO: validate the main control...
                bus.emit('changed', {
                    newValue: model.value,
                });
            });

            preButton = div(
                {
                    class: 'input-group-addon kb-input-group-addon',
                    style: { width: '5ex', padding: '0' },
                },
                String(index + 1) + '.'
            );
            postButton = div(
                { class: 'input-group-addon kb-input-group-addon', style: { padding: '0' } },
                button(
                    {
                        class: 'btn btn-danger btn-link btn-xs',
                        type: 'button',
                        style: { width: '4ex' },
                        dataIndex: String(index),
                        id: events.addEvent({
                            type: 'click',
                            handler: function (e) {
                                // no, we don't need to consult the control, we just remove
                                // it...
                                model.value.splice(widgetWrapper.index, 1);
                                //var index = e.target.getAttribute('data-index'),
                                //    control = container.querySelector('input[data-index="' + index + '"]');
                                //control.value = '';
                                //control.dispatchEvent(new Event('change'));
                                bus.emit('changed', {
                                    newValue: model.value,
                                });
                                render();
                            },
                        }),
                    },
                    'x'
                )
            );
            return div({ class: 'input-group', dataIndex: String(index) }, [
                preButton,
                placeholder,
                postButton,
            ]);
        }

        function makeNewInputControl(currentValue, events, bus) {
            // CONTROL
            let preButton,
                postButton,
                widgetId = html.genId(),
                inputBus = runtime.bus().makeChannelBus(null, 'New input for text input'),
                inputWidget = SingleSelectInputWidget.make({
                    bus: inputBus,
                    // initialValue: config.initialValue,
                    //                    constraints: {
                    //                        min: constraints.min,
                    //                        max: constraints.max,
                    //                        regexp: constraints.regexp
                    //                    },
                    parameterSpec: spec,
                    fieldSpec: config.fieldSpec,
                }),
                placeholder = div({ id: widgetId });

            widgets.push({
                id: widgetId,
                instance: inputWidget,
                bus: inputBus,
            });
            inputBus.on('sync', (message) => {
                // we don't have a default value setting for a new item
                // in a collection.
                const value = '';
                //if (value) {
                inputBus.emit('update', {
                    value: value,
                });
                //}
            });
            inputBus.on('changed', (message) => {
                model.value.push(message.newValue);

                // TODO: and insert a new row ...

                // first attempt, re-render the whole shebang.
                render();

                // TODO: validate the main control...
                bus.emit('changed', {
                    newValue: model.value,
                });
            });

            preButton = div(
                {
                    class: 'input-group-addon kb-input-group-addon',
                    style: { width: '5ex', padding: '0' },
                },
                ''
            );
            postButton = div(
                { class: 'input-group-addon kb-input-group-addon', style: { padding: '0' } },
                button(
                    {
                        class: 'btn btn-primary btn-link btn-xs',
                        type: 'button',
                        style: { width: '4ex' },
                        id: events.addEvent({
                            type: 'click',
                            handler: function (e) {
                                // alert('add me');
                            },
                        }),
                    },
                    '+'
                )
            );

            return div({ class: 'input-group' }, [preButton, placeholder, postButton]);
        }

        function render() {
            // if we have input widgets already, tear them down.

            widgets.forEach((widget) => {
                widget.bus.emit('stop');
                // TODO figure out how to remove unused channels.
                // widget.bus.done();
            });
            widgets = [];
            // we don't have to wait for anything...

            const events = Events.make(),
                control = makeInputControl(events, bus);

            ui.setContent('input-container', control);
            widgets.forEach((widget) => {
                widget.instance.start().then(() => {
                    widget.bus.emit('run', {
                        debug: true,
                        node: document.querySelector('#' + widget.id),
                    });
                });
            });
            events.attachEvents(container);
        }

        function layout(events) {
            const content = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );
            return {
                content: content,
                events: events,
            };
        }

        function autoValidate() {
            return Promise.all(
                model.value.map((value, index) => {
                    // could get from DOM, but the model is the same.
                    const rawValue = container.querySelector('[data-index="' + index + '"]').value;
                    // console.log('VALIDATE', value);
                    return validate(rawValue);
                })
            ).then((results) => {
                // a bit of a hack -- we need to handle the
                // validation here, and update the individual rows
                // for now -- just create one mega message.
                let errorMessages = [],
                    validationMessage;
                results.forEach((result, index) => {
                    if (result.errorMessage) {
                        errorMessages.push(result.errorMessage + ' in item ' + index);
                    }
                });
                if (errorMessages.length) {
                    validationMessage = {
                        diagnosis: 'invalid',
                        errorMessage: errorMessages.join('<br/>'),
                    };
                } else {
                    validationMessage = {
                        diagnosis: 'valid',
                    };
                }
                bus.emit('validation', validationMessage);
            });
        }

        // LIFECYCLE API

        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    ui = UI.make({ node: container });

                    const events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', (message) => {
                        resetModelValue();
                    });
                    bus.on('update', (message) => {
                        setModelValue(message.value);
                    });
                    bus.on('refresh', () => {});
                    bus.emit('sync');
                });
            });
        }

        return {
            start: start,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
