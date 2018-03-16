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
    'bluebird',
    'uuid',
    'kb_common/html',
    'base/js/namespace',
    './widgets/advancedViewCellWidget',
    'common/runtime',
    'common/parameterSpec',
    'common/utils',
    'common/dom',
    'common/props',
    'common/appUtils',
    'common/jupyter',
    'common/spec',
    //    './widgets/codeCellRunWidget',
    'kb_service/utils',
    'kb_service/client/workspace',
    'css!kbase/css/appCell.css',
    'css!./styles/main.css',
    'bootstrap'
], function(
    $,
    Promise,
    Uuid,
    html,
    Jupyter,
    ViewCellWidget,
    Runtime,
    ParameterSpec,
    utils,
    Dom,
    Props,
    AppUtils,
    jupyter,
    Spec,
    serviceUtils,
    Workspace
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        workspaceInfo,
        runtime = Runtime.make();

    /*
     * Should only be called when a cell is first inserted into a narrative.
     * It creates the correct metadata and then sets up the cell.
     *
     */
    function upgradeToViewCell(cell, appSpec, appTag) {
        return Promise.try(function() {
                // Create base app cell
                var meta = cell.metadata;
                meta.kbase = {
                    type: 'advancedView',
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
                            spec: appSpec
                        },
                        state: {
                            edit: 'editing',
                            params: null,
                            code: null,
                            request: null,
                            result: null
                        },
                        params: null,
                        outputWidgetState: null
                    }
                };
                cell.metadata = meta;
            })
            .then(function() {
                // Add the params
                var spec = Spec.make({
                    appSpec: appSpec
                });
                utils.setCellMeta(cell, 'kbase.viewCell.params', spec.makeDefaultedModel());
            })
            .then(function() {
                // Complete the cell setup.
                return setupCell(cell);
            })
            .then(function(cellStuff) {
                // Initialize the cell to its default state.
                cellStuff.bus.emit('reset-to-defaults');
            });
    }

    function specializeCell(cell) {
        cell.minimize = function() {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]'),
                showCode = utils.getCellMeta(cell, 'kbase.viewCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.classList.remove('-show');
            }
            outputArea.addClass('hidden');
            viewInputArea.addClass('hidden');
        };

        cell.maximize = function() {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]'),
                showCode = utils.getCellMeta(cell, 'kbase.viewCell.user-settings.showCodeInputArea');

            if (showCode) {
                if (!inputArea.classList.contains('-show')) {
                    inputArea.classList.add('-show');
                }
            }
            outputArea.removeClass('hidden');
            viewInputArea.removeClass('hidden');
        };
        cell.renderIcon = function() {
            var inputPrompt = this.element[0].querySelector('[data-element="prompt"]');

            if (inputPrompt) {
                inputPrompt.innerHTML = div({
                    style: { textAlign: 'center' }
                }, [
                    AppUtils.makeAppIcon(utils.getCellMeta(cell, 'kbase.viewCell.app.spec'))
                ]);
            }
        };
        cell.getIcon = function() {
            var icon = AppUtils.makeToolbarAppIcon(utils.getCellMeta(cell, 'kbase.viewCell.app.spec'));
            return icon;
        };
    }

    function checkAndRepairCell(cell) {
        var spec = utils.getCellMeta(cell, 'kbase.viewCell.app.spec');
        if (!spec) {
            spec = utils.getCellMeta(cell, 'kbase.viewCell.app.appSpec');
            if (!spec) {
                throw new Error('App Spec not set on this editor.');
            }
            utils.setCellMeta(cell, 'kbase.viewCell.app.spec', spec);
            console.warn('Editor cell repaired -- the app spec was set on the old property');
            delete utils.getCellMeta(cell, 'kbase.viewCell.app').appSpec;
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
            if (cell.metadata.kbase.type !== 'advancedView') {
                return;
            }

            checkAndRepairCell(cell);

            // Attach methods to the cell
            specializeCell(cell);

            // Add custom styles to the cell.
            cell.element[0].classList.add('kb-advanced-view-cell');


            // The kbase property is only used for managing runtime state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            cell.kbase = {};

            // Update metadata.
            utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

            // TODO: the code cell input widget should instantiate its state
            // from the cell!!!!
            var cellBus = runtime.bus().makeChannelBus({ description: 'Parent comm for The Cell Bus' }),
                appId = utils.getMeta(cell, 'viewCell', 'app').id,
                appTag = utils.getMeta(cell, 'viewCell', 'app').tag,
                viewCellWidget = ViewCellWidget.make({
                    bus: cellBus,
                    cell: cell,
                    runtime: runtime,
                    workspaceInfo: workspaceInfo
                }),
                dom = Dom.make({ node: cell.input[0] }),
                kbaseNode = dom.createNode(div({
                    dataSubareaType: 'view-cell-input'
                }));

            // Create (above) and place the main container for the input cell.
            cell.input.after($(kbaseNode));
            cell.kbase.node = kbaseNode;
            cell.kbase.$node = $(kbaseNode);

            jupyter.disableKeyListenersForCell(cell);

            return viewCellWidget.init()
                .then(function() {
                    return viewCellWidget.attach(kbaseNode);
                })
                .then(function() {
                    return viewCellWidget.start();
                })
                .then(function() {
                    return viewCellWidget.run({
                        appId: appId,
                        appTag: appTag,
                        authToken: runtime.authToken()
                    });
                })
                .then(function() {
                    cell.renderMinMax();
                    return {
                        widget: viewCellWidget,
                        bus: cellBus
                    };
                });
        });
    }

    function setupNotebook() {
        return Promise.all(jupyter.getCells().map(function(cell) {
            return setupCell(cell);
        }));
    }

    function setupWorkspace(workspaceUrl) {
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
    function initializeExtension() {
        // Listen for interesting narrative jquery events...
        // dataUpdated.Narrative is emitted by the data sidebar list
        // after it has fetched and updated its data. Not the best of
        // triggers that the ws has changed, not the worst.

        setupWorkspace(runtime.config('services.workspace.url'))
            .then(function(wsInfo) {
                workspaceInfo = serviceUtils.workspaceInfoToObject(wsInfo);
                return workspaceInfo;
            })
            .then(function() {
                return setupNotebook();
            })
            .then(function() {
                // insertedAtIndex.Cell issued after insert_at_index with
                // the following message:
                // cell - cell object created
                // type - jupyter cell type ('code', 'markdown')
                // index - index at which cell was inserted
                // data - kbase cell setup data.
                jupyter.onEvent('insertedAtIndex.Cell', function(event, payload) {
                    var cell = payload.cell;
                    var setupData = payload.data;
                    var jupyterCellType = payload.type;
                    if (setupData &&
                        jupyterCellType === 'code' &&
                        setupData.type === 'advancedView') {
                        upgradeToViewCell(cell, setupData.appSpec, setupData.appTag)
                            .catch(function(err) {
                                console.error('ERROR creating cell', err);
                                jupyter.deleteCell(cell);
                                // TODO proper error dialog
                                alert('Could not insert cell due to errors.\n' + err.message);
                            });
                    }
                });
            })
            .catch(function(err) {
                console.error('ERROR setting up notebook', err);
            });
    }

    // MAIN
    function load() {
        /* Only initialize after the notebook is fully loaded. */
        if (Jupyter.notebook._fully_loaded) {
            initializeExtension();
        }
        else {
            $([Jupyter.events]).one('notebook_loaded.Notebook', function () {
                initializeExtension();
            });
        }
    }

    return {
        load_ipython_extension: load
    };
}, function(err) {
    // TODO: use the error reporting mechanism from the app cell
    console.error('ERROR loading viewCell main', err);
});
