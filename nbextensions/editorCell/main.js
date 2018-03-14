/*global define,console*/
/*jslint white:true,browser:true*/
/*
 * KBase Editor Cell Extension
 *
 * Supports kbase editor cells and the kbase cell toolbar.
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
    'require',
    'base/js/namespace',
    'bluebird',
    'uuid',
    'kb_common/html',
    'common/runtime',
    'common/parameterSpec',
    'common/utils',
    'common/clock',
    'common/dom',
    'common/appUtils',
    'common/jupyter',
    'kb_service/utils',
    'kb_service/client/workspace',

    'css!kbase/css/appCell.css',
    'css!./styles/main.css',
    'bootstrap'
], function(
    $,
    require,
    Jupyter,
    Promise,
    Uuid,
    html,
    Runtime,
    ParameterSpec,
    utils,
    Clock,
    Dom,
    AppUtils,
    jupyter,
    serviceUtils,
    Workspace
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        workspaceInfo,
        env,
        runtime = Runtime.make();

    // This is copied out of jupyter code.
    function activateToolbar() {
        var toolbarName = 'KBase';
        Jupyter.CellToolbar.global_show();
        Jupyter.CellToolbar.activate_preset(toolbarName, Jupyter.events);
        Jupyter.notebook.metadata.celltoolbar = toolbarName;
    }

    /*
     * Should only be called when a cell is first inserted into a narrative.
     * It creates the correct metadata and then sets up the cell.
     *
     */
    function upgradeToEditorCell(cell, appSpec, appTag) {
        return Promise.try(function() {
                var meta = cell.metadata;
                meta.kbase = {
                    type: 'editor',
                    attributes: {
                        id: new Uuid(4).format(),
                        status: 'new',
                        created: (new Date()).toUTCString(),
                        icon: 'bar-chart'
                    },
                    cellState: {
                        icon: 'bar-chart'
                    },
                    editorCell: {
                        app: {
                            id: appSpec.info.id,
                            gitCommitHash: appSpec.info.git_commit_hash,
                            version: appSpec.info.ver,
                            tag: appTag,
                            spec: appSpec
                        },
                        editor: {
                            type: appSpec.widgets.input
                        },
                        state: {
                            edit: 'editing',
                            params: null,
                            code: null,
                            request: null,
                            result: null
                        },
                        params: null
                    }
                };
                cell.metadata = meta;
            })
            .then(function() {
                // Complete the cell setup.
                return setupCell(cell);
            });
    }

    function specializeCell(cell) {
        cell.minimize = function() {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                editorInputArea = this.element.find('[data-subarea-type="editor-cell-input"]'),
                showCode = utils.getCellMeta(cell, 'kbase.editorCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.classList.remove('-show');
            }
            outputArea.addClass('hidden');
            editorInputArea.addClass('hidden');
        };

        cell.maximize = function() {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                editorInputArea = this.element.find('[data-subarea-type="editor-cell-input"]'),
                showCode = utils.getCellMeta(cell, 'kbase.editorCell.user-settings.showCodeInputArea');

            if (showCode) {
                if (!inputArea.classList.contains('-show')) {
                    inputArea.classList.add('-show');
                }
            }
            outputArea.removeClass('hidden');
            editorInputArea.removeClass('hidden');
        };

        cell.renderIcon = function() {
            var inputPrompt = this.element[0].querySelector('[data-element="prompt"]');

            if (inputPrompt) {
                inputPrompt.innerHTML = div({
                    style: { textAlign: 'center' }
                }, [
                    AppUtils.makeAppIcon(utils.getCellMeta(cell, 'kbase.editorCell.app.spec'))
                ]);
            }
        };

        cell.getIcon = function() {
            return AppUtils.makeToolbarAppIcon(utils.getCellMeta(cell, 'kbase.editorCell.app.spec'));
        };

        cell.toggleCodeInputArea = function() {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                codeInputArea.classList.toggle('-show');
                utils.setCellMeta(cell, 'kbase.editorCell.user-settings.showCodeInputArea', this.isCodeShowing(), true);
                // NB purely for side effect - toolbar refresh
                cell.metadata = cell.metadata;
            }
        };
    }

    function getEditorModule(type) {
        return new Promise(function(resolve, reject) {
            var editorDir;

            // Dispatch on the editor type.
            // Type is passed in the widgets.input spec property
            // Editors are located in ./widgets/editors
            switch (type) {
                case 'reads_set_editor':
                    editorDir = 'readsSet';
                    break;
                default:
                    reject(new Error('Unknown editor type: ' + type));
                    return;
            }
            var modulePath = './widgets/editors/' + editorDir + '/editor';

            // Wrap the module require in a promise.
            require([modulePath], function(Editor) {
                resolve(Editor);
            }, function(err) {
                console.error('ERROR loading module', modulePath, err);
                reject(new Error('Error loading module ' + modulePath));
            });
        });
    }

    /*
        Responsible for checking the vailidity of this editor cell, and fixing up if possible.
    */
    function checkAndRepairCell(cell) {

        // Has proper structure?
        // TODO:

        // Has proper app spec?
        var spec = utils.getCellMeta(cell, 'kbase.editorCell.app.spec');
        if (!spec) {
            spec = utils.getCellMeta(cell, 'kbase.editorCell.app.appSpec');
            if (!spec) {
                throw new Error('App Spec not set on this editor.');
            }
            utils.setCellMeta(cell, 'kbase.editorCell.app.spec', spec);
            console.warn('Editor cell repaired -- the app spec was set on the old property');
            delete utils.getCellMeta(cell, 'kbase.editorCell.app').appSpec;
        }

        // Has proper editor spec?
        var editorType = utils.getCellMeta(cell, 'kbase.editorCell.editor.type');
        if (!editorType) {
            editorType = utils.getCellMeta(cell, 'kbase.editorCell.app.spec.widgets.input');
            if (!editorType) {
                throw new Error('App Spec does not provide an editor type on the widgets.input property');
            }
            console.warn('Editor cell repaired -- the editor type was not set');
            utils.setCellMeta(cell, 'kbase.editorCell.editor.type', editorType);
        }
    }

    function setupCell(cell) {
        return Promise.try(function() {
            if (cell.cell_type !== 'code') {
                return;
            }
            if (!cell.metadata.kbase) {
                return;
            }
            if (cell.metadata.kbase.type !== 'editor') {
                return;
            }

            checkAndRepairCell(cell);

            specializeCell(cell);

            // The kbase property is only used for managing runtime state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            cell.kbase = {};

            // Update metadata.
            utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

            // TODO: the code cell input widget should instantiate its state
            // from the cell!!!!
            var editorType = utils.getCellMeta(cell, 'kbase.editorCell.app.spec.widgets.input');

            return getEditorModule(editorType)
                .then(function(editorModule) {

                    var cellBus = runtime.bus().makeChannelBus({ description: 'Parent comm for The Cell Bus' }),
                        appId = utils.getCellMeta(cell, 'kbase.editorCell.app.id'),
                        appTag = utils.getCellMeta(cell, 'kbase.editorCell.app.tag');

                    //  determine the editor type based on the
                    var editor = editorModule.make({
                            bus: cellBus,
                            cell: cell,
                            runtime: runtime,
                            workspaceInfo: workspaceInfo
                        }),
                        dom = Dom.make({ node: cell.input[0] }),
                        kbaseNode = dom.createNode(div({
                            dataSubareaType: 'editor-cell-input'
                        }));

                    // Create (above) and place the main container for the input cell.
                    // start out hidden so we don't thrash the ui for closed cells.
                    kbaseNode.classList.add('hidden');
                    cell.input.after($(kbaseNode));
                    cell.kbase.node = kbaseNode;
                    cell.kbase.$node = $(kbaseNode);

                    jupyter.disableKeyListenersForCell(cell);

                    return editor.start({
                            node: kbaseNode,
                            appId: appId,
                            appTag: appTag,
                            authToken: runtime.authToken()
                        })
                        .then(function() {
                            // AppCellController.start();
                            cell.renderMinMax();
                            return {
                                widget: editor,
                                bus: cellBus
                            };
                        });
                });
        });
    }

    function setupNotebook() {
        return Promise.all(Jupyter.notebook.get_cells().map(function(cell) {
            return setupCell(cell)
                .catch(function(err) {
                    console.error('ERROR creating cell', err, Jupyter.notebook.find_cell_index(cell));
                    // delete cell.
                    Jupyter.notebook.delete_cell(Jupyter.notebook.find_cell_index(cell));
                    //  $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(cell));
                    alert('Could not load cell due to errors.\nThis cell will be deleted from your Narrative. It will not be permanently deleted until you save your Narrative.\n\nThe error is: ' + err.message);
                });
        }));
    }

    function setupWorkspace(workspaceUrl) {
        // TODO where to get config from generally?
        var workspaceRef = { id: runtime.workspaceId() },
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
    function load() {
        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.

        // TODO: complete the work for narrative startup and migrate this (and all such instances)
        //       into the core startup function.
        $(document).on('dataUpdated.Narrative', function() {
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
            .then(function(wsInfo) {
                workspaceInfo = serviceUtils.workspaceInfoToObject(wsInfo);
                return workspaceInfo;
            })
            .then(function() {
                return setupNotebook();
            })
            .then(function() {
                // set up event hooks

                // Primary hook for new cell creation.
                // If the cell has been set with the metadata key kbase.type === 'app'
                // we have a app cell.
                $([Jupyter.events]).on('insertedAtIndex.Cell', function(event, payload) {
                    var cell = payload.cell;
                    var setupData = payload.data;
                    var jupyterCellType = payload.type;

                    if (jupyterCellType === 'code' &&
                        setupData &&
                        setupData.type === 'editor') {
                        // NB: the app spec and tag come in as appSpec and appTag, but
                        // are rewritten in the "upgraded" cell to app.spec and app.tag
                        upgradeToEditorCell(cell, setupData.appSpec, setupData.appTag)
                            .catch(function(err) {
                                console.error('ERROR creating cell', err);
                                // delete cell.
                                Jupyter.notebook.delete_cell(Jupyter.notebook.find_cell_index(cell));
                                alert('Could not insert cell due to errors.\n\n' + err.message);
                            });
                    }
                });
                // also delete.Cell, edit_mode.Cell, select.Cell, command_mocd.Cell, output_appended.OutputArea ...
                // preset_activated.CellToolbar, preset_added.CellToolbar
            })
            .catch(function(err) {
                console.error('ERROR setting up notebook', err);
                alert('Error loading editor cell extension');
            });
    }

    // MAIN
    // module state instantiation

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
        load_ipython_extension: load
            // These are kbase api calls
    };
}, function(err) {
    console.log('ERROR loading editorCell main', err);
});
