
/**
 * The KBase API
 * http://kbase.us
 *
 * API documentation: http://kbase.us/developer-zone/api-documentation/
 * @license Copyright (c) 2013, The DOE Systems Biology Knowledgebase Project
 */



function IDServerAPI(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.kbase_ids_to_external_ids = function (ids, _callback, _errorCallback) {
        return json_call_ajax("IDServerAPI.kbase_ids_to_external_ids",
            [ids], 1, _callback, _errorCallback);
    };

    this.external_ids_to_kbase_ids = function (external_db, ext_ids, _callback, _errorCallback) {
        return json_call_ajax("IDServerAPI.external_ids_to_kbase_ids",
            [external_db, ext_ids], 1, _callback, _errorCallback);
    };

    this.register_ids = function (prefix, db_name, ids, _callback, _errorCallback) {
        return json_call_ajax("IDServerAPI.register_ids",
            [prefix, db_name, ids], 1, _callback, _errorCallback);
    };

    this.allocate_id_range = function (kbase_id_prefix, count, _callback, _errorCallback) {
        return json_call_ajax("IDServerAPI.allocate_id_range",
            [kbase_id_prefix, count], 1, _callback, _errorCallback);
    };

    this.register_allocated_ids = function (prefix, db_name, assignments, _callback, _errorCallback) {
        return json_call_ajax("IDServerAPI.register_allocated_ids",
            [prefix, db_name, assignments], 0, _callback, _errorCallback);
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




function Sim(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.sims = function (ids, options, _callback, _errorCallback) {
        return json_call_ajax("Sim.sims",
            [ids, options], 1, _callback, _errorCallback);
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




function PlantExpression(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_repid_by_sampleid = function (ids, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_repid_by_sampleid",
            [ids], 1, _callback, _errorCallback);
    };

    this.get_experiments_by_seriesid = function (ids, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_experiments_by_seriesid",
            [ids], 1, _callback, _errorCallback);
    };

    this.get_experiments_by_sampleid = function (ids, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_experiments_by_sampleid",
            [ids], 1, _callback, _errorCallback);
    };

    this.get_experiments_by_sampleid_geneid = function (ids, gl, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_experiments_by_sampleid_geneid",
            [ids, gl], 1, _callback, _errorCallback);
    };

    this.get_eo_sampleidlist = function (lst, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_eo_sampleidlist",
            [lst], 1, _callback, _errorCallback);
    };

    this.get_po_sampleidlist = function (lst, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_po_sampleidlist",
            [lst], 1, _callback, _errorCallback);
    };

    this.get_all_po = function (_callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_all_po",
            [], 1, _callback, _errorCallback);
    };

    this.get_all_eo = function (_callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_all_eo",
            [], 1, _callback, _errorCallback);
    };

    this.get_po_descriptions = function (ids, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_po_descriptions",
            [ids], 1, _callback, _errorCallback);
    };

    this.get_eo_descriptions = function (ids, _callback, _errorCallback) {
        return json_call_ajax("PlantExpression.get_eo_descriptions",
            [ids], 1, _callback, _errorCallback);
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




function MOTranslation(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.fids_to_moLocusIds = function (fids, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.fids_to_moLocusIds",
            [fids], 1, _callback, _errorCallback);
    };

    this.proteins_to_moLocusIds = function (proteins, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.proteins_to_moLocusIds",
            [proteins], 1, _callback, _errorCallback);
    };

    this.moLocusIds_to_fids = function (moLocusIds, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.moLocusIds_to_fids",
            [moLocusIds], 1, _callback, _errorCallback);
    };

    this.moLocusIds_to_proteins = function (moLocusIds, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.moLocusIds_to_proteins",
            [moLocusIds], 1, _callback, _errorCallback);
    };

    this.map_to_fid = function (query_sequences, genomeId, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.map_to_fid",
            [query_sequences, genomeId], 2, _callback, _errorCallback);
    };

    this.map_to_fid_fast = function (query_md5s, genomeId, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.map_to_fid_fast",
            [query_md5s, genomeId], 2, _callback, _errorCallback);
    };

    this.moLocusIds_to_fid_in_genome = function (moLocusIds, genomeId, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.moLocusIds_to_fid_in_genome",
            [moLocusIds, genomeId], 2, _callback, _errorCallback);
    };

    this.moLocusIds_to_fid_in_genome_fast = function (moLocusIds, genomeId, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.moLocusIds_to_fid_in_genome_fast",
            [moLocusIds, genomeId], 2, _callback, _errorCallback);
    };

    this.moTaxonomyId_to_genomes = function (moTaxonomyId, _callback, _errorCallback) {
        return json_call_ajax("MOTranslation.moTaxonomyId_to_genomes",
            [moTaxonomyId], 1, _callback, _errorCallback);
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




function fbaModelServices(url) {

    var _url = url;


    this.get_models = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_models", [input]);
//	var resp = json_call_sync("fbaModelServices.get_models", [input]);
        return resp[0];
    }

    this.get_models_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_models", [input], 1, _callback, _error_callback)
    }

    this.get_fbas = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_fbas", [input]);
//	var resp = json_call_sync("fbaModelServices.get_fbas", [input]);
        return resp[0];
    }

    this.get_fbas_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_fbas", [input], 1, _callback, _error_callback)
    }

    this.get_gapfills = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_gapfills", [input]);
//	var resp = json_call_sync("fbaModelServices.get_gapfills", [input]);
        return resp[0];
    }

    this.get_gapfills_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_gapfills", [input], 1, _callback, _error_callback)
    }

    this.get_gapgens = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_gapgens", [input]);
//	var resp = json_call_sync("fbaModelServices.get_gapgens", [input]);
        return resp[0];
    }

    this.get_gapgens_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_gapgens", [input], 1, _callback, _error_callback)
    }

    this.get_reactions = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_reactions", [input]);
//	var resp = json_call_sync("fbaModelServices.get_reactions", [input]);
        return resp[0];
    }

    this.get_reactions_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_reactions", [input], 1, _callback, _error_callback)
    }

    this.get_compounds = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_compounds", [input]);
//	var resp = json_call_sync("fbaModelServices.get_compounds", [input]);
        return resp[0];
    }

    this.get_compounds_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_compounds", [input], 1, _callback, _error_callback)
    }

    this.get_media = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_media", [input]);
//	var resp = json_call_sync("fbaModelServices.get_media", [input]);
        return resp[0];
    }

    this.get_media_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_media", [input], 1, _callback, _error_callback)
    }

    this.get_biochemistry = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_biochemistry", [input]);
//	var resp = json_call_sync("fbaModelServices.get_biochemistry", [input]);
        return resp[0];
    }

    this.get_biochemistry_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_biochemistry", [input], 1, _callback, _error_callback)
    }

    this.get_ETCDiagram = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.get_ETCDiagram", [input]);
//	var resp = json_call_sync("fbaModelServices.get_ETCDiagram", [input]);
        return resp[0];
    }

    this.get_ETCDiagram_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.get_ETCDiagram", [input], 1, _callback, _error_callback)
    }

    this.import_probanno = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.import_probanno", [input]);
//	var resp = json_call_sync("fbaModelServices.import_probanno", [input]);
        return resp[0];
    }

    this.import_probanno_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.import_probanno", [input], 1, _callback, _error_callback)
    }

    this.genome_object_to_workspace = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_object_to_workspace", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_object_to_workspace", [input]);
        return resp[0];
    }

    this.genome_object_to_workspace_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_object_to_workspace", [input], 1, _callback, _error_callback)
    }

    this.genome_to_workspace = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_to_workspace", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_to_workspace", [input]);
        return resp[0];
    }

    this.genome_to_workspace_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_to_workspace", [input], 1, _callback, _error_callback)
    }

    this.add_feature_translation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.add_feature_translation", [input]);
//	var resp = json_call_sync("fbaModelServices.add_feature_translation", [input]);
        return resp[0];
    }

    this.add_feature_translation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.add_feature_translation", [input], 1, _callback, _error_callback)
    }

    this.genome_to_fbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_to_fbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_to_fbamodel", [input]);
        return resp[0];
    }

    this.genome_to_fbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_to_fbamodel", [input], 1, _callback, _error_callback)
    }

    this.import_fbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.import_fbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.import_fbamodel", [input]);
        return resp[0];
    }

    this.import_fbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.import_fbamodel", [input], 1, _callback, _error_callback)
    }

    this.genome_to_probfbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.genome_to_probfbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.genome_to_probfbamodel", [input]);
        return resp[0];
    }

    this.genome_to_probfbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.genome_to_probfbamodel", [input], 1, _callback, _error_callback)
    }

    this.export_fbamodel = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_fbamodel", [input]);
