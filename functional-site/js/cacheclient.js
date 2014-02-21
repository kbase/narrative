

//https://kbase.us/services/fba_model_services/ //production fba service not deployed

// This saves a request by service name, method, params, and promise
// Todo: Make as module
function Cache() {
    var cache = [];

    this.get = function(service, method, params) {
        for (var i in cache) {
            var obj = cache[i];
            if (service != obj['service']) continue;
            if (method != obj['method']) continue;
            if ( angular.equals(obj['params'], params) ) { return obj; }
        }
        return undefined;
    }

    this.put = function(service, method, params, prom) {
        var obj = {};
        obj['service'] = service;    
        obj['method'] = method;
        obj['prom'] = prom;
        obj['params'] = params;
        cache.push(obj);
        //console.log('Cache after the last "put"', cache)
    }
}


function KBCacheClient(token) {
    var auth = {};
    auth.token = token;

    if (configJSON.setup == 'dev') {
        fba_url = configJSON.dev.fba_url;{}
        ws_url = configJSON.dev.workspace_url;
        ujs_url = configJSON.dev.user_job_state_url;
    } else {
        fba_url = configJSON.prod.fba_url;
        ws_url = configJSON.prod.workspace_url;
        ujs_url = configJSON.prod.user_job_state_url;
    }

    console.log('FBA URL is:', fba_url);
    console.log('Workspace URL is:', ws_url);
    console.log('User Job State URL is:', ujs_url);

    var fba = new fbaModelServices(fba_url, auth);
    var kbws = new Workspace(ws_url, auth);
    var ujs = new UserAndJobState(ujs_url, auth);

  
    var cache = new Cache();

    this.req = function(service, method, params) {
        if (service == 'fba') { 
            // use whatever workspace server that was configured.
            // this makes it possible to use the production workspace server
            // with the fba server.   Fixme:  fix once production fba server is ready.
            params.wsurl = ws_url;
        }

        // see if api call has already been made        
        var data = cache.get(service, method, params);

        // return the promise ojbect if it has
        if (data) return data.prom;

        // otherwise, make request
        var prom = undefined;
        if (service == 'fba') {
            console.log('Making request:', 'fba.'+method+'('+JSON.stringify(params)+')');
            var prom = fba[method](params);
        } else if (service == 'ws') {
            console.log('Making request:', 'kbws.'+method+'('+JSON.stringify(params)+')');
            var prom = kbws[method](params);
        }

        // save the request and it's promise objct
        cache.put(service, method, params, prom)
        return prom;
    }

    // make publically accessible methods that 
    this.fba = fba;
    this.ws = kbws;
    this.ujs = ujs

    this.nar = new ProjectAPI(ws_url, token);

    this.token = token;
}




function getBio(type, loaderDiv, callback) {
    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
//    var kbws = new workspaceService('http://kbase.us/services/workspace_service/');
//    var kbws = new workspaceService('http://140.221.84.209:7058');    

    var kbws = new Workspace('http://kbase.us/services/ws');
    
    // This is not cached yet; waiting to compare performanced.
    loaderDiv.append('<div class="progress">\
          <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 3%;">\
          </div>\
        </div>')

    var bioAJAX = fba.get_biochemistry({});

    var chunk = 250;
    k = 1;
    $.when(bioAJAX).done(function(d){
        if (type == 'cpds') {
            var objs = d.compounds; 
        } else if (type == 'rxns') {
            var objs = d.reactions;
        }
        var total = objs.length;
        var iterations = parseInt(total / chunk);
        var data = [];
        for (var i=0; i<iterations; i++) {
            var cpd_subset = objs.slice( i*chunk, (i+1)*chunk -1);
            if (type == 'cpds') {
                var prom = fba.get_compounds({compounds: cpd_subset });
            } else if (type == 'rxns') {
                var prom = fba.get_reactions({reactions: cpd_subset });
            }

            $.when(prom).done(function(obj_data){
                k = k + 1;
                data = data.concat(obj_data);
                var percent = (data.length / total) * 100+'%';
                $('.progress-bar').css('width', percent);

                if (k == iterations) {
                    $('.progress').remove();                        
                    callback(data)
                }
            });
        }
    })
}




