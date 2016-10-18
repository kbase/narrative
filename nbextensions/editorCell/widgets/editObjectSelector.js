/*global define*/
/*jslint white:true,browser:true*/

/*
 Object selector
 The object selector's jobs is to provide access to existing editable objects of the
 type(s) supported by this editor.
 The factory is given a type, and it will display a select control of all available sets of the
 given type.
 */

define([
    'bluebird',
    // CDN
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_sdk_clients/genericClient',
    'kb_sdk_clients/exceptions',
    'kb_service/utils',
    // LOCAL
    'common/ui',
    'common/dom',
    'common/runtime',
    'common/events',
    'common/props',
    'common/error',
    // Wrapper for inputs
    './inputWrapperWidget',
    'widgets/appWidgets/fieldWidget',
    // Display widgets
    'widgets/appWidgets/paramDisplayResolver'

], function (
    Promise,
    html,
    Workspace,
    GenericClient,
    sdkClientExceptions,
    serviceUtils,
    UI,
    Dom,
    Runtime,
    Events,
    Props,
    kbError,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver
    ) {
    'use strict';

    var t = html.tag,
        div = t('div'), span = t('span'),
        select = t('select'), option = t('option'),
        form = t('form'), input = t('input'), button = t('button');

    function factory(config) {
        var runtime = Runtime.make(),
            workspaceInfo = config.workspaceInfo,
            objectType = config.objectType,
            container,
            dom, ui,
            bus = runtime.bus().makeChannelBus(null, 'object selector bus'),
            model = Props.make(),
            availableReadsSets,
            selectedReadsSetItem;
        
        function doCreate(e) {
            e.preventDefault();
            e.stopPropagation();
            var name = ui.getElement('new-object-name').value;
                // value = ui.getElement('new-object-type').value;
            bus.emit('create-new-set', {
                name: name
                // type: value
            });
            return false;
        }
        
        function doNew(e) {
            e.preventDefault();
            e.stopPropagation();
            // alert('do a new form request');
            bus.emit('new-set-form');
        }   

        function renderLayout() {
            var events = Events.make(),
                content = div([
//                    div({style: {marginBottom: '12px'}}, [
//                        'Editing objects of type ', 
//                        span({style: {fontWeight: 'bold'}}, objectType)
//                    ]),
                    div({class: 'form-inline'}, [
                        'Select a Reads Set to edit: ',
                        span({dataElement: 'object-selector'})
                    ]),
                    div({style: {fontStyle: 'italic'}}, 'or'),
                    form({
                        class: 'form-inline',
                        id: events.addEvent({type: 'submit', handler: doCreate})
                    }, [
                        span({style: {padding: '0 4px 0 0'}}, 'Create a new Reads Set named:'),
                        input({dataElement: 'new-object-name', class: 'form-control'}),
//                        span({style: {padding: '0 4px 0 4px'}}, 'of type'),
//                        select({
//                            dataElement: 'new-object-type', 
//                            class: 'form-control',
//                            style: {margin: '0 12px 0 0'}
//                        }, [
//                            option({value: 'KBaseFile.SingleEndLibrary'}, 'Single-End'),
//                            option({value: 'KBaseFile.PairedEndLibrary'}, 'Paired-End')
//                        ]),
                        ' ',
                        button({
                            class: 'btn btn-primary',
                            type: 'button',
                            id: events.addEvent({type: 'click', handler: doCreate})
                        }, 'Create'),
                        button({
                            class: 'btn btn-default',
                            type: 'button',
                            id: events.addEvent({type: 'click', handler: doNew})
                        }, 'New')])
                ]);

            return {
                content: content,
                events: events
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node) {
            container = node;
            dom = Dom.make({
                node: container,
                bus: bus
            });
            ui = UI.make({node: container});
            var layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
        }
        
        function selectItem(ref) {
            bus.emit('changed', {
                newObjectRef: ref
            });            
        }

        function doItemSelected(event) {
            var newValue = event.target.value;
            selectItem(newValue);
        }

        function renderAvailableObjects() {
            var events = Events.make(),
                setApiClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    token: runtime.authToken(),
                    module: 'SetAPI',
                    version: 'dev'
                }),
                params = {
                    workspace: String(workspaceInfo.name),
                    include_set_item_info: 1
                },
                controlNode = container.querySelector('[data-element="object-selector"]');

            controlNode.innerHTML = html.loading();
            
            return setApiClient.callFunc('list_sets', [params])
                .then(function (result) {
                    // console.log('list sets result is ', result);
                    var objects = result[0].sets.map(function (resultItem) {
                        return serviceUtils.objectInfoToObject(resultItem.info);
                    }),
                        content = select({
                            class: 'form-control',
                            id: events.addEvent({type: 'change', handler: doItemSelected})
                        }, objects.map(function (objectInfo) {
                            return option({value: objectInfo.ref}, objectInfo.name);
                        }));
                    availableReadsSets = objects;
                    if (objects.length) {
                        selectedReadsSetItem = 0;
                    } else {
                        selectedReadsSetItem = null;
                    }
                    controlNode.innerHTML = content;
                    events.attachEvents(container);
                    return objects.length;
                })
                .catch(sdkClientExceptions.RequestException, function (err) {
                    throw new kbError.KBError({
                        type: 'GeneralError',
                        original: err,
                        message:err.message,
                        reason: 'This is an unknown error connecting to a service',
                        detail: 'This is an unknown error connecting to a service. Additional details may be available in your browser log',
                        advice: [
                            'This problem may be temporary -- try again later',
                            'You may wish to <href="https://kbase.us/contact">report this error to kbase</a>'
                        ]
                    })
                });
//                .catch(function (err) {
//                    console.error('ERROR getting objects', err, runtime.authToken(), workspaceInfo, objectType);
//                    console.error('stack trace', err.detail.replace('\n', '<br>'));
//                    // FORNOW: just return the empty set;
//                    var content = div({class: 'alert alert-warning'}, [
//                        'No Reads Set objects in your Narrative. Create a read set below'
//                    ]);
//                    controlNode.innerHTML = content;
//                    selectedReadsSetItem = null;
//                    return 0;
//                });
        }


        // LIFECYCLE API

        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    doAttach(message.node);
                    renderAvailableObjects()
                        .then(function (itemCount) {
                            // TODO: fetch the selected item and send to the app.
                            if (availableReadsSets.length) {
                                // TODO: use the currently selected item, which may have
                                // been restored from state.
                                selectItem(availableReadsSets[selectedReadsSetItem].ref);
                            }
                        })
                        .catch(function (err) {
                            console.log('ERROR', err);
                            bus.emit('fatal-error', {
                                location: 'render-available-objects',
                                error: err
                            });
                        })
                    runtime.bus().on('workspace-changed', function () {
                        renderAvailableObjects();
                    });
                    // do more stuff
                });
                // send parent the ready message
                bus.emit('ready');
            });
        }

        function stop() {
            return Promise.try(function () {
                // TODO: stop the bus!
                return null;
            })
        }

        // CONSTRUCTION

        // PUBLIC API

        return {
            start: start,
            stop: stop,
            bus: bus
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
