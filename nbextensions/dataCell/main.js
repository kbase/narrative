define([
    'bluebird',
    'jquery',
    'uuid',
    'base/js/namespace',
    'common/utils',
    'common/appUtils',
    'common/props',
    'common/cellUtils',
    'common/pythonInterop',
    'common/ui',
    'common/jupyter',
    'kb_common/html',
    './widgets/dataCell',
    'custom/custom',
], (
    Promise,
    $,
    Uuid,
    Jupyter,
    utils,
    AppUtils,
    Props,
    cellUtils,
    PythonInterop,
    UI,
    jupyter,
    html,
    DataCell
) => {
    'use strict';

    const t = html.tag,
        div = t('div');

    function specializeCell(cell) {
        cell.minimize = function () {
            const inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(
                    cell,
                    'kbase.dataCell.user-settings.showCodeInputArea'
                );

            if (showCode) {
                inputArea.classList.remove('-show');
            }
            outputArea.addClass('hidden');
        };

        cell.maximize = function () {
            const inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(
                    cell,
                    'kbase.dataCell.user-settings.showCodeInputArea'
                );

            if (showCode) {
                if (!inputArea.classList.contains('-show')) {
                    inputArea.classList.add('-show');
                    cell.code_mirror.refresh();
                }
            }
            outputArea.removeClass('hidden');
        };

        /*
         * The data cell icon is derived by looking up the type in the
         * narrative configuration.
         */
        cell.renderIcon = function () {
            const inputPrompt = this.element[0].querySelector('[data-element="icon"]'),
                type = Props.getDataItem(cell.metadata, 'kbase.dataCell.objectInfo.type');

            if (inputPrompt) {
                inputPrompt.innerHTML = div(
                    {
                        style: { textAlign: 'center' },
                    },
                    [AppUtils.makeTypeIcon(type)]
                );
            }
        };

        cell.getIcon = function () {
            const type = Props.getDataItem(cell.metadata, 'kbase.dataCell.objectInfo.type'),
                icon = AppUtils.makeToolbarTypeIcon(type);
            return icon;
        };

        cell.toggleCodeInputArea = function () {
            const codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                codeInputArea.classList.toggle('-show');
                utils.setCellMeta(
                    cell,
                    'kbase.dataCell.user-settings.showCodeInputArea',
                    this.isCodeShowing(),
                    true
                );
                // NB purely for side effect - toolbar refresh
                cell.metadata = cell.metadata;
            }
        };
    }

    function setupCell(cell) {
        if (cell.cell_type !== 'code') {
            return;
        }
        if (!cell.metadata.kbase) {
            return;
        }
        if (cell.metadata.kbase.type !== 'data') {
            return;
        }

        specializeCell(cell);

        // The kbase property is only used for managing runtime state of the cell
        // for kbase. Anything to be persistent should be on the metadata.
        cell.kbase = {};

        // Update metadata.
        utils.setMeta(cell, 'attributes', 'lastLoaded', new Date().toUTCString());

        // Ensure code showing is closed to start with.
        // Disable this line to allow this setting to be sticky.
        utils.setCellMeta(cell, 'kbase.dataCell.user-settings.showCodeInputArea', false);

        // Create our own input area for interaction with the user.
        let cellInputNode = cell.input[0],
            kbaseNode,
            ui = UI.make({ node: cellInputNode });

        kbaseNode = ui.createNode(
            div({
                dataSubareaType: 'data-cell-input',
            })
        );

        cellInputNode.appendChild(kbaseNode);

        const dataCell = DataCell.make({
            cell: cell,
        });
        dataCell.bus.emit('run', {
            node: kbaseNode,
        });

        // The output cell just needs to inhibit the input area.
        // The input code and associated output (a widget) is already
        // to be found in this cell (during insertion).

        jupyter.disableKeyListenersForCell(cell);
        cell.renderMinMax();
        cell.renderIcon();
    }

    function upgradeCell(cell, setupData) {
        return Promise.try(() => {
            const meta = cell.metadata,
                cellId = setupData.cellId || new Uuid(4).format();

            // Set the initial metadata for the output cell.
            meta.kbase = {
                type: 'data',
                attributes: {
                    id: cellId,
                    status: 'new',
                    created: new Date().toGMTString(),
                    lastLoaded: new Date().toGMTString(),
                    icon: 'database',
                    title: 'Data Cell',
                },
                dataCell: {
                    objectInfo: setupData.objectInfo,
                    widget: setupData.widget,
                },
            };
            cell.metadata = meta;

            // We just need to generate, set, and execute the output
            // the first time (for now).

            let tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
            if (!tag) {
                tag = 'release';
            }
            const objInfo = setupData.objectInfo;
            let ref = objInfo.ref_path;
            const wsId = objInfo.ws_id || objInfo.wsid;
            if (!ref) {
                ref = wsId + '/' + objInfo.id + '/' + objInfo.version;
            }
            const title = objInfo && objInfo.name ? objInfo.name : 'Data Viewer';
            const cellText = PythonInterop.buildDataWidgetRunner(ref, cellId, title, tag);

            cell.set_text(cellText);
            cell.execute();

            // all we do for now is set up the input area
            utils.setCellMeta(cell, 'kbase.dataCell.user-settings.showCodeInputArea', false);

            utils.setCellMeta(cell, 'kbase.attributes.title', setupData.objectInfo.name);
            const subtitle =
                'v' + String(setupData.objectInfo.version) + ' - ' + setupData.objectInfo.type;
            utils.setCellMeta(cell, 'kbase.attributes.subtitle', subtitle, true);

            setupCell(cell);
        });
    }

    function initializeExtension() {
        $([Jupyter.events]).on('insertedAtIndex.Cell', (event, payload) => {
            const cell = payload.cell;
            const setupData = payload.data;
            const jupyterCellType = payload.type;

            if (jupyterCellType === 'code' && setupData && setupData.type === 'data') {
                upgradeCell(cell, setupData).catch((err) => {
                    console.error('ERROR creating cell', err);
                    // delete cell.
                    $(document).trigger(
                        'deleteCell.Narrative',
                        Jupyter.notebook.find_cell_index(cell)
                    );
                    // TODO: better error handling - a cell failing to insert is a major error.
                    alert('Could not insert cell due to errors.\n' + err.message);
                });
            }
        });

        Jupyter.notebook.get_cells().forEach((cell) => {
            try {
                setupCell(cell);
            } catch (ex) {
                console.error('ERROR setting up output cell', ex);
            }
        });
    }

    function load() {
        /* Only initialize after the notebook is fully loaded. */
        if (Jupyter.notebook._fully_loaded) {
            initializeExtension();
        } else {
            $([Jupyter.events]).one('notebook_loaded.Notebook', () => {
                initializeExtension();
            });
        }
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load,
    };
}, (err) => {
    'use strict';
    // NB we should probably not be handling individual loading errors. If the
    // data cell couldn't load it is not recoverable -- the user should either reload the
    // narrative or the system is broken. This handling in particular will just hide the error.
    console.error('ERROR loading dataCell main', err);
});
