

function workspaceService(url) {

    var _url = url;


    this.save_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.save_object", [params]);
//	var resp = json_call_sync("workspaceService.save_object", [params]);
        return resp[0];
    }

    this.save_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.save_object", [params], 1, _callback, _error_callback)
    }

    this.delete_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_object", [params]);
//	var resp = json_call_sync("workspaceService.delete_object", [params]);
        return resp[0];
    }

    this.delete_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_object", [params], 1, _callback, _error_callback)
    }

    this.delete_object_permanently = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_object_permanently", [params]);
//	var resp = json_call_sync("workspaceService.delete_object_permanently", [params]);
        return resp[0];
    }

    this.delete_object_permanently_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_object_permanently", [params], 1, _callback, _error_callback)
    }

    this.get_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_object", [params]);
//	var resp = json_call_sync("workspaceService.get_object", [params]);
        return resp[0];
    }

    this.get_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_object", [params], 1, _callback, _error_callback)
    }

    this.get_object_by_ref = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_object_by_ref", [params]);
//	var resp = json_call_sync("workspaceService.get_object_by_ref", [params]);
        return resp[0];
    }

    this.get_object_by_ref_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_object_by_ref", [params], 1, _callback, _error_callback)
    }

    this.save_object_by_ref = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.save_object_by_ref", [params]);
//	var resp = json_call_sync("workspaceService.save_object_by_ref", [params]);
        return resp[0];
    }

    this.save_object_by_ref_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.save_object_by_ref", [params], 1, _callback, _error_callback)
    }

    this.get_objectmeta = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_objectmeta", [params]);
//	var resp = json_call_sync("workspaceService.get_objectmeta", [params]);
        return resp[0];
    }

    this.get_objectmeta_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_objectmeta", [params], 1, _callback, _error_callback)
    }

    this.get_objectmeta_by_ref = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_objectmeta_by_ref", [params]);
//	var resp = json_call_sync("workspaceService.get_objectmeta_by_ref", [params]);
        return resp[0];
    }

    this.get_objectmeta_by_ref_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_objectmeta_by_ref", [params], 1, _callback, _error_callback)
    }

    this.revert_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.revert_object", [params]);
//	var resp = json_call_sync("workspaceService.revert_object", [params]);
        return resp[0];
    }

    this.revert_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.revert_object", [params], 1, _callback, _error_callback)
    }

    this.copy_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.copy_object", [params]);
//	var resp = json_call_sync("workspaceService.copy_object", [params]);
        return resp[0];
    }

    this.copy_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.copy_object", [params], 1, _callback, _error_callback)
    }

    this.move_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.move_object", [params]);
//	var resp = json_call_sync("workspaceService.move_object", [params]);
        return resp[0];
    }

    this.move_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.move_object", [params], 1, _callback, _error_callback)
    }

    this.has_object = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.has_object", [params]);
//	var resp = json_call_sync("workspaceService.has_object", [params]);
        return resp[0];
    }

    this.has_object_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.has_object", [params], 1, _callback, _error_callback)
    }

    this.object_history = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.object_history", [params]);
//	var resp = json_call_sync("workspaceService.object_history", [params]);
        return resp[0];
    }

    this.object_history_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.object_history", [params], 1, _callback, _error_callback)
    }

    this.create_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.create_workspace", [params]);
//	var resp = json_call_sync("workspaceService.create_workspace", [params]);
        return resp[0];
    }

    this.create_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.create_workspace", [params], 1, _callback, _error_callback)
    }

    this.get_workspacemeta = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_workspacemeta", [params]);
//	var resp = json_call_sync("workspaceService.get_workspacemeta", [params]);
        return resp[0];
    }

    this.get_workspacemeta_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_workspacemeta", [params], 1, _callback, _error_callback)
    }

    this.get_workspacepermissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_workspacepermissions", [params]);
//	var resp = json_call_sync("workspaceService.get_workspacepermissions", [params]);
        return resp[0];
    }

    this.get_workspacepermissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_workspacepermissions", [params], 1, _callback, _error_callback)
    }

    this.delete_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.delete_workspace", [params]);
