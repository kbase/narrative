/*
  AWE javascript client library. Please feel free to extend it.
  Authors: Roman Sutormin <rsutormin@lbl.gov>, ...
*/
function AweClient(params) {
    
    var self = this;

    self.url = "https://kbase.us/services/awe-api/";
    self.auth_header = {};
	if (params.url)
	    self.url = params.url;
	if (params.token)
		self.auth_header = {'Authorization': 'OAuth '+params.token};

    self.get_job = function (jobId, ret, errorCallback) {
    	var url = self.url+'/job/'+jobId
    	var promise = jQuery.Deferred();
    	jQuery.ajax(url, {
    		success: function (data) {
    			var unknownError = false;
    			if (data) {
    			    if (data.error) {
    			    	if (errorCallback)
        					errorCallback(data.error);
    			    } else if (data.data) {
    	    			ret(data.data);
    			    } else {
    			    	unknownError = true;
    			    }
    			} else {
    				unknownError = true;
    			}
    			if (unknownError && errorCallback)
    				errorCallback("Error: invalid data returned from AWE server");
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
   
}