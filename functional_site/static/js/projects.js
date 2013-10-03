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

    // Fields in a workspace metadata object
    project.ws_meta_fields = ['id','owner','moddate','objects',
		      'user_permission','global_permission'];

    // Fields in an workspace object metadata object
    project.obj_meta_fields = ['id','type','moddate','instance','command',
		       'lastmodifier','owner','workspace','ref','chsum',
		       'metadata'];

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

    // id of the div containing the kbase login widget to query for auth
    // info. Set this to a different value if the div has been named differently.
    project.auth_div = 'login-widget';

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
	var p = _.extend( def_params, p_in);
	var auth = $(project.auth_div).kbaseLogin('get_kbase_cookie');
    };


    // Get the objects in the specified workspace id and return a
    // dictionary keyed on "objectId" where the
    // value is a dictionary keyed on obj_meta_fields
    project.get_project = function( p_in ) {
	var def_params = { callback : undefined,
			   workspace_id : undefined};
	var p = $.extend( def_params, p_in);
	var auth = $(project.auth_div).kbaseLogin('get_kbase_cookie');
	
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
