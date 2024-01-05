define([
    'uuid',
    'common/runtime',
    'common/ui',
    'common/busEventManager',
    'common/props',
    'common/jupyter',
    'common/html',
    'common/cellUtils',
    'util/icon'
], (
    Uuid,
    runtime,
    UI,
    BusEventManager,
    Props,
    {getCells, deleteCell, disableKeyListenersForCell},
    {tag},
    {getCellMeta, setCellMeta},
    {makeAppOutputIcon, makeDataIcon, makeGenericIcon}
) => {
    const div = tag('div');
    const p = tag('p');
    const span = tag('span');

    /**
     * The Cell class serves as the base class for Narrative cells.
     * 
     * All subclasses must define `generatePython`
     * 
     * In addition, the `deleteMessage` method may be overridden to provide a more
     * appropriate confirmation warning when deleting a cell.
     */
    class CellBase {
        constructor({cell, type, name, icon, container}) {
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

            this.icon = icon;

            this.container = container || null;

            // Initialize all else.

            this.ui = UI.make({ node: container || document.body });

            this.runtime = runtime.make();
        } 

        setupComm() {
            this.cellBus = this.runtime.bus().makeChannelBus({
                name: {
                    cell: Props.getDataItem(this.cell.metadata, 'kbase.attributes.id'),
                },
                description: `A ${this.name} channel`,
            });

            this.eventManager.add(this.cellBus.on('delete-cell', () => {
                this.doDeleteCell();
            }));
        }

        updateIcon({name, color}) {
            const cellToolbarElement = this.cell.element.find('celltoolbar');
            const iconElement = cellToolbarElement.find('[data-element="icon"]')

            const icon = span([
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
            iconElement.innerHTML = icon;
            this.cell.metadata = this.cell.metadata;
        }

        renderCellToolbar() {
            this.cell.metadata = this.cell.metadata;
        }

        findCell() {
            const found = getCells().filter((cell) => {
                return cell.metadata.kbase.attributes.id === this.cell.metadata.kbase.attributes.id;
            });

            if (found.length === 0) {
                console.error('Cell not found, state will not be saved');
                return;
            }

            if (found.length > 1) {
                console.error('Too many cells found, state cannot be saved');
                return;
            }

            return found[0];
        }

        deleteMessage() {
            return div([
                p(['Deleting this cell will remove the code and any generated code output.']),
                p(`Continue to delete this ${this.name}?`),
            ]);
        }

        async doDeleteCell() {
            const confirmed = await this.ui.showConfirmDialog({ 
                title: 'Confirm Cell Deletion', 
                body: this.deleteMessage() 
            });

            if (!confirmed) {
                return;
            }

            this.stop();

            deleteCell(this.cell);
        }

        setIcon(icon) {
            this.icon = icon;
            // The kbaseCellToolbarMenu will rebuild the icon during a render,
            // and rendering the toolbar is triggered by updating the cell metadata.
            this.cell.metadata = this.cell.metadata;
        }

        setExtensionMetadata(propPath, value) {
            const path = `kbase.${this.type}.${propPath}`;
            setCellMeta(this.cell, path, value, true);
        }

        getExtensionMetadata(propPath, defaultValue) {
            const path = `kbase.${this.type}.${propPath}`;
            return getCellMeta(this.cell, path, defaultValue);
        }

        setMetadata(propPath, value, render) {
            const path = `kbase.${propPath}`;
            setCellMeta(this.cell, path, value, render);
        }

        getMetadata(propPath, defaultValue) {
            const path = `kbase.${propPath}`;
            return getCellMeta(this.cell, path, defaultValue);
        }

        create() {
            //TODO: we only need to do this once, when the cell is first created.
            this.cell.set_text(this.generatePython());
            // Nothing is returned for this execution.
            // It is asynchronous, clearly, so we don't know
            // when it completes. 
            // In the context of the cell lifecycle, the cell will
            // come to life when the code executes, inserts the widget javascript.
            this.cell.execute();
        }

        // "abstract" methods
        getCellTitle(cell) {
            throw new Error('The "getCellTitle" method must be defined by a subclass');
        }

        getCellSubtitle(cell) {
            throw new Error('The "getCellSubtitle" method must be defined by a subclass');
        }

        generatePython() {
            throw new Error('The "generatePython" method must be redefined by a sub-class');
        }
        getCellClass(cell) {
            throw new Error('The "getCellClass" method must be defined by a sub-class');
        }


        /** 
        * Should only be called when a cell is first inserted into a narrative.
        *
        * It creates the correct metadata and then sets up the cell.
        *
        */
        upgradeCell(data) {
            const cell = this.cell;
            function getAttribute(name) {
                if ('attributes' in data) {
                    if (name in data.attributes) {
                        return data.attributes[name];
                    }
                }
            }
            // Create base app cell
            const meta = cell.metadata;
            // TODO: drop? doesn't seem to be used
			const {initialData} = data;
            this.icon = getAttribute('icon') || {type: 'generic', params: {name: "thumbs-down", color: "red"}}
            meta.kbase = {
                type: this.type,
                attributes: {
                    id: new Uuid(4).format(),
                    // title: `FAIR Narrative Description`,
                    title: 'Loading...',
                    // title: getAttribute('title') || this.title,
                    // subtitle: getAttribute('subtitle') || '',
                    created: new Date().toUTCString(),
                    // I don't think this is used any more? Most cells use
                    // calls to util/icon.js, though it is somewhat compatible
                    // with the simple icon struct ({name, color}).
                    icon: getAttribute('icon') || this.icon
                },
                [this.type]: initialData || {}
            };
            cell.metadata = meta;

            // Sets the metadata, property by property. 
            for (const [key, value] of Object.entries(data.metadata)) {
                this.setExtensionMetadata(key, value);
            }

            // Sets the attributes too
            this.setCellTitle(getAttribute('title'));
            this.setCellSubtitle(getAttribute('subtitle'));
            this.setCellIcon(getAttribute('icon'));
 
        }

        setCellTitle(title, render) {
            this.setMetadata('attributes.title', title, render);
        }

        setCellSubtitle(subtitle, render) {
            this.setMetadata('attributes.subtitle', subtitle, render);
        }

        setCellIcon(icon, render) {
            this.setMetadata('attributes.icon', icon, render);
        }

        /**
         * Add additional methods to the cell that are utilized by our ui.
         * 
         * This includes minimizing and maximizing the cell, and displaying 
         * a per-type icon.
         * 
         * @param {*} cell 
         */
         augmentCell() {
            const cell = this.cell;
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
            cell.getIcon = this.buildIcon.bind(this)
        }

        buildIcon() {
            const icon = this.getMetadata('attributes.icon');
            switch (icon.type) {
                case "generic": {
                    const {name, color} = icon.params;
                    return makeGenericIcon(name, color);
                }
                case "data": {
                    const {type, stacked} = icon.params;
                    return makeDataIcon(type, stacked);
                }
                case "appoutput": {
                    const {appSpec} = icon.params;
                    return makeAppOutputIcon(appSpec);
                }
                default: {
                    return makeGenericIcon('thumbs-down', 'red');
                }
            }
        }

         /**
         * Responsible for setting up cell augmentations required at runtime.
         * 
         */
         setupCell() {
            const cell = this.cell;
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

            disableKeyListenersForCell(cell);

            cell.renderMinMax();

            // this.onSetupCell(cell);

            cell.element[0].classList.add(this.getCellClass(cell));

            // force toolbar rerender.
            // eslint-disable-next-line no-self-assign
            cell.metadata = cell.metadata;
        }


        async start() {
            this.eventManager = BusEventManager.make({
                bus: this.runtime.bus()
            });

            // manager object's direct bus
            this.bus = this.runtime.bus().makeChannelBus({description: 'A service widget cell (widget!)'});

            // Called when the cell is deleted from the narrative.
            this.eventManager.add(
                this.bus.on('stop', () => {
                    this.stop();
                })
            );

            this.setupComm();

            if (typeof this.onStart === 'function') {
                await this.onStart();
            }
        }

        stop() {
            this.eventManager.removeAll();
            if (typeof this.onStop === 'function') {
                this.onStop();
            }
        }
    }

    return CellBase;
});
