function NarrativeJobService(url, auth, auth_cb) {

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

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.run_app = function (app, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.run_app",
        [app], 1, _callback, _errorCallback);
};

    this.run_app_async = function (app, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.run_app", [app], 1, _callback, _error_callback);
    };

    this.check_app_state = function (job_id, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.check_app_state",
        [job_id], 1, _callback, _errorCallback);
};

    this.check_app_state_async = function (job_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.check_app_state", [job_id], 1, _callback, _error_callback);
    };

    this.suspend_app = function (job_id, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.suspend_app",
        [job_id], 1, _callback, _errorCallback);
};

    this.suspend_app_async = function (job_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.suspend_app", [job_id], 1, _callback, _error_callback);
    };

    this.resume_app = function (job_id, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.resume_app",
        [job_id], 1, _callback, _errorCallback);
};

    this.resume_app_async = function (job_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.resume_app", [job_id], 1, _callback, _error_callback);
    };

    this.delete_app = function (job_id, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.delete_app",
        [job_id], 1, _callback, _errorCallback);
};

    this.delete_app_async = function (job_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.delete_app", [job_id], 1, _callback, _error_callback);
    };

    this.list_config = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.list_config",
        [], 1, _callback, _errorCallback);
};

    this.list_config_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.list_config", [], 1, _callback, _error_callback);
    };

    this.ver = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.ver",
        [], 1, _callback, _errorCallback);
};

    this.ver_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.ver", [], 1, _callback, _error_callback);
    };

    this.status = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.status",
        [], 1, _callback, _errorCallback);
};

    this.status_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.status", [], 1, _callback, _error_callback);
    };

    this.list_running_apps = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.list_running_apps",
        [], 1, _callback, _errorCallback);
};

    this.list_running_apps_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.list_running_apps", [], 1, _callback, _error_callback);
    };

    this.run_job = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.run_job",
        [params], 1, _callback, _errorCallback);
};

    this.run_job_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.run_job", [params], 1, _callback, _error_callback);
    };

    this.get_job_params = function (job_id, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.get_job_params",
        [job_id], 2, _callback, _errorCallback);
};

    this.get_job_params_async = function (job_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.get_job_params", [job_id], 2, _callback, _error_callback);
    };

    this.add_job_logs = function (job_id, lines, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.add_job_logs",
        [job_id, lines], 1, _callback, _errorCallback);
};

    this.add_job_logs_async = function (job_id, lines, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.add_job_logs", [job_id, lines], 1, _callback, _error_callback);
    };

    this.get_job_logs = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.get_job_logs",
        [params], 1, _callback, _errorCallback);
};

    this.get_job_logs_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.get_job_logs", [params], 1, _callback, _error_callback);
    };

    this.finish_job = function (job_id, params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.finish_job",
        [job_id, params], 0, _callback, _errorCallback);
};

    this.finish_job_async = function (job_id, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.finish_job", [job_id, params], 0, _callback, _error_callback);
    };

    this.check_job = function (job_id, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.check_job",
        [job_id], 1, _callback, _errorCallback);
};

    this.check_job_async = function (job_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.check_job", [job_id], 1, _callback, _error_callback);
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