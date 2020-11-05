define([
    'uuid',
    'common/appUtils',
    'common/utils',
    'common/dom',
    'common/html',
    'common/runtime',
    'common/busEventManager',
    'base/js/namespace'
], (
    Uuid,
    AppUtils,
    Utils,
    Dom,
    Html,
    Runtime,
    BusEventManager,
    Jupyter
) => {
    'use strict';
    const CELL_TYPE = 'app-bulk-import';
    const t = Html.tag,
        div = t('div');

    class BulkImportCell {
        constructor(cell) {
            this.cell = cell;
            this.kbaseNode = null;
            this.runtime = Runtime.make();
            this.busEventManager = BusEventManager.make({
                bus: this.runtime.bus()
            });
        }

        /**
         * This should only be called after a Bulk Import cell is initialized structurally -
         * i.e. if a new one is created, or if a page is loaded that already has one.
         */
        setupCell() {
            if (!BulkImportCell.isBulkImportCell(this.cell)) {
                return;
            }

            this.cell.getIcon = function() {
                return AppUtils.makeGenericIcon('upload', 'purple');
            };

            this.cell.renderIcon = function() {
                const iconNode = this.element[0].querySelector('.celltoolbar [data-element="icon"]');
                if (iconNode) {
                    iconNode.innerHTML = AppUtils.makeGenericIcon('upload', 'purple');
                }
            };

            this.cellBus = this.runtime.bus().makeChannelBus({
                name: {
                    cell: Utils.getMeta(this.cell, 'attributes', 'id')
                },
                description: 'parent bus for BulkImportCell'
            });
            this.busEventManager.add(this.cellBus.on('delete-cell', () => this.deleteCell()));

            Utils.setCellMeta(this.cell, 'kbase.attributes.lastLoaded', (new Date()).toUTCString());

            const dom = Dom.make({ node: this.cell.input[0] });
            this.kbaseNode = dom.createNode(div({ dataSubareaType: 'app-cell-input' }));
            // inserting after, with raw dom, means telling the parent node
            // to insert a node before the node following the one we are
            // referencing. If there is no next sibling, the null value
            // causes insertBefore to actually ... insert at the end!
            this.cell.input[0].parentNode.insertBefore(this.kbaseNode, this.cell.input[0].nextSibling);
            this.kbaseNode.innerHTML = 'I am a bulk import cell!';

            Utils.setCellMeta(this.cell, 'kbase.bulkImportCell.user-settings.showCodeInputArea', false);
            this.cell.renderMinMax();
            // force toolbar rerender.
            this.cell.metadata = this.cell.metadata;

        }

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
                        title: 'Bulk Import',
                        subtitle: 'For importing. In bulk.'
                    },
                    type: CELL_TYPE
                }
            };
            this.cell.metadata = meta;
            return this.setupCell();
        }

        /**
         *
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
