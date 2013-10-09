/*
 * Support library for functional site projects page
 * 
 * Projects == workspaces
 * 
 * Teams == None since there isn't group support in the WSS currently, we can
 * only assign individual permissions
 * 
 * This file basically provides convenience wrappers for the workspace
 * service calls
 * 
 * Steve Chan
 * 10/2/2013
 * 
 */

/*
 * Create a project object that wraps all the code to manage 'projects'
 * Uses namespacing technique from here:
 * http://enterprisejquery.com/2010/10/how-good-c-habits-can-encourage-bad-javascript-habits-part-1/
 * 
 */
(function(project, $, undefined) {
    // workspace service endpoint & client
    project.ws_url = "https://kbase.us/services/workspace";
    project.ws_client = new workspaceService(project.ws_url);

    var legit_ws_id = /^\w+$/;

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
		       'metadata'];

    // function to map obj_meta array into a dict
    var obj_meta_dict = function (obj_meta) {
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

    project.ws_tag_type = 'workspace_meta';
    project.narrative_type = 'Narrative';
    // Fields in an empty narrative
    var empty_narrative = {
	data: {
	    nbformat_minor: 0,
	    worksheets: [],
	    metadata: {
		creator: "",
		format: "ipynb",
		name: "",
		type: "Narrative",
		description: "",
		data_dependencies: []
	    },
	    nbformat: 3
	},
	metadata : {},
	id : undefined,
	type : project.narrative_type,
	workspace : undefined
    };

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
    project.auth_div = 'login-widget';

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
	var def_params = { callback : undefined,
			   perms : ['a'],
			   filter_tag : project.ws_tag.project };
	var p = $.extend( def_params, p_in);

	var ignore = /^core/;
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;

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
	var ws_match = p.res.reduce(reduce_ws_meta,[]);
	var ws_ids = ws_match.map( function(v) { return v[0]});
	var ws_obj_fn = ws_ids.map( function( wsid) {
					return project.ws_client.has_object(
					    { auth: token,
					      workspace: wsid,
					      id : project.ws_tag.project,
					      type : project.ws_tag_type });
				    });
	$.when.apply(null, ws_obj_fn).then( function() {
						var results = [].slice.call(arguments);
						var reduce_ws_proj = function(prev,curr,index){
						    if (curr) {
							// convert array into dict and then bind to ws_id
							prev[ ws_match[index][0]] = ws_meta_dict(ws_match[index]);
						    } 
						    return( prev);
						};
						var proj_list = results.reduce( reduce_ws_proj,{});
						p.callback( proj_list );
					    },
					    error_handler);
    };

    // Get all the workspaces that match the values of the
    // permission array. Defaults to only workspaces that the
    // currently logged in user owns/administers
    // The callback will recieve a hash keyed on workspace
    // name, where the values are dictionaries keyed on ws_meta_fields
    // if a specific workspace name is given its metadata will be
    // returned
    project.get_projects = function( p_in ) {
	var def_params = { callback : undefined,
			   perms : ['a'],
			   workspace_id : undefined};
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;
	var META_ws;
	if ( p.workspace_id ) {
	    META_ws = project.ws_client.get_workspacemeta( { auth : token,
							     workspace : p.workspace_id } );
	    $.when( META_ws).then( function(result) {
				       filter_wsobj( { res: [result],
						       callback : p.callback,
						       perms: p.perms });
				   },
				   error_handler);
	} else {
	    META_ws = project.ws_client.list_workspaces( { auth : token} );
	    $.when( META_ws).then( function(result) {
				       filter_wsobj( { res: result,
						       callback : p.callback,
						       perms: p.perms });
				   },
				   error_handler);
	}
    };


    // Get the object metadata for the specified workspace id and return a
    // dictionary keyed on "objectId" where the
    // value is a dictionary keyed on obj_meta_fields
    project.get_project = function( p_in ) {
	var def_params = { callback : undefined,
			   workspace_id : undefined};
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;
        var ws_meta = project.ws_client.list_workspace_objects( { auth: token,
								  workspace: p.workspace_id});
	$.when( ws_meta).then( function (results) {
				   var res = {};
				   $.each( results, function (index, val) {
					       var obj_meta = obj_meta_dict( val);
					       res[val[0]] = obj_meta;
					   });
				   p.callback( res);
			       },
			       error_handler);
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
			   type : undefined
			 };
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;
	
    };

    // Delete the object in the specified workspace/object id and return a
    // dictionary keyed on the obj_meta_fields for the result
    project.delete_object = function( p_in ) {
	var def_params = { callback : undefined,
			   workspace_id : undefined,
			   object_id : undefined,
			   type: undefined };
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;
	
    };

    // Create an new workspace and tag it with a project tag. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform
    // If it is passed the id of an existing workspace, add the _project
    // tag object to it
    project.new_project = function( p_in ) {
	var def_params = { callback : undefined,
			   project_id : undefined,
			   def_perm : 'n'
			 };
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;

        if ( legit_ws_id.test(p.project_id)) {
	    // Check if the workspace exists already. If it does, then 'upgrade'
	    // it by adding a _project object, if it doesn't exist yet then
	    // create it, then add the _project otag
	    var tag_ws = function(ws_meta) {
		var proj = $.extend(true,{},empty_proj_tag);
		proj.auth = token;
		proj.workspace = p.project_id;
		var ws_fn2 = project.ws_client.save_object( proj);
		$.when( ws_fn2 ).then( function(obj_meta) {
					   p.callback( obj_meta_dict(obj_meta));
				       },
				       error_handler);
	    };
	    // function to create workspace and populate with _project object
	    var ws_fn = project.ws_client.create_workspace( {
							    auth: token,
							    workspace : p.project_id,
							    default_permission : p.def_perm
							    });
	    var ws_exists = project.ws_client.get_workspacemeta( { auth: token, workspace : p.project_id });
	    $.when( ws_exists).then( tag_ws, // if exists, tag
				     function() { // else create then tag
					 console.log( 'Creating new workspace:',p.project_id);
				     	 $.when( ws_fn).then( tag_ws,
							      error_handler);
				     });
	} else {
	    error_handler( "Bad project id: "+p.project_id);
	}
    };

    // Delete a workspace(project)
    // will wipe out everything there, so make sure you prompt "Are you REALLY SURE?"
    // before calling this.
    // the callback gets the workspace metadata object of the deleted workspace
    project.delete_project = function( p_in ) {
	var def_params = { callback : undefined,
			   project_id : undefined
			 };
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;

        if ( legit_ws_id.test(p.project_id)) {
	    var ws_def_fun = project.ws_client.delete_workspace({ auth: token,
								  workspace: p.project_id});
	    $.when( ws_def_fun).then( p.callback,
				      error_handler
				    );
	} else {
	    console.log( "Bad project id: ",p.project_id);
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
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;

	var perm_fn =  project.ws_client.get_workspacepermissions( { auth : token,
								      workspace : p.project_id });
	$.when( perm_fn).then( function(perms) {
				   console.log( perms);
				   p.callback( perms);
			       },
			       p.error_callback
			     );

    };


    // Set the permissions for a project, takes a project_id
    // and a perms hash that is the same as the return format
    // from get_project_perms
    // 'default' : perm // default global perms
    // 'user_id1' : perm1 // special permission for user_id1
    // ...
    // 'user_idN' : permN // special permission for user_idN
    project.set_project_perms = function( p_in ) {
	var def_params = { callback : undefined,
			   project_id : undefined,
			   perms : {},
			   error_callback : error_handler
			 };
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;

	var set_perm_fn =  [];
	// If a new default permission was given push a set_global_workspace_permissions
	// call onto the function stack
	if ('default' in p.perms) {
	    set_perm_fn.push( project.ws_client
			      .set_global_workspace_permissions( { auth: token,
								   workspace : p.project_id,
								   new_permission : p.perms['default']
								 }));
	    delete( p.perms['default']);
	}
	/*
	$.when( set_perm_fn).then( function(perms) {
				       console.log( perms);
				       p.callback( perms);
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
	var def_params = { callback : undefined,
			   project_ids : undefined,
			   error_callback : error_handler,
			   type: project.narrative_type};
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;
	var user_id = $(project.auth_div).kbaseLogin('get_kbase_cookie').user_id;
	
	var all_my_narratives = function (project_ids) {
	    var get_ws_narr = project_ids.map( function(ws_id) {
						     return(project.ws_client.list_workspace_objects( { auth: token,
													workspace: ws_id,
													type: p.type }));
						 });
	    $.when.apply(null, get_ws_narr).then( function() {
						      var results = [].slice.call(arguments);
						      var merged = [].concat.apply([],results);
						      var dict = merged.map( obj_meta_dict);
						      p.callback( dict);
						      // merge all the results into a single array
						  },
						  p.error_callback
					    );
	};
	if (p.project_ids) {
	    all_my_narratives( p.project_ids);
	} else {
	    project.get_projects( { callback: function (pdict) {
					all_my_narratives( Object.keys( pdict));
				    }
				  });
	}
    };

    // Create an empty narrative object with the specified name. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform

    project.new_narrative = function( p_in ) {
	var def_params = { callback : undefined,
			   project_id : undefined,
			   narrative_id : undefined,
			   description : "A KBase narrative" };
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;
	var user_id = $(project.auth_div).kbaseLogin('get_kbase_cookie').user_id;

        if ( legit_ws_id.test(p.narrative_id)) {
	    var nar = $.extend(true,{},empty_narrative);
	    nar.auth = token;
	    nar.workspace = p.project_id;
	    nar.id = p.narrative_id;
	    nar.data.metadata.name = p.narrative_id;
	    nar.data.metadata.creator = user_id;
	    nar.data.metadata.description = p.description;
	    nar.metadata = nar.data.metadata;

	    var ws_fn = project.ws_client.save_object( nar);
	    $.when( ws_fn ).then( function(obj_meta) {
				      p.callback( obj_meta_dict(obj_meta));
				  },
				  error_handler);
	} else {
	    error_handler( "Bad narrative_id");
	}
	
    };

}(window.project = window.project || {}, jQuery));