function ProjectAPI(ws_url, token) {
    var self = this;

    var auth = {}
    auth.token = token;
    var ws_client = new Workspace(ws_url, auth);


    // We probably don't want to do error handeling in api functions, 
    // so we should deprecate these as well. 
    var legit_ws_id = /^\w+$/;
    // regex for a numeric workspace id of the form "ws.####.obj.###"
    var legit_narr_ws_id = /^ws\.(\d+)\.obj\.(\d+)$/;

    // Fields in a workspace metadata object
    var ws_meta_fields = ['id','owner','moddate','objects',
              'user_permission','global_permission'];

    // function used in reduce() to map ws_meta array into a dict
    var ws_meta_dict = function (ws_meta){
        return ws_meta.reduce ( function( prev, curr, index){
                        prev[ws_meta_fields[index]] = curr;
                        return(prev);
                },{});
    };

    // Fields in an workspace object metadata object
    obj_meta_fields = ['id','type','moddate','instance','command',
               'lastmodifier','owner','workspace','ref','chsum',
               'metadata', 'objid'];

    // function to map obj_meta array into a dict
    var obj_meta_dict = function (obj_meta) {
        return obj_meta.reduce( function( prev, curr, index){
                        prev[obj_meta_fields[index]] = curr;
                        return(prev);
                    },{});
    };
    // Fields in an workspace object metadata object
    obj_meta_fields2 = ['id','type','moddate','instance','command',
               'lastmodifier','owner','workspace','ref','chsum',
               'metadata'];

    // function to map obj_meta array into a dict
    var obj_meta_dict2 = function (obj_meta) {
        return obj_meta.reduce( function( prev, curr, index){
                        prev[obj_meta_fields[index]] = curr;
                        return(prev);
                    },{});
    };

    // We are tagging workspaces with _SOMETHING objects to distinguish
    // project workspaces from other containers. Using this in case we
    // decide to include other types of workspaces
    var ws_tag = {
        project : '_project'
    };

    var ws_tag_type = 'KBaseNarrative.Metadata';
    var narrative_type = 'KBaseNarrative.Narrative';


    // Fields in an empty narrative
    var empty_narrative = {type: narrative_type,
                           data: {nbformat: 3,
                                  nbformat_minor: 0,
                                  metadata: { format: "ipynb", 
                                           creator: "",
                                           ws_name: "",
                                           name: "", 
                                           type: "Narrative",
                                           description: "",
                                           data_dependencies: [ ]
                                        },
                                  worksheets: [
                                               {
                                                   cells: [
                                                       {
                                                           collapsed: false,
                                                           input: "",
                                                           outputs: [ ],
                                                           language: "python",
                                                           metadata: { },
                                                           cell_type: "code"
                                                       }
                                                   ],
                                                   metadata: { }
                                               }
                                           ]
                                 },
                        }




    // Empty project tag template
    var empty_proj_tag = {
        id : ws_tag.project,
        type : ws_tag_type,
        data : { description : 'Tag! You\'re a project!' },
        workspace : undefined,
        metadata : {},
        auth : undefined
    };

    // Empty ws2 project tag template
    var empty_ws2_proj_tag = {
        name : ws_tag.project,
        type : ws_tag_type,
        data : { description : '' },
        workspace : undefined,
        meta : {},
	provenance : [],
	hidden : 1
    };


    // id of the div containing the kbase login widget to query for auth
    // info. Set this to a different value if the div has been named differently.

    // Common error handler callback
    var error_handler = function() {
        // neat trick to pickup all arguments passed in
        var results = [].slice.call(arguments);
        console.log( "Error in method call. Response was: ", results);
    };



    /*
     * This is a handler to pickup get_workspaces() results and
     * filter out anything that isn't a project workspace
     * (basically only include it if it has a _project object
     * within)
     */
    var filter_wsobj = function (p_in) {
        console.log('p_in', p_in)
      
        /*
        for (var i in p_in.res) {
            var ws = p_in.res[i];

            // if there is global read or any permissions
            if (ws[4] == "r" || ws[5].match(/r|w|a/)) {

            }
        }
        */

        var prom = ws_client.list_objects({type: 'KBaseNarrative.Metadata', 
                                           showHidden: 1});
        return prom
    };

    /*

  var def_params = {perms : ['r', 'w', 'a'],
                          filter_tag : ws_tag.project};
        var p = $.extend( def_params, p_in);

        var ignore = /^core/;

        // ignore any workspace with the name prefix of "core"
        // and ignore workspace that doesn't match perms
        var reduce_ws_meta = function ( prev, curr) {
            if ( ignore.test(curr[0])) { 
                return( prev);
            }
            if ( p.perms.indexOf(curr[4]) >= 0 ) {
                return( prev.concat([curr]));
            } else {
                return( prev);
            }
       };

        // get non-core workspaces with correct permissions
        var ws_match = p.res.reduce(reduce_ws_meta,[]);
        // extract workspace ids into a list
        var ws_ids = ws_match.map( function(v) { return v[0]});
        */    

    /**
     * Ensures that a USER_ID:home workspace exists and is tagged as a project.
     * If one does not exist, it calls 'new_project' and makes one.
     */
    this.ensure_home_project = function(userId) {

        // if we don't have a userid, don't do anything.
        if (!userId)
            return;

        var projId = userId + ":home";

        var prom = ws_client.get_object({ type: ws_tag_type,
                                          workspace: projId,
                                          id: ws_tag.project });
        $.when(prom).then(
            undefined,                  // don't need to do anything if it already has one. 
            $.proxy(function(error) {   // if no project USER_ID:home exists, make one
                this.new_project({
                    project_id: projId,
                    error_callback: function(error) {  // Just fails more or less silently for now
                        console.debug("Error while creating home project!"); 
                        console.debug(error); 
                    },
                });
            }, this)
        );
    };

    // Get all the workspaces that match the values of the
    // permission array. Defaults to only workspaces that the
    // currently logged in user owns/administers
    // The callback will recieve a hash keyed on workspace
    // name, where the values are dictionaries keyed on ws_meta_fields
    // if a specific workspace name is given its metadata will be
    // returned
    this.get_projects = function( p_in ) {
        var def_params = { perms : ['a'],
                           workspace_id : undefined };
        var p = $.extend( def_params, p_in);

        console.log('calling get projects')
//        META_ws = ws_client.list_objects( {} );
    
        var prom = ws_client.list_objects({type: 'KBaseNarrative.Metadata', 
                                           showHidden: 1});
        //var prom = $.when( META_ws).then( function(result) {
         //               return filter_wsobj( { res: result, perms: p.perms });
          //         });
        return prom
        
    };


    // Get the object metadata for the specified workspace id and return a
    // dictionary keyed on "objectId" where the
    // value is a dictionary keyed on obj_meta_fields
    this.get_project = function( p_in ) {
        var def_params = { callback : undefined,
                   workspace_id : undefined };

        var p = $.extend( def_params, p_in);

        var ws_meta = ws_client.list_workspace_objects( {workspace: p.workspace_id});
        $.when( ws_meta).then( function (results) {
                       var res = {};
                       $.each( results, function (index, val) {
                               var obj_meta = obj_meta_dict( val);
                               res[val[0]] = obj_meta;
                           });
                       p.callback( res);
                       });
    };



    // Get the individual workspace object named. Takes names
    // in 2 parts, in the workspace_id and object_id
    // fields, and the type in the type field. Returns the
    // object as the workspace service would return it,
    // as a dict with 'data' and 'metadata' fields
    // if the type is given, it will save one RPC call,
    // otherwise we fetch the metadata for it and then
    // grab the type
    this.get_object = function( p_in ) {
        var def_params = { callback : undefined,
                   workspace_id : undefined,
                   object_id : undefined,
                   //type : undefined,
                   error_callback: error_handler
                 };
        var p = $.extend( def_params, p_in);

        var del_fn = ws_client.get_object( { type: p.type,
                                             workspace: p.workspace,
                                             id: p.object_id });

        $.when( del_fn).then( p.callback, p.error_callback);
    
    };



    // Delete the object in the specified workspace/object id and return a
    // dictionary keyed on the obj_meta_fields for the result
    this.delete_object = function( p_in ) {
        console.error('project.delete_object was removed since due to redundancy . use set_workspace_permissions in workspace api');
    };



    // Create an new workspace and tag it with a project tag. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform
    // If it is passed the id of an existing workspace, add the _project
    // tag object to it
    this.new_project = function( p_in ) {
        var def_params = { project_id : undefined,
                           def_perm : 'n',
                           description: ''};

        var p = $.extend( def_params, p_in);

        function tag_ws() {
            var proj = $.extend(true,{},empty_ws2_proj_tag);
            proj.data.description = p_in.description;

            var params = { objects : [proj] };
            params.workspace = p.project_id;
            var ws_fn2 = ws_client.save_objects( params);

            return ws_fn2;
        };

        var ws_exists = ws_client.get_workspacemeta( {workspace : p.project_id });
        var prom =  $.when(ws_exists).then(tag_ws, function() {
            var ws_fn = ws_client.create_workspace( { workspace : p.project_id,
                                                      globalread : p.def_perm })
            var prom = $.when(ws_fn).done(function() {
                return tag_ws();
            })
            return prom;
        });

        return prom;
    };


    // returns a project description (out of the project object)
    this.get_project_description = function(proj_name) {
        var prom = ws_client.get_object({ type: ws_tag_type,
                                          workspace: proj_name,
                                          id: ws_tag.project });
        var p = $.when(prom).then(function(r) {
            return r.data.description;
        })
        return p;
    }

    // returns a project description (out of the project object)
    this.set_project_description = function(proj_name, descript) {
        var proj = $.extend({}, empty_ws2_proj_tag);
        proj.data.description = descript;
        var p = ws_client.save_objects( {workspace: proj_name, objects: [proj]}); 

        return p;
    }





    // Delete a workspace(project)
    // will wipe out everything there, so make sure you prompt "Are you REALLY SURE?"
    // before calling this.
    // the callback gets the workspace metadata object of the deleted workspace
    this.delete_project = function( p_in ) {
        var def_params = { callback : undefined,
                           project_id : undefined,
                           error_callback: error_handler };

        var p = $.extend( def_params, p_in);


        //if ( legit_ws_id.test(p.project_id)) {
            var ws_def_fun = ws_client.delete_workspace({
                                      workspace: p.project_id});
            $.when( ws_def_fun).then( p.callback,
                          p.error_callback
                        );
        //} else {
        //    console.error( "Bad project id: ",p.project_id);
        //}
    };

    // Get the permissions for a project, returns a 2 element
    // hash identical to get_workspacepermissions
    // 'default' : perm // default global perms
    // 'user_id1' : perm1 // special permission for user_id1
    // ...
    // 'user_idN' : permN // special permission for user_idN
    this.get_project_perms = function( p_in ) {
        var def_params = { callback : undefined,
                   project_id : undefined,
                   error_callback : error_handler
                 };
        var p = $.extend( def_params, p_in);

        var perm_fn =  ws_client.get_permissions( {
                                          workspace : p.project_id });
        return $.when( perm_fn).fail(function(){p.error_callback});

    };


    // Set the permissions for a project, takes a project_id
    // and a perms hash that is the same as the return format
    // from get_project_perms
    // 'default' : perm // default global perms
    // 'user_id1' : perm1 // special permission for user_id1
    // ...
    // 'user_idN' : permN // special permission for user_idN
    // The return results seem to be broken
    this.set_project_perms = function( p_in ) {
        console.error('set_project_perms was removed since due to redundancy . use set_workspace_permissions in workspace api')

    };



    // Will search the given list of project_ids for objects of type narrative
    // if no project_ids are given, then all a call will be made to get_projects
    // first - avoid doing this if possible as it will be miserably slow.
    // an array of obj_meta dictionaries will be handed to the callback
    this.get_narratives = function(p_in) {
        var def_params = { project_ids : undefined,
                           error_callback : error_handler,
                           type: narrative_type,
                           error_callback: error_handler };

        var p = $.extend( def_params, p_in);
        

        if (p.project_ids) {
            return all_my_narratives( p.project_ids);
        } else {
            var proj_prom = self.get_projects().then( function(pdict) {
                var project_names = []
                for (var i=0; i <pdict.length;i++) {
                    project_names.push(pdict[i][7])
                }
                return all_my_narratives(project_names);
            });
            return proj_prom
        }

        function all_my_narratives(project_ids) {
            var prom = ws_client.list_objects({
                     workspaces: project_ids, type: p.type, showHidden: 1});
            return prom
        };

    };
    
    this._parse_object_id_string = function(p) {
        if (p.fq_id != undefined) {
            var re = p.fq_id.match( legit_narr_ws_id);
            if (re) {
                p.project_id = re[1];
                p.narrative_id = re[2];
            } else {
                p.error_callback("Cannot parse fq_id: " + p.fq_id);
            }
        }
    }

    //copy a narrative and dependencies to the home workspace
    //
    // The inputs are based on the numeric workspace id and numeric objid, which
    // are using the narrative URLs. Alternative you can just pass in a string
    // like "ws.637.obj.1" in the fq_id (fully qualified id) and this will parse
    // it out into the necessary components.
    // returns a dicts with the following keys:
    // fq_id - the fully qualified id the new narrative of the form "ws.####.obj.###"
    // 
    // known issues: in the case of a name collision in a narrative dependency,
    // the dependency is renamed by appending a timestamp. This is not currently
    // altered in the narrative or in the narrative object metadata.
    this.copy_narrative = function (p_in) {
        //TODO all these functions need some cleanup, they're nasty
        var def_params = {
                project_id : undefined, // numeric workspace id
                narrative_id : undefined, //numeric object id
                fq_id : undefined, // string of the form "ws.{numeric ws id}.obj.{numeric obj id}"
                callback: undefined,
                error_callback: error_handler
                };
        var p = $.extend( def_params, p_in);
        this._parse_object_id_string(p);
        var self = this;
        var metadata_fn = ws_client.get_object_info([{wsid: p.project_id, objid : p.narrative_id}], 1);
        $.when(metadata_fn).then(function(list_obj_info) {
            if (list_obj_info.length != 1) {
                p.error_callback( "Error: narrative ws." + p.project_id +
                        ".obj." + p.narrative_id + " not found");
            } else {
                var obj_info = list_obj_info[0];
                var narname = obj_info[1];
                var home = USER_ID + ":home";
                self._get_narrative_deps_from_obj_info({
                    obj_info: obj_info,
                    callback: function(deps) {
                        var copynar = function(newname) {
                            self._copy_one_object(obj_info[6], obj_info[1],
                                    obj_info[4], home, newname,
                                    function(res) {
                                        var fq = "ws." + res[6] + ".obj." + res[0];
                                        p.callback({fq_id: fq})
                                    }, p.error_callback
                                );
                        };
                        var ts = self._get_time_stamp();
                        $.when(ws_client.get_object_info(
                            [{workspace: home, name: narname}], 0,
                            function(result) { //success, the object exists
                                copynar(narname + "-" + ts);
                            },
                            function(result) { //fail
                                if (!/^No object with .+ exists in workspace [:\w]+$/
                                        .test(result.error.message)) {
                                    p.error_callback(result.error.message);
                                }
                                //everything's cool, the object doesn't exist in home
                                copynar(narname)
                            })
                        );
                        
                        $.each(deps.deps, function(key, val) {
                            var newdep = deps.deps[key].overwrite ? deps.deps[key].name
                                    + "-" + ts : deps.deps[key].name;
                            self._copy_one_object(obj_info[6], key, null,
                                    home, newdep, function() {}, p.error_callback);
                        });
                    }
                });
            }
        });
    };
    
    this._copy_one_object = function(ws, obj, ver, wstar, objtar, callback,
            error_callback) {
        if (ver == null) {
            var prom = ws_client.get_object_info([{ref: ws + "/" + obj}], 0);
            $.when(prom).done(
                function(list_obj_info) {
                    if (list_obj_info.length != 1) {
                        error_callback( "Error: narrative ws." + p.project_id +
                                ".obj." + p.narrative_id + " not found");
                    } else {
                        ver = list_obj_info[0][4];
                        ws = list_obj_info[0][6];
                        obj = list_obj_info[0][0];
                        ws_client.copy_object({from: {ref: ws + "/" + obj + "/" + ver},
                            to: {ref: wstar + "/" + objtar}},
                            callback,
                            function(result) {//failed
//                                console.log("error copying object");
                                error_callback(result.error.message);
                            }
                       );
                    }
                });
            $.when(prom).fail(
                function(res) {
//                    console.log("error copying object: " + res.error.message);
                    error_callback(res.error.message);
                }
            );
        } else {
            ws_client.copy_object(
                {from: {ref: ws + "/" + obj + "/" + ver},
                 to: {ref: wstar + "/" + objtar}},
                callback,
                function(result) {//failed
                    error_callback(result.error.message);
                }
           );
        }
    };
    
    this._get_time_stamp = function() {
        var d = new Date();
        var width2 = function(s) {
            if (s.length == 1) {
                return "0" + s;
            }
            return s;
        }
        return  d.getUTCFullYear().toString() +
                width2((d.getUTCMonth() + 1).toString()) +
                width2(d.getUTCDate().toString()) +
                width2(d.getUTCHours().toString()) +
                width2(d.getUTCMinutes().toString()) +
                width2(d.getUTCSeconds().toString())
                
    };

    // Examine a narrative object's metadata and return all its dependencies
    // The inputs are based on the numeric workspace id and numeric objid, which
    // are using the narrative URLs. Alternative you can just pass in a string
    // like "ws.637.obj.1" in the fq_id (fully qualified id) and this will parse
    // it out into the necessary components.
    // what is returns is a dictionary with the following keys
    // fq_id - the fully qualified id of the form "ws.####.obj.###"
    // description - the description of the narrative
    // name - the name of the narrative
    // deps - a dictionary keyed on the dependencies names (based on ws.####.obj.### format)
    //        where the subkeys are:
    //        name - textual name
    //        type - textual type of the object
    //        overwrite - a boolean that indicates if there is already
    this.get_narrative_deps = function (p_in) {
        var def_params = { callback : undefined,
                project_id : undefined, // numeric workspace id
                narrative_id : undefined, //numeric object id
                fq_id : undefined, // string of the form "ws.{numeric ws id}.obj.{numeric obj id}",
                callback: undefined,
                error_callback: error_handler };
        var p = $.extend( def_params, p_in);
        this._parse_object_id_string(p);
        var self = this;
        var metadata_fn = ws_client.get_object_info([{wsid: p.project_id, objid : p.narrative_id}], 1);
        $.when( metadata_fn).then( function( obj_info) {
            if (obj_info.length != 1) {
                p.error_callback( "Error: narrative ws." + p.project_id +
                        ".obj." + p.narrative_id + " not found");
            } else {
                var oi = {obj_info: obj_info[0],
                          callback: p.callback
                          };
                self._get_narrative_deps_from_obj_info(oi)
            }
        });
    };
    
    this._get_narrative_deps_from_obj_info = function(p) {
        var res = {};
        var obj_info = p.obj_info;
        var meta = obj_info[10]
        res.fq_id = "ws." + obj_info[6] + ".obj." + obj_info[0];
        res.description = meta.description;
        res.name = meta.name;
        var temp = $.parseJSON(meta.data_dependencies);
        //deps should really be stored as an id, not a name, since names can change
        var deps = temp.reduce( function(prev,curr,index) {
            var dep = curr.split(" ");
            prev[dep[1]] = {};
            prev[dep[1]].type = dep[0];
            prev[dep[1]].name = dep[1];
            prev[dep[1]].overwrite = false;
            return(prev);
        },{});
        var home = USER_ID + ":home";
        var proms = []
        //TODO use has_objects when it exists rather than multiple get_objects calls
        $.each(deps, function(key, val) {
            proms.push(ws_client.get_object_info(
                    [{workspace: home, name: key}], 0,
                    function(result) { //success, the object exists
                        deps[key].overwrite = true;
                    },
                    function(result) { //fail
                        console.log(result.error.message);
                        if (!/^No object with .+ exists in workspace [:\w]+$/
                                .test(result.error.message)) {
                            //p.error_callback(result.error.message);
                        }
                        //everything's cool, the object doesn't exist in home
                    })
            );
            
        });
        //this wraps all the promise objects in another promise object
        //that forces all the original POs to resolve in a $.when()
        proms = $.map(proms, function(p) {
            var dfd = $.Deferred();
            p.always(function() { dfd.resolve(); });
            return dfd.promise();
        });
        res.deps = deps;
        $.when.apply($, proms).done(function() {
                p.callback(res);
        });
    };

    // Create an empty narrative object with the specified name. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform
    this.new_narrative = function( p_in ) {
        var def_params = { project_id : USER_ID+":home",
                           narrative_id : undefined,
                           description : "A KBase narrative" };

        var p = $.extend( def_params, p_in);

        var nar = $.extend(true,{},empty_narrative);
        nar.data.metadata.ws_name = p.project_id;
        nar.name = p.narrative_id; 
        nar.data.metadata.name = p.narrative_id; 
        nar.data.metadata.creator = USER_ID;

        var ws_fn = ws_client.save_objects( {workspace: p.project_id, objects: [nar]});
        return $.when( ws_fn ).then( function(obj_meta) {
                      return obj_meta_dict(obj_meta);
                  });
    };

}