//	var resp = json_call_sync("workspaceService.delete_workspace", [params]);
        return resp[0];
    }

    this.delete_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.delete_workspace", [params], 1, _callback, _error_callback)
    }

    this.clone_workspace = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.clone_workspace", [params]);
//	var resp = json_call_sync("workspaceService.clone_workspace", [params]);
        return resp[0];
    }

    this.clone_workspace_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.clone_workspace", [params], 1, _callback, _error_callback)
    }

    this.list_workspaces = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.list_workspaces", [params]);
//	var resp = json_call_sync("workspaceService.list_workspaces", [params]);
        return resp[0];
    }

    this.list_workspaces_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.list_workspaces", [params], 1, _callback, _error_callback)
    }

    this.list_workspace_objects = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.list_workspace_objects", [params]);
//	var resp = json_call_sync("workspaceService.list_workspace_objects", [params]);
        return resp[0];
    }

    this.list_workspace_objects_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.list_workspace_objects", [params], 1, _callback, _error_callback)
    }

    this.set_global_workspace_permissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_global_workspace_permissions", [params]);
//	var resp = json_call_sync("workspaceService.set_global_workspace_permissions", [params]);
        return resp[0];
    }

    this.set_global_workspace_permissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_global_workspace_permissions", [params], 1, _callback, _error_callback)
    }

    this.set_workspace_permissions = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_workspace_permissions", [params]);
//	var resp = json_call_sync("workspaceService.set_workspace_permissions", [params]);
        return resp[0];
    }

    this.set_workspace_permissions_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_workspace_permissions", [params], 1, _callback, _error_callback)
    }

    this.get_user_settings = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_user_settings", [params]);
//	var resp = json_call_sync("workspaceService.get_user_settings", [params]);
        return resp[0];
    }

    this.get_user_settings_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_user_settings", [params], 1, _callback, _error_callback)
    }

    this.set_user_settings = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_user_settings", [params]);
//	var resp = json_call_sync("workspaceService.set_user_settings", [params]);
        return resp[0];
    }

    this.set_user_settings_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_user_settings", [params], 1, _callback, _error_callback)
    }

    this.queue_job = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.queue_job", [params]);
//	var resp = json_call_sync("workspaceService.queue_job", [params]);
        return resp[0];
    }

    this.queue_job_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.queue_job", [params], 1, _callback, _error_callback)
    }

    this.set_job_status = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.set_job_status", [params]);
//	var resp = json_call_sync("workspaceService.set_job_status", [params]);
        return resp[0];
    }

    this.set_job_status_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.set_job_status", [params], 1, _callback, _error_callback)
    }

    this.get_jobs = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.get_jobs", [params]);
//	var resp = json_call_sync("workspaceService.get_jobs", [params]);
        return resp[0];
    }

    this.get_jobs_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_jobs", [params], 1, _callback, _error_callback)
    }

    this.get_types = function()
    {
	var resp = json_call_ajax_sync("workspaceService.get_types", []);
//	var resp = json_call_sync("workspaceService.get_types", []);
        return resp[0];
    }

    this.get_types_async = function(_callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.get_types", [], 1, _callback, _error_callback)
    }

    this.add_type = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.add_type", [params]);
//	var resp = json_call_sync("workspaceService.add_type", [params]);
        return resp[0];
    }

    this.add_type_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.add_type", [params], 1, _callback, _error_callback)
    }

    this.remove_type = function(params)
    {
	var resp = json_call_ajax_sync("workspaceService.remove_type", [params]);
//	var resp = json_call_sync("workspaceService.remove_type", [params]);
        return resp[0];
    }

    this.remove_type_async = function(params, _callback, _error_callback)
    {
	json_call_ajax_async("workspaceService.remove_type", [params], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};

	var body = JSON.stringify(rpc);

	var http = new XMLHttpRequest();

	http.open("POST", url, async_flag);

	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };

        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;

        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);

	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };

        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;

        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }

				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    console.log(resp);
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];

	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}

	http.send(body);

    }

    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];

	http.send(body);

	var resp_txt = http.responseText;

	var resp = JSON.parse(resp_txt);
	var result = resp["result"];

	return result;
    }
}

