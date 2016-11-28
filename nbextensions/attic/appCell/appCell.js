/*global define*/
/*jslint white:true,browser:true,nomen:true */

define([
    'bluebird',
    'uuid',
    'common/parameterSpec',
    'common/utils',
    'common/runtime',
    'common/html',
    'common/dom',
    'common/appUtils',
    'common/jupyter',
    './widgets/appInfoDialog',
    './widgets/appCellWidget'
], function (
    Promise,
    Uuid,
    ParameterSpec,
    utils,
    Runtime,
    html,
    Dom,
    AppUtils,
    jupyter,
    appInfoDialog,
    AppCellWidget
    ) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function isAppCell(cell) {
        if (cell.cell_type !== 'code') {
            return false;
        }
        if (!cell.metadata.kbase) {
            return false;
        }
        if (cell.metadata.kbase.type !== 'app') {
            return false;
        }
        return true;
    }

    function factory(config) {
        var cell = config.cell,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make();

        function initializeParams(appSpec) {
            var defaultParams = {};
            appSpec.parameters.forEach(function (parameterSpec) {
                var param = ParameterSpec.make({parameterSpec: parameterSpec}),
                    defaultValue = param.defaultValue();

                // A default value may be undefined, e.g. if the parameter is required and there is no default value.
                if (defaultValue !== undefined) {
                    defaultParams[param.id()] = defaultValue;
                }
            });
            utils.setCellMeta(cell, 'kbase.appCell.params', defaultParams);
        }

        function specializeCell() {
            cell.minimize = function () {
                var inputArea = this.input.find('.input_area'),
                    outputArea = this.element.find('.output_wrapper'),
                    viewInputArea = this.element.find('[data-subarea-type="app-cell-input"]'),
                    showCode = utils.getCellMeta(cell, 'kbase.appCell.user-settings.showCodeInputArea');

                console.log('minimize', outputArea, viewInputArea);
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
                cell.kbase = {
                };

                // Update metadata.
                utils.setCellMeta(cell, 'kbase.attributes.lastLoaded', (new Date()).toUTCString());

                // TODO: the code cell input widget should instantiate its state
                // from the cell!!!!
                var cellBus = runtime.bus().makeChannelBus(null, 'Parent comm for The Cell Bus'),
                    appCellWidget = AppCellWidget.make({
                        bus: cellBus,
                        cell: cell,
                        runtime: runtime,
                        workspaceInfo: workspaceInfo
                    }),
                    dom = Dom.make({node: cell.input[0]}),
                    kbaseNode = dom.createNode(div({dataSubareaType: 'app-cell-input'}));
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
                        alert('Error starting app cell: ' + err.message);
                    });
            });
        }

        function upgradeToAppCell(appSpec, appTag) {
            return Promise.try(function () {
                // Create base app cell
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
                initializeParams(appSpec);
                // Complete the cell setup.
                return setupCell();
            })
                .then(function (cellStuff) {
                    // Initialize the cell to its default state.
                    cellStuff.bus.emit('reset-to-defaults');
                });
        }

        return Object.freeze({
            initializeParams: initializeParams,
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