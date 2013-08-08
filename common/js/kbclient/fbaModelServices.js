

function fbaModelServices(url, auth, auth_cb) {

    var _url = url;

    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_models = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_models",
            [input], 1, _callback, _errorCallback);
    };

    this.get_fbas = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_fbas",
            [input], 1, _callback, _errorCallback);
    };

    this.get_gapfills = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_gapfills",
            [input], 1, _callback, _errorCallback);
    };

    this.get_gapgens = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_gapgens",
            [input], 1, _callback, _errorCallback);
    };

    this.get_reactions = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_reactions",
            [input], 1, _callback, _errorCallback);
    };

    this.get_compounds = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_compounds",
            [input], 1, _callback, _errorCallback);
    };

    this.get_media = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_media",
            [input], 1, _callback, _errorCallback);
    };

    this.get_biochemistry = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_biochemistry",
            [input], 1, _callback, _errorCallback);
    };

    this.get_ETCDiagram = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.get_ETCDiagram",
            [input], 1, _callback, _errorCallback);
    };

    this.import_probanno = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.import_probanno",
            [input], 1, _callback, _errorCallback);
    };

    this.genome_object_to_workspace = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.genome_object_to_workspace",
            [input], 1, _callback, _errorCallback);
    };

    this.genome_to_workspace = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.genome_to_workspace",
            [input], 1, _callback, _errorCallback);
    };

    this.add_feature_translation = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.add_feature_translation",
            [input], 1, _callback, _errorCallback);
    };

    this.genome_to_fbamodel = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.genome_to_fbamodel",
            [input], 1, _callback, _errorCallback);
    };

    this.import_fbamodel = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.import_fbamodel",
            [input], 1, _callback, _errorCallback);
    };

    this.genome_to_probfbamodel = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.genome_to_probfbamodel",
            [input], 1, _callback, _errorCallback);
    };

    this.export_fbamodel = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.export_fbamodel",
            [input], 1, _callback, _errorCallback);
    };

    this.export_object = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.export_object",
            [input], 1, _callback, _errorCallback);
    };

    this.export_genome = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.export_genome",
            [input], 1, _callback, _errorCallback);
    };

    this.adjust_model_reaction = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.adjust_model_reaction",
            [input], 1, _callback, _errorCallback);
    };

    this.adjust_biomass_reaction = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.adjust_biomass_reaction",
            [input], 1, _callback, _errorCallback);
    };

    this.addmedia = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.addmedia",
            [input], 1, _callback, _errorCallback);
    };

    this.export_media = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.export_media",
            [input], 1, _callback, _errorCallback);
    };

    this.runfba = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.runfba",
            [input], 1, _callback, _errorCallback);
    };

    this.export_fba = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.export_fba",
            [input], 1, _callback, _errorCallback);
    };

    this.import_phenotypes = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.import_phenotypes",
            [input], 1, _callback, _errorCallback);
    };

    this.simulate_phenotypes = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.simulate_phenotypes",
            [input], 1, _callback, _errorCallback);
    };

    this.export_phenotypeSimulationSet = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.export_phenotypeSimulationSet",
            [input], 1, _callback, _errorCallback);
    };

    this.integrate_reconciliation_solutions = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.integrate_reconciliation_solutions",
            [input], 1, _callback, _errorCallback);
    };

    this.queue_runfba = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.queue_runfba",
            [input], 1, _callback, _errorCallback);
    };

    this.queue_gapfill_model = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.queue_gapfill_model",
            [input], 1, _callback, _errorCallback);
    };

    this.queue_gapgen_model = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.queue_gapgen_model",
            [input], 1, _callback, _errorCallback);
    };

    this.queue_wildtype_phenotype_reconciliation = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.queue_wildtype_phenotype_reconciliation",
            [input], 1, _callback, _errorCallback);
    };

    this.queue_reconciliation_sensitivity_analysis = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.queue_reconciliation_sensitivity_analysis",
            [input], 1, _callback, _errorCallback);
    };

    this.queue_combine_wildtype_phenotype_reconciliation = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation",
            [input], 1, _callback, _errorCallback);
    };

    this.jobs_done = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.jobs_done",
            [input], 1, _callback, _errorCallback);
    };

    this.check_job = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.check_job",
            [input], 1, _callback, _errorCallback);
    };

    this.run_job = function (input, _callback, _errorCallback) {
        return json_call_ajax("fbaModelServices.run_job",
            [input], 1, _callback, _errorCallback);
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


