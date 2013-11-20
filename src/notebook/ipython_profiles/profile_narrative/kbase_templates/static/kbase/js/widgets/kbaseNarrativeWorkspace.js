/**
 * Top-level 'widget' for the workspace interaction with the KBase narrative.
 *
 * The widget lists the objects in the workspace and include a search field
 * to filter the list, as well as a button to 'Add' new items from sources 
 * like the CDS and local files.
 *
 * Options:
 *    workspaceURL - the location of the workspace service (default points to existing deployed service)
 *    loadingImage - an image to show in the middle of the widget while loading data
 *    tableElem - HTML element container for the data table
 *    controlsElem - HTML element container for the controls (search/add)
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeWorkspace", 
        parent: "kbaseWidget",
		version: "1.0.0",
		uploadWidget: 'x',
        dataTableWidget: 'y',
		options: {
            workspaceURL: "https://www.kbase.us/services/workspace",            
			loadingImage: "",
            tableElem: null,
            controlsElem: null
		},
        ws_client: null,
        ws_id: null,

		init: function(options) {
			this._super(options);
            this.initDataTable(options.tableElem);
            this.initControls(options.controlsElem);
            // bind search to data table
            $search_inp = options.controlsElem.find(':input');
            var that = this;
            $search_inp.on('change keyup', function(e) {
                var tbl = that.dataTableWidget.table;
                tbl.fnFilter($search_inp.val());
                tbl.fnDraw();
            });
            this.initFuncs();
            this.render();
			return this;
		},
        
        /**
         * Initialize controls at top of workspace view.
         *
         * @param elem Workspace view element
         * @returns this
         */
        initControls: function(elem) {
            console.debug('initControls.begin');
            var $search = $('<div>').addClass('kb-search')
            var $search_inp = $('<input>').attr('type', 'text');
            $search.append($search_inp);
            $search.append($('<i>').addClass('icon-search'));
            elem.append($search);
            // populate the dropdown
            var $dd_menu = $('<div>').addClass('dropdown').attr({id:'kb-ws-upload-pulldown'});
            var $dd_toggle = $('<a>').addClass("dropdown-toggle").attr({'data-toggle':'dropdown',
                            href: '#', id: 'kb-ws-add-data'}).text('+ Add');
            $dd_menu.append($dd_toggle);
            var ul = $('<ul>').addClass('dropdown-menu').attr({role: 'menu', 'aria-labelledby': 'dLabel'});
            ul.append($('<li>').addClass('nav-header').text('Add data from..'));
            ul.append($('<li>').addClass('divider'));
            var dd_items = { // key: [label, element_id]
                'upload': {label:'Local file', id: 'kb-ws-upload-local'},
                'cds': {label:'Central Data Store', id:'kb-ws-upload-cds'}
            }
            $.each(dd_items, function(key, info) {
                var item = $('<li>');
                item.append($('<a>').attr({'href': '#', 'id': info.id}).text(info.label));
                ul.append(item);
            })
            $dd_menu.append(ul);
            // add to element
            elem.append($dd_menu);
            // activate the dropdown
            $dd_toggle.dropdown();
            // bind the upload action
            var $dlg = $('#kb-ws-upload-dialog');
            var opts = {$anchor: $('#' + dd_items.upload.id),
                        ws_parent: this};
            this.uploadWidget_dlg = $dlg //$dlg.kbaseUploadWidget;
            this.uploadWidget_opts = opts;
            // Add a 'refresh' button, bound to this widget's render() function
            var $refresh = $('<button>')
                .addClass('btn btn-default btn-sm')
                .attr({'type': 'button', 'id': 'kb-ws-refresh'});
                //.text("Refresh");
            // XXX: BS-3 glyphicons aren't working
            //$refresh.append($('<span>').addClass("glyphicon glyphicon-refresh"));
            $refresh.append($('<i>').addClass('icon-refresh'));
            elem.append($refresh);
            var self = this;
            elem.on('click', function(e) {
                console.debug("refresh.begin");
                self.render();
                console.debug("refresh.end");
            });
            // done
            console.debug('initControls.end');
            return this;
        },

        /**
         * Initialize the data table in the workspace view
         *
         * @param elem Data table parent element
         * @returns this
         */
        initDataTable: function(elem) {
            this.dataTableWidget = elem.kbaseWorkspaceDataWidget({
                loadingImage: this.options.loadingImage,
                container: elem
             });
            return this;
        },

        /**
         * Set up interactive features of the function-list panel.
         */
        initFuncs: function() {
            console.debug("initFuncs.start");
            var env = this;
            $('.kb-function-body ul li').each(function(index) {
                var $anchor = $(this).find('a');
                this.name = $anchor.data('name');
                var self = this;
                // Add cell for function
                $anchor.click(function() {
                    env.addCellForFunction(self.name);
                });
                // Help for function
                var $anchor2 = $(this).find('span.kb-function-help');
                this.help = $anchor2.data('help');
                this.help_title = $anchor2.data('name');
                $anchor2.click(function() {
                    console.debug("help asked for");
                    var $elt = $('#kb-function-help');
                    $elt.addClass("alert alert-info");
                    $elt.html("<h1>" + self.help_title + " help</h1>" + 
                              self.help + 
                              "<h2>Click to hide</h2>");
                    $elt.click(function() {
                        $(this).hide();
                    });
                    $elt.show();
                });
            });
        },

        /**
         * Add a new IPython notebook cell for a given function.
         *
         * The name of the function comes from the 'data-name'
         * attribute in the HTML that is hard-coded into notebook.html
         * under $('div.kb-function-body ul').
         */
        addCellForFunction: function(name) {
            var env = this;
            var nb = IPython.notebook;
            this.kernel = nb.kernel; // stash current kernel
            var cell = nb.insert_cell_below('markdown');

            cell.metadata['kb-cell'] = 'function';

            this._cur_index = nb.ncells() - 1; // stash cell's index

            var config = this._getFunctionConfig(name);
            var content = this._buildRunForm(name, config);
            var cell_id = "kb-cell-" + this._cur_index;

            // add buttons
            content += "<div class='buttons pull-right' style='margin-top:10px'>" +
                           "<button id='" + cell_id + "-delete' type='button' value='Delete' class='btn btn-warning'>Delete</button> " +
                           "<button id='" + cell_id + "-run' type='button' value='Run' class='btn btn-primary'>Run</button>" + 
                       "</div>";

            // build progress bar and message (initially display:none)
            var progressBar = "<div id='kb-func-progress' style='display:none;'>" +
                                "<div class='progress progress-striped active kb-cell-progressbar'>" +
                                    "<div class='progress-bar progress-bar-success' role='progressbar' aria-valuenow='0' " +
                                    "aria-valuemin='0' aria-valuemax='100' style='width:0%'/>" +
                                "</div>" +
                                "<p class='text-success'/>" +
                              "</div>";

            cell.set_text("<div class='kb-cell-run' " + "id='" + cell_id + "'>" + 
                              "<h1>" + name + "</h1>" +
                              "<div class='kb-cell-params'>" +  
                                  content + 
                              "</div>" +
                              progressBar +
                          "</div>");

            cell.rendered = false; // force a render
            cell.render();

            this._removeCellEditFunction(cell);
            this._bindActionButtons(cell);
        },

        /**
         * @method _removeCellEditFunction
         * Removes the ability to edit a markdown cell by double-clicking or pressing Enter.
         * Handy for dealing with KBase function or output cells.
         * @param cell - the cell to modify.
         * @private
         */
        _removeCellEditFunction: function(cell) {
            // remove its double-click and return functions. sneaky!
            $(cell.element).off('dblclick');
            $(cell.element).off('keydown');
        },

        /**
         * @method _bindActionButtons
         * Binds the action (delete and run) buttons of a function cell.
         * This requires the cell to have {'kb-cell' : 'function'} in its metadata, otherwise it's ignored.
         * @param cell - the IPython Notebook cell with buttons to be bound.
         * @private
         */
        _bindActionButtons: function(cell) {
            // get the cell.
            // look for the two buttons.
            // bind them to the right actions.
            if (!cell.metadata || !cell.metadata['kb-cell'] || cell.metadata['kb-cell'] !== 'function')
                return;

            $(cell.element).find(".buttons [id*=delete]").off('click');
            $(cell.element).find(".buttons [id*=delete]").click(this._bindDeleteButton());
            $(cell.element).find(".buttons [id*=run]").off('click');
            $(cell.element).find(".buttons [id*=run]").click(this._bindRunButton());
        },

        /**
         * @method _getFunctionConfig
         * Yeah, I know. It's still ugly as sin. This all needs to be moved into a Kernel query that happens
         * on startup. But for now, it's functional.
         * @private
         * @return the configuration for a function from its name.
         */
        _getFunctionConfig: function(name) {
            switch(name) {
                case 'Plants Co-expression':
                    return this.plantsRunConfig;
                    break;

                case 'Assemble Contigs':
                    return this.runAssemblyConfig;
                    break;

                case 'Assemble Genome':
                    return this.assembleGenomeConfig;
                    break;

                case 'Annotate Genome':
                    return this.annotateGenomeConfig;
                    break;

                case 'View Genome Details':
                    return this.viewGenomeConfig;
                    break;

                case 'Genome To Draft FBA Model':
                    return this.genomeToFbaConfig;
                    break;

                case 'View FBA Model Details':
                    return this.viewFbaModelConfig;
                    break;

                case 'Build Media':
                    return this.buildMediaConfig;
                    break;

                case 'View Media':
                    return this.viewMediaConfig;
                    break;

                case 'Run Flux Balance Analysis':
                    return this.runFbaConfig;
                    break;

                case 'View FBA Results':
                    return this.viewFbaConfig;
                    break;

               case 'Gapfill FBA Model':
                    return this.runGapfillConfig;
                    break;

                case 'Integrate Gapfill Solution':
                    return this.integrateGapfillConfig;
                    break;

                default:
                    return { params : {}, command : {module: '', function: ''}};
            }
        },

        /**
         * @method _bindDeleteButton
         * @private
         */
        _bindDeleteButton: function() {
            var self = this;
            return( 
                function(event) {
                    event.preventDefault();
                    var idx = IPython.notebook.get_selected_index();
                    console.log("deleting selected cell: " + idx);
                    IPython.notebook.delete_cell(idx);
                }
            );
        },

        /**
         * @method _bindRunButton
         * @private
         */
        _bindRunButton: function() {
            var self = this;
            return (
                function(event) {
                    event.preventDefault();
                    var params = {};
                    // extract params from form
                    var cell = IPython.notebook.get_selected_cell();

                    /* Each function cell has a form, containing inputs.
                     * The selector below finds all children of the form, and filters them down to
                     * just "form inputs" - input, select, textarea, text, etc.
                     * the ':input' filter is a special jQuery thingy that lets this happen.
                     */
                    $(cell.element).find("form *").filter(":input").each(function(key, field) {
                        if (field.name && field.name.length > 0)
                            params[field.name] = field.value;
                    });

                    // Build the IPython function call.
                    var name = params['kbfunc'];
                    var command = self._getFunctionConfig(name).command;

                    console.debug("Run fn(" + name + ") with params", params);
                    self._runner()(cell, command, params);
                }
            );
        },

        /**
         * @method rebindRunButtons
         * Rebinds all the run buttons to their original function.
         * This iterates over all cells, looking for a 'kb-cell' field in its metadata.
         * If it finds it, it removes the double-click and keyboard-enter abilities from the cell.
         * If that 'kb-cell' field === 'function', it rebinds the delete and run buttons as well.
         *
         * @public
         */
        rebindRunButtons: function() {
            console.debug("rebindRunButtons.begin");
            // Rewrite the following to iterate using the IPython cell
            // based methods instead of DOM objects

    	    var cells = IPython.notebook.get_cells();
            console.log(cells);

            // not using $.each because its namespacing kinda screws things up.
            for (var i=0; i<cells.length; i++) {
                var cell = cells[i];
                var cellType = cell.metadata['kb-cell'];
                if (cellType) {
                    this._removeCellEditFunction(cell);
                    if (cellType === 'function') {
                        this._bindActionButtons(cell);
                    }
                }                
            }

            console.debug("rebindRunButtons.end");
        },


        /**
         * Build 'run script' HTML form from
         * configuration data. See 
         */
        _buildRunForm: function(name, cfg) {

            /**
             * Use cfg.params, like this:
             *
             *  viewGenomeRuntimeConfig: {
             *    'params' : {
             *      'Identifiers' : [
             *        {
             *           'name' : 'Genome',
             *           'type' : 'Genome',
             *           'default' : '',
             *        },
             *      ]
             *    },
             *    'command' : {
             *      'module' : 'biokbase.narrative.demo.microbes_workflow',
             *      'function' : 'view_genome_details'
             *    },
             *  }
             */

            var cls = "class='table'";
            var sbn = "style='border: none'";

            var text = "<form>" + 
                       "<input type='hidden' name='kbfunc' value='" + name + "' />" +
                       "<table " + cls + ">";

            var self = this;
            $.each(cfg.params, function(category, paramList) {
                text += "<tr " + sbn + "><td " + sbn + ">" + category + "</td>";
                $.each(paramList, function(idx, param) {
                    /* param is an object with these expected fields:
                     * {
                     *    name : <name of the parameter>
                     *    type : <type of parameter object - if left blank, a text input is used>
                     *    default: <default value>
                     * }
                     */

                    // if we don't have a name, it's a blank field.
                    if (!param.name || param.name.length === 0) {
                        // this cell intentionally left blank
                        text += "<td " + sbn + ">&nbsp;</td>";
                    }

                    // if we don't have a type (or it's blank), use a text field.
                    else if (!param.type || param.type.length === 0) {
                        // add a text input.
                        text += "<td " + sbn + "><label>" + param.name + "</label>" + 
                                "<input type='text' " + 
                                "name='" + category + "." + param.name + "' " +
                                "value='" + (param.default ? param.default : '') + "'>"
                                "</input></td>";
                    }

                    // if we have a type, get the list of objects of that type
                    // from the workspace.
                    else {
                        // if there's a type, add the list of available objects
                        // by type.
                        // if none, insert a static message? TODO.

                        var objectList = self.dataTableWidget.getLoadedData(param.type)[param.type];
                        objectList.sort(function(a, b) { 
                            if (a[0] < b[0]) 
                                return -1;
                            if (a[0] > b[0])
                                return 1;
                            return 0;
                        });
                        text += "<td " + sbn + ">" + 
                                "<label>" + param.name + "</label>" +
                                "<select name='" + category + "." + param.name + "'>";

                        for (var i=0; i<objectList.length; i++) {
                            text += "<option value='" + objectList[i][0] + "'>" + objectList[i][0] + "</option>";
                        }
                        text += "</select></td>";
                    }
                });

                text += "</tr>";
            });

            text += "</table>" +
                    "</form>";

            return text;
        },

        /**
         * Re-usable utility function to build the code block to run something.
         * From a Python package and module name, and a set of params as a Javascript object,
         * it builds a string of Python code that will invoke the command.
         * 
         * @return a String containing a Python command from the package, module, and passed parameters.
         * @private
         */
        _buildRunCommand: function(pkg, module, params) {
            var cmd = "run";
            var code = "from " + pkg + " import " + module + "\n";
            code += "reload(" + module + ")\n"; // in case it changed
            // hack to add in workspace id
            if (this.ws_id === null) {
                alert("Unable to run command: No active workspace!");
                return "";
            }
            code += "import os; os.environ['KB_WORKSPACE_ID'] = '" + this.ws_id + "'\n";
            code += "os.environ['KB_AUTH_TOKEN'] = '" + this.ws_auth + "'\n";
            code += "params = " + this._pythonDict(params) + "\n";
            code += module + "." + cmd + "(params)" + "\n";
            return code;
        },

        /**
         * Return a generic command runner.
         * This runner takes all its information from the passed in cell, command, and parameters to the
         * enclosed, return function.
         * 
         * @private
         * @return a function that takes in cell, command, and parameters for the command.
         */
        _runner: function() {
            var self = this;
            return function(cell, command, params) {
                var nb = IPython.notebook;
                var currentIndex = nb.get_selected_index();
                var codeCell = nb.insert_cell_below('code', currentIndex);
                codeCell.element.css("display", "none");

                var callbacks = {
                    'execute_reply' : function(content) { self._handle_execute_reply(cell, content); },
                    'output' : function(msg_type, content) { self._handle_output(cell, msg_type, content); },
                    'clear_output' : function(content) { self._handle_clear_output(cell, content); },
                    'set_next_input' : function(text) { self._handle_set_next_input(cell, text); },
                    'input_request' : function(content) { self._handle_input_request(cell, content); },
                };

                var code = self._buildRunCommand(command.module, command.function, params);
                codeCell.set_text(code);
                codeCell.output_area.clear_output(true, true, true);
                codeCell.set_input_prompt('*');
                console.log("Running function: " + command.function);

                self._resetProgress(cell);
                $(cell.element).find("#kb-func-progress").css({"display":"block"});
                var msgid = nb.kernel.execute(code, callbacks, {silent: true});
            };
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
        _handle_execute_reply: function (cell, content) {
            console.debug("Done running the function", content);
            this._showProgress(cell, "DONE", 0, 0);
            //this.set_input_prompt(content.execution_count);
            $([IPython.events]).trigger('set_dirty.Notebook', {value: true});
        },
        /**
         * @method _handle_set_next_input
         * @private
         */
        _handle_set_next_input: function (cell, text) {
            var data = {'cell': this, 'text': text}
            $([IPython.events]).trigger('set_next_input.Notebook', data);
        },
        /**
         * @method _handle_input_request
         * @private
         */
        _handle_input_request: function (cell, content) {
            console.log("handle input request called");
            return;
            //this.output_area.append_raw_input(content);
        },
        /**
         * @method _handle_clear_output
         * @private
         */
        _handle_clear_output: function (cell, content) {
            console.debug("handle clear ouput called");
            return;
            //this.clear_output(content.stdout, content.stderr, content.other);
        },

        /**
         * @method _handle_output
         */
        _handle_output: function (cell, msg_type, content) {
            // copied from outputarea.js
            console.debug("_handle_output got (" + msg_type + ") " + content);
            var buffer = "";
            if (msg_type === "stream") {
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
                            // 1st char hash is marker for progress line
                            var progress = line.match(/^#/);
                            // Found progress marker
                            if (progress) {
                                var items = line.substr(1, line.length - 1).split(",");
                                // expect: .p,name-of-thing,done,total
                                if (items.length == 3) {
                                    self._showProgress(cell, items[0], items[1], items[2]);
                                    // will trim buffer to remove this
                                    offs += line.length; 
                                    if (index < lines.length - 1) {
                                        offs += 1; // +1 for newline char
                                    }
                                }
                                else {
                                    done = true; // partial line; wait for more data
                                }
                            }
                            // No progress marker on non-empty line => final output of program?
                            else {
                                // XXX: @ and # should probably be swapped in meaning
                                if (line.match(/^@/)) {
                                    // log lines starting with '@'
                                    console.info("[KERNEL] " + line.substr(1, line.length).trim());
                                    // consume data
                                    offs += line.length;
                                }
                                else {
                                    console.debug("Saving line: "+ line);
                                    // save the line
                                    result += line;
                                    // all but the last line should have \n appended
                                    if (index < lines.length - 1) {
                                        result += "\n";
                                    }
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
                    // stop using the dom element for output and use the IPython cell
                    // var element = this._addOutputCell();
                    // this.result_handler(element, result);
                    if (this.dataTableWidget)
                        this.dataTableWidget.render();

                    var outputCell = this._addOutputCell(IPython.notebook.find_cell_index(cell));

                    var uuid = this._uuidgen();

                    var cellText = ["<div id=\""+uuid+"\"></div>",
                             "<script>",
                             "$(\"#"+uuid+"\")." + result + 
                             "// Make the element a little bigger",
                             "$(\"#"+uuid+"\").css({margin: '-10px'});",
                             "// Disable most actions on this element",
                             "$(\"#"+uuid+"\").off('click dblclick keydown keyup keypress focus');",
                             "</script>"].join('\n');
                    outputCell.set_text(cellText);
                    outputCell.rendered = false; // force a render
                    outputCell.render();

                }
            }
        },

        /**
         * @method _resetProgress
         * @private
         * Resets the progress bar in the given cell to not show any progress or progress message.
         * @param cell - the IPython notebook cell to reset.
         */
        _resetProgress: function(cell) {
            var $progressBar = $(cell.element).find("#kb-func-progress .kb-cell-progressbar .progress-bar");
            $progressBar.css('width', '0%');

            var $progressMsg = $(cell.element).find("#kb-func-progress .text-success");
            $progressMsg.text("");
        },

        /**
         * @method _showProgress
         *
         * Shows current progress in a running IPython function.
         * @param cell - the cell being run
         * @param name - the text of the progress to set
         * @param done - the number of steps finished.
         * @param total - the total number of steps to go through.
         *
         * @private
         */
        _showProgress: function(cell, name, done, total) {
            console.debug("Progress: '" + name + "': " + done + " / " + total);
            var percentDone = 0;

            var $progressBar = $(cell.element).find("#kb-func-progress .kb-cell-progressbar .progress-bar");
            var $progressMsg = $(cell.element).find("#kb-func-progress .text-success");
            if (name === 'DONE') {
                $progressMsg.text("Completed");
                percentDone = 100;
                $progressBar.css('width', '100%');
                $(cell.element).find("#kb-func-progress").fadeOut(1000);
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
        _addOutputCell: function(currentIndex) {
            var nb = IPython.notebook;
            var cell = nb.insert_cell_below('markdown', currentIndex);

            cell.metadata['kb-cell'] = 'output';
            this._removeCellEditFunction(cell);

            return( cell );
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
            this.rebindRunButtons();
            if (this.dataTableWidget !== undefined) {
                this.dataTableWidget.render();
            }
			return this;
		},

        /**
         * Log in to all the widgets.
         *
         * @param token
         * @returns this
         */
		loggedIn: function(token) {
            this.ws_client = new workspaceService(this.options.workspaceURL);
            this.ws_auth = token;
            var un = token.match(/un=[\w_]+|/);
            this.ws_user = un[0].substr(3, un[0].length - 3);
            // grab ws_id to give to, e.g., upload widget
            this.ws_id = this.dataTableWidget.loggedIn(this.ws_client, this.ws_auth).ws_id;
            this.workspace("id", this.ws_id); // add to global accessor
            // create/refresh the upload dialog, which needs login to populate types
            this.uploadWidget = this.uploadWidget_dlg.kbaseUploadWidget(this.uploadWidget_opts);
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
        _uuidgen: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);});
        },


        /***********************************************
         *********** FUNCTION CONFIGURATIONS ***********
         ***********************************************/

        /* -------------- PLANTS ---------------------- */
        /** 
         * Input data for plants demo.
         */
        plantsRunConfig: {
            params : {
                'Identifiers' : [
                    {
                        name: 'Genome',
                        type: '',
                        default: '3899'
                    },
                    {
                        name: 'Ontology',
                        type: '',
                        default: 'GSE5622'
                    },
                ],
                'Filter' : [
                    {
                        name: '-n',
                        type: '',
                        default: '100'
                    },
                    {
                        name: '',
                        type: '',
                        default: 'x'
                    }
                ],
                'Network' : [
                    {
                        name: 'Pearson cutoff',
                        type: '',
                        default: '0.50'
                    },
                    {
                        name: '',
                        type: '',
                        default: 'x'
                    }
                ],
                'Cluster' : [
                    {
                        name: 'Number of modules',
                        type: '',
                        default: '5'
                    },
                    {
                        name: '',
                        type: '',
                        default: ''
                    }
                ]
            },
            command: {
                'module' : 'biokbase.narrative.demo.coex_workflow',
                'function' : 'coex_network_ws'
            }
        },


        /* -------------- END: PLANTS ---------------------- */



        /* -------------- MICROBES ---------------- */

        /* --------- Assemble Contigs from FASTA reads -----------*/
        runAssemblyConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Paired-End Files<br>(comma-delimited)',
                    },
                    {
                        name: 'Single-End Files<br>(comma-delimited)',
                    },
                    {
                        name: 'Sequence Files<br>(comma-delimited)',
                    },
                ],
                'Assembly Params': [
                    {
                        name: 'Assemblers',
                    },
                    {
                        name: 'Reference',
                    },
                    {
                        name: 'Notes',
                    }
                ],
                'Output': [
                    {
                        name: 'Contig Set Name'
                    },
                    {
                        name: '',
                    },
                    {
                        name: '',
                    }
                ]
            },
            command: {
                'module' : 'biokbase.narrative.demo.microbes_workflow',
                'function' : 'run_assembly'
            }
        },

        /* ---------- Assemble Genome from Contigs ----------- */
        assembleGenomeConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Contig Set',
                        type: 'ContigSet'
                    },
                ],
                'Output' : [
                    {
                        name: 'New Genome',
                    }
                ]
            },
            command: {
                'module' : 'biokbase.narrative.demo.microbes_workflow',
                'function' : 'assemble_genome'
            }
        },

        /* ---------- Annotate Assembled Genome ----------- */
        annotateGenomeConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Genome',
                        type: 'Genome'
                    }
                ],
                'Output' : [
                    {
                        name: 'New Genome ID (optional)',
                    }
                ]
            },
            command: {
                'module' : 'biokbase.narrative.demo.microbes_workflow',
                'function' : 'assemble_genome'
            }
        },


        /* ---------- View Genome Details ----------- */

        // viewGenomeConfig: {
        //     'Identifiers' : {
        //         'Genome' : {
        //             'type' : 'Genome',
        //             'default' : '',
        //         }
        //     }
        // },

        viewGenomeConfig: {
            'params' : {
                'Identifiers' : [
                    {
                        name: 'Genome',
                        type: 'Genome',
                        default: ''
                    },
                ]
            },
            'command' : {
                'module' : 'biokbase.narrative.demo.microbes_workflow',
                'function' : 'view_genome_details'
            },
        },

        /* ------------ Genome to FBA Model ----------------- */ 
        genomeToFbaConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Genome',
                        type: 'Genome'
                    },
                ]
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'genome_to_fba_model'
            },
        },


        /* ---------- View Model ----------- */
        viewFbaModelConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Model',
                        type: 'Model'
                    }
                ]
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'view_fba_model'
            }
        },

        /* --------- Build Media ------------ */
        buildMediaConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Base Media (optional)',
                        type: 'Media',
                        default: 'None'
                    },
                ],
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'build_media'
            }
        },

        /* ---------- View Media ---------- */
        viewMediaConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Media',
                        type: 'Media',
                    }
                ]
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'view_media'
            }
        },

        /* --------- Run Flux Balance Analysis --------------- */
        runFbaConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Model',
                        type: 'Model'
                    },
                    {
                        name: 'Media',
                        type: 'Media'
                    }
                ],
                'Misc' : [
                    {
                        name: 'Notes',
                        type: '',
                    }
                ],
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'run_fba'
            },
        },


        /* ------------ View FBA Results ------------ */

        viewFbaConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'FBA Result',
                        type: 'FBA'
                    }
                ]
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'view_fba'
            }
        },

        /* ------------ Gapfill FBA Model -------------- */
        runGapfillConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Model',
                        type: 'Model',                        
                    },
                    {
                        name: 'Media',
                        type: 'Media',
                    }
                ],

                'Solutions' : [
                    {
                        name: 'Number to seek',
                        type: '',
                        default: '1',
                    }
                ],

                'Time' : [
                    {
                        name: 'Per Solution (sec)',
                        type: '',
                        default: '3600',
                    },
                    {
                        name: 'Total Limit (sec)',
                        type: '',
                        default: '3600'
                    }
                ],
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'run_gapfill'
            },
        },

        /* ------------ Integrate Gapfill Solution ---------------- */
        integrateGapfillConfig: {
            params: {
                'Identifiers' : [
                    {
                        name: 'Model',
                        type: 'Model',
                    },
                    {
                        name: 'Gapfill',
                    },
                ],
                'Output' : [
                    {
                        name: 'New Model (optional)'
                    },
                ],
            },
            command: {
                module: 'biokbase.narrative.demo.microbes_workflow',
                function: 'integrate_gapfill'
            }
        },

        /* --------------- END: MICROBES ----------------- */




	});

})( jQuery );