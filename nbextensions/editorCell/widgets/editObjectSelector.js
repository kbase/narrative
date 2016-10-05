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
    'kb_service/utils',
    // LOCAL
    'common/dom',
    'common/runtime',
    'common/events',
    'common/props',
    // Wrapper for inputs
    './inputWrapperWidget',
    'widgets/appWidgets/fieldWidget',
    // Display widgets
    'widgets/appWidgets/paramDisplayResolver'

], function (
    Promise,
    html,
    Workspace,
    serviceUtils,
    Dom,
    Runtime,
    Events,
    Props,
    //Wrappers
    RowWidget,
    FieldWidget,
    ParamResolver
    ) {
    'use strict';

    var t = html.tag,
        div = t('div'), span = t('span'), 
        select = t('select'), option = t('option'),
        input = t('input'), button = t('button');

    function factory(config) {
        var runtime = Runtime.make(),
            parentBus = config.bus,
            cellId = config.cellId,
            workspaceInfo = config.workspaceInfo,
            objectType = config.objectType,
            container,
            dom,
            bus,
            places,
            model = Props.make(),
            inputBusses = [];

        function renderLayout() {
            var events = Events.make(),
                content = div([
                    div(['Editing objects of type ', span({style: {fontWeight: 'bold'}}, objectType)]),
                    div(['Select an object to edit: ', span({dataElement: 'object-selector'})]),
                    div({style: {fontStyle: 'italic'}}, 'or'),
                    div(['Create a new set: ', input({dataElement: 'new-object-name'}), button('Create')])
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
            var layout = renderLayout();
            console.log('attaching...', layout);
            container.innerHTML = layout.content;
            layout.events.attachEvents(container);
        }

        function renderAvailableObjects() {
            var wsClient = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            return wsClient.list_objects({
                ids: [workspaceInfo.id],
                type: objectType
            })
                .then(function (result) {
                    var objects = result.map(function (info) {
                            return serviceUtils.objectInfoToObject(info);
                        }),
                        content = select({}, objects.map(function (objectInfo) {
                            return option({value: objectInfo.ref}, objectInfo.name);
                        }));
                    container.querySelector('[data-element="object-selector"]').innerHTML = content;
                })
                .catch(function (err) {
                    console.error('ERROR getting objects', err, runtime.authToken(), workspaceInfo, objectType)
                });
        }

        // LIFECYCLE API

        function start() {
            // send parent the ready message
            parentBus.emit('ready');

            parentBus.on('run', function (message) {
                doAttach(message.node);
                renderAvailableObjects();
                // do more stuff
            });
        }

        function stop() {

        }

        // CONSTRUCTION

        bus = runtime.bus().makeChannelBus(null, 'params view own bus');


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
