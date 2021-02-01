define([
    'handlebars'
], function (
    Handlebars
) {
    'use strict';

    function compileTemplates(templates) {
        return templates.map(function ({template, id, label}) {
            if (typeof template === 'string') {
                return {
                    id,
                    label,
                    template: Handlebars.compile(template)
                };
            } else if (template instanceof Array) {
                return {
                    template: compileTemplates(template)
                };
            } else {
                return {
                    id,
                    label,
                    template: Handlebars.compile('')
                };
            }
        });
    }

    function applyMetadataTemplates(templates, data) {
        return templates.map(function ({template, id, label}) {
            var value;
            if (template instanceof Array) {
                value = applyMetadataTemplates(template, data);
            } else {
                value = template(data);
            }
            return {
                id: id,
                label,
                value: value
            };
        });
    }

    function requireArg(arg, name) {
        var argPath = name.split('.');
        for (var i = 0; i < argPath.length; i += 1) {
            var key = argPath[i];
            if (!(key in arg)) {
                throw new Error('Required argument "' + key + '" in "' + name +  '" is required but missing');
            }
            arg = arg[key];
        }
        return arg;
    }

    function listObjectsWithSets(narrativeService, workspaceName, type) {
        return narrativeService.callFunc('list_objects_with_sets', [{
            ws_name: workspaceName,
            types: [type],
            includeMetadata: 1
        }])
            .then(([data]) => {
                return data.data.map((item) => {
                    var info = item.object_info;
                    var objectName = info[1];
                    var metadata = info[10] || {};
                    return {
                        info,
                        objectName,
                        metadata
                    };
                });
            });
    }

    return Object.freeze({
        compileTemplates,
        applyMetadataTemplates,
        requireArg,
        listObjectsWithSets
    });
});