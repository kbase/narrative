/*
  Shock javascript client library

  This library allows the interaction with the Shock via javascript methods. The normal usage would be to first initialize the library with an authentication token and Shock url. It can then be used to retrieve, delete, update and create nodes in Shock. Refer to the function section below for details on the provided function calls. The upload of files uses chunking and automatically resumes failed uploads when the same file is uploaded again by the same user.

  FUNCTIONS

  constructor (params)
    initialize the Data Store client with: new ShockClient({ token: "myTokenString", url: "urlToShock", chunkSize: 2097152 })

  get_node
    retrieve a node from SHOCK with shockClient.get_node("myNodeId", retCallback, )
    The node-id parameter is mandatory. This function returns a promise that is fulfilled once the node is retrieved. The callback parameters in case they're defined should be functions.

  get_nodes
    retrieve all nodes for the current authentication setting with: shockClient.get_all_nodes({"my_prop": "my_value"}, retCallback, errorCallback)
    This function returns a promise that is fulfilled once the nodes are retrieved. The callback parameters in case they're defined should be functions.

  delete_node
    delete a node from SHOCK with shockClient.get_node("myNodeId", retCallback, errorCallback)
    The node-id parameter is mandatory. This function returns a promise that is fulfilled once the node is deleted. The callback parameters in case they're defined should be functions.

  upload_node
    create a new node with: shockClient.upload_node(file, retCallback, errorCallback, cancelCallback)
    The input parameter is a file from input form field. If no file is to be added to the node, this parameter must be null. The callback parameters in case they're defined should be functions.

  update_node
    update the attributes of an existing node with: shockClient.update_node("myNodeId", attributes, retCallback, errorCallback)
    The attributes parameter must be a JSON structure of metadata that is to be added to the node. Existing values will be replaced. This function returns a promise that is fulfilled once the node is updated. The callback parameters in case they're defined should be functions.

  This code was built based on https://github.com/MG-RAST/Shock/blob/master/libs/shock.js .
  Authors: Tobias Paczian <paczian@mcs.anl.gov>, Roman Sutormin <rsutormin@lbl.gov> .
*/
function ShockClient(params) {
    
    var self = this;

    self.url = "https://kbase.us/services/shock-api/";
    self.auth_header = {};
    self.chunkSize = 2097152;
    
	if (params.url)
	    self.url = params.url;

	if (params.token)
		self.auth_header = {'Authorization': 'OAuth '+params.token};

	if (params.chunkSize)
		self.chunkSize = params.chunkSize;
	
    self.get_node = function (node, ret, errorCallback) {
    	var url = self.url+'/node/'+node
    	var promise = jQuery.Deferred();
    	
    	jQuery.ajax(url, {
    		success: function (data) {
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
    		headers: self.auth_header,
    		type: "GET"
    	});
    	
    	return promise;
    };

    self.get_nodes = function (filters, ret, errorCallback) {
    	var url = self.url+'/node';
    	if (filters) {
    		url += "?query";
    		for (var key in filters) {
    			url += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(filters[key]);
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
    		headers: self.auth_header
    	});

    	return promise;
    };

    self.delete_node = function (id, ret, errorCallback) {
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
    		headers: self.auth_header,
    		type: "DELETE"
    	});
    	return promise;
    };

    self.update_node = function (node, attr, ret, errorCallback) {
    	var url = self.url+'/node';
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
	    	headers: self.auth_header,
	    	type: "PUT"
	    });
		return promise;
    };
    
    self.check_file = function(file, ret, errorCallback) {
    	var promise = jQuery.Deferred();
	    var fsize = file.size;
	    var ftime = file.lastModifiedDate.getTime();
	    var filters = {'file_size': fsize, 'file_time': ftime, 'file_name': file.name, 'limit': 1};
	    self.get_nodes(filters, function (data) {
	    	ret(data.length == 0 ? null : data[0]);
	    	promise.resolve();
	    }, function(error) {
	    	if (errorCallback)
	    		errorCallback(error);
	    	promise.resolve();
	    });
	    return promise;
    };
    
    self.loadNext = function (file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback) {
		if (cancelCallback && cancelCallback())
			return;
	    var fileReader = new FileReader();
	    fileReader.onload = function(e) {
    		if (cancelCallback && cancelCallback())
    			return;
		    var fd = new FormData();
		    var oMyBlob = new Blob([e.target.result], { "type" : file.type });
		    fd.append(currentChunk+1, oMyBlob);
		    var lastChunk = (currentChunk + 1) * chunkSize >= file.size;
		    var incomplete_attr = { 
		    		"incomplete": (lastChunk ? "0" : "1"), 
		    		"file_size": "" + file.size, 
		    		"file_name": file.name,
		    		"file_time": "" + file.lastModifiedDate.getTime(), 
		    		"chunks": "" + (currentChunk+1),
		    		"chunk_size": "" + chunkSize};
		    var aFileParts = [ JSON.stringify(incomplete_attr) ];
		    var oMyBlob2 = new Blob(aFileParts, { "type" : "text\/json" });
		    fd.append('attributes', oMyBlob2);
		    jQuery.ajax(url, {
		    	contentType: false,
		    	processData: false,
		    	data: fd,
		    	success: function(data) {
		    		if (cancelCallback && cancelCallback())
		    			return;
		    		currentChunk++;
					var uploaded_size = Math.min(file.size, currentChunk * chunkSize);
				    ret({file_size: file.size, uploaded_size: uploaded_size, node_id: incompleteId});
				    if ((currentChunk * chunkSize) >= file.size) {
			    		promise.resolve();
				    } else {
				    	self.loadNext(file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback);
				    }
		    	},
		    	error: function(jqXHR, error) {
		    		if (errorCallback)
		    			errorCallback(error);
		    		promise.resolve();
		    	},
		    	headers: self.auth_header,
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
		    ret({file_size: file.size, uploaded_size: file.size, node_id: incompleteId});
	    }
    };
    
    /**
     * Sends to ret function callback objects like {file_size: ..., uploaded_size: ..., node_id: ...}
     * for showing progress info in UI.
     */
    self.upload_node = function (file, ret, errorCallback, cancelCallback) {
    	var url = self.url+'/node';
    	var promise = jQuery.Deferred();
	    // if this is a chunked upload, check if it needs to be resumed
    	self.check_file(file, function (incomplete) {
    		if (cancelCallback && cancelCallback())
    			return;
    		if (incomplete != null) {
    			var incompleteId = incomplete["id"];
    			url += "/" + incomplete["id"];
    			var currentChunk = 0;
    			if (incomplete["attributes"]["incomplete_chunks"]) {
    				currentChunk = parseInt(incomplete["attributes"]["incomplete_chunks"]);
    			} else if (incomplete["attributes"]["chunks"]) {
    				currentChunk = parseInt(incomplete["attributes"]["chunks"]);
    			}
    			var chunkSize = self.chunkSize;
    			if (incomplete["attributes"]["chunk_size"])
    				chunkSize = parseInt(incomplete["attributes"]["chunk_size"]);
    			var uploadedSize = Math.min(file.size, currentChunk * chunkSize);
    			ret({file_size: file.size, uploaded_size: uploadedSize, node_id: incompleteId});
    			self.loadNext(file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback);
    		} else {
    			var chunkSize = self.chunkSize;
    			var chunks = Math.ceil(file.size / chunkSize);
    			var incomplete_attr = { "incomplete": "1", "file_size": "" + file.size, "file_name": file.name,
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
    		    		if (cancelCallback && cancelCallback())
    		    			return;
    					var incompleteId = data.data.id;
    					var uploaded_size = 0;
    					ret({file_size: file.size, uploaded_size: uploaded_size, node_id: incompleteId});
    					url += "/" + data.data.id;
    					self.loadNext(file, url, promise, 0, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback);
    				},
    				error: function(jqXHR, error){
    					if (errorCallback)
    						errorCallback(error);
    					promise.resolve();
    				},
    				headers: self.auth_header,
    				type: "POST"
    			});
    		}
    	}, function(error){
    		if (errorCallback)
    			errorCallback(error);
    		promise.resolve();
    	});
	    return promise;
    };
    
}