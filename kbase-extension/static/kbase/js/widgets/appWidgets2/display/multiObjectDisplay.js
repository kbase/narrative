define([
    'bluebird',
    'common/html',
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/runtime',
    'common/props',
    'bootstrap',
], (Promise, html, Workspace, serviceUtils, Runtime, Props) => {
    'use strict';

    // Constants
    const t = html.tag,
        div = t('div');

    function factory(config) {
        let container;

        const workspaceId = config.workspaceId,
            runtime = Runtime.make(),
            bus = config.bus,
            model = Props.make({
                onUpdate: function () {
                    render();
                },
            });

        // DATA

        function getObject(value) {
            const workspace = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.authToken(),
            });
            return workspace
                .get_object_info_new({
                    objects: [
                        {
                            wsid: workspaceId,
                            name: value,
                        },
                    ],
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
            const value = model.getItem('value');
            if (value === null || value.length === 0) {
                container.innerHTML = 'NA';
            } else {
                return Promise.all(
                    value.map((value) => {
                        return getObject(value).then((objectInfo) => {
                            return div([
                                div(objectInfo.name),
                                div(
                                    objectInfo.typeName +
                                        'v' +
                                        objectInfo.typeMajorVersion +
                                        '.' +
                                        objectInfo.typeMinorVersion +
                                        ' (' +
                                        objectInfo.typeModule +
                                        ') '
                                ),
                                div(objectInfo.save_date),
                            ]);
                        });
                    })
                )
                    .then((results) => {
                        container.innerHTML = results
                            .map((result) => {
                                return div(
                                    { style: { border: '1px solid silver', padding: '2px' } },
                                    result
                                );
                            })
                            .join('\n');
                    })
                    .catch((err) => {
                        console.warn(err);
                        container.innerHTML = 'ERROR ';
                    });
            }
        }

        // LIFECYCLE API
        function start() {
            return Promise.try(() => {
                bus.on('run', (message) => {
                    container = message.node;
                    bus.on('update', (msg) => {
                        model.setItem('value', msg.value);
                    });
                    bus.emit('sync');
                });
            });
        }

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
