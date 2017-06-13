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
    'css!font-awesome'
], function (
    Promise,
    html,
    Validation,
    Events,
    UI,
    lang,
    Resolver,
    FieldWidget
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        button = t('button'),
        p = t('p'),
        resolver = Resolver.make();

    function factory(config) {
        var spec = config.parameterSpec,
            bus = config.bus,
            container,
            hostNode,
            ui,
            viewModel = {
                data: {},
                state: {
                    enabled: null
                }
            },
            structFields = {},
            fieldLayout = spec.ui.layout,
            struct = spec.parameters,
            places = {};
        if (spec.data.constraints.required || 
            config.initialValue || 
            spec.data.constraints.disableable === false) {
            viewModel.state.enabled = true;
        } else {
            viewModel.state.enabled = false;
        }

        function setModelValue(value) {
            return Promise.try(function () {
                viewModel.data = value;
            })
            .catch(function (err) {
                console.error('Error setting model value', err);
            });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                viewModel.data = {};
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
            return Promise.try(function () {
                // var validationOptions = {
                //     required: spec.data.constraints.required
                // };
                return Validation.validate(rawValue, spec);
            });
        }

        function doToggleEnableControl() {
            var button = document.querySelector('#' + places.enableControl + ' button');
            if (viewModel.state.enabled) {
                // Note this spins off as an orphaned promise.
                ui.showConfirmDialog({
                    title: 'Disable parameter group "' + spec.ui.label + '"?',
                    body: div([
                        p('Disabling this parameter group will also remove any values you may have set.'),
                        p('If enabled again, the values will be set to their defaults.'),
                        p('Continue to disable this parameter group?')
                    ]),
                    yesLabel: 'Yes',
                    noLabel: 'No'
                })
                .then(function (confirmed) {
                    if (!confirmed) {
                        return;
                    }
                    viewModel.state.enabled = false;
                    button.innerHTML = 'Enable';
                    viewModel.data = null;
                    bus.emit('set-param-state', {
                        state: viewModel.state
                    });
                    bus.emit('changed', {
                        newValue: lang.copy(viewModel.data)
                    });
                    renderSubcontrols();
                });

                // Disable it

            } else {
                // Enable it
                viewModel.state.enabled = true;
                button.innerHTML = 'Disable';
                viewModel.data = lang.copy(spec.data.defaultValue);
            }
            bus.emit('set-param-state', {
                state: viewModel.state
            });
            bus.emit('changed', {
                newValue: lang.copy(viewModel.data)
            });
            renderSubcontrols();
        }

        function enableControl(events) {
            var required = spec.data.constraints.required;

            places.enableControl = html.genId();

            // If the group is required, there is no choice, it is always enabled.
            if (required) {
                return '';
            }

            var label;
            if (viewModel.state.enabled) {
                label = 'Disable';
            } else {
                label = 'Enable';
            }
            return div({
                id: places.enableControl
            }, [
                button({
                    id: events.addEvent({
                        type: 'click',
                        handler: doToggleEnableControl
                    }),
                    type: 'button',
                    class: 'btn btn-default'
                }, label)
            ]);
        }

        function makeInputControl(events, bus) {
            var promiseOfFields = fieldLayout.map(function (fieldName) {
                var fieldSpec = struct.specs[fieldName];
                var fieldValue = viewModel.data[fieldName];

                return makeSingleInputControl(fieldValue, fieldSpec, events, bus);
            });

            // TODO: support different layouts, this is a simple stacked
            // one for now.

            return Promise.all(promiseOfFields)
                .then(function (fields) {
                    var layout = div({
                        class: 'row'
                    }, fields.map(function (field) {
                        return div({ id: field.id, style: { border: '0px orange dashed', padding: '0px' } });
                    }).join('\n'));
                    return {
                        content: layout,
                        fields: fields
                    };
                });
        }

        function doChanged(id, newValue) {
            // Absorb and propagate the new value...
            viewModel.data[id] = lang.copy(newValue);
            bus.emit('changed', {
                newValue: lang.copy(viewModel.data)
            });

            // Validate and propagate.
            // Note: the struct control does not display local error messages. Each
            // input widget will have an error message if applicable, so not reason
            // (at present) to have yet another one...

            validate(viewModel.data)
                .then(function (result) {
                    bus.emit('validation', result);
                });
        }

        /*
         * The single input control wraps a field widget, which provides the 
         * wrapper around the input widget itself.
         */
        function makeSingleInputControl(value, fieldSpec, events) {
            return resolver.loadInputControl(fieldSpec)
                .then(function (widgetFactory) {
                    var id = html.genId(),
                        fieldWidget = FieldWidget.make({
                            inputControlFactory: widgetFactory,
                            showHint: true,
                            useRowHighight: true,
                            initialValue: value,
                            parameterSpec: fieldSpec,
                            referenceType: 'ref',
                            paramsChannelName: config.paramsChannelName
                        });


                    // set up listeners for the input
                    fieldWidget.bus.on('sync', function () {
                        var value = viewModel.data[fieldSpec.id];
                        if (value) {
                            fieldWidget.bus.emit('update', {
                                value: value
                            });
                        }
                    });
                    fieldWidget.bus.on('validation', function (message) {
                        if (message.diagnosis === 'optional-empty') {
                            bus.emit('changed', {
                                newValue: lang.copy(viewModel.data)
                            });
                        }
                    });
                    fieldWidget.bus.on('changed', function (message) {
                        doChanged(fieldSpec.id, message.newValue);
                    });

                    fieldWidget.bus.on('touched', function () {
                        bus.emit('touched', {
                            parameter: fieldSpec.id
                        });
                    });

                    return {
                        id: id,
                        fieldName: fieldSpec.id,
                        instance: fieldWidget
                    };
                });
        }

        /*
         * Render the struct input control and place, place it into the dom,
         * attach events, and start up the field widgets.
         */
        function renderSubcontrols() {
            if (viewModel.state.enabled) {
                var events = Events.make({
                    node: container
                });
                return makeInputControl(events)
                    .then(function (result) {
                        ui.setContent('input-container.subcontrols', result.content);
                        events.attachEvents();
                        structFields = {};
                        result.fields.forEach(function (field) {
                            structFields[field.fieldName] = field;
                        });
                        // Start up all the widgets

                        return Promise.all(
                            result.fields.map(function (field) {
                                return field.instance.start({
                                    node: document.getElementById(field.id)
                                });
                            }));
                    });
            } else {
                return Promise.all(
                        Object.keys(structFields).map(function (fieldName) {
                            return structFields[fieldName].instance.stop();
                        }))
                    .then(function () {
                        ui.setContent('input-container.subcontrols', '');
                        structFields = {};
                    });
            }
        }

        function renderStruct(events) {
            var layout = div({
                style: {
                    'border-left': '5px silver solid',
                    padding: '2px',
                    margin: '6px'
                }
            }, [
                (function () {
                    if (spec.data.constraints.disableable === false) {
                        return;
                    }
                    return div({
                        class: 'row'
                    }, [
                        enableControl(events)
                    ]);
                }()),
                div({ dataElement: 'subcontrols' })
            ]);
            ui.setContent('input-container', layout);
        }

        function render(events) {
            container.innerHTML = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' })
            ]);

            renderStruct(events);

        }

        function autoValidate() {
            validate(viewModel.data)
                .then(function (results) {
                    bus.emit('validation', results);

                });
        }

        // LIFECYCLE API

        function start(arg) {
            var events;
            var init = Promise.try(function () {
                hostNode = arg.node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({ node: container });
                events = Events.make({ node: container });
                viewModel.data = lang.copy(config.initialValue);
            });
            return init
                .then(function () {
                    return render(events);
                })
                .then(function () {
                    return renderSubcontrols();
                })
                .then(function () {
                    events.attachEvents(container);

                    bus.on('reset-to-defaults', function () {
                        resetModelValue();
                    });

                    bus.on('update', function (message) {
                        // Update the model, and since we have sub widgets,
                        // we should send the individual data to them.
                        // TODO: container environment should know about enable/disabled state?
                        // FORNOW: just ignore
                        if (viewModel.state.enabled) {
                            viewModel.data = lang.copy(message.value);
                            Object.keys(message.value).forEach(function (id) {
                                structFields[id].instance.bus.emit('update', {
                                    value: message.value[id]
                                });
                            });
                        }

                    });

                    bus.on('submit', function () {
                        bus.emit('submitted', {
                            value: lang.copy(viewModel.data)
                        });
                    });

                    return autoValidate();
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                    container.innerHTML = err.message;
                });
        }

        function stop() {
            return Promise.try(function () {
                if (structFields) {
                    return Promise.all(Object.keys(structFields).map(function (id) {
                        return structFields[id].instance.stop();
                    }));
                }
            })
            .then(function () {
                if (hostNode && container) {
                    hostNode.removeChild(container);
                }
            });
        }

        return {
            start: start,
            stop: stop
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});