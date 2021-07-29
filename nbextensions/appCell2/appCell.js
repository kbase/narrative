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
    'common/spec',
], (
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
) => {
    'use strict';

    const t = html.tag,
        div = t('div'),
        p = t('p'),
        b = t('b');

    function isAppCell(cell) {
        if (cell.cell_type !== 'code') {
            return false;
        }
        if (!cell.metadata.kbase) {
            return false;
        }
        if (
            cell.metadata.kbase.type === 'app2' ||
            cell.metadata.kbase.type === 'app' ||
            cell.metadata.kbase.type === 'devapp'
        ) {
            return true;
        }
        return false;
    }

    function factory(config) {
        let cell = config.cell,
            workspaceInfo = config.workspaceInfo,
            runtime = Runtime.make(),
            spec,
            appCellWidget,
            cellBus;

        function specializeCell() {
            cell.minimize = function () {
                const inputArea = this.input.find('.input_area').get(0),
                    outputArea = this.element.find('.output_wrapper'),
                    viewInputArea = this.element.find('[data-subarea-type="app-cell-input"]'),
                    showCode = utils.getCellMeta(
                        cell,
                        'kbase.appCell.user-settings.showCodeInputArea'
                    );

                if (showCode) {
                    inputArea.classList.remove('-show');
                }
                outputArea.addClass('hidden');
                viewInputArea.addClass('hidden');
            };

            cell.maximize = function () {
                const inputArea = this.input.find('.input_area').get(0),
                    outputArea = this.element.find('.output_wrapper'),
                    viewInputArea = this.element.find('[data-subarea-type="app-cell-input"]'),
                    showCode = utils.getCellMeta(
                        cell,
                        'kbase.appCell.user-settings.showCodeInputArea'
                    );

                if (showCode) {
                    if (!inputArea.classList.contains('-show')) {
                        inputArea.classList.add('-show');
                        cell.code_mirror.refresh();
                    }
                }
                outputArea.removeClass('hidden');
                viewInputArea.removeClass('hidden');
            };
            cell.getIcon = function () {
                return AppUtils.makeToolbarAppIcon(
                    utils.getCellMeta(cell, 'kbase.appCell.app.spec')
                );
            };
            cell.renderIcon = function () {
                const iconNode = this.element[0].querySelector(
                    '.celltoolbar [data-element="icon"]'
                );
                if (iconNode) {
                    iconNode.innerHTML = AppUtils.makeToolbarAppIcon(
                        utils.getCellMeta(cell, 'kbase.appCell.app.spec')
                    );
                }
            };
            cell.showInfo = function () {
                const app = utils.getCellMeta(cell, 'kbase.appCell.app');
                appInfoDialog.show({
                    id: app.spec.info.id,
                    version: app.spec.info.ver,
                    module: app.spec.info.module_name,
                    tag: app.tag,
                });
            };
            cell.toggleBatch = function () {
                cellBus.emit('toggle-batch-mode');
            };
        }

        function setupCell() {
            return Promise.try(() => {
                // Only handle kbase cells.
                if (!isAppCell(cell)) {
                    return;
                }

                const cellElement = cell.element;
                cellElement.addClass('kb-cell').addClass('kb-app-cell');

                // Just ide the code area. If it is to be displayed due to the cell
                // settings, that will be handled by the app cell widget.
                // var codeInputArea = cell.input.find('.input_area');
                // codeInputArea[0].classList.add('hidden');

                specializeCell(cell);

                // The kbase property is only used for managing runtime state of the cell
                // for kbase. Anything to be persistent should be on the metadata.
                cell.kbase = {};

                // Update metadata.
                utils.setCellMeta(cell, 'kbase.attributes.lastLoaded', new Date().toUTCString());

                // TODO: the code cell input widget should instantiate its state
                // from the cell!!!!
                cellBus = runtime.bus().makeChannelBus({
                    description: 'Parent comm for The Cell Bus',
                });
                const dom = Dom.make({ node: cell.input[0] }),
                    kbaseNode = dom.createNode(div({ dataSubareaType: 'app-cell-input' }));
                appCellWidget = AppCellWidget.make({
                    bus: cellBus,
                    cell: cell,
                    runtime: runtime,
                    workspaceInfo: workspaceInfo,
                });
                // inserting after, with raw dom, means telling the parent node
                // to insert a node before the node following the one we are
                // referencing. If there is no next sibling, the null value
                // causes insertBefore to actually ... insert at the end!
                kbaseNode.classList.add('hidden');
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

                return appCellWidget
                    .init()
                    .then(() => {
                        return appCellWidget.attach(kbaseNode);
                    })
                    .then(() => {
                        return appCellWidget.start();
                    })
                    .then(() => {
                        return appCellWidget.run({
                            authToken: runtime.authToken(),
                        });
                    })
                    .then(() => {
                        cell.renderMinMax();

                        return {
                            widget: appCellWidget,
                            bus: cellBus,
                        };
                    })
                    .catch((err) => {
                        console.error('ERROR starting app cell', err);
                        return appCellWidget
                            .stop()
                            .then(() => {
                                return appCellWidget.detach();
                            })
                            .catch((err) => {
                                console.log('ERR in ERR', err);
                            })
                            .finally(() => {
                                const ui = UI.make({
                                    node: document.body,
                                });
                                kbaseNode.innerHTML = div(
                                    {
                                        style: {
                                            margin: '10px',
                                        },
                                    },
                                    [
                                        ui.buildPanel({
                                            title: 'Error Starting App Cell',
                                            type: 'danger',
                                            body: ui.buildErrorTabs({
                                                preamble: p(
                                                    b('There was an error starting the app cell.')
                                                ),
                                                error: err,
                                            }),
                                        }),
                                    ]
                                );
                            });
                    });
            });
        }

        /**
         * appSpec = the appSpec structure
         * appTag = a string, one of 'release', 'beta', 'dev'
         * appType = a string, typically 'app', also 'devapp' for spec edit mode.
         */
        function upgradeToAppCell(appSpec, appTag, appType) {
            return Promise.try(() => {
                // Create base app cell

                // TODO: this should capture the entire app spec, so don't need
                // to carry appSpec around.
                spec = Spec.make({
                    appSpec: appSpec,
                });

                const meta = {
                    kbase: {
                        type: appType,
                        attributes: {
                            id: new Uuid(4).format(),
                            status: 'new',
                            created: new Date().toUTCString(),
                        },
                        appCell: {
                            app: {
                                id: appSpec.info.id,
                                gitCommitHash: appSpec.info.git_commit_hash,
                                version: appSpec.info.ver,
                                tag: appTag,
                                // TODO: remove the spec from the cell metadata
                                spec: appSpec,
                            },
                            params: null,
                            output: {
                                byJob: {},
                            },
                        },
                    },
                };
                cell.metadata = meta;

                // Add the params
                utils.setCellMeta(cell, 'kbase.appCell.params', spec.makeDefaultedModel());
                // initializeParams(appSpec);
                // Complete the cell setup.
                return setupCell();
            }).then((cellStuff) => {
                // Initialize the cell to its default state.
                // cellStuff.bus.emit('reset-to-defaults');
            });
        }

        return Object.freeze({
            // initializeParams: initializeParams,
            setupCell: setupCell,
            upgradeToAppCell: upgradeToAppCell,
        });
    }

    return {
        make: function (config) {
            return factory(config);
        },
        isAppCell: isAppCell,
    };
});
