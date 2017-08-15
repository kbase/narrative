/*global define*/
/*jslint white:true,browser:true*/
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
    'common/jupyter',
    'kb_common/html',
    'util/string',
    './widgets/outputCell'
], function(
    Promise,
    $,
    Uuid,
    Jupyter,
    utils,
    AppUtils,
    Props,
    cellUtils,
    PythonInterop,
    jupyter,
    html,
    StringUtil,
    OutputCell
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function specializeCell(cell) {
        cell.minimize = function() {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.classList.remove('-show');
            }
            outputArea.addClass('hidden');
        };

        cell.maximize = function() {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea');

            if (showCode) {
                if (!inputArea.classList.contains('-show')) {
                    inputArea.classList.add('-show');
                    cell.code_mirror.refresh();
                }
            }
            outputArea.removeClass('hidden');
        };

        cell.renderIcon = function() {
            var inputPrompt = this.element[0].querySelector('[data-element="icon"]');

            if (inputPrompt) {
                inputPrompt.innerHTML = div({
                    style: { textAlign: 'center' }
                }, [
                    AppUtils.makeGenericIcon('arrow-left')
                ]);
            }
        };

        cell.getIcon = function() {
            var icon = AppUtils.makeToolbarGenericIcon('arrow-left');
            return icon;
        };

        cell.isCodeShowing = function() {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                return codeInputArea.classList.contains('-show');
            }
            return false;
        };

        cell.toggleCodeInputArea = function() {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                codeInputArea.classList.toggle('-show');
                // NB purely for side effect - toolbar refresh
                utils.setCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea', this.isCodeShowing(), true);
                // console.log('toggled the code input area...', utils.getCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea'));
                // cell.metadata = cell.metadata;
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
        if (cell.metadata.kbase.type !== 'output') {
            return;
        }

        specializeCell(cell);

        // The kbase property is only used for managing runtime state of the cell
        // for kbase. Anything to be persistent should be on the metadata.
        cell.kbase = {};

        // Update metadata.
        utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());

        // Ensure code showing is closed to start with.
        // Disable this line to allow this setting to be sticky.
        utils.setCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea', false);

        var outputCell = OutputCell.make({
            cell: cell
        });
        outputCell.bus.emit('run', {
            node: cell.element
        });

        jupyter.disableKeyListenersForCell(cell);
        cell.renderMinMax();
        cell.renderIcon();
    }

    function upgradeCell(data) {
        return Promise.try(function() {
            var cell = data.cell,
                meta = cell.metadata,
                outputCode, parentTitle,
                cellId = data.kbase.cellId || (new Uuid(4).format());

            // Set the initial metadata for the output cell.
            meta.kbase = {
                type: 'output',
                attributes: {
                    id: cellId,
                    status: 'new',
                    created: new Date().toGMTString(),
                    lastLoaded: new Date().toGMTString(),
                    icon: 'arrow-right',
                    title: 'Output Cell'
                },
                outputCell: {
                    jobId: data.kbase.jobId,
                    parentCellId: data.kbase.parentCellId,
                    widget: data.kbase.widget
                }
            };
            cell.metadata = meta;

            // We just need to generate, set, and execute the output
            // the first time (for now).

            outputCode = PythonInterop.buildOutputRunner(data.kbase.widget.name, data.kbase.widget.tag, cellId, data.kbase.widget.params);
            cell.set_text(outputCode);
            cell.execute();

            // all we do for now is set up the input area
            cell.input.find('.input_area').addClass('hidden');
            utils.setCellMeta(cell, 'kbase.outputCell.user-settings.showCodeInputArea', false);

            // Get the title of the app which generated this output...
            parentTitle = cellUtils.getTitle(Props.getDataItem(cell.metadata, 'kbase.outputCell.parentCellId'));
            if (parentTitle) {
                Props.setDataItem(cell.metadata, 'kbase.attributes.title', 'Output from ' + parentTitle);
            }

            setupCell(cell);
        });
    }

    function load() {
        $([Jupyter.events]).on('inserted.Cell', function(event, data) {
            if (data.kbase && data.kbase.type === 'output') {
                upgradeCell(data)
                    .catch(function(err) {
                        console.error('ERROR creating cell', err);
                        // delete cell.
                        $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(data.cell));
                        alert('Could not insert cell due to errors.\n' + err.message);
                    });
            }
        });

        Jupyter.notebook.get_cells().forEach(function(cell) {
            try {
                setupCell(cell);
            } catch (ex) {
                console.error('ERROR setting up output cell', ex);
            }
        });
    }

    return {
        // This is the sole ipython/jupyter api call
        load_ipython_extension: load
    };
}, function(err) {
    console.error('ERROR loading outputCell main', err);
});