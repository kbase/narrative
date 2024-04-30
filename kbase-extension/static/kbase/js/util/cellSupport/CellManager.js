/**
 * A class for managing the interface between a Cell and Jupyter.
 *
 * Note that all values must be serializable as JSON.
 *
 * @typedef {Object} KBaseCellAttributes
 * @property {string} id A unique, persistent identifier for
 * the cell
 * @property {string} title The title to be displayed for the
 * cell in the cell's header area
 * @property {string} subtitle The subtitle to be displayed
 * for the cell in the cell's header area
 * @property {object} icon An icon specification object which
 * will be interpreted by the `getIconForCell` method of the cell (in CellBase)
 * @property {string} created A timestamp recording the moment the cell was created,
 * stored in ISO8601 format.
 */

/**
 * @param {Object} KBaseCellSetupData An object which provides information to create a
 * cell of the type this manager is designed to handle. The detailed
 * specification of this object depends on the KBase cell type.
 * @property {string} type The KBase cell type, which will be defined as
 * as a notebook extension in `nbextensions/TYPE`.
 * @property {KBaseCellAttributes} attributes Common KBase cell attributes; these are
 * the same across all KBase cell types
 * @property {object} custom State data which is specific
 */

/**
 * @typedef {Object} NotebookCell The native notebook cell object.
 */

define(['jquery', 'common/jupyter', 'base/js/namespace', 'common/ui'], (
    $,
    notebook,
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

        /**
         * Determines whether the given Notebook cell is compatible with the KBase cell
         * type for which this manager was created.
         *
         * @param {NotebookCell} cell A Jupyter Notebook cell object
         * @returns {boolean} `true` if the cell is compatible, `false` otherwise
         */
        isType(cell) {
            // We only handle cells of the type set for this CellManager object.
            return (
                cell.cell_type === 'code' &&
                !!cell.metadata.kbase &&
                cell.metadata.kbase.type === this.type
            );
        }

        /**
         * Creates an instance of the cell class this manager is dedicated to.
         *
         * @param {NotebookCell} cell A Jupyter Notebook cell object
         * @returns {void} nothing
         */
        createCellInstance(cell) {
            return new this.instanceClass({
                cell,
                name: this.name,
                type: this.type,
                icon: this.icon,
            });
        }

        /**
         * Responsible for getting the given existing cell into a proper running state.
         *
         * @param {NotebookCell} cell A Jupyter Notebook cell object
         * @returns {void} nothing
         */
        reviveCell(cell) {
            const instance = this.createCellInstance(cell);
            instance.setupCell();
            instance.start();
        }

        /**
         * Responsible for getting the give newly inserted cell into a proper running
         * state, and configured for persistence of it's state so that it may be revived
         * when the Narrative is reopened at a later time.
         *
         * @param {NotebookCell} cell A Jupyter Notebook cell object
         * @param {KBaseCellSetupData} setupData An object which provides information to create a
         * cell of the type this manager is designed to handle. The detailed
         * specification of this object depends on the KBase cell type.
         *
         * @returns {void} nothing
         */
        initializeCell(cell, setupData) {
            const instance = this.createCellInstance(cell);
            instance.upgradeCell(setupData);
            instance.setupCell();
            instance.injectPython();
            instance.start();
            instance.runPython();
        }

        /**
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
         *
         * @returns {void} nothing
         */
        initializeExtension() {
            // Sets up all existing instances of cells of type `this.type`.
            // Assumes that the notebook is in its initial state.
            // Note that cell setup c
            for (const cell of notebook.getCells()) {
                if (this.isType(cell)) {
                    try {
                        this.reviveCell(cell);
                    } catch (ex) {
                        console.error('DBG: ERROR reviving cell', ex);
                    }
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
    }

    return CellManager;
});
