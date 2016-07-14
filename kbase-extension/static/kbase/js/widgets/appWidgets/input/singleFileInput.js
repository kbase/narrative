/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'jquery',
    'base/js/namespace',
    'kb_common/html',
    'common/validation',
    'common/events',
    'common/ui',
    'common/runtime',
    'kb_service/client/userAndJobState',
    'kb_service/client/shock',
    'bootstrap',
    'css!font-awesome'
], function (
    Promise,
    $,
    Jupyter,
    html,
    Validation,
    Events,
    UI,
    Runtime,
    UJS,
    Shock
    ) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div'), input = t('input'), span = t('span'), textarea = t('textarea'),
        button = t('button'), table = t('table'), tr = t('tr'), td = t('td'),
        serviceNameInUJS = 'ShockUploader',
        maxFileStatesInUJS = 100,
        maxFileStateTime = 7 * 24 * 3600000	// in milliseconds;

    function factory(config) {
        var options = {},
            constraints,
            parent,
            container,
            bus = config.bus,
            runtime = Runtime.make(),
            ui,
            model = {
                value: undefined
            },
            state,
        local = {
            fileName: null,
            percentText: null,
            fakeButton: null
        };

        if (config.parameterSpec) {
            constraints = config.parameterSpec.getConstraints();
        } else {
            constraints = config.constraints;
        }

        // 
        // Validate configuration.
        // Nothing to do...

        options.enabled = true;





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

        function setModelValue(value) {
            return Promise.try(function () {
                if (model.value !== value) {
                    model.value = value;
                    return true;
                }
                return false;
            })
                .then(function (changed) {
                    // render();
                    updateInputControl();
                });
        }

        function unsetModelValue() {
            return Promise.try(function () {
                model.value = undefined;
            })
                .then(function (changed) {
                    render();
                });
        }

        function resetModelValue() {
            if (constraints.defaultValue) {
                setModelValue(constraints.defaultValue);
            } else {
                unsetModelValue();
            }
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

        function validate() {
            return Promise.try(function () {
                if (!options.enabled) {
                    return {
                        isValid: true,
                        validated: false,
                        diagnosis: 'disabled'
                    };
                }

                var rawValue = getInputValue(),
                    validationResult = Validation.validateTextString(rawValue, {
                        required: constraints.required
                    });

                return {
                    isValid: validationResult.isValid,
                    validated: true,
                    diagnosis: validationResult.diagnosis,
                    errorMessage: validationResult.errorMessage,
                    value: validationResult.parsedValue
                };
            });
        }

        /*
         * Creates the markup
         * Places it into the dom node
         * Hooks up event listeners
         */
        
        function handleInputChange(e) {
            validate()
                .then(function (result) {
                    if (result.isValid) {
                        bus.emit('changed', {
                            newValue: result.value
                        });
                    } else if (result.diagnosis === 'required-missing') {
                        bus.emit('changed', {
                            newValue: result.value
                        });
                    }
                    console.log('RESULT value', result);
                    setModelValue(result.value);
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
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
                    if (info.uploaded_size >= info.file_size) {
                        shockClient.change_node_file_name(info.node_id, file.name, function (info) {
                            // RESOLUTION
                            resolve({
                                shockNodeId: shockNodeId,
                                fileState: fileState
                            });
                        }, function (error) {
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
            console.log('UPLOAD FILE', file);
            var currentValue = model.value,
                // The key used as an id for the uploaded file's shock node.
                // Using the file size, time, name, and user id is a pretty 
                // good unique and idempotent id for this file.
                ujsKey = [
                    "File:", file.size , ":", 
                    file.lastModified, ":",  
                    file.name, ":", Jupyter.narrative.userId
                ].join(''),
                ujsClient = new UJS(runtime.config('services.user_job_state.url'), {
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
                    updateModelValue(result.shockNodeId);
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
                    setModelValue(info.shockNodeId);
                    console.log('UPLOAD SUCCESS!', info);
                })
                .catch(function (err) {
                    console.error('ERROR UPLOADING', err);
                });
        }

        function makeInputControl(currentValue, events, bus) {
            // function render() {
            var cellStyle = {
                border: 'none',
                verticalAlign: 'middle'
            },
            // percentTextWidth = '50px',
                layout = div([
                    input({
                        type: 'text', 
                        style: {display: 'none'}, 
                        dataElement: 'input',
                        id: events.addEvent({
                            type: 'change',
                            handler: handleInputChange 
                        })
                    }),
                    table({style: {border: '0px', margin: '0px', width: '100%'}, cellpadding: '0', cellspacing: '0'}, [
                        tr({style: {border: 'none', verticalAlign: 'middle'}}, [
                            td({style: {width: '80%'}}, [
                                input({
                                    class: 'form-control',
                                    type: 'file', 
                                    style: {width: '100%'}, 
                                    dataElement: 'file-input',
                                    id: events.addEvent({
                                        type: 'change',
                                        handler: handleFileInputChange 
                                    })
                                })
                            ]),
                            
//                            td({style: cellStyle}, [
//                                button({
//                                    dataElement: 'fake-button',
//                                    type: 'button',
//                                    class: 'btn kb-primary-btn',
//                                    id: events.addEvent({
//                                        type: 'click',
//                                        handler: handleButtonChange
//                                    })
//                                }, 'Select File')
//                            ]),
//                            td({style: {width: '70%', padding: '0px', margin: '2px'}}, [
//                                textarea({
//                                    dataElement: 'input',
//                                    type: 'text',
//                                    readonly: true,
//                                    style: {width: '100%'},
//                                    rows: 3,
//                                    id: events.addEvent({
//                                        type: 'change',
//                                        handler: handleInputChange
//                                    })
//                                })
//                            ]),
                            td({style: {border: 'none', verticalAlign: 'middle', width: '20%'}}, [
                                input({
                                    dataElement: 'progress',
                                    type: 'text',
                                    readonly: true,
                                    style: {width: '100%', padding: '0px', textAlign: 'center'}
                                })
                            ])
                        ])
                    ])
                ]);

            return layout;
        }


        function makeInputControlx(currentValue, events, bus) {
            // CONTROL

            return input({
                id: events.addEvents({
                    events: [
                        {
                            type: 'change',
                            handler: function (e) {
                                if (editPauseTimer) {
                                    window.clearTimeout(editPauseTimer);
                                    editPauseTimer = null;
                                }
                                validate()
                                    .then(function (result) {
                                        if (result.isValid) {
                                            bus.emit('changed', {
                                                newValue: result.value
                                            });
                                        } else if (result.diagnosis === 'required-missing') {
                                            bus.emit('changed', {
                                                newValue: result.value
                                            });
                                        }
                                        setModelValue(result.value);
                                        bus.emit('validation', {
                                            errorMessage: result.errorMessage,
                                            diagnosis: result.diagnosis
                                        });
                                    });
                            }
                        },
                        {
                            type: 'focus',
                            handler: function (e) {
                                Jupyter.keyboard_manager.disable();
                            }
                        },
                        {
                            type: 'blur',
                            handler: function (e) {
                                Jupyter.keyboard_manager.enable();
                            }
                        }
                    ]}),
                class: 'form-control',
                dataElement: 'input',
                value: currentValue
            });
        }

        function render() {
            Promise.try(function () {
                var events = Events.make(),
                    inputControl = makeInputControl(model.value, events, bus);

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
                div({dataElement: 'input-container'})
            ]);
            return {
                content: content,
                events: events
            };
        }

        function autoValidate() {
            return validate()
                .then(function (result) {
                    bus.emit('validation', {
                        errorMessage: result.errorMessage,
                        diagnosis: result.diagnosis
                    });
                });
        }


        // LIFECYCLE API

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {

                    parent = message.node;
                    container = parent.appendChild(document.createElement('div'));
                    ui = UI.make({node: message.node});

                    var events = Events.make(),
                        theLayout = layout(events);

                    container.innerHTML = theLayout.content;
                    events.attachEvents(container);
                    
                    render();

                    bus.on('reset-to-defaults', function (message) {
                        resetModelValue();
                    });
                    bus.on('update', function (message) {
                        setModelValue(message.value);
                    });
                    bus.emit('sync');
                });
            });
        }

        return {
            start: start
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});