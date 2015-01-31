

function KBaseTrees(url, auth, auth_cb) {

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
        _url = "https://kbase.us/services/trees";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.replace_node_names = function (tree, replacements, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.replace_node_names",
        [tree, replacements], 1, _callback, _errorCallback);
};

    this.replace_node_names_async = function (tree, replacements, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.replace_node_names", [tree, replacements], 1, _callback, _error_callback);
    };

    this.remove_node_names_and_simplify = function (tree, removal_list, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.remove_node_names_and_simplify",
        [tree, removal_list], 1, _callback, _errorCallback);
};

    this.remove_node_names_and_simplify_async = function (tree, removal_list, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.remove_node_names_and_simplify", [tree, removal_list], 1, _callback, _error_callback);
    };

    this.merge_zero_distance_leaves = function (tree, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.merge_zero_distance_leaves",
        [tree], 1, _callback, _errorCallback);
};

    this.merge_zero_distance_leaves_async = function (tree, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.merge_zero_distance_leaves", [tree], 1, _callback, _error_callback);
    };

    this.extract_leaf_node_names = function (tree, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.extract_leaf_node_names",
        [tree], 1, _callback, _errorCallback);
};

    this.extract_leaf_node_names_async = function (tree, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.extract_leaf_node_names", [tree], 1, _callback, _error_callback);
    };

    this.extract_node_names = function (tree, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.extract_node_names",
        [tree], 1, _callback, _errorCallback);
};

    this.extract_node_names_async = function (tree, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.extract_node_names", [tree], 1, _callback, _error_callback);
    };

    this.get_node_count = function (tree, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_node_count",
        [tree], 1, _callback, _errorCallback);
};

    this.get_node_count_async = function (tree, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_node_count", [tree], 1, _callback, _error_callback);
    };

    this.get_leaf_count = function (tree, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_leaf_count",
        [tree], 1, _callback, _errorCallback);
};

    this.get_leaf_count_async = function (tree, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_leaf_count", [tree], 1, _callback, _error_callback);
    };

    this.get_tree = function (tree_id, options, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_tree",
        [tree_id, options], 1, _callback, _errorCallback);
};

    this.get_tree_async = function (tree_id, options, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_tree", [tree_id, options], 1, _callback, _error_callback);
    };

    this.get_alignment = function (alignment_id, options, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_alignment",
        [alignment_id, options], 1, _callback, _errorCallback);
};

    this.get_alignment_async = function (alignment_id, options, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_alignment", [alignment_id, options], 1, _callback, _error_callback);
    };

    this.get_tree_data = function (tree_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_tree_data",
        [tree_ids], 1, _callback, _errorCallback);
};

    this.get_tree_data_async = function (tree_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_tree_data", [tree_ids], 1, _callback, _error_callback);
    };

    this.get_alignment_data = function (alignment_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_alignment_data",
        [alignment_ids], 1, _callback, _errorCallback);
};

    this.get_alignment_data_async = function (alignment_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_alignment_data", [alignment_ids], 1, _callback, _error_callback);
    };

    this.get_tree_ids_by_feature = function (feature_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_tree_ids_by_feature",
        [feature_ids], 1, _callback, _errorCallback);
};

    this.get_tree_ids_by_feature_async = function (feature_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_tree_ids_by_feature", [feature_ids], 1, _callback, _error_callback);
    };

    this.get_tree_ids_by_protein_sequence = function (protein_sequence_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_tree_ids_by_protein_sequence",
        [protein_sequence_ids], 1, _callback, _errorCallback);
};

    this.get_tree_ids_by_protein_sequence_async = function (protein_sequence_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_tree_ids_by_protein_sequence", [protein_sequence_ids], 1, _callback, _error_callback);
    };

    this.get_alignment_ids_by_feature = function (feature_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_alignment_ids_by_feature",
        [feature_ids], 1, _callback, _errorCallback);
};

    this.get_alignment_ids_by_feature_async = function (feature_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_alignment_ids_by_feature", [feature_ids], 1, _callback, _error_callback);
    };

    this.get_alignment_ids_by_protein_sequence = function (protein_sequence_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_alignment_ids_by_protein_sequence",
        [protein_sequence_ids], 1, _callback, _errorCallback);
};

    this.get_alignment_ids_by_protein_sequence_async = function (protein_sequence_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_alignment_ids_by_protein_sequence", [protein_sequence_ids], 1, _callback, _error_callback);
    };

    this.get_tree_ids_by_source_id_pattern = function (pattern, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_tree_ids_by_source_id_pattern",
        [pattern], 1, _callback, _errorCallback);
};

    this.get_tree_ids_by_source_id_pattern_async = function (pattern, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_tree_ids_by_source_id_pattern", [pattern], 1, _callback, _error_callback);
    };

    this.get_leaf_to_protein_map = function (tree_id, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_leaf_to_protein_map",
        [tree_id], 1, _callback, _errorCallback);
};

    this.get_leaf_to_protein_map_async = function (tree_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_leaf_to_protein_map", [tree_id], 1, _callback, _error_callback);
    };

    this.get_leaf_to_feature_map = function (tree_id, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.get_leaf_to_feature_map",
        [tree_id], 1, _callback, _errorCallback);
};

    this.get_leaf_to_feature_map_async = function (tree_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.get_leaf_to_feature_map", [tree_id], 1, _callback, _error_callback);
    };

    this.compute_abundance_profile = function (abundance_params, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.compute_abundance_profile",
        [abundance_params], 1, _callback, _errorCallback);
};

    this.compute_abundance_profile_async = function (abundance_params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.compute_abundance_profile", [abundance_params], 1, _callback, _error_callback);
    };

    this.filter_abundance_profile = function (abundance_data, filter_params, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.filter_abundance_profile",
        [abundance_data, filter_params], 1, _callback, _errorCallback);
};

    this.filter_abundance_profile_async = function (abundance_data, filter_params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.filter_abundance_profile", [abundance_data, filter_params], 1, _callback, _error_callback);
    };

    this.draw_html_tree = function (tree, display_options, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.draw_html_tree",
        [tree, display_options], 1, _callback, _errorCallback);
};

    this.draw_html_tree_async = function (tree, display_options, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.draw_html_tree", [tree, display_options], 1, _callback, _error_callback);
    };

    this.construct_species_tree = function (input, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.construct_species_tree",
        [input], 1, _callback, _errorCallback);
};

    this.construct_species_tree_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.construct_species_tree", [input], 1, _callback, _error_callback);
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
                xhr.setRequestHeader("Authorization", _auth.token);
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


