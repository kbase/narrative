define(['jquery', 'common/jupyter', 'base/js/namespace', 'common/ui'], (
    $,
    notebook, // {getCells, disableKeyListenersForCell},
    Jupyter,
    UI
) => {
    'use strict';

    /**
     * Base class for all cell implementations which use a cell manager.
     *
     * A cell manager is essentially an object which deals with the notebook
     * and notebook lifecycle, notebook extension api, and
     */

    class CellManager {
        constructor({ type, icon, title, className, name, instanceClass }) {
            this.type = type;
            this.icon = icon;
            this.title = title;
            this.className = className;
            this.workspaceInfo = null;
            this.name = name;
            this.instanceClass = instanceClass;
        }

        isType(cell) {
            // We only handle cells of the type set for this CellManager object.
            if (cell.cell_type !== 'code') {
                return false;
            }
            if (!cell.metadata.kbase) {
                return false;
            }
            if (cell.metadata.kbase.type !== this.type) {
                return false;
            }

            return true;
        }

        reviveCell(cell) {
            const instance = new this.instanceClass({
                name: this.name,
                type: this.type,
                icon: this.icon,
                cell,
            });
            instance.setupCell();
            instance.start();
        }

        initializeCell(cell, setupData) {
            const instance = new this.instanceClass({
                name: this.name,
                type: this.type,
                icon: this.icon,
                cell,
            });
            instance.upgradeCell(setupData);
            instance.setupCell();
            instance.create();
            instance.start();
        }

        /*
         * Called directly by Jupyter during the notebook startup process,
         * after the notebook is loaded and the dom structure is created.
         *
         * The job of this call is to mutate the notebook and cells to suite
         * oneself, set up any services or other things needed for operation of
         * the notebook or cells.
         *
         * The work is carried out asynchronously through an orphan promise.
         *
         * Um, not really.
         *
         * Note that the ipython cell startup show is synchronous, or at least
         * our implementation has synchronous dependencies. Specifically, the cell
         * toolbar (kbaseCellToolbarMenu.js) which is responsible for rendering the
         * cell toolbar presumes that the cells are all set up. In particular, the
         * cell icon must already be configured on the cell. But that is done here,
         * in augmentCell, so must be finished by the time the cell toolbar is
         * rendered.
         * But if we setup cells asynchronously, they will not be set up by the time
         * the cell toolbar is configured. I can only assume that the setup code
         * first runs the extension initialization, and then runs the cell toolbar
         * initialization.
         *
         * But we do have asynchronous dependencies - particularly the runtime -
         * move them out of here?
         */
        initializeExtension() {
            // Sets up all existing instances of cells of type `this.type`.
            // Assumes that the notebook is in its initial state.
            // Note that cell setup c
            for (const cell of notebook.getCells()) {
                if (this.isType(cell)) {
                    this.reviveCell(cell);
                }
            }

            // Handle setting up a newly-inserted cell of this type.
            notebook.onEvent('insertedAtIndex.Cell', async (_event, payload) => {
                const cell = payload.cell;
                const setupData = payload.data;
                const jupyterCellType = payload.type;

                if (setupData && jupyterCellType === 'code' && setupData.type === this.type) {
                    try {
                        this.initializeCell(cell, setupData);
                    } catch (ex) {
                        console.error('ERROR creating cell', ex);
                        notebook.deleteCell(cell);
                        await UI.make({ node: document.body }).showErrorDialog({
                            title: 'Error Deleting Cell',
                            error: ex,
                        });
                    }
                }
            });
        }

        initialize() {
            // TODO: is there a predicate method, rather than using what is presumably
            // a private property like this?
            if (Jupyter.notebook._fully_loaded) {
                // handles case in which it is already loaded by the time
                // nbextensions are loaded
                this.initializeExtension();
            } else {
                // Handles case in which the notebook is not finished loading by the the
                // nbextensions are loaded; the notebook_loaded.Notebook is used to trigger
                // instead.
                $([Jupyter.events]).one('notebook_loaded.Notebook', () => {
                    this.initializeExtension();
                });
            }
        }
    }

    return CellManager;
});
