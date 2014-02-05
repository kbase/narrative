/*


*/

define('KbaseNetworkServiceClient',
    [
        'jquery',
    ],
    function ($) {

window.KBaseNetworks = function (url, auth, auth_cb) {

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


    this.all_datasets = function (_callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.all_datasets",
        [], 1, _callback, _errorCallback);
};

    this.all_datasets_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.all_datasets", [], 1, _callback, _error_callback);
    };

    this.all_dataset_sources = function (_callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.all_dataset_sources",
        [], 1, _callback, _errorCallback);
};

    this.all_dataset_sources_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.all_dataset_sources", [], 1, _callback, _error_callback);
    };

    this.all_network_types = function (_callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.all_network_types",
        [], 1, _callback, _errorCallback);
};

    this.all_network_types_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.all_network_types", [], 1, _callback, _error_callback);
    };

    this.dataset_source2datasets = function (source_ref, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.dataset_source2datasets",
        [source_ref], 1, _callback, _errorCallback);
};

    this.dataset_source2datasets_async = function (source_ref, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.dataset_source2datasets", [source_ref], 1, _callback, _error_callback);
    };

    this.taxon2datasets = function (taxid, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.taxon2Datasets",
        [taxid], 1, _callback, _errorCallback);
};

    this.taxon2datasets_async = function (taxid, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.taxon2datasets", [taxid], 1, _callback, _error_callback);
    };

    this.network_type2datasets = function (net_type, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.network_type2datasets",
        [net_type], 1, _callback, _errorCallback);
};

    this.network_type2datasets_async = function (net_type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.network_type2datasets", [net_type], 1, _callback, _error_callback);
    };

    this.entity2datasets = function (entity_id, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.entity2datasets",
        [entity_id], 1, _callback, _errorCallback);
};

    this.entity2datasets_async = function (entity_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.entity2datasets", [entity_id], 1, _callback, _error_callback);
    };

    this.build_first_neighbor_network = function (dataset_ids, entity_ids, edge_types, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.build_first_neighbor_network",
        [dataset_ids, entity_ids, edge_types], 1, _callback, _errorCallback);
};

    this.build_first_neighbor_network_async = function (dataset_ids, entity_ids, edge_types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.build_first_neighbor_network", [dataset_ids, entity_ids, edge_types], 1, _callback, _error_callback);
    };

    this.build_first_neighbor_network_limted_by_strength = function (dataset_ids, entity_ids, edge_types, cutOff, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.build_first_neighbor_network_limted_by_strength",
        [dataset_ids, entity_ids, edge_types, cutOff], 1, _callback, _errorCallback);
};

    this.build_first_neighbor_network_limted_by_strength_async = function (dataset_ids, entity_ids, edge_types, cutOff, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.build_first_neighbor_network_limted_by_strength", [dataset_ids, entity_ids, edge_types, cutOff], 1, _callback, _error_callback);
    };

    this.buildInternalNetwork = function (dataset_ids, gene_ids, edge_types, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.buildInternalNetwork",
        [dataset_ids, gene_ids, edge_types], 1, _callback, _errorCallback);
};

    this.build_internal_network_async = function (dataset_ids, gene_ids, edge_types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.build_internal_network", [dataset_ids, gene_ids, edge_types], 1, _callback, _error_callback);
    };

    this.build_internal_network_limited_by_strength = function (dataset_ids, gene_ids, edge_types, cutOff, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.build_internal_network_limited_by_strength",
        [dataset_ids, gene_ids, edge_types, cutOff], 1, _callback, _errorCallback);
};

    this.build_internal_network_limited_by_strength_async = function (dataset_ids, gene_ids, edge_types, cutOff, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseNetworks.build_internal_network_limited_by_strength", [dataset_ids, gene_ids, edge_types, cutOff], 1, _callback, _error_callback);
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


} );
