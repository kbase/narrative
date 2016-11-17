/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/runtime',
    'common/props',
    'base/js/namespace',
    'bootstrap',
    'css!font-awesome'
], function (Promise, html, Workspace, serviceUtils, Runtime, Props, Jupyter) {
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
                case 'ref':
                    return {
                        ref: model.getItem('value')
                    };
                default:
                    throw new Error('Unsupported object reference type ' + objectRefType);
            }
        }

        function getObject() {
            return Promise.try(function() {
                var value = model.getItem('value');
                var objInfo = null;
                var refType = objectRefType;
                if (value.indexOf('/') !== -1) {
                    refType = 'ref';
                }
                switch (refType) {
                    case 'name':
                        objInfo = Jupyter.narrative.sidePanel.$dataWidget.getDataObjectByName(value);
                        break;
                    case 'ref':
                        objInfo = Jupyter.narrative.sidePanel.$dataWidget.getDataObjectByRef(value);
                        break;
                    default:
                        throw new Error('Unsupported object reference type ' + objectRefType);
                }
                if (objInfo) {
                    return serviceUtils.objectInfoToObject(objInfo);
                }
                return null;
            });
            // }).then(function (objectInfo) {
            //     if (objectInfo) {
            //         return serviceUtils.objectInfoToObject(objectInfo);
            //     }
            //     return null;
            // })

            // var workspace = new Workspace(runtime.config('services.workspace.url'), {
            //     token: runtime.authToken()
            // });
            // return workspace.get_object_info_new({
            //     objects: [getObjectRef()],
            //     includeMetadata: 1,
            //     ignoreErrors: 1
            //
            // })
            //     .then(function (data) {
            //         var objectInfo = data[0];
            //         if (objectInfo) {
            //             return serviceUtils.objectInfoToObject(objectInfo);
            //         }
            //         return null;
            //     });
        }

        // VIEW

        function render() {
            getObject()
                .then(function (objectInfo) {
                    // console.log('OBJECT INFO', objectInfo);
                    container.innerHTML = div({style: {padding: '3px', border: '1px solid gray', backgroundColor: '#eeeeee'}}, [
                        div({style: {fontWeight: 'bold'}}, objectInfo.name),
                        div({style: {fontStyle: 'italic'}}, objectInfo.typeName + ' v' + objectInfo.typeMajorVersion + '.' + objectInfo.typeMinorVersion + ' (' + objectInfo.typeModule + ') '),
                        div({style: {fontStyle: 'italic'}}, objectInfo.save_date)
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
