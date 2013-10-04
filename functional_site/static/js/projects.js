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
	}
    };

    // We are tagging workspaces with _SOMETHING objects to distinguish
    // project workspaces from other containers. Using this in case we
    // decide to include other types of workspaces
    
    project.ws_tag = {
	project : '_project'
    };

    project.ws_tag_type = 'workspace_meta';

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
	$.when.apply(null, ws_obj_fn).done( function() {
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
					    });
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
	    $.when( META_ws).done( function(result) {
				       filter_wsobj( { res: [result],
						       callback : p.callback,
						       perms: p.perms });
				   });
	} else {
	    META_ws = project.ws_client.list_workspaces( { auth : token} );
	    $.when( META_ws).done( function(result) {
				       filter_wsobj( { res: result,
						       callback : p.callback,
						       perms: p.perms });
				   });
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
	$.when( ws_meta).done( function (results) {
				   var res = {};
				   $.each( results, function (index, val) {
					       var obj_meta = obj_meta_dict( val);
					       res[val[0]] = obj_meta;
					   });
				   p.callback( res)
			       });
    };

    // Get the individual workspace object named. Takes names
    // in 2 parts, in the workspace_id and object_id
    // fields, and the type in the type field. Returns the
    // object as the workspace service would return it,
    // as a dict with 'data' and 'metadata' fields
    project.get_object = function( p_in ) {
	var def_params = { callback : undefined,
			   workspace_id : undefined,
			   object_id : undefined,
			   type : undefined
			 };
	var p = $.extend( def_params, p_in);
	var auth = $(project.auth_div).kbaseLogin('get_kbase_cookie');
	
    };

    // Delete the object in the specified workspace/object id and return a
    // dictionary keyed on the obj_meta_fields for the result
    project.delete_object = function( p_in ) {
	var def_params = { callback : undefined,
			   workspace_id : undefined,
			   object_id : undefined,
			   type: undefined };
	var p = $.extend( def_params, p_in);
	var auth = $(project.auth_div).kbaseLogin('get_kbase_cookie');
	
    };

    // Create an new workspace and tag it with a project tag. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform

    project.new_project = function( p_in ) {
	var def_params = { callback : undefined,
			   project_id : undefined,
			   def_perm : 'n'
			 };
	var p = $.extend( def_params, p_in);
	var token = $(project.auth_div).kbaseLogin('get_kbase_cookie').token;

        if ( legit_ws_id.test(p.project_id)) {
	    // create workspace and populate with _project object
	    var ws_fn = project.ws_client.create_workspace( {
							    auth: token,
							    workspace : p.project_id,
							    default_permission : p.def_perm
							    });
	    $.when( ws_fn).done( function(ws_meta) {
				     var proj = empty_proj_tag;
				     proj.auth = token;
				     proj.workspace = p.project_id;
				     var ws_fn2 = project.ws_client.save_object( proj);
				     $.when( ws_fn2 ).done( function(obj_meta) {
								p.callback( obj_meta_dict(obj_meta));
							    });
				 });
	} else {
	    console.log( "Bad project id: ",p.project_id);
	}
    };

    // Delete a workspace(project)
    project.delete_project = function( p_in ) {
	var def_params = { callback : undefined,
			   project_id : undefined
			 };
	var p = $.extend( def_params, p_in);
	var auth = $(project.auth_div).kbaseLogin('get_kbase_cookie');

        if ( legit_ws_id.test(p.project_id)) {
	    // create workspace and populate with _project object
	} else {
	    console.log( "Bad project id: ",p.project_id);
	}
    };

    // Create an empty narrative object with the specified name. The name
    // *must" conform to the future workspace rules about object naming,
    // the it can only contain [a-zA-Z0-9_]. We show the error prompt
    // if it fails to conform

    project.new_narrative = function( p_in ) {
	var def_params = { callback : undefined,
			   workspace_id : undefined,
			   object_id : undefined,
			   type: undefined };
	var p = $.extend( def_params, p_in);
	var auth = $(project.auth_div).kbaseLogin('get_kbase_cookie');
	
    };

}(window.project = window.project || {}, jQuery));
