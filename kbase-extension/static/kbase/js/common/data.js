define(['kb_service/client/workspace', 'kb_service/utils', 'common/runtime'], (
    Workspace,
    ServiceUtils,
    Runtime
) => {
    'use strict';
    function filterObjectInfoByType(objects, types) {
        return objects
            .map((objectInfo) => {
                const type = objectInfo.typeModule + '.' + objectInfo.typeName;
                if (types.indexOf(type) >= 0 || types.indexOf(objectInfo.typeModule) >= 0) {
                    return objectInfo;
                }
            })
            .filter((item) => {
                return item !== undefined;
            });
    }

    function getObjectsByTypes(types, connection, onUpdated) {
        const listener = connection.channel('data').plisten({
            key: {
                type: 'workspace-data-updated',
            },
            handle: function (message) {
                const result = {
                    data: filterObjectInfoByType(message.objectInfo, types),
                    timestamp: message.timestamp,
                };
                onUpdated(result);
            },
        });
        return listener.promise.then((message) => {
            return {
                data: filterObjectInfoByType(message.objectInfo, types),
                timestamp: message.timestamp,
            };
        });
    }

    /**
     * Given a list of object references, returns a mapping from that ref string to its object info
     * structure.
     */
    function getObjectsByRef(refs) {
        const runtime = Runtime.make(),
            authToken = runtime.authToken(),
            workspaceServiceUrl = runtime.config('services.workspace.url'),
            workspace = new Workspace(workspaceServiceUrl, {
                token: authToken,
            });

        // assume (for now) that the refs are valid and not random strings or numbers or objects.
        const refList = refs.map((ref) => {
            return { ref };
        });
        return workspace.get_object_info_new({ objects: refList }).then((infos) => {
            const objInfos = {};
            infos.forEach((obj) => {
                const infoObj = ServiceUtils.objectInfoToObject(obj);
                // For the purpose of testing, add a data palette ref here.
                // Just make it its own ref.
                infoObj.dataPaletteRef = infoObj.ref;
                objInfos[infoObj.ref] = infoObj;
            });
            return objInfos;
        });
    }

    return {
        getObjectsByTypes,
        getObjectsByRef,
    };
});
