define([
    'bluebird',
    'common/html',
    '../validators/resolver',
    '../validators/constants',
    'common/ui',
    'util/util',
    '../paramResolver',
    '../fieldWidgetCompact',

    'bootstrap',
], (Promise, html, ValidationResolver, Constants, UI, Util, ParamResolver, FieldWidget) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        resolver = ParamResolver.make(),
        baseCssClass = 'kb-appInput__struct';

    function factory(config) {
        let container,
            parent,
            ui,
            structFields = {};
        const spec = config.parameterSpec,
            bus = config.bus,
            viewModel = {
                data: {},
                display: {},
                state: {
                    enabled: null,
                },
            },
            fieldLayout = spec.ui.layout,
            struct = spec.parameters;

        if (spec.data.constraints.required || config.initialValue) {
            viewModel.state.enabled = true;
        } else {
            viewModel.state.enabled = false;
        }

        function setModelValue(value, display) {
            viewModel.data = value;
            viewModel.display = display || {};
        }

        function resetModelValue() {
            if (spec.defaultValue) {
                setModelValue(Util.copy(spec.defaultValue), {});
            } else {
                setModelValue({}, {});
            }
        }

        function validate(rawValue) {
            return Promise.try(() => {
                return ValidationResolver.validate(rawValue, spec);
            });
        }

        function makeInputControl() {
            const promiseOfFields = fieldLayout.map((fieldName) => {
                const fieldSpec = struct.specs[fieldName],
                    fieldValue = viewModel.data[fieldName],
                    fieldDisplayValue = viewModel.display[fieldName];

                return makeSingleInputControl(fieldValue, fieldDisplayValue, fieldSpec);
            });

            return Promise.all(promiseOfFields).then((fields) => {
                const content = div(
                    {
                        class: 'row',
                    },
                    fields
                        .map((field) => {
                            return div({
                                id: field.id,
                                class: `${baseCssClass}__field`,
                            });
                        })
                        .join('\n')
                );
                return {
                    content,
                    fields,
                };
            });
        }

        function doChanged(id, newValue, newDisplayValue) {
            // Absorb and propagate the new value...
            viewModel.data[id] = Util.copy(newValue);
            if (newDisplayValue) {
                viewModel.display[id] = Util.copy(newDisplayValue);
            }
            bus.emit('changed', {
                newValue: Util.copy(viewModel.data),
                newDisplayValue: Util.copy(viewModel.display),
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
        function makeSingleInputControl(value, displayValue, fieldSpec) {
            return resolver.loadViewControl(fieldSpec).then((widgetFactory) => {
                const id = html.genId(),
                    fieldWidget = FieldWidget.make({
                        inputControlFactory: widgetFactory,
                        showHint: true,
                        useRowHighight: true,
                        initialValue: value,
                        initialDisplayValue: displayValue,
                        parameterSpec: fieldSpec,
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
                    if (message.diagnosis === Constants.DIAGNOSIS.OPTIONAL_EMPTY) {
                        bus.emit('changed', {
                            newValue: Util.copy(viewModel.data),
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
                    id,
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
                return makeInputControl().then((result) => {
                    ui.setContent('input-container', result.content);
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
                    ui.setContent('input-container', '');
                    structFields = {};
                });
            }
        }

        function render() {
            container.innerHTML = div(
                {
                    dataElement: 'main-panel',
                },
                div({
                    dataElement: 'input-container',
                    class: `${baseCssClass}__subcontrols`,
                })
            );
        }

        function start(arg) {
            return Promise.try(() => {
                parent = arg.node;
                container = parent.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });

                viewModel.data = Util.copy(config.initialValue);
                viewModel.display = Util.copy(config.initialDisplayValue || {});
            })
                .then(() => {
                    return render();
                })
                .then(() => {
                    return renderSubcontrols();
                })
                .then(() => {
                    bus.on('reset-to-defaults', () => {
                        resetModelValue();
                    });

                    bus.on('update', (message) => {
                        // Update the model, and since we have sub widgets,
                        // we should send the individual data to them.
                        // TODO: container environment should know about enable/disabled state?
                        // FORNOW: just ignore
                        if (viewModel.state.enabled) {
                            viewModel.data = Util.copy(message.value);
                            if (message.displayValue) {
                                viewModel.display = Util.copy(message.display);
                            }
                            Object.keys(message.value).forEach((id) => {
                                structFields[id].instance.bus.emit('update', {
                                    value: message.value[id],
                                    displayValue: message.display[id],
                                });
                            });
                        }
                    });

                    // A fake submit.
                    bus.on('submit', () => {
                        bus.emit('submitted', {
                            value: Util.copy(viewModel.data),
                        });
                    });
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
            start,
            stop,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
