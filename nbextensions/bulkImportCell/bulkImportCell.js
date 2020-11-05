define([
    'uuid',
    'common/appUtils',
    'common/utils',
    'common/runtime',
    'common/busEventManager',
    'base/js/namespace'
], (
    Uuid,
    AppUtils,
    Utils,
    Runtime,
    BusEventManager,
    Jupyter
) => {
    'use strict';
    const CELL_TYPE = 'app-bulk-import';

    class BulkImportCell {
        constructor(cell, initialize) {
            if (cell.cell_type !== 'code') {
                throw new Error('Can only create Bulk Import Cells out of code cells!');
            }
            this.cell = cell;
            this.kbaseNode = null;
            this.runtime = Runtime.make();
            this.busEventManager = BusEventManager.make({
                bus: this.runtime.bus()
            });
            if (initialize) {
                this.initialize();
            }
            this.setupCell();
        }

        /**
         * This should only be called after a Bulk Import cell is initialized structurally -
         * i.e. if a new one is created, or if a page is loaded that already has one.
         */
        setupCell() {
            if (!BulkImportCell.isBulkImportCell(this.cell)) {
                throw new Error('Can only set up real bulk import cells');
            }

            this.cell.getIcon = function() {
                return AppUtils.makeGenericIcon('upload', '#bf6c97');
            };

            this.cell.renderIcon = function() {
                const iconNode = this.element[0].querySelector('.celltoolbar [data-element="icon"]');
                if (iconNode) {
                    iconNode.innerHTML = this.getIcon();
                }
            };

            this.cellBus = this.runtime.bus().makeChannelBus({
                name: {
                    cell: Utils.getMeta(this.cell, 'attributes', 'id')
                },
                description: 'parent bus for BulkImportCell'
            });
            this.busEventManager.add(this.cellBus.on('delete-cell', () => this.deleteCell()));

            this.kbaseNode = document.createElement('div');
            // inserting after, with raw dom, means telling the parent node
            // to insert a node before the node following the one we are
            // referencing. If there is no next sibling, the null value
            // causes insertBefore to actually ... insert at the end!
            this.cell.input[0].parentNode.insertBefore(this.kbaseNode, this.cell.input[0].nextSibling);
            this.kbaseNode.innerHTML = 'I am a bulk import cell!';

            let meta = this.cell.metadata;
            meta.kbase.attributes.lastLoaded = new Date().toUTCString();

            this.cell.renderMinMax();
            // force toolbar rerender.
            this.cell.metadata = meta;
        }

        /**
         * Deletes the cell from the notebook after doing internal cleanup.
         */
        deleteCell() {
            this.busEventManager.removeAll();
            const cellIndex = Jupyter.notebook.find_cell_index(this.cell);
            Jupyter.notebook.delete_cell(cellIndex);
        }

        /**
         * Does the initial pass on newly created cells to initialize its metadata and get it
         * set up for a new life as a Bulk Import Cell.
         */
        initialize() {
            const meta = {
                kbase: {
                    attributes: {
                        id: new Uuid(4).format(),
                        status: 'new',
                        created: (new Date()).toUTCString(),
                        title: 'Import from Staging Area',
                        subtitle: 'Import files into your Narrative as data objects'
                    },
                    type: CELL_TYPE,
                    bulkImportCell: {
                        'user-settings': {
                            showCodeInputArea: false
                        }
                    }
                }
            };
            this.cell.metadata = meta;
        }

        /**
         * Returns true if the given cell should be treated as a bulk import cell
         * @param {Cell} cell - a Jupyter Notebook cell
         */
        static isBulkImportCell(cell) {
            if (cell.cell_type !== 'code' || !cell.metadata.kbase) {
                return false;
            }
            return cell.metadata.kbase.type === CELL_TYPE;
        }

    }

    return BulkImportCell;
});
