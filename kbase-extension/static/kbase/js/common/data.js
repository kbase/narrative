define([

], function() {
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

    return {
        getObjectsByTypes: getObjectsByTypes
    };
});