//	var resp = json_call_sync("fbaModelServices.export_fbamodel", [input]);
        return resp[0];
    }

    this.export_fbamodel_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_fbamodel", [input], 1, _callback, _error_callback)
    }

    this.export_object = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_object", [input]);
//	var resp = json_call_sync("fbaModelServices.export_object", [input]);
        return resp[0];
    }

    this.export_object_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_object", [input], 1, _callback, _error_callback)
    }

    this.export_genome = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_genome", [input]);
//	var resp = json_call_sync("fbaModelServices.export_genome", [input]);
        return resp[0];
    }

    this.export_genome_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_genome", [input], 1, _callback, _error_callback)
    }

    this.adjust_model_reaction = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.adjust_model_reaction", [input]);
//	var resp = json_call_sync("fbaModelServices.adjust_model_reaction", [input]);
        return resp[0];
    }

    this.adjust_model_reaction_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.adjust_model_reaction", [input], 1, _callback, _error_callback)
    }

    this.adjust_biomass_reaction = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.adjust_biomass_reaction", [input]);
//	var resp = json_call_sync("fbaModelServices.adjust_biomass_reaction", [input]);
        return resp[0];
    }

    this.adjust_biomass_reaction_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.adjust_biomass_reaction", [input], 1, _callback, _error_callback)
    }

    this.addmedia = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.addmedia", [input]);
//	var resp = json_call_sync("fbaModelServices.addmedia", [input]);
        return resp[0];
    }

    this.addmedia_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.addmedia", [input], 1, _callback, _error_callback)
    }

    this.export_media = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_media", [input]);
//	var resp = json_call_sync("fbaModelServices.export_media", [input]);
        return resp[0];
    }

    this.export_media_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_media", [input], 1, _callback, _error_callback)
    }

    this.runfba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.runfba", [input]);
//	var resp = json_call_sync("fbaModelServices.runfba", [input]);
        return resp[0];
    }

    this.runfba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.runfba", [input], 1, _callback, _error_callback)
    }

    this.export_fba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_fba", [input]);
//	var resp = json_call_sync("fbaModelServices.export_fba", [input]);
        return resp[0];
    }

    this.export_fba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_fba", [input], 1, _callback, _error_callback)
    }

    this.import_phenotypes = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.import_phenotypes", [input]);
//	var resp = json_call_sync("fbaModelServices.import_phenotypes", [input]);
        return resp[0];
    }

    this.import_phenotypes_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.import_phenotypes", [input], 1, _callback, _error_callback)
    }

    this.simulate_phenotypes = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.simulate_phenotypes", [input]);
//	var resp = json_call_sync("fbaModelServices.simulate_phenotypes", [input]);
        return resp[0];
    }

    this.simulate_phenotypes_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.simulate_phenotypes", [input], 1, _callback, _error_callback)
    }

    this.export_phenotypeSimulationSet = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.export_phenotypeSimulationSet", [input]);
//	var resp = json_call_sync("fbaModelServices.export_phenotypeSimulationSet", [input]);
        return resp[0];
    }

    this.export_phenotypeSimulationSet_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.export_phenotypeSimulationSet", [input], 1, _callback, _error_callback)
    }

    this.integrate_reconciliation_solutions = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.integrate_reconciliation_solutions", [input]);
//	var resp = json_call_sync("fbaModelServices.integrate_reconciliation_solutions", [input]);
        return resp[0];
    }

    this.integrate_reconciliation_solutions_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.integrate_reconciliation_solutions", [input], 1, _callback, _error_callback)
    }

    this.queue_runfba = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_runfba", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_runfba", [input]);
        return resp[0];
    }

    this.queue_runfba_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_runfba", [input], 1, _callback, _error_callback)
    }

    this.queue_gapfill_model = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_gapfill_model", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_gapfill_model", [input]);
        return resp[0];
    }

    this.queue_gapfill_model_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_gapfill_model", [input], 1, _callback, _error_callback)
    }

    this.queue_gapgen_model = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_gapgen_model", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_gapgen_model", [input]);
        return resp[0];
    }

    this.queue_gapgen_model_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_gapgen_model", [input], 1, _callback, _error_callback)
    }

    this.queue_wildtype_phenotype_reconciliation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input]);
        return resp[0];
    }

    this.queue_wildtype_phenotype_reconciliation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback)
    }

    this.queue_reconciliation_sensitivity_analysis = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input]);
        return resp[0];
    }

    this.queue_reconciliation_sensitivity_analysis_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input], 1, _callback, _error_callback)
    }

    this.queue_combine_wildtype_phenotype_reconciliation = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input]);
//	var resp = json_call_sync("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input]);
        return resp[0];
    }

    this.queue_combine_wildtype_phenotype_reconciliation_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback)
    }

    this.jobs_done = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.jobs_done", [input]);
//	var resp = json_call_sync("fbaModelServices.jobs_done", [input]);
        return resp[0];
    }

    this.jobs_done_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.jobs_done", [input], 1, _callback, _error_callback)
    }

    this.check_job = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.check_job", [input]);
