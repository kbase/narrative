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
    'common/html',
    'kb_sdk_clients/genericClient',
    'kb_sdk_clients/exceptions',
    'kb_service/utils',
    // LOCAL
    'common/ui',
    'common/runtime',
    'common/events',
    'common/props',
    'common/error',
    'common/data',
], (
    Promise,
    html,
    GenericClient,
    sdkClientExceptions,
    serviceUtils,
    UI,
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

    function factory() {
        const runtime = Runtime.make(),
            bus = runtime.bus().connect(),
            channelName = bus.genName(),
            channel = bus.channel(channelName),
            model = Props.make();

        let parent, container, ui, availableReadsSets, availableReadsSetsMap;

        function doCreate(e) {
            e.preventDefault();
            e.stopPropagation();
            const name = ui.getElement('new-object-name').value;
            channel.emit('create-new-set', {
                name: name,
            });
            return false;
        }

        function renderLayout() {
            const events = Events.make(),
                content = div([
                    div({ class: 'form-inline' }, [
                        'Select a Reads Set to edit: ',
                        span({ dataElement: 'object-selector' }),
                    ]),
                    div({ style: { fontStyle: 'italic' } }, 'or'),
                    form(
                        {
                            class: 'form-inline',
                            id: events.addEvent({ type: 'submit', handler: doCreate }),
                        },
                        [
                            span(
                                { style: { padding: '0 4px 0 0' } },
                                'Create a new Reads Set named:'
                            ),
                            input({ dataElement: 'new-object-name', class: 'form-control' }),
                            ' ',
                            button(
                                {
                                    class: 'btn btn-primary',
                                    type: 'button',
                                    id: events.addEvent({ type: 'click', handler: doCreate }),
                                },
                                'Create'
                            ),
                        ]
                    ),
                ]);

            return {
                content: content,
                events: events,
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
            });

            for (let i = 0; i < control.options.length; i += 1) {
                if (control.options.item(i).value === ref) {
                    control.options.item(i).selected = true;
                    break;
                }
            }
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
                objectInfo: availableReadsSetsMap[model.getItem('objectRef')],
            });
        }

        function doItemSelected(event) {
            model.setItem('objectRef', event.target.value);
            emitChanged();
        }

        function doDataUpdated() {}

        function fetchData() {
            const types = ['KBaseSets.ReadsSet'];
            return Data.getObjectsByTypes(types, bus, (newData) => {
                doDataUpdated(newData.data);
            }).then((result) => {
                availableReadsSetsMap = {};
                availableReadsSets = result.data;
                result.data.forEach((resultItem) => {
                    availableReadsSetsMap[resultItem.ref] = resultItem;
                });
                return result.data;
            });
        }

        function renderAvailableObjects() {
            const events = Events.make({
                    node: container,
                }),
                controlNode = ui.getElement('object-selector'),
                selectedItem = model.getItem('objectRef');

            controlNode.innerHTML = html.loading();

            return fetchData()
                .then(() => {
                    const content = (function () {
                        if (availableReadsSets.length === 0) {
                            return span(
                                {
                                    style: {
                                        fontWeight: 'bold',
                                        fontStyle: 'italic',
                                        color: '#CCC',
                                    },
                                },
                                ['No Reads Sets yet in this Narrative -- you can create one below']
                            );
                        }
                        return select(
                            {
                                class: 'form-control',
                                id: events.addEvent({ type: 'change', handler: doItemSelected }),
                            },
                            [option({ value: '' }, '-- No reads set selected --')].concat(
                                availableReadsSets.map((objectInfo) => {
                                    let selected = false;
                                    if (selectedItem === objectInfo.ref) {
                                        selected = true;
                                    }
                                    return option(
                                        { value: objectInfo.ref, selected: selected },
                                        objectInfo.name
                                    );
                                })
                            )
                        );
                    })();

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
                            'You may wish to <href="https://www.kbase.us/support">report this error to kbase</a>',
                        ],
                    });
                });
        }

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
                        console.warn('ERROR', err);
                        channel.emit('fatal-error', {
                            location: 'render-available-objects',
                            error: err,
                        });
                    });
            });
        }

        function stop() {
            return Promise.try(() => {
                // TODO: stop the bus!
                bus.stop().then(() => {
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
            channel: channel,
        };
    }

    return {
        make: function () {
            return factory();
        },
    };
});
