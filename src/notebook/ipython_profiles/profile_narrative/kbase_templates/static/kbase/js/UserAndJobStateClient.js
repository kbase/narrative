

function UserAndJobState(url, auth, auth_cb) {

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


    this.set_state = function (service, key, value, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.set_state",
        [service, key, value], 0, _callback, _errorCallback);
};

    this.set_state_async = function (service, key, value, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.set_state", [service, key, value], 0, _callback, _error_callback);
    };

    this.set_state_auth = function (token, key, value, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.set_state_auth",
        [token, key, value], 0, _callback, _errorCallback);
};

    this.set_state_auth_async = function (token, key, value, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.set_state_auth", [token, key, value], 0, _callback, _error_callback);
    };

    this.get_state = function (service, key, auth, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_state",
        [service, key, auth], 1, _callback, _errorCallback);
};

    this.get_state_async = function (service, key, auth, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_state", [service, key, auth], 1, _callback, _error_callback);
    };

    this.remove_state = function (service, key, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.remove_state",
        [service, key], 0, _callback, _errorCallback);
};

    this.remove_state_async = function (service, key, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.remove_state", [service, key], 0, _callback, _error_callback);
    };

    this.remove_state_auth = function (token, key, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.remove_state_auth",
        [token, key], 0, _callback, _errorCallback);
};

    this.remove_state_auth_async = function (token, key, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.remove_state_auth", [token, key], 0, _callback, _error_callback);
    };

    this.list_state = function (service, auth, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.list_state",
        [service, auth], 1, _callback, _errorCallback);
};

    this.list_state_async = function (service, auth, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.list_state", [service, auth], 1, _callback, _error_callback);
    };

    this.list_state_services = function (auth, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.list_state_services",
        [auth], 1, _callback, _errorCallback);
};

    this.list_state_services_async = function (auth, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.list_state_services", [auth], 1, _callback, _error_callback);
    };

    this.create_job = function (_callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.create_job",
        [], 1, _callback, _errorCallback);
};

    this.create_job_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.create_job", [], 1, _callback, _error_callback);
    };

    this.start_job = function (job, token, status, desc, progress, est_complete, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.start_job",
        [job, token, status, desc, progress, est_complete], 0, _callback, _errorCallback);
};

    this.start_job_async = function (job, token, status, desc, progress, est_complete, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.start_job", [job, token, status, desc, progress, est_complete], 0, _callback, _error_callback);
    };

    this.create_and_start_job = function (token, status, desc, progress, est_complete, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.create_and_start_job",
        [token, status, desc, progress, est_complete], 1, _callback, _errorCallback);
};

    this.create_and_start_job_async = function (token, status, desc, progress, est_complete, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.create_and_start_job", [token, status, desc, progress, est_complete], 1, _callback, _error_callback);
    };

    this.update_job_progress = function (job, token, status, prog, est_complete, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.update_job_progress",
        [job, token, status, prog, est_complete], 0, _callback, _errorCallback);
};

    this.update_job_progress_async = function (job, token, status, prog, est_complete, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.update_job_progress", [job, token, status, prog, est_complete], 0, _callback, _error_callback);
    };

    this.update_job = function (job, token, status, est_complete, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.update_job",
        [job, token, status, est_complete], 0, _callback, _errorCallback);
};

    this.update_job_async = function (job, token, status, est_complete, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.update_job", [job, token, status, est_complete], 0, _callback, _error_callback);
    };

    this.get_job_description = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_job_description",
        [job], 5, _callback, _errorCallback);
};

    this.get_job_description_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_job_description", [job], 5, _callback, _error_callback);
    };

    this.get_job_status = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_job_status",
        [job], 7, _callback, _errorCallback);
};

    this.get_job_status_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_job_status", [job], 7, _callback, _error_callback);
    };

    this.complete_job = function (job, token, status, error, res, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.complete_job",
        [job, token, status, error, res], 0, _callback, _errorCallback);
};

    this.complete_job_async = function (job, token, status, error, res, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.complete_job", [job, token, status, error, res], 0, _callback, _error_callback);
    };

    this.get_results = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_results",
        [job], 1, _callback, _errorCallback);
};

    this.get_results_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_results", [job], 1, _callback, _error_callback);
    };

    this.get_detailed_error = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_detailed_error",
        [job], 1, _callback, _errorCallback);
};

    this.get_detailed_error_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_detailed_error", [job], 1, _callback, _error_callback);
    };

    this.get_job_info = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_job_info",
        [job], 1, _callback, _errorCallback);
};

    this.get_job_info_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_job_info", [job], 1, _callback, _error_callback);
    };

    this.list_jobs = function (services, filter, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.list_jobs",
        [services, filter], 1, _callback, _errorCallback);
};

    this.list_jobs_async = function (services, filter, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.list_jobs", [services, filter], 1, _callback, _error_callback);
    };

    this.list_job_services = function (_callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.list_job_services",
        [], 1, _callback, _errorCallback);
};

    this.list_job_services_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.list_job_services", [], 1, _callback, _error_callback);
    };

    this.delete_job = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.delete_job",
        [job], 0, _callback, _errorCallback);
};

    this.delete_job_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.delete_job", [job], 0, _callback, _error_callback);
    };

    this.force_delete_job = function (token, job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.force_delete_job",
        [token, job], 0, _callback, _errorCallback);
};

    this.force_delete_job_async = function (token, job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.force_delete_job", [token, job], 0, _callback, _error_callback);
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


