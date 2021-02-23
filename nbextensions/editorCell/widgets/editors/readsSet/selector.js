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
    // EXTERNAL
    'bluebird',
    // CDN
    'kb_common/html',
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
    'common/data'

], (
    Promise,
    html,
    GenericClient,
    sdkClientExceptions,
    serviceUtils,
    UI,
    Dom,
    Runtime,
    Events,
    Props,
    kbError,
    Data
) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span'),
        select = t('select'),
        option = t('option'),
        form = t('form'),
        input = t('input'),
        button = t('button');

    function factory(config) {
        let runtime = Runtime.make(),
            workspaceInfo = config.workspaceInfo,
            parent, container,
            ui,
            // bus = runtime.bus().makeChannelBus({ description: 'object selector bus' }),
            bus = runtime.bus().connect(),
            channelName = bus.genName(),
            channel = bus.channel(channelName),
            model = Props.make(),
            availableReadsSets, availableReadsSetsMap;

        function doCreate(e) {
            e.preventDefault();
            e.stopPropagation();
            const name = ui.getElement('new-object-name').value;
            // value = ui.getElement('new-object-type').value;
            channel.emit('create-new-set', {
                name: name
                    // type: value
            });
            return false;
        }

        function doNew(e) {
            e.preventDefault();
            e.stopPropagation();
            channel.emit('new-set-form');
        }

        function renderLayout() {
            const events = Events.make(),
                content = div([
                    div({ class: 'form-inline' }, [
                        'Select a Reads Set to edit: ',
                        span({ dataElement: 'object-selector' })
                    ]),
                    div({ style: { fontStyle: 'italic' } }, 'or'),
                    form({
                        class: 'form-inline',
                        id: events.addEvent({ type: 'submit', handler: doCreate })
                    }, [
                        span({ style: { padding: '0 4px 0 0' } }, 'Create a new Reads Set named:'),
                        input({ dataElement: 'new-object-name', class: 'form-control' }),
                        ' ',
                        button({
                            class: 'btn btn-primary',
                            type: 'button',
                            id: events.addEvent({ type: 'click', handler: doCreate })
                        }, 'Create')
                    ])
                ]);

            return {
                content: content,
                events: events
            };
        }

        // MESSAGE HANDLERS

        function doAttach(node) {
            parent = node;
            container = parent.appendChild(document.createElement('div'));
            ui = UI.make({ node: container });
            const layout = renderLayout();
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
        }

        function selectItem(ref) {
            // this is (currently) a select, so we need to
            // unselect any selected item and
            // find the matching option and select it
            //console.log('autoselect', ref);
            const control = ui.getElement('object-selector').querySelector('select');

            const selected = Array.prototype.slice.call(control.selectedOptions);
            selected.forEach((option) => {
                option.selected = false;
            })

            // var selected = control.querySelectorAll('[selected]');
            // //console.log('autoselect', control, selected);
            // if (selected.length > 1) {
            //     for (var i = 0; i < selected.length; i += 1) {
            //         selected.item(i).removeAttribute('selected');
            //     }
            // }

            for (let i = 0; i < control.options.length; i += 1) {
                if (control.options.item(i).value === ref) {
                    control.options.item(i).selected = true;
                    break;
                }
            }
            // var options = Array.prototype.slice.call(control.options);
            // options.forEach(function (option) {
            //     if (option.value === ref) {
            //         option.selected = true;
            //     }
            // })


            // var newlySelected = control.querySelector('option[value="' + ref + '"]');

            // //console.log('autoselect', newlySelected);
            // if (newlySelected) {
            //     newlySelected.setAttribute('selected', '');
            // }

            // And we need to force the change for this
            emitChanged();
        }

        function selectCurrentItem() {
            const ref = model.getItem('objectRef');
            if (!ref) {
                return;
            }
            selectItem(ref);
        }

        function emitChanged() {
            channel.emit('changed', {
                objectInfo: availableReadsSetsMap[model.getItem('objectRef')]
            });
        }

        function doItemSelected(event) {
            model.setItem('objectRef', event.target.value);
            emitChanged();
        }

        function doDataUpdated(newData) {

        }

        function fetchData() {
            const types = ['KBaseSets.ReadsSet'];
            return Data.getObjectsByTypes(types, bus, (newData) => {
                    doDataUpdated(newData.data);
                })
                .then((result) => {
                    availableReadsSetsMap = {};
                    availableReadsSets = result.data;
                    result.data.forEach((resultItem) => {
                        // var info = serviceUtils.objectInfoToObject(resultItem);
                        availableReadsSetsMap[resultItem.ref] = resultItem;
                    });
                    return result.data;
                });
        }

        function fetchDatax() {
            const setApiClient = new GenericClient({
                    url: runtime.config('services.service_wizard.url'),
                    token: runtime.authToken(),
                    module: 'SetAPI',
                    version: 'dev'
                }),
                params = {
                    workspace: String(workspaceInfo.name),
                    include_set_item_info: 1
                };

            return setApiClient.callFunc('list_sets', [params])
                .then((result) => {
                    availableReadsSetsMap = {};
                    availableReadsSets = result[0].sets.map((resultItem) => {
                        const info = serviceUtils.objectInfoToObject(resultItem.info);
                        availableReadsSetsMap[info.ref] = info;
                        return info;
                    });
                });
        }

        function renderAvailableObjects() {
            const events = Events.make({
                    node: container
                }),
                controlNode = ui.getElement('object-selector'),
                selectedItem = model.getItem('objectRef');

            controlNode.innerHTML = html.loading();

            return fetchData()
                .then(() => {
                    const content = (function() {
                        if (availableReadsSets.length === 0) {
                            return span({ style: { fontWeight: 'bold', fontStyle: 'italic', color: '#CCC' } }, [
                                'No Reads Sets yet in this Narrative -- you can create one below'
                            ]);
                        }
                        return select({
                                class: 'form-control',
                                id: events.addEvent({ type: 'change', handler: doItemSelected })
                            }, [option({ value: '' }, '-- No reads set selected --')]
                            .concat(availableReadsSets.map((objectInfo) => {
                                let selected = false;
                                if (selectedItem === objectInfo.ref) {
                                    selected = true;
                                }
                                return option({ value: objectInfo.ref, selected: selected }, objectInfo.name);
                            })));
                    }());

                    controlNode.innerHTML = content;
                    events.attachEvents();
                    return availableReadsSets.length;
                })
                .catch(sdkClientExceptions.RequestError, (err) => {
                    throw new kbError.KBError({
                        type: 'GeneralError',
                        original: err,
                        message: err.message,
                        reason: 'This is an unknown error connecting to a service',
                        detail: 'This is an unknown error connecting to a service. Additional details may be available in your browser log',
                        advice: [
                            'This problem may be temporary -- try again later',
                            'You may wish to <href="https://www.kbase.us/support">report this error to kbase</a>'
                        ]
                    });
                });
        }

        // LIFECYCLE API

        //        function start() {
        //            return Promise.try(function () {
        //                bus.on('run', function (message) {
        //                    doAttach(message.node);
        //                    renderAvailableObjects()
        //                        .then(function (itemCount) {
        //                            // TODO: fetch the selected item and send to the app.
        //                            if (availableReadsSets.length) {
        //                                // TODO: use the currently selected item, which may have
        //                                // been restored from state.
        //                                selectItem(availableReadsSets[selectedReadsSetItem].ref);
        //                            }
        //                        })
        //                        .catch(function (err) {
        //                            console.log('ERROR', err);
        //                            bus.emit('fatal-error', {
        //                                location: 'render-available-objects',
        //                                error: err
        //                            });
        //                        });
        //                    runtime.bus().on('workspace-changed', function () {
        //                        renderAvailableObjects();
        //                    });
        //                    // do more stuff
        //                });
        //                // send parent the ready message
        //                bus.emit('ready');
        //            });
        //        }


        /*
         * Now
         */
        function start(arg) {
            return Promise.try(() => {
                doAttach(arg.node);
                model.setItem('objectRef', arg.selectedSet);
                renderAvailableObjects()
                    .then(() => {
                        selectCurrentItem();
                    })
                    .catch((err) => {
                        console.log('ERROR', err);
                        channel.emit('fatal-error', {
                            location: 'render-available-objects',
                            error: err
                        });
                    });
            });
        }

        function stop() {
            return Promise.try(() => {
                // TODO: stop the bus!
                bus.stop()
                    .then(() => {
                        if (parent && container) {
                            parent.removeChild(container);
                        }
                    });
            });
        }

        // CONSTRUCTION

        // PUBLIC API

        return {
            start: start,
            stop: stop,
            channel: channel
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});
