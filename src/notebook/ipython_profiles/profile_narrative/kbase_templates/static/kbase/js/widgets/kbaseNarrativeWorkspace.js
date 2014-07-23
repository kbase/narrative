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
        name: "kbaseNarrativeWorkspace", 
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            tableElem: null,
            controlsElem: null,
            ws_id: null,
        },
        ws_client: null,
        ws_id: null,
        defaultOutputWidget: "kbaseDefaultNarrativeOutput",
        defaultInputWidget: "kbaseDefaultNarrativeInput",
        errorWidget: "kbaseNarrativeError",

        inputsRendered: false,
        maxSavedStates: 2,      // limit the states saved to 2 for now.

        // constant strings.
        KB_CELL: 'kb-cell',
        KB_TYPE: 'type',
        KB_FUNCTION_CELL: 'function_input',
        KB_OUTPUT_CELL: 'function_output',
        KB_ERROR_CELL: 'kb_error',
        KB_CODE_CELL: 'kb_code',
        KB_STATE: 'widget_state',

        init: function(options) {
            this._super(options);

            var self = this;

            this.ws_id = this.options.ws_id;
            // Whenever the notebook gets loaded, it should rebind things.
            // This *should* only happen once, but I'm putting it here anyway.

            $([IPython.events]).on('notebook_loaded.Notebook', $.proxy(function() {
                this.rebindActionButtons();
                this.hideGeneratedCodeCells();
            }), this);

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
                        if (!this.inputsRendered)
                            this.loadAllRecentCellStates();
                        this.inputsRendered = true;
                    }
                },
                this)
            );

            $(document).on('narrativeDataQuery.Narrative', $.proxy(function(e, params, callback) {
                    var objList = this.getCurrentNarrativeData();
                    if (callback) {
                        callback(objList);
                    }
                },
                this)
            );

            // When a user clicks on a function, this event gets fired with
            // method information. This builds a function cell out of that method
            // and inserts it in the right place.
            $(document).on('function_clicked.Narrative', function(event, method) {
                self.buildFunctionCell(method);
            });


            // Initialize the data table.

            this.render();
            return this;
        },
        
        /**
         * @method buildFunctionCell
         * @param {Object} method - the JSON schema version of the method to invoke. This will
         * include a list of parameters and outputs.
         */
        buildFunctionCell: function(method) {
//            console.debug("buildFunctionCell.start method:",method);

            var cell = IPython.notebook.insert_cell_below('markdown');
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
                var buttons = "<div class='buttons pull-right'>" + //style='margin-top:10px'>" +
                                  "<button id='" + cellId + "-delete' type='button' value='Delete' class='btn btn-default btn-sm'>Delete</button> " +
                                  "<button id='" + cellId + "-run' type='button' value='Run' class='btn btn-primary btn-sm'>Run</button>" + 
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
                var methodInfo = "<div class='kb-func-desc'>" +
                                   "<h1><b>" + method.title + "</b></h1>" +
                                   "<span class='pull-right kb-func-timestamp' id='last-run'></span>" +
                                   "<button class='btn btn-default btn-xs' type='button' data-toggle='collapse'" +
                                      " data-target='#" + methodId + "'>" + buttonLabel + "</button>" +
                                    "<div><h2 class='collapse' id='" + methodId + "'>" +
                                      methodDesc + "</h2></div>" +
                                 "</div>";

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
         * @post This does not modify the input object.
         * @return {string} JSON string
         */
        safeJSONStringify: function(method) {
            var esc = function(s) { return s.replace(/'/g, "&apos;").replace(/"/g, "&quot;"); };
            return JSON.stringify(method, function(key, value) {
                return (typeof(value) == "string" && (key == "description" || key == "title")) ?
                    esc(value) : value;
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

        setFunctionCell: function(cell, method) {
            var cellInfo = {}
            cellInfo[this.KB_TYPE] = this.KB_FUNCTION_CELL;
            cellInfo['method'] = method;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = method.properties.widgets.input || this.defaultInputWidget;

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
            if (!this.isFunctionCell(cell) && !this.isOutputCell(cell))
                return;

            var target;
            var widget;

            if (this.isFunctionCell(cell)) {
                widget = cell.metadata[this.KB_CELL].method.properties.widgets.input || this.defaultInputWidget;
                target = "#inputs";
            }
            else if (this.isOutputCell(cell)) {
                // do output widget stuff.
                widget = cell.metadata[this.KB_CELL].widget;
                target = "#output";
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
                this.dbg("Unable to save state for cell:");
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
                var target;
                var widget;

                // if it's labeled as a function cell do that.
                if (this.isFunctionCell(cell)) {
                    widget = cell.metadata[this.KB_CELL].method.properties.widgets.input || this.defaultInputWidget;
                    target = "#inputs";
                }
                // if it's labeled as an output cell do that.
                else if (this.isOutputCell(cell)) {
                    // do output widget stuff.
                    widget = cell.metadata[this.KB_CELL].widget;
                    target = "#output";
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
                        this.dbg('Unable to load cell state! Ignoring the following cell:')
                        this.dbg(cell);
                        this.dbg(err);
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
            if (this.isFunctionCell(cell) || this.isOutputCell(cell)) {
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
                        this.bindActionButtons(cell);
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
            var cmd = "import biokbase.narrative.common.service as Service\n" +
                      "method = Service.get_service('" + service + "').get_method('" + method + "')\n";

                      // THIS SHOULD ONLY BE SET AT STARTUP BY THE MAIN JAVASCRIPT!!
                      // "import os; os.environ['KB_WORKSPACE_ID'] = '" + this.ws_id + "'\n" +
                      // "os.environ['KB_AUTH_TOKEN'] = '" + this.ws_auth + "'\n";

            var paramList = params.map(function(p) { return "'" + p + "'"; });
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
//            console.debug("Done running the function", content);
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
        handleOutput: function (cell, msgType, content) {
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
                            // look for @@S, @@P, @@D, @@G, or @@E
                            var matches = line.match(/^@@([SPDGE])(.*)/);
                            if (matches) { // if we got one
                                switch(matches[1]) {
                                    case 'S':
                                        // if we're starting, init the progress bar.
                                        break;

                                    case 'D':
                                        // were done, so hide the progress bar (wait like a second or two?)
                                        self.resetProgress(cell);
                                        break;

                                    case 'P':
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

                                    case 'E':
                                        var errorJson = matches[2];
                                        errorJson = errorJson.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\$/g, "&#36;");
                                        self.createErrorCell(cell, errorJson);
                                        break;

                                    case 'G':
                                        var debug = matches[2];
                                        self.dbg("[KERNEL] " + debug);
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
                    this.createOutputCell(cell, result);
                }
            }
        },

        /**
         * Creates an error cell and populates it with the JSON error object.
         */
        createErrorCell: function(cell, errorJson) {
            var error = {
                'widget': this.errorWidget,
                'data': '{"error": ' + errorJson + "}",
                'embed': true
            };

            var widget = this.errorWidget;

            var errorCell = this.addErrorCell(IPython.notebook.find_cell_index(cell), widget);

            // kinda ugly, but concise. grab the method. if it's not falsy, fetch the title from it.
            // worst case, it'll still be falsy, and we can deal with it in the header line.
            var methodName = cell.metadata[this.KB_CELL].method;
            if (methodName)
                methodName = methodName.title;

            var uuid = this.uuidgen();
            var errCellId = 'kb-cell-err-' + uuid;

            var widgetInvoker = this.errorWidget + "({ \"error\" : " + errorJson + "});";

            var header = '<span class="kb-err-desc"><b>' + 
                            (methodName ? methodName : 'Unknown method') + 
                            '</b> - Error</span><span class="pull-right kb-func-timestamp">' + 
                            this.readableTimestamp(this.getTimestamp()) +
                            '</span>' + 
                         '';

            var cellText = '<div class="kb-cell-error" id="' + errCellId + '">' +
                                '<div class="panel panel-danger">' + 
                                    '<div class="panel-heading">' + header + '</div>' +
                                    '<div class="panel-body"><div id="error"></div></div>' +
                                '</div>' +
                           '</div>\n' +
                           '<script>' +
                           '$("#' + errCellId + ' > div > div > div#error").' + widgetInvoker +
                           '</script>';

            errorCell.set_text(cellText);
            errorCell.rendered = false; // force a render
            errorCell.render();

            this.resetProgress(cell);
            this.trigger('updateData.Narrative');
        },

        /**
         * Result is an object with this structure:
         * cell = the invoking function cell.
         * result = the result data object from the Python call.
         * widget - the widget to use (if null, then use kbaseDefaultNarrativeOutput)
         * data - the object to be passed in to the widget
         * embed - if true, then embed the widget and render it.
         */
        createOutputCell: function(cell, result) {
            if (typeof result === 'string')
                result = JSON.parse(result);

            // If result.embed is false,
            // or if the result doesn't have any data to put into a widget,
            // don't make a widget! Assume that this will have thrown an error somewhere
            // along the way.
            //
            // Note that an empty object is not null! So if result.data = {}, it'll still do something.
            if (!result.embed || result.data === null || result.data === undefined) {
                //do something.
                return;
            }

            var widget = result.widget || this.defaultOutputWidget;

            var outputCell = this.addOutputCell(IPython.notebook.find_cell_index(cell), widget);

            // kinda ugly, but concise. grab the method. if it's not falsy, fetch the title from it.
            // worst case, it'll still be falsy, and we can deal with it in the header line.
            var methodName = cell.metadata[this.KB_CELL].method;
            if (methodName)
                methodName = methodName.title;

            var uuid = this.uuidgen();
            var outCellId = 'kb-cell-out-' + uuid;

            // set up the widget line
            var widgetInvoker = "";
            if (result.widget && result.widget.length > 0)
                widgetInvoker = result.widget + "(" + result.data + ");";
            else
                widgetInvoker = this.defaultOutputWidget + "({'data' : " + result.data + "});";

            var header = '<span class="kb-out-desc"><b>' + 
                            (methodName ? methodName : 'Unknown method') + 
                            '</b> - Output</span><span class="pull-right kb-func-timestamp">' + 
                            this.readableTimestamp(this.getTimestamp()) +
                            '</span>' + 
                         '';

            var cellText = '<div class="kb-cell-output" id="' + outCellId + '">' +
                                '<div class="panel panel-default">' + 
                                    '<div class="panel-heading">' + header + '</div>' +
                                    '<div class="panel-body"><div id="output"></div></div>' +
                                '</div>' +
                           '</div>\n' +
                           '<script>' +
                           '$("#' + outCellId + ' > div > div > div#output").' + widgetInvoker +
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

            this.setOutputCell(cell, widget);
            this.removeCellEditFunction(cell);

            return cell;
        },

        addErrorCell: function(currentIndex) {
            var cell = IPython.notebook.insert_cell_below('markdown', currentIndex);
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
            this.rebindActionButtons();
            this.hideGeneratedCodeCells();
            var cells = IPython.notebook.get_cells();
            for (var i=0; i<cells.length; i++) {
                this.checkCellMetadata(cells[i]);
            }
            this.loadAllRecentCellStates();
            this.trigger('updateData.Narrative');
            return this;
        },

        /**
         * Log in to all the widgets.
         *
         * @param token
         * @returns this
         */
        loggedIn: function(token) {
            // this.ws_client = new workspaceService(this.options.workspaceURL);
            // this.ws_auth = token;
            // var un = token.match(/un=[\w_]+|/);
            // this.ws_user = un[0].substr(3, un[0].length - 3);
            // grab ws_id to give to, e.g., upload widget

            //this.dataTableWidget.loggedIn(this.ws_client, this.ws_auth).ws_id;


            // this.workspace("id", this.ws_id); // add to global accessor


            // create/refresh the upload dialog, which needs login to populate types
//            this.uploadWidget = this.uploadWidget_dlg.kbaseUploadWidget(this.uploadWidget_opts);
            //this.uploadWidget.createDialog(); -- redundant
            this.render();
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
            // var meridian = "am";
            // if (hours >= 12) {
            //     hours -= 12;
            //     meridian = "pm";
            // }
            // if (hours === 0)
            //     hours = 12;

            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth()+1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return hours + ":" + minutes + ":" + seconds + ", " + month + "/" + day + "/" + year;
        },


    });

})( jQuery );