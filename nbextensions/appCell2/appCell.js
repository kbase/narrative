/*global define*/
/*jslint white:true,browser:true,nomen:true */

define([
    'bluebird',
    'uuid',
    'common/utils',
    'common/runtime',
    'common/html',
    'common/dom',
    'common/appUtils',
    'common/jupyter',
    'common/ui',
    './widgets/appInfoDialog',
    './widgets/appCellWidget',
    'common/spec'
], function (
    Promise,
    Uuid,
    utils,
    Runtime,
    html,
    Dom,
    AppUtils,
    jupyter,
    UI,
    appInfoDialog,
    AppCellWidget,
    Spec
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p');

    function isAppCell(cell) {
        if (cell.cell_type !== 'code') {
            return false;
        }
        if (!cell.metadata.kbase) {
            return false;
        }
        if (cell.metadata.kbase.type === 'app2' || cell.metadata.kbase.type === 'app') {
            return true;
        }
        return false;
    }

    function factory(config) {
        var cell = config.cell,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),
            spec;

        function specializeCell() {
            cell.minimize = function () {
                var inputArea = this.input.find('.input_area'),
                    outputArea = this.element.find('.output_wrapper'),
                    viewInputArea = this.element.find('[data-subarea-type="app-cell-input"]'),
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
                    viewInputArea = this.element.find('[data-subarea-type="app-cell-input"]'),
                    showCode = utils.getCellMeta(cell, 'kbase.appCell.user-settings.showCodeInputArea');

                if (showCode) {
                    inputArea.removeClass('hidden');
                }
                outputArea.removeClass('hidden');
                viewInputArea.removeClass('hidden');
            };
            cell.getIcon = function () {
                return AppUtils.makeToolbarAppIcon(utils.getCellMeta(cell, 'kbase.appCell.app.spec'));
            };
            cell.renderIcon = function () {
                var iconNode = this.element[0].querySelector('.celltoolbar [data-element="icon"]');
                if (iconNode) {
                    iconNode.innerHTML = AppUtils.makeToolbarAppIcon(utils.getCellMeta(cell, 'kbase.appCell.app.spec'));
                }
            };
            cell.showInfo = function () {
                var app = utils.getCellMeta(cell, 'kbase.appCell.app');
                appInfoDialog.show({
                    id: app.spec.info.id,
                    version: app.spec.info.ver,
                    module: app.spec.info.module_name,
                    tag: app.tag
                });
            };
        }

        

        function setupCell() {
            return Promise.try(function () {
                // Only handle kbase cells.
                if (!isAppCell(cell)) {
                    return;
                }

                specializeCell(cell);

                // The kbase property is only used for managing runtime state of the cell
                // for kbase. Anything to be persistent should be on the metadata.
                cell.kbase = {};

                // Update metadata.
                utils.setCellMeta(cell, 'kbase.attributes.lastLoaded', (new Date()).toUTCString());

                // TODO: the code cell input widget should instantiate its state
                // from the cell!!!!
                var cellBus = runtime.bus().makeChannelBus({
                        description: 'Parent comm for The Cell Bus'
                    }),
                    appCellWidget = AppCellWidget.make({
                        bus: cellBus,
                        cell: cell,
                        runtime: runtime,
                        workspaceInfo: workspaceInfo
                    }),
                    dom = Dom.make({ node: cell.input[0] }),
                    kbaseNode = dom.createNode(div({ dataSubareaType: 'app-cell-input' }));
                // inserting after, with raw dom, means telling the parent node
                // to insert a node before the node following the one we are 
                // referencing. If there is no next sibling, the null value
                // causes insertBefore to actually ... insert at the end!
                cell.input[0].parentNode.insertBefore(kbaseNode, cell.input[0].nextSibling);

                /*
                 * This is required for all KBase cells in order to disable the 
                 * Jupyter keyboard management. Although a app startup code remaps
                 * some of the more dangerous Jupyter keys (change cell type, delete cel,
                 * etc.), there are keys that we need to keep enabled because 
                 * they are part of the standard Jupyter functionality, such as
                 * shift-enter, ctrl-enter for code cells, 
                 */
                jupyter.disableKeyListenersForCell(cell);

                cell.kbase.node = kbaseNode;
                // cell.kbase.$node = $(kbaseNode);

                return appCellWidget.init()
                    .then(function () {
                        return appCellWidget.attach(kbaseNode);
                    })
                    .then(function () {
                        return appCellWidget.start();
                    })
                    .then(function () {
                        return appCellWidget.run({
                            authToken: runtime.authToken()
                        });
                    })
                    .then(function () {
                        cell.renderMinMax();

                        return {
                            widget: appCellWidget,
                            bus: cellBus
                        };
                    })
                    .catch(function (err) {
                        console.error('ERROR starting app cell', err);
                        // var ui = UI.make({
                        //     node: document.body
                        // });
                        // return ui.showInfoDialog({
                        //     title: 'Error Starting App Cell',
                        //     body: div({
                        //         class: 'alert alert-danger'
                        //     }, [
                        //         p('There was an error starting the app cell.'),
                        //         p('The error is:'),
                        //         p(err.message)
                        //     ])
                        // });
                        // TODO:
                        return appCellWidget.stop()
                            .then(function () {
                                return appCellWidget.detach();
                            })
                            .catch(function (err) {
                                console.log('ERR in ERR', err);
                            })
                            .finally(function () {
                                var ui = UI.make({
                                    node: document.body
                                });
                                kbaseNode.innerHTML = div({
                                    style: {
                                        margin: '10px'
                                    }
                                }, [
                                    ui.buildPanel({
                                        title: 'Error Starting App Cell',
                                        type: 'danger',
                                        body: ui.buildErrorTabs({
                                            preamble: p('There was an error starting the app cell.'),
                                            error: err
                                        })
                                    })
                                ]);

                            });

                        // Replace app cell node with an error message!!!

                        // alert('Error starting app cell: ' + err.message);
                    });
            });
        }

        function upgradeToAppCell(appSpec, appTag) {
            return Promise.try(function () {
                    // Create base app cell

                    // TODO: this should capture the entire app spec, so don't need
                    // to carry appSpec around.
                    spec = Spec.make({
                        appSpec: appSpec
                    });

                    var meta = {
                        kbase: {
                            type: 'app',
                            attributes: {
                                id: new Uuid(4).format(),
                                status: 'new',
                                created: (new Date()).toUTCString()
                            },
                            appCell: {
                                app: {
                                    id: appSpec.info.id,
                                    gitCommitHash: appSpec.info.git_commit_hash,
                                    version: appSpec.info.ver,
                                    tag: appTag,
                                    // TODO: remove the spec from the cell metadata
                                    spec: appSpec
                                },
                                params: null,
                                output: {
                                    byJob: {}
                                }
                            }
                        }
                    };
                    cell.metadata = meta;

                    // Add the params
                    utils.setCellMeta(cell, 'kbase.appCell.params', spec.makeDefaultedModel());
                    // initializeParams(appSpec);
                    // Complete the cell setup.
                    return setupCell();
                })
                .then(function (cellStuff) {
                    // Initialize the cell to its default state.
                    // cellStuff.bus.emit('reset-to-defaults');
                });
        }

        return Object.freeze({
            // initializeParams: initializeParams,
            setupCell: setupCell,
            upgradeToAppCell: upgradeToAppCell
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
        isAppCell: isAppCell
    };
});