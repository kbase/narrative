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
    './methodCellController',
    './pythonInterop',
    './widgets/codeCellInputWidget',
    './widgets/codeCellRunWidget',
    './widgets/FieldWidget',
    './runtime',
    './microBus',
    './parameterSpec',
    './utils',
    'kb_service/utils',
    'kb_service/client/workspace',
    'css!./styles/method-widget.css',
    'bootstrap'
], function ($, Jupyter, Promise, Uuid, html, MethodCellController, PythonInterop,
             CodeCellInputWidget, RunWidget, 
             FieldWidget, Runtime, Bus, ParameterSpec, utils, serviceUtils, Workspace) {
    'use strict';
    var t = html.tag,
        div = t('div'), button = t('button'), span = t('span'), form = t('form'),
        workspaceInfo,
        env,
        controllerBus = Bus.make(),
        runtime = Runtime.make();

//    function getAuthToken() {
//        if (env === 'narrative') {
//            return Jupyter.narrative.authToken;
//        }
//        throw new Error('No authorization implemented for this environment: ' + env);
//    }

    // We maintain a map of method cells for quick lookup. Strangely, Jupyter does not 
    // seem to offer a method of lookup up cells by the (temporary) cell.cell_id.
    // Here we use cell.metadata.kbase.attributes.id


//    function showNotifications(cell) {
//        // Update comment if any
//        if (!cell.metadata.kbase.notifications) {
//            return;
//        }
//
//        var notificationsNode = cell.kbase.$node.find('[data-element="body"] [data-element="notifications"]'),
//            content;
//
//        cell.metadata.kbase.notifications.forEach(function (notification) {
//            content = div({class: 'alert alert-' + notification.type, dataDismiss: 'alert'}, [
//                notification.message,
//                button({type: 'button', class: 'close', dataDismiss: 'alert', ariaLabel: 'Close'}, [
//                    span({ariaHidden: 'true'}, '&times;')
//                ])
//            ]);
//            notificationsNode.append(content);
//        });
//    }
//
//    function addNotification(cell, type, message) {
//        if (!cell.metadata.kbase.notifications) {
//            cell.metadata.kbase.notifications = [];
//        }
//        cell.metadata.kbase.notifications.push({
//            type: type,
//            message: message
//        });
//        showNotifications(cell);
//    }

//    function findElement(cell, path) {
//        var selector = path.map(function (segment) {
//            return '[data-element="' + segment + '"]';
//        }).join(' '),
//            node = cell.kbase.$node.find(selector);
//
//        return node;
//    }

//    function showStatus(cell) {
//        var status = utils.getMeta(cell, 'attributes', 'status') || 'n/a',
//            node = findElement(cell, ['prompt', 'status']);
//        node.text(status);
//    }

//    function setStatus(cell, status) {
//        utils.setMeta(cell, 'attributes', 'status', status);
//    }
//
//    function getStatus(cell) {
//        return utils.getMeta(cell, 'attributes', 'status');
//    }
//
//
//    function getParamValue(cell, paramName) {
//        if (!cell.metadata.kbase.params) {
//            return;
//        }
//        return cell.metadata.kbase.params[paramName];
//    }
//
//    function buildPython(cell) {
//        var code = PythonInterop.buildMethodRunner(cell);
//        cell.set_text(code);
//    }
//    
//
//    function resetPython(cell) {
//        cell.set_text('');
//    }
//
//
//    function insertRunWidget(cellId, kbaseCellid) {
//        var args = {
//            cellId: cellId,
//            kbaseCellId: kbaseCellid
//        };
//        console.log('inserting widget', args);
//        var widget = RunWidget.make(args);
//        return widget.attach(args)
//            .then(function () {
//                console.log('IT WORKED');
//            });
//    }
//
//    function runPython(cell) {
//            cell.execute();
//            utils.setMeta(cell, 'jobState', {
//                runState: 'launched',
//                startTime: new Date().getTime()
//            });
//            setStatus(cell, 'running');
//
////        return insertRunWidget(cell.cell_id, utils.getMeta(cell, 'attributes', 'id'))
////            .then(function () {
////                cell.execute();
////                utils.setMeta(cell, 'jobState', {
////                    runState: 'launched',
////                    startTime: new Date().getTime()
////                });
////                setStatus(cell, 'running');
////            })
////            
////            .catch(function (err) {
////                console.error('BOO', err, args);
////            });
//    }


    /*
     * Dealing with metadata
     */
    

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
            if (value === undefined) {
                temp.kbase[group] = name;
            } else {
                temp.kbase[group][name] = value;
            }
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
//
//    function doEditNotebookMetadata() {
//        Jupyter.notebook.edit_metadata({
//            notebook: Jupyter.notebook,
//            keyboard_manager: Jupyter.notebook.keyboard_manager
//        });
//    }
//    function editNotebookMetadata(toolbarDiv, cell) {
//        if (!cell.metadata.kbase) {
//            return;
//        }
//        if (cell.metadata.kbase.type !== 'method') {
//            return;
//        }
//        var button = html.tag('button'),
//            editButton = button({
//                type: 'button',
//                class: 'btn btn-default btn-xs',
//                dataElement: 'kbase-edit-notebook-metadata'}, [
//                'Edit Notebook Metadata'
//            ]);
//        $(toolbarDiv).append(editButton);
//        $(toolbarDiv).find('[data-element="kbase-edit-notebook-metadata"]').on('click', function () {
//            doEditNotebookMetadata(cell);
//        });
//    }

//    function initCodeInputArea(cell) {
//        var codeInputArea = cell.input.find('.input_area');
//        if (!cell.kbase.inputAreaDisplayStyle) {
//            cell.kbase.inputAreaDisplayStyle = codeInputArea.css('display');
//        }
//        utils.setMeta(cell, 'user-settings', 'showCodeInputArea', false);
//    }
//
//    function showCodeInputArea(cell) {
//        var codeInputArea = cell.input.find('.input_area');
//        if (utils.getMeta(cell, 'user-settings', 'showCodeInputArea')) {
//            codeInputArea.css('display', cell.kbase.inputAreaDisplayStyle);
//        } else {
//            codeInputArea.css('display', 'none');
//        }
//    }

//    function toggleCodeInputArea(cell) {
//        var codeInputArea = cell.input.find('.input_area');
//        /*
//         * the code input area's style is stached for future restoration.
//         */
//        if (utils.getMeta(cell, 'user-settings', 'showCodeInputArea')) {
//            utils.setMeta(cell, 'user-settings', 'showCodeInputArea', false);
//        } else {
//            utils.setMeta(cell, 'user-settings', 'showCodeInputArea', true);
//        }
//        showCodeInputArea(cell);
//        return utils.getMeta(cell, 'user-settings', 'showCodeInputArea');
//    }

//    function addJob(cell, job_id) {
//        var jobRec = {
//            jobId: job_id,
//            added: (new Date()).toUTCString(),
//            lastUpdated: (new Date()).toUTCString()
//        },
//        jobs;
//        if (!utils.getMeta(cell, 'attributes', 'jobs')) {
//            jobs = [];
//        } else {
//            jobs = utils.getMeta(cell, 'attributes', 'jobs');
//        }
//        jobs.push(jobRec);
//        console.log('jobs', jobs);
//        utils.setMeta(cell, 'attributes', 'jobs', jobs);
//    }

    /*
     * Sub tasks of cell setup
     */

   

    // This is copied out of jupyter code.
    function activateToolbar() {
        var toolbarName = 'KBase';
        Jupyter.CellToolbar.global_show();
        Jupyter.CellToolbar.activate_preset(toolbarName, Jupyter.events);
        Jupyter.notebook.metadata.celltoolbar = toolbarName;
    }

//    function updateRunStatus(cell, data) {
//        // console.log('RUNSTATUS', data);
//        var jobState = cell.getMeta('jobState');
//        switch (data.status) {
//            case 'error':
//                jobState.runState = 'completed';
//                jobState.resultState = 'error';
//                jobState.endTime = new Date().getTime();
//                cell.setMeta('jobState', jobState);
//                // utils.setMeta(cell, 'attributes', 'status', 'job:' + data.status);
//                addNotification(cell, 'danger', data.message);
//                break;
//            case 'job_started':
//                jobState.runState = 'running';
//                jobState.resultState = 'started';
//                // jobState.endTime = new Date().getTime();
//
//                addJob(cell, data.job_id);
//                // utils.setMeta(cell, 'attributes', 'status', 'job_started');
//                // TODO: tell the job manager? or perhaps it already knows.
//                break;
//        }
//    }

//    function makeMethodId(module, name) {
//        return [module, name].filter(function (element) {
//            return element ? true : false;
//        }).join('/');
//    }

    // TODO: move into method cell widget and invoke with an event 'reset-to-default-values'
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
        utils.setMeta(cell, 'methodCell', 'params', defaultParams);
    }

    /*
     * Should only be called when a cell is first inserted into a narrative.
     * It creates the correct metadata and then sets up the cell.
     * 
     */
    function createCell(cell, methodSpec, methodTag) {
        return Promise.try(function () {
            var meta = cell.metadata;
            meta.kbase = {
                type: 'method',
                attributes: {
                    id: new Uuid(4).format(),
                    status: 'new',
                    created: (new Date()).toUTCString()
                },
                methodCell: {
                    method: {
                        id: methodSpec.info.id,
                        gitCommitHash: methodSpec.info.git_commit_hash,
                        version: methodSpec.info.ver,
                        tag: methodTag
                    },
                    state: {
                        edit: null,
                        params: null,
                        code: null,
                        request: null,
                        result: null
                    }
                }
            };
            cell.metadata = meta;
        })
            .then(function () {
                return setupParams(cell, methodSpec);
            })
            .then(function () {
                return setupCell(cell);
            })
            .then(function (cellStuff) {
                cellStuff.bus.send({
                    type: 'reset-to-defaults'
                });
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

            MethodCellController.addCell(cell);

            // The kbase property is only used for managing runtime state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            cell.kbase = {
            };

            // Update metadata.
            utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

            // TODO: the code cell input widget should instantiate its state
            // from the cell!!!!
            var cellBus = Bus.make(),
                methodId = utils.getMeta(cell, 'methodCell', 'method').id,
                methodTag = utils.getMeta(cell, 'methodCell', 'method').tag,
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

            return inputWidget.init()
                .then(function () {
                    return inputWidget.attach(kbaseNode);
                })
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
                    MethodCellController.start();
                    return {
                        widget: inputWidget,
                        bus: cellBus
                    };
                });
        });
    }
    
    function createCellx(cell, methodSpec, methodTag) {
        return Promise.try(function () {
            var meta = cell.metadata;
            meta.kbase = {
                type: 'method',
                state: {
                    edit: null,
                    params: null,
                    code: null,
                    request: null,
                    result: null
                },
                jobDetails: {
                    id: null,
                    state: null,
                    deleted: null,
                    submitted: null,
                    started: null,
                    completed: null
                    
                },
                runState: {
                    launch: {
                        start: null,
                        finish: null,
                        elapsed: null
                    },
                    queue: {
                        start: null,
                        finish: null,
                        elapsed: null
                    },
                    running: {
                        start: null,
                        finish: null,
                        elapsed: null
                    },
                    success: {
                        start: null,
                        finish: null,
                        elapsed: null
                    },
                    error: {
                        start: null,
                        finish: null,
                        elapsed: null
                    }
                },
                history: [],
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

    function setupCellx(cell) {
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

            MethodCellController.addCell(cell);

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
            utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

            var cellBus = Bus.make(),
                methodId = utils.getMeta(cell, 'methodCell', 'method').id,
                methodTag = utils.getMeta(cell, 'methodCell', 'method').tag,
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

//            cellBus.on('submitted', function (message) {
//                // Save the document. We need to ensure that the 
//                runPython(cell);
//            });

//            cellBus.on('parameters-invalid', function (message) {
//                resetPython(cell);
//                cellBus.send({
//                    type: 'newstate',
//                    state: {
//                        edit: 'editing',
//                        params: 'incomplete',
//                        code: 'incomplete-params',
//                        request: null,
//                        result: null
//                    }
//                });
//                showStatus(cell);
//            });
//            cellBus.on('parameters-validated', function (message) {
//                buildPython(cell);
//                cellBus.send({
//                    type: 'newstate',
//                    state: {
//                        edit: 'editing',
//                        params: 'ok',
//                        code: 'built',
//                        request: null,
//                        result: null
//                    }
//                });
//                setStatus(cell, 'runnable');
//                showStatus(cell);
//            });
//            cellBus.on('status', function (message) {
//                setStatus(cell, message.status);
//            });


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
            return inputWidget.init()
                .then(function () {
                    return inputWidget.attach(kbaseNode);
                })
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
                
                    MethodCellController.start();

                    /*
                     * Cell events
                     * runstatus - events from the method running manager
                     * NB need to listen on the main bus, because the cell (so far)
                     * talks through the module instance, which itself has a
                     * global instance of the mainbus
                     */
//                    MethodCellController.bus.listen({
//                        test: function (message) {
//                            return (message.type === 'runstatus');
//                        },
//                        handle: function (message) {
//                            updateRunStatus(cell, message);
//                            // console.log('RUNSTATUS', message);
//                        }
//                    });
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
            
                // Primary hook for new cell creation.
                // If the cell has been set with the metadata key kbase.type === 'method'
                // we have a method cell.
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
                console.error('ERROR setting up notebook', err);
            });
    }

    // MAIN
    // module state instantiation

    function init() {
    }
    init();

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load_ipython_extension
        // These are kbase api calls
    };
});
