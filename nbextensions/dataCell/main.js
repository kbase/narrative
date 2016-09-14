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
    'common/ui',
    'kb_common/html',
    './widgets/dataCell'
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
    html,
    DataCell
    ) {
    'use strict';

    var t = html.tag, div = t('div');
    
    function specializeCell(cell) {
        cell.minimize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.dataCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.addClass('hidden');
            }
            outputArea.addClass('hidden');
        };

        cell.maximize = function () {
            var inputArea = this.input.find('.input_area'),
                outputArea = this.element.find('.output_wrapper'),
                showCode = utils.getCellMeta(cell, 'kbase.dataCell.user-settings.showCodeInputArea');

            if (showCode) {
                inputArea.removeClass('hidden');
            }
            outputArea.removeClass('hidden');
        };
        
        /*
         * The data cell icon is derived by looking up the type in the 
         * narrative configuration.
         */
        cell.renderIcon = function () {
            var inputPrompt = this.element[0].querySelector('[data-element="icon"]'),
                type = Props.getDataItem(cell.metadata, 'kbase.dataCell.objectInfo.type');
            
            if (inputPrompt) {
                inputPrompt.innerHTML = div({
                    style: {textAlign: 'center'}
                }, [
                    AppUtils.makeTypeIcon(type)
                ]);
            }
        };
        cell.getIcon = function () {
            var type = Props.getDataItem(cell.metadata, 'kbase.dataCell.objectInfo.type'), 
                icon = AppUtils.makeToolbarTypeIcon(type);
            return icon;
        };
        cell.hidePrompts = function () {
            // Hide the code input area.
            this.input.find('.input_area').addClass('hidden');
            utils.setCellMeta(this, 'kbase.dataCell.user-settings.showCodeInputArea', false);

            // And add our own!
            var prompt = document.createElement('div');
            prompt.innerHTML = div({dataElement: 'icon', class: 'prompt'});
            cell.input.find('.input_prompt').after($(prompt));


            // Hide the prompt...
            this.input.find('.input_prompt').hide();
            utils.horribleHackToHideElement(this, '.output_prompt', 10);
        };
        cell.toggleCodeInputArea = function() {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                codeInputArea.classList.toggle('hidden');
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
        cell.kbase = {
        };

        // Update metadata.
        utils.setMeta(cell, 'attributes', 'lastLoaded', (new Date()).toUTCString());
        
        // Create our own input area for interaction with the user.
        var cellInputNode = cell.input[0],
            kbaseNode,
            ui = UI.make({node: cellInputNode});
        
        kbaseNode = ui.createNode(div({
            dataSubareaType: 'data-cell-input'
        }));
        
        cellInputNode.appendChild(kbaseNode);
        
        var dataCell = DataCell.make({
            cell: cell
        });
        dataCell.bus.emit('run', {
            node: kbaseNode
        });
        
        // The output cell just needs to inhibit the input area.
        // The input code and associated output (a widget) is already
        // to be found in this cell (during insertion).

        cell.hidePrompts();
        cell.renderMinMax();
        cell.renderIcon();
    }

    function upgradeCell(data) {
        return Promise.try(function () {
            var cell = data.cell,
                meta = cell.metadata,
                outputCode, parentTitle,
                cellId = data.kbase.cellId || (new Uuid(4).format());

            // Set the initial metadata for the output cell.
            meta.kbase = {
                type: 'data',
                attributes: {
                    id: cellId,
                    status: 'new',
                    created: new Date().toGMTString(),
                    lastLoaded: new Date().toGMTString(),
                    icon: 'database',
                    title: 'Data Cell'
                },
                dataCell: {
                    objectInfo: data.objectInfo,
                    widget: data.kbase.widget
                }
            };
            cell.metadata = meta;

            // We just need to generate, set, and execute the output
            // the first time (for now).

            var cellText = PythonInterop.buildDataWidgetRunner('kbaseNarrativeDataCell', cellId, data.objectInfo);

            cell.set_text(cellText);
            cell.execute();

            // all we do for now is set up the input area
            cell.input.find('.input_area').addClass('hidden');
            utils.setCellMeta(cell, 'kbase.dataCell.user-settings.showCodeInputArea', false);

            // Get the title of the app which generated this output...
            parentTitle = cellUtils.getTitle(Props.getDataItem(cell.metadata, 'kbase.dataCell.parentCellId'));
            if (parentTitle) {
                Props.setDataItem(cell.metadata, 'kbase.attributes.title', data.objectInfo.name);
            }

            setupCell(cell);
        });
    }

    function load() {
        $([Jupyter.events]).on('inserted.Cell', function (event, data) {
            if (data.kbase && data.kbase.type === 'data') {
                upgradeCell(data)
                    .catch(function (err) {
                        console.error('ERROR creating cell', err);
                        // delete cell.
                        $(document).trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(data.cell));
                        alert('Could not insert cell due to errors.\n' + err.message);
                    });
            }
        });

        Jupyter.notebook.get_cells().forEach(function (cell) {
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
}, function (err) {
    'use strict';
    console.log('ERROR loading viewCell main', err);
});
