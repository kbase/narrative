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
            console.debug("adding cell for " + name);
            var nb = IPython.notebook;
            this.kernel = nb.kernel; // stash current kernel
            var cell = nb.insert_cell_at_bottom('markdown');
            this._cur_index = nb.ncells() - 1; // stash cell's index
            var command_builder = undefined;
            var config = {};
            var runner = this._runner(); 
            var funcs = this._getFunctionsForFunction(name);

            this.result_handler = funcs.result_handler;
            config = funcs.config;
            command_builder = funcs.command_builder;

            var content = this._buildRunForm(name, config);
            var cell_id = "kb-cell-" + this._cur_index;
            console.log(content);
            cell.set_text("<div class='kb-cell-run' " + "id='" + cell_id + "'>" + 
                          "<h1>" + name + "</h1>" +
                          "<div class='kb-cell-params'>" +  
                          content + 
                          "</div>" +
                          "</div>");

            cell.rendered = false; // force a render
            cell.render();
            this.element = $("#" + cell_id);
            var $frm = $('div#' + cell_id + ' form');
            var submit_fn = this._bindRunButton();
	    var cell_idx = this._cur_index;
            $frm.on("submit", ".btn-primary", submit_fn);
            $("#" + cell_id + " input[value='Delete']").click(this._bindDeleteButton(cell_id));
	    $("#"+cell_id+" .table input")[0].focus();
        },

         // yes, I know - ugh.
        _getFunctionsForFunction: function(name) {
            console.debug("Find custom functions for: " + name);
            switch(name) {
                // To add a new function, you need to define
                // one JSON structure for params, and one function
                // to build the actual command.
                case 'Plants Co-expression':
                    return {
                        // configuration for parameters
                        'config': this.plantsRunConfig,
                        // function to build the code which is executed
                        'command_builder': this.plantsRunCommand(),
                        // function to handle the result data
                        'result_handler': this.plantsCreateOutput
                    }
                    break;

                case 'Assemble Contigs':
                    return {
                        'config' : this.runAssemblyConfig,
                        'command_builder' : this.runAssemblyCommand(),
                        'result_handler' : this.runAssemblyCreateOutput,
                    }
                    break;

                case 'Assemble Genome':
                    return {
                        'config' : this.assembleGenomeConfig,
                        'command_builder' : this.assembleGenomeCommand(),
                        'result_handler' : this.assembleGenomeCreateOutput,
                    }
                    break;

                case 'Annotate Genome':
                    return {
                        'config' : this.annotateGenomeConfig,
                        'command_builder' : this.annotateGenomeCommand(),
                        'result_handler' : this.annotateGenomeCreateOutput,
                    };
                    break;

                case 'View Genome Details':
                    return {
                        'config' : this.viewGenomeConfig,
                        'command_builder' : this.viewGenomeCommand(),
                        'result_handler' : this.viewGenomeCreateOutput,
                    };
                    break;

                case 'Genome To Draft FBA Model':
                    return {
                        'config' : this.genomeToFbaConfig,
                        'command_builder' : this.genomeToFbaCommand(),
                        'result_handler' : this.genomeToFbaCreateOutput,
                    };
                    break;

                case 'View FBA Model Details':
                    return {
                        'config' : this.viewFbaModelConfig,
                        'command_builder' : this.viewFbaModelCommand(),
                        'result_handler' : this.viewFbaModelCreateOutput,
                    };
                    break;

                case 'Build Media':
                    return {
                        'config' : this.buildMediaConfig,
                        'command_builder' : this.buildMediaCommand(),
                        'result_handler' : this.buildMediaCreateOutput,
                    };
                    break;

                case 'View Media':
                    return {
                        'config' : this.viewMediaConfig,
                        'command_builder' : this.viewMediaCommand(),
                        'result_handler' : this.viewMediaCreateOutput,
                    };
                    break;

                case 'Run Flux Balance Analysis':
                    return {
                        'config' : this.runFbaConfig,
                        'command_builder' : this.runFbaCommand(),
                        'result_handler' : this.runFbaCreateOutput,
                    };
                    break;

                case 'View FBA Results':
                    return {
                        'config' : this.viewFbaConfig,
                        'command_builder' : this.viewFbaCommand(),
                        'result_handler' : this.viewFbaCreateOutput,
                    };
                    break;

               case 'Gapfill FBA Model':
                    return {
                        'config' : this.runGapfillConfig,
                        'command_builder' : this.runGapfillCommand(),
                        'result_handler' : this.runGapfillCreateOutput,
                    };
                    break;

                case 'Integrate Gapfill Solution':
                    console.log('Integrate Gapfill Solution');
                    return {
                        'config' : this.integrateGapfillConfig,
                        'command_builder' : this.integrateGapfillCommand(),
                        'result_handler' : this.runGapfillCreateOutput,
                    };
                    break;

                default:
                    return {};
            }
        },

        _bindDeleteButton: function() {
	    var self = this;
	    return( function(event) {
		    event.preventDefault();
		    var idx = IPython.notebook.get_selected_index();
		    IPython.notebook.delete_cell(idx);
		    console.log("Deleted cell at index " + idx);
		    });
	},

        _bindRunButton: function() {
            var self = this;
            return (function(event) {
                event.preventDefault();
                var params = {};
                // extract params from form
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
                var name = params['kbfunc'];
                var funcs = self._getFunctionsForFunction(name);
                if (self.result_handler === undefined) {
                    self.result_handler = funcs.result_handler;                    
                }
                console.debug("Run fn(" + name + ") with params", params);
                self._runner()(funcs.command_builder(params));
            });
        },

        // Rebind all the run buttons to their original function
        rebindRunButtons: function() {
            console.debug("rebindRunButtons.begin");
            var self = this;
	    // Rewrite the following to iterate using the IPython cell
	    // based methods instead of DOM objects
            //$.each($('div.kb-cell-run'), function(key, element) {
            //    self.element = $(element);
            //    var $frm = self.element.find('form');
            //    var submit_fn = self._bindRunButton();
            //    $frm.off("submit"); // unbind old                
            //    $frm.on("submit", submit_fn);
            //    console.debug('rebound submit on', $frm);
            //});
	    var cell_elem = IPython.notebook.get_cell_elements();
            $.each(cell_elem, function(cell_idx, cell_contents) {
		       console.debug('Examining cell ', cell_idx);
		       $.each( $(cell_contents).find('div.kb-cell-run'), function( key,element) {
				   self.element = $(element);
				   var $frm = self.element.find('form');
				   var submit_fn = self._bindRunButton();
				   $frm.off("submit"); // unbind old                
				   $frm.on("submit", submit_fn);
				   console.debug('rebound submit button');
				   $frm.find("input[value='Delete']").unbind('click');
				   $frm.find("input[value='Delete']").click(self._bindDeleteButton(cell_idx));
				   console.debug('rebound Delete button');

			       });
		   });
	    console.debug("rebindRunButtons.end");
        },

        /* -------------- PLANTS ---------------------- */
        /** 
         * Input data for plants demo.
         */
        plantsRunConfig: {
            'Identifiers': {
                'Genome': '3899',
                //'Ontology': 'PO:0001016'
                'Ontology': 'GSE5622'
            },
            'Filter': {
                //'-m': 'anova',
                '-n': '100',
                //'p-value': '0.00005',
                '':'x',
            },
            'Network': {
                'Pearson cutoff': '0.50',
                '':'x'
            },
            'Cluster': {
                //'-c': 'hclust',
                //'-n': 'simple'
                'Number of modules': '5',
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
                
            };
        },
        /** 
         * Create the output of the demo in the area given by 'element'.
         */
        //plantsCreateOutput: function(element, text) {
        plantsCreateOutput: function(cell, text) {
            // Since we must be done running, allow Run button to work again
            this.rebindRunButtons();
            // Now create output
            var oid = text.trim();
            var token = $("#login-widget").kbaseLogin("session","token");
            var full_id = this.ws_id + "." + oid;
            console.debug("ForceDirectedNetwork ID = "+full_id);
	    // grab the old contents of the cell and append the
	    // javascript call that pulls in the data and instantiates
	    // the widget - do this in the cell HTML instead of in the
	    // notebook code
	    var uuid = this._uuidgen();

	    var cell_text = ["<div id=\""+uuid+"\"></div>",
			     "<script>",
			     "$(\"#"+uuid+"\").ForceDirectedNetwork({",
			     "    workspaceID: \"" + this.ws_id + "." + oid+"\",",
			     "    token: \"" + token + "\"",
			     "});",
			     "// Make the element a little bigger",
			     "$(\"#"+uuid+"\").css({margin: '-10px'});",
			     "// Disable most actions on this element",
			     "$(\"#"+uuid+"\").off('click dblclick keydown keyup keypress focus');",
			     "</script>"].join('\n');
	    cell.set_text(cell_text);
            cell.rendered = false; // force a render
	    cell.render();

        },

        /* -------------- END: PLANTS ---------------------- */



        /* -------------- MICROBES ---------------- */

        /* --------- Assemble Contigs from FASTA reads -----------*/
        runAssemblyConfig: {
            'Identifiers' : {
                'Paired-End Files<br>(comma-delimited)': '',
                'Single-End Files<br>(comma-delimited)': '',
                'Sequence Files<br>(comma-delimited)': '',
            },
            'Assembly Params' : {
                'Assemblers' : '',
                'Reference' : '',
                'Notes' : '',
            },
            'Output' : {
                'Contig Set Name' : ''
            }
        },

        runAssemblyCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "run_assembly", params);
            };
        },

        runAssemblyCreateOutput: function(cell, text) {
            var jobId = "";
            for (var i=0; i<5; i++) {
                jobId += Math.floor((Math.random()*10));
            }
            var outText = "Your contig assembly job has been submitted successfully.<br/>" +
                          "Your job ID is <b>job." + jobId + "</b><br/>" + 
                          "This will likely take a few hours.<br/>" +
                          "When complete, your ContigSet will have ID <b>" + text + "</b>";

            cell.set_text(outText);
            cell.rendered = false; // force a render
	    cell.render();
        },

        /* ---------- Assemble Genome from Contigs ----------- */
        assembleGenomeConfig: {
            'Identifiers' : {
                'Contig Set' : '',
            },

            'Output' : {
                'New Genome' : '',
            }

        },

        assembleGenomeCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "assemble_genome", params);
            };
        },

        assembleGenomeCreateOutput: function(cell, text) {
            var data = JSON.parse(text);

            var tableRow = function(a, b) {
                return $("<tr>")
                       .append("<td>" + a + "</td>")
                       .append("<td>" + b + "</td>");
            };

            var $metaTable = $("<table>")
                             .addClass("table table-striped table-bordered")
                             .css({"margin-left":"auto", "margin-right":"auto", "width":"100%"})
                             .append(tableRow("<b>ID</b>", "<b>" + data[0] + "</b>"))
                             .append(tableRow("Scientific Name", data[10].scientific_name))
                             .append(tableRow("Size", data[10].size))
                             .append(tableRow("GC Content", (100*(data[10].gc)).toFixed(2) + "%"))
                             .append(tableRow("Location", data[7]));

            // element.append($metaTable);
            cell.set_text($metaTable);
            cell.rendered = false; // force a render
	    cell.render();

        },

        /* ---------- Annotate Assembled Genome ----------- */
        annotateGenomeConfig: {
            'Identifiers' : {
                'Genome' : '',
            },
            'Output' : {
                'New Genome ID (optional)': '',
            },

        },

        annotateGenomeCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "annotate_genome", params);
            };
        },

        annotateGenomeCreateOutput: function(cell, text) {
            cell.set_text(text);
            cell.rendered = false; // force a render
	    cell.render();
        },

        /* ---------- View Genome Details ----------- */
        viewGenomeConfig: {
            'Identifiers' : {
                'Genome' : '',
            },

        },

        viewGenomeCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "view_genome_details", params);
            };
        },

        viewGenomeCreateOutput: function(cell, text) {
            var data = JSON.parse(text);

            var tableRow = function(a, b) {
                return $("<tr>")
                       .append("<td>" + a + "</td>")
                       .append("<td>" + b + "</td>");
            };

            var calcGC = function(gc, total) {
                if (gc > 1)
                    gc = gc/total;
                return (100*gc).toFixed(2);
            };

            var $metaTable = $("<table>")
                             .addClass("table table-striped table-bordered")
                             .css({"margin-left":"auto", "margin-right":"auto", "width":"100%"})
                             .append(tableRow("<b>ID</b>", "<b>" + data[0] + "</b>"))
                             .append(tableRow("Scientific Name", data[10].scientific_name))
                             .append(tableRow("Size", data[10].size + " bp"))
                             .append(tableRow("GC Content", calcGC(data[10].gc, data[10].size) + "%"))
                             .append(tableRow("Number Features", data[10].number_features))
                             .append(tableRow("Location", data[7]));

            cell.set_text($("<p>").append($metaTable).html());
            cell.rendered = false; // force a render
	    cell.render();

        },

        /* ------------ Genome to FBA Model ----------------- */ 
        genomeToFbaConfig: {
            'Identifiers': {
                'Genome': '',
            },
    // -m --model         Name to be provided for output model
    // --genomews         Workspace where genome is located
    // --templateid       ID of template model to use
    // --templatews       Workspace with template model
    // --core             Build core model
    // -w --workspace     Reference default workspace
    // -o --overwrite     Overwrite any existing model with same name
    // -e --showerror     Set as 1 to show any errors in execution
    // -v --verbose       Print verbose messages
    // -? -h --help       Print this usage information
        },

        genomeToFbaCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "genome_to_fba_model", params);
            };
        },

        genomeToFbaCreateOutput: function(cell, text) {
	    var uuid = this._uuidgen();

	    var cell_text = ["<div id=\""+uuid+"\"></div>",
			     "<script>",
			     "$(\"#"+uuid+"\").kbaseModelMetaNarrative({",
			     "    data: " + text,
			     "});",
			     "// Disable most actions on this element",
			     "$(\"#"+uuid+"\").off('click dblclick keydown keyup keypress focus');",
			     "</script>"].join('\n');
	    cell.set_text(cell_text);
            cell.rendered = false; // force a render
	    cell.render();

            // element.kbaseModelMetaNarrative({data: data});
            // element.off('click dblclick keydown keyup keypress focus');
        },

        /* ---------- View Model ----------- */
        viewFbaModelConfig: {
            'Identifiers': {
                'Model': '',
            },
        },

        viewFbaModelCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "view_fba_model", params);
            };
        },

        viewFbaModelCreateOutput: function(cell, text) {
	    var uuid = this._uuidgen();
	    var cell_text = ["<div id=\""+uuid+"\"></div>",
			     "<script>",
			     "$(\"#"+uuid+"\").kbaseModelTabs({",
			     "    modelsData: " + text,
			     "});",
			     "$(\"#"+uuid+"\").css({ margin: '-10px' });",
			     "// Disable most actions on this element",
			     "$(\"#"+uuid+"\").off('click dblclick keydown keyup keypress focus');",
			     "</script>"].join('\n');
	    cell.set_text(cell_text);
            cell.rendered = false; // force a render
	    cell.render();

        },


        /* --------- Build Media ------------ */
        buildMediaConfig: {
            'Identifiers' : {
                'Base Media (optional)' : '',
            },
        },

        buildMediaCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "build_media", params);
            };
        },

        buildMediaCreateOutput: function(cell, text) {
	    var uuid = this._uuidgen();
	    var cell_text = ["<div id=\""+uuid+"\"></div>",
			     "<script>",
			     "$(\"#"+uuid+"\").kbaseMediaEditorNarrative({",
			     "    modelsData: " + text,
			     "    viewOnly: false,",
			     "    editOnly: true,",
			     "    ws: \"" + this.ws_id + "\",",
			     "    auth: \"" + this.ws_auth + "\",",
			     "});",
			     "</script>"].join('\n');
	    cell.set_text(cell_text);
            cell.rendered = false; // force a render
	    cell.render();

        },

        /* ---------- View Media ---------- */
        viewMediaConfig: {
            'Identifiers' : {
                'Media' : '',
            },
        },

        viewMediaCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", 
                    "view_media", params);
            };
        },

        viewMediaCreateOutput: function(cell, text) {
	    var uuid = this._uuidgen();
	    var cell_text = ["<div id=\""+uuid+"\"></div>",
			     "<script>",
			     "$(\"#"+uuid+"\").kbaseMediaEditorNarrative({",
			     "    mediaData: " + text,
			     "});",
			     "</script>"].join('\n');
	    cell.set_text(cell_text);
            cell.rendered = false; // force a render
	    cell.render();

        },


        /* --------- Run Flux Balance Analysis --------------- */
        runFbaConfig: {
            'Identifiers' : {
                'Model' : '',
                'Media' : '',
            },
            'Misc' : {
                'Notes' : '',
            },
        },

        runFbaCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", "run_fba", params);
            };
        },

        runFbaCreateOutput: function(cell, text) {
	    var uuid = this._uuidgen();
	    var cell_text = ["<div id=\""+uuid+"\"></div>",
			     "<script>",
			     "$(\"#"+uuid+"\").kbaseFbaTabsNarrative({",
			     "    fbaData: " + text,
			     "});",
			     "</script>"].join('\n');
	    cell.set_text(cell_text);
            cell.rendered = false; // force a render
	    cell.render();

        },


        /* ------------ View FBA Results ------------ */

        viewFbaConfig: {
            'Identifiers' : {
                'FBA Result' : '',
            },
        },

        viewFbaCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", "view_fba", params);
            };
        },

        viewFbaCreateOutput: function(cell, text) {
	    var uuid = this._uuidgen();
	    var cell_text = ["<div id=\""+uuid+"\"></div>",
			     "<script>",
			     "$(\"#"+uuid+"\").kbaseFbaTabsNarrative({",
			     "    fbaData: " + text,
			     "});",
			     "</script>"].join('\n');
	    cell.set_text(cell_text);
            cell.rendered = false; // force a render
	    cell.render();
        },

        /* ------------ Gapfill FBA Model -------------- */
        runGapfillConfig: {
            'Identifiers' : {
                'Model' : '',
                'Media' : '',
            },
            'Solutions' : {
                'Number to seek' : '1',
            },
            'Time' : {
                'Per Solution (sec)' : '3600',
                'Total Limit (sec)' : '3600'
            }
        },

        runGapfillCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", "run_gapfill", params);
            };
        },

        runGapfillCreateOutput: function(cell, text) {
            var data = JSON.parse(text);
            var jobId = data.id;
            var totalTime = data.jobdata.postprocess_args[0].totalTimeLimit;
            var totalTimeHrs = totalTime/3600;
            var outModel = data.jobdata.postprocess_args[0].out_model;

            var outputText = "<div>Your gapfill job has been successfully queued, with job ID: <b>" + jobId + "</b>.<br/>" +
                             "This will take approximately " + totalTime + " seconds (" + totalTimeHrs + " hour" +
                             (totalTimeHrs === 1 ? "" : "s") + ").<br/><br/>" +
                             "Your gapfill solutions will be stored in model ID: <b>" + outModel + "</b>.</div>";
	    cell.set_text(outputText);
            cell.rendered = false; // force a render
	    cell.render();

        },

        /* ------------ Integrate Gapfill Solution ---------------- */
        integrateGapfillConfig: {
            'Identifiers' : {
                'Model' : '',
                'Gapfill' : '',
            },
            'Output' : {
                'New Model (optional)' : ''
            }
        },

        integrateGapfillCommand: function() {
            var self = this;
            return function(params) {
                return self._buildRunCommand("biokbase.narrative.demo.microbes_workflow", "integrate_gapfill", params);
            };
        },

        integrateGapfillCreateOutput: function(cell, text) {
	    cell.set_text(text);
            cell.rendered = false; // force a render
	    cell.render();

        },



        /* --------------- END: MICROBES ----------------- */


        /**
         * Build 'run script' HTML form from
         * configuration data. See 
         */
        _buildRunForm: function(name, cfg) {
            console.log('_buildRunForm');
            console.log(cfg);

            var cls = "class='table'";
            var sbn = "style='border: none'";

            var text = "<form>" + 
                       "<input type='hidden' name='kbfunc' value='" + name + "' />" +
                       "<table " + cls + ">";
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
		    "<div class='buttons'>" +
                    "<input type='button' value='Delete' class='btn btn-warning' style='margin-top:5px'></input>" +
                    "<input type='submit' value='Run' class='btn btn-primary' style='margin-top:5px'></input>" + 
		    "</div>" +
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
            code += "os.environ['KB_AUTH_TOKEN'] = '" + this.ws_auth + "'\n";
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
                // @@ code cell
                var nb = IPython.notebook;
                self.code_cell = nb.insert_cell_at_bottom('code');
                self.code_cell.element.css("display", "none");
                var callbacks = {
                    'execute_reply': $.proxy(self._handle_execute_reply, self),
                    //'output': $.proxy(self.output_area.handle_output, self.output_area),
                    //'output': $.proxy(self._handle_output, self),
                    'output': $.proxy(self._handle_output, self),
                    'clear_output': $.proxy(self._handle_clear_output, self),
                    'set_next_input': $.proxy(self._handle_set_next_input, self),
                    'input_request': $.proxy(self._handle_input_request, self)
                };
                self._buf = ""; // buffered output, see _handle_output()
                //self.element.addClass("running");
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
                // @@ create code cell
                self.code_cell.set_text(code); // @@ can this be skipped?
                // @@ old execute
                // var msg_id = self.kernel.execute(code, callbacks, {silent: true});
                self.code_cell.output_area.clear_output(true, true, true);
                self.code_cell.set_input_prompt('*');
                self.code_cell.element.addClass("running");
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
            console.debug("_handle_output got (" + msg_type + ") " + content);
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
                    this._buf = this._buf.substr(offs, this._buf.length - offs);
                }
                if (result.length > 0) {
		    // stop using the dom element for output and use the IPython cell
                    // var element = this._addOutputCell();
                    // this.result_handler(element, result);
		    var cell = this._addOutputCell();
                    this.result_handler(cell, result);
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
            // return $('#' + eid);
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
         }
	});

})( jQuery );