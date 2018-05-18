define([
    'handlebars'
], function (
    Handlebars
) {
    'use strict';

    function compileTemplates(templates) {
        return templates.map(function (template) {
            if (typeof template.template === 'string') {
                return {
                    label: template.label,
                    template: Handlebars.compile(template.template)
                };
            } else if (template.template instanceof Array) {
                return {
                    label: template.label,
                    template: compileTemplates(template.template)
                };
            } else {
                return {
                    label: template.label,
                    template: Handlebars.compile('')
                };
            }
        });
    }

    function applyMetadataTemplates(templates, data) {
        return templates.map(function (template) {
            var value;
            if (template.template instanceof Array) {
                value = applyMetadataTemplates(template.template, data);
            } else {
                value = template.template(data);
            }
            return {
                label: template.label,
                value: value
            };
        });
    }

    function requireArg(arg, name) {
        if (!(name in arg)) {
            throw new Error('Required argument "' + name + '" is required but missing');
        }
    }
    return Object.freeze({
        compileTemplates: compileTemplates,
        applyMetadataTemplates: applyMetadataTemplates,
        requireArg: requireArg
    });
});