define([
    'handlebars'
], (
    Handlebars
) => {
    'use strict';

    function compileTemplates(templates) {
        return templates.map(({template, id, label}) => {
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
        return templates.map(({template, id, label}) => {
            let value;
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
        const argPath = name.split('.');
        for (let i = 0; i < argPath.length; i += 1) {
            const key = argPath[i];
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
                    const info = item.object_info;
                    const objectName = info[1];
                    const metadata = info[10] || {};
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