//	var resp = json_call_sync("fbaModelServices.check_job", [input]);
        return resp[0];
    }

    this.check_job_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.check_job", [input], 1, _callback, _error_callback)
    }

    this.run_job = function(input)
    {
	var resp = json_call_ajax_sync("fbaModelServices.run_job", [input]);
//	var resp = json_call_sync("fbaModelServices.run_job", [input]);
        return resp[0];
    }

    this.run_job_async = function(input, _callback, _error_callback)
    {
	json_call_ajax_async("fbaModelServices.run_job", [input], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function PROM(url, auth, auth_cb) {

    var _url = url;

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "http://kbase.us/services/prom";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_expression_data_by_genome = function (genome_id, workspace_name, token, _callback, _errorCallback) {
        return json_call_ajax("PROM.get_expression_data_by_genome",
            [genome_id, workspace_name, token], 2, _callback, _errorCallback);
    };

    this.create_expression_data_collection = function (workspace_name, token, _callback, _errorCallback) {
        return json_call_ajax("PROM.create_expression_data_collection",
            [workspace_name, token], 2, _callback, _errorCallback);
    };

    this.add_expression_data_to_collection = function (expression_data, expression_data_collecion_id, workspace_name, token, _callback, _errorCallback) {
        return json_call_ajax("PROM.add_expression_data_to_collection",
            [expression_data, expression_data_collecion_id, workspace_name, token], 1, _callback, _errorCallback);
    };

    this.change_expression_data_namespace = function (expression_data_collection_id, new_feature_names, workspace_name, token, _callback, _errorCallback) {
        return json_call_ajax("PROM.change_expression_data_namespace",
            [expression_data_collection_id, new_feature_names, workspace_name, token], 1, _callback, _errorCallback);
    };

    this.get_regulatory_network_by_genome = function (genome_id, workspace_name, token, _callback, _errorCallback) {
        return json_call_ajax("PROM.get_regulatory_network_by_genome",
            [genome_id, workspace_name, token], 2, _callback, _errorCallback);
    };

    this.change_regulatory_network_namespace = function (regulatory_network_id, new_feature_names, workspace_name, token, _callback, _errorCallback) {
        return json_call_ajax("PROM.change_regulatory_network_namespace",
            [regulatory_network_id, new_feature_names, workspace_name, token], 2, _callback, _errorCallback);
    };

    this.create_prom_constraints = function (params, _callback, _errorCallback) {
        return json_call_ajax("PROM.create_prom_constraints",
            [params], 2, _callback, _errorCallback);
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




function KBaseNetworks(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.allDatasets = function (_callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.allDatasets",
            [], 1, _callback, _errorCallback);
    };

    this.allDatasetSources = function (_callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.allDatasetSources",
            [], 1, _callback, _errorCallback);
    };

    this.allNetworkTypes = function (_callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.allNetworkTypes",
            [], 1, _callback, _errorCallback);
    };

    this.datasetSource2Datasets = function (datasetSourceRef, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.datasetSource2Datasets",
            [datasetSourceRef], 1, _callback, _errorCallback);
    };

    this.taxon2Datasets = function (taxon, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.taxon2Datasets",
            [taxon], 1, _callback, _errorCallback);
    };

    this.networkType2Datasets = function (networkType, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.networkType2Datasets",
            [networkType], 1, _callback, _errorCallback);
    };

    this.entity2Datasets = function (entityId, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.entity2Datasets",
            [entityId], 1, _callback, _errorCallback);
    };

    this.buildFirstNeighborNetwork = function (datasetIds, entityIds, edgeTypes, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.buildFirstNeighborNetwork",
            [datasetIds, entityIds, edgeTypes], 1, _callback, _errorCallback);
    };

    this.buildFirstNeighborNetworkLimtedByStrength = function (datasetIds, entityIds, edgeTypes, cutOff, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.buildFirstNeighborNetworkLimtedByStrength",
            [datasetIds, entityIds, edgeTypes, cutOff], 1, _callback, _errorCallback);
    };

    this.buildInternalNetwork = function (datasetIds, geneIds, edgeTypes, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.buildInternalNetwork",
            [datasetIds, geneIds, edgeTypes], 1, _callback, _errorCallback);
    };

    this.buildInternalNetworkLimitedByStrength = function (datasetIds, geneIds, edgeTypes, cutOff, _callback, _errorCallback) {
        return json_call_ajax("KBaseNetworks.buildInternalNetworkLimitedByStrength",
            [datasetIds, geneIds, edgeTypes, cutOff], 1, _callback, _errorCallback);
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




function Phispy(url, auth, auth_cb) {

    var _url = url;

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "http://kbase.us/services/phispy";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_all_training_sets = function (_callback, _errorCallback) {
        return json_call_ajax("Phispy.get_all_training_sets",
            [], 1, _callback, _errorCallback);
    };

    this.find_prophages = function (training_set_id, genomeTO, _callback, _errorCallback) {
        return json_call_ajax("Phispy.find_prophages",
            [training_set_id, genomeTO], 2, _callback, _errorCallback);
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




function workspaceService(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.save_object = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.save_object",
            [params], 1, _callback, _errorCallback);
    };

    this.delete_object = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.delete_object",
            [params], 1, _callback, _errorCallback);
    };

    this.delete_object_permanently = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.delete_object_permanently",
            [params], 1, _callback, _errorCallback);
    };

    this.get_object = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_object",
            [params], 1, _callback, _errorCallback);
    };

    this.get_object_by_ref = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_object_by_ref",
            [params], 1, _callback, _errorCallback);
    };

    this.save_object_by_ref = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.save_object_by_ref",
            [params], 1, _callback, _errorCallback);
    };

    this.get_objectmeta = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_objectmeta",
            [params], 1, _callback, _errorCallback);
    };

    this.get_objectmeta_by_ref = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_objectmeta_by_ref",
            [params], 1, _callback, _errorCallback);
    };

    this.revert_object = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.revert_object",
            [params], 1, _callback, _errorCallback);
    };

    this.copy_object = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.copy_object",
            [params], 1, _callback, _errorCallback);
    };

    this.move_object = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.move_object",
            [params], 1, _callback, _errorCallback);
    };

    this.has_object = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.has_object",
            [params], 1, _callback, _errorCallback);
    };

    this.object_history = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.object_history",
            [params], 1, _callback, _errorCallback);
    };

    this.create_workspace = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.create_workspace",
            [params], 1, _callback, _errorCallback);
    };

    this.get_workspacemeta = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_workspacemeta",
            [params], 1, _callback, _errorCallback);
    };

    this.get_workspacepermissions = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_workspacepermissions",
            [params], 1, _callback, _errorCallback);
    };

    this.delete_workspace = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.delete_workspace",
            [params], 1, _callback, _errorCallback);
    };

    this.clone_workspace = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.clone_workspace",
            [params], 1, _callback, _errorCallback);
    };

    this.list_workspaces = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.list_workspaces",
            [params], 1, _callback, _errorCallback);
    };

    this.list_workspace_objects = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.list_workspace_objects",
            [params], 1, _callback, _errorCallback);
    };

    this.set_global_workspace_permissions = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.set_global_workspace_permissions",
            [params], 1, _callback, _errorCallback);
    };

    this.set_workspace_permissions = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.set_workspace_permissions",
            [params], 1, _callback, _errorCallback);
    };

    this.get_user_settings = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_user_settings",
            [params], 1, _callback, _errorCallback);
    };

    this.set_user_settings = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.set_user_settings",
            [params], 1, _callback, _errorCallback);
    };

    this.queue_job = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.queue_job",
            [params], 1, _callback, _errorCallback);
    };

    this.set_job_status = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.set_job_status",
            [params], 1, _callback, _errorCallback);
    };

    this.get_jobs = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_jobs",
            [params], 1, _callback, _errorCallback);
    };

    this.get_types = function (_callback, _errorCallback) {
        return json_call_ajax("workspaceService.get_types",
            [], 1, _callback, _errorCallback);
    };

    this.add_type = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.add_type",
            [params], 1, _callback, _errorCallback);
    };

    this.remove_type = function (params, _callback, _errorCallback) {
        return json_call_ajax("workspaceService.remove_type",
            [params], 1, _callback, _errorCallback);
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




function ProteinInfo(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.fids_to_operons = function (fids, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fids_to_operons",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_domains = function (fids, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fids_to_domains",
            [fids], 1, _callback, _errorCallback);
    };

    this.domains_to_fids = function (domain_ids, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.domains_to_fids",
            [domain_ids], 1, _callback, _errorCallback);
    };

    this.fids_to_ipr = function (fids, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fids_to_ipr",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_orthologs = function (fids, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fids_to_orthologs",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_ec = function (fids, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fids_to_ec",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_go = function (fids, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fids_to_go",
            [fids], 1, _callback, _errorCallback);
    };

    this.fid_to_neighbors = function (id, thresh, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fid_to_neighbors",
            [id, thresh], 1, _callback, _errorCallback);
    };

    this.fidlist_to_neighbors = function (fids, thresh, _callback, _errorCallback) {
        return json_call_ajax("ProteinInfo.fidlist_to_neighbors",
            [fids, thresh], 1, _callback, _errorCallback);
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




function Ontology(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_goidlist = function (geneIDList, domainList, ecList, _callback, _errorCallback) {
        return json_call_ajax("Ontology.get_goidlist",
            [geneIDList, domainList, ecList], 1, _callback, _errorCallback);
    };

    this.get_go_description = function (goIDList, _callback, _errorCallback) {
        return json_call_ajax("Ontology.get_go_description",
            [goIDList], 1, _callback, _errorCallback);
    };

    this.get_go_enrichment = function (geneIDList, domainList, ecList, type, ontologytype, _callback, _errorCallback) {
        return json_call_ajax("Ontology.get_go_enrichment",
            [geneIDList, domainList, ecList, type, ontologytype], 1, _callback, _errorCallback);
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




function KBaseRegPrecise(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.getRegulomeModelCollections = function (_callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulomeModelCollections",
            [], 1, _callback, _errorCallback);
    };

    this.getRegulomeModelCollection = function (collectionId, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulomeModelCollection",
            [collectionId], 1, _callback, _errorCallback);
    };

    this.getRegulomeModelsByCollectionId = function (collectionId, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulomeModelsByCollectionId",
            [collectionId], 1, _callback, _errorCallback);
    };

    this.getRegulomeModelsByGenomeId = function (genomeId, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulomeModelsByGenomeId",
            [genomeId], 1, _callback, _errorCallback);
    };

    this.getRegulomeModelsBySourceType = function (regulomeSource, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulomeModelsBySourceType",
            [regulomeSource], 1, _callback, _errorCallback);
    };

    this.getRegulomeModel = function (regulomeModelId, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulomeModel",
            [regulomeModelId], 1, _callback, _errorCallback);
    };

    this.getRegulonModelStats = function (regulomeModelId, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulonModelStats",
            [regulomeModelId], 1, _callback, _errorCallback);
    };

    this.getRegulonModel = function (regulonModelId, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getRegulonModel",
            [regulonModelId], 1, _callback, _errorCallback);
    };

    this.buildRegulomeModel = function (param, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.buildRegulomeModel",
            [param], 1, _callback, _errorCallback);
    };

    this.getProcessState = function (processId, _callback, _errorCallback) {
        return json_call_ajax("KBaseRegPrecise.getProcessState",
            [processId], 1, _callback, _errorCallback);
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




function CDMI_API(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.fids_to_annotations = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_annotations",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_functions = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_functions",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_literature = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_literature",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_protein_families = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_protein_families",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_roles = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_roles",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_subsystems = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_subsystems",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_co_occurring_fids = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_co_occurring_fids",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_locations = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_locations",
            [fids], 1, _callback, _errorCallback);
    };

    this.locations_to_fids = function (region_of_dna_strings, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.locations_to_fids",
            [region_of_dna_strings], 1, _callback, _errorCallback);
    };

    this.alleles_to_bp_locs = function (alleles, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.alleles_to_bp_locs",
            [alleles], 1, _callback, _errorCallback);
    };

    this.region_to_fids = function (region_of_dna, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.region_to_fids",
            [region_of_dna], 1, _callback, _errorCallback);
    };

    this.region_to_alleles = function (region_of_dna, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.region_to_alleles",
            [region_of_dna], 1, _callback, _errorCallback);
    };

    this.alleles_to_traits = function (alleles, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.alleles_to_traits",
            [alleles], 1, _callback, _errorCallback);
    };

    this.traits_to_alleles = function (traits, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.traits_to_alleles",
            [traits], 1, _callback, _errorCallback);
    };

    this.ous_with_trait = function (genome, trait, measurement_type, min_value, max_value, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.ous_with_trait",
            [genome, trait, measurement_type, min_value, max_value], 1, _callback, _errorCallback);
    };

    this.locations_to_dna_sequences = function (locations, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.locations_to_dna_sequences",
            [locations], 1, _callback, _errorCallback);
    };

    this.proteins_to_fids = function (proteins, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.proteins_to_fids",
            [proteins], 1, _callback, _errorCallback);
    };

    this.proteins_to_protein_families = function (proteins, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.proteins_to_protein_families",
            [proteins], 1, _callback, _errorCallback);
    };

    this.proteins_to_literature = function (proteins, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.proteins_to_literature",
            [proteins], 1, _callback, _errorCallback);
    };

    this.proteins_to_functions = function (proteins, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.proteins_to_functions",
            [proteins], 1, _callback, _errorCallback);
    };

    this.proteins_to_roles = function (proteins, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.proteins_to_roles",
            [proteins], 1, _callback, _errorCallback);
    };

    this.roles_to_proteins = function (roles, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.roles_to_proteins",
            [roles], 1, _callback, _errorCallback);
    };

    this.roles_to_subsystems = function (roles, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.roles_to_subsystems",
            [roles], 1, _callback, _errorCallback);
    };

    this.roles_to_protein_families = function (roles, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.roles_to_protein_families",
            [roles], 1, _callback, _errorCallback);
    };

    this.fids_to_coexpressed_fids = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_coexpressed_fids",
            [fids], 1, _callback, _errorCallback);
    };

    this.protein_families_to_fids = function (protein_families, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.protein_families_to_fids",
            [protein_families], 1, _callback, _errorCallback);
    };

    this.protein_families_to_proteins = function (protein_families, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.protein_families_to_proteins",
            [protein_families], 1, _callback, _errorCallback);
    };

    this.protein_families_to_functions = function (protein_families, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.protein_families_to_functions",
            [protein_families], 1, _callback, _errorCallback);
    };

    this.protein_families_to_co_occurring_families = function (protein_families, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.protein_families_to_co_occurring_families",
            [protein_families], 1, _callback, _errorCallback);
    };

    this.co_occurrence_evidence = function (pairs_of_fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.co_occurrence_evidence",
            [pairs_of_fids], 1, _callback, _errorCallback);
    };

    this.contigs_to_sequences = function (contigs, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.contigs_to_sequences",
            [contigs], 1, _callback, _errorCallback);
    };

    this.contigs_to_lengths = function (contigs, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.contigs_to_lengths",
            [contigs], 1, _callback, _errorCallback);
    };

    this.contigs_to_md5s = function (contigs, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.contigs_to_md5s",
            [contigs], 1, _callback, _errorCallback);
    };

    this.md5s_to_genomes = function (md5s, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.md5s_to_genomes",
            [md5s], 1, _callback, _errorCallback);
    };

    this.genomes_to_md5s = function (genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.genomes_to_md5s",
            [genomes], 1, _callback, _errorCallback);
    };

    this.genomes_to_contigs = function (genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.genomes_to_contigs",
            [genomes], 1, _callback, _errorCallback);
    };

    this.genomes_to_fids = function (genomes, types_of_fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.genomes_to_fids",
            [genomes, types_of_fids], 1, _callback, _errorCallback);
    };

    this.genomes_to_taxonomies = function (genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.genomes_to_taxonomies",
            [genomes], 1, _callback, _errorCallback);
    };

    this.genomes_to_subsystems = function (genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.genomes_to_subsystems",
            [genomes], 1, _callback, _errorCallback);
    };

    this.subsystems_to_genomes = function (subsystems, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.subsystems_to_genomes",
            [subsystems], 1, _callback, _errorCallback);
    };

    this.subsystems_to_fids = function (subsystems, genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.subsystems_to_fids",
            [subsystems, genomes], 1, _callback, _errorCallback);
    };

    this.subsystems_to_roles = function (subsystems, aux, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.subsystems_to_roles",
            [subsystems, aux], 1, _callback, _errorCallback);
    };

    this.subsystems_to_spreadsheets = function (subsystems, genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.subsystems_to_spreadsheets",
            [subsystems, genomes], 1, _callback, _errorCallback);
    };

    this.all_roles_used_in_models = function (_callback, _errorCallback) {
        return json_call_ajax("CDMI_API.all_roles_used_in_models",
            [], 1, _callback, _errorCallback);
    };

    this.complexes_to_complex_data = function (complexes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.complexes_to_complex_data",
            [complexes], 1, _callback, _errorCallback);
    };

    this.genomes_to_genome_data = function (genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.genomes_to_genome_data",
            [genomes], 1, _callback, _errorCallback);
    };

    this.fids_to_regulon_data = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_regulon_data",
            [fids], 1, _callback, _errorCallback);
    };

    this.regulons_to_fids = function (regulons, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.regulons_to_fids",
            [regulons], 1, _callback, _errorCallback);
    };

    this.fids_to_feature_data = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_feature_data",
            [fids], 1, _callback, _errorCallback);
    };

    this.equiv_sequence_assertions = function (proteins, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.equiv_sequence_assertions",
            [proteins], 1, _callback, _errorCallback);
    };

    this.fids_to_atomic_regulons = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_atomic_regulons",
            [fids], 1, _callback, _errorCallback);
    };

    this.atomic_regulons_to_fids = function (atomic_regulons, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.atomic_regulons_to_fids",
            [atomic_regulons], 1, _callback, _errorCallback);
    };

    this.fids_to_protein_sequences = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_protein_sequences",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_proteins = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_proteins",
            [fids], 1, _callback, _errorCallback);
    };

    this.fids_to_dna_sequences = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_dna_sequences",
            [fids], 1, _callback, _errorCallback);
    };

    this.roles_to_fids = function (roles, genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.roles_to_fids",
            [roles, genomes], 1, _callback, _errorCallback);
    };

    this.reactions_to_complexes = function (reactions, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.reactions_to_complexes",
            [reactions], 1, _callback, _errorCallback);
    };

    this.aliases_to_fids = function (aliases, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.aliases_to_fids",
            [aliases], 1, _callback, _errorCallback);
    };

    this.external_ids_to_fids = function (external_ids, prefix_match, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.external_ids_to_fids",
            [external_ids, prefix_match], 1, _callback, _errorCallback);
    };

    this.reaction_strings = function (reactions, name_parameter, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.reaction_strings",
            [reactions, name_parameter], 1, _callback, _errorCallback);
    };

    this.roles_to_complexes = function (roles, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.roles_to_complexes",
            [roles], 1, _callback, _errorCallback);
    };

    this.complexes_to_roles = function (complexes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.complexes_to_roles",
            [complexes], 1, _callback, _errorCallback);
    };

    this.fids_to_subsystem_data = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_subsystem_data",
            [fids], 1, _callback, _errorCallback);
    };

    this.representative = function (genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.representative",
            [genomes], 1, _callback, _errorCallback);
    };

    this.otu_members = function (genomes, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.otu_members",
            [genomes], 1, _callback, _errorCallback);
    };

    this.otus_to_representatives = function (otus, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.otus_to_representatives",
            [otus], 1, _callback, _errorCallback);
    };

    this.fids_to_genomes = function (fids, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.fids_to_genomes",
            [fids], 1, _callback, _errorCallback);
    };

    this.text_search = function (input, start, count, entities, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.text_search",
            [input, start, count, entities], 1, _callback, _errorCallback);
    };

    this.corresponds = function (fids, genome, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.corresponds",
            [fids, genome], 1, _callback, _errorCallback);
    };

    this.corresponds_from_sequences = function (g1_sequences, g1_locations, g2_sequences, g2_locations, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.corresponds_from_sequences",
            [g1_sequences, g1_locations, g2_sequences, g2_locations], 1, _callback, _errorCallback);
    };

    this.close_genomes = function (seq_set, n, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.close_genomes",
            [seq_set, n], 1, _callback, _errorCallback);
    };

    this.representative_sequences = function (seq_set, rep_seq_parms, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.representative_sequences",
            [seq_set, rep_seq_parms], 2, _callback, _errorCallback);
    };

    this.align_sequences = function (seq_set, align_seq_parms, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.align_sequences",
            [seq_set, align_seq_parms], 1, _callback, _errorCallback);
    };

    this.build_tree = function (alignment, build_tree_parms, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.build_tree",
            [alignment, build_tree_parms], 1, _callback, _errorCallback);
    };

    this.alignment_by_id = function (aln_id, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.alignment_by_id",
            [aln_id], 1, _callback, _errorCallback);
    };

    this.tree_by_id = function (tree_id, _callback, _errorCallback) {
        return json_call_ajax("CDMI_API.tree_by_id",
            [tree_id], 1, _callback, _errorCallback);
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



function CDMI_EntityAPI(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_entity_Alignment = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Alignment",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Alignment = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Alignment",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Alignment = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Alignment",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_AlignmentAttribute = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_AlignmentAttribute",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_AlignmentAttribute = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_AlignmentAttribute",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_AlignmentAttribute = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_AlignmentAttribute",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_AlignmentRow = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_AlignmentRow",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_AlignmentRow = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_AlignmentRow",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_AlignmentRow = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_AlignmentRow",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_AlleleFrequency = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_AlleleFrequency",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_AlleleFrequency = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_AlleleFrequency",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_AlleleFrequency = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_AlleleFrequency",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Annotation = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Annotation",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Annotation = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Annotation",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Annotation = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Annotation",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Assay = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Assay",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Assay = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Assay",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Assay = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Assay",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_AtomicRegulon = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_AtomicRegulon",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_AtomicRegulon = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_AtomicRegulon",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_AtomicRegulon = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_AtomicRegulon",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Attribute = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Attribute",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Attribute = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Attribute",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Attribute = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Attribute",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Biomass = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Biomass",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Biomass = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Biomass",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Biomass = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Biomass",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_CodonUsage = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_CodonUsage",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_CodonUsage = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_CodonUsage",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_CodonUsage = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_CodonUsage",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Complex = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Complex",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Complex = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Complex",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Complex = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Complex",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Compound = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Compound",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Compound = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Compound",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Compound = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Compound",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_CompoundInstance = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_CompoundInstance",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_CompoundInstance = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_CompoundInstance",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_CompoundInstance = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_CompoundInstance",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Contig = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Contig",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Contig = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Contig",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Contig = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Contig",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ContigChunk = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ContigChunk",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ContigChunk = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ContigChunk",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ContigChunk = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ContigChunk",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ContigSequence = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ContigSequence",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ContigSequence = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ContigSequence",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ContigSequence = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ContigSequence",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_CoregulatedSet = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_CoregulatedSet",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_CoregulatedSet = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_CoregulatedSet",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_CoregulatedSet = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_CoregulatedSet",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Diagram = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Diagram",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Diagram = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Diagram",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Diagram = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Diagram",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_EcNumber = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_EcNumber",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_EcNumber = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_EcNumber",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_EcNumber = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_EcNumber",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Environment = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Environment",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Environment = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Environment",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Environment = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Environment",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Experiment = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Experiment",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Experiment = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Experiment",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Experiment = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Experiment",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ExperimentMeta = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentMeta",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ExperimentMeta = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentMeta",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ExperimentMeta = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentMeta",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ExperimentalUnit = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentalUnit",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ExperimentalUnit = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentalUnit",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ExperimentalUnit = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentalUnit",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ExperimentalUnitGroup = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentalUnitGroup",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ExperimentalUnitGroup = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentalUnitGroup",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ExperimentalUnitGroup = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentalUnitGroup",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Family = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Family",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Family = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Family",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Family = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Family",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Feature = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Feature",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Feature = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Feature",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Feature = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Feature",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Genome = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Genome",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Genome = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Genome",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Genome = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Genome",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Locality = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Locality",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Locality = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Locality",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Locality = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Locality",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_LocalizedCompound = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_LocalizedCompound",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_LocalizedCompound = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_LocalizedCompound",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_LocalizedCompound = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_LocalizedCompound",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Location = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Location",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Location = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Location",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Location = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Location",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_LocationInstance = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_LocationInstance",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_LocationInstance = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_LocationInstance",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_LocationInstance = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_LocationInstance",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Measurement = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Measurement",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Measurement = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Measurement",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Measurement = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Measurement",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_MeasurementDescription = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_MeasurementDescription",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_MeasurementDescription = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_MeasurementDescription",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_MeasurementDescription = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_MeasurementDescription",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Media = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Media",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Media = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Media",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Media = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Media",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Model = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Model",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Model = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Model",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Model = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Model",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_OTU = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_OTU",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_OTU = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_OTU",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_OTU = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_OTU",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ObservationalUnit = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ObservationalUnit",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ObservationalUnit = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ObservationalUnit",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ObservationalUnit = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ObservationalUnit",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_PairSet = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_PairSet",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_PairSet = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_PairSet",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_PairSet = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_PairSet",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Pairing = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Pairing",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Pairing = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Pairing",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Pairing = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Pairing",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Parameter = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Parameter",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Parameter = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Parameter",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Parameter = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Parameter",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Person = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Person",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Person = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Person",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Person = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Person",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ProbeSet = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ProbeSet",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ProbeSet = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ProbeSet",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ProbeSet = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ProbeSet",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ProteinSequence = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ProteinSequence",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ProteinSequence = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ProteinSequence",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ProteinSequence = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ProteinSequence",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Protocol = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Protocol",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Protocol = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Protocol",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Protocol = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Protocol",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Publication = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Publication",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Publication = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Publication",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Publication = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Publication",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Reaction = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Reaction",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Reaction = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Reaction",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Reaction = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Reaction",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_ReactionInstance = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_ReactionInstance",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_ReactionInstance = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_ReactionInstance",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_ReactionInstance = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_ReactionInstance",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Role = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Role",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Role = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Role",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Role = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Role",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_SSCell = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_SSCell",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_SSCell = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_SSCell",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_SSCell = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_SSCell",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_SSRow = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_SSRow",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_SSRow = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_SSRow",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_SSRow = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_SSRow",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Scenario = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Scenario",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Scenario = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Scenario",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Scenario = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Scenario",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Source = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Source",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Source = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Source",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Source = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Source",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Strain = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Strain",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Strain = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Strain",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Strain = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Strain",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_StudyExperiment = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_StudyExperiment",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_StudyExperiment = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_StudyExperiment",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_StudyExperiment = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_StudyExperiment",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Subsystem = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Subsystem",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Subsystem = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Subsystem",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Subsystem = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Subsystem",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_SubsystemClass = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_SubsystemClass",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_SubsystemClass = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_SubsystemClass",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_SubsystemClass = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_SubsystemClass",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_TaxonomicGrouping = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_TaxonomicGrouping",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_TaxonomicGrouping = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_TaxonomicGrouping",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_TaxonomicGrouping = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_TaxonomicGrouping",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_TimeSeries = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_TimeSeries",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_TimeSeries = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_TimeSeries",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_TimeSeries = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_TimeSeries",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Trait = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Trait",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Trait = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Trait",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Trait = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Trait",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Tree = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Tree",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Tree = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Tree",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Tree = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Tree",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_TreeAttribute = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_TreeAttribute",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_TreeAttribute = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_TreeAttribute",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_TreeAttribute = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_TreeAttribute",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_TreeNodeAttribute = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_TreeNodeAttribute",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_TreeNodeAttribute = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_TreeNodeAttribute",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_TreeNodeAttribute = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_TreeNodeAttribute",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_entity_Variant = function (ids, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_entity_Variant",
            [ids, fields], 1, _callback, _errorCallback);
    };

    this.query_entity_Variant = function (qry, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.query_entity_Variant",
            [qry, fields], 1, _callback, _errorCallback);
    };

    this.all_entities_Variant = function (start, count, fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.all_entities_Variant",
            [start, count, fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_AffectsLevelOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AffectsLevelOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsAffectedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAffectedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Aligned = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Aligned",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_WasAlignedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasAlignedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_AssertsFunctionFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AssertsFunctionFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasAssertedFunctionFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAssertedFunctionFrom",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_CompoundMeasuredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_CompoundMeasuredBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_MeasuresCompound = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasuresCompound",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Concerns = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Concerns",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsATopicOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsATopicOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ConsistsOfCompounds = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ConsistsOfCompounds",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ComponentOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Contains = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Contains",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsContainedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsContainedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ContainsAlignedDNA = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsAlignedDNA",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsAlignedDNAComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignedDNAComponentOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ContainsAlignedProtein = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsAlignedProtein",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsAlignedProteinComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignedProteinComponentOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ContainsExperimentalUnit = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsExperimentalUnit",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_GroupedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_GroupedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Controls = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Controls",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsControlledUsing = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsControlledUsing",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Describes = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Describes",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsDescribedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDescribedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DescribesAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesAlignment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasAlignmentAttribute = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAlignmentAttribute",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DescribesMeasurement = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesMeasurement",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsDefinedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDefinedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DescribesTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesTree",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasTreeAttribute = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTreeAttribute",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DescribesTreeNode = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesTreeNode",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasNodeAttribute = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasNodeAttribute",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Displays = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Displays",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsDisplayedOn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDisplayedOn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Encompasses = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Encompasses",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsEncompassedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsEncompassedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_EvaluatedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_EvaluatedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IncludesStrain = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesStrain",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_FeatureMeasuredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_FeatureMeasuredBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_MeasuresFeature = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasuresFeature",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Formulated = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Formulated",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_WasFormulatedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasFormulatedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_GeneratedLevelsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_WasGeneratedFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasGeneratedFrom",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_GenomeParentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_GenomeParentOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DerivedFromGenome = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DerivedFromGenome",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasCompoundAliasFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_UsesAliasForCompound = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesAliasForCompound",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasExperimentalUnit = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasExperimentalUnit",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsExperimentalUnitOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExperimentalUnitOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasIndicatedSignalFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IndicatesSignalFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IndicatesSignalFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasKnockoutIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasKnockoutIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_KnockedOutIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_KnockedOutIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasMeasurement = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMeasurement",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsMeasureOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMeasureOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasMember = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMember",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsMemberOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMemberOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasParameter = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasParameter",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_OfEnvironment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OfEnvironment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasParticipant = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasParticipant",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ParticipatesIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasPresenceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasPresenceOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsPresentIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPresentIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasProteinMember = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasProteinMember",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsProteinMemberOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsProteinMemberOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasReactionAliasFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_UsesAliasForReaction = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesAliasForReaction",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasRepresentativeOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRepresentativeOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRepresentedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRepresentedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasRequirementOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRequirementOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsARequirementOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsARequirementOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasResultsIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasResultsIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasResultsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasResultsFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasSection = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasSection",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSectionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSectionOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasStep = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasStep",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsStepOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsStepOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasTrait = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTrait",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Measures = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Measures",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasUnits = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasUnits",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsLocated = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocated",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasUsage = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasUsage",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsUsageOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsageOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasValueFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasValueFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasValueIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasValueIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasVariationIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasVariationIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsVariedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsVariedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Impacts = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Impacts",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsImpactedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsImpactedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ImplementsReaction = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ImplementsReaction",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ImplementedBasedOn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ImplementedBasedOn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Includes = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Includes",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsIncludedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsIncludedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IncludesAdditionalCompounds = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesAdditionalCompounds",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IncludedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IncludesAlignmentRow = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesAlignmentRow",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsAlignmentRowIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignmentRowIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IncludesPart = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesPart",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsPartOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPartOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IndicatedLevelsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasLevelsFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasLevelsFrom",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Involves = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Involves",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsInvolvedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInvolvedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsAnnotatedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAnnotatedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Annotates = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Annotates",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsAssayOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAssayOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsAssayedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAssayedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsClassFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsClassFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsInClass = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInClass",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsCollectionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCollectionOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsCollectedInto = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCollectedInto",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsComposedOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComposedOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComponentOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsComprisedOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComprisedOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Comprises = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Comprises",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsConfiguredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConfiguredBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ReflectsStateOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ReflectsStateOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsConsistentWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConsistentWith",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsConsistentTo = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConsistentTo",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsContextOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsContextOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasEnvironment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasEnvironment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsCoregulatedWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoregulatedWith",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasCoregulationWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasCoregulationWith",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsCoupledTo = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoupledTo",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsCoupledWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoupledWith",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsDeterminedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDeterminedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Determines = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Determines",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsDividedInto = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDividedInto",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsDivisionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDivisionOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsExecutedAs = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExecutedAs",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsExecutionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExecutionOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsExemplarOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExemplarOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasAsExemplar = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsExemplar",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsFamilyFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFamilyFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DeterminesFunctionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsFormedOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFormedOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsFormedInto = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFormedInto",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsFunctionalIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFunctionalIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasFunctional = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasFunctional",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsGroupFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsGroupFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsInGroup = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInGroup",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsImplementedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsImplementedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Implements = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Implements",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsInPair = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInPair",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsPairOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPairOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsInstantiatedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInstantiatedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsInstanceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInstanceOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsLocatedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocatedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsLocusFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocusFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsMeasurementMethodOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMeasurementMethodOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_WasMeasuredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasMeasuredBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsModeledBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModeledBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Models = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Models",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsModifiedToBuildAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModifiedToBuildAlignment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsModificationOfAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModificationOfAlignment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsModifiedToBuildTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModifiedToBuildTree",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsModificationOfTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModificationOfTree",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsOwnerOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsOwnerOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsOwnedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsOwnedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsParticipatingAt = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsParticipatingAt",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ParticipatesAt = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesAt",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsProteinFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsProteinFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Produces = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Produces",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsReagentIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsReagentIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Targets = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Targets",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRealLocationOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRealLocationOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasRealLocationIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRealLocationIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsReferencedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsReferencedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_UsesReference = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesReference",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRegulatedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRegulatedSetOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRelevantFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRelevantFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRelevantTo = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRelevantTo",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRepresentedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRepresentedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DefinedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DefinedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRoleOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRoleOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasRole = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRole",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRowOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRowOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsRoleFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRoleFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSequenceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSequenceOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasAsSequence = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsSequence",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSubInstanceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSubInstanceOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Validates = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Validates",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSummarizedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSummarizedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Summarizes = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Summarizes",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSuperclassOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSuperclassOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSubclassOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSubclassOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsTaxonomyOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTaxonomyOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsInTaxa = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInTaxa",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsTerminusFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTerminusFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasAsTerminus = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsTerminus",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsTriggeredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTriggeredBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Triggers = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Triggers",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsUsedToBuildTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsedToBuildTree",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsBuiltFromAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsBuiltFromAlignment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Manages = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Manages",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsManagedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsManagedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_OperatesIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OperatesIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsUtilizedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUtilizedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_OrdersExperimentalUnit = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OrdersExperimentalUnit",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsTimepointOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTimepointOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Overlaps = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Overlaps",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IncludesPartOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesPartOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ParticipatesAs = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesAs",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsParticipationOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsParticipationOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_PerformedExperiment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PerformedExperiment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_PerformedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PerformedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ProducedResultsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ProducedResultsFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HadResultsProducedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HadResultsProducedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Provided = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Provided",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_WasProvidedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasProvidedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_PublishedExperiment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedExperiment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ExperimentPublishedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ExperimentPublishedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_PublishedProtocol = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedProtocol",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_ProtocolPublishedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ProtocolPublishedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Shows = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Shows",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsShownOn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsShownOn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_StrainParentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_StrainParentOf",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_DerivedFromStrain = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DerivedFromStrain",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Submitted = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Submitted",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_WasSubmittedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasSubmittedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_SupersedesAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SupersedesAlignment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSupersededByAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSupersededByAlignment",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_SupersedesTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SupersedesTree",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsSupersededByTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSupersededByTree",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Treed = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Treed",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsTreeFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTreeFrom",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_UsedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsedIn",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_HasMedia = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMedia",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_Uses = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Uses",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_IsUsedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsedBy",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_UsesCodons = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesCodons",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
    };

    this.get_relationship_AreCodonsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AreCodonsFor",
            [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
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




function Genotype_PhenotypeAPI(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.genomes_with_trait = function (_callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.genomes_with_trait",
            [], 1, _callback, _errorCallback);
    };

    this.get_experiments = function (kb_genome, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.get_experiments",
            [kb_genome], 1, _callback, _errorCallback);
    };

    this.get_traits = function (kb_study_experiment, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.get_traits",
            [kb_study_experiment], 1, _callback, _errorCallback);
    };

    this.traits_to_variations = function (trait, pvaluecutoff, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.traits_to_variations",
            [trait, pvaluecutoff], 1, _callback, _errorCallback);
    };

    this.chromosome_position_from_variation_details = function (variation_details, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.chromosome_position_from_variation_details",
            [variation_details], 1, _callback, _errorCallback);
    };

    this.traits_to_genes = function (trait, pvaluecutoff, distance, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.traits_to_genes",
            [trait, pvaluecutoff, distance], 1, _callback, _errorCallback);
    };

    this.variations_to_genes = function (chromosomal_positions, distance, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.variations_to_genes",
            [chromosomal_positions, distance], 1, _callback, _errorCallback);
    };

    this.find_common_snps = function (trait_list_pvalue, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.find_common_snps",
            [trait_list_pvalue], 1, _callback, _errorCallback);
    };

    this.selected_locations_to_genes = function (trait, pmin, pmax, chromosomal_locations, distance, _callback, _errorCallback) {
        return json_call_ajax("Genotype_PhenotypeAPI.selected_locations_to_genes",
            [trait, pmin, pmax, chromosomal_locations, distance], 1, _callback, _errorCallback);
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




function Tree(url, auth, auth_cb) {

    var _url = url;

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "http://kbase.us/services/tree";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.replace_node_names = function (tree, replacements, _callback, _errorCallback) {
        return json_call_ajax("Tree.replace_node_names",
            [tree, replacements], 1, _callback, _errorCallback);
    };

    this.remove_node_names_and_simplify = function (tree, removal_list, _callback, _errorCallback) {
        return json_call_ajax("Tree.remove_node_names_and_simplify",
            [tree, removal_list], 1, _callback, _errorCallback);
    };

    this.extract_leaf_node_names = function (tree, _callback, _errorCallback) {
        return json_call_ajax("Tree.extract_leaf_node_names",
            [tree], 1, _callback, _errorCallback);
    };

    this.extract_node_names = function (tree, _callback, _errorCallback) {
        return json_call_ajax("Tree.extract_node_names",
            [tree], 1, _callback, _errorCallback);
    };

    this.get_node_count = function (tree, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_node_count",
            [tree], 1, _callback, _errorCallback);
    };

    this.get_leaf_count = function (tree, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_leaf_count",
            [tree], 1, _callback, _errorCallback);
    };

    this.get_tree = function (tree_id, options, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_tree",
            [tree_id, options], 1, _callback, _errorCallback);
    };

    this.get_alignment = function (alignment_id, options, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_alignment",
            [alignment_id, options], 1, _callback, _errorCallback);
    };

    this.get_tree_data = function (tree_ids, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_tree_data",
            [tree_ids], 1, _callback, _errorCallback);
    };

    this.get_alignment_data = function (alignment_ids, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_alignment_data",
            [alignment_ids], 1, _callback, _errorCallback);
    };

    this.get_tree_ids_by_feature = function (feature_ids, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_tree_ids_by_feature",
            [feature_ids], 1, _callback, _errorCallback);
    };

    this.get_tree_ids_by_protein_sequence = function (protein_sequence_ids, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_tree_ids_by_protein_sequence",
            [protein_sequence_ids], 1, _callback, _errorCallback);
    };

    this.get_alignment_ids_by_feature = function (feature_ids, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_alignment_ids_by_feature",
            [feature_ids], 1, _callback, _errorCallback);
    };

    this.get_alignment_ids_by_protein_sequence = function (protein_sequence_ids, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_alignment_ids_by_protein_sequence",
            [protein_sequence_ids], 1, _callback, _errorCallback);
    };

    this.get_tree_ids_by_source_id_pattern = function (pattern, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_tree_ids_by_source_id_pattern",
            [pattern], 1, _callback, _errorCallback);
    };

    this.get_leaf_to_protein_map = function (tree_id, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_leaf_to_protein_map",
            [tree_id], 1, _callback, _errorCallback);
    };

    this.get_leaf_to_feature_map = function (tree_id, _callback, _errorCallback) {
        return json_call_ajax("Tree.get_leaf_to_feature_map",
            [tree_id], 1, _callback, _errorCallback);
    };

    this.compute_abundance_profile = function (abundance_params, _callback, _errorCallback) {
        return json_call_ajax("Tree.compute_abundance_profile",
            [abundance_params], 1, _callback, _errorCallback);
    };

    this.draw_html_tree = function (tree, display_options, _callback, _errorCallback) {
        return json_call_ajax("Tree.draw_html_tree",
            [tree, display_options], 1, _callback, _errorCallback);
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




function GenomeAnnotation(url) {

    var _url = url;


    this.genomeTO_to_reconstructionTO = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.genomeTO_to_reconstructionTO", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.genomeTO_to_reconstructionTO", [genomeTO]);
        return resp[0];
    }

    this.genomeTO_to_reconstructionTO_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.genomeTO_to_reconstructionTO", [genomeTO], 1, _callback, _error_callback)
    }

    this.genomeTO_to_feature_data = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.genomeTO_to_feature_data", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.genomeTO_to_feature_data", [genomeTO]);
        return resp[0];
    }

    this.genomeTO_to_feature_data_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.genomeTO_to_feature_data", [genomeTO], 1, _callback, _error_callback)
    }

    this.reconstructionTO_to_roles = function(reconstructionTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.reconstructionTO_to_roles", [reconstructionTO]);
//	var resp = json_call_sync("GenomeAnnotation.reconstructionTO_to_roles", [reconstructionTO]);
        return resp[0];
    }

    this.reconstructionTO_to_roles_async = function(reconstructionTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.reconstructionTO_to_roles", [reconstructionTO], 1, _callback, _error_callback)
    }

    this.reconstructionTO_to_subsystems = function(reconstructionTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.reconstructionTO_to_subsystems", [reconstructionTO]);
//	var resp = json_call_sync("GenomeAnnotation.reconstructionTO_to_subsystems", [reconstructionTO]);
        return resp[0];
    }

    this.reconstructionTO_to_subsystems_async = function(reconstructionTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.reconstructionTO_to_subsystems", [reconstructionTO], 1, _callback, _error_callback)
    }

    this.annotate_genome = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.annotate_genome", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.annotate_genome", [genomeTO]);
        return resp[0];
    }

    this.annotate_genome_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.annotate_genome", [genomeTO], 1, _callback, _error_callback)
    }

    this.call_RNAs = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.call_RNAs", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.call_RNAs", [genomeTO]);
        return resp[0];
    }

    this.call_RNAs_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.call_RNAs", [genomeTO], 1, _callback, _error_callback)
    }

    this.call_CDSs = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.call_CDSs", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.call_CDSs", [genomeTO]);
        return resp[0];
    }

    this.call_CDSs_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.call_CDSs", [genomeTO], 1, _callback, _error_callback)
    }

    this.find_close_neighbors = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.find_close_neighbors", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.find_close_neighbors", [genomeTO]);
        return resp[0];
    }

    this.find_close_neighbors_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.find_close_neighbors", [genomeTO], 1, _callback, _error_callback)
    }

    this.assign_functions_to_CDSs = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.assign_functions_to_CDSs", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.assign_functions_to_CDSs", [genomeTO]);
        return resp[0];
    }

    this.assign_functions_to_CDSs_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.assign_functions_to_CDSs", [genomeTO], 1, _callback, _error_callback)
    }

    this.annotate_proteins = function(genomeTO)
    {
	var resp = json_call_ajax_sync("GenomeAnnotation.annotate_proteins", [genomeTO]);
//	var resp = json_call_sync("GenomeAnnotation.annotate_proteins", [genomeTO]);
        return resp[0];
    }

    this.annotate_proteins_async = function(genomeTO, _callback, _error_callback)
    {
	json_call_ajax_async("GenomeAnnotation.annotate_proteins", [genomeTO], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}



function CommunitiesAPI(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_abundanceprofile_instance = function (get_abundanceprofile_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_abundanceprofile_instance",
            [get_abundanceprofile_instance_params], 1, _callback, _errorCallback);
    };

    this.get_analysisset_instance = function (get_analysisset_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_analysisset_instance",
            [get_analysisset_instance_params], 1, _callback, _errorCallback);
    };

    this.get_analysisset_setlist = function (get_analysisset_setlist_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_analysisset_setlist",
            [get_analysisset_setlist_params], 1, _callback, _errorCallback);
    };

    this.get_library_query = function (get_library_query_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_library_query",
            [get_library_query_params], 1, _callback, _errorCallback);
    };

    this.get_library_instance = function (get_library_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_library_instance",
            [get_library_instance_params], 1, _callback, _errorCallback);
    };

    this.get_matrix_organism = function (get_matrix_organism_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_matrix_organism",
            [get_matrix_organism_params], 1, _callback, _errorCallback);
    };

    this.get_matrix_function = function (get_matrix_function_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_matrix_function",
            [get_matrix_function_params], 1, _callback, _errorCallback);
    };

    this.get_matrix_feature = function (get_matrix_feature_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_matrix_feature",
            [get_matrix_feature_params], 1, _callback, _errorCallback);
    };

    this.get_metagenome_query = function (get_metagenome_query_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_metagenome_query",
            [get_metagenome_query_params], 1, _callback, _errorCallback);
    };

    this.get_metagenome_instance = function (get_metagenome_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_metagenome_instance",
            [get_metagenome_instance_params], 1, _callback, _errorCallback);
    };

    this.get_metagenome_statistics_instance = function (get_metagenome_statistics_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_metagenome_statistics_instance",
            [get_metagenome_statistics_instance_params], 1, _callback, _errorCallback);
    };

    this.get_project_query = function (get_project_query_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_project_query",
            [get_project_query_params], 1, _callback, _errorCallback);
    };

    this.get_project_instance = function (get_project_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_project_instance",
            [get_project_instance_params], 1, _callback, _errorCallback);
    };

    this.get_sample_query = function (get_sample_query_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_sample_query",
            [get_sample_query_params], 1, _callback, _errorCallback);
    };

    this.get_sample_instance = function (get_sample_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_sample_instance",
            [get_sample_instance_params], 1, _callback, _errorCallback);
    };

    this.get_sequences_md5 = function (get_sequences_md5_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_sequences_md5",
            [get_sequences_md5_params], 1, _callback, _errorCallback);
    };

    this.get_sequences_annotation = function (get_sequences_annotation_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_sequences_annotation",
            [get_sequences_annotation_params], 1, _callback, _errorCallback);
    };

    this.get_sequenceset_instance = function (get_sequenceset_instance_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_sequenceset_instance",
            [get_sequenceset_instance_params], 1, _callback, _errorCallback);
    };

    this.get_sequenceset_setlist = function (get_sequenceset_setlist_params, _callback, _errorCallback) {
        return json_call_ajax("CommunitiesAPI.get_sequenceset_setlist",
            [get_sequenceset_setlist_params], 1, _callback, _errorCallback);
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




function Microbial_Communities_QC(url) {

    var _url = url;


    this.get_drisee_compute = function(get_drisee_compute_params)
    {
	var resp = json_call_ajax_sync("Microbial_Communities_QC.get_drisee_compute", [get_drisee_compute_params]);
//	var resp = json_call_sync("Microbial_Communities_QC.get_drisee_compute", [get_drisee_compute_params]);
        return resp[0];
    }

    this.get_drisee_compute_async = function(get_drisee_compute_params, _callback, _error_callback)
    {
	json_call_ajax_async("Microbial_Communities_QC.get_drisee_compute", [get_drisee_compute_params], 1, _callback, _error_callback)
    }

    this.get_drisee_instance = function(get_drisee_instance_params)
    {
	var resp = json_call_ajax_sync("Microbial_Communities_QC.get_drisee_instance", [get_drisee_instance_params]);
//	var resp = json_call_sync("Microbial_Communities_QC.get_drisee_instance", [get_drisee_instance_params]);
        return resp[0];
    }

    this.get_drisee_instance_async = function(get_drisee_instance_params, _callback, _error_callback)
    {
	json_call_ajax_async("Microbial_Communities_QC.get_drisee_instance", [get_drisee_instance_params], 1, _callback, _error_callback)
    }

    this.get_histogram_compute = function(get_histogram_compute_params)
    {
	var resp = json_call_ajax_sync("Microbial_Communities_QC.get_histogram_compute", [get_histogram_compute_params]);
//	var resp = json_call_sync("Microbial_Communities_QC.get_histogram_compute", [get_histogram_compute_params]);
        return resp[0];
    }

    this.get_histogram_compute_async = function(get_histogram_compute_params, _callback, _error_callback)
    {
	json_call_ajax_async("Microbial_Communities_QC.get_histogram_compute", [get_histogram_compute_params], 1, _callback, _error_callback)
    }

    this.get_histogram_instance = function(get_histogram_instance_params)
    {
	var resp = json_call_ajax_sync("Microbial_Communities_QC.get_histogram_instance", [get_histogram_instance_params]);
//	var resp = json_call_sync("Microbial_Communities_QC.get_histogram_instance", [get_histogram_instance_params]);
        return resp[0];
    }

    this.get_histogram_instance_async = function(get_histogram_instance_params, _callback, _error_callback)
    {
	json_call_ajax_async("Microbial_Communities_QC.get_histogram_instance", [get_histogram_instance_params], 1, _callback, _error_callback)
    }

    this.get_kmer_compute = function(get_kmer_compute_params)
    {
	var resp = json_call_ajax_sync("Microbial_Communities_QC.get_kmer_compute", [get_kmer_compute_params]);
//	var resp = json_call_sync("Microbial_Communities_QC.get_kmer_compute", [get_kmer_compute_params]);
        return resp[0];
    }

    this.get_kmer_compute_async = function(get_kmer_compute_params, _callback, _error_callback)
    {
	json_call_ajax_async("Microbial_Communities_QC.get_kmer_compute", [get_kmer_compute_params], 1, _callback, _error_callback)
    }

    this.get_kmer_instance = function(get_kmer_instance_params)
    {
	var resp = json_call_ajax_sync("Microbial_Communities_QC.get_kmer_instance", [get_kmer_instance_params]);
//	var resp = json_call_sync("Microbial_Communities_QC.get_kmer_instance", [get_kmer_instance_params]);
        return resp[0];
    }

    this.get_kmer_instance_async = function(get_kmer_instance_params, _callback, _error_callback)
    {
	json_call_ajax_async("Microbial_Communities_QC.get_kmer_instance", [get_kmer_instance_params], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
	var rpc = { 'params' : params,
		    'method' : method,
		    'version': "1.1",
	};
	
	var body = JSON.stringify(rpc);
	
	var http = new XMLHttpRequest();
	
	http.open("POST", url, async_flag);
	
	//Send the proper header information along with the request
	http.setRequestHeader("Content-type", "application/json");
	//http.setRequestHeader("Content-length", body.length);
	//http.setRequestHeader("Connection", "close");
	return [http, body];
    }

    /*
     * JSON call using jQuery method.
     */

    function json_call_ajax_sync(method, params)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr) { resp_txt = data; code = xhr.status },
				    error: function(xhr, textStatus, errorThrown) { resp_txt = xhr.responseText, code = xhr.status },
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

        var result;

        if (resp_txt)
        {
	    var resp = JSON.parse(resp_txt);
	    
	    if (code >= 500)
	    {
		throw resp.error;
	    }
	    else
	    {
		return resp.result;
	    }
        }
	else
	{
	    return null;
	}
    }

    function json_call_ajax_async(method, params, num_rets, callback, error_callback)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
	var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    success: function (data, status, xhr)
				{
				    resp = JSON.parse(data);
				    var result = resp["result"];
				    if (num_rets == 1)
				    {
					callback(result[0]);
				    }
				    else
				    {
					callback(result);
				    }
				    
				},
				    error: function(xhr, textStatus, errorThrown)
				{
				    if (xhr.responseText)
				    {
					resp = JSON.parse(xhr.responseText);
					if (error_callback)
					{
					    error_callback(resp.error);
					}
					else
					{
					    throw resp.error;
					}
				    }
				},
                                    data: body,
                                    processData: false,
                                    type: 'POST',
				    });

    }

    function json_call_async(method, params, num_rets, callback)
    {
	var tup = _json_call_prepare(_url, method, params, true);
	var http = tup[0];
	var body = tup[1];
	
	http.onreadystatechange = function() {
	    if (http.readyState == 4 && http.status == 200) {
		var resp_txt = http.responseText;
		var resp = JSON.parse(resp_txt);
		var result = resp["result"];
		if (num_rets == 1)
		{
		    callback(result[0]);
		}
		else
		{
		    callback(result);
		}
	    }
	}
	
	http.send(body);
	
    }
    
    function json_call_sync(method, params)
    {
	var tup = _json_call_prepare(url, method, params, false);
	var http = tup[0];
	var body = tup[1];
	
	http.send(body);
	
	var resp_txt = http.responseText;
	
	var resp = JSON.parse(resp_txt);
	var result = resp["result"];
	    
	return result;
    }
}

