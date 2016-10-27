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
], function (
    Promise,
    html,
    Workspace,
    serviceUtils,
    Runtime,
    Props) {
    'use strict';

    // Constants
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var options = {},
            spec = config.parameterSpec,
            workspaceInfo = config.workspaceInfo,
            workspaceId = config.workspaceId,
            objectRefType = config.referenceType || 'name',
            runtime = Runtime.make(),
            container,
            bus = config.bus,
            model;

        // DATA 

        function getObjectRef() {
            switch (objectRefType) {
                case 'name':
                    return {
                        wsid: workspaceId,
                        name: model.getItem('value')
                    };
                    break;
                case 'ref':
                    return {
                        ref: model.getItem('value')
                    };
                    break;
                default:
                    throw new Error('Unsupported object reference type ' + objectRefType);
            }
        }

        function getObject(value) {
            var workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken()
            });
            return workspace.get_object_info_new({
                objects: [getObjectRef()],
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
                    container.innerHTML = div({
                        style: {
                            padding: '3px', 
                            border: '1px solid gray', 
                            backgroundColor: '#eeeeee'
                        }
                    }, [
                        div({style: {fontWeight: 'bold'}}, objectInfo.name),
                        div({style: {fontStyle: 'italic'}}, objectInfo.typeName + ' v' + objectInfo.typeMajorVersion + '.' + objectInfo.typeMinorVersion + ' (' + objectInfo.typeModule + ') '),
                        div({style: {fontStyle: 'italic'}}, objectInfo.save_date)
                    ]);
                })
                .catch(function (err) {
                    container.innerHTML = div({
                        style: {
                            border: '1px red solid',
                            padding: '4px'
                        }
                    }, err.message);
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