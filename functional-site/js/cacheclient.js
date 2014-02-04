

// This saves a request by service name, method, params, and promise
// Todo: Make as module
function Cache() {
    var cache = [];

    this.get = function(service, method, params) {
        for (var i in cache) {
            var obj = cache[i];
            if (service != obj['service']) continue;
            if (method != obj['method']) continue;
            if ( angular.equals(obj['params'], params) ) return obj;
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
        //console.log('cache', cache)
    }
}


function KBCacheClient(token) {
    var token = token;

    var auth = {};
    auth.token = token;
    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
    //var kbws = new workspaceService('http://kbase.us/services/workspace_service/', auth);
    var kbws = new Workspace('http://140.221.84.209:7058', auth);
    //var kbws = new Workspace('http://kbase.us/services/ws/', auth);
  
    var cache = new Cache();    

    this.req = function(service, method, params) {
        //if (!params) var params = {auth: auth.token};
        //else params.auth = auth.token;  // Fixme: set auth in client object

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

    this.fbaAPI = function() {
        return fba;
    }

    this.ws = kbws;

    this.token = function() {
        return token;
    }

    //fixme: hacks
    projectapi()
}




function getBio(type, loaderDiv, callback) {
    var fba = new fbaModelServices('https://kbase.us/services/fba_model_services/');
//    var kbws = new workspaceService('http://kbase.us/services/workspace_service/');
    var kbws = new workspaceService('http://140.221.84.209:7058');    

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




function projectapi() {
    // workspace service endpoint & client
    //project.ws_url = "https://kbase.us/services/workspace";
    //project.ws_client = new workspaceService(project.ws_url);
    project ={}
    var auth = {}
    var token = USER_TOKEN;
    auth.token = token;

    //project.ws_url = "https://kbase.us/services/ws";
    project.ws_url = 'http://140.221.84.209:7058';
    project.ws_client = new Workspace(project.ws_url, auth);


    var legit_ws_id = /^\w+$/;
    // regex for a numeric workspace id of the form "ws.####.obj.###"
    var legit_narr_ws_id = /^ws\.(\d+)\.obj\.(\d+)$/;

    // Fields in a workspace metadata object
    project.ws_meta_fields = ['id','owner','moddate','objects',
              'user_permission','global_permission'];

    // function used in reduce() to map ws_meta array into a dict
    var ws_meta_dict = function (ws_meta){
    return ws_meta.reduce ( function( prev, curr, index){
                    prev[project.ws_meta_fields[index]] = curr;
                    return(prev);
                },{});
    };

    // Fields in an workspace object metadata object
    project.obj_meta_fields = ['id','type','moddate','instance','command',
               'lastmodifier','owner','workspace','ref','chsum',
               'metadata', 'objid'];

    // function to map obj_meta array into a dict
    var obj_meta_dict = function (obj_meta) {
    return obj_meta.reduce( function( prev, curr, index){
                    prev[project.obj_meta_fields[index]] = curr;
                    return(prev);
                },{});
    };
    // Fields in an workspace object metadata object
    project.obj_meta_fields2 = ['id','type','moddate','instance','command',
               'lastmodifier','owner','workspace','ref','chsum',
               'metadata'];

    // function to map obj_meta array into a dict
    var obj_meta_dict2 = function (obj_meta) {
    return obj_meta.reduce( function( prev, curr, index){
                    prev[project.obj_meta_fields[index]] = curr;
                    return(prev);
                },{});
    };

    // We are tagging workspaces with _SOMETHING objects to distinguish
    // project workspaces from other containers. Using this in case we
    // decide to include other types of workspaces
    project.ws_tag = {
        project : '_project'
    };

    project.ws_tag_type = 'KBaseNarrative.Metadata';
    project.narrative_type = 'KBaseNarrative.Narrative';


    // Fields in an empty narrative
    var empty_narrative = {type: project.narrative_type,
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
        id : project.ws_tag.project,
        type : project.ws_tag_type,
        data : { description : 'Tag! You\'re a project!' },
        workspace : undefined,
        metadata : {},
        auth : undefined
    };


    // id of the div containing the kbase login widget to query for auth
    // info. Set this to a different value if the div has been named differently.
    //project.auth_div = 'login-widget';
    project.auth_div = '#signin-button';
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

        var def_params = {callback : undefined,
                   perms : ['a'],
                   filter_tag : project.ws_tag.project};
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

        var prom = project.ws_client.list_objects({workspaces: ws_ids, 
                                                   type: 'KBaseNarrative.Metadata', 
                                                   showHidden: 1});
        return prom
    };


    // Get all the workspaces that match the values of the
    // permission array. Defaults to only workspaces that the
    // currently logged in user owns/administers
    // The callback will recieve a hash keyed on workspace
    // name, where the values are dictionaries keyed on ws_meta_fields
    // if a specific workspace name is given its metadata will be
    // returned
    project.get_projects = function( p_in ) {
        var def_params = { perms : ['a'],
                           workspace_id : undefined };

        var p = $.extend( def_params, p_in);

        var META_ws;
        if ( p.workspace_id ) {
            META_ws = project.ws_client.get_workspacemeta( { workspace : p.workspace_id } );
            var prom =  $.when( META_ws).then( function(result) {
                           return filter_wsobj( {res: [result], perms: p.perms });
                       });
            return prom
        } else {
            META_ws = project.ws_client.list_workspaces( {} );
            var prom = $.when( META_ws).then( function(result) {
                            return filter_wsobj( { res: result, perms: p.perms });
                       });
            return prom
        }
    };


    // Get the object metadata for the specified workspace id and return a
    // dictionary keyed on "objectId" where the
    // value is a dictionary keyed on obj_meta_fields
    project.get_project = function( p_in ) {
        var def_params = { callback : undefined,
                   workspace_id : undefined };

        var p = $.extend( def_params, p_in);

        var ws_meta = project.ws_client.list_workspace_objects( {workspace: p.workspace_id});
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
    project.get_object = function( p_in ) {
        var def_params = { callback : undefined,
                   workspace_id : undefined,
                   object_id : undefined,
                   //type : undefined,
                   error_callback: error_handler
                 };
        var p = $.extend( def_params, p_in);

        var del_fn = project.ws_client.get_object( { type: p.type,
                                                     workspace: p.workspace,
                                                     id: p.object_id });

        $.when( del_fn).then( p.callback, p.error_callback);
    
    };



    // Delete the object in the specified workspace/object id and return a
    // dictionary keyed on the obj_meta_fields for the result
    project.delete_object = function( p_in ) {
        console.error('project.delete_object was removed since due to redundancy . use set_workspace_permissions in workspace api');
        /*
        var def_params = {workspace : undefined,
                          id : undefined,
                          //type: undefined,
                          error_callback: error_handler };
        var p = $.extend( def_params, p_in);
        console.log(p.workspace, p.id)
        var del_fn = project.ws_client.delete_objects( [{workspace: p.workspace, name: p.id }] );
        return $.when( del_fn).fail(function() { p.error_callback });
        */
    };



    // Create an new workspace and tag it with a project tag. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform
    // If it is passed the id of an existing workspace, add the _project
    // tag object to it
    project.new_project = function( p_in ) {
        var def_params = { project_id : undefined,
                           def_perm : 'n',
                           error_callback: error_handler };

        var p = $.extend( def_params, p_in);

        if ( legit_ws_id.test(p.project_id)) {
            // Check if the workspace exists already. If it does, then 'upgrade'
            // it by adding a _project object, if it doesn't exist yet then
            // create it, then add the _project otag

            function tag_ws(ws_meta) {
                var proj = $.extend(true,{},empty_proj_tag);

                proj.workspace = p.project_id;

                var ws_fn2 = project.ws_client.save_object( proj);
                //var prom = $.when( ws_fn2 ).
                //.then( function(obj_meta) {
                //               return  obj_meta_dict(obj_meta); 
                //});
                return ws_fn2;
            };

            console.log('getting '+p.project_id)
            var ws_exists = project.ws_client.get_workspacemeta( {workspace : p.project_id });
            var prom =  $.when( ws_exists).then(tag_ws, function() {

                var ws_fn = project.ws_client.create_workspace( { workspace : p.project_id,
                                                                  globalread : p.def_perm })

                return $.when( ws_fn).then( tag_ws, function() {
                    console.log('this failed')
                });
            });

            return prom;
        } else {
            console.error( "Bad project id: "+p.project_id);
        }
    };


    // Delete a workspace(project)
    // will wipe out everything there, so make sure you prompt "Are you REALLY SURE?"
    // before calling this.
    // the callback gets the workspace metadata object of the deleted workspace
    project.delete_project = function( p_in ) {
        var def_params = { callback : undefined,
                           project_id : undefined,
                           error_callback: error_handler };

        var p = $.extend( def_params, p_in);

       if ( legit_ws_id.test(p.project_id)) {
            var ws_def_fun = project.ws_client.delete_workspace({
                                      workspace: p.project_id});
            $.when( ws_def_fun).then( p.callback,
                          p.error_callback
                        );
        } else {
            console.error( "Bad project id: ",p.project_id);
        }
    };

    // Get the permissions for a project, returns a 2 element
    // hash identical to get_workspacepermissions
    // 'default' : perm // default global perms
    // 'user_id1' : perm1 // special permission for user_id1
    // ...
    // 'user_idN' : permN // special permission for user_idN
    project.get_project_perms = function( p_in ) {
        var def_params = { callback : undefined,
                   project_id : undefined,
                   error_callback : error_handler
                 };
        var p = $.extend( def_params, p_in);

        var perm_fn =  project.ws_client.get_permissions( {
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
    project.set_project_perms = function( p_in ) {
        console.error('set_project_perms was removed since due to redundancy . use set_workspace_permissions in workspace api')
        /*
        var def_params = { callback : undefined,
                   project_id : undefined,
                   perms : {},
                   error_callback : error_handler}; 

        var p = $.extend( def_params, p_in);

        var set_perm_fn =  [];
        // If a new default permission was given push a set_global_workspace_permissions
        // call onto the function stack
        if ('default' in p.perms) {
            set_perm_fn.push( project.ws_client
                      .set_global_workspace_permissions( {
                                       workspace : p.project_id,
                                       new_permission : p.perms['default']
                                     }));
            delete( p.perms['default']);
        }
        // sort users into lists based on the permissions we are giving them
        var user_by_perm = Object.keys(p.perms).reduce(
            function(prev,curr,index) {
            if (p.perms[curr] in prev) {
                prev[p.perms[curr]].push( curr);
                return prev;
            } else {
                prev[p.perms[curr]] = [curr];
                return prev;
            }
            },
            {});

        var by_perms_fn = Object.keys( user_by_perm).map(
            function(perm) {
            return project.ws_client.set_workspace_permissions( {users: user_by_perm[perm],
                                         new_permission : perm,
                                         workspace: p.project_id
                                         });
            });
        set_perm_fn = set_perm_fn.concat(by_perms_fn);
        $.when.apply( set_perm_fn).then( function() {
                             var results = [].slice.call(arguments);
                             p.callback( results);
                         },
                         p.error_callback
                           );
        */
    };



    // Will search the given list of project_ids for objects of type narrative
    // if no project_ids are given, then all a call will be made to get_projects
    // first - avoid doing this if possible as it will be miserably slow.
    // an array of obj_meta dictionaries will be handed to the callback
    project.get_narratives = function(p_in) {
        var def_params = { project_ids : undefined,
                           error_callback : error_handler,
                           type: project.narrative_type,
                           error_callback: error_handler };

        var p = $.extend( def_params, p_in);
        

        if (p.project_ids) {
            return all_my_narratives( p.project_ids);
        } else {
            var proj_prom = project.get_projects().then( function(pdict) {
                var project_names = []
                for (var i=0; i <pdict.length;i++) {
                    project_names.push(pdict[i][7])
                }
                return all_my_narratives(project_names);
            });
            return proj_prom
        }

        function all_my_narratives(project_ids) {
            var prom = project.ws_client.list_objects({
                     workspaces: project_ids, type: p.type, showHidden: 1});
            return prom
        };

    };


    project.copy_narrative = function (p_in) {
        var def_params = { callback : undefined,
			   project_id : undefined, // numeric workspace id
			   narrative_id : undefined, //numeric object id
			   fq_id : undefined, // string of the form "ws.{numeric ws id}.obj.{numeric obj id}"
			   error_callback: error_handler };
        var p = $.extend( def_params, p_in);
	
	p.callback( 1);
    };

    // Examine a narrative object's metadata and return all it's dependencies
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
    project.get_narrative_deps = function ( p_in) {
        var def_params = { callback : undefined,
			   project_id : undefined, // numeric workspace id
			   narrative_id : undefined, //numeric object id
			   fq_id : undefined, // string of the form "ws.{numeric ws id}.obj.{numeric obj id}",
         callback: undefined,
			   error_callback: error_handler };
        var p = $.extend( def_params, p_in);
	if (p.fq_id != undefined) {
	    var re = p.fq_id.match( legit_narr_ws_id);
	    if (re) {
		p.project_id = re[1];
		p.narrative_id = re[2];
	    } else {
		p.error_callback("Cannot parse fq_id: " + p.fq_id);
	    }
	}
	var metadata_fn = project.ws_client.get_object_info( [ { wsid: p.project_id, objid : p.narrative_id}], 1);
	$.when( metadata_fn).then( function( obj_meta) {
				       if (obj_meta.length != 1) {
					   p.error_callback( "Error: " + obj_meta.length + " narratives found");
				       } else {
					   var res = {};
					   var nar = obj_meta[0];
					   var meta = nar[10]
					   res.fq_id = "ws." + nar[6] + ".obj." + nar[0];
					   res.description = meta.description;
					   res.name = meta.name;
					   var temp = $.parseJSON(meta.data_dependencies);
					   var deps = temp.reduce( function(prev,curr,index) {
								       var dep = curr.split(" ");
								       prev[dep[1]] = {};
								       prev[dep[1]].type = dep[0];
								       prev[dep[1]].name = dep[1];
								       prev[dep[1]].overwrite = false;
								       return(prev);
								   },{});
					   res.deps = deps;
					   p.callback(res);
					   /*
					   var alpha = /\D/;
					   var src_objs = Object.keys(deps).map( function(obj) {
										     if (obj.match(alpha)) {
											 return(project.ws_client.get_object_info( [ { wsid : p.project_id, name : obj }], 1));
										     } else {
											 return(project.ws_client.get_object_info( [ { wsid : p.project_id, objid : obj }], 1));
										     }
										 });
					   $.when.apply( null, src_objs)
					       .done( function() {
							  var res = [].slice.call(arguments);
							  console.log( "after check_objs", res);
						      })
					       .fail( function() {
						      console.log("not found");
						      });
					   var homews = USER_ID+":home";
					   var dest_objs = Object.keys(deps).map( function(obj) {
										     if (obj.match(alpha)) {
											 return( { workspace : homews, name : obj });
										     } else {
											 return( { workspace : homews, objid : obj});
										     }
										 });
					   console.log( src_objs, dest_objs);
					    */
				       }
				   });
    };

    // Create an empty narrative object with the specified name. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform
    project.new_narrative = function( p_in ) {
        var def_params = { project_id : USER_ID+":home",
                           narrative_id : undefined,
                           description : "A KBase narrative" };

        var p = $.extend( def_params, p_in);

        if ( legit_ws_id.test(p.narrative_id)) {
            var nar = $.extend(true,{},empty_narrative);
            nar.data.metadata.ws_name = p.project_id;
            nar.name = p.narrative_id; 
            nar.data.metadata.name = p.narrative_id; 
            nar.data.metadata.creator = USER_ID;

            var ws_fn = project.ws_client.save_objects( {workspace: p.project_id, objects: [nar]});
            return $.when( ws_fn ).then( function(obj_meta) {
                          return obj_meta_dict(obj_meta);
                      });
        } else {
            console.error( "Bad narrative_id");
        }
    };

}
