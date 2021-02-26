define([
    'bluebird',
    'kb_common/html',
    '../validators/resolver',
    'common/events',
    'common/ui',
    'common/lang',
    '../paramResolver',
    '../fieldWidgetCompact',

    'bootstrap',
    'css!font-awesome',
], (Promise, html, Validation, Events, UI, lang, Resolver, FieldWidget) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        resolver = Resolver.make();

    function factory(config) {
        let spec = config.parameterSpec,
            bus = config.bus,
            container,
            parent,
            ui,
            viewModel = {
                data: {},
                state: {
                    enabled: null,
                },
            },
            structFields = {},
            // model = {
            //     value: {},
            //     enabled: null
            // },
            // structFields,
            fieldLayout = spec.ui.layout,
            struct = spec.parameters;

        if (spec.data.constraints.required || config.initialValue) {
            viewModel.state.enabled = true;
        } else {
            viewModel.state.enabled = false;
        }

        function setModelValue(value) {
            return Promise.try(() => {
                viewModel.data = value;
            })
                .then(() => {
                    // render();
                })
                .catch((err) => {
                    console.error('Error setting model value', err);
                });
        }

        function unsetModelValue() {
            return Promise.try(() => {
                viewModel.data = {};
            }).then(() => {
                // render();
            });
        }

        function resetModelValue() {
            if (spec.defaultValue) {
                setModelValue(lang.copy(spec.defaultValue));
            } else {
                unsetModelValue();
            }
        }

        function validate(rawValue) {
            return Promise.try(() => {
                // var validationOptions = {
                //     required: spec.data.constraints.required
                // };
                return Validation.validate(rawValue, spec);
            });
        }

        function makeInputControl(events, bus) {
            const promiseOfFields = fieldLayout.map((fieldName) => {
                const fieldSpec = struct.specs[fieldName];
                const fieldValue = viewModel.data[fieldName];

                return makeSingleInputControl(fieldValue, fieldSpec, events, bus);
            });

            // TODO: support different layouts, this is a simple stacked
            // one for now.

            return Promise.all(promiseOfFields).then((fields) => {
                const layout = div(
                    {
                        class: 'row',
                    },
                    fields
                        .map((field) => {
                            return div({
                                id: field.id,
                                style: { border: '0px orange dashed', padding: '0px' },
                            });
                        })
                        .join('\n')
                );
                return {
                    content: layout,
                    fields: fields,
                };
            });
        }

        function doChanged(id, newValue) {
            // Absorb and propagate the new value...
            viewModel.data[id] = lang.copy(newValue);
            bus.emit('changed', {
                newValue: lang.copy(viewModel.data),
            });

            // Validate and propagate.
            // Note: the struct control does not display local error messages. Each
            // input widget will have an error message if applicable, so not reason
            // (at present) to have yet another one...

            validate(viewModel.data).then((result) => {
                bus.emit('validation', result);
            });
        }

        /*
         * The single input control wraps a field widget, which provides the
         * wrapper around the input widget itself.
         */
        function makeSingleInputControl(value, fieldSpec) {
            return resolver.loadViewControl(fieldSpec).then((widgetFactory) => {
                const id = html.genId(),
                    fieldWidget = FieldWidget.make({
                        inputControlFactory: widgetFactory,
                        showHint: true,
                        useRowHighight: true,
                        initialValue: value,
                        // appSpec: appSpec,
                        parameterSpec: fieldSpec,
                        // workspaceId: workspaceInfo.id,
                        referenceType: 'ref',
                        paramsChannelName: config.paramsChannelName,
                    });

                // set up listeners for the input
                fieldWidget.bus.on('sync', () => {
                    const value = viewModel.data[fieldSpec.id];
                    if (value) {
                        fieldWidget.bus.emit('update', {
                            value: value,
                        });
                    }
                });
                fieldWidget.bus.on('validation', (message) => {
                    if (message.diagnosis === 'optional-empty') {
                        bus.emit('changed', {
                            newValue: lang.copy(viewModel.data),
                        });
                    }
                });
                fieldWidget.bus.on('changed', (message) => {
                    doChanged(fieldSpec.id, message.newValue);
                });

                fieldWidget.bus.on('touched', () => {
                    bus.emit('touched', {
                        parameter: fieldSpec.id,
                    });
                });

                return {
                    id: id,
                    fieldName: fieldSpec.id,
                    instance: fieldWidget,
                };
            });
        }

        /*
         * Render the struct input control and place, place it into the dom,
         * attach events, and start up the field widgets.
         */
        function renderSubcontrols() {
            if (viewModel.state.enabled) {
                const events = Events.make({
                    node: container,
                });
                return makeInputControl(events).then((result) => {
                    ui.setContent('input-container.subcontrols', result.content);
                    events.attachEvents();
                    structFields = {};
                    result.fields.forEach((field) => {
                        structFields[field.fieldName] = field;
                    });
                    // Start up all the widgets

                    return Promise.all(
                        result.fields.map((field) => {
                            return field.instance.start({
                                node: document.getElementById(field.id),
                            });
                        })
                    );
                });
            } else {
                return Promise.all(
                    Object.keys(structFields).map((fieldName) => {
                        return structFields[fieldName].instance.stop();
                    })
                ).then(() => {
                    ui.setContent('input-container.subcontrols', '');
                    structFields = {};
                });
            }
        }

        function renderStruct() {
            const layout = div(
                {
                    style: {
                        'border-left': '5px silver solid',
                        padding: '2px',
                        margin: '6px',
                    },
                },
                [div({ dataElement: 'subcontrols' })]
            );
            ui.setContent('input-container', layout);
        }

        function render(events) {
            container.innerHTML = div(
                {
                    dataElement: 'main-panel',
                },
                [div({ dataElement: 'input-container' })]
            );

            renderStruct(events);
        }

        // LIFECYCLE API

        // Okay, we need to

        function start(arg) {
            let events;
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });
                events = Events.make({ node: container });

                viewModel.data = lang.copy(config.initialValue);

                // return bus.request({}, {
                //     key: 'get-param-state'
                // });
            })
                .then(() => {
                    return render(events);
                })
                .then(() => {
                    return renderSubcontrols();
                })
                .then(() => {
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', () => {
                        resetModelValue();
                    });

                    bus.on('update', (message) => {
                        // Update the model, and since we have sub widgets,
                        // we should send the individual data to them.
                        // setModelValue(message.value);
                        // TODO: container environment should know about enable/disabled state?
                        // FORNOW: just ignore
                        if (viewModel.state.enabled) {
                            viewModel.data = lang.copy(message.value);
                            Object.keys(message.value).forEach((id) => {
                                structFields[id].instance.bus.emit('update', {
                                    value: message.value[id],
                                });
                            });
                        }
                    });

                    // A fake submit.
                    bus.on('submit', () => {
                        bus.emit('submitted', {
                            value: lang.copy(viewModel.data),
                        });
                    });

                    // bus.on('')
                    // The controller of this widget will be smart enough to
                    // know...
                    // bus.emit('sync');
                })
                .catch((err) => {
                    console.error('ERROR', err);
                    container.innerHTML = err.message;
                });
        }

        function stop() {
            return Promise.try(() => {
                if (structFields) {
                    return Promise.all(
                        Object.keys(structFields).map((id) => {
                            return structFields[id].instance.stop();
                        })
                    );
                }
            }).then(() => {
                if (parent && container) {
                    parent.removeChild(container);
                }
            });
        }

        return {
            start: start,
            stop: stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
