/*global define*/
/*jslint white:true,browser:true*/

define([
    './utils',
    'uuid'
], function (utils, Uuid) {
    'use strict';

    function pythonString(string, singleQuote) {
        if (singleQuote) {
            return "'" + string + "'";
        }
        return '"' + string + '"';
    }

    function buildPythonx(cell) {
        var method = cell.metadata.kbase.method,
            params = cell.metadata.kbase.params,
            cellId = cell.metadata.kbase.attributes.id,
            runParams = JSON.stringify({
                cell_id: cell.cell_id,
                kbase_cell_id: utils.getMeta(cell, 'attributes', 'id')
            }),
            pythonCode = [
                'from biokbase.narrative.jobs import AppManager',
                'AppManager.run_app(\n' + pythonifyInputs(method, params, cellId) + '\n)'
            ].join('\n');
        cell.set_text(pythonCode);

        return true;
    }


    function buildOutputCellPython(cell) {
        var params = JSON.stringify({
            cell_id: cell.cell_id,
            kbase_cell_id: utils.getMeta(cell, 'attributes', 'id')
        }),
            pythonCode = [
                'import json',
                'from_javascript = ' + pythonString(params, true),
                'incoming_data = json.loads(from_javascript)',
                'insert_run_widget(incoming_data)'
            ],
            pythonCodeString = pythonCode.join('\n');

        cell.set_text(pythonCodeString);
        setStatus(cell, 'code built');
        return true;
    }

    /**
     * method {object} properties = [tag, name, module, gitCommitHash, version]
     * params {object} properties = semi-random list of names
     * cellId {string}
     *
     * returns the inputs to biokbase.narrative.jobs.methodmanager.MethodManger.run_method() (whew)
     * which looks like this:
     * run_method(method_id, tag='release', version=None, cell_id=None, **kwargs)
     * where each kwarg is a param input of the form foo="bar", or foo={"bar":"baz"}, or foo=["bar","baz"], etc.
     * So, return everything but the encapsulating function call.
     */
    function xpythonifyInputs(method, params, cellId) {
        var methodId = method.module + '/' + method.name,
            tag = method.tag,
            version = method.version;

        var pythonString = '    "' + methodId + '",\n';
        if (tag) {
            pythonString += '    tag="' + tag + '",\n';
        }
        if (version) {
            pythonString += '    version="' + version + '",\n';
        }
        if (cellId) {
            pythonString += '    cell_id="' + cellId + '",\n';
        }

        var kwargs = [];
        // now the parameters...
        $.each(params, function (pName, pVal) {
            // options - either atomic value or list. No hashes, right?
            var arg = '    ' + pName + '=';
            if (typeof pVal !== 'object') {
                if (typeof pVal === 'number') {
                    arg += pVal;
                } else {
                    arg += '"' + pVal + '"';
                }
            } else if (pVal instanceof Array) {
                arg += '[';
                // assume they're all the same type, either number or string. Because they should be.
                if (typeof pVal === 'number') {
                    arg += pVal.join(', ');
                } else {
                    arg += '"' + pVal.join('", "') + '"';
                }
                arg += ']';
            } else {
                arg += '{"huh": "it is a dict."}';
            }
            kwargs.push(arg);
        });
        pythonString += kwargs.join(',\n');
        return pythonString;
    }

    function escapeString(stringValue, delimiter) {
        return stringValue.replace(delimiter, '\\"').replace(/\n/, '\\n');
    }

    function pythonifyInputs(method, params, cellId, runId) {
        var pythonString = '    "' + method.id + '",\n';

        pythonString += '    tag="' + method.tag + '",\n';
        if (method.tag === 'release') {
            pythonString += '    version="' + method.version + '",\n';
        }
        pythonString += '    cell_id="' + cellId + '",\n';

        pythonString += '    run_id="' + runId + '",\n';

        var kwargs = [];
        // now the parameters...
        Object.keys(params).forEach(function (pName) {
            // options - either atomic value or list. No hashes, right?
            var pVal = params[pName],
                arg = '    ' + pName + '=';

            switch (typeof pVal) {
                case 'number':
                    if (pVal === null) {
                        arg += 'None';
                    } else {
                        arg += String(pVal);
                    }
                    break;
                case 'string':
                    arg += '"' + pVal + '"';
                    break;
                case 'object':
                    if (pVal instanceof Array) {
                        arg += '[';

                        arg += pVal.map(function (value) {
                            switch (typeof value) {
                                case 'number':
                                    return String(value);
                                case 'string':
                                    return '"' + escapeString(value, '"') + '"';
                                default:
                                    throw new Error('Invalid array element of type ' + (typeof value));
                            }
                        }).join(', ');

                        // assume they're all the same type, either number or string. Because they should be.
                        arg += ']';
                    } else if (pVal === null) {
                        arg += 'None';
                    } else {
                        throw new Error('Objects (dicts) are not supported in parameters');
                        // arg += '{"huh": "it is a dict."}';
                    }
                    break;
                default:
                    throw new Error('Unsupported parameter type ' + (typeof pVal) + ' for param ' + pName);
            }
            kwargs.push(arg);
        });
        pythonString += kwargs.join(',\n');
        return pythonString;
    }

    function pythonifyArgs(params) {
        var pythonString = '';

        var kwargs = [];
        // now the parameters...
        Object.keys(params).forEach(function (pName) {
            // options - either atomic value or list. No hashes, right?
            var pVal = params[pName],
                arg = '    ' + pName + '=';

            switch (typeof pVal) {
                case 'number':
                    if (pVal === null) {
                        arg += 'None';
                    } else {
                        arg += String(pVal);
                    }
                    break;
                case 'string':
                    arg += '"' + pVal + '"';
                    break;
                case 'object':
                    if (pVal instanceof Array) {
                        arg += '[';

                        arg += pVal.map(function (value) {
                            switch (typeof value) {
                                case 'number':
                                    return String(value);
                                case 'string':
                                    return escapeString(value, '"');
                                default:
                                    throw new Error('Invalid array element of type ' + (typeof value));
                            }
                        }).join(', ');

                        // assume they're all the same type, either number or string. Because they should be.
                        arg += ']';
                    } else if (pVal === null) {
                        arg += 'None';
                    } else {
                        throw new Error('Objects (dicts) are not supported in paramters');
                        // arg += '{"huh": "it is a dict."}';
                    }
                    break;
                default:
                    throw new Error('Unsupported parameter type ' + (typeof pVal));
            }
            kwargs.push(arg);
        });
        pythonString += kwargs.join(',\n');
        return pythonString;
    }

    function buildAppRunner(cellId, method, params) {
        var runId = new Uuid(4).format(),
            pythonCode = [
                'from biokbase.narrative.jobs import AppManager',
                'AppManager().run_app(\n' + pythonifyInputs(method, params, cellId, runId) + '\n)'
            ].join('\n');

        return pythonCode;
    }

    function buildMethodRunnerWithOutput(cell) {
        var method = utils.getMeta(cell, 'methodCell', 'method'),
            params = utils.getMeta(cell, 'methodCell', 'params'),
            cellId = utils.getMeta(cell, 'attributes').id,
            runId = new Uuid(4).format(),
            runParams = JSON.stringify({
                cell_id: cell.cell_id,
                kbase_cell_id: cellId
            }),
            pythonCode = [
                'from biokbase.narrative.jobs import AppManager',
                'import json',
                'mm = MethodManager()',
                'from_javascript = ' + pythonString(runParams, true),
                'incoming_data = json.loads(from_javascript)',
                'AppManager.run_app(\n' + pythonifyInputs(method, params, cellId, runId) + '\n)',
                'insert_run_widget(incoming_data[u"cell_id"], incoming_data[u"kbase_cell_id"])'
            ].join('\n');

        return pythonCode;
    }


    return {
        buildAppRunner: buildAppRunner
    };
});