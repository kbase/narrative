

function KBaseFeatureValues(url, auth, auth_cb) {

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
        _url = "https://ci.kbase.us/services/feature_values/jsonrpc";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.estimate_k = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.estimate_k",
        [params], 1, _callback, _errorCallback);
};

    this.estimate_k_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.estimate_k", [params], 1, _callback, _error_callback);
    };

    this.cluster_k_means = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.cluster_k_means",
        [params], 1, _callback, _errorCallback);
};

    this.cluster_k_means_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.cluster_k_means", [params], 1, _callback, _error_callback);
    };

    this.cluster_hierarchical = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.cluster_hierarchical",
        [params], 1, _callback, _errorCallback);
};

    this.cluster_hierarchical_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.cluster_hierarchical", [params], 1, _callback, _error_callback);
    };

    this.clusters_from_dendrogram = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.clusters_from_dendrogram",
        [params], 1, _callback, _errorCallback);
};

    this.clusters_from_dendrogram_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.clusters_from_dendrogram", [params], 1, _callback, _error_callback);
    };

    this.evaluate_clusterset_quality = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.evaluate_clusterset_quality",
        [params], 1, _callback, _errorCallback);
};

    this.evaluate_clusterset_quality_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.evaluate_clusterset_quality", [params], 1, _callback, _error_callback);
    };

    this.validate_matrix = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.validate_matrix",
        [params], 1, _callback, _errorCallback);
};

    this.validate_matrix_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.validate_matrix", [params], 1, _callback, _error_callback);
    };

    this.correct_matrix = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.correct_matrix",
        [params], 1, _callback, _errorCallback);
};

    this.correct_matrix_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.correct_matrix", [params], 1, _callback, _error_callback);
    };

    this.status = function (_callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.status",
        [], 1, _callback, _errorCallback);
};

    this.status_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.status", [], 1, _callback, _error_callback);
    };

    this.reconnect_matrix_to_genome = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.reconnect_matrix_to_genome",
        [params], 1, _callback, _errorCallback);
};

    this.reconnect_matrix_to_genome_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.reconnect_matrix_to_genome", [params], 1, _callback, _error_callback);
    };

    this.get_matrix_descriptor = function (GetMatrixDescriptorParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_descriptor",
        [GetMatrixDescriptorParams], 1, _callback, _errorCallback);
};

    this.get_matrix_descriptor_async = function (GetMatrixDescriptorParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_descriptor", [GetMatrixDescriptorParams], 1, _callback, _error_callback);
    };

    this.get_matrix_row_descriptors = function (GetMatrixItemDescriptorsParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_row_descriptors",
        [GetMatrixItemDescriptorsParams], 1, _callback, _errorCallback);
};

    this.get_matrix_row_descriptors_async = function (GetMatrixItemDescriptorsParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_row_descriptors", [GetMatrixItemDescriptorsParams], 1, _callback, _error_callback);
    };

    this.get_matrix_column_descriptors = function (GetMatrixItemDescriptorsParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_column_descriptors",
        [GetMatrixItemDescriptorsParams], 1, _callback, _errorCallback);
};

    this.get_matrix_column_descriptors_async = function (GetMatrixItemDescriptorsParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_column_descriptors", [GetMatrixItemDescriptorsParams], 1, _callback, _error_callback);
    };

    this.get_matrix_rows_stat = function (GetMatrixItemsStatParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_rows_stat",
        [GetMatrixItemsStatParams], 1, _callback, _errorCallback);
};

    this.get_matrix_rows_stat_async = function (GetMatrixItemsStatParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_rows_stat", [GetMatrixItemsStatParams], 1, _callback, _error_callback);
    };

    this.get_matrix_columns_stat = function (GetMatrixItemsStatParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_columns_stat",
        [GetMatrixItemsStatParams], 1, _callback, _errorCallback);
};

    this.get_matrix_columns_stat_async = function (GetMatrixItemsStatParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_columns_stat", [GetMatrixItemsStatParams], 1, _callback, _error_callback);
    };

    this.get_matrix_row_sets_stat = function (GetMatrixSetsStatParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_row_sets_stat",
        [GetMatrixSetsStatParams], 1, _callback, _errorCallback);
};

    this.get_matrix_row_sets_stat_async = function (GetMatrixSetsStatParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_row_sets_stat", [GetMatrixSetsStatParams], 1, _callback, _error_callback);
    };

    this.get_matrix_column_sets_stat = function (GetMatrixSetsStatParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_column_sets_stat",
        [GetMatrixSetsStatParams], 1, _callback, _errorCallback);
};

    this.get_matrix_column_sets_stat_async = function (GetMatrixSetsStatParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_column_sets_stat", [GetMatrixSetsStatParams], 1, _callback, _error_callback);
    };

    this.get_matrix_stat = function (GetMatrixStatParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_matrix_stat",
        [GetMatrixStatParams], 1, _callback, _errorCallback);
};

    this.get_matrix_stat_async = function (GetMatrixStatParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_matrix_stat", [GetMatrixStatParams], 1, _callback, _error_callback);
    };

    this.get_submatrix_stat = function (GetSubmatrixStatParams, _callback, _errorCallback) {
    return json_call_ajax("KBaseFeatureValues.get_submatrix_stat",
        [GetSubmatrixStatParams], 1, _callback, _errorCallback);
};

    this.get_submatrix_stat_async = function (GetSubmatrixStatParams, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseFeatureValues.get_submatrix_stat", [GetSubmatrixStatParams], 1, _callback, _error_callback);
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

        jQuery.ajax({
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
        return deferred.promise();
    }
}


