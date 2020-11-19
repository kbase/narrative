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
    './widgets/codeCell',
    'custom/custom'
], function (
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
    CodeCell
) {
    'use strict';

    var t = html.tag,
        span = t('span');

    function specializeCell(cell) {
        cell.minimize = function () {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.codeCell.userSettings.showCodeInputArea');

            if (showCode) {
                inputArea.classList.remove('-show');
            }
            outputArea.addClass('hidden');
        };

        cell.maximize = function () {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.codeCell.userSettings.showCodeInputArea');

            if (showCode) {
                if (!inputArea.classList.contains('-show')) {
                    inputArea.classList.add('-show');
                    cell.code_mirror.refresh();
                }
            }
            outputArea.removeClass('hidden');
        };

        cell.getIcon = function () {
            var iconColor = 'silver';
            var icon;
            icon = span({ class: 'fa fa-inverse fa-stack-1x fa-' + 'terminal' });

            return span({ style: '' }, [
                span({ class: 'fa-stack fa-2x', style: { textAlign: 'center', color: iconColor } }, [
                    span({ class: 'fa fa-square fa-stack-2x', style: { color: iconColor } }),
                    icon
                ])
            ]);
        };

        cell.toggleCodeInputArea = function () {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                codeInputArea.classList.toggle('-show');
                utils.setCellMeta(cell, 'kbase.codeCell.userSettings.showCodeInputArea', this.isCodeShowing(), true);
                // NB purely for side effect - toolbar refresh
                cell.metadata = cell.metadata;
            }
        };
    }

    function setupCell(cell) {
        if (cell.cell_type !== 'code') {
            return;
        }
        if (cell.metadata.kbase && cell.metadata.kbase.type && (cell.metadata.kbase.type !== 'code')) {
            return;
        }

        specializeCell(cell);

        // The kbase property is only used for managing runtime state of the cell
        // for kbase. Anything to be persistent should be on the metadata.
        cell.kbase = {};

        // Code cell input area is always set to be open by default, but users
        // can chose to override this and this choice should be remembered.
        // import/job cells dont' show code input area as regular code cells do.
        if (utils.getCellMeta(cell, 'kbase.codeCell.jobInfo')) {
            utils.setCellMeta(cell, 'kbase.codeCell.userSettings.showCodeInputArea', false);
        }

        var widget = CodeCell.make({
            cell: cell
        });
        widget.bus.emit('run', {
            node: null
        });

        cell.renderMinMax();
        // force toolbar rerender.
        cell.metadata = cell.metadata;
    }

    function fixupCell(cell) {
        if (cell.metadata.kbase && cell.metadata.kbase.type) {
            return;
        }
        return upgradeCell({
            cell: cell,
            kbase: {
                type: 'code',
                language: 'python'
            }
        });
    }

    function upgradeCell(cell, data) {
        data = data || {};
        var meta = cell.metadata || {},
            cellId = data.cellId || (new Uuid(4).format());

        // Accomodate import/job cells.
        // For now we create an import property on the side.
        var jobInfo;
        if (data && data.state) {
            jobInfo = {
                jobId: data.jobId,
                state: data.state
            };
        }

        // Set the initial metadata for the output cell.
        meta.kbase = {
            type: 'code',
            attributes: {
                id: cellId,
                status: 'new',
                created: new Date().toGMTString(),
                lastLoaded: new Date().toGMTString(),
                icon: 'code',
                title: data.title || 'Code Cell',
                subtitle: data.language
            },
            codeCell: {
                userSettings: {
                    showCodeInputArea: true
                }
            }
        };

        if (jobInfo) {
            meta.kbase.codeCell.jobInfo = jobInfo;
        }

        cell.metadata = meta;

        return cell;
    }

    function ensureCodeCell(cell) {
        if (cell.cell_type === 'code') {
            if (cell.metadata.kbase) {
                if (cell.metadata.kbase.type) {
                    if (cell.metadata.kbase.type === 'code') {
                        // fully flocked jupyter/kbase code cell
                        return true;
                    } else {
                        // a typed kbase cell, and not a code cell
                        return false;
                    }
                } else {
                    // a code cell with a kbase property but no type specified
                    // must be a pre-code-cell-extension code cell, which can be
                    // converted.
                    fixupCell(cell);
                    return true;
                }
            } else {
                // a plain code cell with no kbase-stuff is possible, but unlikely, still, convert.
                fixupCell(cell);
                return true;
            }
        } else {
            // not a code cell, sorry.
            return false;
        }
    }

    function initializeExtension() {
        Jupyter.notebook.get_cells().forEach(function (cell) {
            try {
                if (ensureCodeCell(cell)) {
                    setupCell(cell);
                }
            } catch (ex) {
                console.error('ERROR setting up code cell', ex);
            }
        });

        $([Jupyter.events]).on('insertedAtIndex.Cell', function (event, payload) {
            var cell = payload.cell;
            var setupData = payload.data;
            var jupyterCellType = payload.type;
            // var hasKBaseMetadata = payload.cell.metadata && payload.cell.metadata.kbase;
            if (jupyterCellType === 'code' &&
                (!setupData || setupData.type === 'code')) {
                try {
                    upgradeCell(cell, setupData);
                    setupCell(cell);
                } catch (err) {
                    console.error('ERROR creating cell', err);
                    // delete cell.
                    $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(setupData.cell));
                    alert('Could not insert cell due to errors.\n' + err.message);
                }
            }
        });
    }

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
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load
    };
}, function (err) {
    'use strict';
    console.error('ERROR loading codeCell main', err);
});
