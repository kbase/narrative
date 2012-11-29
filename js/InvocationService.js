function dbg(txt) { if (window.console) console.log(txt); }


function InvocationService(url) {
console.log("create for " + url);
    var _url = url;


    this.start_session = function(session_id)
    {
	var resp = json_call_ajax_sync("InvocationService.start_session", [session_id]);
//	var resp = json_call_sync("InvocationService.start_session", [session_id]);
        return resp[0];
    }

    this.start_session_async = function(session_id, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.start_session", [session_id], 1, _callback, _error_callback)
    }

    this.valid_session = function(session_id)
    {
	var resp = json_call_ajax_sync("InvocationService.valid_session", [session_id]);
//	var resp = json_call_sync("InvocationService.valid_session", [session_id]);
        return resp[0];
    }

    this.valid_session_async = function(session_id, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.valid_session", [session_id], 1, _callback, _error_callback)
    }

    this.list_files = function(session_id, cwd, d)
    {
	var resp = json_call_ajax_sync("InvocationService.list_files", [session_id, cwd, d]);
//	var resp = json_call_sync("InvocationService.list_files", [session_id, cwd, d]);
        return resp;
    }

    this.list_files_async = function(session_id, cwd, d, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.list_files", [session_id, cwd, d], 2, _callback, _error_callback)
    }

    this.remove_files = function(session_id, cwd, filename)
    {
	var resp = json_call_ajax_sync("InvocationService.remove_files", [session_id, cwd, filename]);
//	var resp = json_call_sync("InvocationService.remove_files", [session_id, cwd, filename]);
        return resp;
    }

    this.remove_files_async = function(session_id, cwd, filename, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.remove_files", [session_id, cwd, filename], 0, _callback, _error_callback)
    }

    this.rename_file = function(session_id, cwd, from, to)
    {
	var resp = json_call_ajax_sync("InvocationService.rename_file", [session_id, cwd, from, to]);
//	var resp = json_call_sync("InvocationService.rename_file", [session_id, cwd, from, to]);
        return resp;
    }

    this.rename_file_async = function(session_id, cwd, from, to, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.rename_file", [session_id, cwd, from, to], 0, _callback, _error_callback)
    }

    this.copy = function(session_id, cwd, from, to)
    {
	var resp = json_call_ajax_sync("InvocationService.copy", [session_id, cwd, from, to]);
//	var resp = json_call_sync("InvocationService.copy", [session_id, cwd, from, to]);
        return resp;
    }

    this.copy_async = function(session_id, cwd, from, to, _callback, _error_callback)
    {
    console.log("COPIES IN " + cwd + ", " + from + " -> " + to);
	json_call_ajax_async("InvocationService.copy", [session_id, cwd, from, to], 0, _callback, _error_callback)
    }

    this.make_directory = function(session_id, cwd, directory)
    {
	var resp = json_call_ajax_sync("InvocationService.make_directory", [session_id, cwd, directory]);
//	var resp = json_call_sync("InvocationService.make_directory", [session_id, cwd, directory]);
        return resp;
    }

    this.make_directory_async = function(session_id, cwd, directory, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.make_directory", [session_id, cwd, directory], 0, _callback, _error_callback)
    }

    this.remove_directory = function(session_id, cwd, directory)
    {
	var resp = json_call_ajax_sync("InvocationService.remove_directory", [session_id, cwd, directory]);
//	var resp = json_call_sync("InvocationService.remove_directory", [session_id, cwd, directory]);
        return resp;
    }

    this.remove_directory_async = function(session_id, cwd, directory, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.remove_directory", [session_id, cwd, directory], 0, _callback, _error_callback)
    }

    this.change_directory = function(session_id, cwd, directory)
    {
	var resp = json_call_ajax_sync("InvocationService.change_directory", [session_id, cwd, directory]);
//	var resp = json_call_sync("InvocationService.change_directory", [session_id, cwd, directory]);
        return resp;
    }

    this.change_directory_async = function(session_id, cwd, directory, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.change_directory", [session_id, cwd, directory], 0, _callback, _error_callback)
    }

    this.put_file = function(session_id, filename, contents, cwd)
    {
	var resp = json_call_ajax_sync("InvocationService.put_file", [session_id, filename, contents, cwd]);
//	var resp = json_call_sync("InvocationService.put_file", [session_id, filename, contents, cwd]);
        return resp;
    }

    this.put_file_async = function(session_id, filename, contents, cwd, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.put_file", [session_id, filename, contents, cwd], 0, _callback, _error_callback)
    }

    this.get_file = function(session_id, filename, cwd)
    {
	var resp = json_call_ajax_sync("InvocationService.get_file", [session_id, filename, cwd]);
//	var resp = json_call_sync("InvocationService.get_file", [session_id, filename, cwd]);
        return resp[0];
    }

    this.get_file_async = function(session_id, filename, cwd, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.get_file", [session_id, filename, cwd], 1, _callback, _error_callback)
    }

    this.run_pipeline = function(session_id, pipeline, input, max_output_size, cwd)
    {
	var resp = json_call_ajax_sync("InvocationService.run_pipeline", [session_id, pipeline, input, max_output_size, cwd]);
//	var resp = json_call_sync("InvocationService.run_pipeline", [session_id, pipeline, input, max_output_size, cwd]);
        return resp;
    }

    this.run_pipeline_async = function(session_id, pipeline, input, max_output_size, cwd, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.run_pipeline", [session_id, pipeline, input, max_output_size, cwd], 2, _callback, _error_callback)
    }

    this.run_pipeline2 = function(session_id, pipeline, input, max_output_size, cwd)
    {
	var resp = json_call_ajax_sync("InvocationService.run_pipeline2", [session_id, pipeline, input, max_output_size, cwd]);
//	var resp = json_call_sync("InvocationService.run_pipeline2", [session_id, pipeline, input, max_output_size, cwd]);
        return resp;
    }

    this.run_pipeline2_async = function(session_id, pipeline, input, max_output_size, cwd, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.run_pipeline2", [session_id, pipeline, input, max_output_size, cwd], 3, _callback, _error_callback)
    }

    this.exit_session = function(session_id)
    {
	var resp = json_call_ajax_sync("InvocationService.exit_session", [session_id]);
//	var resp = json_call_sync("InvocationService.exit_session", [session_id]);
        return resp;
    }

    this.exit_session_async = function(session_id, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.exit_session", [session_id], 0, _callback, _error_callback)
    }

    this.valid_commands = function()
    {
    dbg('call valid commands');
	var resp = json_call_ajax_sync("InvocationService.valid_commands", []);
//	var resp = json_call_sync("InvocationService.valid_commands", []);
        return resp[0];
    }

    this.valid_commands_async = function(_callback, _error_callback)
    {
    dbg('call valid commands async');
	json_call_ajax_async("InvocationService.valid_commands", [], 1, _callback, _error_callback)
    }

    this.get_tutorial_text = function(step)
    {
	var resp = json_call_ajax_sync("InvocationService.get_tutorial_text", [step]);
//	var resp = json_call_sync("InvocationService.get_tutorial_text", [step]);
        return resp;
    }

    this.get_tutorial_text_async = function(step, _callback, _error_callback)
    {
	json_call_ajax_async("InvocationService.get_tutorial_text", [step], 3, _callback, _error_callback)
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
        dbg(body);
        dbg(_url);
        var resp_txt;
	var code;
        console.log(rpc);
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

