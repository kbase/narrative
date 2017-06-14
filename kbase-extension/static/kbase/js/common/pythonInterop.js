define([], function () {
    'use strict';

    function escapeString(stringValue, delimiter) {
        var delimiterRegex = new RegExp(delimiter, 'g');
        return stringValue.replace(delimiterRegex, '\\' + delimiter).replace(/\n/g, '\\n');
    }

    function autoDelimiter(value) {
        if (/\"/.test(value)) {
            return '"';
        }
        return "'";
    }

    var indentString = '    ';
    function makeIndent(level) {
        var retval = '';
        for (var i = 0; i < level; i += 1) {
            retval += indentString;
        }
        return retval;
    }
    function pythonifyValue(value, options, indentLevel) {
        options = options || {};
        indentLevel = indentLevel || 0;
        switch (typeof value) {
        case 'number':
            if (value === null) {
                return 'None';
            }
            return String(value);
        case 'string':
            return '"' + escapeString(value, options.delimiter || autoDelimiter(value)) + '"';
        case 'boolean':
            return value ? 'True' : 'False';
        case 'object':
            if (value instanceof Array) {
                return '[' + value.map(function (value) {
                    return pythonifyValue(value, options, indentLevel);
                }).join(', ') + ']';
            }
            if (value === null) {
                return 'None';
            }
            var prefix = makeIndent(indentLevel + 1);
            return '{\n' +
                Object.keys(value).map(function (key) {
                    return prefix + pythonifyValue(key, options) + ': ' + pythonifyValue(value[key], options, indentLevel + 1);
                }).join(',\n') +
                '\n' + makeIndent(indentLevel) + '}';
        default:
            console.error('Unsupported parameter type ' + (typeof value), value);
            throw new Error('Unsupported parameter type ' + (typeof value));
        }
    }

    function objectToNamedArgs(params) {
        return Object.keys(params).map(function (name) {
            var value = params[name];
            // This allows a non-sparse map of params, in which a param key may
            // be set as undefined, e.g. in the case of an optional param which
            // simply has not been set. This simplifies calling code because it
            // does not have to filter these out.
            if (value !== undefined) {
                return name + '=' + pythonifyValue(value);
            }
        })
        .filter(function (param) {
            return (param !== undefined);
        });
    }

    function buildNiceArgsList(args) {
        var indent = indentString;
        return '\n' + indent + args.join(',\n' + indent) + '\n';
    }

    function buildAppRunner(cellId, runId, app, params) {
        var positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true }, 1)
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_app(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    function buildEditorRunner(cellId, runId, app, params) {
        var positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true })
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_dynamic_service(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }


    function buildViewRunner(cellId, runId, app, params) {
        var positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true })
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_local_app(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    function buildAdvancedViewRunner(cellId, runId, app, params, outputState) {
        var positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true }),
                pythonifyValue(outputState, { autoIndent: true })
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_local_app_advanced(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    function buildOutputRunner(jqueryWidgetName, widgetTag, cellId, params) {
        var positionalArgs = [
                pythonifyValue(jqueryWidgetName),
                pythonifyValue(params, { autoIndent: true }, 1)
            ],
            namedArgs = objectToNamedArgs({
                tag: widgetTag,
                cell_id: cellId
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.widgetmanager import WidgetManager',
                'WidgetManager().show_output_widget(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    function buildDataWidgetRunner(ref, cellId, title, tag) {
        var positionalArgs = [
            pythonifyValue(ref)
        ];
        var namedArgs = objectToNamedArgs({
            cell_id: cellId,
            title: title,
            tag: tag
        });
        var args = positionalArgs.concat(namedArgs);
        var pythonCode = [
            'from biokbase.narrative.widgetmanager import WidgetManager',
            'WidgetManager().show_data_widget(' + buildNiceArgsList(args) + ')'
        ].join('\n');
        return pythonCode;
    }

    function buildCustomWidgetRunner(cellId, runId, app) {
        var positionalArgs = [
                pythonifyValue(app.id)
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_widget_app(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    return {
        objectToNamedArgs: objectToNamedArgs,
        pythonifyValue: pythonifyValue,
        buildAppRunner: buildAppRunner,
        buildEditorRunner: buildEditorRunner,
        buildViewRunner: buildViewRunner,
        buildAdvancedViewRunner: buildAdvancedViewRunner,
        buildOutputRunner: buildOutputRunner,
        buildCustomWidgetRunner: buildCustomWidgetRunner,
        buildDataWidgetRunner: buildDataWidgetRunner
    };
});