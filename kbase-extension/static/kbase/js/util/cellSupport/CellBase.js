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
 * @typedef {Object} KBaseCellSetupData An object which provides information to create a
 * cell of the type this manager is designed to handle. The detailed
 * specification of this object depends on the KBase cell type.
 * @property {string} type The KBase cell type, which will be defined as
 * as a notebook extension in `nbextensions/TYPE`.
 * @property {KBaseCellAttributes} attributes Common KBase cell attributes; these are
 * the same across all KBase cell types and are expected by cell management and
 * integration code.
 * @property {object} params Parameters for the kbase cell implementation; this is
 * essentially all the information that will be passed to the kbase cell itself.
 */

/**
 * @typedef {Object} KBaseCellIconSpec An object which provides a specification for an
 * icon to be displayed in the cell header.
 * @property {string} type The type of cell; supported types are `'generic'`,
 * `'appoutput'`, and `'data'`
 * @property {object} params Paramaters required to construct an icon of the given type;
 * see `getIconForCell` for details
 */

define([
    'uuid',
    'common/runtime',
    'common/ui',
    'common/props',
    'common/jupyter',
    'common/html',
    'common/cellUtils',
    'util/icon',
], (Uuid, runtime, UI, Props, jupyter, html, cellUtils, icon) => {
    'use strict';

    const { tag } = html;
    const div = tag('div');
    const p = tag('p');

    // This business because we cannot destructure in the parameters with 'use strict',
    // yet we can't get rid of use strict due to the linting configuration.
    const { getCells, deleteCell, disableKeyListenersForCell } = jupyter;
    const { getCellMeta, setCellMeta, renderCellToolbar } = cellUtils;
    const { makeAppOutputIcon, makeDataIcon, makeGenericIcon } = icon;

    /**
     * The Cell class serves as the base class for Narrative cells.
     *
     * All subclasses must define `generatePython`
     *
     * In addition, the `deleteMessage` method may be overridden to provide a more
     * appropriate confirmation warning when deleting a cell.
     *
     * @param {object} constructor_params The required and optional constructor
     * parameters, wrapped into an object so that they may be named.
     * @param {Cell} constructor_params.cell The Notebook cell for which this Cell is responsible.
     * @param {string} constructor_params.type The KBase cell type, such as
     * "serviceWidget"; each cell type must be implemented as an nbextension
     * @param {string} constructor_params.name A name for the cell type, meant to be
     * displayed to humans
     * @param {icon}
     */
    class CellBase {
        constructor({ cell, type, name, icon }) {
            // Initialize properties from constructor
            if (typeof cell === 'undefined') {
                throw new Error('The "cell" parameter must be supplied');
            }
            this.cell = cell;

            if (typeof type === 'undefined') {
                throw new Error('The "type" parameter must be supplied');
            }
            this.type = type;

            if (typeof name === 'undefined') {
                throw new Error('The "name" parameter must be supplied');
            }
            this.name = name;

            if (typeof icon === 'undefined') {
                throw new Error('The "icon" parameter must be supplied');
            }
            this.icon = icon;
        }

        // Abstract methods

        /**
         * Generates a python string to be inserted into the code input area when the
         * cell is created.
         *
         * @abstract
         * @returns {string} A snippet of Python code in text form.
         */
        generatePython() {
            throw new Error('The "generatePython" method must be redefined by a sub-class');
        }

        /**
         * Returns a class string which will be placed on the top level cell; typically
         * used to add custom behavior to the cell.
         *
         * @abstract
         * @returns {string} The class string that should be added to the top level cell element
         */
        getCellClass() {
            throw new Error('The "getCellClass" method must be defined by a sub-class');
        }

        // "Soft abstract" methods
        // May be overrident, but otherwise are essentially noops.

        /**
         * Called during the start lifecycle method, this optional method provides an
         * opportunity for the cell implementation subclass to perform any actions when
         * the cell is loaded and activated.
         *
         * @returns {void} nothing
         */
        onStart() {
            return;
        }

        /**
         * Called during the stop lifecycle method, this optional method provides an
         * opportunity for the cell implementation subclass to perform any actions when
         * the cell is being unloaded (deleted).
         *
         * @returns {void} nothing
         */
        onStop() {
            return;
        }

        // Concrete methods

        /**
         * This method establishes a channel on the main communication bus, with a name
         * set to the structure `{cell: CELL_ID}`, where `CELL_ID` is the unique uuid
         * created for this cell.
         *
         * Generally this allows messages to be targeted at this cell from disparate
         * hinterlands of the Narrative.
         *
         * @returns {void}
         */
        createCellChannel() {
            return runtime
                .make()
                .bus()
                .makeChannelBus({
                    name: {
                        cell: Props.getDataItem(this.cell.metadata, 'kbase.attributes.id'),
                    },
                    description: `A ${this.name} channel`,
                });
        }

        /**
         * The reverse of the above. Removes the cell's channel from the runtime bus.
         * There is no need to remove listeners from the channel, as they are removed
         * along with the channel.
         *
         * @returns {void}
         */
        deleteCellChannel() {
            this.cellBus.stop();
        }

        /**
         * Causes the cell's toolbar to be re-rendered, reflecting the state of the cell.
         *
         * It is "debounced" so it is okay to call it repeatedly without worrying much
         * about spamming the cell toolbar.
         *
         */
        renderCellToolbar() {
            renderCellToolbar(this.cell);
        }

        /**
         * Inspects all of the cells of the notebook , returning the cell which matches
         * the id
         *
         * @returns {object} The Notbook cell associated with the cell object
         */
        findCell() {
            const found = getCells().filter((cell) => {
                return cell.metadata.kbase.attributes.id === this.cell.metadata.kbase.attributes.id;
            });

            if (found.length === 0) {
                throw new Error('The cell could not be found');
            }

            if (found.length > 1) {
                throw new Error('Too many cells found');
            }

            return found[0];
        }

        /**
         * Creates a message to be displayed in the confirmation dialog displayed after
         * a user has used the UI to delete the cell
         *
         * @returns {string} An html string
         */
        deleteMessage() {
            return div([
                p(['Deleting this cell will remove the code and any generated code output.']),
                p(`Continue to delete this ${this.name}?`),
            ]);
        }

        /**
         * Called after the user has used the delete button.
         *
         * Requires confirmation before the cell is actually deleted.
         *
         * @returns {void}
         */
        async doDeleteCell() {
            const confirmed = await UI.make({ node: document.body }).showConfirmDialog({
                title: 'Confirm Cell Deletion',
                body: this.deleteMessage(),
            });

            if (!confirmed) {
                return;
            }

            this.stop();

            deleteCell(this.cell);
        }

        /**
         * Convenience function to get a property from the `params` part of the kbase
         * cell metadata.
         *
         * The property path is `metadata.kbase.params`;
         *
         * @public
         *
         * @param {string} propPath The property name, or dot-separated path, from which
         * to extract the value.
         * @param {unknown} defaultValue A value to return if the property does not
         * exist; defaults to `unknown`.
         * @returns
         */
        getParams(propPath, defaultValue) {
            const path = ['kbase', 'params'];
            if (propPath) {
                path.push(propPath);
            }
            return getCellMeta(this.cell, path.join('.'), defaultValue);
        }

        /**
         * Set a JSON-compatible on a given property path within `metadata.kbase`.
         *
         * Will create objects with corresponding properties, if need be.
         *
         * @public
         *
         * @param {string} propPath The property name, or dot-separated path, at which
         * the value should be available.
         * @param {unknown} value Any JSON-serializable value to set for the property.
         */
        setMetadata(propPath, value) {
            const path = `kbase.${propPath}`;
            setCellMeta(this.cell, path, value);
        }

        /**
         * Convenience function to get a property from the kbase cell metadata.
         *
         * The property path is `metadata.kbase`;
         *
         * @param {string} propPath The property name, or dot-separated path, from which
         * to extract the value.
         * @param {unknown} defaultValue A value to return if the property does not
         * exist; defaults to `unknown`.
         * @returns {unknown}
         */
        getMetadata(propPath, defaultValue) {
            const path = ['kbase'];
            if (propPath) {
                path.push(propPath);
            }
            return getCellMeta(this.cell, path.join('.'), defaultValue);
        }

        /**
         * Set a JSON-compatible on a given property path within the common cell state,
         * `metadata.kbase.cellState`.
         *
         * Will create objects with corresponding properties, if need be.
         *
         * Will trigger a cell toolbar re-render.
         *
         * @public
         *
         * @param {string} propPath The property name, or dot-separated path, at which
         * the value should be available.
         * @param {unknown} value Any JSON-serializable value to set for the property.
         */
        setCellState(propPath, value) {
            const path = ['kbase', 'cellState'];
            if (propPath) {
                path.push(propPath);
            }
            setCellMeta(this.cell, path.join('.'), value);
            this.renderCellToolbar();
        }

        /**
         * Convenience function to get a property from the common cell state, located at
         * `metadata.kbase.cellState`
         *
         * The property path is `metadata.kbase`
         *
         * @public
         *
         * @param {string} propPath The property name, or dot-separated path, from which
         * to extract the value.
         * @param {unknown} defaultValue A value to return if the property does not
         * exist; defaults to `unknown`.
         * @returns {unknown} The requested value, or the default value if not found
         */
        getCellState(propPath, defaultValue) {
            const path = ['kbase', 'cellState'];
            if (propPath) {
                path.push(propPath);
            }
            return getCellMeta(this.cell, path.join('.'), defaultValue);
        }

        /**
         * Sets the code for the cell from the results of `generatePython()`
         *
         * @private
         *
         * @returns {void} nothing
         *
         */
        injectPython() {
            this.cell.set_text(this.generatePython());
        }

        /**
         * Requests that Jupyter run the code found in this cell.
         *
         * In the context of the cell lifecycle, the cell will come to life when the
         * code executes, inserts the widget javascript.
         *
         * @private
         *
         * @returns {void} nothing
         */
        runPython() {
            // It is asynchronous, but we don't know when it completes.
            this.cell.execute();
        }

        /**
         * Should only be called when a cell is first inserted into a narrative.
         *
         * It creates the correct metadata and then sets up the cell.
         *
         * @public
         *
         * @param {KBaseCellSetupData} setupData An object which provides information to create a
         * cell of the type this manager is designed to handle. The detailed
         * specification of this object depends on the KBase cell type.
         *
         * @returns {void}
         */
        upgradeCell(setupData) {
            const {
                attributes: { title, subtitle, icon },
                params,
            } = setupData;
            this.cell.metadata.kbase = {
                type: this.type,
                attributes: {
                    id: new Uuid(4).format(),
                    created: new Date().toUTCString(),
                    title,
                    subtitle,
                    icon,
                },
                params,
            };
        }

        // Cell augmentation method implementation

        /**
         * Constructs a supported icon type with a given set of parameters, using
         * information from the cell's metadata.
         *
         * Note that the params object, stored in the cell metadata, provides named
         * paramters which are, in the code, matched to the positional parameters in the
         * external functions which implement the icon itself.
         *
         * Note that the icon is rendered as text rather than a jQuery object, as that
         * is what kbaseCellToolbarMenu.js expects.
         *
         * @public
         *
         * @returns {string} An html string implementing the requested icon.
         */
        getIconForCell() {
            const { type, params } = this.getMetadata('attributes.icon');
            switch (type) {
                case 'generic': {
                    const { name, color } = params;
                    return makeGenericIcon(name, color);
                }
                case 'data': {
                    const { type, stacked } = params;
                    return makeDataIcon(type, stacked);
                }
                case 'appoutput': {
                    const { appSpec } = params;
                    return makeAppOutputIcon(appSpec);
                }
                default: {
                    return makeGenericIcon('thumbs-down', 'red');
                }
            }
        }

        /**
         * Hides the cell's input and output areas.
         *
         * @public
         *
         * @returns {void}
         */
        minimizeCell() {
            this.showInputArea(false);
            this.showOutputArea(false);
        }

        /**
         * Shows the cell's input and output areas.
         *
         * @returns {void}
         */
        maximizeCell() {
            const showCodeInputArea = this.getCellState('showCodeInputArea');
            this.showInputArea(showCodeInputArea);
            if (showCodeInputArea) {
                // Ensures that the code input area is rendered.
                if (this.cell.code_mirror) {
                    this.cell.code_mirror.refresh();
                }
            }
            this.showOutputArea(true);
        }

        /**
         * Shows or hides the cell's code input area, hiding if it was showing, and
         * showing if it was hiding.
         *
         * @public
         *
         * @returns {void}
         */
        toggleCodeInputArea() {
            const $codeInputArea = this.$getInputArea();
            if ($codeInputArea.length) {
                $codeInputArea.toggleClass('-show');
                this.setCellState('showCodeInputArea', this.cell.isCodeShowing());
            }
        }

        /**
         * Shows the output area or not, depending upon the value of argument.
         *
         * The output area is where the KBase cell implementation exists, so this is
         * essentially maximizing and minimizing the cell.
         *
         * @private
         *
         * @param {boolean} show Whether to show the output area or not.
         *
         * @returns {void}
         */
        showOutputArea(show) {
            this.cell.element.find('.output_wrapper').toggleClass('hidden', !show);
        }

        // Utilities for common cell operations

        /**
         * Finds and returns the code input area DOM node in the form of a jQuery
         * object.
         *
         * @returns {jQuery}
         */
        $getInputArea() {
            return this.cell.input.find('.input_area');
        }

        /**
         * Shows the code input area, or hides it, depending upon the value of the argument.
         *
         * @private
         *
         * @param {boolean} show
         *
         * @returns {void}
         */
        showInputArea(show) {
            const $inputArea = this.$getInputArea();
            if (show) {
                if (!$inputArea.hasClass('-show')) {
                    $inputArea.addClass('-show');
                }
            } else if ($inputArea.hasClass('-show')) {
                $inputArea.removeClass('-show');
            }
        }

        /**
         * Add additional methods to the cell that are utilized by our ui.
         *
         * This includes minimizing and maximizing the cell, and displaying
         * a per-type icon.
         *
         * @private
         *
         * @returns {void} nothing
         */
        addCellMethods() {
            this.cell.minimize = this.minimizeCell.bind(this);
            this.cell.maximize = this.maximizeCell.bind(this);
            this.cell.getIcon = this.getIconForCell.bind(this);
            // Note that we have replaced this method in custom.js (for now at least) as
            // it does not take care of the code input area also.
            this.cell.toggleCodeInputArea = this.toggleCodeInputArea.bind(this);
        }

        /**
         * Responsible for setting up the cell to be ready for use, when being revived
         * or after insertion.
         *
         * This must be run every time a cell is to be rendered in the Narrative, either
         * when inserted or when revived.
         *
         * @public
         *
         * @returns {void} nothing
         */
        setupCell() {
            this.addCellMethods();

            // The kbase property is used for managing _runtime_ state of the cell
            // for kbase. Anything to be persistent should be on the metadata.
            this.cell.kbase = {};

            // We want to ensure that Jupyter does not make key bindings for this cell,
            // as it can lead to unexpected behavior.
            disableKeyListenersForCell(this.cell);

            // Here we render the cell as maximized or minimzed based on its state. This
            // will also take care of whether the code input area is showing or not.
            this.cell.renderMinMax();

            this.cell.element.addClass(this.getCellClass());

            this.renderCellToolbar();
        }

        /**
         * The start method is responsible for runtime services such as event listeners.
         * It is called whenever a cell is added or "revived" when a Narrative is loaded.
         *
         * It also helps a subclass implement the start (and stop) lifecycle by invoking
         * the optional "onStart" method.
         *
         * @public
         *
         * @returns {void} nothing
         */
        start() {
            this.cellBus = this.createCellChannel();

            this.cellBus.on('delete-cell', () => {
                this.doDeleteCell();
            });

            this.onStart();
        }

        /**
         * The stop method is responsible for cleaning up any runtime services started
         * with the start method.
         *
         * It is called when the cell is removed. Otherwise, a cell is "running" from
         * when it comes into existence (added or revived) until it is either removed or
         * the Narrative is closed (in which case stop is not called, because the entire
         * Narrative Interface runtime is destroyed.)
         *
         * @public
         *
         * @returns {} nothing
         */
        stop() {
            this.onStop();
        }
    }

    return CellBase;
});
