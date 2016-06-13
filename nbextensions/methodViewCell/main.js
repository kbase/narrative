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
    './widgets/methodViewCellWidget',
    './widgets/codeCellRunWidget',
    './widgets/FieldWidget',
    'common/runtime',
    'common/miniBus',
    'common/parameterSpec',
    'common/utils',
    'kb_service/utils',
    'kb_service/client/workspace',
    'css!./styles/method-widget.css',
    'bootstrap'
], function (
    $, 
Jupyter, 
Promise, 
Uuid, 
html, 
MethodCellController, 
    MethodCellWidget, 
    RunWidget,
    FieldWidget, 
    Runtime, 
    Bus, 
    ParameterSpec, 
    utils, 
    serviceUtils, 
    Workspace
        ) {
    'use strict';
    var t = html.tag,
        div = t('div'), button = t('button'), span = t('span'), form = t('form'),
        workspaceInfo,
        env,
        runtime = Runtime.make();



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


    // This is copied out of jupyter code.
    function activateToolbar() {
        var toolbarName = 'KBase';
        Jupyter.CellToolbar.global_show();
        Jupyter.CellToolbar.activate_preset(toolbarName, Jupyter.events);
        Jupyter.notebook.metadata.celltoolbar = toolbarName;
    }


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
     *
     *
     */

    var appStates = [
        {
            state: {
                mode: 'editing',
                params: 'incomplete'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete'
                },
                {
                    mode: 'editing',
                    params: 'incomplete'
                }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'complete'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'editing',
                params: 'complete',
                code: 'built'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'incomplete'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                },
                {
                    mode: 'processing',
                    stage: 'launching'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'launching'
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'processing',
                    stage: 'launching'
                },
                {
                    mode: 'error',
                    stage: 'launching'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'queued'
            },
            next: [
                {
                    mode: 'processing',
                    stage: 'running'
                },
                {
                    mode: 'processing',
                    stage: 'queued'
                },
                {
                    mode: 'error',
                    stage: 'queued'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'processing',
                stage: 'running'
            },
            next: [
                {
                    mode: 'success'
                },
                {
                    mode: 'error',
                    stage: 'running'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'success'
            },
            next: [
                {
                    mode: 'success'
                },
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]
        },
        {
            state: {
                mode: 'error',
                stage: 'launching'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]

        },
        {
            state: {
                mode: 'error',
                stage: 'queued'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]

        },
        {
            state: {
                mode: 'error',
                stage: 'running'
            },
            next: [
                {
                    mode: 'editing',
                    params: 'complete',
                    code: 'built'
                }
            ]

        }
    ];

    function intialAppState() {
        return {
            mode: 'editing'
        };
    }
    function stateTransition(existingState, changes) {

    }

    /*
     * Should only be called when a cell is first inserted into a narrative.
     * It creates the correct metadata and then sets up the cell.
     *
     */
    function upgradeCell(cell, methodSpec, methodTag) {
        return Promise.try(function () {
            var meta = cell.metadata;
            meta.kbase = {
                type: 'view',
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
                        edit: 'editing',
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
                cellStuff.bus.emit('reset-to-defaults');
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
            if (cell.metadata.kbase.type !== 'view') {
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
            var cellBus = runtime.bus().makeChannelBus(),
                methodId = utils.getMeta(cell, 'methodCell', 'method').id,
                methodTag = utils.getMeta(cell, 'methodCell', 'method').tag,
                methodCellWidget = MethodCellWidget.make({
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

            return methodCellWidget.init()
                .then(function () {
                    return methodCellWidget.attach(kbaseNode);
                })
                .then(function () {
                    return methodCellWidget.start();
                })
                .then(function () {
                    return methodCellWidget.run({
                        methodId: methodId,
                        methodTag: methodTag,
                        authToken: runtime.authToken()
                    });
                })
                .then(function () {
                    // MethodCellController.start();
                    return {
                        widget: methodCellWidget,
                        bus: cellBus
                    };
                })
                .catch(function (err) {
                    console.error('ERROR starting method cell', err);
                    alert('Error starting method cell');
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
                    if (data.kbase && data.kbase.type === 'view') {
                        upgradeCell(data.cell, data.kbase.methodSpec, data.kbase.methodTag)
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



    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load_ipython_extension
            // These are kbase api calls
    };
});
