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
        return stringValue.replace(delimiter, '\\"').replace(/\n/, '\\n');
    }

    function pythonifyValue(value) {
        switch (typeof value) {
            case 'number':
                if (value === null) {
                    return 'None';
                }
                return String(value);
            case 'string':
                return '"' + escapeString(value) + '"';
            case 'object':
                if (value instanceof Array) {
                    return '[' + value.map(function (value) {
                        return pythonifyValue(value);
                    }).join(', ') + ']';
                }
                if (value === null) {
                    return 'None';
                }
                return '{' +
                    Object.keys(value).map(function (key) {
                    return pythonifyValue(key) + ': ' + pythonifyValue(value[key]);
                }).join(', ') +
                    '}';
            default:
                console.error('Unsupported parameter type ' + (typeof value), value);
                throw new Error('Unsupported parameter type ' + (typeof value));
        }
    }

    function pythonifyParams(params) {
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
        return '\n' + indent + args.join(',\n') + indent + '\n';
    }

    function buildAppRunner(cellId, runId, app, params) {
        var paramArgs = pythonifyParams(params),
            positionalArgs = [
                pythonifyValue(app.id)
            ],
            namedArgs = pythonifyParams({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId
            }),
            args = positionalArgs.concat(namedArgs).concat(paramArgs),
            pythonCode = [
                'from biokbase.narrative.jobs import AppManager',
                'AppManager().run_app(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    function buildViewRunner(cellId, runId, app, params) {
        var paramArgs = pythonifyParams(params),
            positionalArgs = [
                pythonifyValue(app.id)
            ],
            namedArgs = pythonifyParams({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId
            }),
            args = positionalArgs.concat(namedArgs).concat(paramArgs),
            pythonCode = [
                'from biokbase.narrative.jobs import AppManager',
                'AppManager().run_local_app(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    function buildOutputRunner(jqueryWidgetName, widgetTag, params) {
        var paramArgs = pythonifyParams(params),
            positionalArgs = [
                pythonifyValue(jqueryWidgetName),
                pythonifyValue(widgetTag)
            ],
            args = positionalArgs.concat(paramArgs),
            pythonCode = [
                'from biokbase.narrative.widgetmanager import WidgetManager',
                'WidgetManager().show_output_widget(' + buildNiceArgsList(args) + ')'
            ].join('\n');

        return pythonCode;
    }

    return {
        pythonifyParams: pythonifyParams,
        pythonifyValue: pythonifyValue,
        buildAppRunner: buildAppRunner,
        buildViewRunner: buildViewRunner,
        buildOutputRunner: buildOutputRunner
    };
});