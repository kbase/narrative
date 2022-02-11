define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    'common/events',
    'common/ui',
    'common/runtime',
    'common/props',
    'kb_service/client/userAndJobState',
    'kb_service/client/shock',
    '../validators/text',
    '../validators/constants',
    '../inputUtils',

    'bootstrap',
], (
    Promise,
    $,
    Jupyter,
    html,
    Events,
    UI,
    Runtime,
    Props,
    UJS,
    Shock,
    Validation,
    Constants,
    InputUtils
) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div'),
        input = t('input'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        serviceNameInUJS = 'ShockUploader';

    function factory(config) {
        const spec = config.parameterSpec,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            model = Props.make({
                data: {
                    value: null,
                },
                onUpdate: function () {},
            });

        let hostNode, container, ui, state;
        // MODEL

        function setModelValue(value) {
            if (value === undefined) {
                return;
            }
            if (model.getItem('value') === value) {
                return;
            }
            model.setItem('value', value);
        }

        function resetModelValue() {
            setModelValue(spec.data.defaultValue);
        }

        // sync the dom to the model.
        function syncModelToControl() {
            setControlValue(model.getItem('value', null));
        }

        // CONTROL

        function getControlValue() {
            return ui.getElement('input-container.input').value;
        }

        function setControlValue(newValue) {
            ui.getElement('input-container.input').value = newValue;
        }

        // VALIDATION

        function importControlValue() {
            return Promise.try(() => {
                return Validation.importString(getControlValue());
            });
        }

        function validate(value) {
            return Promise.try(() => {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value')).then((result) => {
                channel.emit('validation', result);
            });
        }

        function doChange() {
            importControlValue()
                .then((value) => {
                    model.setItem('value', value);
                    channel.emit('changed', {
                        newValue: value,
                    });
                    return validate(value);
                })
                .then((result) => {
                    if (result.isValid) {
                        if (config.showOwnMessages) {
                            ui.setContent('input-container.message', '');
                        }
                    } else if (result.diagnosis === Constants.DIAGNOSIS.REQUIRED_MISSING) {
                        // nothing??
                    } else {
                        if (config.showOwnMessages) {
                            // show error message -- new!
                            const message = InputUtils.buildMessageAlert({
                                title: 'ERROR',
                                type: 'danger',
                                id: result.messageId,
                                message: result.errorMessage,
                            });
                            ui.setContent('input-container.message', message.content);
                            message.events.attachEvents();
                        }
                    }
                    channel.emit('validation', result);
                })
                .catch((err) => {
                    channel.emit('validation', {
                        isValid: false,
                        diagnosis: Constants.DIAGNOSIS.INVALID,
                        errorMessage: err.message,
                    });
                });
        }

        function handleChanged() {
            return {
                type: 'change',
                handler: doChange,
            };
        }

        function updateProgressBar(partial, total) {
            let percent = String(Math.floor((partial * 1000) / total) / 10);
            if (percent.indexOf('.') < 0) {
                percent += '.0';
            }
            ui.getElement('progress').value = percent + '%';
        }

        function uploadToShock(file, existingShockNodeId) {
            return new Promise((resolve, reject) => {
                const shockClient = new Shock({
                        url: runtime.config('services.shock.url'),
                        token: runtime.authToken(),
                    }),
                    uploadStartTime = new Date().getTime();
                let fileState, shockNodeId;

                // Called upon completion of uploading one chunk of the file.
                // Used both for progress and to detect the end of the upload
                // (the last chunk should have an uploaded size equal to the file size)
                function progress(info) {
                    if (!fileState) {
                        fileState = info.node_id + ' ' + String(uploadStartTime);
                        shockNodeId = info.node_id;
                    }

                    // Update progress bar
                    updateProgressBar(info.uploaded_size, info.file_size);

                    // Detect upload completion
                    if (info.uploaded_size >= info.file_size) {
                        shockClient
                            .change_node_file_name(info.node_id, file.name)
                            .then(() => {
                                // RESOLUTION
                                resolve({
                                    shockNodeId: shockNodeId,
                                    fileState: fileState,
                                });
                            })
                            .catch((error) => {
                                console.error('Error changing file name for shock node', info);
                                reject(error);
                            });
                    }
                }

                function error(error) {
                    reject(error);
                }

                function cancel() {
                    return state === 'cancel';
                }
                state = 'uploading';
                shockClient.upload_node(file, existingShockNodeId, false, progress, error, cancel);
            });
        }

        function uploadFile(file) {
            const currentValue = model.value,
                // The key used as an id for the uploaded file's shock node.
                // Using the file size, time, name, and user id is a pretty
                // good unique and idempotent id for this file.
                ujsKey = [
                    'File:',
                    file.size,
                    ':',
                    file.lastModified,
                    ':',
                    file.name,
                    ':',
                    Jupyter.narrative.userId,
                ].join(''),
                ujsClient = new UJS(runtime.config('services.user_and_job_state.url'), {
                    token: runtime.authToken(),
                });

            return ujsClient
                .get_has_state(serviceNameInUJS, ujsKey, 0)
                .then((ujsState) => {
                    /*
                     * If the file, as identified by the ujsKey above, exists use
                     * the shock node it contains, otherwise use the shock node
                     * we already have. Umm, not sure about this.
                     * Why would be use the existing shock node id for anything?
                     */
                    let shockNode;
                    if (ujsState[0]) {
                        // This is how the shock node is stored in the ujs state for uploads...
                        shockNode = ujsState[1].split(' ')[0];
                    } else {
                        shockNode = currentValue;
                    }

                    // Uploads the file ... this can take a while.
                    return uploadToShock(file, shockNode);
                })
                .then((result) => {
                    setModelValue(result.shockNodeId);
                    return ujsClient.set_state(serviceNameInUJS, ujsKey, result.fileState);
                });
        }

        function handleFileInputChange(e) {
            const files = e.target.files;

            if (files.length === 0) {
                return;
            }

            const file = files[0];

            uploadFile(file)
                .then(() => {
                    syncModelToControl();
                    ui.getElement('input-container.input').dispatchEvent(new Event('change'));
                    return doChange();
                })
                .catch((err) => {
                    console.error('ERROR UPLOADING', err);
                });
        }

        function makeInputControl(events) {
            const layout = div([
                input({
                    type: 'text',
                    style: { display: 'none' },
                    dataElement: 'input',
                    id: events.addEvent(handleChanged),
                }),
                table(
                    {
                        style: { border: '0px', margin: '0px', width: '100%' },
                        cellpadding: '0',
                        cellspacing: '0',
                    },
                    [
                        tr({ style: { border: 'none', verticalAlign: 'middle' } }, [
                            td({ style: { width: '80%' } }, [
                                input({
                                    class: 'form-control',
                                    type: 'file',
                                    style: { width: '100%' },
                                    dataElement: 'file-input',
                                    id: events.addEvent({
                                        type: 'change',
                                        handler: handleFileInputChange,
                                    }),
                                }),
                            ]),

                            td(
                                {
                                    style: {
                                        border: 'none',
                                        verticalAlign: 'middle',
                                        width: '20%',
                                    },
                                },
                                [
                                    input({
                                        dataElement: 'progress',
                                        type: 'text',
                                        readonly: true,
                                        style: {
                                            width: '100%',
                                            padding: '0px',
                                            textAlign: 'center',
                                        },
                                    }),
                                ]
                            ),
                        ]),
                    ]
                ),
            ]);

            return layout;
        }

        function render() {
            Promise.try(() => {
                const events = Events.make(),
                    inputControl = makeInputControl(model.value, events);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            }).then(() => {
                return autoValidate();
            });
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

        // LIFECYCLE API

        function start(arg) {
            return Promise.try(() => {
                hostNode = arg.node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({ node: arg.node });

                const events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                setModelValue(config.initialValue);

                render();
                autoValidate();
                syncModelToControl();

                channel.on('reset-to-defaults', () => {
                    resetModelValue();
                });
                channel.on('update', (message) => {
                    setModelValue(message.value);
                });
            });
        }

        function stop() {
            return Promise.try(() => {
                if (container) {
                    hostNode.removeChild(container);
                }
                busConnection.stop();
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
