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

(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeWorkspace',
        parent: 'kbaseWidget',
        version: '1.0.0',
        options: {
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            tableElem: null,
            controlsElem: null,
            ws_id: null,
            methodStoreURL: 'https://kbase.us/services/narrative_method_store',
        },
        ws_client: null,
        ws_id: null,
        defaultOutputWidget: "kbaseDefaultNarrativeOutput",
        defaultInputWidget: "kbaseDefaultNarrativeInput",
        errorWidget: "kbaseNarrativeError",
        connectable: {},

        inputsRendered: false,
        maxSavedStates: 2,      // limit the states saved to 2 for now.
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
        ignoredDataTypes : {
            'string' : 1,
            'unicode' : 1,
            'numeric' : 1,
            'integer' : 1,
            'list' : 1,
            'a number' : 1
        },

        init: function(options) {
            this._super(options);
            this.ws_id = this.options.ws_id;

            if (window.kbconfig && window.kbconfig.urls) {
                this.options.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }
            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);

            // Whenever the notebook gets loaded, it should rebind things.
            // This *should* only happen once, but I'm putting it here anyway.
            $([IPython.events]).on('notebook_loaded.Notebook', 
                $.proxy(function() {
                    this.rebindActionButtons();
                    this.hideGeneratedCodeCells();
                }, this)
            );

            $(document).on('workspaceUpdated.Narrative', 
                $.proxy(function(e, ws_id) {
                    this.ws_id = ws_id;
                }, 
                this)
            );

            $(document).on('dataUpdated.Narrative', 
                $.proxy(function(event) {
                    if (IPython && IPython.notebook) {
                        // XXX: This is a hell of a hack. I hate
                        // using the 'first time' bit like this,
                        // but without some heavy rewiring, it's difficult
                        // to track when some event occurred.
                        // So, dirty bit it is.
                        this.refreshFunctionInputs(!this.inputsRendered);
                        if (!this.inputsRendered) {
                            this.loadAllRecentCellStates();
                            this.updateNarrativeDependencies();
                            // temp hack until I think of something better.
                            this.trigger('updateNarrativeDataTab.Narrative');
                        }

                        this.inputsRendered = true;
                    }
                },
                this)
            );

            $(document).on('narrativeDataQuery.Narrative', 
                $.proxy(function(e, callback) {
                    var objList = this.getNarrativeDependencies();
                    if (callback) {
                        callback(objList);
                    }
                },
                this)
            );

            // When a user clicks on a function, this event gets fired with
            // method information. This builds a function cell out of that method
            // and inserts it in the right place.
            $(document).on('function_clicked.Narrative',
                $.proxy(function(event, method) {
                    this.buildFunctionCell(method);
                }, 
                this)
            );

            $(document).on('methodClicked.Narrative',
                $.proxy(function(event, method) {
                    this.buildMethodCell(method);
                },
                this)
            );

            $(document).on('appClicked.Narrative',
                $.proxy(function(event, appInfo) {
                    this.buildAppCell(appInfo);
                },
                this)
            );

            $(document).on('deleteCell.Narrative',
                $.proxy(function(event, index) {
                    this.deleteCell(index);
                },
                this)
            );

            $(document).on('runCell.Narrative',
                $.proxy(function(event, data) {
                    this.runMethodCell(data);
                },
                this)
            );

            $(document).on('runApp.Narrative',
                $.proxy(function(event, data) {
                    this.runAppCell(data);
                },
                this)
            );

            $(document).on('createOutputCell.Narrative',
                $.proxy(function(event, data) {
                    var cellIndex = $('#'+data.cellId).nearest('.cell').index();
                    this.createOutputCell(IPython.notebook.get_cell(cellIndex), 
                        {'embed' : true, 'data' : this.safeJSONStringify(data.result)});
                }, this)
            );

            $(document).on('createViewerCell.Narrative',
                $.proxy(function(event, data) {
                    this.createViewerCell(data.nearCellIdx, data, data.widget);
                }, this)
            );

            this.initDeleteCellModal();
            // Initialize the data table.
            this.render();
            return this;
        },

        initDeleteCellModal: function() {
            this.$deleteCellModalBody = $('<div>');

            var buttonList = [
                {
                    name : 'Cancel',
                    type : 'default',
                    callback : function(e, $prompt) {
                        this.cellToDelete = null;
                        $prompt.closePrompt();
                    },
                },
                {
                    name : 'Delete',
                    type : 'danger',
                    callback : $.proxy(function(e, $prompt) {
                        if (this.cellToDelete !== undefined && this.cellToDelete !== null) {
                            var cell = IPython.notebook.get_cell(this.cellToDelete);
                            var removeId = $(cell.element).find('[id^=kb-cell-]').attr('id');
                            this.trigger('cancelJobCell.Narrative', removeId, false);
                            IPython.notebook.delete_cell(this.cellToDelete);
                            this.cellToDelete = null;
                        }
                        $prompt.closePrompt();
                    }, this)
                }
            ];
            this.$deleteCellModal = $('<div>').kbasePrompt({
                title : 'Delete Cell and Job?',
                body : this.$deleteCellModalBody,
                controls : buttonList
            });
        },

        showDeleteCellModal: function(index, cell, message) {
            if (cell && cell.metadata[this.KB_CELL]) {
                this.cellToDelete = index;
                if (message)
                    this.$deleteCellModalBody.empty().html(message);
                this.$deleteCellModal.openPrompt();
            }
        },
        
        /**
         * @method buildMethodCell
         * @param {Object} method -
         * @public
         */
        buildMethodCell: function(method) {
            var cell = IPython.notebook.insert_cell_below('markdown');
            cell.celltoolbar.hide();
            
            // make this a function input cell, as opposed to an output cell
            this.setMethodCell(cell, method);

            // THIS IS WRONG! FIX THIS LATER!
            // But it should work for now... nothing broke up to this point, right?
            var cellIndex = IPython.notebook.ncells() - 1;
            var cellId = 'kb-cell-' + cellIndex + '-' + this.uuidgen();

            // The various components are HTML STRINGS, not jQuery objects.
            // This is because the cell expects a text input, not a jQuery input.
            // Yeah, I know it's ugly, but that's how it goes.
            var cellContent = "<div id='" + cellId + "'></div>" +
                              "\n<script>" +
                              "$('#" + cellId + "').kbaseNarrativeMethodCell({'method' : '" + this.safeJSONStringify(method) + "', 'cellId' : '" + cellId + "'});" +
                              "</script>";

            cell.set_text(cellContent);
            cell.rendered = false;
            cell.render();

            // restore the input widget's state.
            this.removeCellEditFunction(cell);
        },

        runMethodCell: function(data) {
            if (!data || !data.cell || !data.method || !data.parameters) {
                // do some erroring later.
                return;
            }
            this.saveCellState(data.cell);
            this.updateNarrativeDependencies();
            var self = this;
            var code = '';
            var showOutput = true;
            // if there's a job_id_output_field in the method, then it's long-running, and we shouldn't show an output cell right away.
            // ...or maybe show a temporary one?
            if (data.method.job_id_output_field && data.method.job_id_output_field != null)
                showOutput = false;
            // old, pre-njs style where the methods were all living in IPython-land
            if (data.method.behavior.python_class && data.method.behavior.python_function) {
                code = this.buildRunCommand(data.method.behavior.python_class, data.method.behavior.python_function, data.parameters);
            }
            // newer, njs/njs-mock style where methods get farmed out
            else if ((data.method.behavior.kb_service_method && data.method.behavior.kb_service_name) ||
                     (data.method.behavior.script_module && data.method.behavior.script_name)) {
                code = this.buildGenericRunCommand(data);
                showOutput = false;
            }
            else {
                // something else!
                // do nothing for now.
                code = this.buildGenericRunCommand(data);
            }
            var callbacks = {
                'execute_reply' : function(content) { self.handleExecuteReply(data.cell, content); },
                'output' : function(msgType, content) { self.handleOutput(data.cell, msgType, content, showOutput); },
                'clear_output' : function(content) { self.handleClearOutput(data.cell, content); },
                'set_next_input' : function(text) { self.handleSetNextInput(data.cell, content); },
                'input_request' : function(content) { self.handleInputRequest(data.cell, content); },
            };

            $(data.cell.element).find('#kb-func-progress').css({'display': 'block'});
            IPython.notebook.kernel.execute(code, callbacks, {silent: true});
        },

        buildAppCell: function(appSpec) {
            var cell = IPython.notebook.insert_cell_below('markdown');
            cell.celltoolbar.hide();
            this.removeCellEditFunction(cell);

            var tempContent = '<img src="' + this.options.loadingImage + '">';
            cell.set_text(tempContent);
            cell.rendered = false;
            cell.render();

            this.setAppCell(cell, appSpec);
            var cellIndex = IPython.notebook.ncells() - 1;
            var cellId = 'kb-cell-' + cellIndex + '-' + this.uuidgen();

            // The various components are HTML STRINGS, not jQuery objects.
            // This is because the cell expects a text input, not a jQuery input.
            // Yeah, I know it's ugly, but that's how it goes.
            var cellContent = "<div id='" + cellId + "'></div>" +
                              "\n<script>" +
                              "$('#" + cellId + "').kbaseNarrativeAppCell({'appSpec' : '" + this.safeJSONStringify(appSpec) + "', 'cellId' : '" + cellId + "'});" +
                              "</script>";
            cell.set_text(cellContent);
            cell.rendered = false;
            cell.render();
        },

        runAppCell: function(data) {
            if (!data || !data.cell || !data.appSpec || !data.methodSpecs || !data.parameters) {
                // error out.
                return;
            }
            this.saveCellState(data.cell);
            this.updateNarrativeDependencies();
            var self = this;
            var callbacks = {
                'execute_reply' : function(content) { self.handleExecuteReply(data.cell, content); },
                'output' : function(msgType, content) { self.handleOutput(data.cell, msgType, content, "app"); },
                'clear_output' : function(content) { self.handleClearOutput(data.cell, content); },
                'set_next_input' : function(text) { self.handleSetNextInput(data.cell, content); },
                'input_request' : function(content) { self.handleInputRequest(data.cell, content); },
            };

            var code = this.buildAppCommand(data.appSpec, data.methodSpecs, data.parameters);
            IPython.notebook.kernel.execute(code, callbacks, {silent: true});
        },

        buildAppCommand: function(appSpec, methodSpecs, parameters) {
            console.log([appSpec, methodSpecs, parameters]);
            var appSpecJSON = this.safeJSONStringify(appSpec);
            var methodSpecJSON = this.safeJSONStringify(methodSpecs);
            var paramsJSON = this.safeJSONStringify(parameters);

            return "import biokbase.narrative.common.service as Service\n" +
                   "method = Service.get_service('app_service').get_method('app_call')\n" +
                   "method('" + appSpecJSON + "', '" + methodSpecJSON + "', '" + paramsJSON + "')";
        },

        /**
         * @method buildFunctionCell
         * @param {Object} method - the JSON schema version of the method to invoke. This will
         * include a list of parameters and outputs.
         */
        buildFunctionCell: function(method) {
            var cell = IPython.notebook.insert_cell_below('markdown');
            cell.celltoolbar.hide();
            // make this a function input cell, as opposed to an output cell
            this.setFunctionCell(cell, method);

            // THIS IS WRONG! FIX THIS LATER!
            // But it should work for now... nothing broke up to this point, right?
            var cellIndex = IPython.notebook.ncells() - 1;
            var cellId = 'kb-cell-' + cellIndex + '-' + this.uuidgen();

            // The various components are HTML STRINGS, not jQuery objects.
            // This is because the cell expects a text input, not a jQuery input.
            // Yeah, I know it's ugly, but that's how it goes.
            var cellContent;

            if (this.validateMethod(method)) {
                // This is the list of parameters for the given method
                var inputWidget = this.defaultInputWidget;
                if (method.properties.widgets.input)
                    inputWidget = method.properties.widgets.input;

                var inputDiv = "<div id='inputs'></div>";

                // These are the 'delete' and 'run' buttons for the cell
                var button_content;
                if (this.readonly) {
                    button_content = "";
                }
                else {
                    button_content = "<button id='" + cellId + "-delete' type='button' value='Delete' class='btn btn-default btn-sm'>Delete</button> " +
                                     "<button id='" + cellId + "-run' type='button' value='Run' class='btn btn-primary btn-sm'>Run</button>";
                                     //style='margin-top:10px'>" +
                }
                var buttons = "<div class='buttons pull-right'>" + button_content +
                              "</div>";

                // The progress bar remains hidden until invoked by running the cell
                var progressBar = "<div id='kb-func-progress' class='pull-left' style='display:none;'>" +
                                    "<div class='progress progress-striped active kb-cell-progressbar'>" +
                                        "<div class='progress-bar progress-bar-success' role='progressbar' aria-valuenow='0' " +
                                        "aria-valuemin='0' aria-valuemax='100' style='width:0%'/>" +
                                    "</div>" +
                                    "<p class='text-success'/>" +
                                  "</div>";

                // Associate method title with description via BS3 collapsing
                var methodId = cellId + "-method-details";
                var buttonLabel = "...";
                var methodDesc = method.description.replace(/"/g, "'"); // double-quotes hurt markdown rendering
                var methodInfo = "<span class='kb-func-desc'>" +
                                   "<h1 style='display:inline'><b>" + method.title + "</b></h1>" +
                                   "<span class='pull-right kb-func-timestamp' id='last-run'></span>" +
                                   "<button class='btn btn-default btn-xs' type='button' data-toggle='collapse'" +
                                      " data-target='#" + methodId + "'>" + buttonLabel + "</button>" +
                                    "<div><h2 class='collapse' id='" + methodId + "'>" +
                                      methodDesc + "</h2></div>" +
                                 "</span>";

                // Bringing it all together...
                cellContent = "<div class='panel kb-func-panel kb-cell-run' id='" + cellId + "'>" +
                                  "<div class='panel-heading'>" +
                                      methodInfo +
                                  "</div>" +
                                  "<div class='panel-body'>" +
                                      inputDiv +
                                  "</div>" +
                                  "<div class='panel-footer' style='overflow:hidden'>" +
                                      progressBar +
                                      buttons +
                                  "</div>" +
                              "</div>" +
                              "\n<script>" + 
                              "$('#" + cellId + " > div > div#inputs')." + inputWidget + "({ method:'" +
                               this.safeJSONStringify(method) + "'});" +
                              "</script>";
                console.debug("created input cell '", methodDesc, "', id = ", cellId);
            }
            else {
                cellContent = "Error - the selected method is invalid.";
            }
            cell.set_text(cellContent);

            cell.rendered = false;
            cell.render();

            // restore the input widget's state.
            this.removeCellEditFunction(cell);
            this.bindActionButtons(cell);
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
        checkCellMetadata: function(cell) {
            if (cell.metadata[this.KB_CELL]) {
                // if that top-level one is a string, it'll probably be an output cell, so make it one.
                if (typeof cell.metadata[this.KB_CELL] === "string") {
                    var newMeta = {};
                    newMeta[this.KB_TYPE] = this.KB_OUTPUT_CELL;
                    newMeta['widget'] = undefined;
                    newMeta[this.KB_STATE] = [];
                    cell.metadata[this.KB_CELL] = newMeta;
                }
                else if (typeof cell.metadata[this.KB_CELL] === "object") {
                    // The "old" version (i.e. at the beginning of the workshop starting 1/6/2013)
                    // just needs to make sure the input cells have the widget state as an array.
                    // AND it should store the widget name, as found in the method, as a separate field.

                    if (cell.metadata[this.KB_CELL][this.KB_TYPE] === this.KB_FUNCTION_CELL) {
                        if (!cell.metadata[this.KB_CELL]['widget'])
                            cell.metadata[this.KB_CELL]['widget'] = cell.metadata[this.KB_CELL]['method'].properties.widgets.input || this.defaultInputWidget;
                        if (!cell.metadata[this.KB_CELL][this.KB_STATE]) {
                            cell.metadata[this.KB_CELL][this.KB_STATE] = [];
                            if (cell.metadata[this.KB_CELL]['input_state']) {
                                cell.metadata[this.KB_CELL][this.KB_STATE].unshift({ 'time': 0, 'state' : cell.metadata[this.KB_CELL]['input_state'] });
                            }
                        }
                        else if (Object.prototype.toString.call(cell.metadata[this.KB_CELL][this.KB_STATE]) !== '[object Array]') {
                            cell.metadata[this.KB_CELL][this.KB_STATE] = [ { 'time' : 0, 'state' : cell.metadata[this.KB_CELL][this.KB_STATE] } ];
                        }
                    }
                }
            }
        },

        /**
         * Escape chars like single quotes in descriptions and titles,
         * before rendering as a JSON string.
         *
         *
         *  THIS IS NOT SAFE BECAUSE THERE ARE HARD CODED KEYS THAT ARE CHECKED!!!! -mike
         *  It should be more safe now - **all** strings should have their quotes escaped before JSONifying them.
         *
         * @post This does not modify the input object.
         * @return {string} JSON string
         */
        safeJSONStringify: function(method) {
            var esc = function(s) { 
                return s.replace(/'/g, "&apos;")
                        .replace(/"/g, "&quot;");
            };
            return JSON.stringify(method, function(key, value) {
                return (typeof(value) === 'string') ? esc(value) : value;
                // this seems not safe, since we can have many keys in the spec that are not these... -mike
                // return (typeof(value) == "string" &&
                //         (key == "description" || key == "title" || key=="header" || key=="tooltip" || key=="name" || key=="subtitle")) ?
                //     esc(value) : value;
            });
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
        refreshFunctionInputs: function(fullRender) {
            if (IPython && IPython.notebook) {
                var cells = IPython.notebook.get_cells();
                for (var i=0; i<cells.length; i++) {
                    var cell = cells[i];
                    if (this.isFunctionCell(cell)) {
                        var method = cell.metadata[this.KB_CELL].method;
                        // legacy cells.
                        if (method.properties) {
                            var inputWidget = method.properties.widgets.input || this.defaultInputWidget;
    
                            if (fullRender) {
                                cell.rendered = false;
                                cell.render();

                                this.loadRecentCellState(cell);
                                this.bindActionButtons(cell);
                            }
                            else {
                                $(cell.element).find("#inputs")[inputWidget]('refresh');
                            }
                        }
                        else {
                            $(cell.element).find("div[id^=kb-cell-]").kbaseNarrativeMethodCell('refresh');
                        }
                    }
                    else if (this.isAppCell(cell)) {
                        $(cell.element).find("div[id^=kb-cell-]").kbaseNarrativeAppCell('refresh');
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
        validateMethod: function(method) {
            // if no title, return false
            if (!method.hasOwnProperty('title') || method.title.length == 0)
                return false;

            // if no service, return false
            if (!method.hasOwnProperty('service') || method.service.length == 0)
                return false;

            // if no properties, or it's not an object, return false
            if (!method.hasOwnProperty('properties') || typeof method.properties !== 'object')
                return false;

            if (!method.properties.hasOwnProperty('parameters') || typeof method.properties.parameters !== 'object')
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
        removeCellEditFunction: function(cell) {
            // remove its double-click and return functions. sneaky!
            $(cell.element).off('dblclick');
            $(cell.element).off('keydown');
        },

        /**
         * @method bindActionButtons
         * Binds the action (delete and run) buttons of a function cell.
         * This requires the cell to have {'kb-cell' : 'function'} in its metadata, otherwise it's ignored.
         * @param cell - the IPython Notebook cell with buttons to be bound.
         * @private
         */
        bindActionButtons: function(cell) {
            // get the cell.
            // look for the two buttons.
            // bind them to the right actions.
            if (this.isFunctionCell(cell)) {
                $(cell.element).find(".buttons [id*=delete]").off('click');
                $(cell.element).find(".buttons [id*=delete]").click(this.bindDeleteButton());
                $(cell.element).find(".buttons [id*=run]").off('click');
                $(cell.element).find(".buttons [id*=run]").click(this.bindRunButton());
            }
        },

        /**
         * Set narrative into read-only mode.
         */
        activateReadonlyMode: function() {
            var self = this;

            console.debug("activate read-only mode");
            // Hide delete and run buttons
            cells = IPython.notebook.get_cells();
            cells.forEach(function(cell) {
               ['delete', 'run'].forEach(function (e) {
                    $(this.element).find(".buttons [id*=" + e + "]").hide();
                }, cell);
            });

            // Delete left-side panel!
            $('#left-column').detach(); //hide();

            // Hide IPython toolbar
            $('#maintoolbar').hide();

            // Move content panels to the left
            $('#ipython-main-app').css({'left': '10px'});
            $('#menubar-container').css({'left': '10px'});

            // Disable text fields
            console.debug("readonly: Disable text fields");
            $(".cell input").attr('disabled', 'disabled');

            // Disable buttons
            console.debug("readonly: Disable internal buttons");
            $(".cell button").hide();  //attr('disabled', 'disabled');

            // Hide save/checkpoint status
            $('#autosave_status').text("(read-only)");
            $('#checkpoint_status').hide();

            var input_titles = [];

            // Remove h1 from input titles
            $('div.kb-func-desc h1').each(function(idx) {
                var title = $(this).text();
                var title_span = $('<span>' + title + '</span>');
                var desc = $(this).parent();
                desc.prepend(title_span);
                $(this).remove();
                input_titles.push([title, desc]);
                desc.prepend(
                    '<span class="label label-info" style="margin-right: 8px;" ' +
                    ' id="kb-input-' + idx + '">' +
                    'Input' +
                    '</span>');
            });

            // Add label before input titles
            // $('.kb-func-panel .panel-heading .kb-func-desc').prepend(
            //     '<span class="label label-info" style="margin-right: 8px;">' +
            //     ' id="kb-input-' + idx +
            //     'Input' +
            //     '</span>');

            // Remove trailing ' - Output' junk from output titles
            // and add label before them.
            // If a matching input title can be found, store in 'connectable'
            var matched_input = 0;
            var connectable = {};
            $('.kb-cell-output').each(function(idx) {
                var desc = $(this).find('.kb-out-desc');
                var title_full = desc.text();
                var otitle = title_full.replace(/\s*-\s*Output/,'');
                if (title_full != otitle) {
                    desc.text(otitle); // replace
                }
                var title_span = $('<span class="label label-primary" style="margin-right: 8px;"' +
                    ' id="kb-output-' + idx + '">' +
                'Output' +
                '</span>')
                desc.prepend(title_span);
                // Look for matching input
                for (var i=matched_input; i < input_titles.length; i++) {
                    var ititle = input_titles[i][0];
                    //console.debug('input title="'+ ititle + '" output title="' + otitle + '"');
                    if (ititle == otitle) {
                        matched_input = i + 1;
                        connectable[i] = idx;
                        break;
                    }
                }
            });

            // Add 'Copy' button after narrative title
            var narr_copy_id = "narr-copy";
            var button = $('<button type="button" ' +
                           'class="btn btn-success" ' +
                           'id="'  + narr_copy_id + '" ' +
                           'data-toggle="tooltip" ' +
                           'title="Copy this narrative to a workspace ' +
                           'where you can modify and run it" ' +
                           '>Copy</button>');
            button.css({'line-height': '1em',
                        'margin-top': '-15px',
                        'margin-left': '5em'});
            e = $('#menubar').append(button);
            this.bindCopyButton($('#' + narr_copy_id));

            this.connectable = connectable;
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
        connect: function(p, q, g, w, container, line_class) {
            var pc = $(p).position();
            var qc = $(q).position();
            console.debug("connect ", pc, " to ", qc);
            var py = pc.top + (p.height() - w) / 2.0;
            var qy = qc.top + (q.height() - w) / 2.0;
            var coords = [{
                left: g,
                top: py,
                width: (pc.left - g),
                height: w
            }, {
                left: g,
                top: py + w,
                width: w,
                height: qy - py
            }, {
                left: g,
                top: qy,
                width: qc.left - g,
                height: w
            }];
            for (var i = 0; i < 3; i += 1) {
                var $elt = $('<div>').addClass(line_class).attr('id', 'kb-line' + i);
                $elt.css(coords[i]);
                container.append($elt);
            }
        },

        /**
         * Activate "normal" R/W mode
         */
         activateReadwriteMode: function() {
            console.debug("activate read-write mode");
         },

        /**
         * Bind the 'Copy narrative' button to 
         * a function that copies the narrative.
         */
        bindCopyButton: function(element) {
            var oid = this.getNarrId();
            element.click(function() {
                console.debug("Make a copy for narr. obj = ", oid);
                // XXX: Complete and utter FAKE!
                // XXX: Just jump to a hardcoded read/write narrative based on the input one
                var copy_id_map = {
                    'ws.2590.obj.8': 'ws.2615.obj.8', // comparative genomics
                };
                var copy_id = copy_id_map[oid];
                if (copy_id !== undefined) {
                    // Open new narrative
                    var oldpath = window.location.pathname;
                    var parts = oldpath.split('/');
                    parts.pop(); // pop off old id
                    parts.push(copy_id); // add new one
                    var newpath = parts.join('/'); // rejoin as a path
                    var newurl = window.location.protocol + '//' + window.location.host + newpath;
                    console.debug("Moving to new URL: ", newurl);
                    window.location.replace(newurl);
                }
            });
            return;
        },

        /**
         * Object identifier of current narrative, extracted from page URL.
         */
         getNarrId: function() {
            return window.location.pathname.split('/').pop();
         },

        /**
         * Once the notebook is loaded, all code cells with generated code
         * (e.g. the placeholder, provenance cells) should be hidden.
         * At least for now.
         * So this function does that.
         * @private
         */
        hideGeneratedCodeCells: function() {
            var cells = IPython.notebook.get_cells();
            for (var i=0; i<cells.length; i++) {
                var cell = cells[i];
                if (this.isFunctionCodeCell(cell))
                    cell.element.css('display', 'none');
            }
        },

        // Function input cell type.
        isFunctionCell: function(cell) {
            return this.checkCellType(cell, this.KB_FUNCTION_CELL);
        },

        isAppCell: function(cell) {
            return this.checkCellType(cell, this.KB_APP_CELL);
        },

        setFunctionCell: function(cell, method) {
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_FUNCTION_CELL;
            cellInfo['method'] = method;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = method.properties.widgets.input || this.defaultInputWidget;

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        setMethodCell: function(cell, method) {
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_FUNCTION_CELL;
            cellInfo['method'] = method;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = method.widgets.input || this.defaultInputWidget;

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        setAppCell: function(cell, appInfo) {
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_APP_CELL;
            cellInfo['app'] = appInfo;
            cellInfo[this.KB_STATE] = [];

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        // Function output cell type.
        isOutputCell: function(cell) {
            return this.checkCellType(cell, this.KB_OUTPUT_CELL);
        },

        setOutputCell: function(cell, widget) {
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_OUTPUT_CELL;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = widget;

            cell.metadata[this.KB_CELL] = cellInfo;
        },

        setErrorCell: function(cell) {
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_ERROR_CELL;
            cell.metadata[this.KB_CELL] = cellInfo;
        },

        // Backup function code cell type (usually hidden through css... I still think this is superfluous)
        isFunctionCodeCell: function(cell) {
            return this.checkCellType(cell, this.KB_CODE_CELL);
        },

        setCodeCell: function(cell) {
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_CODE_CELL;
            cell.metadata[this.KB_CELL] = cellInfo;
        },

        checkCellType: function(cell, type) {
            return cell.metadata &&
                   cell.metadata[this.KB_CELL] &&
                   cell.metadata[this.KB_CELL][this.KB_TYPE] === type;
        },

        getMethodCellDependencies: function(cell, paramValues) {
            if (!this.isFunctionCell(cell))
                return;
            paramValues = $(cell.element).find('div[id^=kb-cell-]').kbaseNarrativeMethodCell('getParameters') || [];
            var params = cell.metadata[this.KB_CELL].method.parameters;

            var data = [];

            // paramValues and method.properties.parameters should be parallel, but check anyway.
            // assume that those elements between the parameters list and method's params that
            var cellDeps = [];
            var types = [];
            var typesHash = {};

            // note - it's method.parameters.param##
            for (var i=0; i<params.length; i++) {
                var p = params[i];

                /* fields: default, description, type, ui_name */
                if (p.text_options) {
                    if (p.text_options.valid_ws_types) {
                        var type = p.text_options.valid_ws_types[0];
                        if (type && !this.ignoredDataTypes[type.toLowerCase()] && paramValues[i]) {
                            cellDeps.push([type, paramValues[i]]);
                            if (!typesHash[type]) {
                                typesHash[type] = 1;
                                types.push(type);
                            }
                        }
                    }
                }
                
            }

            // look up the deps in the data panel.
            // Cheating for now - needs to be a synchronous call, though! There's no reason for it not to be, if the data's already loaded!
            var objList = $('#kb-ws').kbaseNarrativeDataPanel('getLoadedData', types);

            // Man, now what. N^2 searching? What a drag.
            for (var i=0; i<cellDeps.length; i++) {
                var type = cellDeps[i][0];
                var found = false;
                if (objList[type] && objList[type].length > 0) {
                    for (var j=0; j<objList[type].length; j++) {
                        if (objList[type][j][1] === cellDeps[i][1]) {
                            data.push(objList[type][j][6] + '/' + objList[type][j][0] + '/' + objList[type][j][4]);
                            found = true;
                            break;
                        }
                    }
                }
            }
            return data;

        },

        /**
         * @method
         * Returns a list of Workspace object dependencies for a single cell.
         * These dependencies are returned as workspace object references of the format:
         * X/Y/Z
         * X = workspace number
         * Y = object number
         * Z = version number
         * @private
         */
        getCellDependencies: function(cell, paramValues) {
            if (!this.isFunctionCell(cell))
                return;

            var data = [];
            var target = '#inputs';
            // get a 'handle' (really just the invocable name) of the input widget
            var inputWidget = cell.metadata[this.KB_CELL].method.properties.widgets.input || this.defaultInputWidget;
            var params = cell.metadata[this.KB_CELL]['method'].properties.parameters;

            if (!paramValues) {
                paramValues = $(cell.element).find('#inputs')[inputWidget]('getParameters') || [];
            }

            // paramValues and method.properties.parameters should be parallel, but check anyway.
            // assume that those elements between the parameters list and method's params that
            var cellDeps = [];
            var types = [];
            var typesHash = {};

            // note - it's method.parameters.param##
            for (var i=0; i<Object.keys(params).length; i++) {
                var pid = 'param' + i;
                var p = params[pid];  // this is the param object itself.

                /* fields: default, description, type, ui_name */
                var type = p.type;
                if (!this.ignoredDataTypes[type.toLowerCase()] && paramValues[i]) {
                    cellDeps.push([type, paramValues[i]]);
                    if (!typesHash[type]) {
                        typesHash[type] = 1;
                        types.push(type);
                    }
                }
            }

            // look up the deps in the data panel.
            // Cheating for now - needs to be a synchronous call, though! There's no reason for it not to be, if the data's already loaded!
            var objList = $('#kb-ws').kbaseNarrativeDataPanel('getLoadedData', types);

            // Man, now what. N^2 searching? What a drag.
            for (var i=0; i<cellDeps.length; i++) {
                var type = cellDeps[i][0];
                var found = false;
                if (objList[type] && objList[type].length > 0) {
                    for (var j=0; j<objList[type].length; j++) {
                        if (objList[type][j][1] === cellDeps[i][1]) {
                            data.push(objList[type][j][6] + '/' + objList[type][j][0] + '/' + objList[type][j][4]);
                            found = true;
                            break;
                        }
                    }
                }
            }
            return data;
        },

        /**
         * @method
         * @return a list containing all dependencies as WS references.
         * @public
         */
        getNarrativeDependencies: function() {
            var cells = IPython.notebook.get_cells();
            var deps = {};
            // For each cell in the Notebook
            $.each(cells, $.proxy(function(idx, cell) {
                // Get its dependencies (it'll skip non-input cells)
                if (this.isFunctionCell(cell)) {
                    var cellDeps = [];
                    if (cell.metadata[this.KB_CELL].method.properties) {
                        cellDeps = this.getCellDependencies(cell);
                    }
                    else {
                        cellDeps = this.getMethodCellDependencies(cell);
                    }
                    // Shove them in the Object as properties to uniquify them.
                    for (var i=0; i<cellDeps.length; i++) {
                        deps[cellDeps[i]] = 1;
                    }
                }
            }, this));
            // Return the final, unique list (cleaner than looping over every returned hit)
            return Object.keys(deps);
        },

        /**
         * @method
         * @private
         */
        updateNarrativeDependencies: function() {
            var deps = this.getNarrativeDependencies();
            IPython.notebook.metadata.data_dependencies = deps;
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
        saveCellState: function(cell) {
            // ignore it if it isn't a KBase cell with a widget state to save.
            if (!this.isFunctionCell(cell) && !this.isOutputCell(cell) && !this.isAppCell(cell))
                return;

            var target = 'div[id^=kb-cell-]';
            var widget;

            if (this.isFunctionCell(cell)) {
                var method = cell.metadata[this.KB_CELL].method;
                // older way
                if (method.properties) {
                    widget = cell.metadata[this.KB_CELL].method.properties.widgets.input || this.defaultInputWidget;
                    target = '#inputs';
                }
                else {
                    widget = 'kbaseNarrativeMethodCell';
                }
            }
            else if (this.isOutputCell(cell)) {
                // do output widget stuff.
                widget = 'kbaseNarrativeOutputCell';
            }
            else if (this.isAppCell(cell)) {
                widget = 'kbaseNarrativeAppCell';
            }

            try {
                var state;
                if (widget && $(cell.element).find(target)[widget](['prototype'])['getState']) {
                    // if that widget can save state, do it!
                    state = $(cell.element).find(target)[widget]('getState');
                }

                var timestamp = this.getTimestamp();
                cell.metadata[this.KB_CELL][this.KB_STATE].unshift({ 'time' : timestamp, 'state' : state });
                while (this.maxSavedStates && cell.metadata[this.KB_CELL][this.KB_STATE].length > this.maxSavedStates) {
                    cell.metadata[this.KB_CELL][this.KB_STATE].pop();
                }
            }
            catch(error) {
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
        loadRecentCellState: function(cell) {
            var state = this.getRecentState(cell);
            if (state) {
                var target = 'div[id^=kb-cell-]';
                var widget;

                // if it's labeled as a function cell do that.
                if (this.isFunctionCell(cell)) {
                    var method = cell.metadata[this.KB_CELL].method;
                    // older way
                    if (method.properties) {
                        widget = cell.metadata[this.KB_CELL].method.properties.widgets.input || this.defaultInputWidget;
                        target = '#inputs';
                    }
                    else {
                        widget = 'kbaseNarrativeMethodCell';
                    }
                }
                // if it's labeled as an output cell do that.
                else if (this.isOutputCell(cell)) {
                    // get the output cell's target and widget.
                    // eventually, we should probably just update the cells to the new version
                    // but this should sort out any backward compatibility issues for now.

                    var cellText = cell.get_text();
                    var capture = cellText.match(/<script>\$\([\"\'](.+)[\"\']\)\.(\w+)\(.+\);<\/script>/);
                    if (capture) {
                        target = capture[1];
                        widget = capture[2];
                    }

                    // // do output widget stuff.
                    // widget = 'kbaseNarrativeOutputCell';

                    // // if it's an older Narrative, then it might have metadata invoking a different widget.
                    // var metadata = cell.metadata[this.KB_CELL];
                    // if (metadata.widget)
                    //     widget = metadata.widget;
                }
                else if (this.isAppCell(cell)) {
                    widget = 'kbaseNarrativeAppCell';
                }
                // it might not be either! if we don't have both a target and widget, don't do anything!
                if (target && widget) {
                    try {
                        if ($(cell.element).find(target)[widget](['prototype'])['loadState']) {
                            $(cell.element).find(target)[widget]('loadState', state.state);
                            // later, do something with the timestamp.
                        }
                    } catch(err) {
                        // just ignore it and move on.
                        // this.dbg('Unable to load cell state! Ignoring the following cell:')
                        // this.dbg(cell);
                        // this.dbg(err);
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
        getCellStateArray: function(cell) {
            if (this.isFunctionCell(cell) || this.isOutputCell(cell)) {
                var stateArr = cell.metadata[this.KB_CELL][this.KB_STATE];
                // if it's an array, return it.
                if (Object.prototype.toString.call(stateArr) === "[object Array]")
                    return stateArr;
            }
            // if the cell doesn't have a state array, or if it's NOT an array, return the empty array.
            return [];
        },

        /**
         * Saves the state of all cells into their respective arrays.
         * @public
         */
        saveAllCellStates: function() {
            var cells = IPython.notebook.get_cells();
            $.each(cells, $.proxy(function(idx, cell) {
                this.saveCellState(cell);
            }, this));
        },

        /**
         * Loads the most recently saved state into all cells.
         * @public
         */
        loadAllRecentCellStates: function() {
            var cells = IPython.notebook.get_cells();
            $.each(cells, $.proxy(function(idx, cell) {
                this.loadRecentCellState(cell);
            }, this));
        },

        /**
         * Fetches the most recent cell state. If the cell state is an array, it gets the first element,
         * if it's NOT an array, it just returns that state.
         * This *should* make things still functional for the older (non-array-based) stateful cells.
         * XXX: eventually update this to just array, once we're out of dev-panic-mode and closer to production.
         */
        getRecentState: function(cell) {
            var state;
            if (this.isFunctionCell(cell) || this.isOutputCell(cell) || this.isAppCell(cell)) {
                var stateList = cell.metadata[this.KB_CELL][this.KB_STATE];
                if (Object.prototype.toString.call(stateList) === "[object Array]")
                    state = stateList[0];
                else
                    state = stateList;
            }
            return state;
        },

        /**
         * @method bindRunButton
         * @private
         */
        bindRunButton: function() {
            var self = this;
            return (
                function(event) {
                    event.preventDefault();
                    // get the cell
                    var cell = IPython.notebook.get_selected_cell();

                    // get a 'handle' (really just the invocable name) of the input widget
                    var inputWidget = cell.metadata[self.KB_CELL].method.properties.widgets.input || self.defaultInputWidget;

                    // get the list of parameters and save the state in the cell's metadata
                    var paramList = $(cell.element).find("#inputs")[inputWidget]('getParameters');
                    self.saveCellState(cell);
                    self.updateNarrativeDependencies();

                    // var state = $(cell.element).find("#inputs")[inputWidget]('getState');
                    // cell.metadata[self.KB_CELL][self.KB_STATE] = state;

                    // Run the method.
                    var method = cell.metadata[self.KB_CELL].method;
                    self.runCell()(cell, method.service, method.title, paramList);
                    $(cell.element).find("#last-run").html("Last run: " + self.readableTimestamp(self.getTimestamp()));
                }
            );
        },

        /**
         * @method deleteCell
         * @private
         */
        deleteCell: function(index) {
            if (index !== undefined && index !== null) {
                var cell = IPython.notebook.get_cell(index);
                if (cell) {
                    // if it's a kbase method or app cell, trigger a popup
                    if (cell.metadata[this.KB_CELL]) {
                        widget = null; // default is app cell
                        var state = 'input'; // default is input... also doubles as a proxy for output cells
                        if (this.isFunctionCell(cell))
                            widget = 'kbaseNarrativeMethodCell';
                        else if (this.isAppCell(cell))
                            widget = 'kbaseNarrativeAppCell';
                        if (widget)
                            state = $(cell.element).find('div[id^=kb-cell-]')[widget]('getRunningState');

                        if (state === 'input') {
                            IPython.notebook.delete_cell(index);
                            return;
                        }
                        else {
                            // if it's running, say so, and say it'll stop and delete the job
                            // if it's done, say it'll clear the associated job, but won't delete data
                            // if it's error, say it'll delete the assoc'd job

                            var stateWarning = 'Deleting this cell will also delete any associated job. ' +
                                               'Any generated data will be retained. Continue?';

                            this.showDeleteCellModal(index, cell, stateWarning);
                            // switch(state) {
                            //     case 'running':
                            //         // set some text
                            //         stateWarning = 'This cell appears to have a running job associated with it. ' +
                            //                        'Deleting this cell will also stop and delete the running job. ' +
                            //                        'Any generated data will not be deleted. Continue?';
                            //         break;
                            //     case 'error':
                            //         // set some text
                            //         stateWarning = 'This cell appears to have produced an error while running. ' +
                            //                        'Deleting this cell will also stop and delete the associated job. ' +
                            //                        'Any generated data will be maintained. Continue?';
                            //         break;
                            //     case 'done':
                            //         // set some text
                            //         stateWarning = 'This cell has finished running but may have a job still associated with it. ' +
                            //                        'Deleting this cell will also delete that job, but not any generated data. ' +
                            //                        'Continue?';
                            //         break;
                            //     default:
                            //         // set no text
                            //         stateWarning = 'Deleting this cell will also delete any associated job. Any generated data will be retained. Continue?';
                            //         break;
                            // }
                        }
                    }
                    else {
                        IPython.notebook.delete_cell(index);
                    }
                }
            }
        },

        /**
         * @method bindDeleteButton
         * @private
         */
        bindDeleteButton: function() {
            var self = this;
            return( 
                function(event) {
                    event.preventDefault();
                    var idx = IPython.notebook.get_selected_index();
                    IPython.notebook.delete_cell(idx);
                }
            );
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
        rebindActionButtons: function() {
            if (!(IPython && IPython.notebook))
                return;
            
            // Rewrite the following to iterate using the IPython cell
            // based methods instead of DOM objects

            var cells = IPython.notebook.get_cells();

            // not using $.each because its namespacing kinda screws things up.
            for (var i=0; i<cells.length; i++) {
                var cell = cells[i];
                var cellType = cell.metadata[this.KB_CELL];
                if (cellType) {
                    this.removeCellEditFunction(cell);
                    if (this.isFunctionCell(cell)) { 
                        // added to only update the built-in non-widgetized function cells
                        if (cell.metadata[this.KB_CELL].method.properties) { // cheat to see if it's an old one!
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
        runCell: function() {
            var self = this;
            return function(cell, service, method, params) {
                var nb = IPython.notebook;
                var currentIndex = nb.get_selected_index();

                var callbacks = {
                    'execute_reply' : function(content) { self.handleExecuteReply(cell, content); },
                    'output' : function(msgType, content) { self.handleOutput(cell, msgType, content); },
                    'clear_output' : function(content) { self.handleClearOutput(cell, content); },
                    'set_next_input' : function(text) { self.handleSetNextInput(cell, content); },
                    'input_request' : function(content) { self.handleInputRequest(cell, content); },
                };

                // ignore making code cells for now.
                // var codeCell = nb.insert_cell_below('code', currentIndex);
                // self.setCodeCell(codeCell);
                // codeCell.element.css('display', 'none');

                var code = self.buildRunCommand(service, method, params);
                // codeCell.set_text(code);
                // codeCell.output_area.clear_output(true, true, true);
                // codeCell.set_input_prompt('*');

                $(cell.element).find('#kb-func-progress').css({'display': 'block'});
                nb.kernel.execute(code, callbacks, {silent: true});
            };
        },

        buildGenericRunCommand: function(data) {
            var methodJSON = this.safeJSONStringify(data.method);
            var paramsJSON = this.safeJSONStringify(data.parameters);

            return "import biokbase.narrative.common.service as Service\n" +
                   "method = Service.get_service('generic_service').get_method('method_call')\n" +
                   "method('" + methodJSON + "', '" + paramsJSON + "')";
        },

        /**
         * Stitches together the command needed to run a method in the IPython kernel.
         * It is assumed that params is a list, with all values in the right order.
         * @param {String} service - the registered service name
         * @param {String} method - the registered method name
         * @param {Array} params - a list of parameter values
         * @returns {String} the constructed IPython kernel command
         * @private
         */
        buildRunCommand: function(service, method, params) {
            // very nice quote-escaper found here:
            // http://stackoverflow.com/questions/770523/escaping-strings-in-javascript
            // and
            // http://phpjs.org/functions/addslashes/
            var addSlashes = function(str) {
                return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
            };

            var escService = addSlashes(service);
            var escMethod = addSlashes(method);
            var cmd = "import biokbase.narrative.common.service as Service\n" +
                      "method = Service.get_service('" + escService + "').get_method('" + escMethod + "')\n";

            var paramList = params.map(
                function(p) { 
                    return "'" + addSlashes(p) + "'"; 
                }
            );
            cmd += "method(" + paramList + ")";

            return cmd;
        },

        /**
         * Make JS dict into Python dict (string)
         */
         _pythonDict: function(data) {
            var dict = "{";
            $.each(data, function(key, value) {
                dict += "'" + key + "': ";
                // XXX: assume either more maps or simple type
                var vtype = typeof value;
                switch(vtype) {
                    case "boolean":
                        if (value)
                            dict += "True";
                        else
                            dict += "False";
                        break;
                    case "number":
                        dict += value;
                        break;
                    case "string":
                        dict += "'" + value + "'";
                        break;
                    case "undefined":
                        dict += "None";
                        break;
                    case "object":
                        dict += this._pythonDict(value);
                        break;
                    default:
                        console.error("Cannot convert to Python:", vtype);
                }
                dict += ", "
            });
            return dict + "}";
         },

        /* ------------------------------------------------------
         * Functions to handle running code.
         */
        /**
         * @method _handle_execute_reply
         * @private
         */
        handleExecuteReply: function (cell, content) {
            // this.dbg('[handleExecuteReply]');
            // // this.dbg(content);

            // this.dbg(cell);
            /* This catches and displays any errors that don't get piped through
             * the back-end service.py mechanism.
             * Any code that makes it that far gets reported through the output
             * mechanism and ends here with an 'ok' message.
             */
            if (content.status === 'error') {
                var errorBlob = {
                    msg : content.evalue,
                    type : content.ename,
                };

                if (cell && cell.metadata && cell.metadata['kb-cell'] &&
                    cell.metadata['kb-cell'].method)
                    errorBlob.method_name = cell.metadata['kb-cell'].method.title;

                var removeVt = function(line) {
                    return line.replace(/\[\d+(;\d+)?m/g, '');
                };

                var errTb = content.traceback.map(function(line) {
                    return {
                        filename: null,
                        function: null,
                        line: null,
                        text: removeVt(line)
                    };
                });

                errorBlob.traceback = errTb;
                this.createOutputCell(cell, '{"error" :' + JSON.stringify(errorBlob) + '}', true);

            }
            this.showCellProgress(cell, "DONE", 0, 0);
            //this.set_input_prompt(content.execution_count);
            $([IPython.events]).trigger('set_dirty.Notebook', {value: true});
        },
        /**
         * @method _handle_set_next_input
         * @private
         */
        handleSetNextInput: function (cell, text) {
            var data = {'cell': this, 'text': text}
            $([IPython.events]).trigger('set_next_input.Notebook', data);
        },
        /**
         * @method _handle_input_request
         * @private
         */
        handleInputRequest: function (cell, content) {
            this.dbg("handle input request called");
            return;
            //this.output_area.append_raw_input(content);
        },
        /**
         * @method _handle_clear_output
         * @private
         */
        handleClearOutput: function (cell, content) {
            this.dbg("handle clear output called");
            return;
            //this.clear_output(content.stdout, content.stderr, content.other);
        },

        /**
         * @method _handle_output
         */
        handleOutput: function (cell, msgType, content, showOutput) {
            // copied from outputarea.js
            var buffer = "";
            if (msgType === "stream") {
                buffer += content.data;
                var lines = buffer.split("\n");
                var offs = 0, 
                    done = false, 
                    self = this,
                    result = "";

                $.each(lines, function(index, line) {
                    if (!done) {
                        if (line.length == 0) {
                            offs += 1; // blank line, move offset
                        }
                        else {
                            // look for @@S, @@P, @@D, @@G, @@J, @@E, or @@A
                            var matches = line.match(/^@@([ADEGJSP])(.*)/);
                            if (matches) { // if we got one
                                switch(matches[1]) {
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
                                            self.showCellProgress(cell, progressInfo[0], progressInfo[1], progressInfo[2]);
                                            offs += line.length;
                                            if (index < lines.length - 1)
                                                offs += 1;
                                        }
                                        else
                                            done = true;
                                        break;

                                    case 'E': // Error while running
                                        var errorJson = matches[2];
                                        errorJson = errorJson.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\$/g, "&#36;");
                                        self.createOutputCell(cell, '{"error" :' + errorJson + '}', true);
                                        break;

                                    case 'G': // debuG message
                                        var debug = matches[2];
                                        self.dbg("[KERNEL] " + debug);
                                        break;

                                    case 'J': // Job id register
                                        var jobId = matches[2];
                                        self.dbg("[JOB ID] " + jobId);
                                        self.registerJobId(jobId, cell);
                                        break;

                                    case 'A': // App id register
                                        var appId = matches[2];
                                        self.dbg("[APP ID] " + appId);
                                        self.registerJobId(appId, cell);
                                        break;

                                    default:
                                        // by default just dump it to the console
                                        self.dbg("[UNKNOWN TAG] " + line);
                                        break;
                                }
                                return;
                            }
                            // No progress marker on non-empty line => treat as final output of program.
                            else {
                                result += line;
                                // all but the last line should have \n appended
                                if (index < lines.length - 1) {
                                    result += "\n";
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
                    if (showOutput === "app" && window.kbconfig && window.kbconfig.mode === "debug") {
                        if (!cell.metadata[this.KB_CELL].stackTrace)
                            cell.metadata[this.KB_CELL].stackTrace = [];
                        // try to parse the result as JSON - if so, then it's a final result and we just
                        // need the 'data' field
                        try {
                            var data = JSON.parse(result);
                            if (data && typeof data === 'object')
                                cell.metadata[this.KB_CELL].stackTrace.push(data.data);
                        }
                        catch (err) {
                            // it's NOT JSON, and we should just append it.
                            cell.metadata[this.KB_CELL].stackTrace.push(result);
                        }
                    }
                    else if (showOutput)
                        this.createOutputCell(cell, result);
                }
            }
        },

        /**
         * @method
         * Registers the given job id with the Narrative.
         * This stores the job id in the Narrative's metadata.
         * XXX: Should this trigger a save?
         */
        registerJobId: function(jobId, sourceCell) {
            // This is possibly the ugliest hack here. In the future, all cells should actually know their 
            // fancy UUIDs. But that *might* be backwards incompatible with existing narratives that we want
            // to show off.
            //
            // Really, all cells should be "NarrativeInput" or "NarrativeOutput" widgets that wrap their actual
            // contents, and we can poke those widgets for their IDs. But that's later.
            var txt = sourceCell.get_text();
            var cellId = 'unknown';

            if (txt)
                cellId = $('<div>').append(txt).find('div[id^=kb-cell-]').attr('id');

            var jobInfo = {
                id : jobId,
                source : cellId,
                target : '',
                timestamp : new Date().toISOString()
            };

            if (this.isAppCell(sourceCell))
                this.trigger('registerApp.Narrative', jobInfo);
            else
                this.trigger('registerMethod.Narrative', jobInfo);
        },


        createViewerCell: function(cellIndex, data, widget) {
            var cell = this.addOutputCell(cellIndex, widget);
            var title = "Data Viewer";
            var type = "viewer";

            var uuid = this.uuidgen();
            var outCellId = 'kb-cell-out-' + uuid;
            var outputData = '{"data":' + this.safeJSONStringify(data) + ', ' + 
                               '"type":"' + type + '", ' +
                               '"widget":"' + widget + '", ' +
                               '"cellId":"' + outCellId + '", ' +
                               '"title":"' + title + '", ' +
                               '"time":' + this.getTimestamp() + '}'; 

            cellText = '<div id="' + outCellId + '"></div>\n' +
                       '<script>' +
                       '$("#' + outCellId + '").kbaseNarrativeOutputCell(' + outputData + ');' +
                       '</script>';
            cell.set_text(cellText);
            cell.rendered = false; // force a render
            cell.render();
        },

        /**
         * Result is an object with this structure:
         * cell = the invoking function cell.
         * result = the result data object from the Python call.
         * widget - the widget to use (if null, then use kbaseDefaultNarrativeOutput)
         * data - the object to be passed in to the widget
         * embed - if true, then embed the widget and render it.
         */
        createOutputCell: function(cell, result, isError, widget) {
            if (typeof result === 'string' && !isError) {
                // try to parse it as JSON.
                // if we fail, then it's not something we can deal with and shouldn't
                // make an output cell from it.
                try {
                    result = JSON.parse(result);
                    if (!result || typeof result !== 'object' || result === null)
                        return;
                }
                catch (err) {
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
            var outputTitle = '';
            var outputType = 'method';
            var data = isError ? result : result.data;

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
                var method = cell.metadata[this.KB_CELL].method;
                widget = result.widget;
                if (!widget) {
                    if (method.widgets && method.widgets.output) {
                        widget = method.widgets.output;
                    }
                    else {
                        widget = this.defaultOutputWidget;
                    }
                }
                outputTitle = method.title;
                if (!outputTitle && method.info && method.info.name)
                    outputTitle = method.info.name;
            }
            else if (this.isAppCell(cell)) {
                var app = cell.metadata[this.KB_CELL].app;
                outputTitle = app.info.name || 'KBase App';
                outputType = 'app';
            }
            if (isError) {
                widget = this.errorWidget;
                outputType = 'error';
            }

            var outputCell = isError ? this.addErrorCell(IPython.notebook.find_cell_index(cell), widget) :
                                       this.addOutputCell(IPython.notebook.find_cell_index(cell), widget);

            var uuid = this.uuidgen();
            var outCellId = 'kb-cell-out-' + uuid;
            var outputData = '{"data":' + data + ', ' + 
                               '"type":"' + outputType + '", ' +
                               '"widget":"' + widget + '", ' +
                               '"cellId":"' + outCellId + '", ' +
                               '"title":"' + outputTitle + '", ' +
                               '"time":' + this.getTimestamp() + '}'; 

            cellText = '<div id="' + outCellId + '"></div>\n' +
                       '<script>' +
                       '$("#' + outCellId + '").kbaseNarrativeOutputCell(' + outputData + ');' +
                       '</script>';
            outputCell.set_text(cellText);
            outputCell.rendered = false; // force a render
            outputCell.render();

            this.resetProgress(cell);
            this.trigger('updateData.Narrative');
        },

        /**
         * @method resetProgress
         * @private
         * Resets the progress bar in the given cell to not show any progress or progress message.
         * @param cell - the IPython notebook cell to reset.
         */
        resetProgress: function(cell) {
            var $progressBar = $(cell.element).find("#kb-func-progress .kb-cell-progressbar .progress-bar");
            $progressBar.css('width', '0%');

            var $progressMsg = $(cell.element).find("#kb-func-progress .text-success");
            $progressMsg.text("");
        },

        /**
         * @method showCellProgress
         *
         * Shows current progress in a running IPython function.
         * @param cell - the cell being run
         * @param name - the text of the progress to set
         * @param done - the number of steps finished.
         * @param total - the total number of steps to go through.
         *
         * @private
         */
        showCellProgress: function(cell, name, done, total) {
            var percentDone = 0;

            var $progressBar = $(cell.element).find("#kb-func-progress .kb-cell-progressbar .progress-bar");
            var $progressMsg = $(cell.element).find("#kb-func-progress .text-success");
            if (name === 'DONE') {
                $progressMsg.text("Completed");
                percentDone = 100;
                $progressBar.css('width', '100%');
                $(cell.element).find("#kb-func-progress").fadeOut(1000, $.proxy(function() { this.resetProgress(cell); }, this));
            }
            else {
                $progressMsg.text("Step " + done + " / " + total + ": " + name);
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
        addOutputCell: function(currentIndex, widget) {
            var cell = IPython.notebook.insert_cell_below('markdown', currentIndex);
            cell.celltoolbar.hide();
            this.setOutputCell(cell, widget);
            this.removeCellEditFunction(cell);

            return cell;
        },

        addErrorCell: function(currentIndex) {
            var cell = IPython.notebook.insert_cell_below('markdown', currentIndex);
            cell.celltoolbar.hide();
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

        workspace : function(key, value) {
            return this._accessor('_workspace', key, value);
        },

        _accessor : function(name, key, value) {
            if (this.data(name) == undefined) {
                this.data(name, {});
            }

            var obj = this.data(name);

            if (arguments.length == 2) {
                obj[key] = value;
            }

            if (arguments.length > 0) {
                return obj[key];
            }
            else {
                return obj;
            }
        },

        /* ------------------------------------------------------ */

        /**
         * Render the widgets.
         *
         * @returns this
         */
        render: function() {
            var creator = IPython.notebook.metadata.creator;
            if (creator) {// insert agnosticism here
                $('.creator-stamp').text('Created by ' + creator);
            }

            this.rebindActionButtons();
            this.hideGeneratedCodeCells();
            var cells = IPython.notebook.get_cells();
            for (var i=0; i<cells.length; i++) {
                this.checkCellMetadata(cells[i]);
            }
            this.loadAllRecentCellStates();
            // Check for older version of data dependencies
            // update them if necessary.
            this.trigger('updateData.Narrative');

            return this;
        },

        /*
         * Show input/output cell connections.
         */
         show_connections: function() {
            var self = this;
            console.debug("show_connections.start");
            _.each(_.pairs(this.connectable), function(pair) {
                var e1 = $('#kb-input-' + pair[0]);
                var e2 = $('#kb-output-' + pair[1]);
                self.connect(e1, e2, 20, 2,
                    $('#notebook-container'), 'kb-line');
            });
            console.debug("show_connections.end");
        },

        /**
         * Log out from all the widgets.
         *
         * @param token
         * @returns this
         */
        loggedOut: function(token) {
            if (this.dataTableWidget)
                this.dataTableWidget.loggedOut(token);
            this.ws_client = null, this.ws_auth = null;
        },

        /**
         * Initialize the logger
         */
        initLogging: function(level) {
            Logger.useDefaults();
            Logger.setLevel(level);
        },
        /**
         * uuid generator
         *
         * @private
         */
        uuidgen: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);});
        },

        /**
         * Returns a timestamp in milliseconds since the epoch.
         * (This is a one-liner, but kept as a separate function in case our needs change. 
         * Maybe we'll want to use UTC or whatever...)
         * @public
         */
        getTimestamp: function() {
            return new Date().getTime();
        },

        /**
         * Converts a timestamp to a simple string.
         * Do this American style - HH:MM:SS MM/DD/YYYY
         *
         * @param {string} timestamp - a timestamp in number of milliseconds since the epoch.
         * @return {string} a human readable timestamp
         */
        readableTimestamp: function(timestamp) {
            var format = function(x) {
                if (x < 10)
                    x = '0' + x;
                return x;
            };

            var d = new Date(timestamp);
            var hours = format(d.getHours());
            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth()+1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return hours + ":" + minutes + ":" + seconds + ", " + month + "/" + day + "/" + year;
        },

        /**
         * @method
         * Scans through all cells and performs a version updating, if necessary.
         * Updates performed:
         * 1. kbaseNarrativeCell -> kbaseNarrativeMethodCell
         * 2. More to come!
         */
        scanAndUpdateCells: function() {
            var cells = IPython.notebook.get_cells();
            for (var i=0; i<cells.length; i++) {
                var cell = cells[i];
                if (this.isFunctionCell(cell)) {
                    var cellText = cell.get_text();
                    var matchArr = cellText.match(/(<script>\s*\$\(['"]\#(.+)['"]\)\.)kbaseNarrativeCell/);
                    if (matchArr && matchArr.length >= 2) {
                        cellText = cellText.replace(matchArr[0], matchArr[1] + 'kbaseNarrativeMethodCell');
                    }
                    cell.set_text(cellText);
                    cell.rendered = false;
                    cell.render();
                }
            }
        },

    });

})( jQuery );