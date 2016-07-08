/*global define,console*/
/*jslint white:true,browser:true*/
/*
 * KBase View Cell Extension
 *
 * Supports kbase view cells and the kbase cell toolbar.
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
    './widgets/viewCellWidget',
    'common/runtime',
    'common/parameterSpec',
    'common/utils',
    'common/clock',
    'common/dom',
    'common/props',
//    './widgets/codeCellRunWidget',
    'kb_service/utils',
    'kb_service/client/workspace',
    'css!./styles/app-widget.css',
    'bootstrap'
], function (
    $,
    Jupyter,
    Promise,
    Uuid,
    html,
    ViewCellWidget,
    Runtime,
    ParameterSpec,
    utils,
    Clock,
    Dom,
    Props,
    serviceUtils,
    Workspace
    ) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        workspaceInfo,
        env,
        runtime = Runtime.make();

    /*
     * Dealing with metadata
     */


    // This is copied out of jupyter code.
    function activateToolbar() {
        var toolbarName = 'KBase';
        Jupyter.CellToolbar.global_show();
        Jupyter.CellToolbar.activate_preset(toolbarName, Jupyter.events);
        Jupyter.notebook.metadata.celltoolbar = toolbarName;
    }



    // TODO: move into app cell widget and invoke with an event 'reset-to-default-values'
    function setupParams(cell, appSpec) {
        var defaultParams = {};
        appSpec.parameters.forEach(function (parameterSpec) {
            var param = ParameterSpec.make({parameterSpec: parameterSpec}),
                defaultValue = param.defaultValue();

            // A default value may be undefined, e.g. if the parameter is required and there is no default value.
            if (defaultValue !== undefined) {
                defaultParams[param.id()] = defaultValue;
            }
        });
        utils.setMeta(cell, 'viewCell', 'params', defaultParams);
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
    function upgradeToViewCell(cell, appSpec, appTag) {
        return Promise.try(function () {
            // Create base app cell
            var meta = cell.metadata;
            meta.kbase = {
                type: 'view',
                attributes: {
                    id: new Uuid(4).format(),
                    status: 'new',
                    created: (new Date()).toUTCString(),
                    icon: 'bar-chart'
                },
                cellState: {
                    icon: 'bar-chart'
                },
                viewCell: {
                    app: {
                        id: appSpec.info.id,
                        gitCommitHash: appSpec.info.git_commit_hash,
                        version: appSpec.info.ver,
                        tag: appTag,
                        appSpec: appSpec
                    },
                    state: {
                        edit: 'editing',
                        params: null,
                        code: null,
                        request: null,
                        result: null
                    },
                    params: null,
                    output: {
                        byJob: {}
                    }
                }
            };
            cell.metadata = meta;
        })
            .then(function () {
                // Add the params
                return setupParams(cell, appSpec);
            })
            .then(function () {
                // Complete the cell setup.
                return setupCell(cell);
            })
            .then(function (cellStuff) {
                // Initialize the cell to its default state.
                cellStuff.bus.emit('reset-to-defaults');
            });
    }
    
    function makeIcon(appSpec) {
        // icon is in the spec ...
        var t = html.tag,
            span = t('span'), img = t('img'),
            runtime = Runtime.make(),
            nmsBase = runtime.config('services.narrative_method_store.image_url'),
            iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

        if (iconUrl) {
            return span({class: 'fa-stack fa-2x', style: {padding: '0 3px 3px 3px'}}, [
                img({src: nmsBase + iconUrl, style: {maxWidth: '50px', maxHeight: '50px', margin: '0x'}})
            ]);
        }

        return span({style: ''}, [
            span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: 'rgb(103,58,183)'}}, [
                span({class: 'fa fa-square fa-stack-2x', style: {color: 'rgb(103,58,183)'}}),
                span({class: 'fa fa-inverse fa-stack-1x fa-cube'})
            ])
        ]);
    }
    
    function makeIcon(appSpec) {
        // icon is in the spec ...
        var t = html.tag,
            span = t('span'), img = t('img'),
            runtime = Runtime.make(),
            nmsBase = runtime.config('services.narrative_method_store.image_url'),
            iconUrl = Props.getDataItem(appSpec, 'info.icon.url');

        if (iconUrl) {
            return span({class: 'fa-stack fa-2x', style: {padding: '0 3px 3px 3px'}}, [
                img({src: nmsBase + iconUrl, style: {maxWidth: '50px', maxHeight: '50px', margin: '0x'}})
            ]);
        }

        return span({style: ''}, [
            span({class: 'fa-stack fa-2x', style: {textAlign: 'center', color: 'rgb(103,58,183)'}}, [
                span({class: 'fa fa-square fa-stack-2x', style: {color: 'rgb(103,58,183)'}}),
                span({class: 'fa fa-inverse fa-stack-1x fa-cube'})
            ])
        ]);
    }
    
    function horribleHackToHideElement(cell, selector, tries) {
        var prompt = cell.element.find(selector);
        if (prompt.length > 0) {
            prompt.css('visibility', 'hidden');
            return;
        }
            
        if (tries > 0) {
            tries -= 1;
            window.setTimeout(function () {
                horribleHackToHideElement(cell, tries);
            }, 100);
        } else {
            console.warn('Could not hide the prompt, sorry');
        }
    }
    
    function hidePrompts(cell) {
        // Hide the code input area.
        cell.input.find('.input_area').addClass('hidden');
        utils.setCellMeta(cell, 'kbase.widgetCell.user-settings.showCodeInputArea', false);
        
        // Hide the prompt...
        cell.input.find('.input_prompt').hide();
        cell.element.find('.output_area > div:nth-child(1)').css('visibility', 'hidden');
        // horribleHackToHideElement(cell, '.output_prompt', 10);
    }
    
    function addPrompt(cell) {
        var prompt = document.createElement('div');
        prompt.innerHTML = div({dataElement: 'prompt', class: 'prompt'});
        cell.input.find('.input_prompt').after($(prompt));
        cell.renderIcon();
    }
    
    function specializeCell(cell) {
        cell.minimize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]'),
                showCode = utils.getCellMeta(cell, 'kbase.appCell.user-settings.showCodeInputArea');
            
            if (showCode) {
                inputArea.addClass('hidden');
            }
            outputArea.addClass('hidden');
            viewInputArea.addClass('hidden');
        };

        cell.maximize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]'),
                showCode = utils.getCellMeta(cell, 'kbase.appCell.user-settings.showCodeInputArea');
            
            if (showCode) {
                inputArea.removeClass('hidden');
            }
            outputArea.removeClass('hidden');
            viewInputArea.removeClass('hidden');
        };
         cell.renderIcon = function () {
            var inputPrompt = this.element[0].querySelector('[data-element="prompt"]');

            if (inputPrompt) {
                inputPrompt.innerHTML = div({
                    style: {textAlign: 'center'}
                }, [
                    makeIcon(utils.getCellMeta(cell, 'kbase.widgetCell.app.spec'))
                ]);
            }
        };
    }

    function setupCell(cell) {
        return Promise.try(function () {
            // Only handle kbase cells.

            if (cell.cell_type !== 'code') {
                // console.log('not a code cell!');
                return;
            }
            if (!cell.metadata.kbase) {
                // console.log('not a kbase code cell');
                return;
            }
            if (cell.metadata.kbase.type !== 'view') {
                // console.log('not a kbase app cell, ignoring');
                return;
            }

            specializeCell(cell);

            // The kbase property is only used for managing runtime state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            cell.kbase = {
            };

            // Update metadata.
            utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

            // TODO: the code cell input widget should instantiate its state
            // from the cell!!!!
            var cellBus = runtime.bus().makeChannelBus(null, 'Parent comm for The Cell Bus'),
                appId = utils.getMeta(cell, 'viewCell', 'app').id,
                appTag = utils.getMeta(cell, 'viewCell', 'app').tag,
                viewCellWidget = ViewCellWidget.make({
                    bus: cellBus,
                    cell: cell,
                    runtime: runtime,
                    workspaceInfo: workspaceInfo
                }),
                dom = Dom.make({node: cell.input[0]}),
                kbaseNode = dom.createNode(div({
                    dataSubareaType: 'view-cell-input'
                }));

            // Create (above) and place the main container for the input cell.
            cell.input.after($(kbaseNode));
            cell.kbase.node = kbaseNode;
            cell.kbase.$node = $(kbaseNode);
            
            hidePrompts(cell);
            addPrompt(cell);
            
            return viewCellWidget.init()
                .then(function () {
                    return viewCellWidget.attach(kbaseNode);
                })
                .then(function () {
                    return viewCellWidget.start();
                })
                .then(function () {
                    return viewCellWidget.run({
                        appId: appId,
                        appTag: appTag,
                        authToken: runtime.authToken()
                    });
                })
                .then(function () {
                    // AppCellController.start();
                    cell.renderMinMax();
                    return {
                        widget: viewCellWidget,
                        bus: cellBus
                    };
                })
                .catch(function (err) {
                    console.error('ERROR starting app cell', err);
                    alert('Error starting app cell');
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
        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.
        $(document).on('dataUpdated.Narrative', function () {
            runtime.bus().emit('workspace-changed');
        });

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
                // If the cell has been set with the metadata key kbase.type === 'app'
                // we have a app cell.
                $([Jupyter.events]).on('inserted.Cell', function (event, data) {
                    if (data.kbase && data.kbase.type === 'view') {
                        upgradeToViewCell(data.cell, data.kbase.appSpec, data.kbase.appTag)
                            .then(function () {
                                // console.log('Cell created?');
                            })
                            .catch(function (err) {
                                console.error('ERROR creating cell', err);
                                // delete cell.
                                $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(data.cell));
                                alert('Could not insert cell due to errors.\n' + err.message);
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

    var clock = Clock.make({
        bus: runtime.bus(),
        resolution: 1000
    });
    clock.start();
    // runtime.bus().logMessages(true);
    // there is not a service/component lifecycle for the narrative is there?
    // so the clock starts, and is never stopped.

//    runtime.bus().on('clock-tick', function (message) {
//       console.log('TICK', message);
//    });

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load_ipython_extension
            // These are kbase api calls
    };
}, function (err) {
    console.log('ERROR loading viewCell main', err);
});
