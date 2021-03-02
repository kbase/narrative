/**
 * Widget for interactions with the KBase working area.
 * This controls the toggling to and from read-only mode, as well as putting
 * in place most new cells.
 *
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @author Dan Gunter <dkgunter@lbl.gov>
 * @public
 */

define([
    'base/js/namespace',
    'common/runtime',
    'common/ui',
    'common/html',
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'util/bootstrapDialog',
    'handlebars',
    'common/props',
    'text!kbase/templates/report_error_button.html',

    'bootstrap',
], (
    Jupyter,
    Runtime,
    UI,
    html,
    KBWidget,
    $,
    Config,
    BootstrapDialog,
    Handlebars,
    Props,
    ReportErrorBtnTmpl
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeWorkspace',
        version: '1.0.0',

        init: function (options) {
            this._super(options);
            this.runtime = Runtime.make();

            // The readOnly flag, and the sister setting readonly,
            // is strictly associated with the the jupyter writable state.
            // See uiMode for the runtime reconfigurable and related setting.
            // This property is only set in accordance with the Jupyter.notebook.writable property.
            // It is set here, at the outset, and also in a listener for the
            // 'updateReadOnlyMode.Narrative' jquery event, which, as far as I can tell
            // is not issued anywhere in the system. The effect of this would be to
            // cause a narrative to flip from edit->view or view->edit while a user is
            // engaged with the narrative. This seems like a jarring experience, and would
            // certainly need some ui mechanism like a dialog to explain what is happening
            // to the user.
            // So, effectively, this is a constant.
            this.narrativeIsReadOnly = !Jupyter.notebook.writable;

            // This value is available through the Jupyter.narrative api.
            // Funny thing is, Jupyter.narrative is an instance of kbaseNarrative which
            // in turn contains an instance of kbaseNarrativeWorkspace, which is probably
            // this very object!
            // Still, consumers of the Jupyter.narrative api will expect this to be there.
            Jupyter.narrative.readonly = this.narrativeIsReadOnly;

            // isViewMode is really a cheap way of representing edit mode.
            // If false, the mode is 'edit', if true the mode is 'view'.
            // If there were more than two modes, we would need to store this as
            // another type of value -- string or number.
            // this.isViewMode = false;
            // uiMode is one of 'edit', view'.
            // A string enum, because although we have two ui states now,
            // edit, which basically follows read-write
            // view, which shadows read-only
            // we may have additional modes (as has been discussed) -
            this.uiMode = this.narrativeIsReadOnly ? 'view' : 'edit';
            Jupyter.narrative.uiMode = this.uiMode;

            $(document).on('appClicked.Narrative', (event, method, tag, parameters) => {
                if (this.uiMode === 'view') {
                    console.warn('ignoring attempt to insert app cell in view-only mode');
                    return;
                }
                this.buildAppCodeCell(method, tag, parameters);
            });

            $(document).on('deleteCell.Narrative', (event, index) => {
                if (this.uiMode === 'view') {
                    console.warn('ignoring attempt to delete cell in view-only mode');
                    return;
                }
                this.deleteCell(index);
            });

            $(document).on('createViewerCell.Narrative', (event, data) => {
                if (this.uiMode === 'view') {
                    console.warn('ignoring attempt to create viewer cell in view-only mode');
                    return;
                }
                this.buildViewerCell(data.nearCellIdx, data, data.widget);
            });

            this.initReadOnlyElements();

            // Not sure about this asymmetry. The assumption I guess is that everything
            // defaults to read-write mode, and we only need to "enter" read-only mode
            // if need be. However, this is probably what leads to the flashing of the ui
            // when opening read-only narratives. A better design would be to have nothing
            // or only neutral components rendered, and then to enter edit mode or view mode.
            if (this.narrativeIsReadOnly) {
                this.enterReadOnlyMode();
            }

            return this;
        },

        uiModeIs: function (modeTest) {
            return this.uiMode === modeTest;
        },

        initReadOnlyElements: function () {
            const reportErrorBtn = Handlebars.compile(ReportErrorBtnTmpl);
            $('#kb-view-mode')
                .click(() => {
                    this.toggleReadOnlyMode();
                })
                .tooltip({
                    title: 'Toggle view-only mode',
                    container: 'body',
                    delay: {
                        show: Config.get('tooltip').showDelay,
                        hide: Config.get('tooltip').hideDelay,
                    },
                    placement: 'bottom',
                });

            /* This is the input box for the new narrative name.
             * Gets pre-populated with the current narrative name + "- copy"
             * When empty, prompts to enter a name with a tooltip, and disables the copy btn.
             */
            var $newNameInput = $('<input type="text">')
                .addClass('form-control')
                .tooltip({
                    title: 'Please enter a name.',
                    container: 'body',
                    placement: 'right',
                    trigger: 'manual',
                })
                .on('focus', () => {
                    Jupyter.narrative.disableKeyboardManager();
                })
                .on('blur', () => {
                    Jupyter.narrative.enableKeyboardManager();
                })
                .on('input', () => {
                    const v = $newNameInput.val();
                    if (!v) {
                        $newNameInput.tooltip('show');
                        $doCopyBtn.prop('disabled', true);
                    } else {
                        $newNameInput.tooltip('hide');
                        $doCopyBtn.prop('disabled', false);
                    }
                });

            const $errorMessage = $('<div>').css({
                color: '#F44336',
                'padding-top': '5px',
            });

            /*
             * Does the actual copy and displays the error if that happens.
             */
            const $doCopyBtn = $('<button>')
                .addClass('kb-primary-btn')
                .append('Copy')
                .click(() => {
                    $errorMessage.empty();
                    $doCopyBtn.prop('disabled', true);
                    $cancelBtn.prop('disabled', true);
                    $newNameInput.prop('disabled', true);
                    Jupyter.narrative
                        .getNarrativeRef()
                        .then((narrativeRef) => {
                            return Jupyter.narrative.sidePanel.$narrativesWidget.copyNarrative(
                                narrativeRef,
                                $newNameInput.val()
                            );
                        })
                        .then((result) => {
                            Jupyter.narrative.sidePanel.$narrativesWidget.refresh();
                            // show go-to button
                            $cancelBtn.html('Close');
                            $jumpButton.click(() => {
                                window.location.href = result.url;
                            });
                            $jumpButton.show();
                            $cancelBtn.prop('disabled', false);
                        })
                        .catch((error) => {
                            if (error && error.error && error.error.message) {
                                $errorMessage.append(error.error.message);
                            } else if (typeof error === 'string') {
                                $errorMessage.append(error);
                            } else {
                                $errorMessage.append(
                                    'Sorry, an error occurred while copying. Please try again.'
                                );
                            }
                            $errorMessage.append(
                                '<br>If copying continues to fail, please contact KBase with the button below.'
                            );
                            $errorMessage.append(reportErrorBtn());
                            $doCopyBtn.prop('disabled', false);
                            $cancelBtn.prop('disabled', false);
                            $newNameInput.prop('disabled', false);
                        });
                });

            var $cancelBtn = $('<button>')
                .addClass('kb-default-btn')
                .append('Cancel')
                .click(() => {
                    $newNameInput.tooltip('hide');
                    this.copyModal.hide();
                });

            var $jumpButton = $('<button>').addClass('btn btn-info').text('Open the new Narrative');

            const $copyModalBody = $('<div>')
                .append($('<div>').append('Enter a name for the new Narrative'))
                .append($('<div>').append($newNameInput))
                .append($errorMessage)
                .append($jumpButton);

            this.copyModal = new BootstrapDialog({
                title: 'Copy this Narrative',
                body: $copyModalBody,
                closeButton: true,
                buttons: [$cancelBtn, $doCopyBtn],
            });

            $('#kb-view-only-copy').click(() => {
                $jumpButton.hide();
                $doCopyBtn.prop('disabled', false);
                $cancelBtn.prop('disabled', false);
                $cancelBtn.html('Cancel');
                $newNameInput
                    .val(Jupyter.notebook.get_notebook_name() + ' - Copy')
                    .prop('disabled', false);
                $errorMessage.empty();
                this.copyModal.show();
            });

        },

        buildAppCodeCell: function (spec, tag, parameters) {
            if (!spec || !spec.info) {
                console.error('ERROR build method code cell: ', spec, tag);
                alert('Unable to build a new App Cell - could not find the correct app spec!');
                return;
            }

            // For now, dispatch on the type of method cell here. This is really
            // just a handler for the event emitted when a user clicks on
            // a method in the side panel, so there is no processing of anything
            // yet, really.
            // An alternative is that the event emitted could be specialized based on the
            // type of method.

            // To boot, there does not appear to be a spec property dedicated to
            // defining the "type" of method.
            // So, for kicks, we are using the presence of the word "view" in the
            // spec name, as well as the absence of any output paramters.

            const cellType = this.determineCellTypeFromSpec(spec);

            // This will also trigger the create.Cell event, which is not very
            // useful for us really since we haven't been able to set the
            // metadata yet. Don't worry, I checked, the Jupyter api does not
            // provide a way to set the cell metadata as it is being created.
            const cellData = {
                type: cellType,
                appTag: tag,
                appSpec: spec,
            };
            const cell = Jupyter.narrative.insertAndSelectCellBelow('code', null, cellData);

            // Finally, if we have parameters, wedge them in the new cell's metadata.
            if (parameters) {
                const meta = cell.metadata;
                Object.keys(parameters).forEach((param) => {
                    meta.kbase.appCell.params[param] = parameters[param];
                });
                cell.metadata = meta;
            }
            return cell;
        },

        /*
        For now we need to keep the "spec grokking" in place.
        A little bit like duck typing, we inspect the properties of the app
        spec to determine if it is an app, editor, or viewer.
        */
        determineCellTypeFromSpec: function (spec) {
            // An app will execute via the method described in the behavior. If
            // such a method is not described, it is by definition not an
            // executing app.
            if (spec.behavior.kb_service_name && spec.behavior.kb_service_method) {
                switch (spec.info.app_type) {
                    case 'editor':
                        return 'editor';
                    case 'app':
                        return 'app';
                    case 'advanced_viewer':
                        return 'advancedView';
                    default:
                        console.warn(
                            'The app ' +
                                spec.info.id +
                                ' does not specify a valid spec.info.app_type "' +
                                spec.info.app_type +
                                '" - defaulting to "app"'
                        );
                        return 'app';
                }
            }

            // No specified execution behavior = a viewer.
            return 'view';
        },

        toggleReadOnlyMode: function () {
            // Disable any toggling if the button is somehow visible and the
            // narrative is now read-only.
            if (this.narrativeIsReadOnly) {
                return;
            }
            if (this.uiMode === 'edit') {
                this.enterReadOnlyMode();
            } else {
                this.enterReadWriteMode();
            }
            // Note that the internal narrativeIsReadOnly and uiMode are set
            // within these enter... calls above.

            // In true read-only (non-writable) mode, the view-mode toggle button
            // is not available. Interestingly, this function can only be called
            // from the toggle button itself..., so I've disabled that logic and it
            // should just be removed...
            // If this narrative became read-only after the toggle button was rendered,
            // then simply disabling the class-switching is not enough, the entire
            // mechanism should be disabled (and the button hidden as well.)
            const icon = $('#kb-view-mode span');
            icon.toggleClass('fa-eye', this.uiMode === 'view');
            icon.toggleClass('fa-pencil', this.uiMode === 'edit');
            Jupyter.narrative.readonly = this.uiMode === 'view';

            // Warning, do not look for the code for this ... it will burn your
            // eyes out to their bare sockets.
            // Note also, there is code in this module which supposdly does the same thing
            // (see readOnlyMode, readWriteMode), but doesn't seem to work.
            Jupyter.CellToolbar.rebuild_all();
            this.runtime.bus().emit('read-only-changed', {
                readOnly: this.uiMode == 'view',
            });
            this.runtime.bus().emit('ui-mode-changed', {
                mode: this.uiMode,
            });
        },

        /**
         * List of selectors to toggle for read-only mode.
         *
         * @returns {string[]}
         */
        getReadOnlySelectors: function () {
            return [
                '.kb-app-next',                                 // next steps
                '#kb-add-code-cell', '#kb-add-md-cell',         // edit btns
                '#kb-share-btn', '#kb-save-btn',                // action btns
                '#kb-ipy-menu',                                 // kernel menu
                '.kb-cell-toolbar .buttons.pull-right',         // Jupyter icons
                '.kb-title .btn-toolbar .btn .fa-arrow-right',  // data panel slideout
            ];
        },

        toggleCellEditing: function (on) {
            Jupyter.notebook.get_cells().forEach((cell) => {
                if (cell.code_mirror) {
                    if (on) {
                        cell.code_mirror.setOption('readOnly', false);
                    } else {
                        cell.code_mirror.setOption('readOnly', 'nocursor');
                    }
                }
                cell.celltoolbar.rebuild();
            });
        },

        /**
         * Set narrative into read-only mode.
         * This is called during initialization and by the view-mode toggle.
         * Note that this is for the view-only ui mode, and thus the narrative
         * itself may be writable (read-write). This crossover of terminology is
         * a bit confusing to follow, and thus I've attempted to introduct the
         * ui view/edit mode as orthgonal to narrative
         * permission (read-only/read-write/read-write-share).
         *
         * TODO: probably a better design to set the read / view only flags
         * and thsn simply render everything that is interested in this.
         * Otherwise, we just have to propogate the state that _will_ be true when
         * this operation is complete, because sub-rendering tasks can't just
         * look at the current state.
         */
        enterReadOnlyMode: function () {
            // It is implicit that view-only mode is on when the narrative is read only.
            this.uiMode = 'view';

            // Hide side-panel
            Jupyter.narrative.toggleSidePanel(true);

            // Hide things
            this.getReadOnlySelectors().forEach(id => $(id).hide());
            this.toggleCellEditing(false);

            Jupyter.narrative.sidePanel.setReadOnlyMode(true);

            // Special copy button for view  mode.
            $('#kb-view-only-copy').removeClass('hidden');

            if (this.narrativeIsReadOnly) {
                $('#kb-view-only-msg').popover({
                    html: false,
                    placement: 'bottom',
                    trigger: 'hover',
                    content:
                        'You do not have permissions to modify ' +
                        'this narrative. If you want to make your own ' +
                        'copy that can be modified, use the ' +
                        '"Copy" button.',
                });
                // No view-mode toggle for true read-only.
                $('#kb-view-mode').hide();

                // Disable clicking on name of narrative to rename the narrative.
                // The widget controlling this is also disabled in custom.js
                // Note that that is a jupyter-controlled id, and may change over time.
                $('#save_widget').unbind();

                // Hide save status. Autosave will be disabled, but it may flash
                // messages.
                // Jupyter controlled id.
                $('#autosave_status').hide();
            } else {
                $('#kb-view-only-msg').popover({
                    html: false,
                    placement: 'bottom',
                    trigger: 'hover',
                    content:
                        'This is narrative in temporary view-only mode. ' +
                        'This mode shows what any user without write privileges will see.',
                });
            }
            $('#kb-view-only-msg').removeClass('hidden');
        },

        /**
         * Set narrative from read-only mode to read-write mode
         * This is only called in the context of an editable Narrative
         * in which the user is togging between view/edit mode in order
         * to evaluate how the narrative appears on view-only mode.
         */
        enterReadWriteMode: function () {
            if (this.narrativeIsReadOnly) {
                Jupyter.narrative.sidePanel.setReadOnlyMode(true, this.hideControlPanels);
                Jupyter.narrative.toggleSidePanel(false);
                return;
            }

            this.uiMode = 'edit';

            Jupyter.narrative.sidePanel.setReadOnlyMode(false);

            // Remove the view-only buttons (first 1 or 2 children)
            $('#kb-view-only-msg').addClass('hidden');
            $('#kb-view-only-copy').addClass('hidden');

            // re-enable clicking on narrative name
            $('#save_widget').click(() => {
                if (Jupyter && Jupyter.save_widget) {
                    Jupyter.save_widget.rename_notebook('Rename your Narrative.', true);
                }
            });
            this.toggleCellEditing(true);

            // re-enable auto-save status
            $('#autosave_status').show();
            this.getReadOnlySelectors().forEach(id => $(id).show());

            Jupyter.narrative.toggleSidePanel(false);
        },

        /**
         * @method deleteCell
         * @private
         * Delete cell needs to honor the KBase cell extensions, but since we are using the
         * new nb extension mechanism, and may have arbitrary cell types, we just look to
         * see if it is indeed a kbase cell, and if so we send a bus command out to it.
         *
         * If not, then we show a popup dialog that prompts the user to really delete or not.
         */
        deleteCell: function (index) {
            if (index === undefined || index === null) {
                return;
            }
            const cell = Jupyter.notebook.get_cell(index);
            if (!cell) {
                return;
            }
            const kbaseCellType = Props.getDataItem(cell.metadata, 'kbase.type');
            const cellId = Props.getDataItem(cell.metadata, 'kbase.attributes.id');
            const p = html.tag('p');

            if (!kbaseCellType || !cellId) {
                UI.make({ node: this.$elem[0] })
                    .showConfirmDialog({
                        title: 'Confirm Cell Deletion',
                        body: [
                            p(
                                'Cell deletion is permanent. There is no "undo" feature to recover this cell once it is deleted.'
                            ),
                            p('Are you sure you want to delete this cell?'),
                        ],
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            Jupyter.notebook.delete_cell(index);
                        }
                    });
                return;
            }

            this.runtime.bus().send(
                {},
                {
                    channel: {
                        cell: cellId,
                    },
                    key: {
                        type: 'delete-cell',
                    },
                }
            );
        },

        /**
         *
         * @param {int} cellIndex - the index of the cell to insert the new viewer cell near
         * @param {object} data - a data structure describing the viewer cell. Should have keys:
         *  - placement (optional) - either 'above' or 'below',
         *  - info: an Object Info array (see Workspace docs)
         */
        buildViewerCell: function (cellIndex, data) {
            let placement = data.placement;
            if (['above', 'below'].indexOf(placement) === -1) {
                placement = 'below';
            }
            var cellData = {
                type: 'data',
                objectInfo: data.info,
            };
            if (placement === 'above') {
                return Jupyter.notebook.insert_cell_above('code', cellIndex, cellData);
            } else {
                return Jupyter.notebook.insert_cell_below('code', cellIndex, cellData);
            }
        }
    });
});
