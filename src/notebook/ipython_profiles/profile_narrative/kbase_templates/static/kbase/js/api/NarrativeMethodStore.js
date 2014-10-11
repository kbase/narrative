

function NarrativeMethodStore(url, auth, auth_cb) {

    this.url = url;
    var _url = url;
    var deprecationWarningSent = false;

    function deprecationWarning() {
        if (!deprecationWarningSent) {
            deprecationWarningSent = true;
            if (!window.console) return;
            console.log(
                "DEPRECATION WARNING: '*_async' method names will be removed",
                "in a future version. Please use the identical methods without",
                "the'_async' suffix.");
        }
    }

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "https://kbase.us/services/narrative_method_store/";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.ver = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.ver",
        [], 1, _callback, _errorCallback);
};

    this.ver_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.ver", [], 1, _callback, _error_callback);
    };

    this.list_categories = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_categories",
        [params], 2, _callback, _errorCallback);
};

    this.list_categories_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_categories", [params], 2, _callback, _error_callback);
    };

    this.list_methods = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_methods",
        [params], 1, _callback, _errorCallback);
};

    this.list_methods_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_methods", [params], 1, _callback, _error_callback);
    };

    this.list_methods_full_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_methods_full_info",
        [params], 1, _callback, _errorCallback);
};

    this.list_methods_full_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_methods_full_info", [params], 1, _callback, _error_callback);
    };

    this.list_methods_spec = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_methods_spec",
        [params], 1, _callback, _errorCallback);
};

    this.list_methods_spec_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_methods_spec", [params], 1, _callback, _error_callback);
    };

    this.list_method_ids_and_names = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_method_ids_and_names",
        [], 1, _callback, _errorCallback);
};

    this.list_method_ids_and_names_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_method_ids_and_names", [], 1, _callback, _error_callback);
    };

    this.get_method_brief_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_method_brief_info",
        [params], 1, _callback, _errorCallback);
};

    this.get_method_brief_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_method_brief_info", [params], 1, _callback, _error_callback);
    };

    this.get_method_full_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_method_full_info",
        [params], 1, _callback, _errorCallback);
};

    this.get_method_full_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_method_full_info", [params], 1, _callback, _error_callback);
    };

    this.get_method_spec = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_method_spec",
        [params], 1, _callback, _errorCallback);
};

    this.get_method_spec_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_method_spec", [params], 1, _callback, _error_callback);
    };
 

    /*
     * JSON call using jQuery method.
     */
    function json_call_ajax(method, params, numRets, callback, errorCallback) {
        var deferred = $.Deferred();

        if (typeof callback === 'function') {
           deferred.done(callback);
        }

        if (typeof errorCallback === 'function') {
           deferred.fail(errorCallback);
        }

        var rpc = {
            params : params,
            method : method,
            version: "1.1",
            id: String(Math.random()).slice(2),
        };

        var beforeSend = null;
        var token = (_auth_cb && typeof _auth_cb === 'function') ? _auth_cb()
            : (_auth.token ? _auth.token : null);
        if (token != null) {
            beforeSend = function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        }

        var xhr = jQuery.ajax({
            url: _url,
            dataType: "text",
            type: 'POST',
            processData: false,
            data: JSON.stringify(rpc),
            beforeSend: beforeSend,
            success: function (data, status, xhr) {
                var result;
                try {
                    var resp = JSON.parse(data);
                    result = (numRets === 1 ? resp.result[0] : resp.result);
                } catch (err) {
                    deferred.reject({
                        status: 503,
                        error: err,
                        url: _url,
                        resp: data
                    });
                    return;
                }
                deferred.resolve(result);
            },
            error: function (xhr, textStatus, errorThrown) {
                var error;
                if (xhr.responseText) {
                    try {
                        var resp = JSON.parse(xhr.responseText);
                        error = resp.error;
                    } catch (err) { // Not JSON
                        error = "Unknown error - " + xhr.responseText;
                    }
                } else {
                    error = "Unknown Error";
                }
                deferred.reject({
                    status: 500,
                    error: error
                });
            }
        });

        var promise = deferred.promise();
        promise.xhr = xhr;
        return promise;
    }
}


