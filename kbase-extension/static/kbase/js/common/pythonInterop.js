/*global define*/
/*jslint white:true,browser:true*/

define([
], function () {
    'use strict';

    function pythonString(string, singleQuote) {
        if (singleQuote) {
            return "'" + string + "'";
        }
        return '"' + string + '"';
    }

    function escapeString(stringValue, delimiter) {
        var delimiterRegex = new RegExp(delimiter, 'g');
        return stringValue.replace(delimiterRegex, '\\'+delimiter).replace(/\n/g, '\\n');
    }

    function autoDelimiter(value) {
      if (/\"/.test(value)) {
        return '"';
      }
      return "'";
    }

    function pythonifyValue(value, options) {
        options = options || {};
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
                var indent = '    ';
                if (value instanceof Array) {
                    return '[' + value.map(function (value) {
                        return pythonifyValue(value, options);
                    }).join(', ') + ']';
                }
                if (value === null) {
                    return 'None';
                }
                return '{\n' +
                    Object.keys(value).map(function (key) {
                        var prefix = indent;
                        if (options.autoIndent) {
                            prefix += indent;
                        }
                       return  prefix + pythonifyValue(key, options) + ': ' + pythonifyValue(value[key], options);
                    }).join(',\n') +
                    '\n' + (options.autoIndent ? indent : '') + '}';
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
        var indent = '    ';
        return '\n' + indent + args.join(',\n' + indent) + '\n';
    }

    function buildAppRunner(cellId, runId, app, params) {
        var positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, {autoIndent: true})
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
                pythonifyValue(params, {autoIndent: true})
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


    function buildViewRunner(cellId, runId, app, params) {
        var positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, {autoIndent: true})
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

    function buildOutputRunner(jqueryWidgetName, widgetTag, cellId, params) {
        var positionalArgs = [
                pythonifyValue(jqueryWidgetName),
                pythonifyValue(params, {autoIndent: true})
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

    function buildDataWidgetRunner(jqueryWidgetName, cellId, objectInfo) {
        var title = (objectInfo && objectInfo.name) ? objectInfo.name : 'Data Viewer',
            positionalArgs = [
                pythonifyValue(jqueryWidgetName),
                pythonifyValue({info: objectInfo})
            ],
            namedArgs = objectToNamedArgs({
                cell_id: cellId,
                title: title
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
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
        buildOutputRunner: buildOutputRunner,
        buildCustomWidgetRunner: buildCustomWidgetRunner,
        buildDataWidgetRunner: buildDataWidgetRunner
    };
});
