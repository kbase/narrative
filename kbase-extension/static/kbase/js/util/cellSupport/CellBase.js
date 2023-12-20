define([
    'common/runtime',
    'common/ui',
    'common/busEventManager',
    'common/props',
    'common/jupyter',
    'common/html',
    'common/cellUtils'
], (
    runtime,
    UI,
    BusEventManager,
    Props,
    {getCells, deleteCell},
    {tag},
    {getCellMeta, setCellMeta}
) => {

    const div = tag('div');
    const p = tag('p');

    /**
     * The CellBase class serves as the base class for Narrative cells.
     * 
     * All subclasses must define `generatePython`
     * 
     * In addition, the `deleteMessage` method may be overridden to provide a more
     * appropriate confirmation warning when deleting a cell.
     */
    class CellBase {
        constructor({cell, type, name, container}) {
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

            // this.bus.emit('stop');

            deleteCell(this.cell);
        }


        setExtensionMetadata(propPath, value) {
            const path = `kbase.${this.type}.${propPath}`;
            setCellMeta(this.cell, path, value, true);
        }

        getExtensionMetadata(propPath, defaultValue) {
            const path = `kbase.${this.type}.${propPath}`;
            return getCellMeta(this.cell, path, defaultValue);
        }

        setMetadata(propPath, value) {
            const path = `kbase.${propPath}`;
            setCellMeta(this.cell, path, value, true);
        }

        generatePython() {
            throw new Error('The "generatePython" method must be redefined by a sub-class');
        }

        create(params) {
            //TODO: we only need to do this once, when the cell is first created.
            this.cell.set_text(this.generatePython());
            // Nothing is returned for this execution.
            // It is asynchronous, clearly, so we don't know
            // when it completes. 
            // In the context of the cell lifecycle, the cell will
            // come to life when the code executes, inserts the widget javascript.
            this.cell.execute();
        }

        async start(params) {
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
