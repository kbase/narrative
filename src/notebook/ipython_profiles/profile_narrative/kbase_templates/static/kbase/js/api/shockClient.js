/*

  Shock javascript client library

  This library allows the interaction with the Shock via javascript methods. The normal usage would be to first initialize the library with an authentication token and Shock url. It can then be used to retrieve, delete, update and create nodes in Shock. Refer to the function section below for details on the provided function calls. The upload of files uses chunking and automatically resumes failed uploads when the same file is uploaded again by the same user.

  FUNCTIONS

  init (params)
    initialize the Data Store client with: SHOCK.init({ token: "myTokenString", url: "urlToShock" })

  set_auth
    set the authorization token with: SHOCK.set_auth("myTokenString")

  get_node
    retrieve a node from SHOCK with SHOCK.get_node("myNodeId", callback)
    The node-id parameter is mandatory. This function returns a promise that is fulfilled once the node is retrieved. The callback parameter can either be a variable or a function. A variable will be set to the data value of the node, a function will receive the data as the first parameter.

  get_all_nodes
    retrieve all nodes for the current authentication setting with: SHOCK.get_all_nodes(callback)
    This function returns a promise that is fulfilled once the nodes are retrieved. The callback parameter can either be a variable or a function. A variable will be set to the array of data values of the nodes, a function will receive the array as the first parameter.

  delete_node
    delete a node from SHOCK with SHOCK.get_node("myNodeId")
    The node-id parameter is mandatory. This function returns a promise that is fulfilled once the node is deleted.

  create_node
    create a new node with: SHOCK.create_node(input, attributes, callback)
    The input parameter can either be a file-type form field or its id. If no file is to be added to the node, this parameter must be null. The optional attributes parameter must be a JSON structure of metadata that is to be added to the node. If no metadata is to be added, this parameter must be null. The callback parameter can either be a variable or a function. A variable will be set to the data value of the created node, a function will receive node data as the first parameter. The create_node function returns a promise that is fulfilled once the node is created. 

  update_node
    update the attributes of an existing node with: SHOCK.update_node("myNodeId", attributes, callback)
    The attributes parameter must be a JSON structure of metadata that is to be added to the node. Existing values will be replaced. This function returns a promise that is fulfilled once the node is updated. The callback parameter can either be a variable or a function. A variable will be set to the data value of the node, a function will receive the data as the first parameter.

  PLANNED FEATURES

    * support for queries in node retrieval
    * upload progress feedback
    * deletion of attributes (currently not implemented in SHOCK)
    * variable chunk size
    * parallel chunk-upload support (feedback that allows resuming of failed chunk upload not yet implemented in SHOCK)

  Please send feedback, bug-reports and questions to Tobias Paczian (paczian@mcs.anl.gov)

*/
function ShockClient(params) {
    
    var SHOCK = this;

    SHOCK.url = "https://kbase.us/services/shock-api/";
    SHOCK.auth_header = {};
    SHOCK.chunkSize = 2097152;
    
	if (params.url)
	    SHOCK.url = params.url;

	if (params.token)
		SHOCK.auth_header = {'Authorization': 'OAuth '+params.token};

	if (params.chunkSize)
		SHOCK.chunkSize = params.chunkSize;
	
    SHOCK.get_node = function (node, ret, errorCallback) {
    	var url = SHOCK.url+'/node/'+node
    	var promise = jQuery.Deferred();
    	
    	jQuery.ajax(url, {
    		success: function (data) {
    			console.log(data);
    			var retval = null;
    			if (data != null && data.hasOwnProperty('data')) {
    			    if (data.error != null) {
    			    	retval = null;
    			    	if (errorCallback)
        					errorCallback(data.error);
    			    } else {
    			    	retval = data.data;
    			    }
    			} else {
    				if (errorCallback)
    					errorCallback("error: invalid return structure from SHOCK server");
    			}
    			ret(retval);
    			promise.resolve();
    		},
    		error: function(jqXHR, error){
    			if (errorCallback)
					errorCallback(error);
    			promise.resolve();
    		},
    		headers: SHOCK.auth_header,
    		type: "GET"
    	});
    	
    	return promise;
    };

    SHOCK.get_nodes = function (filters, ret, errorCallback) {
    	var url = SHOCK.url+'/node';
    	if (filters) {
    		url += "?query";
    		for (var key in filters) {
    			utl += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(filters[key]);
    		}
    	}
    	var promise = jQuery.Deferred();
    	jQuery.ajax(url, {
    		success: function(data) {
    			var retval = null;
    			if (data != null && data.hasOwnProperty('data')) {
    				if (data.error != null) {
        				if (errorCallback)
        					errorCallback(data.error);
    				} else {
    	    			ret(data.data);
    				}
    			} else {
    				if (errorCallback)
    					errorCallback(data);
    			}
    			promise.resolve();
    		},
    		error: function(jqXHR, error) {
				if (errorCallback)
					errorCallback(error);
    			promise.resolve();
    		},
    		headers: SHOCK.auth_header
    	});

    	return promise;
    };

    SHOCK.delete_node = function (id, ret, errorCallback) {
    	var promise = jQuery.Deferred();
    	jQuery.ajax(url+"/" + id, {
    		success: function (data) {
    			ret(true);
    			promise.resolve();
    		},
    		error: function(jqXHR, error){
    			if (errorCallback)
					errorCallback(error);
    			promise.resolve();
    		},
    		headers: SHOCK.auth_header,
    		type: "DELETE"
    	});
    	return promise;
    };

    SHOCK.update_node = function (node, attr, ret, errorCallback) {
    	var url = SHOCK.url+'/node';
    	var promise = jQuery.Deferred();
	    var aFileParts = [ JSON.stringify(attr) ];
	    var oMyBlob = new Blob(aFileParts, { "type" : "text\/json" });
	    var fd = new FormData();
	    fd.append('attributes', oMyBlob);
	    jQuery.ajax(url +  "/" + node, {
	    	contentType: false,
	    	processData: false,
	    	data: fd,
	    	success: function(data){
		    	ret(data.data);
		    	promise.resolve();
	    	},
	    	error: function(jqXHR, error){
	    		if (errorCallback)
					errorCallback(error);
		    	promise.resolve();
	    	},
	    	headers: SHOCK.auth_header,
	    	type: "PUT"
	    });
		return promise;
    };
    
    SHOCK.check_incomplete = function(file, ret, errorCallback) {
    	var url = SHOCK.url+'/node';
    	var promise = jQuery.Deferred();

		//input = document.getElementById(input);
	    //var files = input.files;
	    //var file = files[0];
	    var fsize = file.size;
	    var ftime = file.lastModifiedDate.getTime();
    	jQuery.ajax(url+"?query&incomplete=1&file_size="+fsize, {
			success: function (data) {
				//console.log(data);
				for (i=0;i<data.data.length;i++) {
				    if ((("" + file.size) == data.data[i]["attributes"]["file_size"]) && 
				    		(file.name == data.data[i]["attributes"]["file_name"]) &&
				    		(("" + file.lastModifiedDate.getTime()) == data.data[i]["attributes"]["file_time"])) {
				    	var incomplete = data.data[i];
			    		var incompleteId = incomplete["id"];
			    		var currentChunk = 0;
			    		if (incomplete["attributes"]["incomplete_chunks"])
			    			currentChunk = parseInt(incomplete["attributes"]["incomplete_chunks"]);
			    		var chunkSize = SHOCK.chunkSize;
			    		if (incomplete["attributes"]["chunk_size"])
			    			chunkSize = parseInt(incomplete["attributes"]["chunk_size"]);
						var uploadedSize = Math.min(file.size, currentChunk * chunkSize);
						ret({file_size: file.size, uploaded_size: uploadedSize, incomplete_id: incompleteId});
				    }
				}
			},
			error: function(jqXHR, error) {
				if (errorCallback)
					errorCallback(error);
			    promise.resolve();
			},
			headers: SHOCK.auth_header,
			type: "GET"
		});
    };
    
    SHOCK.loadNext = function (file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback) {
	    var fileReader = new FileReader();
	    fileReader.onload = function(e) {
		    var fd = new FormData();
		    var oMyBlob = new Blob([e.target.result], { "type" : file.type });
		    fd.append(currentChunk+1, oMyBlob);
		    var incomplete_attr = { "incomplete": "1", "file_size": "" + file.size, "file_name": file.name,
		    		"file_time": "" + file.lastModifiedDate.getTime(), "incomplete_chunks": "" + (currentChunk+1),
		    		"chunk_size": "" + chunkSize};
		    var aFileParts = [ JSON.stringify(incomplete_attr) ];
		    var oMyBlob2 = new Blob(aFileParts, { "type" : "text\/json" });
		    fd.append('attributes', oMyBlob2);
		    jQuery.ajax(url, {
		    	contentType: false,
		    	processData: false,
		    	data: fd,
		    	success: function(data) {
		    		currentChunk++;
					var uploaded_size = Math.min(file.size, currentChunk * chunkSize);
				    ret({file_size: file.size, uploaded_size: uploaded_size, incomplete_id: incompleteId});
				    if ((currentChunk * chunkSize) >= file.size) {
			    		promise.resolve();
				    } else {
				    	SHOCK.loadNext(file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback);
				    }
		    	},
		    	error: function(jqXHR, error) {
		    		if (errorCallback)
		    			errorCallback(error);
		    		promise.resolve();
		    	},
		    	headers: SHOCK.auth_header,
		    	type: "PUT"
		    });
		};
	    fileReader.onerror = function () {
    		if (errorCallback)
    			errorCallback("error during upload at chunk "+currentChunk+".");
		    promise.resolve();
		};
	    var start = currentChunk * chunkSize;
	    if (start < file.size) {
	    	var end = (start + chunkSize >= file.size) ? file.size : start + chunkSize;
	    	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
	    	fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
	    } else {
		    ret({file_size: file.size, uploaded_size: file.size, incomplete_id: incompleteId});
	    }
    };
    
    SHOCK.upload_node = function (file, ret, errorCallback) {
    	var url = SHOCK.url+'/node';
    	var promise = jQuery.Deferred();
	    // if this is a chunked upload, check if it needs to be resumed
	    jQuery.ajax(url+"?query&incomplete=1&file_size="+file.size, {
	    	success: function (data) {
		    	var incomplete = null;
		    	for (i=0;i<data.data.length;i++) {
		    		if ((("" + file.size) == data.data[i]["attributes"]["file_size"]) && 
		    				(file.name == data.data[i]["attributes"]["file_name"]) &&
		    				(("" + file.lastModifiedDate.getTime()) == data.data[i]["attributes"]["file_time"])) {
		    			incomplete = data.data[i];
		    			break;
		    		}
		    	}

		    	var incomplete_attr = {};
		    	if (incomplete != null) {
		    		var incompleteId = incomplete["id"];
		    		url += "/" + incomplete["id"];
		    		var currentChunk = 0;
		    		if (incomplete["attributes"]["incomplete_chunks"])
		    			currentChunk = parseInt(incomplete["attributes"]["incomplete_chunks"]);
		    		console.log("ShockClient.currentChunk=" + currentChunk);
		    		var chunkSize = SHOCK.chunkSize;
		    		if (incomplete["attributes"]["chunk_size"])
		    			chunkSize = parseInt(incomplete["attributes"]["chunk_size"]);
		    		var uploadedSize = Math.min(file.size, currentChunk * chunkSize);
		    		ret({file_size: file.size, uploaded_size: uploadedSize, incomplete_id: incompleteId});
		    		SHOCK.loadNext(file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback);
		    	} else {
		    		var chunkSize = SHOCK.chunkSize;
		    	    var chunks = Math.ceil(file.size / chunkSize);
		    		incomplete_attr = { "incomplete": "1", "file_size": "" + file.size, "file_name": file.name,
		    				"file_time": "" + file.lastModifiedDate.getTime(), "chunk_size": "" + chunkSize};
		    		var aFileParts = [ JSON.stringify(incomplete_attr) ];
		    		var oMyBlob = new Blob(aFileParts, { "type" : "text\/json" });
		    		var fd = new FormData();
		    		fd.append('attributes', oMyBlob);
		    		fd.append('parts', chunks);
		    		jQuery.ajax(url, {
		    			contentType: false,
		    			processData: false,
		    			data: fd,
		    			success: function(data) {
		    				var incompleteId = data.data.id;
		    				var uploaded_size = 0;
		    				ret({file_size: file.size, uploaded_size: uploaded_size, incomplete_id: incompleteId});
		    				url += "/" + data.data.id;
		    				SHOCK.loadNext(file, url, promise, 0, chunks, incompleteId, chunkSize, ret, errorCallback);
		    			},
		    			error: function(jqXHR, error){
		    	    		if (errorCallback)
		    	    			errorCallback(error);
		    				promise.resolve();
		    			},
		    			headers: SHOCK.auth_header,
		    			type: "POST"
		    		});
		    	}
	    	},
	    	error: function(jqXHR, error){
	    		if (errorCallback)
	    			errorCallback(error);
	    		promise.resolve();
	    	},
	    	headers: SHOCK.auth_header,
	    	type: "GET"
	    });
	    return promise;
    };
    
}