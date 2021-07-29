/**
 * Top-level 'widget' for the workspace interaction with the KBase narrative.
 *
 * The widget lists the objects in the workspace and include a search field
 * to filter the list, as well as a button to 'Add' new items from sources
 * like the CDS and local files.
 *
 * Options:
 *    loadingImage - an image to show in the middle of the widget while loading data
 *    tableElem - HTML element container for the data table
 *    controlsElem - HTML element container for the controls (search/add)
 *
 * Triggers events:
 * updateData.Narrative - when any externally represented data should be updated.
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
    'underscore',
    'bluebird',
    'narrativeConfig',
    'util/bootstrapDialog',
    'util/string',
    'util/timeFormat',
    'handlebars',
    'kbaseDefaultNarrativeOutput',
    'kbaseDefaultNarrativeInput',
    'kbaseNarrativeAppCell',
    'kbaseNarrativeMethodCell',
    'kbaseNarrativeSidePanel',
    'kbaseNarrativeDataPanel',
    'kbaseNarrativeOutputCell',
    'kbaseTabs',
    'common/props',
    'kb_service/client/narrativeMethodStore',
    'text!kbase/templates/report_error_button.html',

    'bootstrap',
], (
    Jupyter,
    Runtime,
    UI,
    html,
    KBWidget,
    $,
    _,
    Promise,
    Config,
    BootstrapDialog,
    StringUtil,
    TimeFormat,
    Handlebars,
    kbaseDefaultNarrativeOutput,
    kbaseDefaultNarrativeInput,
    kbaseNarrativeAppCell,
    kbaseNarrativeMethodCell,
    kbaseNarrativeSidePanel,
    kbaseNarrativeDataPanel,
    kbaseNarrativeOutputCell,
    kbaseTabs,
    Props,
    NarrativeMethodStore,
    ReportErrorBtnTmpl
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeWorkspace',
        version: '1.0.0',
        options: {
            loadingImage: Config.get('loading_gif'),
            tableElem: null,
            controlsElem: null,
            ws_id: null,
            methodStoreURL: Config.url('narrative_method_store'),
        },
        ws_client: null,
        ws_id: null,
        defaultOutputWidget: 'kbaseDefaultNarrativeOutput',
        defaultInputWidget: 'kbaseDefaultNarrativeInput',
        errorWidget: 'kbaseNarrativeError',
        connectable: {},

        inputsRendered: false,
        maxSavedStates: 1, // limit the states saved to 1 for now.
        nextOutputCellId: '',

        // constant strings.
        KB_CELL: 'kb-cell',
        KB_TYPE: 'type',
        KB_APP_CELL: 'kb_app',
        KB_FUNCTION_CELL: 'function_input',
        KB_OUTPUT_CELL: 'function_output',
        KB_ERROR_CELL: 'kb_error',
        KB_CODE_CELL: 'kb_code',
        KB_STATE: 'widget_state',

        curCell: null,

        // set up as a hash for quickie lookup time!
        ignoredDataTypes: {
            string: 1,
            unicode: 1,
            numeric: 1,
            integer: 1,
            list: 1,
            'a number': 1,
        },

        init: function (options) {
            this._super(options);
            this.ws_id = this.options.ws_id;
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

            // The "inReadOnlyMode" is the user-configurable setting for this.
            // TODO: it should be renamed to something else. It is confusing to have
            // the permanent "not writable == narrativeIsReadOnly == readonly"  setting,
            // which reflects the (during this runtime session) permanent state of the
            // narrative.
            // this.inReadOnlyMode = false;

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

            this.first_readonly = true; // still trying for first check?
            this.last_readonly_check = null; // avoid frequent checks
            // this.inReadOnlyMode = false; // user-defined override
            this.readonly_buttons = []; // list of buttons toggled
            this.readonly_params = []; // list of params toggled
            this.first_show_controls = true; // 1st panel show

            const icons = Config.get('icons');
            this.data_icons = icons.data;
            this.meth_icons = icons.methods;
            this.icon_colors = icons.colors;
            this.icon_color_mapping = icons.color_mapping;

            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);

            // Whenever the notebook gets loaded, it should rebind things.
            // This *should* only happen once, but I'm putting it here anyway.
            $([Jupyter.events]).on('notebook_loaded.Notebook', () => {
                this.rebindActionButtons();
                this.hideGeneratedCodeCells();
            });

            $(document).on('dataUpdated.Narrative', () => {
                if (Jupyter && Jupyter.notebook) {
                    // XXX: This is a hell of a hack. I hate
                    // using the 'first time' bit like this,
                    // but without some heavy rewiring, it's difficult
                    // to track when some event occurred.
                    // So, dirty bit it is.
                    try {
                        this.refreshFunctionInputs(!this.inputsRendered);
                        if (!this.inputsRendered) {
                            this.loadAllRecentCellStates();
                            this.trigger('refreshJobs.Narrative');
                        }
                    } catch (ex) {
                        console.error('Error handling dataUpdated', ex);
                    }

                    this.inputsRendered = true;
                }
            });

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

            $(document).on('createOutputCell.Narrative', (event, data) => {
                if (this.uiMode === 'view') {
                    console.warn('ignoring attempt to create output cell in view-only mode');
                    return;
                }
                const cell = Jupyter.narrative.getCellByKbaseId(data.cellId);
                const params = {
                    embed: true,
                    data: StringUtil.safeJSONStringify(data.result),
                };
                if (data.next_steps) {
                    params.next_steps = data.next_steps;
                }
                this.createOutputCell(cell, params);
            });

            $(document).on('showNextSteps.Narrative', (event, obj) => {
                this.showNextSteps(obj);
            });

            $(document).on('createViewerCell.Narrative', (event, data) => {
                // TODO: this.uiMode !== 'edit'
                if (this.uiMode === 'view') {
                    console.warn('ignoring attempt to create viewer cell in view-only mode');
                    return;
                }
                this.createViewerCell(data.nearCellIdx, data, data.widget);
            });

            // Global functions for setting icons
            $(document).on('setDataIcon.Narrative', (e, param) => {
                this.setDataIcon(param.elt, param.type, param.stacked, param.indent);
            });

            this.initReadOnlyElements();

            // Not sure about this assymetry. The assumption I guess is that everything
            // defaults to read-write mode, and we only need to "enter" read-only mode
            // if need be. However, this is probably what leads to the flashing of the ui
            // when opening read-only narratives. A better design would be to have nothing
            // or only neutral components rendered, and then to enter edit mode or view mode.
            if (this.narrativeIsReadOnly) {
                this.enterReadOnlyMode();
            }

            this.initDeleteCellModal();
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
            var $doCopyBtn = $('<button>')
                .addClass('kb-primary-btn')
                .append('Copy')
                .click((e) => {
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

        initDeleteCellModal: function () {
            this.$deleteCellModalBody = $('<div>');

            const buttonList = [
                $('<button>')
                    .addClass('btn btn-default')
                    .attr('data-dismiss', 'modal')
                    .append('Cancel'),

                $('<button>')
                    .addClass('btn btn-danger')
                    .attr('data-dismiss', 'modal')
                    .append('Delete')
                    .click((e) => {
                        if (this.cellToDelete !== undefined && this.cellToDelete !== null) {
                            const cell = Jupyter.notebook.get_cell(this.cellToDelete);
                            const removeId = $(cell.element).find('[id^=kb-cell-]').attr('id');
                            this.trigger('cancelJobCell.Narrative', removeId, false);
                            Jupyter.notebook.delete_cell(this.cellToDelete);
                            this.cellToDelete = null;
                        }
                    }),
            ];
            this.$deleteCellModal = new BootstrapDialog({
                title: 'Delete Cell and Job?',
                body: this.$deleteCellModalBody,
                closeButton: false,
                buttons: buttonList,
                enterToTrigger: true,
            });
        },

        showDeleteCellModal: function (index, cell, message) {
            if (cell && cell.metadata[this.KB_CELL]) {
                this.cellToDelete = index;
                if (message) {
                    this.$deleteCellModalBody.empty().html(message);
                }
                this.$deleteCellModal.show();
            }
        },

        buildAppCodeCell: function (spec, tag, parameters) {
            if (!spec || !spec.info) {
                console.error('ERROR build method code cell: ', spec, tag);
                alert('Sorry, could not find this method');
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

            const cellType = this.determineMethodCellType(spec);

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
        determineMethodCellType: function (spec) {
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

        /**
         * @method buildAppCell
         * @param {Object} method -
         * @public
         */
        buildAppCell: function (method) {
            const cell = Jupyter.narrative.insertAndSelectCellBelow('markdown');
            // cell.celltoolbar.hide();

            // make this a function input cell, as opposed to an output cell
            this.setMethodCell(cell, method);

            // THIS IS WRONG! FIX THIS LATER!
            // But it should work for now... nothing broke up to this point, right?
            // basically, we need a count of which cell id this should be.
            // but since we're using uuids, it should be safe.
            const cellIndex = Jupyter.notebook.ncells() - 1;
            const cellId = 'kb-cell-' + cellIndex + '-' + StringUtil.uuid();

            // The various components are HTML STRINGS, not jQuery objects.
            // This is because the cell expects a text input, not a jQuery input.
            // Yeah, I know it's ugly, but that's how it goes.
            const cellContent =
                "<div id='" +
                cellId +
                "'></div>" +
                '\n<script>' +
                "require(['kbaseNarrativeMethodCell'], function(kbaseNarrativeMethodCell) {" +
                "var w = new kbaseNarrativeMethodCell($('#" +
                cellId +
                "'), {'method' : '" +
                StringUtil.safeJSONStringify(method) +
                "', 'cellId' : '" +
                cellId +
                "'});" +
                '});' +
                '</script>';

            cell.set_text(cellContent);
            cell.rendered = false;
            cell.render();

            // restore the input widget's state.
            this.removeCellEditFunction(cell);
        },

        /**
         * A TEMPORARY FUNCTION that should refresh and update the given cell's metadata to the new(er) version,
         * if it needs to happen.
         * should be the structure:
         * {
         *     'kb-cell': {
         *         'type' : 'function_input' | 'function_output',
         *         'method' : object (if input cell),
         *         'widget' : <widget name>
         *         'widget_state' : [array of states]
         *     }
         * }
         */
        checkCellMetadata: function (cell) {
            if (cell.metadata[this.KB_CELL]) {
                // if that top-level one is a string, it'll probably be an output cell, so make it one.
                if (typeof cell.metadata[this.KB_CELL] === 'string') {
                    const newMeta = {};
                    newMeta[this.KB_TYPE] = this.KB_OUTPUT_CELL;
                    newMeta['widget'] = undefined;
                    newMeta[this.KB_STATE] = [];
                    cell.metadata[this.KB_CELL] = newMeta;
                } else if (typeof cell.metadata[this.KB_CELL] === 'object') {
                    // The "old" version (i.e. at the beginning of the workshop starting 1/6/2013)
                    // just needs to make sure the input cells have the widget state as an array.
                    // AND it should store the widget name, as found in the method, as a separate field.

                    if (cell.metadata[this.KB_CELL][this.KB_TYPE] === this.KB_FUNCTION_CELL) {
                        if (!cell.metadata[this.KB_CELL]['widget']) {
                            cell.metadata[this.KB_CELL]['widget'] =
                                cell.metadata[this.KB_CELL]['method'].properties.widgets.input ||
                                this.defaultInputWidget;
                        }
                        if (!cell.metadata[this.KB_CELL][this.KB_STATE]) {
                            cell.metadata[this.KB_CELL][this.KB_STATE] = [];
                            if (cell.metadata[this.KB_CELL]['input_state']) {
                                cell.metadata[this.KB_CELL][this.KB_STATE].unshift({
                                    time: 0,
                                    state: cell.metadata[this.KB_CELL]['input_state'],
                                });
                            }
                        } else if (
                            Object.prototype.toString.call(
                                cell.metadata[this.KB_CELL][this.KB_STATE]
                            ) !== '[object Array]'
                        ) {
                            cell.metadata[this.KB_CELL][this.KB_STATE] = [
                                {
                                    time: 0,
                                    state: cell.metadata[this.KB_CELL][this.KB_STATE],
                                },
                            ];
                        }
                    }
                }
            }
        },

        /**
         * Refreshes any function inputs to sync with workspace data.
         * Since this re-renders the cell, it must rebind all buttons, too.
         * Kind of annoying, but it should run quickly enough.
         *
         * Also checks to see if that cell has any parameter state associated
         * with it, and if so, sends that to the widget.
         * @private
         */
        refreshFunctionInputs: function (fullRender) {
            if (Jupyter && Jupyter.notebook) {
                const cells = Jupyter.notebook.get_cells();
                for (let i = 0; i < cells.length; i++) {
                    const cell = cells[i];
                    if (this.isFunctionCell(cell)) {
                        const method = cell.metadata[this.KB_CELL].method;
                        // legacy cells.
                        if (method.properties) {
                            const inputWidget =
                                method.properties.widgets.input || this.defaultInputWidget;

                            if (fullRender) {
                                cell.rendered = false;
                                cell.render();

                                this.loadRecentCellState(cell);
                                this.bindActionButtons(cell);
                            } else {
                                $(cell.element).find('#inputs')[inputWidget]('refresh');
                            }
                        } else {
                            $(cell.element)
                                .find('div[id^=kb-cell-]')
                                .kbaseNarrativeMethodCell('refresh');
                        }
                    } else if (this.isAppCell(cell)) {
                        $(cell.element).find('div[id^=kb-cell-]').kbaseNarrativeAppCell('refresh');
                    }
                }
            }
        },

        /**
         * Checks if the given method object has a minimally valid structure.
         * Each method needs the following properties:
         * title - string, the title of the method (required non-empty)
         * service - string, the service where the method came from (required non-empty)
         * description - string, the description of the method
         * properties - object, contains parameters for the method
         * properties.parameters - object, essentially a list of parameters for the method
         *
         * @param {object} method - the method to validate
         * @private
         */
        validateMethod: function (method) {
            // if no title, return false
            if (!method.hasOwnProperty('title') || method.title.length == 0) return false;

            // if no service, return false
            if (!method.hasOwnProperty('service') || method.service.length == 0) return false;

            // if no properties, or it's not an object, return false
            if (!method.hasOwnProperty('properties') || typeof method.properties !== 'object')
                return false;

            if (
                !method.properties.hasOwnProperty('parameters') ||
                typeof method.properties.parameters !== 'object'
            )
                return false;

            return true;
        },

        /**
         * @method removeCellEditFunction
         * Removes the ability to edit a markdown cell by double-clicking or pressing Enter.
         * Handy for dealing with KBase function or output cells.
         * @param cell - the cell to modify.
         * @private
         */
        removeCellEditFunction: function (cell) {
            return;
            // remove its double-click and return functions. sneaky!
            $(cell.element).off('dblclick');
            $(cell.element).off('keydown');
            $(cell.element).on('click', () => {
                Jupyter.narrative.disableKeyboardManager();
            });
        },

        /**
         * @method bindActionButtons
         * Binds the action (delete and run) buttons of a function cell.
         * This requires the cell to have {'kb-cell' : 'function'} in its metadata, otherwise it's ignored.
         * @param cell - the Jupyter Notebook cell with buttons to be bound.
         * @private
         */
        bindActionButtons: function (cell) {
            // get the cell.
            // look for the two buttons.
            // bind them to the right actions.
            if (this.isFunctionCell(cell)) {
                $(cell.element).find('.buttons [id*=delete]').off('click');
                $(cell.element).find('.buttons [id*=delete]').click(this.bindDeleteButton());
                $(cell.element).find('.buttons [id*=run]').off('click');
                $(cell.element).find('.buttons [id*=run]').click(this.bindRunButton());
            }
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
         * If read-only status has changed (or this is the
         * first time checking it) then update the read-only
         * state of the narrative.
         *
         * @param ws Workspace client
         * @param name Workspace name
         *
         * Side-effects: modifies this.narrativeIsReadOnly to reflect current value.
         */
        updateReadOnlyMode: function (ws, name, callback) {
            this.checkReadOnly(
                ws,
                name,
                $.proxy(function (readonly) {
                    if (readonly != null) {
                        if (this.narrativeIsReadOnly != readonly) {
                            if (this.narrativeIsReadOnly == null && readonly == false) {
                                // pass: first time, and it is the default read/write
                            } else if (readonly == true) {
                                this.enterReadOnlyMode();
                                $('#kb-view-mode').css({
                                    display: 'none',
                                });
                            } else {
                                this.readWriteMode();
                                $('#kb-view-mode').css({
                                    display: 'inline-block',
                                });
                            }
                            this.narrativeIsReadOnly = readonly;
                        }
                        // if this is the first time we got a yes/no answer
                        // from the workspace, make the narrative visible!
                        if (this.first_readonly) {
                            // show narrative by removing overlay
                            this.first_readonly = false;
                        }
                    }
                    if (callback) {
                        callback(this.narrativeIsReadOnly);
                    }
                }, this)
            );
            return this.narrativeIsReadOnly;
        },

        /** Check if narrative is read-only.
         *
         * @param ws Workspace client
         * @param name Workspace name
         * @param callback Call this with one argument, whose value is
         *          true if it is readonly
         *          false if it is read/write
         *          null if workspace service error or null, or if this
         *               check is too soon after the last one
         */
        checkReadOnly: function (ws, name, callback) {
            // console.debug("check_readonly_mode.begin");
            // stop if no workspace client
            if (ws == null) {
                return callback(null);
            }
            // stop if this is too-soon after last check
            const sec = new Date() / 1000; // will use this either way
            if (this.last_readonly_check != null) {
                const delta = sec - this.last_readonly_check;
                if (delta < 60) {
                    return callback(null);
                }
            }
            // update the last check time
            this.last_readonly_check = sec;
            // check the workspace, and invoke callback with result
            ws.get_workspace_info(
                {
                    workspace: name,
                },
                (info) => {
                    let is_ro = true;
                    if (info[5] == 'w' || info[5] == 'a') {
                        is_ro = false;
                    }
                    Jupyter.narrative.readonly = is_ro; // set globally
                    return callback(is_ro);
                },
                (error) => {
                    KBError(
                        'kbaseNarrativeWorkspace.checkReadOnly',
                        'get_workspace_info had an error for ID=' + name + ': ' + error
                    );
                    return callback(null);
                }
            );
        },

        /**
         * List of selectors to toggle for read-only mode.
         *
         * @returns {string[]}
         */
        getReadOnlySelectors: function () {
            return [
                '.kb-app-next', // next steps
                '#kb-add-code-cell',
                '#kb-add-md-cell', // edit btns
                '#kb-share-btn',
                '#kb-save-btn', // action btns
                '#kb-ipy-menu', // kernel
                '.kb-cell-toolbar .buttons.pull-right', // Jupyter icons
                '.kb-title .btn-toolbar .btn .fa-arrow-right', // data panel slideout
            ];
        },

        /**
         * Toggle the run/cancel/reset buttons on and off,
         * saving them in this.readonly_buttons when they are turned off.
         *
         * @param on If true, turn them on; else turn them off
         */
        toggleRunButtons: function (on) {
            const classes = [
                '.kb-app-run',
                '.kb-method-run',
                'span.pull-right.kb-func-timestamp span>span',
            ];
            if (on) {
                _.map(this.readonly_buttons, (b) => {
                    b.show();
                });
                this.readonly_buttons = []; // don't do it twice
            } else {
                const ro = [];
                _.map(classes, (c) => {
                    _.map($(c), (b) => {
                        const $btn = $(b);
                        if ($btn.css('display') != 'none') {
                            // it is visible, so hide it and remember it
                            ro.push($btn);
                            $btn.hide();
                        }
                    });
                });
                this.readonly_buttons = ro;
            }
        },

        /**
         * Toggle the parameter select boxes on and off,
         * saving them in this.readonly_buttons when they are turned off.
         *
         * @param on {bool} If true, turn them on; else turn them off
         */
        toggleSelectBoxes: function (on) {
            const disabled = 'select2-container-disabled';
            if (on) {
                _.map(this.readonly_params, ($c) => {
                    $c.removeClass(disabled);
                });
            } else {
                const params = [];
                _.map($('.select2-container'), (c) => {
                    if (!$(c).hasClass(disabled)) {
                        params.push($(c));
                        $(c).addClass(disabled);
                    }
                });
                this.readonly_params = params;
            }
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
            _.map(this.getReadOnlySelectors(), (id) => {
                $(id).hide();
            });
            this.toggleRunButtons(false);
            this.toggleSelectBoxes(false);
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
         *
         */
        enterReadWriteMode: function () {
            // Huh? This should never occur.
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
            this.toggleRunButtons(true);
            this.toggleSelectBoxes(true);
            this.toggleCellEditing(true);

            // re-enable auto-save status
            $('#autosave_status').show();
            _.map(this.getReadOnlySelectors(), (id) => {
                $(id).show();
            });

            Jupyter.narrative.toggleSidePanel(false);
        },

        /**
         * Connect two elements with a 'line'.
         *
         * Args:
         *   p - Top element
         *   q - Bottom element
         *   g - Left gutter width, in pixels
         *   w - Line width, in pixels
         *   container - Containing element for line
         *   line_class - CSS class for line elements (for coloring)
         */
        connect: function (p, q, g, w, container, line_class) {
            const pc = $(p).position();
            const qc = $(q).position();
            const py = pc.top + (p.height() - w) / 2.0;
            const qy = qc.top + (q.height() - w) / 2.0;
            const coords = [
                {
                    left: g,
                    top: py,
                    width: pc.left - g,
                    height: w,
                },
                {
                    left: g,
                    top: py + w,
                    width: w,
                    height: qy - py,
                },
                {
                    left: g,
                    top: qy,
                    width: qc.left - g,
                    height: w,
                },
            ];
            for (let i = 0; i < 3; i += 1) {
                const $elt = $('<div>')
                    .addClass(line_class)
                    .attr('id', 'kb-line' + i);
                $elt.css(coords[i]);
                container.append($elt);
            }
        },

        /**
         * Activate "normal" R/W mode
         */
        activateReadwriteMode: function () {},

        /**
         * Once the notebook is loaded, all code cells with generated code
         * (e.g. the placeholder, provenance cells) should be hidden.
         * At least for now.
         * So this function does that.
         * @private
         */
        hideGeneratedCodeCells: function () {
            const cells = Jupyter.notebook.get_cells();
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (this.isFunctionCodeCell(cell)) cell.element.css('display', 'none');
            }
        },

        // Function input cell type.
        isFunctionCell: function (cell) {
            return this.checkCellType(cell, this.KB_FUNCTION_CELL);
        },

        isAppCell: function (cell) {
            return this.checkCellType(cell, this.KB_APP_CELL);
        },

        setFunctionCell: function (cell, method) {
            const cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_FUNCTION_CELL;
            cellInfo['method'] = method;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = method.properties.widgets.input || this.defaultInputWidget;

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        setMethodCell: function (cell, method) {
            const cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_FUNCTION_CELL;
            cellInfo['method'] = method;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = method.widgets.input || this.defaultInputWidget;

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        setAppCell: function (cell, appInfo) {
            const cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_APP_CELL;
            cellInfo['app'] = appInfo;
            cellInfo[this.KB_STATE] = [];

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        // Function output cell type.
        isOutputCell: function (cell) {
            return this.checkCellType(cell, this.KB_OUTPUT_CELL);
        },

        setOutputCell: function (cell, widget) {
            const cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_OUTPUT_CELL;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = widget;

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        setErrorCell: function (cell) {
            const cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_ERROR_CELL;
            cell.metadata[this.KB_CELL] = cellInfo;
        },

        // Backup function code cell type (usually hidden through css... I still think this is superfluous)
        isFunctionCodeCell: function (cell) {
            return this.checkCellType(cell, this.KB_CODE_CELL);
        },

        setCodeCell: function (cell) {
            const cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_CODE_CELL;
            cell.metadata[this.KB_CELL] = cellInfo;
        },

        checkCellType: function (cell, type) {
            return (
                cell.metadata &&
                cell.metadata[this.KB_CELL] &&
                cell.metadata[this.KB_CELL][this.KB_TYPE] === type
            );
        },

        /**
         * Saves a cell's state into its metadata.
         * This includes marking that state with a timestamp.
         * We might need to add more stuff as well, but this is a start.
         * Mostly, it gathers the state from the cell's widget (if it has one) and puts it together
         * with the timestamp.
         * {
         *    state: <cell state>,
         *    time: <timestamp in ms since the epoch>,
         * }
         * This is prepended to the front - so the most recent state is the first element of the array.
         */
        saveCellState: function (cell) {
            // ignore it if it isn't a KBase cell with a widget state to save.
            if (!this.isFunctionCell(cell) && !this.isOutputCell(cell) && !this.isAppCell(cell))
                return;

            let target = 'div[id^=kb-cell-]';
            let widget;

            if (this.isFunctionCell(cell)) {
                const method = cell.metadata[this.KB_CELL].method;
                // older way
                if (method.properties) {
                    widget =
                        cell.metadata[this.KB_CELL].method.properties.widgets.input ||
                        this.defaultInputWidget;
                    target = '#inputs';
                } else {
                    widget = 'kbaseNarrativeMethodCell';
                }
            } else if (this.isOutputCell(cell)) {
                // do output widget stuff.

                widget = 'kbaseNarrativeOutputCell';
            } else if (this.isAppCell(cell)) {
                widget = 'kbaseNarrativeAppCell';
            }

            try {
                let state;
            } catch (error) {
                this.dbg('Unable to save state for cell:');
                this.dbg(cell);
            }
        },

        /**
         * Loads the most recent cell state (i.e. the top of the stack) of the given cell.
         * If that state is undefined (or if the state array is undefined or not an array), nothing is done.
         * @param {Object} cell - the cell to fetch the most recent cell state from
         * @returns the most recent cell state, in whatever form that state takes (scalar, array, object, etc.)
         * @private
         */
        loadRecentCellState: function (cell) {
            const state = this.getRecentState(cell);
            if (state) {
                let target = 'div[id^=kb-cell-]';
                let widget;

                // if it's labeled as a function cell do that.
                if (this.isFunctionCell(cell)) {
                    const method = cell.metadata[this.KB_CELL].method;
                    // older way
                    if (method.properties) {
                        widget =
                            cell.metadata[this.KB_CELL].method.properties.widgets.input ||
                            this.defaultInputWidget;
                        target = '#inputs';
                    } else {
                        widget = 'kbaseNarrativeMethodCell';
                    }
                }
                // if it's labeled as an output cell do that.
                else if (this.isOutputCell(cell)) {
                    // get the output cell's target and widget.
                    // eventually, we should probably just update the cells to the new version
                    // but this should sort out any backward compatibility issues for now.

                    const cellText = cell.get_text();
                    const capture = cellText.match(
                        /<script>\$\([\"\'](.+)[\"\']\)\.(\w+)\(.+\);<\/script>/
                    );
                    if (capture) {
                        target = capture[1];
                        widget = capture[2];
                    }
                } else if (this.isAppCell(cell)) {
                    widget = 'kbaseNarrativeAppCell';
                }
                // it might not be either! if we don't have both a target and widget, don't do anything!
                if (target && widget) {
                    try {
                        const widget_mapping = {
                            kbaseNarrativeOutputCell: kbaseNarrativeOutputCell,
                            kbaseTabs: kbaseTabs,
                        };

                        const $widget = new widget_mapping[widget]($(cell.element).find(target));
                        if ($widget.prototype.loadState) {
                            $widget.loadState(state.state);
                            // later, do something with the timestamp.
                        }
                    } catch (err) {
                        // just ignore it and move on.
                    }
                }
            }
        },

        /**
         * Returns the entire state array from the given cell.
         * If there is not an array present, or if the state object is not an array, then an empty list is returned.
         * @param {Object} cell - the cell to fetch the state array from
         * @returns {Array} an array of states for that cell
         * @private
         */
        getCellStateArray: function (cell) {
            if (this.isFunctionCell(cell) || this.isOutputCell(cell)) {
                const stateArr = cell.metadata[this.KB_CELL][this.KB_STATE];
                // if it's an array, return it.
                if (Object.prototype.toString.call(stateArr) === '[object Array]') return stateArr;
            }
            // if the cell doesn't have a state array, or if it's NOT an array, return the empty array.
            return [];
        },

        /**
         * Saves the state of all cells into their respective arrays.
         * @public
         */
        saveAllCellStates: function () {
            const cells = Jupyter.notebook.get_cells();
            $.each(
                cells,
                $.proxy(function (idx, cell) {
                    this.saveCellState(cell);
                }, this)
            );
        },

        /**
         * Loads the most recently saved state into all cells.
         * @public
         */
        loadAllRecentCellStates: function () {
            const cells = Jupyter.notebook.get_cells();
            $.each(cells, (idx, cell) => {
                this.loadRecentCellState(cell);
            });
        },

        /**
         * Fetches the most recent cell state. If the cell state is an array, it gets the first element,
         * if it's NOT an array, it just returns that state.
         * This *should* make things still functional for the older (non-array-based) stateful cells.
         * XXX: eventually update this to just array, once we're out of dev-panic-mode and closer to production.
         */
        getRecentState: function (cell) {
            let state;
            if (this.isFunctionCell(cell) || this.isOutputCell(cell) || this.isAppCell(cell)) {
                const stateList = cell.metadata[this.KB_CELL][this.KB_STATE];
                if (Object.prototype.toString.call(stateList) === '[object Array]')
                    state = stateList[0];
                else state = stateList;
            }
            return state;
        },

        /**
         * @method bindRunButton
         * @private
         */
        bindRunButton: function () {
            const self = this;
            return function (event) {
                event.preventDefault();
                // get the cell
                const cell = Jupyter.notebook.get_selected_cell();

                // get a 'handle' (really just the invocable name) of the input widget
                const inputWidget =
                    cell.metadata[self.KB_CELL].method.properties.widgets.input ||
                    self.defaultInputWidget;

                // get the list of parameters and save the state in the cell's metadata
                const paramList = $(cell.element).find('#inputs')[inputWidget]('getParameters');
                self.saveCellState(cell);

                // Run the method.
                const method = cell.metadata[self.KB_CELL].method;
                self.runCell()(cell, method.service, method.title, paramList);
                $(cell.element)
                    .find('#last-run')
                    .html('Last run: ' + TimeFormat.readableTimestamp(self.getTimestamp()));
            };
        },

        /**
         * @method deleteCell
         * @private
         */

        /*
         * The new delete cell
         * Delete cell needs to honor the new cells, but since we are using the
         * new nb extension mechanism, and may have arbitrary cell types, we
         * just look to see if it is indeed a kbase cell, and if so we punt
         * to it.
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
                            if (kbaseCellType && !cellId) {
                                console.warn(
                                    'KBase cell without cell id, DELETING ANYWAY!',
                                    cell.metadata
                                );
                            }
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

        xdeleteCell: function (index) {
            if (index !== undefined && index !== null) {
                const cell = Jupyter.notebook.get_cell(index);
                if (cell) {
                    // if it's a kbase method or app cell, trigger a popup
                    if (cell.metadata[this.KB_CELL]) {
                        let widget = null; // default is app cell
                        let state = 'input'; // default is input... also doubles as a proxy for output cells
                        if (this.isFunctionCell(cell)) {
                            widget = 'kbaseNarrativeMethodCell';
                        } else if (this.isAppCell(cell)) {
                            widget = 'kbaseNarrativeAppCell';
                        }
                        if (widget) {
                            state = $(cell.element)
                                .find('div[id^=kb-cell-]')
                                [widget]('getRunningState');
                        }

                        if (state === 'input') {
                            Jupyter.notebook.delete_cell(index);
                            return;
                        } else {
                            // if it's running, say so, and say it'll stop and delete the job
                            // if it's done, say it'll clear the associated job, but won't delete data
                            // if it's error, say it'll delete the assoc'd job

                            const stateWarning =
                                'Deleting this cell will also delete any associated job. ' +
                                'Any generated data will be retained. Continue?';

                            this.showDeleteCellModal(index, cell, stateWarning);
                        }
                    } else {
                        Jupyter.notebook.delete_cell(index);
                    }
                }
            }
        },

        /**
         * @method bindDeleteButton
         * @private
         */
        bindDeleteButton: function () {
            return function (event) {
                event.preventDefault();
                const idx = Jupyter.notebook.get_selected_index();
                Jupyter.notebook.delete_cell(idx);
            };
        },

        /**
         * @method rebindActionButtons
         * Rebinds all the run buttons to their original function.
         * This iterates over all cells, looking for a 'kb-cell' field in its metadata.
         * If it finds it, it removes the double-click and keyboard-enter abilities from the cell.
         * If that 'kb-cell' field === 'function', it rebinds the delete and run buttons as well.
         *
         * @public
         */
        rebindActionButtons: function () {
            if (!(Jupyter && Jupyter.notebook)) return;

            // Rewrite the following to iterate using the Jupyter cell
            // based methods instead of DOM objects

            const cells = Jupyter.notebook.get_cells();

            // not using $.each because its namespacing kinda screws things up.
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                const cellType = cell.metadata[this.KB_CELL];
                if (cellType) {
                    this.removeCellEditFunction(cell);
                    if (this.isFunctionCell(cell)) {
                        // added to only update the built-in non-widgetized function cells
                        if (cell.metadata[this.KB_CELL].method.properties) {
                            // cheat to see if it's an old one!
                            this.bindActionButtons(cell);
                        }
                    }
                }
            }
        },

        /**
         * Run a function cell
         * The cell should contain all the information it needs to run.
         *
         * @param {Object} cell - the cell that needs to be run
         * @param {}
         * @private
         */
        runCell: function () {
            const self = this;
            return function (cell, service, method, params) {
                const nb = Jupyter.notebook;

                const callbacks = {
                    shell: {
                        reply: function (content) {
                            self.handleExecuteReply(cell, content);
                        },
                        payload: {
                            set_next_input: function (content) {
                                self.handleSetNextInput(cell, content);
                            },
                        },
                    },
                    iopub: {
                        output: function (content) {
                            self.handleOutput(cell, content);
                        },
                        clear_output: function (content) {
                            self.handleClearOutput(cell, content);
                        },
                    },
                    input: function (content) {
                        self.handleInputRequest(cell, content);
                    },
                };

                const executeOptions = {
                    silent: true,
                    user_expressions: {},
                    allow_stdin: false,
                    store_history: false,
                };

                const code = self.buildRunCommand(service, method, params);

                $(cell.element).find('#kb-func-progress').css({
                    display: 'block',
                });
                nb.kernel.execute(code, callbacks, executeOptions);
            };
        },

        buildGenericRunCommand: function (data) {
            const methodJSON = StringUtil.safeJSONStringify(data.method);
            const paramsJSON = StringUtil.safeJSONStringify(data.parameters);

            return (
                'import biokbase.narrative.common.service as Service\n' +
                "method = Service.get_service('generic_service').get_method('method_call')\n" +
                "method('" +
                methodJSON +
                "', '" +
                paramsJSON +
                "')"
            );
        },

        /**
         * Stitches together the command needed to run a method in the Jupyter kernel.
         * It is assumed that params is a list, with all values in the right order.
         * @param {String} service - the registered service name
         * @param {String} method - the registered method name
         * @param {Array} params - a list of parameter values
         * @returns {String} the constructed Jupyter kernel command
         * @private
         */
        buildRunCommand: function (service, method, params) {
            // very nice quote-escaper found here:
            // http://stackoverflow.com/questions/770523/escaping-strings-in-javascript
            // and
            // http://phpjs.org/functions/addslashes/
            const addSlashes = function (str) {
                return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
            };

            const escService = addSlashes(service);
            const escMethod = addSlashes(method);
            let cmd =
                'import biokbase.narrative.common.service as Service\n' +
                "method = Service.get_service('" +
                escService +
                "').get_method('" +
                escMethod +
                "')\n";

            const paramList = params.map((p) => {
                return "'" + addSlashes(p) + "'";
            });
            cmd += 'method(' + paramList + ')';

            return cmd;
        },

        /**
         * Make JS dict into Python dict (string)
         */
        _pythonDict: function (data) {
            let dict = '{';
            $.each(data, function (key, value) {
                dict += "'" + key + "': ";
                // XXX: assume either more maps or simple type
                const vtype = typeof value;
                switch (vtype) {
                    case 'boolean':
                        if (value) dict += 'True';
                        else dict += 'False';
                        break;
                    case 'number':
                        dict += value;
                        break;
                    case 'string':
                        dict += "'" + value + "'";
                        break;
                    case 'undefined':
                        dict += 'None';
                        break;
                    case 'object':
                        dict += this._pythonDict(value);
                        break;
                    default:
                        console.error('Cannot convert to Python:', vtype);
                }
                dict += ', ';
            });
            return dict + '}';
        },

        /* ------------------------------------------------------
         * Functions to handle running code.
         */
        /**
         * @method _handle_execute_reply
         * @private
         */
        handleExecuteReply: function (cell, content) {
            this.dbg('[handleExecuteReply]');
            this.dbg(content);

            /* This catches and displays any errors that don't get piped through
             * the back-end service.py mechanism.
             * Any code that makes it that far gets reported through the output
             * mechanism and ends here with an 'ok' message.
             */
            if (content.content.status === 'error') {
                const errorBlob = {
                    msg: content.content.evalue,
                    type: content.content.ename,
                };

                if (
                    cell &&
                    cell.metadata &&
                    cell.metadata['kb-cell'] &&
                    cell.metadata['kb-cell'].method
                )
                    errorBlob.method_name = cell.metadata['kb-cell'].method.title;

                const removeVt = function (line) {
                    return line.replace(/\[\d+(;\d+)?m/g, '');
                };

                const errTb = content.content.traceback.map((line) => {
                    return {
                        filename: null,
                        function: null,
                        line: null,
                        text: removeVt(line),
                    };
                });

                errorBlob.traceback = errTb;
                this.createOutputCell(cell, '{"error" :' + JSON.stringify(errorBlob) + '}', true);
            }
            this.showCellProgress(cell, 'DONE', 0, 0);
            $([Jupyter.events]).trigger('set_dirty.Notebook', {
                value: true,
            });
        },
        /**
         * @method _handle_set_next_input
         * @private
         */
        handleSetNextInput: function (cell, text) {
            const data = {
                cell: this,
                text: text,
            };
            $([Jupyter.events]).trigger('set_next_input.Notebook', data);
        },
        /**
         * @method _handle_input_request
         * @private
         */
        handleInputRequest: function (cell, content) {
            this.dbg('handle input request called');
            return;
        },
        /**
         * @method _handle_clear_output
         * @private
         */
        handleClearOutput: function (cell, content) {
            this.dbg('handle clear output called');
            return;
        },

        /**
         * @method _handle_output
         */
        handleOutput: function (cell, content, showOutput, callingWidget) {
            this.dbg('[handle output]');
            this.dbg(content);
            this.dbg(showOutput);

            const msgType = content.msg_type;
            let buffer = '';
            if (msgType === 'stream') {
                buffer += content.content.text;
                const lines = buffer.split('\n');
                let offs = 0,
                    done = false,
                    self = this,
                    result = '';

                $.each(lines, (index, line) => {
                    if (!done) {
                        if (line.length == 0) {
                            offs += 1; // blank line, move offset
                        } else {
                            // look for @@S, @@P, @@D, @@G, @@J, @@E, or @@A
                            const matches = line.match(/^@@([ADEGJSP])(.*)/);
                            if (matches) {
                                // if we got one
                                switch (matches[1]) {
                                    case 'S': // Start running
                                        // if we're starting, init the progress bar.
                                        break;

                                    case 'D': // Done running
                                        // were done, so hide the progress bar (wait like a second or two?)
                                        self.resetProgress(cell);
                                        break;

                                    case 'P': // Progress step
                                        var progressInfo = matches[2].split(',');
                                        if (progressInfo.length == 3) {
                                            self.showCellProgress(
                                                cell,
                                                progressInfo[0],
                                                progressInfo[1],
                                                progressInfo[2]
                                            );
                                            offs += line.length;
                                            if (index < lines.length - 1) offs += 1;
                                        } else done = true;
                                        break;

                                    case 'E': // Error while running
                                        var errorJson = matches[2];
                                        errorJson = errorJson
                                            .replace(/</g, '&lt;')
                                            .replace(/>/g, '&gt;')
                                            .replace(/\$/g, '&#36;');
                                        self.createOutputCell(
                                            cell,
                                            '{"error" :' + errorJson + '}',
                                            true
                                        );
                                        break;

                                    case 'G': // debuG message
                                        var debug = matches[2];
                                        self.dbg('[KERNEL] ' + debug);
                                        break;

                                    case 'J': // Job id register
                                        var jobId = matches[2];
                                        self.dbg('[JOB ID] ' + jobId);
                                        self.registerJobId(jobId, cell);
                                        break;

                                    case 'A': // App id register
                                        var appId = matches[2];
                                        self.dbg('[APP ID] ' + appId);
                                        self.registerJobId(appId, cell);
                                        break;

                                    default:
                                        // by default just dump it to the console
                                        self.dbg('[UNKNOWN TAG] ' + line);
                                        break;
                                }
                                return;
                            }
                            // No progress marker on non-empty line => treat as final output of program.
                            else {
                                result += line;
                                // all but the last line should have \n appended
                                if (index < lines.length - 1) {
                                    result += '\n';
                                }
                            }
                        }
                    }
                });
                if (offs > 0) {
                    // if we found progress markers, trim processed prefix from buffer
                    buffer = buffer.substr(offs, buffer.length - offs);
                }
                if (result.length > 0) {
                    if (showOutput === 'app') {
                        if (!cell.metadata[this.KB_CELL].stackTrace)
                            cell.metadata[this.KB_CELL].stackTrace = [];
                        // try to parse the result as JSON - if so, then it's a final result and we just
                        // need the 'data' field
                        try {
                            const data = JSON.parse(result);
                            if (data && typeof data === 'object')
                                cell.metadata[this.KB_CELL].stackTrace.push(data.data);
                        } catch (err) {
                            // it's NOT JSON, and we should just append it.
                            cell.metadata[this.KB_CELL].stackTrace.push(result);
                        }
                    } else if (showOutput) {
                        this.createOutputCell(cell, result);
                        // if we create an output cell, and the callingWidget is defined, then make sure we say it
                        // is complete (this is not updated for widgets with 'none' behavior otherwise)
                        if (callingWidget) {
                            if (callingWidget.changeState) callingWidget.changeState('complete');
                        }
                    }
                }
            }
        },

        /**
         * @method
         * Registers the given job id with the Narrative.
         * This stores the job id in the Narrative's metadata.
         * XXX: Should this trigger a save?
         */
        registerJobId: function (jobId, sourceCell) {
            // This is possibly the ugliest hack here. In the future, all cells should actually know their
            // fancy UUIDs. But that *might* be backwards incompatible with existing narratives that we want
            // to show off.
            //
            // Really, all cells should be "NarrativeInput" or "NarrativeOutput" widgets that wrap their actual
            // contents, and we can poke those widgets for their IDs. But that's later.
            const txt = sourceCell.get_text();
            let cellId = 'unknown';

            if (txt) cellId = $('<div>').append(txt).find('div[id^=kb-cell-]').attr('id');

            const jobInfo = {
                id: jobId,
                source: cellId,
                target: '',
                timestamp: new Date().toISOString(),
            };

            if (this.isAppCell(sourceCell)) this.trigger('registerApp.Narrative', jobInfo);
            else this.trigger('registerMethod.Narrative', jobInfo);
        },

        createViewerCell: function (cellIndex, data) {
            const placement = data.placement || 'below';
            const cellData = {
                type: 'data',
                objectInfo: data.info,
            };
            if (placement === 'above') {
                Jupyter.notebook.insert_cell_above('code', cellIndex, cellData);
            } else {
                Jupyter.notebook.insert_cell_below('code', cellIndex, cellData);
            }
        },

        /**
         * Result is an object with this structure:
         * cell = the invoking function cell.
         * result = the result data object from the Python call.
         * widget - the widget to use (if null, then use kbaseDefaultNarrativeOutput)
         * data - the object to be passed in to the widget
         * embed - if true, then embed the widget and render it.
         * Returns unique id (string) of output cell <div>
         *
         * Also triggers a save.
         */
        createOutputCell: function (cell, result, isError, widget) {
            if (typeof result === 'string' && !isError) {
                // try to parse it as JSON.
                // if we fail, then it's not something we can deal with and shouldn't
                // make an output cell from it.
                try {
                    result = JSON.parse(result);
                    if (!result || typeof result !== 'object' || result === null) return;
                } catch (err) {
                    return;
                }
            }

            // If result.embed is false,
            // or if the result doesn't have any data to put into a widget,
            // don't make a widget! Assume that this will have thrown an error somewhere
            // along the way.
            //
            // Note that an empty object is not null! So if result.data = {}, it'll still do something.
            if (!isError && (!result.embed || result.data === null || result.data === undefined)) {
                //do something.
                console.error('Unable to create output cell from supplied data object');
                console.error(result);
                return;
            }

            var widget = this.defaultOutputWidget;
            let outputTitle = '';
            let outputType = 'method';
            const data = isError ? result : result.data;

            if (this.isFunctionCell(cell)) {
                /**
                 * 2 cases here:
                 * cell.metadata['kb-cell'].method exists:
                 * it either has widgets.output (new cell)
                 * or it doesn't, and that comes from result.widget (old cell)
                 *
                 * cell.metadata[kb-cell].app exists:
                 * use default output for now
                 */
                const method = cell.metadata[this.KB_CELL].method;
                widget = result.widget;
                if (!widget) {
                    if (method.widgets && method.widgets.output) {
                        widget = method.widgets.output;
                        // if the widget is set to 'no-display', then exit without showing anything
                        if (widget === 'no-display') {
                            return;
                        }
                    } else {
                        widget = this.defaultOutputWidget;
                    }
                }
                outputTitle = method.title;
                if (!outputTitle && method.info && method.info.name) outputTitle = method.info.name;
            } else if (this.isAppCell(cell)) {
                const app = cell.metadata[this.KB_CELL].app;
                outputTitle = app.info.name || 'KBase App';
                outputType = 'app';
            }
            if (isError) {
                widget = this.errorWidget;
                outputType = 'error';
            }

            const outputCell = isError
                ? this.addErrorCell(Jupyter.notebook.find_cell_index(cell), widget)
                : this.addOutputCell(Jupyter.notebook.find_cell_index(cell), widget);

            const uuid = StringUtil.uuid();
            const outCellId = 'kb-cell-out-' + uuid;
            const outputData =
                '{"data":' +
                data +
                ', ' +
                '"type":"' +
                outputType +
                '", ' +
                '"widget":"' +
                widget +
                '", ' +
                '"cellId":"' +
                outCellId +
                '", ' +
                '"title":"' +
                outputTitle +
                '", ' +
                '"time":' +
                this.getTimestamp() +
                '}';

            cellText =
                '<div id="' +
                outCellId +
                '"></div>\n' +
                '<script>' +
                'require(["kbaseNarrativeOutputCell"], function(kbaseNarrativeOutputCell) {' +
                'new kbaseNarrativeOutputCell($("#' +
                outCellId +
                '"), ' +
                outputData +
                '); });' +
                '</script>';
            outputCell.set_text(cellText);
            outputCell.rendered = false; // force a render
            outputCell.render();
            // If present, add list of "next steps"
            if (result.next_steps) {
                if (result.next_steps.apps || result.next_steps.methods) {
                    const $body = $('#' + outCellId).find('.panel-body');
                    this.showNextSteps({
                        elt: $body,
                        next_steps: result.next_steps,
                    });
                }
            }
            this.resetProgress(cell);
            if (Jupyter && Jupyter.narrative) Jupyter.narrative.saveNarrative();
            this.trigger('updateData.Narrative');
            return outCellId;
        },

        /**
         * Show a list of suggested 'next steps' after we have finished the run.
         * The input is an object of the form:
         *   { next_steps: value is exactly the same type of object,
         *                 returned by the `getfunctionSpecs.Narrative`
         *                 trigger in `kbaseNarrativeMethodPanel`.
         *     elt: Created <div> is added with .append()
         *   }
         * Returns the <div> that was populated.
         */
        showNextSteps: function (obj) {
            const $elt = obj.elt,
                next_steps = obj.next_steps;

            // if the element already has a 'kb-app-next' div, don't add another one.
            if ($elt.has('.kb-app-next').length) return;

            const $tgt = $('<div>').addClass('kb-app-next');
            const $title = $('<h3>').text('Suggested next steps:');
            $tgt.append($title);
            // init hide/unhide behavior
            const $hide_btn = $('<span>').addClass('kb-app-next-hide').text('hide');
            const $unhide_btn = $('<span>')
                .addClass('kb-app-next-unhide')
                .text('next steps')
                .hide();
            $hide_btn.click(() => {
                // hide
                $title.hide();
                $tgt.find('a').hide();
                $hide_btn.hide();
                $unhide_btn.show();
            });
            $unhide_btn.click(() => {
                // unhide
                $title.show();
                $tgt.find('a').show();
                $unhide_btn.hide();
                $hide_btn.show();
            });
            $tgt.append($hide_btn).append($unhide_btn);
            // add all the links to the next-step apps/methods
            const $apps = $('<div>'),
                comma = {
                    v: '',
                },
                self = this;
            // iterate over apps and methods in the result
            const has_both = next_steps.apps && next_steps.methods;
            _.each(['apps', 'methods'], (mtype) => {
                if (has_both) {
                    /* XXX: prefix with (App) or something? */
                }
                const specs = next_steps[mtype];
                // Iterate over all specs in app/method section
                _.each(_.values(specs), (s) => {
                    const name = s.info.name; // readable name, displayed to user
                    const href = $('<a>')
                        .attr({
                            href: 'javascript:;',
                        })
                        .text(comma.v + name);
                    // insert app/method on click
                    href.click(() => {
                        self.trigger(mtype.slice(0, -1) + 'Clicked.Narrative', s);
                    });
                    $apps.append(href);
                    comma.v = ', ';
                });
            });
            $tgt.append($apps);
            $elt.append($tgt);
            return $tgt;
        },

        /**
         * @method resetProgress
         * @private
         * Resets the progress bar in the given cell to not show any progress or progress message.
         * @param cell - the Jupyter notebook cell to reset.
         */
        resetProgress: function (cell) {
            $(cell.element)
                .find('#kb-func-progress .kb-cell-progressbar .progress-bar')
                .css('width', '0%');
            $(cell.element).find('#kb-func-progress .text-success').text('');
        },

        /**
         * @method showCellProgress
         *
         * Shows current progress in a running Jupyter function.
         * @param cell - the cell being run
         * @param name - the text of the progress to set
         * @param done - the number of steps finished.
         * @param total - the total number of steps to go through.
         *
         * @private
         */
        showCellProgress: function (cell, name, done, total) {
            let percentDone = 0;

            const $progressBar = $(cell.element).find(
                '#kb-func-progress .kb-cell-progressbar .progress-bar'
            );
            const $progressMsg = $(cell.element).find('#kb-func-progress .text-success');
            if (name === 'DONE') {
                $progressMsg.text('Completed');
                percentDone = 100;
                $progressBar.css('width', '100%');
                $(cell.element)
                    .find('#kb-func-progress')
                    .fadeOut(
                        1000,
                        $.proxy(function () {
                            this.resetProgress(cell);
                        }, this)
                    );
            } else {
                $progressMsg.text('Step ' + done + ' / ' + total + ': ' + name);
                percentDone = (100 * done - 100) / total;
                $progressBar.css('width', percentDone + '%');
            }
        },

        /**
         * Add a new cell for output of the script.
         *
         * The cell is added below the cell in currentIndex. This position
         * should be set by the calling function to represent the position of
         * the calling function cell.
         *
         * @method _addOutputCell
         * @private
         * @return id of <div> inside cell where content can be placed
         */
        addOutputCell: function (currentIndex, widget, placement) {
            var cell;
            switch (placement) {
                case 'above':
                    cell = Jupyter.notebook.insert_cell_above('markdown', currentIndex);
                    break;
                case 'below':
                default:
                    var cell = Jupyter.notebook.insert_cell_below('markdown', currentIndex);
            }
            // cell.celltoolbar.hide();
            this.setOutputCell(cell, widget);
            this.removeCellEditFunction(cell);

            return cell;
        },

        addErrorCell: function (currentIndex) {
            const cell = Jupyter.notebook.insert_cell_below('markdown', currentIndex);
            // cell.celltoolbar.hide();
            this.setErrorCell(cell);
            this.removeCellEditFunction(cell);
            return cell;
        },

        /** Not really used right now. */
        convert_mime_types: function (json, data) {
            if (data === undefined) {
                return json;
            }
            if (data['text/plain'] !== undefined) {
                json.text = data['text/plain'];
            }
            if (data['text/html'] !== undefined) {
                json.html = data['text/html'];
            }
            if (data['image/svg+xml'] !== undefined) {
                json.svg = data['image/svg+xml'];
            }
            if (data['image/png'] !== undefined) {
                json.png = data['image/png'];
            }
            if (data['image/jpeg'] !== undefined) {
                json.jpeg = data['image/jpeg'];
            }
            if (data['text/latex'] !== undefined) {
                json.latex = data['text/latex'];
            }
            if (data['application/json'] !== undefined) {
                json.json = data['application/json'];
            }
            if (data['application/javascript'] !== undefined) {
                json.javascript = data['application/javascript'];
            }
            return json;
        },

        /* ------------------------------------------------------ */
        /* Accessors */

        workspace: function (key, value) {
            return this._accessor('_workspace', key, value);
        },

        _accessor: function (name, key, value) {
            if (this.data(name) == undefined) {
                this.data(name, {});
            }

            const obj = this.data(name);

            if (arguments.length == 2) {
                obj[key] = value;
            }

            if (arguments.length > 0) {
                return obj[key];
            } else {
                return obj;
            }
        },

        /* ------------------------------------------------------ */

        /**
         * Render the widgets.
         *
         * @returns this
         */
        render: function () {
            return Promise.try(() => {
                this.rebindActionButtons();
                this.hideGeneratedCodeCells();
                const cells = Jupyter.notebook.get_cells();
                for (let i = 0; i < cells.length; i++) {
                    this.checkCellMetadata(cells[i]);
                }
                this.loadAllRecentCellStates();
            });
        },

        /**
         * Show input/output cell connections.
         */
        show_connections: function () {
            const self = this;
            // console.debug("show_connections.start");
            _.each(_.pairs(this.connectable), (pair) => {
                const e1 = $('#kb-input-' + pair[0]);
                const e2 = $('#kb-output-' + pair[1]);
                self.connect(e1, e2, 20, 2, $('#notebook-container'), 'kb-line');
            });
            // console.debug("show_connections.end");
        },

        /**
         * Log out from all the widgets.
         *
         * @param token
         * @returns this
         */
        loggedOut: function (token) {
            if (this.dataTableWidget) this.dataTableWidget.loggedOut(token);
            (this.ws_client = null), (this.ws_auth = null);
        },

        /**
         * Initialize the logger
         */
        initLogging: function (level) {
            Logger.useDefaults();
            Logger.setLevel(level);
        },

        /**
         * Returns a timestamp in milliseconds since the epoch.
         * (This is a one-liner, but kept as a separate function in case our needs change.
         * Maybe we'll want to use UTC or whatever...)
         * @public
         */
        getTimestamp: function () {
            return new Date().getTime();
        },

        /**
         * @method
         * Scans through all cells and performs a version updating, if necessary.
         * Updates performed:
         * 1. kbaseNarrativeCell -> kbaseNarrativeMethodCell
         * 2. More to come!
         */
        scanAndUpdateCells: function () {
            const cells = Jupyter.notebook.get_cells();
            for (let i = 0; i < cells.length; i++) {
                const cell = cells[i];
                if (this.isFunctionCell(cell)) {
                    let cellText = cell.get_text();
                    const matchArr = cellText.match(
                        /(<script>\s*\$\(['"]\#(.+)['"]\)\.)kbaseNarrativeCell/
                    );
                    if (matchArr && matchArr.length >= 2) {
                        cellText = cellText.replace(
                            matchArr[0],
                            matchArr[1] + 'kbaseNarrativeMethodCell'
                        );
                    }
                    cell.set_text(cellText);
                    cell.rendered = false;
                    cell.render();
                }
            }
        },

        /**
         * Set the visual icon for a data object shown in a
         * list or panel of the narrative.
         *
         * @param $logo - Target element
         * @param type - Name of data type
         * @param stacked - If true, show "stacked" version of the icon
         *                indicating, e.g., that this is a container for
         *                multiple items. Undefined is false.
         * @param indent - Indent level (default is none)
         */
        setDataIcon: function ($logo, type, stacked, indent) {
            if (indent === undefined || indent === null) {
                indent = 0;
            }

            const icons = this.data_icons;
            const icon = _.has(icons, type) ? icons[type] : icons.DEFAULT;
            // background circle
            $logo.addClass('fa-stack fa-2x').css({
                cursor: 'pointer',
            });
            // For 'stacked' (set) icons, add a shifted-over
            // circle first, as the bottom layer, then also add a border
            // to the top one.
            const circle_classes = 'fa fa-circle fa-stack-2x';
            const circle_color = this.logoColorLookup(type);
            const cmax = function (x) {
                return x > 255 ? 255 : x;
            };
            if (stacked) {
                let parsed_color, r, g, b;
                const cstep = 20; // color-step for overlapped circles
                const num_stacked_circles = 1; // up to 2
                // XXX: Assume color is in form '#RRGGBB'
                if (circle_color[0] == '#') {
                    parsed_color = circle_color.match(/#(..)(..)(..)/);
                    r = parseInt(parsed_color[1], 16);
                    g = parseInt(parsed_color[2], 16);
                    b = parseInt(parsed_color[3], 16);
                }
                // XXX: Assume color is in form "rgb(#,#,#)"
                else {
                    parsed_color = circle_color.match(
                        /rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/
                    );
                    r = parsed_color[1];
                    g = parsed_color[2];
                    b = parsed_color[3];
                }
                // Add circles with lighter colors
                for (let i = num_stacked_circles; i > 0; i--) {
                    const stacked_color =
                        'rgb(' +
                        cmax(r + i * cstep) +
                        ',' +
                        cmax(g + i * cstep) +
                        ',' +
                        cmax(b + i * cstep) +
                        ')';
                    $logo.append(
                        $('<i>')
                            .addClass(circle_classes + ' kb-data-list-logo-shiftedx' + i)
                            .css({ color: stacked_color })
                    );
                    $logo.append(
                        $('<i>')
                            .addClass(circle_classes + ' kb-data-list-logo-shifted' + i)
                            .css({ color: 'white' })
                    );
                }
            }
            // Assume there are CSS rules for levels of indent we care about..
            if (indent > 0) {
                $logo.addClass('kb-data-list-level1');
            } else if ($logo.hasClass('kb-data-list-level1')) {
                $logo.removeClass('kb-data-list-level1');
            }

            $logo.append($('<i>').addClass(circle_classes).css({ color: circle_color }));
            // to avoid repetition, define the func. here that will
            // add one set of icons
            const add_logo_func = function (fa_icon, $logo, cls) {
                $logo.append($('<i>').addClass(fa_icon + ' fa-inverse fa-stack-1x ' + cls));
            };
            if (this.isCustomIcon(icon)) {
                // add custom icons (more than 1 will look weird, though)
                _.each(icon, (cls) => {
                    add_logo_func('icon', $logo, cls);
                });
            } else {
                // add stack of font-awesome icons
                _.each(icon, (cls) => {
                    add_logo_func('fa', $logo, cls);
                });
            }
        },

        /**
         * Whether the stack of icons is using font-awesome
         * or our own custom set.
         *
         * @param icon_list {list of str} Icon classes, from icons.json
         * @returns {boolean}
         */
        isCustomIcon: function (icon_list) {
            return (
                icon_list.length > 0 &&
                icon_list[0].length > 4 &&
                icon_list[0].substring(0, 4) == 'icon'
            );
        },

        /**
         * Get color for data or method icon.
         * @param type
         * @returns {string} Color code
         */
        logoColorLookup: function (type) {
            let color = this.icon_color_mapping[type];
            if (color === undefined) {
                // fall back to primitive hack that just guesses
                let code = 0;
                for (let i = 0; i < type.length; code += type.charCodeAt(i++));
                color = this.icon_colors[code % this.icon_colors.length];
            }
            return color;
        },
    });
});
