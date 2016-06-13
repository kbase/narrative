/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/runtime',
    'common/props',
    'bootstrap',
    'css!font-awesome'
], function (Promise, html, Workspace, serviceUtils, Runtime, Props) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            workspaceInfo = config.workspaceInfo,
            workspaceId = config.workspaceId,
            runtime = Runtime.make(),
            container,
            bus = config.bus,
            model;

        // DATA 
        
        function getObject(value) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            console.log('OBJ', {
                    wsid: workspaceId,
                    name: model.getItem('value')
                });
            return workspace.get_object_info_new({
                objects: [{
                    wsid: workspaceId,
                    name: model.getItem('value')
                }],
                includeMetadata: 1,
                ignoreErrors: 1
                
            })
                .then(function (data) {
                    var objectInfo = data[0];
                    if (objectInfo) {
                        return serviceUtils.objectInfoToObject(objectInfo);
                    }
                    return null;
                });
        }
        
        // VIEW

        function render() {
            getObject()
                .then(function (objectInfo) {
                    // console.log('OBJECT INFO', objectInfo);            
                    container.innerHTML = div([
                        div(objectInfo.name),
                        div(objectInfo.typeName  + 'v' + objectInfo.typeMajorVersion + '.' + objectInfo.typeMinorVersion + ' (' + objectInfo.typeModule + ') '),
                        div(objectInfo.save_date)
                        
                    ])
                        
                        div([
                        String(model.getItem('value')),
                        '-',
                        objectInfo.name
                    ]);
                });
        }

        // LIFECYCLE API
        function start() {
            return Promise.try(function () {
                bus.on('run', function (message) {
                    container = message.node;
                    bus.on('update', function (message) {
                        model.setItem('value', message.value);
                    });
                    bus.emit('sync');
                });
            });
        }

        model = Props.make({
            onUpdate: function (props) {
                render();
            }
        });

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