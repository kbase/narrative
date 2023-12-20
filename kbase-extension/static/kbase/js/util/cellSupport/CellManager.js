define([
    'jquery',
    'uuid',
    'common/html',
    'common/jupyter',
    'common/cellUtils',
    'base/js/namespace',
    'common/ui'
], (
    $,
    Uuid,
    html,
    notebook, // {getCells, disableKeyListenersForCell},
    {getCellMeta, setCellMeta},
    Jupyter,
    UI
) => {
    const span = html.tag('span'); 

    /**
     * Base class for all cell implementations which use a cell manager.
     * 
     * A cell manager is essentially an object which deals with the notebook
     * and notebook lifecycle, notebook extension api, and
     */

    class CellManager {
        constructor({type, icon, title, className, name, instanceClass}) {
            this.type = type; 
            this.icon = icon;
            this.title = title;
            this.className = className;
            this.workspaceInfo = null;
            this.name = name;
            this.instanceClass = instanceClass;
        }

        // async setupWorkspace(workspaceUrl) {
        //     if (this.workspaceInfo) {
        //         return;
        //     }
        //     const workspaceRef = { id: this.runtime.workspaceId() };
        //     const workspace = new Workspace(workspaceUrl, {
        //         token: this.runtime.authToken(),
        //     });

        //     const info = await workspace.get_workspace_info(workspaceRef);
        //     this.workspaceInfo = workspaceInfoToObject(info);
        // }

        /**
         * Add additional methods to the cell that are utilized by our ui.
         * 
         * This includes minimizing and maximizing the cell, and displaying 
         * a per-type icon.
         * 
         * @param {*} cell 
         */
        augmentCell(cell) {
            /**
             * 
             */
            cell.minimize = function () {
                // Note that the "this" is the cell; thus we must preserve the
                // usage of "function" rather than fat arrow.
                const inputArea = this.input.find('.input_area');
                const outputArea = this.element.find('.output_wrapper');
                const viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]');
                const showCode = getCellMeta(
                    cell,
                    'kbase.serviceWidget.user-settings.showCodeInputArea'
                );

                if (showCode) {
                    inputArea.classList.remove('-show');
                }
                outputArea.addClass('hidden');
                viewInputArea.addClass('hidden');
            };

            /**
             * 
             */
            cell.maximize = function () {
                // Note that the "this" is the cell; thus we must preserve the
                // usage of "function" rather than fat arrow.
                const inputArea = this.input.find('.input_area');
                const outputArea = this.element.find('.output_wrapper');
                const viewInputArea = this.element.find('[data-subarea-type="view-cell-input"]');
                const showCode = getCellMeta(
                    cell,
                    'kbase.viewCell.user-settings.showCodeInputArea'
                );

                if (showCode) {
                    if (!inputArea.classList.contains('-show')) {
                        inputArea.classList.add('-show');
                    }
                }
                outputArea.removeClass('hidden');
                viewInputArea.removeClass('hidden');
            };

            /**
             * 
             * @returns 
             * 
             * Note that the icon must be rendered as text, as that is what kbaseCellToolbarMenu.js expects.
             */
            

            cell.getIcon = () => {
                // Now "this" is the CellManager object, as we ARE using fat arrow.
                const {name, color} = this.icon;
                return span([
                    span(
                        {
                            class: 'fa-stack fa-2x',
                            style: { textAlign: 'center', color },
                        },
                        [
                            span({
                                class: 'fa fa-square fa-stack-2x',
                                style: { color },
                            }),
                            span({ class: `fa fa-inverse fa-stack-1x fa-${name}` })
                        ]
                    ),
                ]);
            };
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

        async startCell(cell) {
            throw new Error('The "startCell" method must be defined by a sub-class');
        }

        // onSetupCell(cell) {
        //     throw new Error('The "onSetupCell" method must be defined by a sub-class');
        // }

        getCellClass(cell) {
            throw new Error('The "getCellClass" method must be defined by a sub-class');
        }

        /**
         * Responsible for setting up cell augmentations required at runtime.
         * 
         * @param {*} cell 
         */
        setupCell(cell) {
            this.augmentCell(cell);

            // Add custom classes to the cell.
            // TODO: this needs to be a generic kbase custom cell class.
            // TODO: remove, not necessary
            // cell.element[0].classList.add('kb-service-widget-cell');

            // The kbase property is used for managing _runtime_ state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            cell.kbase = {};

            // Update metadata.
            // TODO: remove, not necessary.
            // setMeta(cell, 'attributes', 'lastLoaded', new Date().toUTCString());

            // await this.setupWorkspace(this.runtime.config('services.workspace.url'))

            notebook.disableKeyListenersForCell(cell);

            cell.renderMinMax();

            // this.onSetupCell(cell);

            cell.element[0].classList.add(this.getCellClass(cell));

            // force toolbar rerender.
            // eslint-disable-next-line no-self-assign
            cell.metadata = cell.metadata;
        }

        getCellTitle(cell) {
            throw new Error('The "getCellTitle" method must be defined by a subclass');
        }

        /** 
        * Should only be called when a cell is first inserted into a narrative.
        *
        * It creates the correct metadata and then sets up the cell.
        *
        */
        upgradeCell(cell, data) {
            // Create base app cell
            const meta = cell.metadata;
            // TODO: drop? doesn't seem to be used
			const {initialData} = data;
            meta.kbase = {
                type: this.type,
                attributes: {
                    id: new Uuid(4).format(),
                    // title: `FAIR Narrative Description`,
                    title: this.title,
                    created: new Date().toUTCString(),
                    icon: this.icon
                },
                [this.type]: initialData || {}
            };
            cell.metadata = meta;
            // this.onUpgradeCell(cell, data);
            for (const [key, value] of Object.entries(data.metadata)) {
                this.setCellExtensionMetadata(cell, key, value);
            }
            this.setCellMetadata(cell, 'attributes.title', this.getCellTitle(cell), true);
        }

        setCellExtensionMetadata(cell, propPath, value) {
            const path = `kbase.${this.type}.${propPath}`;
            setCellMeta(cell, path, value, true);
        }

        getCellExtensionMetadata(cell, propPath, defaultValue) {
            const path = `kbase.${this.type}.${propPath}`;
            return getCellMeta(cell, path, defaultValue);
        }

        setCellMetadata(cell, propPath, value) {
            const path = `kbase.${propPath}`;
            setCellMeta(cell, path, value, true);
        }

        reviveCell(cell) {
            this.setupCell(cell);
            const instance = new this.instanceClass({
                name: this.name,
                type: this.type,
                cell, 
            });
            // const instance = this.getCellInstance(cell);
            this.startCell(instance);
        }

        initializeCell(cell, setupData) {
            this.upgradeCell(cell, setupData);
            this.setupCell(cell);
            // const instance = this.getCellInstance(cell);

            const instance = new this.instanceClass({
                name: this.name,
                type: this.type,
                cell, 
            });
            this.populateCell(instance);
            this.startCell(instance);
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

                if (
                    setupData &&
                    jupyterCellType === 'code' &&
                    setupData.type === this.type
                ) {
                    try {
                        this.initializeCell(cell, setupData);
                    } catch (ex) {
                        console.error('ERROR creating cell', ex);
                        notebook.deleteCell(cell);
                        const confirmed = await UI.make({node: document.body})
                            .showErrorDialog({ 
                                title: 'Error Deleting Cell', 
                                error: ex
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
