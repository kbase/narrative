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
                $anchor2.click(function() {
                    console.debug("help asked for");
                    var $elt = $('#kb-function-help');
                    $elt.addClass("alert alert-info");
                    $elt.text(self.help);
                    $elt.click(function() {
                        $(this).hide();
                    });
                    $elt.show();
                });
            });
        },

        /**
         * Add a new IPython notebook cell for a given function.
         */
        addCellForFunction: function(name) {
            var env = this;
            console.debug("adding cell for " + name);
            var nb = IPython.notebook;
            var cell = nb.insert_cell_at_bottom('markdown');
            var content = "";
            var runner = undefined;
            switch(name) {
                case 'plants':
                    content = this._plantsContent();
                    runner = this._plantsRunner();
                    break;
                case 'communities':
                    content = this._communitiesContent();
                    break; 
                default:
                    content = "wtf?!"
                    break;
            }
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
                runner(fn_name, params);
            });
        },

        /** 
         * Generate input form for plants demo.
         */
        _plantsContent: function() {
            var cfg = {
                'Filter': {
                    gene_id: '3899',
                    ontology_id: 'PO:0009025',
                },
                'Network': {
                    '-m': 'simple',
                    '-t': 'edge'
                },
                'Cluster': {
                    '-c': 'hclust',
                    '-n': 'simple'
                }
            }
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
         * Run plants demo on backend
         */
        _plantsRunner: function(name, params) {
            console.debug("run function:" + name);
            //var pymod =  "biokbase.narrative.demo.coex_workflow.coex_network_ws";
            // Build code
            var pymod =  "biokbase.narrative.demo.coex_workflow.coex_network_test";
            var pyfunc = "run";
            var code = "from " + pymod + " import " + pyfunc + "\n";
            code += "params = " + this._pythonDictify(params) + "\n";
            code += pyfunc + "(params)" + "\n";
            console.debug("CODE:",code);
            var callbacks = {
                'execute_reply': $.proxy(this._handle_execute_reply, this),
                //'output': $.proxy(this.output_area.handle_output, this.output_area),
                'output': $.proxy(this._handle_output, this),
                'clear_output': $.proxy(this._handle_clear_output, this),
                'set_next_input': $.proxy(this._handle_set_next_input, this),
                'input_request': $.proxy(this._handle_input_request, this)
            };
            // XXX: mark this widget as running.. and block other things from running..
            this.element.addClass("running");
            var msg_id = this.kernel.execute(code, callbacks, {silent: true});
        },

        /* ------------------------------------------------------
         * Functions to handle running code.
         */
        /**
         * @method _handle_execute_reply
         * @private
         */
        _handle_execute_reply: function (content) {
            alert("Done running!")
            //this.set_input_prompt(content.execution_count);
            this.element.removeClass("running");
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
        _handle_output: function (content) {
            // XXX: copied from outputarea.js
            var json = {};
            json.output_type = "pyout"; //msg_type;
            if (msg_type === "stream") {
                json.text = content.data;
                json.stream = content.name;
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
            console.debug("OUTPUT", json);
            // XXX: transform output into a new cell
            return;
        },
        /** We all oveah dem mime types */
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