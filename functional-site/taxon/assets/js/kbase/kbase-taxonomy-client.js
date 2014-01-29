

function Taxonomy(url, auth, auth_cb) {

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


    this.get_taxon = function (tax_id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon",
        [tax_id], 1, _callback, _errorCallback);
};

    this.get_taxon_async = function (tax_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon", [tax_id], 1, _callback, _error_callback);
    };

    this.get_taxon_lineage = function (tax_id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_lineage",
        [tax_id], 1, _callback, _errorCallback);
};

    this.get_taxon_lineage_async = function (tax_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_lineage", [tax_id], 1, _callback, _error_callback);
    };

    this.get_taxon_desc_from_wiki = function (tax_id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_desc_from_wiki",
        [tax_id], 1, _callback, _errorCallback);
};

    this.get_taxon_desc_from_wiki_async = function (tax_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_desc_from_wiki", [tax_id], 1, _callback, _error_callback);
    };

    this.get_taxon_environment_locations = function (tax_id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_environment_locations",
        [tax_id], 1, _callback, _errorCallback);
};

    this.get_taxon_environment_locations_async = function (tax_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_environment_locations", [tax_id], 1, _callback, _error_callback);
    };

    this.get_taxon_versioning = function (tax_id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_versioning",
        [tax_id], 1, _callback, _errorCallback);
};

    this.get_taxon_versioning_async = function (tax_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_versioning", [tax_id], 1, _callback, _error_callback);
    };

    this.get_taxon_properties = function (TaxonID, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_properties",
        [TaxonID], 1, _callback, _errorCallback);
};

    this.get_taxon_properties_async = function (TaxonID, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_properties", [TaxonID], 1, _callback, _error_callback);
    };

    this.get_taxon_models = function (tax_id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_models",
        [tax_id], 1, _callback, _errorCallback);
};

    this.get_taxon_models_async = function (tax_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_models", [tax_id], 1, _callback, _error_callback);
    };

    this.get_local_species_tree = function (id, max_depth, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_local_species_tree",
        [id, max_depth], 1, _callback, _errorCallback);
};

    this.get_local_species_tree_async = function (id, max_depth, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_local_species_tree", [id, max_depth], 1, _callback, _error_callback);
    };

    this.get_taxon_variants = function (tax_id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_variants",
        [tax_id], 1, _callback, _errorCallback);
};

    this.get_taxon_variants_async = function (tax_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_variants", [tax_id], 1, _callback, _error_callback);
    };

    this.get_taxon_wild_type = function (id, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_taxon_wild_type",
        [id], 1, _callback, _errorCallback);
};

    this.get_taxon_wild_type_async = function (id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_taxon_wild_type", [id], 1, _callback, _error_callback);
    };

    this.get_popular_genomes = function (_callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_popular_genomes",
        [], 1, _callback, _errorCallback);
};

    this.get_popular_genomes_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_popular_genomes", [], 1, _callback, _error_callback);
    };

    this.get_popular_models = function (_callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_popular_models",
        [], 1, _callback, _errorCallback);
};

    this.get_popular_models_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_popular_models", [], 1, _callback, _error_callback);
    };

    this.get_favorite_genomes = function (_callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_favorite_genomes",
        [], 1, _callback, _errorCallback);
};

    this.get_favorite_genomes_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_favorite_genomes", [], 1, _callback, _error_callback);
    };

    this.get_favorite_models = function (_callback, _errorCallback) {
    return json_call_ajax("Taxonomy.get_favorite_models",
        [], 1, _callback, _errorCallback);
};

    this.get_favorite_models_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.get_favorite_models", [], 1, _callback, _error_callback);
    };

    this.add_favorite_genomes = function (arg_1, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.add_favorite_genomes",
        [arg_1], 1, _callback, _errorCallback);
};

    this.add_favorite_genomes_async = function (arg_1, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.add_favorite_genomes", [arg_1], 1, _callback, _error_callback);
    };

    this.add_favorite_models = function (arg_1, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.add_favorite_models",
        [arg_1], 1, _callback, _errorCallback);
};

    this.add_favorite_models_async = function (arg_1, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.add_favorite_models", [arg_1], 1, _callback, _error_callback);
    };

    this.remove_favorite_genomes = function (arg_1, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.remove_favorite_genomes",
        [arg_1], 1, _callback, _errorCallback);
};

    this.remove_favorite_genomes_async = function (arg_1, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.remove_favorite_genomes", [arg_1], 1, _callback, _error_callback);
    };

    this.remove_favorite_models = function (arg_1, _callback, _errorCallback) {
    return json_call_ajax("Taxonomy.remove_favorite_models",
        [arg_1], 1, _callback, _errorCallback);
};

    this.remove_favorite_models_async = function (arg_1, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Taxonomy.remove_favorite_models", [arg_1], 1, _callback, _error_callback);
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


