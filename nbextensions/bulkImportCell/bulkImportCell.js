define([
    'uuid',
    'common/appUtils',
    'common/utils',
    'common/runtime',
    'common/busEventManager',
    'common/ui',
    'common/events',
    'base/js/namespace',
    'kb_common/html',
], (
    Uuid,
    AppUtils,
    Utils,
    Runtime,
    BusEventManager,
    UI,
    Events,
    Jupyter,
    html
) => {
    'use strict';
    const CELL_TYPE = 'app-bulk-import';

    const tag = html.tag,
        div = tag('div'),
        span = tag('span'),
        a = tag('a');

    /**
     * This class creates and manages the bulk import cell. This works with, and wraps around,
     * the Jupyter Cell object.
     */
    class BulkImportCell {
        /**
         * The constructor does the work of initializing the bulk import cell module. It
         * modifies the cell metadata, if the initialize parameter is truthy, and extends the
         * cell object to do things we need it to, like respond to minimization requests and
         * render its icon. This modification also includes the contents of typesToFiles if
         * present.
         *
         * If initialize is falsy, no changes are made to the structure, even if typesToFiles is
         * present and contains new data.
         * @param {Cell} cell a Jupyter notebook cell. This should be a code cell, and will throw
         * an Error if it is not.
         * @param {boolean} initialize if true, this will initialize the bulk import cell
         * structure that gets serialized in the cell metadata. This should ONLY be set true when
         * creating a new bulk import cell, not loading a narrative that already contains one
         * @param {object} typesToFiles keys = data type strings, values = arrays of file paths
         * to import
         * e.g.: {
         *     'fastq_reads': ['file1.fq', 'file2.fq']
         * }
         */
        constructor(cell, initialize, typesToFiles) {
            if (cell.cell_type !== 'code') {
                throw new Error('Can only create Bulk Import Cells out of code cells!');
            }
            this.cell = cell;
            // this is the DOM element used as the container for everything controlled by this cell.
            this.kbaseNode = null;
            this.runtime = Runtime.make();
            this.cellBus = null;
            this.busEventManager = BusEventManager.make({
                bus: this.runtime.bus()
            });
            this.ui = null;
            this.actionButtons = {
                current: {
                    name: null,
                    disabled: null
                },
                availableButtons: {
                    runApp: {
                        help: 'Run the app',
                        type: 'success',
                        classes: ['-run'],
                        label: 'Run'
                    },
                    cancel: {
                        help: 'Cancel the running app',
                        type: 'danger',
                        classes: ['-cancel'],
                        label: 'Cancel'
                    },
                    reRunApp: {
                        help: 'Edit and re-run the app',
                        type: 'default',
                        classes: ['-rerun'],
                        label: 'Reset'
                    },
                    resetApp: {
                        help: 'Reset the app and return to Edit mode',
                        type: 'default',
                        classes: ['-reset'],
                        label: 'Reset'
                    },
                    offline: {
                        help: 'Currently disconnected from the server.',
                        type: 'danger',
                        classes: ['-cancel'],
                        label: 'Offline'
                    }
                }
            };

            this.controlBarTabs = {
                selectedTab: null,
                tabs: {
                    configure: {
                        label: 'Configure',
                        // widget: configureWidget()
                    },
                    viewConfigure: {
                        label: 'View Configure',
                        // widget: viewConfigureWidget()
                    },
                    batchConfigure: {
                        label: 'Configure Batch',
                        // widget: batchConfigureWidget()
                    },
                    viewBatchConfigure: {
                        label: 'View Batch Configure',
                        // widget: viewBatchConfigureWidget()
                    },
                    info: {
                        label: 'Info',
                        // widget: infoTabWidget,
                    },
                    logs: {
                        label: 'Job Status',
                        // widget: logTabWidget
                    },
                    results: {
                        label: 'Result',
                        // widget: resultsTabWidget
                    },
                    error: {
                        label: 'Error',
                        type: 'danger',
                        // widget: errorTabWidget
                    }
                }
            };

            if (initialize) {
                this.initialize(typesToFiles);
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
         *
         * @param {object} typesToFiles keys = data type strings, values = arrays of file paths
         * to import
         * e.g.: {
         *     'fastq_reads': ['file1.fq', 'file2.fq']
         * }
         */
        initialize(typesToFiles) {
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
                        },
                        inputs: typesToFiles
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

            this.ui = UI.make({
                node: this.kbaseNode,
                bus: this.cellBus
            });
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

        toggleTab(tab) {
            alert(tab);
        }

        buildRunControlPanelRunButtons(events) {
            const style = {
                padding: '6px'
            };
            const buttonList = Object.keys(this.actionButtons.availableButtons).map((key) => {
                const button = this.actionButtons.availableButtons[key],
                    classes = [].concat(button.classes);
                let icon;
                if (button.icon) {
                    icon = {
                        name: button.icon.name,
                        size: 2
                    };
                }
                return this.ui.buildButton({
                    tip: button.help,
                    name: key,
                    events: events,
                    type: button.type || 'default',
                    classes: classes,
                    hidden: true,
                    // Overriding button class styles for this context.
                    style: {
                        width: '80px'
                    },
                    event: {
                        type: 'actionButton',
                        data: {
                            action: key
                        }
                    },
                    icon: icon,
                    label: button.label
                });
            });

            var buttonDiv = div({
                class: 'btn-group',
                style: style
            }, buttonList);
            return buttonDiv;
        }

        buildRunControlPanelDisplayButtons(events) {
            const buttons = Object.keys(this.controlBarTabs.tabs).map((key) => {
                const tab = this.controlBarTabs.tabs[key];
                let icon;
                if (!tab) {
                    console.warn('Tab not defined: ' + key);
                    return;
                }
                if (tab.icon) {
                    if (typeof tab.icon === 'string') {
                        icon = {
                            name: tab.icon,
                            size: 2
                        };
                    } else {
                        icon.size = 2;
                    }
                }
                return this.ui.buildButton({
                    label: tab.label,
                    name: key,
                    events: events,
                    type: tab.type || 'primary',
                    // hidden: true,
                    features: tab.features,
                    classes: ['kb-app-cell-btn'],
                    event: {
                        type: 'control-panel-tab',
                        data: {
                            tab: key
                        }
                    },
                    icon: icon
                });
            }).filter(function(x) {
                return x ? true : false;
            });
            this.cellBus.on('control-panel-tab', (message) => {
                var tab = message.data.tab;
                this.toggleTab(tab);
            });

            var outdatedBtn = a({
                tabindex: '0',
                type: 'button',
                class: 'btn hidden',
                dataContainer: 'body',
                container: 'body',
                dataToggle: 'popover',
                dataPlacement: 'bottom',
                dataTrigger: 'focus',
                dataElement: 'outdated',
                role: 'button',
                title: 'New version available',
                style: {
                    color: '#f79b22',
                    padding: '6px 0 0 0'
                }
            }, span({
                class: 'fa fa-exclamation-triangle fa-2x'
            }));
            buttons.unshift(outdatedBtn);

            return buttons;
        }

        buildRunControlPanel(events) {
            return div({ dataElement: 'run-control-panel' }, [
                div({
                    style: { border: '1px silver solid', height: '50px', position: 'relative', display: 'flex', flexDirection: 'row' }
                }, [
                    div({
                        style: {
                            height: '50px',
                            overflow: 'hidden',
                            textAlign: 'left',
                            lineHeight: '50px',
                            verticalAlign: 'middle',
                            display: 'flex',
                            flexDirection: 'row'
                        }
                    }, [
                        this.buildRunControlPanelRunButtons(events)
                    ]),
                    div({
                        dataElement: 'status',
                        style: {
                            width: '450px',
                            height: '50px',
                            overflow: 'hidden'
                        }
                    }, [
                        div({
                            style: {
                                height: '50px',
                                marginTop: '0px',
                                textAlign: 'left',
                                lineHeight: '50px',
                                verticalAlign: 'middle'
                            }
                        }, [
                            div([
                                span({ dataElement: 'execMessage' })
                            ])
                        ])
                    ]),
                    div({
                        dataElement: 'toolbar',
                        style: {
                            position: 'absolute',
                            right: '0',
                            top: '0',
                            height: '50px'
                        }
                    }, [
                        div({
                            style: {
                                display: 'inline-block',
                                right: '0',
                                height: '50px',
                                lineHeight: '50px',
                                paddingRight: '15px',
                                verticalAlign: 'bottom'
                            }
                        }, [
                            div({
                                class: 'btn-toolbar',
                                style: {
                                    display: 'inline-block',
                                    verticalAlign: 'bottom'
                                }
                            }, this.buildRunControlPanelDisplayButtons(events))
                        ])
                    ])
                ]),
                div({
                    dataElement: 'tab-pane'
                }, [
                    div({ dataElement: 'widget' })
                ])
            ]);
        }

        renderLayout() {
            const events = Events.make(),
                content = div({ class: 'kbase-extension kb-app-cell', style: { display: 'flex', alignItems: 'stretch' } }, [
                    div({ class: 'prompt', dataElement: 'prompt', style: { display: 'flex', alignItems: 'stretch', flexDirection: 'column' } }, [
                        div({ dataElement: 'status' })
                    ]),
                    div({
                        class: 'body',
                        dataElement: 'body',
                        style: { display: 'flex', alignItems: 'stretch', flexDirection: 'column', flex: '1', width: '100%' }
                    }, [
                        div({ dataElement: 'widget', style: { display: 'block', width: '100%' } }, [
                            div({ class: 'container-fluid' }, [
                                this.buildRunControlPanel(events)
                            ])
                        ])
                    ])
                ]);
            return {
                content: content,
                events: events
            };

        }

        /**
         * Renders the view.
         */
        render() {
            const layout = this.renderLayout();
            this.kbaseNode.innerHTML = layout.content;
            layout.events.attachEvents(this.kbaseNode);

        }



    }

    return BulkImportCell;
});
