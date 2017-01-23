/*global define*/
/*jslint white:true,browser:true*/
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


    'bootstrap',
    'css!font-awesome'
], function (
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
    Validation
) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'),
        input = t('input'),
        span = t('span'),
        textarea = t('textarea'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        td = t('td'),
        serviceNameInUJS = 'ShockUploader',
        maxFileStatesInUJS = 100,
        maxFileStateTime = 7 * 24 * 3600000 // in milliseconds;

    function factory(config) {
        var spec = config.parameterSpec,
            hostNode,
            container,
            runtime = Runtime.make(),
            busConnection = runtime.bus().connect(),
            channel = busConnection.channel(config.channelName),
            ui,
            model,
            state,
            local = {
                fileName: null,
                percentText: null,
                fakeButton: null
            };

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
            return Promise.try(function () {
                return Validation.importString(getControlValue());
            });
        }

        function validate(value) {
            return Promise.try(function () {
                return Validation.validate(value, spec);
            });
        }

        function autoValidate() {
            return validate(model.getItem('value'))
                .then(function (result) {
                    channel.emit('validation', result);
                });
        }

        // function handleInputChange(e) {
        //     validate()
        //         .then(function (result) {
        //             if (result.isValid) {
        //                 bus.emit('changed', {
        //                     newValue: result.value
        //                 });
        //             } else if (result.diagnosis === 'required-missing') {
        //                 bus.emit('changed', {
        //                     newValue: result.value
        //                 });
        //             }
        //             console.log('RESULT value', result);
        //             setModelValue(result.value);
        //             bus.emit('validation', {
        //                 errorMessage: result.errorMessage,
        //                 diagnosis: result.diagnosis
        //             });
        //         });
        // }

        function doChange() {
            importControlValue()
                .then(function (value) {
                    model.setItem('value', value);
                    channel.emit('changed', {
                        newValue: value
                    });
                    return validate(value);
                })
                .then(function (result) {
                    if (result.isValid) {
                        if (config.showOwnMessages) {
                            ui.setContent('input-container.message', '');
                        }
                    } else if (result.diagnosis === 'required-missing') {
                        // nothing??
                    } else {
                        if (config.showOwnMessages) {
                            // show error message -- new!
                            var message = inputUtils.buildMessageAlert({
                                title: 'ERROR',
                                type: 'danger',
                                id: result.messageId,
                                message: result.errorMessage
                            });
                            ui.setContent('input-container.message', message.content);
                            message.events.attachEvents();
                        }
                    }
                    channel.emit('validation', result);
                })
                .catch(function (err) {
                    channel.emit('validation', {
                        isValid: false,
                        diagnosis: 'invalid',
                        errorMessage: err.message
                    });
                });
        }


        function handleChanged() {
            return {
                type: 'change',
                handler: doChange
            };
        }

        /*
         * This simulates a user clicking on the file input.
         * This mechanism is purely vanity -- 
         */
        function handleButtonChange(e) {
            ui.getElement('file-input').dispatchEvent(new Event('click'));
            // alert('button clicked!');
        }

        function updateProgressBar(partial, total) {
            var percent = String(Math.floor(partial * 1000 / total) / 10);
            if (percent.indexOf('.') < 0) {
                percent += ".0";
            }
            ui.getElement('progress').value = percent + '%';
        }

        function uploadToShock(file, existingShockNodeId) {
            return new Promise(function (resolve, reject) {
                var shockClient = new Shock({
                        url: runtime.config('services.shock.url'),
                        token: runtime.authToken()
                    }),
                    uploadStartTime = new Date().getTime(),
                    fileState, shockNodeId;

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
                    console.log('PROGRESS', info.uploaded_size, info.file_size);
                    if (info.uploaded_size >= info.file_size) {
                        console.log('done');
                        shockClient.change_node_file_name(info.node_id, file.name)
                            .then(function (info2) {
                                // RESOLUTION
                                console.log('really done!', shockNodeId, fileState);
                                resolve({
                                    shockNodeId: shockNodeId,
                                    fileState: fileState
                                });
                            })
                            .catch(function (error) {
                                console.error('Error changing file name for shock node', info);
                                reject(error);
                            });
                    }
                }

                function error(error) {
                    reject(error);
                }

                function cancel() {
                    return (state === 'cancel');
                }
                state = 'uploading';
                shockClient.upload_node(file, existingShockNodeId, false, progress, error, cancel);
            });
        }

        function uploadFile(file) {
            console.log('UPLOAD FILE', file, runtime.config('services'));
            var currentValue = model.value,
                // The key used as an id for the uploaded file's shock node.
                // Using the file size, time, name, and user id is a pretty 
                // good unique and idempotent id for this file.                
                ujsKey = [
                    "File:", file.size, ":",
                    file.lastModified, ":",
                    file.name, ":", Jupyter.narrative.userId
                ].join(''),
                ujsClient = new UJS(runtime.config('services.user_and_job_state.url'), {
                    token: runtime.authToken()
                });

            return ujsClient.get_has_state(serviceNameInUJS, ujsKey, 0)
                .then(function (ujsState) {
                    /*
                     * If the file, as identified by the ujsKey above, exists use
                     * the shock node it contains, otherwise use the shock node
                     * we already have. Umm, not sure about this.
                     * Why would be use the existing shock node id for anything?
                     */
                    var shockNode;
                    if (ujsState[0]) {
                        // This is how the shock node is stored in the ujs state for uploads...
                        shockNode = ujsState[1].split(' ')[0];
                    } else {
                        shockNode = currentValue;
                    }

                    // Uploads the file ... this can take a while.
                    return uploadToShock(file, shockNode);
                })
                .then(function (result) {
                    console.log('UPLOADED', result);
                    setModelValue(result.shockNodeId);
                    return ujsClient.set_state(serviceNameInUJS, ujsKey, result.fileState);
                });
        }

        function handleFileInputChange(e) {
            var files = e.target.files,
                file;

            if (files.length === 0) {
                return;
            }

            file = files[0];

            uploadFile(file)
                .then(function (info) {
                    // setModelValue(info.shockNodeId);
                    console.log('UPLOAD SUCCESS!', info);
                    syncModelToControl();
                    ui.getElement('input-container.input').dispatchEvent(new Event('change'));
                    return doChange();
                })
                .catch(function (err) {
                    console.error('ERROR UPLOADING', err);
                });
        }

        function makeInputControl(currentValue, events) {
            // function render() {
            var cellStyle = {
                    border: 'none',
                    verticalAlign: 'middle'
                },
                // percentTextWidth = '50px',
                layout = div([
                    input({
                        type: 'text',
                        style: { display: 'block' },
                        dataElement: 'input',
                        id: events.addEvent(handleChanged)
                    })
                ]);

            return layout;
        }

        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events);

                ui.setContent('input-container', inputControl);
                events.attachEvents(container);
            })
            .then(function () {
                return autoValidate();
            });
        }

        function updateInputControl() {
            ui.getElement('input').value = model.value;
        }

        function layout(events) {
            var content = div({
                dataElement: 'main-panel'
            }, [
                div({ dataElement: 'input-container' })
            ]);
            return {
                content: content,
                events: events
            };
        }




        // LIFECYCLE API

        function start(arg) {
            return Promise.try(function () {
                hostNode = arg.node;
                container = hostNode.appendChild(document.createElement('div'));
                ui = UI.make({ node: arg.node });

                var events = Events.make(),
                    theLayout = layout(events);

                container.innerHTML = theLayout.content;
                events.attachEvents(container);

                setModelValue(config.initialValue);

                render();
                autoValidate();
                syncModelToControl();


                channel.on('reset-to-defaults', function (message) {
                    resetModelValue();
                });
                channel.on('update', function (message) {
                    setModelValue(message.value);
                });
                // channel.emit('sync');
            });
        }

        function stop() {
            return Promise.try(function () {
                if (container) {
                    hostNode.removeChild(container);
                }
                busConnection.stop();
            });
        }

        model = Props.make({
            data: {
                value: null
            },
            onUpdate: function () {
                //syncModelToControl();
                //autoValidate();
            }
        });

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