define([
    'bluebird',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/runtime',
    'common/props',
    'bootstrap',
    'css!font-awesome',
], (Promise, html, Workspace, serviceUtils, Runtime, Props) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div');

    function factory(config) {
        let options = {},
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
                        name: model.getItem('value'),
                    };
                    break;
                case 'ref':
                    return {
                        ref: model.getItem('value'),
                    };
                    break;
                default:
                    throw new Error('Unsupported object reference type ' + objectRefType);
            }
        }

        function getObject(value) {
            const workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken(),
            });
            return workspace
                .get_object_info_new({
                    objects: [getObjectRef()],
                    includeMetadata: 1,
                    ignoreErrors: 1,
                })
                .then((data) => {
                    const objectInfo = data[0];
                    if (objectInfo) {
                        return serviceUtils.objectInfoToObject(objectInfo);
                    }
                    return null;
                });
        }

        // VIEW

        function render() {
            getObject()
                .then((objectInfo) => {
                    // console.log('OBJECT INFO', objectInfo);
                    container.innerHTML = div(
                        {
                            style: {
                                padding: '3px',
                                border: '1px solid gray',
                                backgroundColor: '#eeeeee',
                            },
                        },
                        [
                            div({ style: { fontWeight: 'bold' } }, objectInfo.name),
                            div(
                                { style: { fontStyle: 'italic' } },
                                objectInfo.typeName +
                                    ' v' +
                                    objectInfo.typeMajorVersion +
                                    '.' +
                                    objectInfo.typeMinorVersion +
                                    ' (' +
                                    objectInfo.typeModule +
                                    ') '
                            ),
                            div({ style: { fontStyle: 'italic' } }, objectInfo.save_date),
                        ]
                    );
                })
                .catch((err) => {
                    container.innerHTML = div(
                        {
                            style: {
                                border: '1px red solid',
                                padding: '4px',
                            },
                        },
                        err.message
                    );
                });
        }

        // LIFECYCLE API
        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    container = message.node;
                    bus.on('update', (message) => {
                        model.setItem('value', message.value);
                    });
                    bus.emit('sync');
                });
            });
        }

        model = Props.make({
            onUpdate: function (props) {
                render();
            },
        });

        return {
            start: start,
        };
    }

    return {
        make: function (config) {
            return factory(config);
        },
    };
});
