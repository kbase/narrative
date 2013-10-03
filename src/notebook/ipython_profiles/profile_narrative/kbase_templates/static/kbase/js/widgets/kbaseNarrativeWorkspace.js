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
            console.debug("kbaseNarrativeWorkspace options:", options);
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
            this.uploadWidget = $dlg.kbaseUploadWidget(opts);
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
                    break;
            }
            var content = this._buildRunForm(config);
            cell.set_text("<div class='kb-cell-run'>" + 
                          "<h1>" + name + "</h1>" +
                          "<div class='kb-cell-params'>" +  
                          content + 
                          "</div>" +
                          "</div>");
            cell.rendered = false; // force a render
            cell.render();
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
                // capture & ignore double-click
                $('div.kb-cell-run').dblclick(function(event) {
                    console.debug("double-click");
                });
                $('div.kb-cell-params').dblclick(function(event) {
                    console.debug("double-click");
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
            'Filter': {
                gene_id: '3899',
                ontology_id: 'PO:0009025',
                '-m': 'anova',
                '-n': '100',
            },
            'Network': {
                '-c': '0.75',
            },
            'Cluster': {
                '-c': 'hclust',
                '-n': 'simple'
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
        /* -------------- END: PLANTS ---------------------- */

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
                    text += "<td " + sbn + "><label>" + key2 + "</label>" + 
                           "<input type='text' " + 
                           "name='" + key + "." + key2 + "' " +
                           "value='" + value2 + "'>"
                           "</input></td>";
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
                // XXX: mark self widget as running.. and block other things from running..
                //self.element.addClass("running");
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
            console.debug("Done running the function");
            //this.set_input_prompt(content.execution_count);
            //this.element.removeClass("running");
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
            return;
            //this.output_area.append_raw_input(content);
        },
        /**
         * @method _handle_clear_output
         * @private
         */
        _handle_clear_output: function (content) {
            return;
            //this.clear_output(content.stdout, content.stderr, content.other);
        },
        /**
         * @method _handle_output
         * @private
         */
        _handle_output: function (msg_type, content) {
            // copied from outputarea.js
            var json = {};
            json.output_type = msg_type;
            if (msg_type === "stream") {
                json.text = content.data;
                json.stream = content.name;
            // The rest of this isn't really used
            } else if (msg_type === "display_data") {
                json = this.convert_mime_types(json, content.data);
                json.metadata = this.convert_mime_types({}, content.metadata);
            } else if (msg_type === "pyout") {
                json.prompt_number = content.execution_count;
                json = this.convert_mime_types(json, content.data);
                json.metadata = this.convert_mime_types({}, content.metadata);
            } else if (msg_type === "pyerr") {
                json.ename = content.ename;
                json.evalue = content.evalue;
                json.traceback = content.traceback;
            }
            // Transform output into a new cell
            this._addOutputCell(json.text);
            return;
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
         */
         _addOutputCell: function(text) {
            console.debug("Output cell content:", text);
            var nb = IPython.notebook;
            var cell = nb.insert_cell_at_bottom('markdown');
            // by surrounding with div's we guarantee that markdown
            // sees this as HTML content
            var content = "<div>\n" + text + "\n</div>";
            cell.set_text(content);
            cell.rendered = false; // force a render
            cell.render();
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
            console.debug("NarrativeWorkspace.loggedIn");
            this.ws_client = new workspaceService(this.options.workspaceURL);
            this.ws_auth = token;            
            // grab ws_id to give to, e.g., upload widget
            this.ws_id = this.dataTableWidget.loggedIn(this.ws_client, this.ws_auth).ws_id;
            // refresh the upload dialog, which needs login to populate types
            console.debug("refresh upload widget");
            this.uploadWidget.createDialog();
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
        }

	});

})( jQuery );