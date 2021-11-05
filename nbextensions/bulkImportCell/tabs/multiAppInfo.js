define([
    'bluebird',
    'common/html',
    'common/ui',
    './fileTypePanel',
    'common/cellComponents/tabs/infoTab',
], (Promise, html, UI, FileTypePanel, InfoTab) => {
    'use strict';
    const cssBaseClass = 'kb-bulk-import-info';

    /**
     * This widget is responsible for providing info for each of the bulk import apps.
     *
     * It maintains the state of the currently shown app info (by file type)
     *
     * @param {object} options has keys:
     *     bus: message bus
     *     model: cell metadata, contains such fun items as the app parameters and state
     *     typesToFiles: map from object type to appId and list of input files
     * @returns
     */
    function MultiAppInfoWidget(options) {
        const { model, fileTypesDisplay, bus } = options;
        const fileTypeCompleted = {};
        let container = null,
            infoWidget,
            fileTypePanel,
            selectedFileType,
            selectedAppId,
            ui;

        /**
         * args includes:
         *  - node - the DOM node to act as this widget's container
         * @param {object} args
         */
        function start(args) {
            container = args.node;
            ui = UI.make({ node: container });

            selectedFileType = model.getItem('state.selectedFileType');
            selectedAppId = model.getItem(`inputs.${selectedFileType}.appId`);
            const readyState = model.getItem('state.params', {});
            for (const [fileType, status] of Object.entries(readyState)) {
                fileTypeCompleted[fileType] = status === 'complete';
            }

            const layout = renderLayout();
            container.innerHTML = layout;
            const fileTypeNode = ui.getElement('filetype-panel');
            const initPromises = [buildFileTypePanel(fileTypeNode), startInfoTab()];
            return Promise.all(initPromises);
        }

        function renderLayout() {
            const div = html.tag('div');
            return div(
                {
                    class: `${cssBaseClass}__container`,
                },
                [
                    div({
                        class: `${cssBaseClass}__panel--filetype`,
                        dataElement: 'filetype-panel',
                    }),
                    div({
                        class: `${cssBaseClass}__panel--info`,
                        dataElement: 'info-panel',
                    }),
                ]
            );
        }

        function startInfoTab() {
            infoWidget = InfoTab.make({ model });
            return infoWidget.start({
                node: ui.getElement('info-panel'),
                currentApp: selectedAppId,
            });
        }

        function stopInfoTab() {
            if (infoWidget) {
                return infoWidget.stop();
            }
            return Promise.resolve();
        }

        /**
         * Builds the file type panel (the left column); the right column will be app info
         *
         * @param {DOMElement} node - the node that should be used for the left column
         */
        function buildFileTypePanel(node) {
            fileTypePanel = FileTypePanel.make({
                bus,
                header: {
                    label: 'Data type',
                    icon: 'icon icon-genome',
                },
                fileTypes: fileTypesDisplay,
                toggleAction: toggleFileType,
            });

            return fileTypePanel.start({
                node,
                state: {
                    selected: selectedFileType,
                    completed: fileTypeCompleted,
                },
            });
        }

        /**
         * Toggle the active file type to the new type. It stores this in
         * the cell state, then resets the info widget to display info about the
         * newly-selected app.
         *
         * @param {string} fileType - the file type that should be shown
         */
        function toggleFileType(fileType) {
            if (model.getItem('state.selectedFileType') === fileType) {
                return; // do nothing if we're toggling to the same fileType
            }
            selectedFileType = fileType;
            selectedAppId = model.getItem(`inputs.${selectedFileType}.appId`);
            model.setItem('state.selectedFileType', fileType);
            // stop and start the widgets.
            return stopInfoTab()
                .then(() => startInfoTab())
                .then(() => {
                    fileTypePanel.updateState({
                        selected: selectedFileType,
                        completed: fileTypeCompleted,
                    });
                    bus.emit('toggled-active-filetype', {
                        fileType: selectedFileType,
                    });
                });
        }

        function stop() {
            return stopInfoTab().then(() => {
                container.innerHTML = '';
            });
        }

        return {
            start,
            stop,
        };
    }

    return {
        make: MultiAppInfoWidget,
        cssBaseClass,
    };
});
