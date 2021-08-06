define([
    'google-code-prettify/prettify',
    'common/html',
    'common/runtime',
    'widgets/appWidgets2/errorControl',
    'css!google-code-prettify/prettify.css',
], (PR, html, Runtime, ErrorControlFactory) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        label = t('label'),
        strong = t('strong'),
        span = t('span'),
        iTag = t('i'),
        cssBaseClass = 'kb-field-cell',
        messageBaseClass = `${cssBaseClass}__message_panel`,
        MESSAGE = {
            error: {
                prefix: 'Error',
                messageClass: `${messageBaseClass}__error`,
                containerClass: `${cssBaseClass}__error_message`,
                icon: 'fa fa-exclamation-triangle'
            },
            warning: {
                prefix: 'Warning',
                messageClass: `${messageBaseClass}__warning`,
                icon: 'fa fa-exclamation-circle'
            }
        };

    function factory(config) {
        const runtime = Runtime.make(),
            bus = runtime.bus().makeChannelBus({
                description: 'Field bus',
            }),
            inputControlFactory = config.inputControlFactory,
            spec = config.parameterSpec;
        let places, parent, container, inputControl;

        try {
            const controlConfig = Object.assign({}, config, { bus, channelName: bus.channelName });
            inputControl = inputControlFactory.make(controlConfig);
        } catch (ex) {
            console.error('Error creating input control', ex);
            inputControl = ErrorControlFactory.make({
                message: ex.message,
            }).make();
        }

        function render() {
            const ids = {
                fieldPanel: html.genId(),
                inputControl: html.genId(),
            };

            const content = div(
                {
                    class: `${cssBaseClass}__rowCell`,
                    id: ids.fieldPanel,
                    dataElement: 'field-panel',
                },
                [
                    label(
                        {
                            class: `${cssBaseClass}__cell_label`,
                            title: spec.ui.label || spec.ui.id,
                            for: ids.inputControl,
                        },
                        [spec.ui.label || spec.ui.id]
                    ),
                    div({
                        class: `${cssBaseClass}__input_control`,
                        id: ids.inputControl,
                        dataElement: 'input-control',
                    }),
                    div({
                        class: `${messageBaseClass} hidden`,
                        dataElement: 'message-panel'
                    }, [
                        div({
                            class: `${messageBaseClass}__body`
                        })
                    ])
                ]
            );

            return {
                content,
                ids,
            };
        }

        // LIFECYCLE

        function attach(node) {
            parent = node;
            const containerDiv = document.createElement('div');
            containerDiv.classList.add(`${cssBaseClass}__param_container`);

            container = parent.appendChild(containerDiv);

            const rendered = render();
            container.innerHTML = rendered.content;
            PR.prettyPrint(null, container);

            places = {
                inputControl: container.querySelector('#' + rendered.ids.inputControl),
            };
        }

        function showMessage(messageInfo, text) {
            const message = span({
                class: `${messageInfo.messageClass}__title`
            }, [
                iTag({
                    class: messageInfo.icon
                }),
                strong(` ${messageInfo.prefix}: `)
            ]) + text;

            if (messageInfo.containerClass) {
                parent.querySelector(`.${cssBaseClass}__rowCell`).classList.add(messageInfo.containerClass);
            }
            parent.querySelector(`.${messageBaseClass}__body`).innerHTML = message;
            const msgPanel = parent.querySelector(`.${messageBaseClass}`);
            msgPanel.classList.add(messageInfo.messageClass);
            msgPanel.classList.remove('hidden');
        }

        function clearMessage() {
            parent.querySelector(`.${cssBaseClass}__rowCell`).classList.remove(`${cssBaseClass}__error_message`);
            const msgPanel = parent.querySelector(`.${messageBaseClass}`);
            msgPanel.className = `${messageBaseClass} hidden`;
        }

        /**
         * Validates the field by showing a message to the user if it's in a few different states.
         * States included are:
         *  - error - if the value is invalid, or missing yet required, an error message is shown
         *  - suspect - if the value is "suspect", a warning is shown. "Suspect" values are
         *      technically valid, but might not be what the user wants, like overwriting existing
         *      data
         *  - valid or optional and missing - if the value is ok, don't show anything, and hide any
         *      previously shown messages
         * @param {object} message expected to have various keys from the Validator module, especially:
         *   - diagnosis (string), one of valid, required-missing, optional-empty, suspect, invalid
         *   - isError (boolean, optional)
         *   - shortMessage (string, optional)
         *   - errorMessage (string, optional), only present if isError is present, and true
         */
        function validateField(message) {
            // always clear the existing message to start with
            clearMessage();
            switch(message.diagnosis) {
                case 'required-missing':
                case 'invalid':
                    showMessage(MESSAGE.error, message.errorMessage);
                    break;
                case 'suspect':
                    showMessage(MESSAGE.warning, message.shortMessage);
                    break;
                default:
                    break;
            }
        }

        function start(arg) {
            attach(arg.node);
            bus.on('validation', validateField);

            return inputControl
                .start({
                    node: places.inputControl,
                })
                .then(() => {
                    // TODO: get rid of this pattern
                    bus.emit('run', {
                        node: places.inputControl,
                    });
                })
                .catch((error) => {
                    throw new Error(`Unable to start fieldTableCellWidget: ${error}`);
                });
        }

        function stop() {
            return inputControl
                .stop()
                .then(() => {
                    if (parent && container) {
                        parent.removeChild(container);
                    }
                    bus.stop();
                    return null;
                })
                .catch((err) => {
                    console.error('Error stopping fieldTableCellWidget: ', err);
                    if (parent && container) {
                        parent.removeChild(container);
                    }
                    bus.stop();
                    return null;
                });
        }

        return {
            start,
            stop,
            bus,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
