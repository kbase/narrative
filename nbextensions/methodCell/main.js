/*global define,console*/
/*jslint white:true,browser:true*/
/*
 * KBase Method Cell Extension
 *
 * Supports kbase method cells and the kbase cell toolbar.
 *
 * Note that, out of our control, this operates under the "module as singleton" model.
 * In this model, the execution of the module the first time per session is the same
 * as creating a global management object.
 *
 * Thus we do things like createa a message bus
 *
 * @param {type} $
 * @param {type} Jupyter
 * @param {type} html
 *
 */
define([
    'jquery',
    'base/js/namespace',
    'bluebird',
    'uuid',
    'kb_common/html',
    './widgets/codeCellInputWidget',
    './widgets/fieldWidget',
    './runtime',
    './microBus',
    './parameterSpec',
    'kb_service/utils',
    'kb_service/client/workspace',
    'css!./styles/method-widget.css',
    'bootstrap'
], function ($, Jupyter, Promise, Uuid, html, CodeCellInputWidget, FieldWidget, Runtime, Bus, ParameterSpec, serviceUtils, Workspace) {
    'use strict';
    var t = html.tag,
        div = t('div'), button = t('button'), span = t('span'), form = t('form'),
        mainBus, methodCells = {},
        workspaceInfo,
        env,
        runtime = Runtime.make();

//    function getAuthToken() {
//        if (env === 'narrative') {
//            return Jupyter.narrative.authToken;
//        }
//        throw new Error('No authorization implemented for this environment: ' + env);
//    }

    function addCell(cell) {
        methodCells[cell.cell_id] = {
            cell: cell
        };
    }

    function showNotifications(cell) {
        // Update comment if any
        if (!cell.metadata.kbase.notifications) {
            return;
        }

        var notificationsNode = cell.kbase.$node.find('[data-element="body"] [data-element="notifications"]'),
            content;

        cell.metadata.kbase.notifications.forEach(function (notification) {
            content = div({class: 'alert alert-' + notification.type, dataDismiss: 'alert'}, [
                notification.message,
                button({type: 'button', class: 'close', dataDismiss: 'alert', ariaLabel: 'Close'}, [
                    span({ariaHidden: 'true'}, '&times;')
                ])
            ]);
            notificationsNode.append(content);
        });
    }

    function addNotification(cell, type, message) {
        if (!cell.metadata.kbase.notifications) {
            cell.metadata.kbase.notifications = [];
        }
        cell.metadata.kbase.notifications.push({
            type: type,
            message: message
        });
        showNotifications(cell);
    }

    function findElement(cell, path) {
        var selector = path.map(function (segment) {
            return '[data-element="' + segment + '"]';
        }).join(' '),
            node = cell.kbase.$node.find(selector);

        return node;
    }

    function showStatus(cell) {
        var status = getMeta(cell, 'attributes', 'status') || 'n/a',
            node = findElement(cell, ['prompt', 'status']);
        node.text(status);
    }

    function setStatus(cell, status) {
        setMeta(cell, 'attributes', 'status', status);
    }

    function getStatus(cell) {
        return getMeta(cell, 'attributes', 'status');
    }


    function makeInputField(cell, parameterSpec, value) {
        var bus = Bus.make(),
            inputWidget = getInputWidgetFactory(parameterSpec);

        // Listen for changed values coming from any cell. Since invocation of
        // this function implies that we know the cell, the parameter, and
        // the input widget, this is the place to tie it all together.
        bus.listen({
            test: function (message) {
                return (message.type === 'changed');
            },
            handle: function (message) {
                setMeta(cell, 'params', parameterSpec.id(), message.newValue);
            }
        });

        return FieldWidget.make({
            inputControl: inputWidget,
            showHint: true,
            useRowHighight: true,
            initialValue: value,
            spec: parameterSpec,
            bus: bus
        });
    }

    function getParamValue(cell, paramName) {
        if (!cell.metadata.kbase.params) {
            return;
        }
        return cell.metadata.kbase.params[paramName];
    }

    /*
     * Python interop
     */

    function pythonString(string, singleQuote) {
        if (singleQuote) {
            return "'" + string + "'";
        }
        return '"' + string + '"';
    }

    function buildPython(cell) {
        var method = cell.metadata.kbase.method,
            params = cell.metadata.kbase.params,
            cellId = cell.metadata.kbase.attributes.id,
            pythonCode = [
                'from biokbase.narrative.jobs.methodmanager import MethodManager',
                'mm = MethodManager()',
                'new_job = mm.run_method(\n' + pythonifyInputs(method, params, cellId) + '\n)'
            ].join('\n');
        cell.set_text(pythonCode);
        
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

    function pythonifyInputs(method, params, cellId) {
        var pythonString = '    "' + method.id + '",\n';
        
        pythonString += '    tag="' + method.tag + '",\n';
        if (method.tag === 'release') {
            pythonString += '    version="' + method.version + '",\n';
        }
        pythonString += '    cell_id="' + cellId + '",\n';

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

    function buildPython_old(cell) {
        var params = JSON.stringify({
            params: cell.metadata.kbase.params,
            method: cell.metadata.kbase.method,
            cell: {
                id: cell.cell_id
            }
        }),
            pythonCode = [
                'import json',
                'from_javascript = ' + pythonString(params, true),
                'incoming_data = json.loads(from_javascript)',
                'run_method(incoming_data)'
            ],
            pythonCodeString = pythonCode.join('\n');
        cell.set_text(pythonCodeString);
        setStatus(cell, 'code built');
        return true;
    }

    function resetPython(cell) {
        cell.set_text('');
        // setStatus(cell, 'code built');
        return true;
    }

    function runPython(cell) {
        if (buildPython(cell)) {
            cell.execute();
            setStatus(cell, 'running');
        }
    }


    /*
     * Dealing with metadata
     */
    function createMeta(cell, initial) {
        var meta = cell.metadata;
        meta.kbase = initial;
        cell.metadata = meta;
    }
    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (!cell.metadata.kbase[group]) {
            return;
        }
        return cell.metadata.kbase[group][name];
    }
    function setMeta(cell, group, name, value) {
        /*
         * This funny business is because the trigger on setting the metadata
         * property (via setter and getter in core Cell object) is only invoked
         * when the metadata preoperty is actually set -- doesn't count if
         * properties of it are.
         */
        var temp = cell.metadata;
        // Handle the case of setting a group to an entire object
        if (value === undefined) {
            temp.kbase[group] = name;
        } else {
            if (!temp.kbase[group]) {
                temp.kbase[group] = {};
            }
            temp.kbase[group][name] = value;
        }
        cell.metadata = temp;
    }

    function extendCell(cell) {
        var prototype = Object.getPrototypeOf(cell);
        prototype.createMeta = function (initial) {
            var meta = this.metadata;
            meta.kbase = initial;
            this.metadata = meta;
        };
        prototype.getMeta = function (group, name) {
            if (!this.metadata.kbase) {
                return;
            }
            if (name === undefined) {
                return this.metadata.kbase[group];
            }
            if (!this.metadata.kbase[group]) {
                return;
            }
            return this.metadata.kbase[group][name];
        };
        prototype.setMeta = function (group, name, value) {
            /*
             * This funny business is because the trigger on setting the metadata
             * property (via setter and getter in core Cell object) is only invoked
             * when the metadata preoperty is actually set -- doesn't count if
             * properties of it are.
             */
            var temp = this.metadata;
            if (!temp.kbase) {
                temp.kbase = {};
            }
            if (!temp.kbase[group]) {
                temp.kbase[group] = {};
            }
            temp.kbase[group][name] = value;
            this.metadata = temp;
        };
        prototype.pushMeta = function (group, value) {
            /*
             * This funny business is because the trigger on setting the metadata
             * property (via setter and getter in core Cell object) is only invoked
             * when the metadata preoperty is actually set -- doesn't count if
             * properties of it are.
             */
            var temp = this.metadata;
            if (!temp.kbase) {
                temp.kbase = {};
            }
            if (!temp.kbase[group]) {
                temp.kbase[group] = [];
            }
            temp.kbase[group].push(value);
            this.metadata = temp;
        };

    }

    // TOOLBAR

    function doEditNotebookMetadata() {
        Jupyter.notebook.edit_metadata({
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager
        });
    }
    function editNotebookMetadata(toolbarDiv, cell) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (cell.metadata.kbase.type !== 'method') {
            return;
        }
        var button = html.tag('button'),
            editButton = button({
                type: 'button',
                class: 'btn btn-default btn-xs',
                dataElement: 'kbase-edit-notebook-metadata'}, [
                'Edit Notebook Metadata'
            ]);
        $(toolbarDiv).append(editButton);
        $(toolbarDiv).find('[data-element="kbase-edit-notebook-metadata"]').on('click', function () {
            doEditNotebookMetadata(cell);
        });
    }

    function initCodeInputArea(cell) {
        var codeInputArea = cell.input.find('.input_area');
        if (!cell.kbase.inputAreaDisplayStyle) {
            cell.kbase.inputAreaDisplayStyle = codeInputArea.css('display');
        }
        setMeta(cell, 'user-settings', 'showCodeInputArea', false);
    }

    function showCodeInputArea(cell) {
        var codeInputArea = cell.input.find('.input_area');
        if (getMeta(cell, 'user-settings', 'showCodeInputArea')) {
            codeInputArea.css('display', cell.kbase.inputAreaDisplayStyle);
        } else {
            codeInputArea.css('display', 'none');
        }
    }

    function toggleCodeInputArea(cell) {
        var codeInputArea = cell.input.find('.input_area');
        /*
         * the code input area's style is stached for future restoration.
         */
        if (getMeta(cell, 'user-settings', 'showCodeInputArea')) {
            setMeta(cell, 'user-settings', 'showCodeInputArea', false);
        } else {
            setMeta(cell, 'user-settings', 'showCodeInputArea', true);
        }
        showCodeInputArea(cell);
        return getMeta(cell, 'user-settings', 'showCodeInputArea');
    }

    function addJob(cell, job_id) {
        var jobRec = {
            jobId: job_id,
            added: (new Date()).toUTCString(),
            lastUpdated: (new Date()).toUTCString()
        },
        jobs;
        if (!getMeta(cell, 'attributes', 'jobs')) {
            jobs = [];
        } else {
            jobs = getMeta(cell, 'attributes', 'jobs');
        }
        jobs.push(jobRec);
        console.log('jobs', jobs);
        setMeta(cell, 'attributes', 'jobs', jobs);
    }

    /*
     * Sub tasks of cell setup
     */

    function setupToolbar() {
        /*
         * Cell Toolbar
         */
        function toggleInput(toolbarDiv, cell) {
            if (!cell.metadata.kbase) {
                return;
            }
            if (cell.metadata.kbase.type !== 'method') {
                return;
            }
            var inputAreaShowing = getMeta(cell, 'user-settings', 'showCodeInputArea'),
                label = inputAreaShowing ? 'Hide code' : 'Show code',
                toggleButton = button({
                    type: 'button',
                    class: 'btn btn-default btn-xs',
                    dataElement: 'kbase-method-cell-hideshow'}, [
                    label
                ]);
            $(toolbarDiv).append(toggleButton);
            $(toolbarDiv).find('[data-element="kbase-method-cell-hideshow"]').on('click', function (e) {
                toggleCodeInputArea(cell);
            });
        }
        function credit(toolbarDiv, cell) {
            $(toolbarDiv).append(span({style: {padding: '4px'}}, 'KBase Toolbar'));
        }
        function status(toolbarDiv, cell) {
            var status = getMeta(cell, 'attributes', 'status'),
                content = span({style: {fontWeight: 'bold'}}, status);
            $(toolbarDiv).append(span({style: {padding: '4px'}}, content));
        }
        function jobStatus(toolbarDiv, cell) {
            var jobStatus = getMeta(cell, 'attributes', 'jobStatus'),
                content = span({style: {fontWeight: 'bold'}}, jobStatus);
            $(toolbarDiv).append(span({style: {padding: '4px'}}, content));
        }
        function info(toolbarDiv, cell) {
            var id = cell.cell_id,
                content = span({style: {fontStyle: 'italic'}}, id);
            $(toolbarDiv).append(span({style: {padding: '4px'}}, content));
        }
        Jupyter.CellToolbar.register_callback('kbase-toggle-input', toggleInput);
        Jupyter.CellToolbar.register_callback('kbase-credit', credit);
        Jupyter.CellToolbar.register_callback('kbase-status', status);
        Jupyter.CellToolbar.register_callback('kbase-job-status', jobStatus);
        Jupyter.CellToolbar.register_callback('kbase-info', info);
        Jupyter.CellToolbar.register_callback('kbase-edit-notebook-metadata', editNotebookMetadata);

        // Jupyter.CellToolbar.register_preset('KBase', ['kbase-edit-notebook-metadata', 'kbase-toggle-input', 'default.rawedit', 'kbase-credit', 'kbase-status', 'kbase-info']);
    }

    // This is copied out of jupyter code.
    function activateToolbar() {
        var toolbarName = 'KBase';
        Jupyter.CellToolbar.global_show();
        Jupyter.CellToolbar.activate_preset(toolbarName, Jupyter.events);
        Jupyter.notebook.metadata.celltoolbar = toolbarName;
    }

    function updateRunStatus(cell, data) {
        switch (data.status) {
            case 'error':
                setMeta(cell, 'attributes', 'status', 'job:' + data.status);
                addNotification(cell, 'danger', data.message);
                break;
            case 'job_started':
                addJob(cell, data.job_id);
                setMeta(cell, 'attributes', 'status', 'job_started');
                // TODO: tell the job manager? or perhaps it already knows.
                break;
        }
    }

    function makeMethodId(module, name) {
        return [module, name].filter(function (element) {
            return element ? true : false;
        }).join('/');
    }
    
    function setupParams(cell, methodSpec) {
        var defaultParams = {};
        methodSpec.parameters.forEach(function (parameterSpec) {
            var param = ParameterSpec.make({parameterSpec: parameterSpec}),
                defaultValue = param.defaultValue();
                
            // A default value may be undefined, e.g. if the parameter is required and there is no default value.
            if (defaultValue !== undefined) {
                defaultParams[param.id()] = defaultValue;
            }            
        });
        setMeta(cell, 'params', defaultParams);
    }
    
    /*
     * Should only be called when a cell is first inserted into a narrative.
     * It creates the correct metadata and then sets up the cell.
     * 
     */ 
    function createCell(cell, methodSpec, methodTag) {
        
        return Promise.try(function () {
            // How about we just use the id and not the module and name?
            var meta = cell.metadata;
            meta.kbase = {
                type: 'method',
                attributes: {
                    id: new Uuid(4).format(),
                    status: 'new',
                    created: (new Date()).toUTCString()
                },
                method: {
                    tag: methodTag,
                    id: methodSpec.info.id,
                    //name: spec.info.name,
                    //module: spec.info.module_name,
                    gitCommitHash: methodSpec.info.git_commit_hash,
                    version: methodSpec.info.ver
                }
            };
            cell.metadata = meta;
        })
            .then(function () {
                // populate the parameters
                return setupParams(cell, methodSpec);
            })
            .then(function () {
                return setupCell(cell);
        });

        
    }

    function setupCell(cell) {
        return Promise.try(function () {
            // Only handle kbase cells.
            if (cell.cell_type !== 'code') {
                console.log('not a code cell!');
                return;
            }
            if (!cell.metadata.kbase) {
                console.log('not a kbase code cell');
                return;
            }
            if (cell.metadata.kbase.type !== 'method') {
                console.log('not a kbase method cell, ignoring');
                return;
            }

            extendCell(cell);

            addCell(cell);

            // The kbase property is only used for managing runtime state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            cell.kbase = {
            };

            // Cell metadata is always accessed directly on the metadata object of the cell.
            //if (!cell.metadata.kbase) {
            //    createMeta({
            //        attributes: {
            //            status: 'new',
            //            created: (new Date()).toUTCString()
            //        }
            //    });
           // }

            /*
             * Code input area sync.
             * Defaults to hidden, but we need to reflect the state of the
             * metadata settings.
             */
            initCodeInputArea(cell);

            showCodeInputArea(cell);


            // Update metadata.
            setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

            var cellBus = Bus.make(),
                methodId = getMeta(cell, 'method', 'id'),
                methodTag = getMeta(cell, 'method', 'tag'),
                inputWidget = CodeCellInputWidget.make({
                    bus: cellBus,
                    cell: cell,
                    runtime: runtime,
                    workspaceInfo: workspaceInfo
                }),
                kbaseNode = document.createElement('div');

            // Create (above) and place the main container for the input cell.
            cell.input.after($(kbaseNode));
            cell.kbase.node = kbaseNode;
            cell.kbase.$node = $(kbaseNode);

            // set up events.

            cellBus.on('submitted', function (message) {
                // Save the document. We need to ensure that the 
                runPython(cell);
            });
            cellBus.on('parameters-invalid', function (message) {
                resetPython(cell);
                setStatus(cell, 'incomplete');
                showStatus(cell);
            });
            cellBus.on('parameters-validated', function (message) {
                buildPython(cell);
                setStatus(cell, 'runnable');
                showStatus(cell);
            });
            cellBus.on('status', function (message) {
                setStatus(cell, message.status);
            });
            

            /*
             * This looks simple, but follow code cell input widget, field widget,
             * and ultimately the input widget called for by the paramater
             * spec for details...
             */
            /*
             * Insert the kbase widget dom node
             * Essentially this is a "row" of the cell. The code cell, in its natural
             * state, has an input and output area, named "input" and "output_wrapper"
             * The practice established by the ipywidget extension is that an extension
             * may place another element in the code cell. There doesn't seem to be
             * any documentation for standards -- ipywidgets just places theirs after
             * the input. We just do the same, although there should be a protocol
             * for ordering, compatability. Perhaps if we set the code cell subtype,
             * we can assume that no-other type of extension operates on this cell
             * (TODO: see if there is something already in place, I don't think so.)
             *
             */
            return inputWidget.attach(kbaseNode)
                .then(function () {
                    return inputWidget.start();
                })
                .then(function () {
                    return inputWidget.run({
                        methodId: methodId,
                        methodTag: methodTag,
                        authToken: runtime.authToken()
                    });
                })
                .then(function () {
                    showNotifications(cell);

                    /*
                     * Cell events
                     * runstatus - events from the method running manager
                     * NB need to listen on the main bus, because the cell (so far)
                     * talks through the module instance, which itself has a
                     * global instance of the mainbus
                     */
                    mainBus.listen({
                        test: function (message) {
                            return (message.type === 'runstatus');
                        },
                        handle: function (message) {
                            updateRunStatus(cell, message);
                            // console.log('RUNSTATUS', message);
                        }
                    });
//                    mainBus.listen({
//                        test: function (message) {
//                            return (message.id === 'submitted');
//                        },
//                        handle: function (message) {
//                            // Very simple, since the cell will already have
//                            // been updated by any input cell changes.
//                            updatePython(cell);
//                        }
//                    });
                });
        });
    }

    function setupNotebook() {
        return Promise.all(Jupyter.notebook.get_cells().map(function (cell) {
            return setupCell(cell);
        }));
    }

    function getWorkspaceRef() {
        // TODO: all kbase notebook metadata should be on a kbase top level property;
        var workspaceName = Jupyter.notebook.metadata.ws_name, // Jupyter.notebook.metadata.kbase.ws_name,
            workspaceId;

        if (workspaceName) {
            return {workspace: workspaceName};
        }

        workspaceId = Jupyter.notebook.metadata.ws_id; // Jupyter.notebook.metadata.kbase.ws_id;
        if (workspaceId) {
            return {id: workspaceId};
        }

        throw new Error('workspace name or id is missing from this narrative');
    }

    function setupWorkspace(workspaceUrl) {
        // TODO where to get config from generally?
        var workspaceRef = getWorkspaceRef(),
            workspace = new Workspace(workspaceUrl, {
                token: runtime.authToken()
            });

        return workspace.get_workspace_info(workspaceRef);

    }

    /*
     * Called directly by Jupyter during the notebook startup process.
     * Called after the notebook is loaded and the dom structure is created.
     * The job of this call is to mutate the notebook and cells to suite
     * oneself, set up any services or other things needed for operation of
     * the notebook or cells.
     * The work is carried out asynchronously through an orphan promise.
     */
    function load_ipython_extension() {
        console.log('Loading KBase Method Cell Extension...');

        // Set the notebook environment.
        // For instance, we don't want to override the toolbar in the Narrative, but we need to supply our on in a plain notebook.
        env = 'narrative';

        // Set up our toolbar extensions.
        setupToolbar();

        // And make a toolbar preset composed of the extensions, and activate it for this notebook.
        if (env !== 'narrative') {
            activateToolbar();
        }

        // TODO: get the kbase specific info out of the notebook, specifically
        // the workspace name, ...

        setupWorkspace(runtime.config('services.workspace.url'))
            .then(function (wsInfo) {
                workspaceInfo = serviceUtils.workspaceInfoToObject(wsInfo);
                return workspaceInfo;
            })
            .then(function () {
                return setupNotebook();
            })
            .then(function () {
                // set up event hooks
                $([Jupyter.events]).on('inserted.Cell', function (event, data) {
                    if (data.kbase && data.kbase.type === 'method') {
                        createCell(data.cell, data.kbase.methodSpec, data.kbase.methodTag)
                            .then(function () {
                                console.log('Cell created?');
                            })
                            .catch(function (err) {
                                console.error('ERROR creating cell', err);
                            });
                    }
                });
                // also delete.Cell, edit_mode.Cell, select.Cell, command_mocd.Cell, output_appended.OutputArea ...
                // preset_activated.CellToolbar, preset_added.CellToolbar
            })
            .catch(function (err) {
                console.error('ERROR setting up nodebook', err);
            });
    }

    // MAIN
    // module state instantiation

    function init() {
        mainBus = Bus.make();
    }
    init();

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load_ipython_extension,
        // These are kbase api calls
        send: mainBus.send,
        listen: mainBus.listen
    };
});
