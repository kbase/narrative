define([
    'kb_service/client/workspace',
    'kb_service/utils',
    'common/runtime'
], function(Workspace, ServiceUtils, Runtime) {

    function filterObjectInfoByType(objects, types) {
        return objects.map(function(objectInfo) {
                var type = objectInfo.typeModule + '.' + objectInfo.typeName;
                if (types.indexOf(type) >= 0) {
                    return objectInfo;
                }
            })
            .filter(function(item) {
                return item !== undefined;
            });
    }

    // function getObjectsByTypes(types, bus, onUpdated) {
    //     return bus.channel('data').when('workspace-data-updated')
    //         .then(function(message) {
    //             if (onUpdated) {
    //                 bus.channel('data').on('workspace-data-updated', function(message) {
    //                     var result = {
    //                         data: filterObjectInfoByType(message.objectInfo, types),
    //                         timestamp: message.timestamp
    //                     }
    //                     onUpdated(result);
    //                 });
    //             }
    //             var result = {
    //                 data: filterObjectInfoByType(message.objectInfo, types),
    //                 timestamp: message.timestamp
    //             }
    //             return result;
    //         })
    // }

    function getObjectsByTypes(types, connection, onUpdated) {
        var listener = connection.channel('data').plisten({
            key: {
                type: 'workspace-data-updated'
            },
            handle: function(message) {
                var result = {
                    data: filterObjectInfoByType(message.objectInfo, types),
                    timestamp: message.timestamp
                }
                onUpdated(result);
            }
        });
        return listener.promise
            .then(function(message) {
                var result = {
                    data: filterObjectInfoByType(message.objectInfo, types),
                    timestamp: message.timestamp
                }
                return result;
            });
    }

    /**
     * Given a list of object references, returns a mapping from that ref string to its object info
     * structure.
     */
    function getObjectsByRef(refs) {
        var runtime = Runtime.make(),
            authToken = runtime.authToken(),
            workspaceServiceUrl = runtime.config('services.workspace.url'),
            workspace = new Workspace(workspaceServiceUrl, {
                token: authToken
            });

        // assume (for now) that the refs are valid and not random strings or numbers or objects.
        var refList = [];
        refs.forEach(function(ref) {
            refList.push({'ref': ref});
        });
        return workspace.get_object_info_new({'objects': refList})
            .then(function(infos) {
                var objInfos = {};
                infos.forEach(function(obj) {
                    var infoObj = ServiceUtils.objectInfoToObject(obj);
                    // For the purpose of testing, add a data palette ref here.
                    // Just make it its own ref.
                    infoObj.dataPaletteRef = infoObj.ref;
                    objInfos[infoObj.ref] = infoObj;
                });
                return objInfos;
            });
    }

    return {
        getObjectsByTypes: getObjectsByTypes,
        getObjectsByRef: getObjectsByRef
    };
});
