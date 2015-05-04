/**
 *
 *
 *  options should be:
 *      ws_url: ...           
 *      nms_url: ...
 *
 */
define(['jquery'], function( $ ) {
    return function(options, auth, auth_cb) {

        // setup URLs and Clients
        if (!options) {
            console.error("NarrativeManager: options must be defined.");
            return;
        }
        this.config = {};
        this.config.ws_url = null;
        this.config.nms_url = null;
        if (options.ws_url) { this.config.ws_url  = options.ws_url; }
        else if (window.kbconfig && window.kbconfig.urls) {
            this.config.ws_url = window.kbconfig.urls.workspace;
        }
        if (options.nms_url) { this.config.nms_url  = options.nms_url; }
        else if (window.kbconfig && window.kbconfig.urls) {
            this.config.nms_url = window.kbconfig.urls.narrative_method_store;
        }
        
        if (typeof(this.config.ws_url) != "string" || this.config.ws_url.trim().length === 0) {
            this.config.ws_url = "https://kbase.us/services/ws";
        }
        if (typeof(this.config.nms_url) != "string" || this.config.nms_url.trim().length === 0) {
            this.config.nms_url = "https://kbase.us/services/narrative_method_store/rpc";
        }
        this.config.auth    = auth ? auth : { 'token' : '', 'user_id' : ''};
        if (!auth.user_id) {
            if (auth.token) {
                this.config.auth.user_id = auth.token.split('|')[0].split('=')[1];
            }
        }
        this.user_id = this.config.auth.user_id;
        this.config.auth_cb = auth_cb;

        this.ws = new Workspace(this.config.ws_url, this.config.auth, this.config.auth_cb);
        this.nms = new NarrativeMethodStore(this.config.nms_url, this.config.auth, this.config.auth_cb);
        
        /**
         *  creates a new Narrative in the single Narrative, single WS approach
         *
         *  // all are optional ...
         *  params =
         *  {
         *      cells : [
         *          { app: app_id },
         *          { method: method_id },
         *          { markdown: markdown },
         *          { code: code }
         *      ],
         *      parameters : [
         *          {
         *              cell: n,           // indicates index in the cell
         *              step_id: id,
         *              parameter_id: id,  
         *              value: value
         *          }
         *      ],
         *      importData : [
         *          {
         *               ref: ws_reference,  
         *               newName : name
         *          },
         *          ...
         *      ]
         *  }
         *
         *  _callback = function(info) {
         *
         *      info.ws_info = [ .. ]
         *      info.nar_info = [ .. ]
         *      info.object_info = [ ws_reference : [ .. ] ]
         *      
         *  }
         */
        this.createTempNarrative = function(params, _callback, _error_callback) {
            var self = this;
            var id = new Date().getTime();
            var ws_name = this.user_id + ":" + id;
            var nar_name = "Narrative."+id;
            
            console.log("creating "+name);
            
            var wsMetaData = {
                'narrative' : nar_name,
                'is_temporary' : 'true'
                //'pending_shared_users': '[]',
                //'rejected_shared_users': '[]'
            };
            
            // 1 - create ws
            self.ws.create_workspace(
                {
                    workspace: ws_name,
                    description: "",
                    meta: wsMetaData
                },
                function(ws_info) {
                    console.log("workspace created:");
                    console.log(ws_info);
                    
                    // 2 - create the Narrative object
                    var narObjs = self.buildNarrativeObjects(
                        ws_name, params.cells, params.parameters,
                        function(narrativeObject, metadataExternal) {
                            // 3 - save the Narrative object
                            self.ws.save_objects(
                                {
                                    workspace: ws_name,
                                    objects: [{
                                        type: "KBaseNarrative.Narrative",
                                        data: narrativeObject,
                                        name: nar_name,
                                        meta: metadataExternal,
                                        provenance: [
                                            {
                                                script: "NarrativeManager.js",
                                                description: "Created new Workspace/Narrative bundle."
                                            }
                                        ],
                                        hidden:0
                                    }]
                                },
                                function(obj_info_list) {
                                    console.log('saved narrative:');
                                    console.log(obj_info_list);
                                    _callback({ws_info:ws_info, nar_info: obj_info_list[0]});
                                    // better to keep the narrative perm id instead of the name
                                    self.ws.alter_workspace_metadata(
                                        {wsi:{workspace:ws_name},new:{narrative:obj_info_list[0][0]+''}},
                                        function() {},
                                        function() {});
                                }, function (error) {
                                    console.error(error);
                                    if(_error_callback) { _error_callback(error); }
                                });
                        },
                        _error_callback
                    );
                },
                function(error) {
                    console.error(error);
                    if(_error_callback) { _error_callback(error); }
                }
            );
        };
        
        this.discardTempNarrative = function(params, _callback, _error_callback) {
        };
        
        
        /**
         * 
         */
        this.cleanTempNarratives = function(params, _callback, _error_callback) {
        };
        
        /*
         *      cells : [
         *          { app: app_id },
         *          { method: method_id },
         *          { markdown: markdown },
         *          { code: code }
         *      ],
         *      parameters : [
         *          {
         *              cell: n,           // indicates index in the cell
         *              step_id: id,
         *              parameter_id: id,  
         *              value: value
         *          }
         *      ],
         */
        
        /* private method to setup the narrative object,
        returns [narrative, metadata]
        */
        this.buildNarrativeObjects = function(ws_name, cells, parameters, _callback, _error_callback) {
            var self = this;
            // first thing first- we need to grap the app/method specs
            self._getSpecs(cells,
                function() {
                    // now we can create the metadata and populate the cells
                    var metadata = {
                        job_ids: { methods:[], apps:[], job_usage:{'queue_time':0, 'run_time':0} },
                        format:'ipynb',
                        creator:self.user_id,
                        ws_name:ws_name,
                        name:"Untitled",
                        type:"KBaseNarrative.Narrative",
                        description:"",
                        data_dependencies:[]
                    };
                    var cell_data = [];
                    if (cells) {
                        if (cells.length>0) {
                            for(var c=0; c<cells.length; c++) {
                                if (cells[c].app) {
                                    var appCell = self._buildAppCell(cell_data.length, self._specMapping.apps[cells[c].app]);
                                    cell_data.push(appCell);
                                } else if (cells[c].method) {
                                    var methodCell = self._buildMethodCell(cell_data.length, self._specMapping.methods[cells[c].method]);
                                    cell_data.push(methodCell);
                                } else if (cells[c].markdown) {
                                    cell_data.push({
                                        cell_type: 'markdown',
                                        source: cells[c].markdown,
                                        metadata: {}
                                    });
                                }
                                //else if (cells[c].code) { }
                                else {
                                    console.error('cannot add cell '+c+', unrecognized cell content');
                                    console.error(cells[c]);
                                    if(_error_callback) { _error_callback('cannot add cell '+c+', unrecognized cell content'); }
                                }
                            }
                        } else {
                            cell_data.push(
                                {
                                    cell_type: 'markdown',
                                    source: self.introText,
                                    metadata: { }
                                });
                        }
                    }
                    
                    var narrativeObject = {
                        nbformat_minor: 0,
                        worksheets: [ {
                            cells: cell_data,
                            metadata: {}
                        }],
                        metadata: metadata,
                        nbformat:3
                    };
                    
                    // setup external string to string metadata for the WS object
                    var metadataExternal = {};
                    for(var m in metadata) {
                        if (metadata.hasOwnProperty(m)) {
                            if (typeof metadata[m] === 'string') {
                                metadataExternal[m] = metadata[m];
                            } else {
                                metadataExternal[m] = JSON.stringify(metadata[m]);
                            }
                        }
                    }
                    _callback(narrativeObject, metadataExternal);
            
                },
                _error_callback
                );
        };
        
        this._buildAppCell = function(pos,spec) {
            var cellId = 'kb-cell-'+pos+'-'+this._uuidgen();
            var cell = {
                cell_type: 'markdown',
                source: "<div id='" + cellId + "'></div>" +
                        "\n<script>" +
                        "$('#" + cellId + "').kbaseNarrativeAppCell({'appSpec' : '" + this._safeJSONStringify(spec) + "', 'cellId' : '" + cellId + "'});" +
                        "</script>",
                metadata: { }
            };
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_APP_CELL;
            cellInfo['app'] = spec;
            cellInfo[this.KB_STATE] = [];
            cell.metadata[this.KB_CELL] = cellInfo;
            return cell;
        };
        
        this._buildMethodCell = function(pos,spec) {
            var cellId = 'kb-cell-'+pos+'-'+this._uuidgen();
            var cell = {
                cell_type: 'markdown',
                source: "<div id='" + cellId + "'></div>" +
                        "\n<script>" +
                        "$('#" + cellId + "').kbaseNarrativeMethodCell({'method' : '" + this._safeJSONStringify(spec) + "'});" +
                        "</script>",
                metadata: { }
            };
            var cellInfo = {};
            cellInfo[this.KB_TYPE] = this.KB_FUNCTION_CELL;
            cellInfo['method'] = spec;
            cellInfo[this.KB_STATE] = [];
            cellInfo['widget'] = spec.widgets.input;
            cell.metadata[this.KB_CELL] = cellInfo;
            return cell;
        };
        
        // map the app ID to the spec, map method id to spec
        this._specMapping = {
            apps : {},
            methods : {}
        };
        /** populates the app/method specs **/
        this._getSpecs = function(cells, _callback, _error_callback) {
            var self = this;
            if (cells) {
                var appSpecIds = []; var methodSpecIds = [];
                this._specMapping = { apps : {}, methods : {} }
                for(var c=0; c<cells.length; c++) {
                    if (cells[c].app) {
                        appSpecIds.push(cells[c].app);
                    } else if (cells[c].method) {
                        methodSpecIds.push(cells[c].method);
                    }
                }
                var getSpecsJobs = [];
                if (appSpecIds.length>0) {
                    getSpecsJobs.push(
                        self.nms.get_app_spec({ids:appSpecIds},
                            function(appSpecs) {
                                for (var a=0; a<appSpecs.length; a++) {
                                    self._specMapping.apps[appSpecIds[a]] = appSpecs[a];
                                }
                            },
                            function(error) {
                                console.error("error getting app specs:");
                                console.error(error);
                                if(_error_callback) { _error_callback(); }
                            }));
                }
                if (methodSpecIds.length>0) {
                    getSpecsJobs.push(
                        self.nms.get_method_spec({ids:methodSpecIds},
                            function(methodSpecs) {
                                for (var a=0; a<methodSpecs.length; a++) {
                                    self._specMapping.methods[methodSpecIds[a]] = methodSpecs[a];
                                }
                            },
                            function(error) {
                                console.error("error getting method specs:");
                                console.error(error);
                                if(_error_callback) { _error_callback(); }
                            }));
                }
                
                if (getSpecsJobs.length>0) {
                    $.when.apply($, getSpecsJobs).done(function() {
                        _callback();
                    });
                } else {
                    _callback();
                }
            } else {
                _callback();
            }
        };
        
        
        
        // !! copied from kbaseNarrativeWorkspace !!
        this._safeJSONStringify = function(string) {
            var esc = function(s) { 
                return s.replace(/'/g, "&apos;")
                        .replace(/"/g, "&quot;");
            };
            return JSON.stringify(string, function(key, value) {
                return (typeof(value) === 'string') ? esc(value) : value;
            });
        };
        // !! copied from kbaseNarrativeWorkspace !!
        this._uuidgen = function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);});
        };
        
        // !! copied from kbaseNarrativeWorkspace !!
        this.KB_CELL= 'kb-cell';
        this.KB_TYPE= 'type';
        this.KB_APP_CELL= 'kb_app';
        this.KB_FUNCTION_CELL= 'function_input';
        this.KB_OUTPUT_CELL= 'function_output';
        this.KB_ERROR_CELL= 'kb_error';
        this.KB_CODE_CELL= 'kb_code';
        this.KB_STATE= 'widget_state';
        
        
        
        // this.introText =
        //     "Welcome to KBase!\n============\n\n"+
        //     "Add Data to this Narrative\n------------\n\n"+
        //     "Click on '<b>Add Data</b>' and browse for KBase data or upload your own."+
        //     "Select the data and click 'Add to narrative'.  Perhaps start by "+
        //     "importing your favorite Genome.  Once your data has been loaded, "+
        //     "you can inspect it in the data list.\n<br>\n\n"+
        //     "Perform an Analysis\n------------\n\n"+
        //     "When you're ready, select an App or Method to run on your data.  "+
        //     "Simply click on an App or Method on the side bar, and it will appear "+
        //     "directly in your Narrative.  Fill in the parameters and click run.  "+
        //     "Output will be generated and new data objects may be created and added "+
        //     "to your data list.  Add and run as many Apps and Methods as you like!\n\n"+
        //     "Long running computations can be tracked in your Jobs panel, located on "+
        //     "the side panel under the 'Manage' tab.\n<br>\n\n"+
        //     "Save & Share your Results\n------------\n\n"+
        //     "When you're ready, name this Narrative and save it.  Once it is saved, "+
        //     "click on the 'share' button above to let others view your analysis.  Or if you're "+
        //     "brave, make it public for the world to see.\n<br><br>\n\n"+
        //     "\nThat's it!\n\n"+
        //     "<b>Questions?</b> Visit https://kbase.us to search for more detailed tutorials and documentation.\n\n"+
        //     "<b>More Questions?</b> Email: [help@kbase.us](mailto:help@kbase.us)\n\n\n";

        this.introText = 
            "![KBase Logo](/static/kbase/images/kbase_logo.png) Welcome to the " +
            "Narrative Interface!\n" +
            "===\n\n" + 
            "<a href='https://staging.kbase.us/narrative-guide/' style='text-decoration:underline'>What's a Narrative?</a>\n" +
            "---\n" +
            "Design and carry out collaborative computational experiments while " + 
            "creating Narratives: interactive, shareable, and reproducible records " +
            "of your data, computational steps, and thought processes.\n\n" +
            "<a href='https://staging.kbase.us/narrative-guide/explore-data/' style='text-decoration:underline'>Get Some Data</a>\n" +
            "---\n" +
            "Click the Add Data button in the Data Panel to browse for KBase data or " +
            "upload your own. Mouse over a data object to add it to your Narrative, and " + 
            "check out more details once the data appears in your list.\n\n" +
            "<a href='https://staging.kbase.us/narrative-guide/browse-apps-and-methods/' style='text-decoration:underline'>Analyze It</a>\n" + 
            "---\n" +
            "Browse available analyses that can be run using KBase apps or methods " +
            "(apps are just multi-step methods that make some common analyses more " +
            "convenient). Select an analysis, fill in the fields, and click Run. " +
            "Output will be generated, and new data objects will be created and added " +
            "to your data list. Add to your results by running follow-on apps or methods.\n\n" +
            "<a href='https://staging.kbase.us/narrative-guide/share-narratives/' style='text-decoration:underline'>Save and Share Your Narrative</a>\n" +
            "---\n" +
            "Be sure to save your Narrative frequently. When you’re ready, click " + 
            "the share button above to let collaborators view your analysis steps " +
            "and results. Or better yet, make your Narrative public and help expand " +
            "the social web that KBase is building to make systems biology research " +
            "open, collaborative, and more effective.\n\n" +
            "<a href='https://staging.kbase.us/narrative-guide/' style='text-decoration:underline'>Find Documentation and Help</a>\n" +
            "---\n" +
            "For more information, please see the " +
            "<a href='http://staging.kbase.us/narrative-guide/' style='text-decoration:underline'>Narrative Interface User Guide</a> " +
            "or the <a href='http://staging.kbase.us/apps/' style='text-decoration:underline'>app/method tutorials</a>.\n\n" +
            "Questions? <a href='http://staging.kbase.us/contact-us' style='text-decoration:underline'>Contact us</a>!\n\n" +
            "Ready to begin adding to your Narrative? You can keep this Welcome cell or " +
            "delete it with the trash icon in the top right corner.";

        return this;
    };
});


/*

WORKSPACE INFO
0: ws_id id
1: ws_name workspace
2: username owner
3: timestamp moddate,
4: int object
5: permission user_permission
6: permission globalread,
7: lock_status lockstat
8: usermeta metadata

 
*/
 
 
 


