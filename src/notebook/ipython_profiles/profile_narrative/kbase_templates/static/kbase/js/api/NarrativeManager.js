/**
 *
 *
 *  options should be:
 *      ws_url: ...           
 *      nms_url: ...
 *
 */
var NarrativeManager = function(options, auth, auth_cb) {

    // setup URLs and Clients
    if (!options) {
        console.error("NarrativeManager: options must be defined.");
        return;
    }
    this.config = {};
    this.config.ws_url  = options.ws_url;
    this.config.nms_url = options.nms_url;
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
     *      info.narrative_info = [ .. ]
     *      info.object_info = [ ws_reference : [ .. ] ]
     *      
     *  }
     *
     *
     *  
     */
    this.createTempNarrative = function(params, _callback, _error_callback) {
        var self = this;
        var id = new Date().getTime();
        var ws_name = this.user_id + ":" + id;
        var nar_name = "Narrative."+id;
        
        console.log("creating "+name);
        
        var wsMetaData = {
            'narrative' : nar_name,
            'is_temporary' : 'true',
            'pending_shared_users': '[]',
            'rejected_shared_users': '[]'
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
                var metadataInternal = {
                    job_ids: { methods:[], apps:[] },
                    format:'ipynb',
                    creator:self.user_id,
                    ws_name:ws_name,
                    name:"Untitled",
                    type:"KBaseNarrative.Narrative",
                    description:"",
                    data_dependencies:[]
                };
                var metadataExternal = {
                    job_ids: '{"methods":[],"apps":[]}',
                    format:'ipynb',
                    creator:self.user_id,
                    ws_name:ws_name,
                    name:"Untitled",
                    type:"KBaseNarrative.Narrative",
                    description:"",
                    data_dependencies:'[]'
                };
                var narrativeObject = {
                    nbformat_minor: 0,
                    worksheets: [],
                    metadata: metadataInternal,
                    nbformat:3
                };
                
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
                                    service: "NarrativeManager",
                                    description: "Created new Workspace/Narrative bundle."
                                }
                            ],
                            hidden:0
                        }]
                    },
                    function(obj_info_list) {
                        console.log('saved narrative:');
                        console.log(obj_info_list);
                    }, function (error) {
                        console.error(error);
                        if(_error_callback) { _error_callback(error); }
                    }
                )
                
            },
            function(error) {
                console.error(error);
                if(_error_callback) { _error_callback(error); }
            }
        );
        
        
        
    };
    
    /**
     * Makes a temporary narrative permanent by giving it a name
     */
    this.nameNarrative = function(params, _callback, _error_callback) {
    };
    
    
    this.discardTempNarrative = function(params, _callback, _error_callback) {
    };
    
    
    /**
     * 
     */
    this.cleanTempNarratives = function(params, _callback, _error_callback) {
    };
    
    
    this.shareNarrative = function(params, _callback, _error_callback) {
    }; 
    
    
    /**
     *  _callback = function(list) {
     *
     *      list = [
     *          mine: [
     *              {
     *                  ws_info: [...],
     *                  narrative_info: [...],
     *                  ..
     *              },
     *              ...
     *              ]
     *          shared_readable: [ .. ],
     *          shared_writable: [ .. ],
     *          pending: [ .. ],
     *          public: [ .. ]
     *      ]
     *  }
     *
     *
     *  
     */
    this.listNarratives = function(params, _callback, _error_callback) {
    };
    
    
    
    
    /* private method to setup the narrative object */
    //this._createLocalNarrativeObject(cells, parameters) {
        
    //}
    
};



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
 
 
 


