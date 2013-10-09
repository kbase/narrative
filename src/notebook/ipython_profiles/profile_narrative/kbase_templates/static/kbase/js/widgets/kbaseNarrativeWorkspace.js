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
            console.debug("adding cell for " + name);
            var nb = IPython.notebook;
            this.kernel = nb.kernel; // stash current kernel
            var cell = nb.insert_cell_at_bottom('markdown');
            this._cur_index = nb.ncells() - 1; // stash cell's index
            var command_builder = undefined;
            var config = {};
            var runner = this._runner(); 
            switch(name) {
                // To add a new function, you need to define
                // one JSON structure for params, and one function
                // to build the actual command.
                case 'plants':
                    // configuration for parameters
                    config = this.plantsRunConfig;
                    // function to build the code which is executed
                    command_builder = this.plantsRunCommand();
                    // function to handle the result data
                    this.result_handler = this.plantsCreateOutput;
                    break;
                case 'Genome To FBA Model':
                    config = this.genomeToFbaConfig;
                    command_builder = this.genomeToFbaCommand();
                    this.result_handler = this.genomeToFbaCreateOutput;
                    break;
            }
            var content = this._buildRunForm(config);
            var cell_id = "kb-cell-" + this._cur_index;
            cell.set_text("<div class='kb-cell-run' " + "id='" + cell_id + "'>" + 
                          "<h1>" + name + "</h1>" +
                          "<div class='kb-cell-params'>" +  
                          content + 
                          "</div>" +
                          "</div>");
            cell.rendered = false; // force a render
            cell.render();
            this.element = $("#" + cell_id);
            var $frm = $('div.kb-cell-run form');
            $frm.on("submit", function(event) {
                event.preventDefault();
                var params = {};
                var fn_name = ""; 
                $.each($(this)[0], function(key, field) {
                    var full_name = field.name;
                    var value = field.value;
                    //console.debug("field " + key + ": " + full_name + "=" + value);
                    switch(full_name) {
                        case "":
                            break;
                        default:
                            params[full_name] = value;
                    }
                });
                console.debug("Run with params", params);
                runner(command_builder(params));
            });
        },

        /* -------------- PLANTS ---------------------- */
        /** 
         * Input data for plants demo.
         */
        plantsRunConfig: {
            'Identifiers': {
                'Genome': '3899',
                'Ontology': 'PO:0001016'
            },
            'Filter': {
                //'-m': 'anova',
                //'-n': '100',
                'p-value': '0.05',
                '':'x',
            },
            'Network': {
                'Pearson cutoff': '0.75',
                '':'x'
            },
            'Cluster': {
                //'-c': 'hclust',
                //'-n': 'simple'
                'Number of modules': '50',
                '':'x'
            }
        },
        /**
         * Run plants demo on backend.
         * Closure is used to get proper context.
         */
        plantsRunCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.coex_workflow",
                        "coex_network_ws", params);
            }
        },
        /** 
         * Create the output of the demo in the area given by 'element'.
         */
        plantsCreateOutput: function(element, text) {
            var oid = text.trim();
            var token = $("#login-widget").kbaseLogin("session","token");
            var full_id = this.ws_id + "." + oid;
            console.debug("ForceDirectedNetwork ID="+full_id);
            element.ForceDirectedNetwork({
                workspaceID: this.ws_id + "." + oid,
                token: token
            });
            // Make the element a little bigger
            element.css({margin: '-10px'});
            // Disable most actions on this element
            element.off('click dblclick keydown keyup keypress focus');
        },

        /* -------------- END: PLANTS ---------------------- */

        /* -------------- MICROBES ---------------- */
        genomeToFbaConfig: {
            'Identifiers': {
                'Genome': '',
            },
        },

        genomeToFbaCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", "genome_to_fba", params);
            }
        },

        genomeToFbaCreateOutput: function(element, text) {
            var data = JSON.parse(text);

            console.log("got to fba output");
            console.log(element);
//            element.html("Finished genome to fba");
            element.kbaseModelMetaNarrative({data: data});
            element.css({ margin: '-10px' });
            element.off('click dblclick keydown keyup keypress focus');
        },

        /* --------------- END: MICROBES ----------------- */


        /**
         * Build 'run script' HTML form from
         * configuration data. See 
         */
        _buildRunForm: function(cfg) {
            var sbn = "style='border: none'";
            var text = "<form>" + 
                       "<input type='hidden' name='kbfunc' value='plants' />" +
                       "<table " + sbn + ">";
            $.each(cfg, function(key, value) {
                text += "<tr " + sbn + "><td " + sbn + ">" + key + "</td>";
                $.each(value, function(key2, value2) { 
                    if (key2 == '') {
                        // this cell intentionally left blank
                        text += "<td " + sbn + ">&nbsp;</td>";
                    }
                    else {
                        text += "<td " + sbn + "><label>" + key2 + "</label>" + 
                               "<input type='text' " + 
                               "name='" + key + "." + key2 + "' " +
                               "value='" + value2 + "'>"
                               "</input></td>";
                    }
                });
                text += "</tr>";
            });
            text += "</table>" +
                    "<input type='submit' value='Run' class='button'></input>" + 
                    "</form>";
            return text;
        },

        /**
         * Re-usable utility function to build the code block to run something.
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
            code += "params = " + this._pythonDict(params) + "\n";
            code += module + "." + cmd + "(params)" + "\n";
            console.debug("CODE:", code);
            return code;
        },

        /**
         * Return a generic command runner.
         */
        _runner: function() {
            var self = this;
            return function(code) {
                var callbacks = {
                    'execute_reply': $.proxy(self._handle_execute_reply, self),
                    //'output': $.proxy(self.output_area.handle_output, self.output_area),
                    'output': $.proxy(self._handle_output, self),
                    'clear_output': $.proxy(self._handle_clear_output, self),
                    'set_next_input': $.proxy(self._handle_set_next_input, self),
                    'input_request': $.proxy(self._handle_input_request, self)
                };
                self._buf = ""; // buffered output, see _handle_output()
                self.element.addClass("running");
                // Progress bar elements
                var eoffs = self.element.position();
                self.progressdiv = $('<div/>').addClass('progress progress-striped').css({
                    'width': '400px', 'height': '20px'});
                self.progressbar = $('<div/>').addClass('progress-bar progress-bar-success').attr({
                    'role': 'progressbar', 'aria-valuenow': '0', 'aria-valuemin': '0', 'aria-valuemax': '100'})
                    .css('width', '0%');
                self.progressmsg = $('<p/>').addClass('text-success');
                self.progressdiv.append(self.progressbar);
                self.element.append(self.progressdiv);
                self.element.append(self.progressmsg);
                // activate progress dialog
                var msg_id = self.kernel.execute(code, callbacks, {silent: true});
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
        _handle_execute_reply: function (content) {
            console.debug("Done running the function", content);
            this._showProgress("DONE", 0, 0);
            //this.set_input_prompt(content.execution_count);
            $([IPython.events]).trigger('set_dirty.Notebook', {value: true});
        },
        /**
         * @method _handle_set_next_input
         * @private
         */
        _handle_set_next_input: function (text) {
            var data = {'cell': this, 'text': text}
            $([IPython.events]).trigger('set_next_input.Notebook', data);
        },
        /**
         * @method _handle_input_request
         * @private
         */
        _handle_input_request: function (content) {
            console.log("handle input request called");
            return;
            //this.output_area.append_raw_input(content);
        },
        /**
         * @method _handle_clear_output
         * @private
         */
        _handle_clear_output: function (content) {
            console.debug("handle clear ouput called");
            return;
            //this.clear_output(content.stdout, content.stderr, content.other);
        },

        /**
         * @method _handle_output
         */
        _handle_output: function (msg_type, content) {
            // copied from outputarea.js
            if (msg_type === "stream") {
                this._buf += content.data;
                var lines = this._buf.split("\n");
                var offs = 0, done = false, self = this;
                var result = "";
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
                                    self._showProgress(items[0], items[1], items[2]);
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
                            // No progress marker on non-empty line => final output of program
                            else {
                                // save the line
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
                    this._buf = this._buf.substr(offs, this._buf.length - offs);
                }
                if (result.length > 0) {
                    var element = this._addOutputCell();
                    this.result_handler(element, result);
                    this._buf = "";
                }
            }
        },

        /**
         * @method _show_progress
         * @private
         */
        _showProgress: function(name, done, total) {
            console.debug("Progress: '" + name + "': " + done + " / " + total);
            var pct_done = 0;
            if (name == 'DONE') {
                this.progressmsg.text("Completed");
                pct_done = 100;
            }
            else {
                this.progressmsg.text("Step " + done + " / " + total + ": " + name);
                pct_done = (100 * done - 100) / total;
            }

            this.progressbar.css('width', pct_done.toFixed(0) + '%');

            if (name == 'DONE') {
                this.progressmsg.fadeOut(1000);
                this.progressdiv.fadeOut(1000);
                this.element.removeClass('running');
            }
        },

        /**
         * Add a new cell for output of the script.
         *
         * XXX: The cell is added at the bottom, which is really
         * not the right thing to do if the script is in
         * the middle of the narrative. It should replace or
         * at least insert itself right after the script.
         *
         * @method _addOutputCell
         * @private
         * @return id of <div> inside cell where content can be placed
         */
         _addOutputCell: function() {
            var nb = IPython.notebook;
            var cell = nb.insert_cell_at_bottom('markdown');
            eid = this._uuidgen();
            var content = "<div id='" + eid + "'></div>";
            cell.set_text(content);
            cell.rendered = false; // force a render
            cell.render();
            return $('#' + eid);
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
         }
	});

})( jQuery );