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

    /**
     * This class creates and manages the bulk import cell. This works with, and wraps around,
     * the Jupyter Cell object.
     */
    class BulkImportCell {
        /**
         * The constructor does the work of initializing the bulk import cell module. It
         * modifies the cell metadata, if the initialize parameter is truthy, and extends the
         * cell object to do things we need it to, like respond to minimization requests and
         * render its icon.
         * @param {Cell} cell a Jupyter notebook cell. This should be a code cell, and will throw
         * an Error if it is not.
         * @param {boolean} initialize if true, this will initialize the bulk import cell
         * structure that gets serialized in the cell metadata. This should ONLY be set true when
         * creating a new bulk import cell, not loading a narrative that already contains one
         */
        constructor(cell, initialize) {
            if (cell.cell_type !== 'code') {
                throw new Error('Can only create Bulk Import Cells out of code cells!');
            }
            this.cell = cell;
            this.kbaseNode = null;  // this is the
            this.runtime = Runtime.make();
            this.cellBus = null;
            this.busEventManager = BusEventManager.make({
                bus: this.runtime.bus()
            });
            if (initialize) {
                this.initialize();
            }
            this.setupCell();
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
         * This specializes this BulkImportCell's existing Jupyter Cell object to have several
         * extra functions that the Narrative can call.
         */
        specializeCell() {
            // returns a DOM node with an icon to be rendered elsewhere
            this.cell.getIcon = function() {
                return AppUtils.makeGenericIcon('upload', '#bf6c97');
            };

            // this renders the cell's icon in its toolbar
            this.cell.renderIcon = function() {
                const iconNode = this.element[0].querySelector('.celltoolbar [data-element="icon"]');
                if (iconNode) {
                    iconNode.innerHTML = this.getIcon();
                }
            };
        }

        /**
         * Initializes the base BulkImportCell's message bus and binds responses to external messages.
         */
        setupMessageBus() {
            this.cellBus = this.runtime.bus().makeChannelBus({
                name: {
                    cell: Utils.getMeta(this.cell, 'attributes', 'id')
                },
                description: 'parent bus for BulkImportCell'
            });
            this.busEventManager.add(this.cellBus.on('delete-cell', () => this.deleteCell()));
        }

        /**
         * Initializes the DOM node (kbaseNode) for rendering.
         */
        setupDomNode() {
            this.kbaseNode = document.createElement('div');
            // inserting after, with raw dom, means telling the parent node
            // to insert a node before the node following the one we are
            // referencing. If there is no next sibling, the null value
            // causes insertBefore to actually ... insert at the end!
            this.cell.input[0].parentNode.insertBefore(this.kbaseNode, this.cell.input[0].nextSibling);
            this.kbaseNode.innerHTML = 'I am a bulk import cell!';
        }

        /**
         * This sets up the bulk import components.
         * This should only be called after a Bulk Import cell is initialized structurally -
         * i.e. if a new one is created, or if a page is loaded that already has one.
         */
        setupCell() {
            if (!BulkImportCell.isBulkImportCell(this.cell)) {
                throw new Error('Can only set up real bulk import cells');
            }

            // set up various cell function extensions
            this.specializeCell();

            // set up the message bus and bind various commands
            this.setupMessageBus();

            this.setupDomNode();

            // finalize by updating the lastLoaded attribute, which triggers a toolbar re-render
            let meta = this.cell.metadata;
            meta.kbase.attributes.lastLoaded = new Date().toUTCString();
            this.cell.metadata = meta;

            this.render();
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
         * Renders the view.
         */
        render() {
            this.kbaseNode.innerHTML = 'I am a bulk import cell!';
        }

    }

    return BulkImportCell;
});
