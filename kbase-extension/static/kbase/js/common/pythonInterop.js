define([], () => {
    'use strict';
    const indentString = '    ';

    function escapeString(stringValue, delimiter) {
        const delimiterRegex = new RegExp(delimiter, 'g');
        return stringValue.replace(delimiterRegex, '\\' + delimiter).replace(/\n/g, '\\n');
    }

    function autoDelimiter(value) {
        if (/"/.test(value)) {
            return '"';
        }
        return "'";
    }

    function makeIndent(level) {
        let retval = '';
        for (let i = 0; i < level; i += 1) {
            retval += indentString;
        }
        return retval;
    }

    function pythonifyValue(value, options, indentLevel) {
        options = options || {};
        indentLevel = indentLevel || 0;
        switch (typeof value) {
            case 'number':
                return String(value);
            case 'string':
                return '"' + escapeString(value, options.delimiter || autoDelimiter(value)) + '"';
            case 'boolean':
                return value ? 'True' : 'False';
            case 'object':
                if (value instanceof Array) {
                    return (
                        '[' +
                        value
                            .map((value) => {
                                return pythonifyValue(value, options, indentLevel);
                            })
                            .join(', ') +
                        ']'
                    );
                }
                if (value === null) {
                    return 'None';
                }
                return (
                    '{\n' +
                    Object.keys(value)
                        .map((key) => {
                            return (
                                makeIndent(indentLevel + 1) +
                                pythonifyValue(key, options) +
                                ': ' +
                                pythonifyValue(value[key], options, indentLevel + 1)
                            );
                        })
                        .join(',\n') +
                    '\n' +
                    makeIndent(indentLevel) +
                    '}'
                );
            default:
                console.error('Unsupported parameter type ' + typeof value, value);
                throw new Error('Unsupported parameter type ' + typeof value);
        }
    }

    function objectToNamedArgs(params) {
        return Object.keys(params)
            .map((name) => {
                const value = params[name];
                // This allows a non-sparse map of params, in which a param key may
                // be set as undefined, e.g. in the case of an optional param which
                // simply has not been set. This simplifies calling code because it
                // does not have to filter these out.
                if (value !== undefined) {
                    return name + '=' + pythonifyValue(value);
                }
            })
            .filter((param) => {
                return param !== undefined;
            });
    }

    /**
     * Builds a "nice" list of args by adding indentations and returns between each.
     * E.g., turns ["foo", "bar", "baz"] into:
     * "
     *     foo,
     *     bar,
     *     baz
     * "
     * @param {array} args - the array of arguments to make pretty
     * @returns
     */
    function buildNiceArgsList(args) {
        const indent = indentString;
        return '\n' + indent + args.join(',\n' + indent) + '\n';
    }

    function buildBatchAppRunner(cellId, runId, app, params) {
        const paramSetName = 'batch_params',
            pythonifiedParams = pythonifyValue(params, { autoIndent: true }),
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId,
            });
        const positionalArgs = [pythonifyValue(app.id), paramSetName].concat(namedArgs);
        return [
            paramSetName + ' = ' + pythonifiedParams,
            'from biokbase.narrative.jobs.appmanager import AppManager',
            'AppManager().run_app_batch(' + buildNiceArgsList(positionalArgs) + ')',
        ].join('\n');
    }

    function buildAppRunner(cellId, runId, app, params) {
        const positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true }, 1),
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId,
            }),
            args = positionalArgs.concat(namedArgs),
            appCall = params instanceof Array ? 'run_app_batch' : 'run_app',
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().' + appCall + '(' + buildNiceArgsList(args) + ')',
            ].join('\n');

        return pythonCode;
    }

    function buildEditorRunner(cellId, runId, app, params) {
        const positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true }),
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId,
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_dynamic_service(' + buildNiceArgsList(args) + ')',
            ].join('\n');

        return pythonCode;
    }

    function buildViewRunner(cellId, runId, app, params) {
        const positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true }),
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId,
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_local_app(' + buildNiceArgsList(args) + ')',
            ].join('\n');

        return pythonCode;
    }

    function buildAdvancedViewRunner(cellId, runId, app, params, outputState) {
        const positionalArgs = [
                pythonifyValue(app.id),
                pythonifyValue(params, { autoIndent: true }),
                pythonifyValue(outputState, { autoIndent: true }),
            ],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId,
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_local_app_advanced(' + buildNiceArgsList(args) + ')',
            ].join('\n');

        return pythonCode;
    }

    function buildOutputRunner(jqueryWidgetName, widgetTag, cellId, params) {
        const positionalArgs = [
                pythonifyValue(jqueryWidgetName),
                pythonifyValue(params, { autoIndent: true }, 1),
            ],
            namedArgs = objectToNamedArgs({
                tag: widgetTag,
                cell_id: cellId,
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.widgetmanager import WidgetManager',
                'WidgetManager().show_output_widget(' + buildNiceArgsList(args) + ')',
            ].join('\n');

        return pythonCode;
    }

    function buildDataWidgetRunner(ref, cellId, title, tag) {
        const positionalArgs = [pythonifyValue(ref)];
        const namedArgs = objectToNamedArgs({
            cell_id: cellId,
            title: title,
            tag: tag,
        });
        const args = positionalArgs.concat(namedArgs);
        const pythonCode = [
            'from biokbase.narrative.widgetmanager import WidgetManager',
            'WidgetManager().show_data_widget(' + buildNiceArgsList(args) + ')',
        ].join('\n');
        return pythonCode;
    }

    function buildCustomWidgetRunner(cellId, runId, app) {
        const positionalArgs = [pythonifyValue(app.id)],
            namedArgs = objectToNamedArgs({
                tag: app.tag,
                version: app.version,
                cell_id: cellId,
                run_id: runId,
            }),
            args = positionalArgs.concat(namedArgs),
            pythonCode = [
                'from biokbase.narrative.jobs.appmanager import AppManager',
                'AppManager().run_widget_app(' + buildNiceArgsList(args) + ')',
            ].join('\n');

        return pythonCode;
    }

    /**
     * Builds the call to run_app_bulk
     * @param {string} cellId the unique id of the cell, for run metadata
     * @param {string} runId the unique id of the run, for metadata
     * @param {array} appInfo the set of information to send to the function.
     * This should have the following format:
     * [{
     *   app_id: 'MyModule/my_app',
     *   tag: 'release' (or 'beta' or 'dev'),
     *   version: '1.2.3' (or a git hash if not released),
     *   params: [{
     *     param1: value1,
     *     param2: value2,
     *   }, {
     *     param1: value3,
     *     param2: value4
     *   }]
     * }, ...repeat the above]
     * Each app gets its own entry in the list, and each object in the params list
     * is an individual run of that app.
     * @returns string - the Python code to run
     */
    function buildBulkAppRunner(cellId, runId, appInfo) {
        const args = [
            pythonifyValue(appInfo, {}, 1),
            ...objectToNamedArgs({
                cell_id: cellId,
                run_id: runId,
            }),
        ];
        return [
            'from biokbase.narrative.jobs.appmanager import AppManager',
            `AppManager().run_app_bulk(${buildNiceArgsList(args)})`,
        ].join('\n');
    }

    return {
        objectToNamedArgs,
        pythonifyValue,
        buildAppRunner,
        buildBatchAppRunner,
        buildEditorRunner,
        buildViewRunner,
        buildAdvancedViewRunner,
        buildOutputRunner,
        buildCustomWidgetRunner,
        buildDataWidgetRunner,
        buildBulkAppRunner,
        buildNiceArgsList,
    };
});
