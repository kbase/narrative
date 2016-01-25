/*! kbase-client-api 2015-01-30 */


function AbstractHandle(url, auth, auth_cb) {

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
        _url = "http://localhost:7109";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.new_handle = function (_callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.new_handle",
        [], 1, _callback, _errorCallback);
};

    this.new_handle_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.new_handle", [], 1, _callback, _error_callback);
    };

    this.localize_handle = function (h1, service_name, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.localize_handle",
        [h1, service_name], 1, _callback, _errorCallback);
};

    this.localize_handle_async = function (h1, service_name, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.localize_handle", [h1, service_name], 1, _callback, _error_callback);
    };

    this.initialize_handle = function (h1, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.initialize_handle",
        [h1], 1, _callback, _errorCallback);
};

    this.initialize_handle_async = function (h1, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.initialize_handle", [h1], 1, _callback, _error_callback);
    };

    this.persist_handle = function (h, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.persist_handle",
        [h], 1, _callback, _errorCallback);
};

    this.persist_handle_async = function (h, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.persist_handle", [h], 1, _callback, _error_callback);
    };

    this.upload = function (infile, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.upload",
        [infile], 1, _callback, _errorCallback);
};

    this.upload_async = function (infile, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.upload", [infile], 1, _callback, _error_callback);
    };

    this.download = function (h, outfile, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.download",
        [h, outfile], 0, _callback, _errorCallback);
};

    this.download_async = function (h, outfile, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.download", [h, outfile], 0, _callback, _error_callback);
    };

    this.upload_metadata = function (h, infile, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.upload_metadata",
        [h, infile], 0, _callback, _errorCallback);
};

    this.upload_metadata_async = function (h, infile, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.upload_metadata", [h, infile], 0, _callback, _error_callback);
    };

    this.download_metadata = function (h, outfile, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.download_metadata",
        [h, outfile], 0, _callback, _errorCallback);
};

    this.download_metadata_async = function (h, outfile, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.download_metadata", [h, outfile], 0, _callback, _error_callback);
    };

    this.ids_to_handles = function (ids, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.ids_to_handles",
        [ids], 1, _callback, _errorCallback);
};

    this.ids_to_handles_async = function (ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.ids_to_handles", [ids], 1, _callback, _error_callback);
    };

    this.hids_to_handles = function (hids, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.hids_to_handles",
        [hids], 1, _callback, _errorCallback);
};

    this.hids_to_handles_async = function (hids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.hids_to_handles", [hids], 1, _callback, _error_callback);
    };

    this.are_readable = function (arg_1, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.are_readable",
        [arg_1], 1, _callback, _errorCallback);
};

    this.are_readable_async = function (arg_1, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.are_readable", [arg_1], 1, _callback, _error_callback);
    };

    this.is_readable = function (id, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.is_readable",
        [id], 1, _callback, _errorCallback);
};

    this.is_readable_async = function (id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.is_readable", [id], 1, _callback, _error_callback);
    };

    this.list_handles = function (_callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.list_handles",
        [], 1, _callback, _errorCallback);
};

    this.list_handles_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.list_handles", [], 1, _callback, _error_callback);
    };

    this.delete_handles = function (l, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.delete_handles",
        [l], 0, _callback, _errorCallback);
};

    this.delete_handles_async = function (l, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.delete_handles", [l], 0, _callback, _error_callback);
    };

    this.give = function (user, perm, h, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.give",
        [user, perm, h], 0, _callback, _errorCallback);
};

    this.give_async = function (user, perm, h, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.give", [user, perm, h], 0, _callback, _error_callback);
    };

    this.ids_to_handles = function (ids, _callback, _errorCallback) {
    return json_call_ajax("AbstractHandle.ids_to_handles",
        [ids], 1, _callback, _errorCallback);
};

    this.ids_to_handles_async = function (ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("AbstractHandle.ids_to_handles", [ids], 1, _callback, _error_callback);
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





function CDMI_API(url, auth, auth_cb) {

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
        _url = "http://kbase.us/services/cdmi_api";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.fids_to_annotations = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_annotations",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_annotations_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_annotations", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_functions = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_functions",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_functions_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_functions", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_literature = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_literature",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_literature_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_literature", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_protein_families = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_protein_families",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_protein_families_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_protein_families", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_roles = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_roles",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_roles_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_roles", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_subsystems = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_subsystems",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_subsystems_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_subsystems", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_co_occurring_fids = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_co_occurring_fids",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_co_occurring_fids_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_co_occurring_fids", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_locations = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_locations",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_locations_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_locations", [fids], 1, _callback, _error_callback);
    };

    this.locations_to_fids = function (region_of_dna_strings, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.locations_to_fids",
        [region_of_dna_strings], 1, _callback, _errorCallback);
};

    this.locations_to_fids_async = function (region_of_dna_strings, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.locations_to_fids", [region_of_dna_strings], 1, _callback, _error_callback);
    };

    this.alleles_to_bp_locs = function (alleles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.alleles_to_bp_locs",
        [alleles], 1, _callback, _errorCallback);
};

    this.alleles_to_bp_locs_async = function (alleles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.alleles_to_bp_locs", [alleles], 1, _callback, _error_callback);
    };

    this.region_to_fids = function (region_of_dna, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.region_to_fids",
        [region_of_dna], 1, _callback, _errorCallback);
};

    this.region_to_fids_async = function (region_of_dna, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.region_to_fids", [region_of_dna], 1, _callback, _error_callback);
    };

    this.region_to_alleles = function (region_of_dna, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.region_to_alleles",
        [region_of_dna], 1, _callback, _errorCallback);
};

    this.region_to_alleles_async = function (region_of_dna, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.region_to_alleles", [region_of_dna], 1, _callback, _error_callback);
    };

    this.alleles_to_traits = function (alleles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.alleles_to_traits",
        [alleles], 1, _callback, _errorCallback);
};

    this.alleles_to_traits_async = function (alleles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.alleles_to_traits", [alleles], 1, _callback, _error_callback);
    };

    this.traits_to_alleles = function (traits, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.traits_to_alleles",
        [traits], 1, _callback, _errorCallback);
};

    this.traits_to_alleles_async = function (traits, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.traits_to_alleles", [traits], 1, _callback, _error_callback);
    };

    this.ous_with_trait = function (genome, trait, measurement_type, min_value, max_value, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.ous_with_trait",
        [genome, trait, measurement_type, min_value, max_value], 1, _callback, _errorCallback);
};

    this.ous_with_trait_async = function (genome, trait, measurement_type, min_value, max_value, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.ous_with_trait", [genome, trait, measurement_type, min_value, max_value], 1, _callback, _error_callback);
    };

    this.locations_to_dna_sequences = function (locations, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.locations_to_dna_sequences",
        [locations], 1, _callback, _errorCallback);
};

    this.locations_to_dna_sequences_async = function (locations, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.locations_to_dna_sequences", [locations], 1, _callback, _error_callback);
    };

    this.proteins_to_fids = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_fids",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_fids_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_fids", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_protein_families = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_protein_families",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_protein_families_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_protein_families", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_literature = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_literature",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_literature_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_literature", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_functions = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_functions",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_functions_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_functions", [proteins], 1, _callback, _error_callback);
    };

    this.proteins_to_roles = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.proteins_to_roles",
        [proteins], 1, _callback, _errorCallback);
};

    this.proteins_to_roles_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.proteins_to_roles", [proteins], 1, _callback, _error_callback);
    };

    this.roles_to_proteins = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_proteins",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_proteins_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_proteins", [roles], 1, _callback, _error_callback);
    };

    this.roles_to_subsystems = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_subsystems",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_subsystems_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_subsystems", [roles], 1, _callback, _error_callback);
    };

    this.roles_to_protein_families = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_protein_families",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_protein_families_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_protein_families", [roles], 1, _callback, _error_callback);
    };

    this.fids_to_coexpressed_fids = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_coexpressed_fids",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_coexpressed_fids_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_coexpressed_fids", [fids], 1, _callback, _error_callback);
    };

    this.protein_families_to_fids = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_fids",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_fids_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_fids", [protein_families], 1, _callback, _error_callback);
    };

    this.protein_families_to_proteins = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_proteins",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_proteins_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_proteins", [protein_families], 1, _callback, _error_callback);
    };

    this.protein_families_to_functions = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_functions",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_functions_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_functions", [protein_families], 1, _callback, _error_callback);
    };

    this.protein_families_to_co_occurring_families = function (protein_families, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.protein_families_to_co_occurring_families",
        [protein_families], 1, _callback, _errorCallback);
};

    this.protein_families_to_co_occurring_families_async = function (protein_families, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.protein_families_to_co_occurring_families", [protein_families], 1, _callback, _error_callback);
    };

    this.co_occurrence_evidence = function (pairs_of_fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.co_occurrence_evidence",
        [pairs_of_fids], 1, _callback, _errorCallback);
};

    this.co_occurrence_evidence_async = function (pairs_of_fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.co_occurrence_evidence", [pairs_of_fids], 1, _callback, _error_callback);
    };

    this.contigs_to_sequences = function (contigs, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.contigs_to_sequences",
        [contigs], 1, _callback, _errorCallback);
};

    this.contigs_to_sequences_async = function (contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.contigs_to_sequences", [contigs], 1, _callback, _error_callback);
    };

    this.contigs_to_lengths = function (contigs, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.contigs_to_lengths",
        [contigs], 1, _callback, _errorCallback);
};

    this.contigs_to_lengths_async = function (contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.contigs_to_lengths", [contigs], 1, _callback, _error_callback);
    };

    this.contigs_to_md5s = function (contigs, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.contigs_to_md5s",
        [contigs], 1, _callback, _errorCallback);
};

    this.contigs_to_md5s_async = function (contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.contigs_to_md5s", [contigs], 1, _callback, _error_callback);
    };

    this.md5s_to_genomes = function (md5s, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.md5s_to_genomes",
        [md5s], 1, _callback, _errorCallback);
};

    this.md5s_to_genomes_async = function (md5s, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.md5s_to_genomes", [md5s], 1, _callback, _error_callback);
    };

    this.genomes_to_md5s = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_md5s",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_md5s_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_md5s", [genomes], 1, _callback, _error_callback);
    };

    this.genomes_to_contigs = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_contigs",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_contigs_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_contigs", [genomes], 1, _callback, _error_callback);
    };

    this.genomes_to_fids = function (genomes, types_of_fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_fids",
        [genomes, types_of_fids], 1, _callback, _errorCallback);
};

    this.genomes_to_fids_async = function (genomes, types_of_fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_fids", [genomes, types_of_fids], 1, _callback, _error_callback);
    };

    this.genomes_to_taxonomies = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_taxonomies",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_taxonomies_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_taxonomies", [genomes], 1, _callback, _error_callback);
    };

    this.genomes_to_subsystems = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_subsystems",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_subsystems_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_subsystems", [genomes], 1, _callback, _error_callback);
    };

    this.subsystems_to_genomes = function (subsystems, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_genomes",
        [subsystems], 1, _callback, _errorCallback);
};

    this.subsystems_to_genomes_async = function (subsystems, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_genomes", [subsystems], 1, _callback, _error_callback);
    };

    this.subsystems_to_fids = function (subsystems, genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_fids",
        [subsystems, genomes], 1, _callback, _errorCallback);
};

    this.subsystems_to_fids_async = function (subsystems, genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_fids", [subsystems, genomes], 1, _callback, _error_callback);
    };

    this.subsystems_to_roles = function (subsystems, aux, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_roles",
        [subsystems, aux], 1, _callback, _errorCallback);
};

    this.subsystems_to_roles_async = function (subsystems, aux, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_roles", [subsystems, aux], 1, _callback, _error_callback);
    };

    this.subsystems_to_spreadsheets = function (subsystems, genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.subsystems_to_spreadsheets",
        [subsystems, genomes], 1, _callback, _errorCallback);
};

    this.subsystems_to_spreadsheets_async = function (subsystems, genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.subsystems_to_spreadsheets", [subsystems, genomes], 1, _callback, _error_callback);
    };

    this.all_roles_used_in_models = function (_callback, _errorCallback) {
    return json_call_ajax("CDMI_API.all_roles_used_in_models",
        [], 1, _callback, _errorCallback);
};

    this.all_roles_used_in_models_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.all_roles_used_in_models", [], 1, _callback, _error_callback);
    };

    this.complexes_to_complex_data = function (complexes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.complexes_to_complex_data",
        [complexes], 1, _callback, _errorCallback);
};

    this.complexes_to_complex_data_async = function (complexes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.complexes_to_complex_data", [complexes], 1, _callback, _error_callback);
    };

    this.genomes_to_genome_data = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.genomes_to_genome_data",
        [genomes], 1, _callback, _errorCallback);
};

    this.genomes_to_genome_data_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.genomes_to_genome_data", [genomes], 1, _callback, _error_callback);
    };

    this.fids_to_regulon_data = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_regulon_data",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_regulon_data_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_regulon_data", [fids], 1, _callback, _error_callback);
    };

    this.regulons_to_fids = function (regulons, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.regulons_to_fids",
        [regulons], 1, _callback, _errorCallback);
};

    this.regulons_to_fids_async = function (regulons, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.regulons_to_fids", [regulons], 1, _callback, _error_callback);
    };

    this.fids_to_feature_data = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_feature_data",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_feature_data_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_feature_data", [fids], 1, _callback, _error_callback);
    };

    this.equiv_sequence_assertions = function (proteins, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.equiv_sequence_assertions",
        [proteins], 1, _callback, _errorCallback);
};

    this.equiv_sequence_assertions_async = function (proteins, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.equiv_sequence_assertions", [proteins], 1, _callback, _error_callback);
    };

    this.fids_to_atomic_regulons = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_atomic_regulons",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_atomic_regulons_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_atomic_regulons", [fids], 1, _callback, _error_callback);
    };

    this.atomic_regulons_to_fids = function (atomic_regulons, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.atomic_regulons_to_fids",
        [atomic_regulons], 1, _callback, _errorCallback);
};

    this.atomic_regulons_to_fids_async = function (atomic_regulons, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.atomic_regulons_to_fids", [atomic_regulons], 1, _callback, _error_callback);
    };

    this.fids_to_protein_sequences = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_protein_sequences",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_protein_sequences_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_protein_sequences", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_proteins = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_proteins",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_proteins_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_proteins", [fids], 1, _callback, _error_callback);
    };

    this.fids_to_dna_sequences = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_dna_sequences",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_dna_sequences_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_dna_sequences", [fids], 1, _callback, _error_callback);
    };

    this.roles_to_fids = function (roles, genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_fids",
        [roles, genomes], 1, _callback, _errorCallback);
};

    this.roles_to_fids_async = function (roles, genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_fids", [roles, genomes], 1, _callback, _error_callback);
    };

    this.reactions_to_complexes = function (reactions, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.reactions_to_complexes",
        [reactions], 1, _callback, _errorCallback);
};

    this.reactions_to_complexes_async = function (reactions, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.reactions_to_complexes", [reactions], 1, _callback, _error_callback);
    };

    this.aliases_to_fids = function (aliases, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.aliases_to_fids",
        [aliases], 1, _callback, _errorCallback);
};

    this.aliases_to_fids_async = function (aliases, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.aliases_to_fids", [aliases], 1, _callback, _error_callback);
    };

    this.aliases_to_fids_by_source = function (aliases, source, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.aliases_to_fids_by_source",
        [aliases, source], 1, _callback, _errorCallback);
};

    this.aliases_to_fids_by_source_async = function (aliases, source, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.aliases_to_fids_by_source", [aliases, source], 1, _callback, _error_callback);
    };

    this.source_ids_to_fids = function (aliases, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.source_ids_to_fids",
        [aliases], 1, _callback, _errorCallback);
};

    this.source_ids_to_fids_async = function (aliases, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.source_ids_to_fids", [aliases], 1, _callback, _error_callback);
    };

    this.external_ids_to_fids = function (external_ids, prefix_match, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.external_ids_to_fids",
        [external_ids, prefix_match], 1, _callback, _errorCallback);
};

    this.external_ids_to_fids_async = function (external_ids, prefix_match, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.external_ids_to_fids", [external_ids, prefix_match], 1, _callback, _error_callback);
    };

    this.reaction_strings = function (reactions, name_parameter, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.reaction_strings",
        [reactions, name_parameter], 1, _callback, _errorCallback);
};

    this.reaction_strings_async = function (reactions, name_parameter, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.reaction_strings", [reactions, name_parameter], 1, _callback, _error_callback);
    };

    this.roles_to_complexes = function (roles, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.roles_to_complexes",
        [roles], 1, _callback, _errorCallback);
};

    this.roles_to_complexes_async = function (roles, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.roles_to_complexes", [roles], 1, _callback, _error_callback);
    };

    this.complexes_to_roles = function (complexes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.complexes_to_roles",
        [complexes], 1, _callback, _errorCallback);
};

    this.complexes_to_roles_async = function (complexes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.complexes_to_roles", [complexes], 1, _callback, _error_callback);
    };

    this.fids_to_subsystem_data = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_subsystem_data",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_subsystem_data_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_subsystem_data", [fids], 1, _callback, _error_callback);
    };

    this.representative = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.representative",
        [genomes], 1, _callback, _errorCallback);
};

    this.representative_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.representative", [genomes], 1, _callback, _error_callback);
    };

    this.otu_members = function (genomes, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.otu_members",
        [genomes], 1, _callback, _errorCallback);
};

    this.otu_members_async = function (genomes, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.otu_members", [genomes], 1, _callback, _error_callback);
    };

    this.otus_to_representatives = function (otus, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.otus_to_representatives",
        [otus], 1, _callback, _errorCallback);
};

    this.otus_to_representatives_async = function (otus, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.otus_to_representatives", [otus], 1, _callback, _error_callback);
    };

    this.fids_to_genomes = function (fids, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.fids_to_genomes",
        [fids], 1, _callback, _errorCallback);
};

    this.fids_to_genomes_async = function (fids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.fids_to_genomes", [fids], 1, _callback, _error_callback);
    };

    this.text_search = function (input, start, count, entities, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.text_search",
        [input, start, count, entities], 1, _callback, _errorCallback);
};

    this.text_search_async = function (input, start, count, entities, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.text_search", [input, start, count, entities], 1, _callback, _error_callback);
    };

    this.corresponds = function (fids, genome, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.corresponds",
        [fids, genome], 1, _callback, _errorCallback);
};

    this.corresponds_async = function (fids, genome, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.corresponds", [fids, genome], 1, _callback, _error_callback);
    };

    this.corresponds_from_sequences = function (g1_sequences, g1_locations, g2_sequences, g2_locations, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.corresponds_from_sequences",
        [g1_sequences, g1_locations, g2_sequences, g2_locations], 1, _callback, _errorCallback);
};

    this.corresponds_from_sequences_async = function (g1_sequences, g1_locations, g2_sequences, g2_locations, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.corresponds_from_sequences", [g1_sequences, g1_locations, g2_sequences, g2_locations], 1, _callback, _error_callback);
    };

    this.close_genomes = function (seq_set, n, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.close_genomes",
        [seq_set, n], 1, _callback, _errorCallback);
};

    this.close_genomes_async = function (seq_set, n, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.close_genomes", [seq_set, n], 1, _callback, _error_callback);
    };

    this.representative_sequences = function (seq_set, rep_seq_parms, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.representative_sequences",
        [seq_set, rep_seq_parms], 2, _callback, _errorCallback);
};

    this.representative_sequences_async = function (seq_set, rep_seq_parms, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.representative_sequences", [seq_set, rep_seq_parms], 2, _callback, _error_callback);
    };

    this.align_sequences = function (seq_set, align_seq_parms, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.align_sequences",
        [seq_set, align_seq_parms], 1, _callback, _errorCallback);
};

    this.align_sequences_async = function (seq_set, align_seq_parms, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.align_sequences", [seq_set, align_seq_parms], 1, _callback, _error_callback);
    };

    this.build_tree = function (alignment, build_tree_parms, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.build_tree",
        [alignment, build_tree_parms], 1, _callback, _errorCallback);
};

    this.build_tree_async = function (alignment, build_tree_parms, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.build_tree", [alignment, build_tree_parms], 1, _callback, _error_callback);
    };

    this.alignment_by_id = function (aln_id, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.alignment_by_id",
        [aln_id], 1, _callback, _errorCallback);
};

    this.alignment_by_id_async = function (aln_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.alignment_by_id", [aln_id], 1, _callback, _error_callback);
    };

    this.tree_by_id = function (tree_id, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.tree_by_id",
        [tree_id], 1, _callback, _errorCallback);
};

    this.tree_by_id_async = function (tree_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.tree_by_id", [tree_id], 1, _callback, _error_callback);
    };

    this.all_entities = function (_callback, _errorCallback) {
    return json_call_ajax("CDMI_API.all_entities",
        [], 1, _callback, _errorCallback);
};

    this.all_entities_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.all_entities", [], 1, _callback, _error_callback);
    };

    this.all_relationships = function (_callback, _errorCallback) {
    return json_call_ajax("CDMI_API.all_relationships",
        [], 1, _callback, _errorCallback);
};

    this.all_relationships_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.all_relationships", [], 1, _callback, _error_callback);
    };

    this.get_entity = function (entity_names, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.get_entity",
        [entity_names], 1, _callback, _errorCallback);
};

    this.get_entity_async = function (entity_names, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.get_entity", [entity_names], 1, _callback, _error_callback);
    };

    this.get_relationship = function (relationship_names, _callback, _errorCallback) {
    return json_call_ajax("CDMI_API.get_relationship",
        [relationship_names], 1, _callback, _errorCallback);
};

    this.get_relationship_async = function (relationship_names, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_API.get_relationship", [relationship_names], 1, _callback, _error_callback);
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



function CDMI_EntityAPI(url, auth, auth_cb) {

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
        _url = "http://kbase.us/services/cdmi_api";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_all = function (object_names, filter_clause, parameters, fields, count, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_all",
        [object_names, filter_clause, parameters, fields, count], 1, _callback, _errorCallback);
};

    this.get_all_async = function (object_names, filter_clause, parameters, fields, count, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_all", [object_names, filter_clause, parameters, fields, count], 1, _callback, _error_callback);
    };

    this.get_entity_Alignment = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Alignment",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Alignment_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Alignment", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Alignment = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Alignment",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Alignment_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Alignment", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Alignment = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Alignment",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Alignment_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Alignment", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_AlignmentAttribute = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_AlignmentAttribute",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_AlignmentAttribute_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_AlignmentAttribute", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_AlignmentAttribute = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_AlignmentAttribute",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_AlignmentAttribute_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_AlignmentAttribute", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_AlignmentAttribute = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_AlignmentAttribute",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_AlignmentAttribute_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_AlignmentAttribute", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_AlignmentRow = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_AlignmentRow",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_AlignmentRow_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_AlignmentRow", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_AlignmentRow = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_AlignmentRow",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_AlignmentRow_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_AlignmentRow", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_AlignmentRow = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_AlignmentRow",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_AlignmentRow_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_AlignmentRow", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_AlleleFrequency = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_AlleleFrequency",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_AlleleFrequency_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_AlleleFrequency", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_AlleleFrequency = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_AlleleFrequency",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_AlleleFrequency_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_AlleleFrequency", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_AlleleFrequency = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_AlleleFrequency",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_AlleleFrequency_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_AlleleFrequency", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Annotation = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Annotation",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Annotation_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Annotation", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Annotation = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Annotation",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Annotation_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Annotation", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Annotation = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Annotation",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Annotation_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Annotation", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Assay = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Assay",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Assay_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Assay", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Assay = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Assay",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Assay_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Assay", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Assay = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Assay",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Assay_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Assay", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Association = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Association",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Association_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Association", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Association = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Association",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Association_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Association", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Association = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Association",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Association_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Association", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_AssociationDataset = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_AssociationDataset",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_AssociationDataset_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_AssociationDataset", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_AssociationDataset = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_AssociationDataset",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_AssociationDataset_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_AssociationDataset", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_AssociationDataset = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_AssociationDataset",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_AssociationDataset_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_AssociationDataset", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_AssociationDetectionType = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_AssociationDetectionType",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_AssociationDetectionType_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_AssociationDetectionType", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_AssociationDetectionType = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_AssociationDetectionType",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_AssociationDetectionType_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_AssociationDetectionType", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_AssociationDetectionType = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_AssociationDetectionType",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_AssociationDetectionType_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_AssociationDetectionType", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_AtomicRegulon = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_AtomicRegulon",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_AtomicRegulon_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_AtomicRegulon", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_AtomicRegulon = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_AtomicRegulon",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_AtomicRegulon_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_AtomicRegulon", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_AtomicRegulon = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_AtomicRegulon",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_AtomicRegulon_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_AtomicRegulon", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Attribute = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Attribute",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Attribute_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Attribute", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Attribute = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Attribute",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Attribute_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Attribute", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Attribute = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Attribute",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Attribute_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Attribute", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Biomass = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Biomass",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Biomass_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Biomass", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Biomass = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Biomass",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Biomass_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Biomass", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Biomass = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Biomass",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Biomass_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Biomass", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_CodonUsage = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_CodonUsage",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_CodonUsage_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_CodonUsage", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_CodonUsage = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_CodonUsage",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_CodonUsage_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_CodonUsage", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_CodonUsage = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_CodonUsage",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_CodonUsage_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_CodonUsage", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Complex = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Complex",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Complex_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Complex", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Complex = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Complex",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Complex_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Complex", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Complex = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Complex",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Complex_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Complex", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Compound = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Compound",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Compound_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Compound", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Compound = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Compound",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Compound_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Compound", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Compound = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Compound",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Compound_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Compound", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_CompoundInstance = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_CompoundInstance",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_CompoundInstance_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_CompoundInstance", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_CompoundInstance = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_CompoundInstance",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_CompoundInstance_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_CompoundInstance", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_CompoundInstance = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_CompoundInstance",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_CompoundInstance_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_CompoundInstance", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ConservedDomainModel = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ConservedDomainModel",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ConservedDomainModel_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ConservedDomainModel", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ConservedDomainModel = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ConservedDomainModel",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ConservedDomainModel_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ConservedDomainModel", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ConservedDomainModel = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ConservedDomainModel",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ConservedDomainModel_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ConservedDomainModel", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Contig = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Contig",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Contig_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Contig", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Contig = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Contig",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Contig_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Contig", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Contig = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Contig",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Contig_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Contig", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ContigChunk = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ContigChunk",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ContigChunk_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ContigChunk", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ContigChunk = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ContigChunk",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ContigChunk_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ContigChunk", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ContigChunk = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ContigChunk",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ContigChunk_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ContigChunk", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ContigSequence = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ContigSequence",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ContigSequence_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ContigSequence", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ContigSequence = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ContigSequence",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ContigSequence_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ContigSequence", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ContigSequence = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ContigSequence",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ContigSequence_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ContigSequence", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_CoregulatedSet = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_CoregulatedSet",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_CoregulatedSet_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_CoregulatedSet", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_CoregulatedSet = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_CoregulatedSet",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_CoregulatedSet_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_CoregulatedSet", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_CoregulatedSet = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_CoregulatedSet",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_CoregulatedSet_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_CoregulatedSet", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Diagram = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Diagram",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Diagram_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Diagram", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Diagram = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Diagram",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Diagram_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Diagram", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Diagram = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Diagram",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Diagram_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Diagram", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_EcNumber = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_EcNumber",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_EcNumber_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_EcNumber", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_EcNumber = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_EcNumber",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_EcNumber_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_EcNumber", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_EcNumber = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_EcNumber",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_EcNumber_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_EcNumber", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Effector = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Effector",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Effector_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Effector", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Effector = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Effector",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Effector_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Effector", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Effector = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Effector",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Effector_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Effector", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Environment = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Environment",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Environment_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Environment", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Environment = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Environment",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Environment_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Environment", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Environment = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Environment",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Environment_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Environment", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Experiment = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Experiment",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Experiment_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Experiment", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Experiment = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Experiment",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Experiment_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Experiment", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Experiment = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Experiment",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Experiment_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Experiment", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ExperimentMeta = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentMeta",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ExperimentMeta_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentMeta", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ExperimentMeta = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentMeta",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ExperimentMeta_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentMeta", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ExperimentMeta = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentMeta",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ExperimentMeta_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentMeta", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ExperimentalUnit = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentalUnit",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ExperimentalUnit_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentalUnit", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ExperimentalUnit = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentalUnit",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ExperimentalUnit_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentalUnit", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ExperimentalUnit = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentalUnit",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ExperimentalUnit_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentalUnit", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ExperimentalUnitGroup = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentalUnitGroup",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ExperimentalUnitGroup_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ExperimentalUnitGroup", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ExperimentalUnitGroup = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentalUnitGroup",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ExperimentalUnitGroup_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ExperimentalUnitGroup", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ExperimentalUnitGroup = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentalUnitGroup",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ExperimentalUnitGroup_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ExperimentalUnitGroup", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Family = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Family",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Family_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Family", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Family = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Family",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Family_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Family", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Family = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Family",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Family_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Family", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Feature = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Feature",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Feature_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Feature", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Feature = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Feature",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Feature_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Feature", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Feature = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Feature",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Feature_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Feature", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Genome = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Genome",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Genome_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Genome", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Genome = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Genome",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Genome_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Genome", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Genome = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Genome",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Genome_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Genome", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Locality = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Locality",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Locality_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Locality", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Locality = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Locality",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Locality_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Locality", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Locality = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Locality",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Locality_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Locality", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_LocalizedCompound = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_LocalizedCompound",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_LocalizedCompound_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_LocalizedCompound", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_LocalizedCompound = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_LocalizedCompound",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_LocalizedCompound_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_LocalizedCompound", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_LocalizedCompound = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_LocalizedCompound",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_LocalizedCompound_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_LocalizedCompound", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Location = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Location",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Location_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Location", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Location = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Location",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Location_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Location", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Location = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Location",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Location_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Location", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_LocationInstance = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_LocationInstance",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_LocationInstance_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_LocationInstance", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_LocationInstance = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_LocationInstance",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_LocationInstance_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_LocationInstance", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_LocationInstance = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_LocationInstance",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_LocationInstance_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_LocationInstance", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Measurement = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Measurement",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Measurement_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Measurement", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Measurement = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Measurement",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Measurement_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Measurement", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Measurement = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Measurement",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Measurement_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Measurement", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_MeasurementDescription = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_MeasurementDescription",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_MeasurementDescription_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_MeasurementDescription", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_MeasurementDescription = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_MeasurementDescription",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_MeasurementDescription_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_MeasurementDescription", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_MeasurementDescription = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_MeasurementDescription",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_MeasurementDescription_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_MeasurementDescription", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Media = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Media",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Media_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Media", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Media = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Media",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Media_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Media", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Media = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Media",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Media_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Media", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Model = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Model",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Model_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Model", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Model = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Model",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Model_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Model", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Model = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Model",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Model_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Model", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_OTU = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_OTU",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_OTU_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_OTU", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_OTU = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_OTU",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_OTU_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_OTU", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_OTU = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_OTU",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_OTU_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_OTU", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ObservationalUnit = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ObservationalUnit",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ObservationalUnit_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ObservationalUnit", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ObservationalUnit = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ObservationalUnit",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ObservationalUnit_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ObservationalUnit", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ObservationalUnit = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ObservationalUnit",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ObservationalUnit_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ObservationalUnit", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Ontology = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Ontology",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Ontology_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Ontology", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Ontology = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Ontology",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Ontology_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Ontology", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Ontology = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Ontology",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Ontology_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Ontology", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Operon = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Operon",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Operon_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Operon", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Operon = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Operon",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Operon_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Operon", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Operon = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Operon",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Operon_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Operon", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_PairSet = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_PairSet",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_PairSet_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_PairSet", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_PairSet = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_PairSet",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_PairSet_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_PairSet", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_PairSet = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_PairSet",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_PairSet_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_PairSet", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Pairing = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Pairing",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Pairing_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Pairing", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Pairing = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Pairing",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Pairing_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Pairing", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Pairing = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Pairing",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Pairing_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Pairing", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Parameter = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Parameter",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Parameter_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Parameter", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Parameter = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Parameter",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Parameter_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Parameter", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Parameter = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Parameter",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Parameter_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Parameter", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Person = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Person",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Person_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Person", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Person = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Person",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Person_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Person", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Person = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Person",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Person_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Person", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Platform = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Platform",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Platform_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Platform", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Platform = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Platform",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Platform_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Platform", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Platform = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Platform",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Platform_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Platform", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ProbeSet = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ProbeSet",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ProbeSet_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ProbeSet", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ProbeSet = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ProbeSet",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ProbeSet_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ProbeSet", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ProbeSet = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ProbeSet",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ProbeSet_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ProbeSet", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ProteinSequence = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ProteinSequence",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ProteinSequence_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ProteinSequence", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ProteinSequence = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ProteinSequence",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ProteinSequence_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ProteinSequence", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ProteinSequence = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ProteinSequence",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ProteinSequence_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ProteinSequence", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Protocol = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Protocol",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Protocol_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Protocol", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Protocol = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Protocol",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Protocol_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Protocol", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Protocol = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Protocol",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Protocol_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Protocol", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Publication = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Publication",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Publication_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Publication", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Publication = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Publication",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Publication_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Publication", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Publication = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Publication",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Publication_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Publication", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Reaction = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Reaction",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Reaction_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Reaction", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Reaction = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Reaction",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Reaction_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Reaction", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Reaction = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Reaction",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Reaction_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Reaction", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ReactionInstance = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ReactionInstance",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ReactionInstance_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ReactionInstance", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ReactionInstance = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ReactionInstance",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ReactionInstance_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ReactionInstance", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ReactionInstance = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ReactionInstance",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ReactionInstance_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ReactionInstance", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Regulator = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Regulator",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Regulator_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Regulator", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Regulator = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Regulator",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Regulator_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Regulator", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Regulator = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Regulator",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Regulator_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Regulator", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Regulog = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Regulog",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Regulog_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Regulog", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Regulog = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Regulog",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Regulog_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Regulog", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Regulog = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Regulog",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Regulog_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Regulog", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_RegulogCollection = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_RegulogCollection",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_RegulogCollection_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_RegulogCollection", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_RegulogCollection = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_RegulogCollection",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_RegulogCollection_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_RegulogCollection", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_RegulogCollection = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_RegulogCollection",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_RegulogCollection_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_RegulogCollection", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Regulome = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Regulome",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Regulome_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Regulome", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Regulome = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Regulome",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Regulome_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Regulome", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Regulome = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Regulome",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Regulome_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Regulome", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Regulon = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Regulon",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Regulon_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Regulon", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Regulon = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Regulon",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Regulon_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Regulon", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Regulon = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Regulon",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Regulon_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Regulon", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_ReplicateGroup = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_ReplicateGroup",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_ReplicateGroup_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_ReplicateGroup", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_ReplicateGroup = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_ReplicateGroup",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_ReplicateGroup_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_ReplicateGroup", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_ReplicateGroup = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_ReplicateGroup",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_ReplicateGroup_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_ReplicateGroup", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Role = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Role",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Role_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Role", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Role = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Role",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Role_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Role", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Role = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Role",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Role_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Role", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_SSCell = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_SSCell",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_SSCell_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_SSCell", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_SSCell = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_SSCell",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_SSCell_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_SSCell", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_SSCell = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_SSCell",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_SSCell_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_SSCell", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_SSRow = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_SSRow",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_SSRow_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_SSRow", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_SSRow = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_SSRow",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_SSRow_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_SSRow", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_SSRow = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_SSRow",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_SSRow_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_SSRow", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Sample = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Sample",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Sample_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Sample", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Sample = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Sample",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Sample_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Sample", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Sample = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Sample",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Sample_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Sample", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_SampleAnnotation = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_SampleAnnotation",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_SampleAnnotation_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_SampleAnnotation", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_SampleAnnotation = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_SampleAnnotation",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_SampleAnnotation_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_SampleAnnotation", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_SampleAnnotation = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_SampleAnnotation",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_SampleAnnotation_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_SampleAnnotation", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Scenario = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Scenario",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Scenario_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Scenario", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Scenario = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Scenario",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Scenario_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Scenario", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Scenario = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Scenario",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Scenario_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Scenario", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Series = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Series",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Series_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Series", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Series = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Series",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Series_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Series", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Series = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Series",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Series_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Series", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Source = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Source",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Source_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Source", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Source = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Source",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Source_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Source", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Source = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Source",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Source_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Source", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Strain = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Strain",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Strain_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Strain", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Strain = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Strain",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Strain_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Strain", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Strain = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Strain",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Strain_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Strain", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_StudyExperiment = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_StudyExperiment",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_StudyExperiment_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_StudyExperiment", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_StudyExperiment = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_StudyExperiment",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_StudyExperiment_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_StudyExperiment", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_StudyExperiment = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_StudyExperiment",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_StudyExperiment_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_StudyExperiment", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Subsystem = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Subsystem",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Subsystem_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Subsystem", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Subsystem = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Subsystem",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Subsystem_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Subsystem", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Subsystem = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Subsystem",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Subsystem_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Subsystem", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_SubsystemClass = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_SubsystemClass",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_SubsystemClass_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_SubsystemClass", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_SubsystemClass = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_SubsystemClass",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_SubsystemClass_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_SubsystemClass", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_SubsystemClass = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_SubsystemClass",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_SubsystemClass_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_SubsystemClass", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_TaxonomicGrouping = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_TaxonomicGrouping",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_TaxonomicGrouping_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_TaxonomicGrouping", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_TaxonomicGrouping = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_TaxonomicGrouping",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_TaxonomicGrouping_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_TaxonomicGrouping", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_TaxonomicGrouping = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_TaxonomicGrouping",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_TaxonomicGrouping_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_TaxonomicGrouping", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_TimeSeries = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_TimeSeries",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_TimeSeries_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_TimeSeries", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_TimeSeries = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_TimeSeries",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_TimeSeries_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_TimeSeries", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_TimeSeries = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_TimeSeries",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_TimeSeries_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_TimeSeries", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Trait = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Trait",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Trait_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Trait", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Trait = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Trait",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Trait_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Trait", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Trait = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Trait",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Trait_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Trait", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Tree = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Tree",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Tree_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Tree", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Tree = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Tree",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Tree_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Tree", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Tree = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Tree",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Tree_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Tree", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_TreeAttribute = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_TreeAttribute",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_TreeAttribute_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_TreeAttribute", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_TreeAttribute = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_TreeAttribute",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_TreeAttribute_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_TreeAttribute", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_TreeAttribute = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_TreeAttribute",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_TreeAttribute_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_TreeAttribute", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_TreeNodeAttribute = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_TreeNodeAttribute",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_TreeNodeAttribute_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_TreeNodeAttribute", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_TreeNodeAttribute = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_TreeNodeAttribute",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_TreeNodeAttribute_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_TreeNodeAttribute", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_TreeNodeAttribute = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_TreeNodeAttribute",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_TreeNodeAttribute_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_TreeNodeAttribute", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_entity_Variant = function (ids, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_entity_Variant",
        [ids, fields], 1, _callback, _errorCallback);
};

    this.get_entity_Variant_async = function (ids, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_entity_Variant", [ids, fields], 1, _callback, _error_callback);
    };

    this.query_entity_Variant = function (qry, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.query_entity_Variant",
        [qry, fields], 1, _callback, _errorCallback);
};

    this.query_entity_Variant_async = function (qry, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.query_entity_Variant", [qry, fields], 1, _callback, _error_callback);
    };

    this.all_entities_Variant = function (start, count, fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.all_entities_Variant",
        [start, count, fields], 1, _callback, _errorCallback);
};

    this.all_entities_Variant_async = function (start, count, fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.all_entities_Variant", [start, count, fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AffectsLevelOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AffectsLevelOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AffectsLevelOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AffectsLevelOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsAffectedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAffectedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsAffectedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAffectedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Aligned = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Aligned",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Aligned_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Aligned", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_WasAlignedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_WasAlignedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_WasAlignedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasAlignedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AssertsFunctionFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AssertsFunctionFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AssertsFunctionFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AssertsFunctionFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasAssertedFunctionFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAssertedFunctionFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasAssertedFunctionFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAssertedFunctionFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AssociationFeature = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AssociationFeature",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AssociationFeature_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AssociationFeature", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_FeatureInteractsIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_FeatureInteractsIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_FeatureInteractsIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_FeatureInteractsIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_CompoundMeasuredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_CompoundMeasuredBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_CompoundMeasuredBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_CompoundMeasuredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_MeasuresCompound = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasuresCompound",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_MeasuresCompound_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasuresCompound", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Concerns = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Concerns",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Concerns_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Concerns", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsATopicOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsATopicOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsATopicOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsATopicOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ConsistsOfCompounds = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ConsistsOfCompounds",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ConsistsOfCompounds_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ConsistsOfCompounds", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ComponentOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ComponentOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Contains = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Contains",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Contains_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Contains", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsContainedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsContainedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsContainedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsContainedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ContainsAlignedDNA = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsAlignedDNA",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ContainsAlignedDNA_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsAlignedDNA", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsAlignedDNAComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignedDNAComponentOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsAlignedDNAComponentOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignedDNAComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ContainsAlignedProtein = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsAlignedProtein",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ContainsAlignedProtein_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsAlignedProtein", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsAlignedProteinComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignedProteinComponentOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsAlignedProteinComponentOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignedProteinComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ContainsExperimentalUnit = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsExperimentalUnit",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ContainsExperimentalUnit_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ContainsExperimentalUnit", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_GroupedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_GroupedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_GroupedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_GroupedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Controls = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Controls",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Controls_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Controls", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsControlledUsing = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsControlledUsing",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsControlledUsing_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsControlledUsing", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DefaultControlSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DefaultControlSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DefaultControlSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DefaultControlSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SamplesDefaultControl = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SamplesDefaultControl",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SamplesDefaultControl_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SamplesDefaultControl", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Describes = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Describes",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Describes_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Describes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsDescribedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDescribedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsDescribedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDescribedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DescribesAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesAlignment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DescribesAlignment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasAlignmentAttribute = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAlignmentAttribute",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasAlignmentAttribute_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAlignmentAttribute", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DescribesMeasurement = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesMeasurement",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DescribesMeasurement_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesMeasurement", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsDefinedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDefinedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsDefinedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDefinedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DescribesTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesTree",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DescribesTree_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasTreeAttribute = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTreeAttribute",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasTreeAttribute_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTreeAttribute", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DescribesTreeNode = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesTreeNode",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DescribesTreeNode_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DescribesTreeNode", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasNodeAttribute = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasNodeAttribute",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasNodeAttribute_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasNodeAttribute", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DetectedWithMethod = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DetectedWithMethod",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DetectedWithMethod_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DetectedWithMethod", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DetectedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DetectedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DetectedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DetectedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Displays = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Displays",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Displays_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Displays", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsDisplayedOn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDisplayedOn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsDisplayedOn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDisplayedOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Encompasses = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Encompasses",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Encompasses_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Encompasses", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsEncompassedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsEncompassedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsEncompassedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsEncompassedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_EvaluatedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_EvaluatedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_EvaluatedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_EvaluatedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IncludesStrain = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesStrain",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IncludesStrain_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesStrain", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_FeatureIsTranscriptionFactorFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_FeatureIsTranscriptionFactorFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_FeatureIsTranscriptionFactorFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_FeatureIsTranscriptionFactorFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasTranscriptionFactorFeature = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTranscriptionFactorFeature",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasTranscriptionFactorFeature_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTranscriptionFactorFeature", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_FeatureMeasuredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_FeatureMeasuredBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_FeatureMeasuredBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_FeatureMeasuredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_MeasuresFeature = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasuresFeature",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_MeasuresFeature_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasuresFeature", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Formulated = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Formulated",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Formulated_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Formulated", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_WasFormulatedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_WasFormulatedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_WasFormulatedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasFormulatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_GeneratedLevelsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_GeneratedLevelsFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_GeneratedLevelsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_WasGeneratedFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_WasGeneratedFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_WasGeneratedFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasGeneratedFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_GenomeParentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_GenomeParentOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_GenomeParentOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_GenomeParentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DerivedFromGenome = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DerivedFromGenome",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DerivedFromGenome_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DerivedFromGenome", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasAliasAssertedFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAliasAssertedFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasAliasAssertedFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAliasAssertedFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AssertsAliasFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AssertsAliasFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AssertsAliasFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AssertsAliasFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasCompoundAliasFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasCompoundAliasFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasCompoundAliasFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_UsesAliasForCompound = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesAliasForCompound",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_UsesAliasForCompound_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesAliasForCompound", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasEffector = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasEffector",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasEffector_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasEffector", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsEffectorFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsEffectorFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsEffectorFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsEffectorFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasExperimentalUnit = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasExperimentalUnit",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasExperimentalUnit_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasExperimentalUnit", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsExperimentalUnitOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExperimentalUnitOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsExperimentalUnitOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExperimentalUnitOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasExpressionSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasExpressionSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasExpressionSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasExpressionSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleBelongsToExperimentalUnit = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleBelongsToExperimentalUnit",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleBelongsToExperimentalUnit_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleBelongsToExperimentalUnit", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasGenomes = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasGenomes",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasGenomes_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasGenomes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInRegulogCollection = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInRegulogCollection",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInRegulogCollection_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInRegulogCollection", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasIndicatedSignalFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasIndicatedSignalFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasIndicatedSignalFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IndicatesSignalFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IndicatesSignalFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IndicatesSignalFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IndicatesSignalFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasKnockoutIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasKnockoutIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasKnockoutIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasKnockoutIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_KnockedOutIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_KnockedOutIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_KnockedOutIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_KnockedOutIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasMeasurement = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMeasurement",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasMeasurement_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMeasurement", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsMeasureOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMeasureOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsMeasureOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMeasureOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasMember = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMember",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasMember_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMember", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsMemberOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMemberOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsMemberOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMemberOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasParameter = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasParameter",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasParameter_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasParameter", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_OfEnvironment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_OfEnvironment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_OfEnvironment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OfEnvironment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasParticipant = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasParticipant",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasParticipant_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasParticipant", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ParticipatesIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ParticipatesIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasPresenceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasPresenceOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasPresenceOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasPresenceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsPresentIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPresentIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsPresentIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPresentIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasProteinMember = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasProteinMember",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasProteinMember_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasProteinMember", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsProteinMemberOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsProteinMemberOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsProteinMemberOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsProteinMemberOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasReactionAliasFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasReactionAliasFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasReactionAliasFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_UsesAliasForReaction = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesAliasForReaction",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_UsesAliasForReaction_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesAliasForReaction", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasRegulogs = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRegulogs",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasRegulogs_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRegulogs", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInCollection = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInCollection",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInCollection_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInCollection", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasRepresentativeOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRepresentativeOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasRepresentativeOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRepresentativeOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRepresentedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRepresentedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRepresentedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRepresentedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasRequirementOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRequirementOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasRequirementOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRequirementOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsARequirementOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsARequirementOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsARequirementOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsARequirementOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasResultsIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasResultsIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasResultsIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasResultsIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasResultsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasResultsFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasResultsFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasResultsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasSection = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasSection",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasSection_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasSection", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSectionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSectionOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSectionOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSectionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasStep = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasStep",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasStep_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasStep", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsStepOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsStepOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsStepOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsStepOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasTrait = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTrait",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasTrait_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasTrait", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Measures = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Measures",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Measures_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Measures", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasUnits = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasUnits",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasUnits_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasUnits", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsLocated = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocated",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsLocated_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocated", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasUsage = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasUsage",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasUsage_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasUsage", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsUsageOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsageOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsUsageOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsageOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasValueFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasValueFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasValueFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasValueFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasValueIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasValueIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasValueIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasValueIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasVariationIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasVariationIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasVariationIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasVariationIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsVariedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsVariedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsVariedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsVariedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Impacts = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Impacts",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Impacts_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Impacts", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsImpactedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsImpactedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsImpactedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsImpactedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ImplementsReaction = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ImplementsReaction",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ImplementsReaction_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ImplementsReaction", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ImplementedBasedOn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ImplementedBasedOn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ImplementedBasedOn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ImplementedBasedOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Includes = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Includes",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Includes_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Includes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsIncludedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsIncludedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsIncludedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsIncludedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IncludesAdditionalCompounds = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesAdditionalCompounds",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IncludesAdditionalCompounds_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesAdditionalCompounds", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IncludedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IncludedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IncludesAlignmentRow = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesAlignmentRow",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IncludesAlignmentRow_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesAlignmentRow", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsAlignmentRowIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignmentRowIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsAlignmentRowIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAlignmentRowIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IncludesPart = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesPart",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IncludesPart_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesPart", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsPartOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPartOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsPartOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPartOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IndicatedLevelsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IndicatedLevelsFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IndicatedLevelsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasLevelsFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasLevelsFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasLevelsFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasLevelsFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Involves = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Involves",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Involves_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Involves", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInvolvedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInvolvedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInvolvedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInvolvedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsAnnotatedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAnnotatedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsAnnotatedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAnnotatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Annotates = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Annotates",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Annotates_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Annotates", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsAssayOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAssayOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsAssayOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAssayOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsAssayedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAssayedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsAssayedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsAssayedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsClassFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsClassFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsClassFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsClassFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInClass = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInClass",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInClass_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInClass", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsCollectionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCollectionOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsCollectionOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCollectionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsCollectedInto = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCollectedInto",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsCollectedInto_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCollectedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsComposedOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComposedOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsComposedOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComposedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComponentOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsComponentOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsComprisedOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComprisedOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsComprisedOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsComprisedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Comprises = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Comprises",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Comprises_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Comprises", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsConfiguredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConfiguredBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsConfiguredBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConfiguredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ReflectsStateOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ReflectsStateOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ReflectsStateOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ReflectsStateOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsConservedDomainModelFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConservedDomainModelFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsConservedDomainModelFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConservedDomainModelFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasConservedDomainModel = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasConservedDomainModel",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasConservedDomainModel_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasConservedDomainModel", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsConsistentWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConsistentWith",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsConsistentWith_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConsistentWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsConsistentTo = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConsistentTo",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsConsistentTo_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsConsistentTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsContextOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsContextOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsContextOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsContextOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasEnvironment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasEnvironment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasEnvironment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasEnvironment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsCoregulatedWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoregulatedWith",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsCoregulatedWith_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoregulatedWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasCoregulationWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasCoregulationWith",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasCoregulationWith_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasCoregulationWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsCoupledTo = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoupledTo",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsCoupledTo_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoupledTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsCoupledWith = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoupledWith",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsCoupledWith_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsCoupledWith", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsDatasetFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDatasetFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsDatasetFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDatasetFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasAssociationDataset = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAssociationDataset",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasAssociationDataset_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAssociationDataset", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsDeterminedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDeterminedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsDeterminedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDeterminedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Determines = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Determines",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Determines_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Determines", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsDividedInto = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDividedInto",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsDividedInto_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDividedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsDivisionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDivisionOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsDivisionOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsDivisionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsExecutedAs = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExecutedAs",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsExecutedAs_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExecutedAs", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsExecutionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExecutionOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsExecutionOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExecutionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsExemplarOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExemplarOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsExemplarOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsExemplarOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasAsExemplar = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsExemplar",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasAsExemplar_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsExemplar", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsFamilyFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFamilyFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsFamilyFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFamilyFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DeterminesFunctionOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DeterminesFunctionOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DeterminesFunctionOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsFormedOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFormedOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsFormedOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFormedOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsFormedInto = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFormedInto",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsFormedInto_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFormedInto", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsFunctionalIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFunctionalIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsFunctionalIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsFunctionalIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasFunctional = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasFunctional",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasFunctional_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasFunctional", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsGroupFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsGroupFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsGroupFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsGroupFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInGroup = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInGroup",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInGroup_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInGroup", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsGroupingOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsGroupingOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsGroupingOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsGroupingOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_InAssociationDataset = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_InAssociationDataset",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_InAssociationDataset_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_InAssociationDataset", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsImplementedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsImplementedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsImplementedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsImplementedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Implements = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Implements",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Implements_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Implements", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInOperon = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInOperon",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInOperon_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInOperon", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_OperonContains = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_OperonContains",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_OperonContains_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OperonContains", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInPair = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInPair",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInPair_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInPair", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsPairOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPairOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsPairOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsPairOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInstantiatedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInstantiatedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInstantiatedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInstantiatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInstanceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInstanceOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInstanceOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInstanceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsLocatedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocatedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsLocatedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocatedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsLocusFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocusFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsLocusFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsLocusFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsMeasurementMethodOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMeasurementMethodOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsMeasurementMethodOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsMeasurementMethodOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_WasMeasuredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_WasMeasuredBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_WasMeasuredBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasMeasuredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsModeledBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModeledBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsModeledBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModeledBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Models = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Models",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Models_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Models", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsModifiedToBuildAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModifiedToBuildAlignment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsModifiedToBuildAlignment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModifiedToBuildAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsModificationOfAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModificationOfAlignment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsModificationOfAlignment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModificationOfAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsModifiedToBuildTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModifiedToBuildTree",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsModifiedToBuildTree_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModifiedToBuildTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsModificationOfTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModificationOfTree",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsModificationOfTree_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsModificationOfTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsOwnerOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsOwnerOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsOwnerOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsOwnerOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsOwnedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsOwnedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsOwnedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsOwnedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsParticipatingAt = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsParticipatingAt",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsParticipatingAt_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsParticipatingAt", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ParticipatesAt = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesAt",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ParticipatesAt_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesAt", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsProteinFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsProteinFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsProteinFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsProteinFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Produces = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Produces",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Produces_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Produces", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsReagentIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsReagentIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsReagentIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsReagentIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Targets = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Targets",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Targets_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Targets", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRealLocationOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRealLocationOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRealLocationOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRealLocationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasRealLocationIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRealLocationIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasRealLocationIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRealLocationIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsReferencedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsReferencedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsReferencedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsReferencedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_UsesReference = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesReference",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_UsesReference_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesReference", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRegulatedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRegulatedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRegulatedSetOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRegulatedSetOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatedSetOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRegulatorFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatorFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRegulatorFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatorFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasRegulator = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRegulator",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasRegulator_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRegulator", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRegulatorForRegulon = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatorForRegulon",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRegulatorForRegulon_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatorForRegulon", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ReglonHasRegulator = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ReglonHasRegulator",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ReglonHasRegulator_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ReglonHasRegulator", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRegulatorySiteFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatorySiteFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRegulatorySiteFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRegulatorySiteFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasRegulatorySite = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRegulatorySite",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasRegulatorySite_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRegulatorySite", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRelevantFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRelevantFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRelevantFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRelevantFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRelevantTo = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRelevantTo",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRelevantTo_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRelevantTo", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRepresentedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRepresentedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRepresentedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRepresentedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DefinedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DefinedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DefinedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DefinedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRoleOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRoleOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRoleOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRoleOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasRole = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRole",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasRole_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasRole", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRowOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRowOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRowOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRowOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsRoleFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRoleFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsRoleFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsRoleFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSequenceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSequenceOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSequenceOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSequenceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasAsSequence = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsSequence",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasAsSequence_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsSequence", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSourceForAssociationDataset = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSourceForAssociationDataset",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSourceForAssociationDataset_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSourceForAssociationDataset", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AssociationDatasetSourcedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AssociationDatasetSourcedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AssociationDatasetSourcedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AssociationDatasetSourcedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSubInstanceOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSubInstanceOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSubInstanceOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSubInstanceOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Validates = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Validates",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Validates_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Validates", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSummarizedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSummarizedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSummarizedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSummarizedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Summarizes = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Summarizes",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Summarizes_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Summarizes", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSuperclassOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSuperclassOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSuperclassOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSuperclassOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSubclassOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSubclassOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSubclassOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSubclassOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsTaxonomyOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTaxonomyOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsTaxonomyOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTaxonomyOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsInTaxa = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInTaxa",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsInTaxa_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsInTaxa", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsTerminusFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTerminusFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsTerminusFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTerminusFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasAsTerminus = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsTerminus",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasAsTerminus_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasAsTerminus", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsTriggeredBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTriggeredBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsTriggeredBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTriggeredBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Triggers = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Triggers",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Triggers_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Triggers", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsUsedToBuildTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsedToBuildTree",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsUsedToBuildTree_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsedToBuildTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsBuiltFromAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsBuiltFromAlignment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsBuiltFromAlignment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsBuiltFromAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Manages = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Manages",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Manages_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Manages", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsManagedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsManagedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsManagedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsManagedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_OntologyForSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_OntologyForSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_OntologyForSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OntologyForSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleHasOntology = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleHasOntology",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleHasOntology_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleHasOntology", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_OperatesIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_OperatesIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_OperatesIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OperatesIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsUtilizedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUtilizedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsUtilizedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUtilizedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_OrdersExperimentalUnit = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_OrdersExperimentalUnit",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_OrdersExperimentalUnit_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OrdersExperimentalUnit", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsTimepointOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTimepointOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsTimepointOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTimepointOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Overlaps = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Overlaps",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Overlaps_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Overlaps", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IncludesPartOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesPartOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IncludesPartOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IncludesPartOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ParticipatesAs = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesAs",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ParticipatesAs_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ParticipatesAs", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsParticipationOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsParticipationOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsParticipationOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsParticipationOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PerformedExperiment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PerformedExperiment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PerformedExperiment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PerformedExperiment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PerformedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PerformedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PerformedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PerformedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PersonAnnotatedSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PersonAnnotatedSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PersonAnnotatedSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PersonAnnotatedSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleAnnotatedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleAnnotatedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleAnnotatedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleAnnotatedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PlatformWithSamples = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PlatformWithSamples",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PlatformWithSamples_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PlatformWithSamples", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleRunOnPlatform = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleRunOnPlatform",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleRunOnPlatform_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleRunOnPlatform", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ProducedResultsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ProducedResultsFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ProducedResultsFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ProducedResultsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HadResultsProducedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HadResultsProducedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HadResultsProducedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HadResultsProducedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ProtocolForSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ProtocolForSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ProtocolForSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ProtocolForSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleUsesProtocol = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleUsesProtocol",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleUsesProtocol_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleUsesProtocol", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Provided = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Provided",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Provided_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Provided", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_WasProvidedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_WasProvidedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_WasProvidedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasProvidedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PublishedAssociation = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedAssociation",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PublishedAssociation_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedAssociation", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AssociationPublishedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AssociationPublishedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AssociationPublishedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AssociationPublishedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PublishedExperiment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedExperiment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PublishedExperiment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedExperiment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ExperimentPublishedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ExperimentPublishedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ExperimentPublishedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ExperimentPublishedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PublishedProtocol = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedProtocol",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PublishedProtocol_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PublishedProtocol", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ProtocolPublishedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ProtocolPublishedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ProtocolPublishedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ProtocolPublishedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_RegulogHasRegulon = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulogHasRegulon",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_RegulogHasRegulon_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulogHasRegulon", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_RegulonIsInRegolog = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulonIsInRegolog",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_RegulonIsInRegolog_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulonIsInRegolog", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_RegulomeHasGenome = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulomeHasGenome",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_RegulomeHasGenome_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulomeHasGenome", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_GenomeIsInRegulome = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_GenomeIsInRegulome",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_GenomeIsInRegulome_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_GenomeIsInRegulome", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_RegulomeHasRegulon = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulomeHasRegulon",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_RegulomeHasRegulon_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulomeHasRegulon", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_RegulonIsInRegolome = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulonIsInRegolome",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_RegulonIsInRegolome_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulonIsInRegolome", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_RegulomeSource = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulomeSource",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_RegulomeSource_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulomeSource", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_CreatedRegulome = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_CreatedRegulome",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_CreatedRegulome_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_CreatedRegulome", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_RegulonHasOperon = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulonHasOperon",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_RegulonHasOperon_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_RegulonHasOperon", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_OperonIsInRegulon = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_OperonIsInRegulon",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_OperonIsInRegulon_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_OperonIsInRegulon", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleAveragedFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleAveragedFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleAveragedFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleAveragedFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleComponentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleComponentOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleComponentOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleComponentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleContactPerson = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleContactPerson",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleContactPerson_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleContactPerson", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PersonPerformedSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PersonPerformedSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PersonPerformedSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PersonPerformedSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleHasAnnotations = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleHasAnnotations",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleHasAnnotations_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleHasAnnotations", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AnnotationsForSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AnnotationsForSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AnnotationsForSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AnnotationsForSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleInSeries = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleInSeries",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleInSeries_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleInSeries", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SeriesWithSamples = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SeriesWithSamples",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SeriesWithSamples_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SeriesWithSamples", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleMeasurements = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleMeasurements",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleMeasurements_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleMeasurements", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_MeasurementInSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasurementInSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_MeasurementInSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_MeasurementInSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SamplesInReplicateGroup = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SamplesInReplicateGroup",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SamplesInReplicateGroup_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SamplesInReplicateGroup", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_ReplicateGroupsForSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_ReplicateGroupsForSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_ReplicateGroupsForSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_ReplicateGroupsForSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SeriesPublishedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SeriesPublishedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SeriesPublishedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SeriesPublishedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PublicationsForSeries = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PublicationsForSeries",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PublicationsForSeries_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PublicationsForSeries", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Shows = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Shows",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Shows_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Shows", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsShownOn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsShownOn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsShownOn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsShownOn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_StrainParentOf = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_StrainParentOf",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_StrainParentOf_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_StrainParentOf", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_DerivedFromStrain = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_DerivedFromStrain",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_DerivedFromStrain_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_DerivedFromStrain", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_StrainWithPlatforms = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_StrainWithPlatforms",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_StrainWithPlatforms_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_StrainWithPlatforms", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_PlatformForStrain = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_PlatformForStrain",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_PlatformForStrain_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_PlatformForStrain", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_StrainWithSample = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_StrainWithSample",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_StrainWithSample_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_StrainWithSample", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SampleForStrain = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleForStrain",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SampleForStrain_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SampleForStrain", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Submitted = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Submitted",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Submitted_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Submitted", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_WasSubmittedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_WasSubmittedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_WasSubmittedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_WasSubmittedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SupersedesAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SupersedesAlignment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SupersedesAlignment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SupersedesAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSupersededByAlignment = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSupersededByAlignment",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSupersededByAlignment_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSupersededByAlignment", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_SupersedesTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_SupersedesTree",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_SupersedesTree_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_SupersedesTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsSupersededByTree = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSupersededByTree",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsSupersededByTree_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsSupersededByTree", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Treed = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Treed",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Treed_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Treed", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsTreeFrom = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTreeFrom",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsTreeFrom_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsTreeFrom", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_UsedIn = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_UsedIn",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_UsedIn_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsedIn", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_HasMedia = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMedia",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_HasMedia_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_HasMedia", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_Uses = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_Uses",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_Uses_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_Uses", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_IsUsedBy = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsedBy",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_IsUsedBy_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_IsUsedBy", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_UsesCodons = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesCodons",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_UsesCodons_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_UsesCodons", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
    };

    this.get_relationship_AreCodonsFor = function (ids, from_fields, rel_fields, to_fields, _callback, _errorCallback) {
    return json_call_ajax("CDMI_EntityAPI.get_relationship_AreCodonsFor",
        [ids, from_fields, rel_fields, to_fields], 1, _callback, _errorCallback);
};

    this.get_relationship_AreCodonsFor_async = function (ids, from_fields, rel_fields, to_fields, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CDMI_EntityAPI.get_relationship_AreCodonsFor", [ids, from_fields, rel_fields, to_fields], 1, _callback, _error_callback);
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





function CoExpression(url, auth, auth_cb) {

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


    this.filter_genes = function (args, _callback, _errorCallback) {
    return json_call_ajax("CoExpression.filter_genes",
        [args], 1, _callback, _errorCallback);
};

    this.filter_genes_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CoExpression.filter_genes", [args], 1, _callback, _error_callback);
    };

    this.const_coex_net_clust = function (args, _callback, _errorCallback) {
    return json_call_ajax("CoExpression.const_coex_net_clust",
        [args], 1, _callback, _errorCallback);
};

    this.const_coex_net_clust_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CoExpression.const_coex_net_clust", [args], 1, _callback, _error_callback);
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





function CompressionBasedDistance(url, auth, auth_cb) {

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


    this.build_matrix = function (input, _callback, _errorCallback) {
    return json_call_ajax("CompressionBasedDistance.build_matrix",
        [input], 1, _callback, _errorCallback);
};

    this.build_matrix_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("CompressionBasedDistance.build_matrix", [input], 1, _callback, _error_callback);
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





function ERDB_Service(url, auth, auth_cb) {

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
        _url = "http://kbase.us/services/erdb_service";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.GetAll = function (objectNames, filterClause, parameters, fields, count, _callback, _errorCallback) {
    return json_call_ajax("ERDB_Service.GetAll",
        [objectNames, filterClause, parameters, fields, count], 1, _callback, _errorCallback);
};

    this.GetAll_async = function (objectNames, filterClause, parameters, fields, count, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("ERDB_Service.GetAll", [objectNames, filterClause, parameters, fields, count], 1, _callback, _error_callback);
    };

    this.runSQL = function (SQLstring, parameters, _callback, _errorCallback) {
    return json_call_ajax("ERDB_Service.runSQL",
        [SQLstring, parameters], 1, _callback, _errorCallback);
};

    this.runSQL_async = function (SQLstring, parameters, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("ERDB_Service.runSQL", [SQLstring, parameters], 1, _callback, _error_callback);
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





function ExpressionServices(url,auth) {

    var _url = url;
    var _auth = auth ? auth : { 'token' : '',
                                'user_id' : ''};


    this.get_expression_samples_data = function(sampleIds)
    {
        var resp = json_call_ajax_sync("ExpressionServices.get_expression_samples_data", [sampleIds]);
//      var resp = json_call_sync("ExpressionServices.get_expression_samples_data", [sampleIds]);
        return resp[0];
    }

    this.get_expression_samples_data_async = function(sampleIds, _callback, _error_callback)
    {
        json_call_ajax_async("ExpressionServices.get_expression_samples_data", [sampleIds], 1, _callback, _error_callback)
    }

    this.get_expression_samples_data_by_series_ids = function(seriesIds)
    {
        var resp = json_call_ajax_sync("ExpressionServices.get_expression_samples_data_by_series_ids", [seriesIds]);
//      var resp = json_call_sync("ExpressionServices.get_expression_samples_data_by_series_ids", [seriesIds]);
        return resp[0];
    }

    this.get_expression_samples_data_by_series_ids_async = function(seriesIds, _callback, _error_callback)
    {
        json_call_ajax_async("ExpressionServices.get_expression_samples_data_by_series_ids", [seriesIds], 1, _callback, _error_callback)
    }

    this.get_expression_samples_data_by_experimental_unit_ids = function(experimentalUnitIDs)
    {
        var resp = json_call_ajax_sync("ExpressionServices.get_expression_samples_data_by_experimental_unit_ids", [experimentalUnitIDs]);
//      var resp = json_call_sync("ExpressionServices.get_expression_samples_data_by_experimental_unit_ids", [experimentalUnitIDs]);
        return resp[0];
    }

    this.get_expression_samples_data_by_experimental_unit_ids_async = function(experimentalUnitIDs, _callback, _error_callback)
    {
        json_call_ajax_async("ExpressionServices.get_expression_samples_data_by_experimental_unit_ids", [experimentalUnitIDs], 1, _callback, _error_callback)
    }

    this.get_expression_experimental_unit_samples_data_by_experiment_meta_ids = function(experimentMetaIDs)
    {
        var resp = json_call_ajax_sync("ExpressionServices.get_expression_experimental_unit_samples_data_by_experiment_meta_ids", [experimentMetaIDs]);
//      var resp = json_call_sync("ExpressionServices.get_expression_experimental_unit_samples_data_by_experiment_meta_ids", [experimentMetaIDs]);
        return resp[0];
    }

    this.get_expression_experimental_unit_samples_data_by_experiment_meta_ids_async = function(experimentMetaIDs, _callback, _error_callback)
    {
        json_call_ajax_async("ExpressionServices.get_expression_experimental_unit_samples_data_by_experiment_meta_ids", [experimentMetaIDs], 1, _callback, _error_callback)
    }

    this.get_expression_samples_data_by_strain_ids = function(strainIDs, sampleType)
    {
        var resp = json_call_ajax_sync("ExpressionServices.get_expression_samples_data_by_strain_ids", [strainIDs, sampleType]);
//      var resp = json_call_sync("ExpressionServices.get_expression_samples_data_by_strain_ids", [strainIDs, sampleType]);
        return resp[0];
    }

    this.get_expression_samples_data_by_strain_ids_async = function(strainIDs, sampleType, _callback, _error_callback)
    {
        json_call_ajax_async("ExpressionServices.get_expression_samples_data_by_strain_ids", [strainIDs, sampleType], 1, _callback, _error_callback)
    }

    this.get_expression_samples_data_by_genome_ids = function(genomeIDs, sampleType, wildTypeOnly)
    {
        var resp = json_call_ajax_sync("ExpressionServices.get_expression_samples_data_by_genome_ids", [genomeIDs, sampleType, wildTypeOnly]);
//      var resp = json_call_sync("ExpressionServices.get_expression_samples_data_by_genome_ids", [genomeIDs, sampleType, wildTypeOnly]);
        return resp[0];
    }

    this.get_expression_samples_data_by_genome_ids_async = function(genomeIDs, sampleType, wildTypeOnly, _callback, _error_callback)
    {
        json_call_ajax_async("ExpressionServices.get_expression_samples_data_by_genome_ids", [genomeIDs, sampleType, wildTypeOnly], 1, _callback, _error_callback)
    }

    this.get_expression_data_by_feature_ids = function(featureIds, sampleType, wildTypeOnly)
    {
        var resp = json_call_ajax_sync("ExpressionServices.get_expression_data_by_feature_ids", [featureIds, sampleType, wildTypeOnly]);
//      var resp = json_call_sync("ExpressionServices.get_expression_data_by_feature_ids", [featureIds, sampleType, wildTypeOnly]);
        return resp[0];
    }

    this.get_expression_data_by_feature_ids_async = function(featureIds, sampleType, wildTypeOnly, _callback, _error_callback)
    {
        json_call_ajax_async("ExpressionServices.get_expression_data_by_feature_ids", [featureIds, sampleType, wildTypeOnly], 1, _callback, _error_callback)
    }

    function _json_call_prepare(url, method, params, async_flag)
    {
        var rpc = { 'params' : params,
                    'method' : method,
                    'version': "1.1",
                    'id': String(Math.random()).slice(2),
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
                    'id': String(Math.random()).slice(2),
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
        var code;
        
        var x = jQuery.ajax({       "async": false,
                                    dataType: "text",
                                    url: _url,
                                    beforeSend: function (xhr){ 
                                        xhr.setRequestHeader('Authorization', _auth.token); 
                                    },
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
                    'id': String(Math.random()).slice(2),
        };
        
        var body = JSON.stringify(rpc);
        var resp_txt;
        var code;
        
        var x = jQuery.ajax({       "async": true,
                                    dataType: "text",
                                    url: _url,
                                    beforeSend: function (xhr){ 
                                        xhr.setRequestHeader('Authorization', _auth.token); 
                                    },
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





function GWAS(url, auth, auth_cb) {

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


    this.prepare_variation = function (args, _callback, _errorCallback) {
    return json_call_ajax("GWAS.prepare_variation",
        [args], 1, _callback, _errorCallback);
};

    this.prepare_variation_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GWAS.prepare_variation", [args], 1, _callback, _error_callback);
    };

    this.calculate_kinship_matrix = function (args, _callback, _errorCallback) {
    return json_call_ajax("GWAS.calculate_kinship_matrix",
        [args], 1, _callback, _errorCallback);
};

    this.calculate_kinship_matrix_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GWAS.calculate_kinship_matrix", [args], 1, _callback, _error_callback);
    };

    this.run_gwas = function (args, _callback, _errorCallback) {
    return json_call_ajax("GWAS.run_gwas",
        [args], 1, _callback, _errorCallback);
};

    this.run_gwas_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GWAS.run_gwas", [args], 1, _callback, _error_callback);
    };

    this.variations_to_genes = function (args, _callback, _errorCallback) {
    return json_call_ajax("GWAS.variations_to_genes",
        [args], 1, _callback, _errorCallback);
};

    this.variations_to_genes_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GWAS.variations_to_genes", [args], 1, _callback, _error_callback);
    };

    this.genelist_to_networks = function (args, _callback, _errorCallback) {
    return json_call_ajax("GWAS.genelist_to_networks",
        [args], 1, _callback, _errorCallback);
};

    this.genelist_to_networks_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GWAS.genelist_to_networks", [args], 1, _callback, _error_callback);
    };

    this.gwas_genelist_to_networks = function (args, _callback, _errorCallback) {
    return json_call_ajax("GWAS.gwas_genelist_to_networks",
        [args], 1, _callback, _errorCallback);
};

    this.gwas_genelist_to_networks_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GWAS.gwas_genelist_to_networks", [args], 1, _callback, _error_callback);
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





function GenomeAnnotation(url, auth, auth_cb) {

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
        _url = "https://kbase.us/services/genome_annotation";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.genome_ids_to_genomes = function (ids, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.genome_ids_to_genomes",
        [ids], 1, _callback, _errorCallback);
};

    this.genome_ids_to_genomes_async = function (ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.genome_ids_to_genomes", [ids], 1, _callback, _error_callback);
    };

    this.create_genome = function (metadata, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.create_genome",
        [metadata], 1, _callback, _errorCallback);
};

    this.create_genome_async = function (metadata, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.create_genome", [metadata], 1, _callback, _error_callback);
    };

    this.create_genome_from_SEED = function (genome_id, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.create_genome_from_SEED",
        [genome_id], 1, _callback, _errorCallback);
};

    this.create_genome_from_SEED_async = function (genome_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.create_genome_from_SEED", [genome_id], 1, _callback, _error_callback);
    };

    this.create_genome_from_RAST = function (genome_or_job_id, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.create_genome_from_RAST",
        [genome_or_job_id], 1, _callback, _errorCallback);
};

    this.create_genome_from_RAST_async = function (genome_or_job_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.create_genome_from_RAST", [genome_or_job_id], 1, _callback, _error_callback);
    };

    this.set_metadata = function (genome_in, metadata, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.set_metadata",
        [genome_in, metadata], 1, _callback, _errorCallback);
};

    this.set_metadata_async = function (genome_in, metadata, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.set_metadata", [genome_in, metadata], 1, _callback, _error_callback);
    };

    this.add_contigs = function (genome_in, contigs, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.add_contigs",
        [genome_in, contigs], 1, _callback, _errorCallback);
};

    this.add_contigs_async = function (genome_in, contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.add_contigs", [genome_in, contigs], 1, _callback, _error_callback);
    };

    this.add_contigs_from_handle = function (genome_in, contigs, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.add_contigs_from_handle",
        [genome_in, contigs], 1, _callback, _errorCallback);
};

    this.add_contigs_from_handle_async = function (genome_in, contigs, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.add_contigs_from_handle", [genome_in, contigs], 1, _callback, _error_callback);
    };

    this.add_features = function (genome_in, features, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.add_features",
        [genome_in, features], 1, _callback, _errorCallback);
};

    this.add_features_async = function (genome_in, features, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.add_features", [genome_in, features], 1, _callback, _error_callback);
    };

    this.genomeTO_to_reconstructionTO = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.genomeTO_to_reconstructionTO",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.genomeTO_to_reconstructionTO_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.genomeTO_to_reconstructionTO", [genomeTO], 1, _callback, _error_callback);
    };

    this.genomeTO_to_feature_data = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.genomeTO_to_feature_data",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.genomeTO_to_feature_data_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.genomeTO_to_feature_data", [genomeTO], 1, _callback, _error_callback);
    };

    this.reconstructionTO_to_roles = function (reconstructionTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.reconstructionTO_to_roles",
        [reconstructionTO], 1, _callback, _errorCallback);
};

    this.reconstructionTO_to_roles_async = function (reconstructionTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.reconstructionTO_to_roles", [reconstructionTO], 1, _callback, _error_callback);
    };

    this.reconstructionTO_to_subsystems = function (reconstructionTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.reconstructionTO_to_subsystems",
        [reconstructionTO], 1, _callback, _errorCallback);
};

    this.reconstructionTO_to_subsystems_async = function (reconstructionTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.reconstructionTO_to_subsystems", [reconstructionTO], 1, _callback, _error_callback);
    };

    this.assign_functions_to_CDSs = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.assign_functions_to_CDSs",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.assign_functions_to_CDSs_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.assign_functions_to_CDSs", [genomeTO], 1, _callback, _error_callback);
    };

    this.annotate_genome = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.annotate_genome",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.annotate_genome_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.annotate_genome", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_selenoproteins = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_selenoproteins",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_selenoproteins_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_selenoproteins", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_pyrrolysoproteins = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_pyrrolysoproteins",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_pyrrolysoproteins_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_pyrrolysoproteins", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_selenoprotein = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_selenoprotein",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_selenoprotein_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_selenoprotein", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_pyrrolysoprotein = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_pyrrolysoprotein",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_pyrrolysoprotein_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_pyrrolysoprotein", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_insertion_sequences = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_insertion_sequences",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_insertion_sequences_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_insertion_sequences", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_rRNA_SEED = function (genome_in, types, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_rRNA_SEED",
        [genome_in, types], 1, _callback, _errorCallback);
};

    this.call_features_rRNA_SEED_async = function (genome_in, types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_rRNA_SEED", [genome_in, types], 1, _callback, _error_callback);
    };

    this.call_features_tRNA_trnascan = function (genome_in, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_tRNA_trnascan",
        [genome_in], 1, _callback, _errorCallback);
};

    this.call_features_tRNA_trnascan_async = function (genome_in, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_tRNA_trnascan", [genome_in], 1, _callback, _error_callback);
    };

    this.call_RNAs = function (genome_in, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_RNAs",
        [genome_in], 1, _callback, _errorCallback);
};

    this.call_RNAs_async = function (genome_in, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_RNAs", [genome_in], 1, _callback, _error_callback);
    };

    this.call_features_CDS_glimmer3 = function (genomeTO, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_CDS_glimmer3",
        [genomeTO, params], 1, _callback, _errorCallback);
};

    this.call_features_CDS_glimmer3_async = function (genomeTO, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_CDS_glimmer3", [genomeTO, params], 1, _callback, _error_callback);
    };

    this.call_features_CDS_prodigal = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_CDS_prodigal",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_CDS_prodigal_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_CDS_prodigal", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_CDS_genemark = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_CDS_genemark",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_CDS_genemark_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_CDS_genemark", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_CDS_SEED_projection = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_CDS_SEED_projection",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_CDS_SEED_projection_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_CDS_SEED_projection", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_CDS_FragGeneScan = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_CDS_FragGeneScan",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_CDS_FragGeneScan_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_CDS_FragGeneScan", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_repeat_region_SEED = function (genome_in, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_repeat_region_SEED",
        [genome_in, params], 1, _callback, _errorCallback);
};

    this.call_features_repeat_region_SEED_async = function (genome_in, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_repeat_region_SEED", [genome_in, params], 1, _callback, _error_callback);
    };

    this.call_features_prophage_phispy = function (genome_in, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_prophage_phispy",
        [genome_in], 1, _callback, _errorCallback);
};

    this.call_features_prophage_phispy_async = function (genome_in, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_prophage_phispy", [genome_in], 1, _callback, _error_callback);
    };

    this.call_features_scan_for_matches = function (genome_in, pattern, feature_type, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_scan_for_matches",
        [genome_in, pattern, feature_type], 1, _callback, _errorCallback);
};

    this.call_features_scan_for_matches_async = function (genome_in, pattern, feature_type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_scan_for_matches", [genome_in, pattern, feature_type], 1, _callback, _error_callback);
    };

    this.annotate_proteins_similarity = function (genomeTO, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.annotate_proteins_similarity",
        [genomeTO, params], 1, _callback, _errorCallback);
};

    this.annotate_proteins_similarity_async = function (genomeTO, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.annotate_proteins_similarity", [genomeTO, params], 1, _callback, _error_callback);
    };

    this.annotate_proteins_kmer_v1 = function (genomeTO, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.annotate_proteins_kmer_v1",
        [genomeTO, params], 1, _callback, _errorCallback);
};

    this.annotate_proteins_kmer_v1_async = function (genomeTO, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.annotate_proteins_kmer_v1", [genomeTO, params], 1, _callback, _error_callback);
    };

    this.annotate_proteins_kmer_v2 = function (genome_in, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.annotate_proteins_kmer_v2",
        [genome_in, params], 1, _callback, _errorCallback);
};

    this.annotate_proteins_kmer_v2_async = function (genome_in, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.annotate_proteins_kmer_v2", [genome_in, params], 1, _callback, _error_callback);
    };

    this.resolve_overlapping_features = function (genome_in, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.resolve_overlapping_features",
        [genome_in, params], 1, _callback, _errorCallback);
};

    this.resolve_overlapping_features_async = function (genome_in, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.resolve_overlapping_features", [genome_in, params], 1, _callback, _error_callback);
    };

    this.call_features_ProtoCDS_kmer_v1 = function (genomeTO, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_ProtoCDS_kmer_v1",
        [genomeTO, params], 1, _callback, _errorCallback);
};

    this.call_features_ProtoCDS_kmer_v1_async = function (genomeTO, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_ProtoCDS_kmer_v1", [genomeTO, params], 1, _callback, _error_callback);
    };

    this.call_features_ProtoCDS_kmer_v2 = function (genome_in, params, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_ProtoCDS_kmer_v2",
        [genome_in, params], 1, _callback, _errorCallback);
};

    this.call_features_ProtoCDS_kmer_v2_async = function (genome_in, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_ProtoCDS_kmer_v2", [genome_in, params], 1, _callback, _error_callback);
    };

    this.enumerate_special_protein_databases = function (_callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.enumerate_special_protein_databases",
        [], 1, _callback, _errorCallback);
};

    this.enumerate_special_protein_databases_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.enumerate_special_protein_databases", [], 1, _callback, _error_callback);
    };

    this.compute_special_proteins = function (genome_in, database_names, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.compute_special_proteins",
        [genome_in, database_names], 1, _callback, _errorCallback);
};

    this.compute_special_proteins_async = function (genome_in, database_names, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.compute_special_proteins", [genome_in, database_names], 1, _callback, _error_callback);
    };

    this.compute_cdd = function (genome_in, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.compute_cdd",
        [genome_in], 1, _callback, _errorCallback);
};

    this.compute_cdd_async = function (genome_in, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.compute_cdd", [genome_in], 1, _callback, _error_callback);
    };

    this.annotate_proteins = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.annotate_proteins",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.annotate_proteins_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.annotate_proteins", [genomeTO], 1, _callback, _error_callback);
    };

    this.estimate_crude_phylogenetic_position_kmer = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.estimate_crude_phylogenetic_position_kmer",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.estimate_crude_phylogenetic_position_kmer_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.estimate_crude_phylogenetic_position_kmer", [genomeTO], 1, _callback, _error_callback);
    };

    this.find_close_neighbors = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.find_close_neighbors",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.find_close_neighbors_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.find_close_neighbors", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_strep_suis_repeat = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_strep_suis_repeat",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_strep_suis_repeat_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_strep_suis_repeat", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_strep_pneumo_repeat = function (genomeTO, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_strep_pneumo_repeat",
        [genomeTO], 1, _callback, _errorCallback);
};

    this.call_features_strep_pneumo_repeat_async = function (genomeTO, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_strep_pneumo_repeat", [genomeTO], 1, _callback, _error_callback);
    };

    this.call_features_crispr = function (genome_in, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.call_features_crispr",
        [genome_in], 1, _callback, _errorCallback);
};

    this.call_features_crispr_async = function (genome_in, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.call_features_crispr", [genome_in], 1, _callback, _error_callback);
    };

    this.update_functions = function (genome_in, functions, event, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.update_functions",
        [genome_in, functions, event], 1, _callback, _errorCallback);
};

    this.update_functions_async = function (genome_in, functions, event, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.update_functions", [genome_in, functions, event], 1, _callback, _error_callback);
    };

    this.renumber_features = function (genome_in, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.renumber_features",
        [genome_in], 1, _callback, _errorCallback);
};

    this.renumber_features_async = function (genome_in, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.renumber_features", [genome_in], 1, _callback, _error_callback);
    };

    this.export_genome = function (genome_in, format, feature_types, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.export_genome",
        [genome_in, format, feature_types], 1, _callback, _errorCallback);
};

    this.export_genome_async = function (genome_in, format, feature_types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.export_genome", [genome_in, format, feature_types], 1, _callback, _error_callback);
    };

    this.enumerate_classifiers = function (_callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.enumerate_classifiers",
        [], 1, _callback, _errorCallback);
};

    this.enumerate_classifiers_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.enumerate_classifiers", [], 1, _callback, _error_callback);
    };

    this.query_classifier_groups = function (classifier, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.query_classifier_groups",
        [classifier], 1, _callback, _errorCallback);
};

    this.query_classifier_groups_async = function (classifier, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.query_classifier_groups", [classifier], 1, _callback, _error_callback);
    };

    this.query_classifier_taxonomies = function (classifier, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.query_classifier_taxonomies",
        [classifier], 1, _callback, _errorCallback);
};

    this.query_classifier_taxonomies_async = function (classifier, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.query_classifier_taxonomies", [classifier], 1, _callback, _error_callback);
    };

    this.classify_into_bins = function (classifier, dna_input, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.classify_into_bins",
        [classifier, dna_input], 1, _callback, _errorCallback);
};

    this.classify_into_bins_async = function (classifier, dna_input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.classify_into_bins", [classifier, dna_input], 1, _callback, _error_callback);
    };

    this.classify_full = function (classifier, dna_input, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.classify_full",
        [classifier, dna_input], 3, _callback, _errorCallback);
};

    this.classify_full_async = function (classifier, dna_input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.classify_full", [classifier, dna_input], 3, _callback, _error_callback);
    };

    this.default_workflow = function (_callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.default_workflow",
        [], 1, _callback, _errorCallback);
};

    this.default_workflow_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.default_workflow", [], 1, _callback, _error_callback);
    };

    this.complete_workflow_template = function (_callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.complete_workflow_template",
        [], 1, _callback, _errorCallback);
};

    this.complete_workflow_template_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.complete_workflow_template", [], 1, _callback, _error_callback);
    };

    this.run_pipeline = function (genome_in, workflow, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.run_pipeline",
        [genome_in, workflow], 1, _callback, _errorCallback);
};

    this.run_pipeline_async = function (genome_in, workflow, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.run_pipeline", [genome_in, workflow], 1, _callback, _error_callback);
    };

    this.pipeline_batch_start = function (genomes, workflow, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.pipeline_batch_start",
        [genomes, workflow], 1, _callback, _errorCallback);
};

    this.pipeline_batch_start_async = function (genomes, workflow, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.pipeline_batch_start", [genomes, workflow], 1, _callback, _error_callback);
    };

    this.pipeline_batch_status = function (batch_id, _callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.pipeline_batch_status",
        [batch_id], 1, _callback, _errorCallback);
};

    this.pipeline_batch_status_async = function (batch_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.pipeline_batch_status", [batch_id], 1, _callback, _error_callback);
    };

    this.pipeline_batch_enumerate_batches = function (_callback, _errorCallback) {
    return json_call_ajax("GenomeAnnotation.pipeline_batch_enumerate_batches",
        [], 1, _callback, _errorCallback);
};

    this.pipeline_batch_enumerate_batches_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeAnnotation.pipeline_batch_enumerate_batches", [], 1, _callback, _error_callback);
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





function GenomeComparison(url, auth, auth_cb) {

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


    this.blast_proteomes = function (input, _callback, _errorCallback) {
    return json_call_ajax("GenomeComparison.blast_proteomes",
        [input], 1, _callback, _errorCallback);
};

    this.blast_proteomes_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeComparison.blast_proteomes", [input], 1, _callback, _error_callback);
    };

    this.annotate_genome = function (input, _callback, _errorCallback) {
    return json_call_ajax("GenomeComparison.annotate_genome",
        [input], 1, _callback, _errorCallback);
};

    this.annotate_genome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeComparison.annotate_genome", [input], 1, _callback, _error_callback);
    };

    this.get_ncbi_genome_names = function (_callback, _errorCallback) {
    return json_call_ajax("GenomeComparison.get_ncbi_genome_names",
        [], 1, _callback, _errorCallback);
};

    this.get_ncbi_genome_names_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeComparison.get_ncbi_genome_names", [], 1, _callback, _error_callback);
    };

    this.import_ncbi_genome = function (input, _callback, _errorCallback) {
    return json_call_ajax("GenomeComparison.import_ncbi_genome",
        [input], 0, _callback, _errorCallback);
};

    this.import_ncbi_genome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("GenomeComparison.import_ncbi_genome", [input], 0, _callback, _error_callback);
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





function HandleMngr(url, auth, auth_cb) {

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


    this.is_readable = function (token, nodeurl, _callback, _errorCallback) {
    return json_call_ajax("HandleMngr.is_readable",
        [token, nodeurl], 1, _callback, _errorCallback);
};

    this.is_readable_async = function (token, nodeurl, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("HandleMngr.is_readable", [token, nodeurl], 1, _callback, _error_callback);
    };

    this.add_read_acl = function (hids, username, _callback, _errorCallback) {
    return json_call_ajax("HandleMngr.add_read_acl",
        [hids, username], 0, _callback, _errorCallback);
};

    this.add_read_acl_async = function (hids, username, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("HandleMngr.add_read_acl", [hids, username], 0, _callback, _error_callback);
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





function IDServerAPI(url, auth, auth_cb) {

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
        _url = "http://localhost:7031";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.kbase_ids_to_external_ids = function (ids, _callback, _errorCallback) {
    return json_call_ajax("IDServerAPI.kbase_ids_to_external_ids",
        [ids], 1, _callback, _errorCallback);
};

    this.kbase_ids_to_external_ids_async = function (ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("IDServerAPI.kbase_ids_to_external_ids", [ids], 1, _callback, _error_callback);
    };

    this.external_ids_to_kbase_ids = function (external_db, ext_ids, _callback, _errorCallback) {
    return json_call_ajax("IDServerAPI.external_ids_to_kbase_ids",
        [external_db, ext_ids], 1, _callback, _errorCallback);
};

    this.external_ids_to_kbase_ids_async = function (external_db, ext_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("IDServerAPI.external_ids_to_kbase_ids", [external_db, ext_ids], 1, _callback, _error_callback);
    };

    this.register_ids = function (prefix, db_name, ids, _callback, _errorCallback) {
    return json_call_ajax("IDServerAPI.register_ids",
        [prefix, db_name, ids], 1, _callback, _errorCallback);
};

    this.register_ids_async = function (prefix, db_name, ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("IDServerAPI.register_ids", [prefix, db_name, ids], 1, _callback, _error_callback);
    };

    this.allocate_id_range = function (kbase_id_prefix, count, _callback, _errorCallback) {
    return json_call_ajax("IDServerAPI.allocate_id_range",
        [kbase_id_prefix, count], 1, _callback, _errorCallback);
};

    this.allocate_id_range_async = function (kbase_id_prefix, count, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("IDServerAPI.allocate_id_range", [kbase_id_prefix, count], 1, _callback, _error_callback);
    };

    this.register_allocated_ids = function (prefix, db_name, assignments, _callback, _errorCallback) {
    return json_call_ajax("IDServerAPI.register_allocated_ids",
        [prefix, db_name, assignments], 0, _callback, _errorCallback);
};

    this.register_allocated_ids_async = function (prefix, db_name, assignments, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("IDServerAPI.register_allocated_ids", [prefix, db_name, assignments], 0, _callback, _error_callback);
    };

    this.get_identifier_prefix = function (_callback, _errorCallback) {
    return json_call_ajax("IDServerAPI.get_identifier_prefix",
        [], 1, _callback, _errorCallback);
};

    this.get_identifier_prefix_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("IDServerAPI.get_identifier_prefix", [], 1, _callback, _error_callback);
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





function KBaseDataImport(url, auth, auth_cb) {

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
        _url = "https://kbase.us/services/kbase_data_import/rpc";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.ver = function (_callback, _errorCallback) {
    return json_call_ajax("KBaseDataImport.ver",
        [], 1, _callback, _errorCallback);
};

    this.ver_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseDataImport.ver", [], 1, _callback, _error_callback);
    };

    this.get_ncbi_genome_names = function (_callback, _errorCallback) {
    return json_call_ajax("KBaseDataImport.get_ncbi_genome_names",
        [], 1, _callback, _errorCallback);
};

    this.get_ncbi_genome_names_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseDataImport.get_ncbi_genome_names", [], 1, _callback, _error_callback);
    };

    this.import_ncbi_genome = function (input, _callback, _errorCallback) {
    return json_call_ajax("KBaseDataImport.import_ncbi_genome",
        [input], 0, _callback, _errorCallback);
};

    this.import_ncbi_genome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseDataImport.import_ncbi_genome", [input], 0, _callback, _error_callback);
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





function KBaseExpression(url, auth, auth_cb) {

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


    this.get_expression_samples_data = function (sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_data",
        [sample_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_data_async = function (sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_data", [sample_ids], 1, _callback, _error_callback);
    };

    this.get_expression_data_by_samples_and_features = function (sample_ids, feature_ids, numerical_interpretation, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_data_by_samples_and_features",
        [sample_ids, feature_ids, numerical_interpretation], 1, _callback, _errorCallback);
};

    this.get_expression_data_by_samples_and_features_async = function (sample_ids, feature_ids, numerical_interpretation, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_data_by_samples_and_features", [sample_ids, feature_ids, numerical_interpretation], 1, _callback, _error_callback);
    };

    this.get_expression_samples_data_by_series_ids = function (series_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_data_by_series_ids",
        [series_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_data_by_series_ids_async = function (series_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_data_by_series_ids", [series_ids], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_series_ids = function (series_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_series_ids",
        [series_ids], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_series_ids_async = function (series_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_series_ids", [series_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_data_by_experimental_unit_ids = function (experimental_unit_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_data_by_experimental_unit_ids",
        [experimental_unit_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_data_by_experimental_unit_ids_async = function (experimental_unit_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_data_by_experimental_unit_ids", [experimental_unit_ids], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_experimental_unit_ids = function (experimental_unit_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_experimental_unit_ids",
        [experimental_unit_ids], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_experimental_unit_ids_async = function (experimental_unit_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_experimental_unit_ids", [experimental_unit_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_data_by_experiment_meta_ids = function (experiment_meta_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_data_by_experiment_meta_ids",
        [experiment_meta_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_data_by_experiment_meta_ids_async = function (experiment_meta_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_data_by_experiment_meta_ids", [experiment_meta_ids], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_experiment_meta_ids = function (experiment_meta_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_experiment_meta_ids",
        [experiment_meta_ids], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_experiment_meta_ids_async = function (experiment_meta_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_experiment_meta_ids", [experiment_meta_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_data_by_strain_ids = function (strain_ids, sample_type, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_data_by_strain_ids",
        [strain_ids, sample_type], 1, _callback, _errorCallback);
};

    this.get_expression_samples_data_by_strain_ids_async = function (strain_ids, sample_type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_data_by_strain_ids", [strain_ids, sample_type], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_strain_ids = function (strain_ids, sample_type, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_strain_ids",
        [strain_ids, sample_type], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_strain_ids_async = function (strain_ids, sample_type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_strain_ids", [strain_ids, sample_type], 1, _callback, _error_callback);
    };

    this.get_expression_samples_data_by_genome_ids = function (genome_ids, sample_type, wild_type_only, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_data_by_genome_ids",
        [genome_ids, sample_type, wild_type_only], 1, _callback, _errorCallback);
};

    this.get_expression_samples_data_by_genome_ids_async = function (genome_ids, sample_type, wild_type_only, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_data_by_genome_ids", [genome_ids, sample_type, wild_type_only], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_genome_ids = function (genome_ids, sample_type, wild_type_only, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_genome_ids",
        [genome_ids, sample_type, wild_type_only], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_genome_ids_async = function (genome_ids, sample_type, wild_type_only, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_genome_ids", [genome_ids, sample_type, wild_type_only], 1, _callback, _error_callback);
    };

    this.get_expression_samples_data_by_ontology_ids = function (ontology_ids, and_or, genome_id, sample_type, wild_type_only, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_data_by_ontology_ids",
        [ontology_ids, and_or, genome_id, sample_type, wild_type_only], 1, _callback, _errorCallback);
};

    this.get_expression_samples_data_by_ontology_ids_async = function (ontology_ids, and_or, genome_id, sample_type, wild_type_only, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_data_by_ontology_ids", [ontology_ids, and_or, genome_id, sample_type, wild_type_only], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_ontology_ids = function (ontology_ids, and_or, genome_id, sample_type, wild_type_only, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_ontology_ids",
        [ontology_ids, and_or, genome_id, sample_type, wild_type_only], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_ontology_ids_async = function (ontology_ids, and_or, genome_id, sample_type, wild_type_only, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_ontology_ids", [ontology_ids, and_or, genome_id, sample_type, wild_type_only], 1, _callback, _error_callback);
    };

    this.get_expression_data_by_feature_ids = function (feature_ids, sample_type, wild_type_only, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_data_by_feature_ids",
        [feature_ids, sample_type, wild_type_only], 1, _callback, _errorCallback);
};

    this.get_expression_data_by_feature_ids_async = function (feature_ids, sample_type, wild_type_only, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_data_by_feature_ids", [feature_ids, sample_type, wild_type_only], 1, _callback, _error_callback);
    };

    this.compare_samples = function (numerators_data_mapping, denominators_data_mapping, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.compare_samples",
        [numerators_data_mapping, denominators_data_mapping], 1, _callback, _errorCallback);
};

    this.compare_samples_async = function (numerators_data_mapping, denominators_data_mapping, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.compare_samples", [numerators_data_mapping, denominators_data_mapping], 1, _callback, _error_callback);
    };

    this.compare_samples_vs_default_controls = function (numerator_sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.compare_samples_vs_default_controls",
        [numerator_sample_ids], 1, _callback, _errorCallback);
};

    this.compare_samples_vs_default_controls_async = function (numerator_sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.compare_samples_vs_default_controls", [numerator_sample_ids], 1, _callback, _error_callback);
    };

    this.compare_samples_vs_the_average = function (numerator_sample_ids, denominator_sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.compare_samples_vs_the_average",
        [numerator_sample_ids, denominator_sample_ids], 1, _callback, _errorCallback);
};

    this.compare_samples_vs_the_average_async = function (numerator_sample_ids, denominator_sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.compare_samples_vs_the_average", [numerator_sample_ids, denominator_sample_ids], 1, _callback, _error_callback);
    };

    this.get_on_off_calls = function (sample_comparison_mapping, off_threshold, on_threshold, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_on_off_calls",
        [sample_comparison_mapping, off_threshold, on_threshold], 1, _callback, _errorCallback);
};

    this.get_on_off_calls_async = function (sample_comparison_mapping, off_threshold, on_threshold, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_on_off_calls", [sample_comparison_mapping, off_threshold, on_threshold], 1, _callback, _error_callback);
    };

    this.get_top_changers = function (sample_comparison_mapping, direction, count, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_top_changers",
        [sample_comparison_mapping, direction, count], 1, _callback, _errorCallback);
};

    this.get_top_changers_async = function (sample_comparison_mapping, direction, count, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_top_changers", [sample_comparison_mapping, direction, count], 1, _callback, _error_callback);
    };

    this.get_expression_samples_titles = function (sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_titles",
        [sample_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_titles_async = function (sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_titles", [sample_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_descriptions = function (sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_descriptions",
        [sample_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_descriptions_async = function (sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_descriptions", [sample_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_molecules = function (sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_molecules",
        [sample_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_molecules_async = function (sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_molecules", [sample_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_types = function (sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_types",
        [sample_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_types_async = function (sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_types", [sample_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_external_source_ids = function (sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_external_source_ids",
        [sample_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_external_source_ids_async = function (sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_external_source_ids", [sample_ids], 1, _callback, _error_callback);
    };

    this.get_expression_samples_original_log2_medians = function (sample_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_samples_original_log2_medians",
        [sample_ids], 1, _callback, _errorCallback);
};

    this.get_expression_samples_original_log2_medians_async = function (sample_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_samples_original_log2_medians", [sample_ids], 1, _callback, _error_callback);
    };

    this.get_expression_series_titles = function (series_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_series_titles",
        [series_ids], 1, _callback, _errorCallback);
};

    this.get_expression_series_titles_async = function (series_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_series_titles", [series_ids], 1, _callback, _error_callback);
    };

    this.get_expression_series_summaries = function (series_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_series_summaries",
        [series_ids], 1, _callback, _errorCallback);
};

    this.get_expression_series_summaries_async = function (series_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_series_summaries", [series_ids], 1, _callback, _error_callback);
    };

    this.get_expression_series_designs = function (series_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_series_designs",
        [series_ids], 1, _callback, _errorCallback);
};

    this.get_expression_series_designs_async = function (series_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_series_designs", [series_ids], 1, _callback, _error_callback);
    };

    this.get_expression_series_external_source_ids = function (series_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_series_external_source_ids",
        [series_ids], 1, _callback, _errorCallback);
};

    this.get_expression_series_external_source_ids_async = function (series_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_series_external_source_ids", [series_ids], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_sample_external_source_ids = function (external_source_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_sample_external_source_ids",
        [external_source_ids], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_sample_external_source_ids_async = function (external_source_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_sample_external_source_ids", [external_source_ids], 1, _callback, _error_callback);
    };

    this.get_expression_sample_ids_by_platform_external_source_ids = function (external_source_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_platform_external_source_ids",
        [external_source_ids], 1, _callback, _errorCallback);
};

    this.get_expression_sample_ids_by_platform_external_source_ids_async = function (external_source_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_sample_ids_by_platform_external_source_ids", [external_source_ids], 1, _callback, _error_callback);
    };

    this.get_expression_series_ids_by_series_external_source_ids = function (external_source_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_series_ids_by_series_external_source_ids",
        [external_source_ids], 1, _callback, _errorCallback);
};

    this.get_expression_series_ids_by_series_external_source_ids_async = function (external_source_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_series_ids_by_series_external_source_ids", [external_source_ids], 1, _callback, _error_callback);
    };

    this.get_GEO_GSE = function (gse_input_id, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_GEO_GSE",
        [gse_input_id], 1, _callback, _errorCallback);
};

    this.get_GEO_GSE_async = function (gse_input_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_GEO_GSE", [gse_input_id], 1, _callback, _error_callback);
    };

    this.get_expression_float_data_table_by_samples_and_features = function (sample_ids, feature_ids, numerical_interpretation, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_float_data_table_by_samples_and_features",
        [sample_ids, feature_ids, numerical_interpretation], 1, _callback, _errorCallback);
};

    this.get_expression_float_data_table_by_samples_and_features_async = function (sample_ids, feature_ids, numerical_interpretation, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_float_data_table_by_samples_and_features", [sample_ids, feature_ids, numerical_interpretation], 1, _callback, _error_callback);
    };

    this.get_expression_float_data_table_by_genome = function (genome_id, numerical_interpretation, _callback, _errorCallback) {
    return json_call_ajax("KBaseExpression.get_expression_float_data_table_by_genome",
        [genome_id, numerical_interpretation], 1, _callback, _errorCallback);
};

    this.get_expression_float_data_table_by_genome_async = function (genome_id, numerical_interpretation, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseExpression.get_expression_float_data_table_by_genome", [genome_id, numerical_interpretation], 1, _callback, _error_callback);
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





function KBaseGeneFamilies(url, auth, auth_cb) {

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
        _url = "https://kbase.us/services/gene_families";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.search_domains = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseGeneFamilies.search_domains",
        [params], 1, _callback, _errorCallback);
};

    this.search_domains_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseGeneFamilies.search_domains", [params], 1, _callback, _error_callback);
    };

    this.version = function (_callback, _errorCallback) {
    return json_call_ajax("KBaseGeneFamilies.version",
        [], 1, _callback, _errorCallback);
};

    this.version_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseGeneFamilies.version", [], 1, _callback, _error_callback);
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





function KBaseNetworks(url, auth, auth_cb) {

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
    return json_call_ajax("KBaseNetworks.taxon2datasets",
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

    this.build_internal_network = function (dataset_ids, gene_ids, edge_types, _callback, _errorCallback) {
    return json_call_ajax("KBaseNetworks.build_internal_network",
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





function KBaseProteinStructure(url, auth, auth_cb) {

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


    this.lookup_pdb_by_md5 = function (input_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseProteinStructure.lookup_pdb_by_md5",
        [input_ids], 1, _callback, _errorCallback);
};

    this.lookup_pdb_by_md5_async = function (input_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseProteinStructure.lookup_pdb_by_md5", [input_ids], 1, _callback, _error_callback);
    };

    this.lookup_pdb_by_fid = function (feature_ids, _callback, _errorCallback) {
    return json_call_ajax("KBaseProteinStructure.lookup_pdb_by_fid",
        [feature_ids], 1, _callback, _errorCallback);
};

    this.lookup_pdb_by_fid_async = function (feature_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseProteinStructure.lookup_pdb_by_fid", [feature_ids], 1, _callback, _error_callback);
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





function KBaseTrees(url, auth, auth_cb) {

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

    this.import_tree_from_cds = function (selection, targetWsNameOrId, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.import_tree_from_cds",
        [selection, targetWsNameOrId], 1, _callback, _errorCallback);
};

    this.import_tree_from_cds_async = function (selection, targetWsNameOrId, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.import_tree_from_cds", [selection, targetWsNameOrId], 1, _callback, _error_callback);
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

    this.construct_multiple_alignment = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.construct_multiple_alignment",
        [params], 1, _callback, _errorCallback);
};

    this.construct_multiple_alignment_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.construct_multiple_alignment", [params], 1, _callback, _error_callback);
    };

    this.construct_tree_for_alignment = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.construct_tree_for_alignment",
        [params], 1, _callback, _errorCallback);
};

    this.construct_tree_for_alignment_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.construct_tree_for_alignment", [params], 1, _callback, _error_callback);
    };

    this.find_close_genomes = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.find_close_genomes",
        [params], 1, _callback, _errorCallback);
};

    this.find_close_genomes_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.find_close_genomes", [params], 1, _callback, _error_callback);
    };

    this.guess_taxonomy_path = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.guess_taxonomy_path",
        [params], 1, _callback, _errorCallback);
};

    this.guess_taxonomy_path_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.guess_taxonomy_path", [params], 1, _callback, _error_callback);
    };

    this.build_genome_set_from_tree = function (params, _callback, _errorCallback) {
    return json_call_ajax("KBaseTrees.build_genome_set_from_tree",
        [params], 1, _callback, _errorCallback);
};

    this.build_genome_set_from_tree_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KBaseTrees.build_genome_set_from_tree", [params], 1, _callback, _error_callback);
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





function KmerAnnotationByFigfam(url, auth, auth_cb) {

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
        _url = "http://10.0.16.184:7105";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.get_dataset_names = function (_callback, _errorCallback) {
    return json_call_ajax("KmerAnnotationByFigfam.get_dataset_names",
        [], 1, _callback, _errorCallback);
};

    this.get_dataset_names_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KmerAnnotationByFigfam.get_dataset_names", [], 1, _callback, _error_callback);
    };

    this.get_default_dataset_name = function (_callback, _errorCallback) {
    return json_call_ajax("KmerAnnotationByFigfam.get_default_dataset_name",
        [], 1, _callback, _errorCallback);
};

    this.get_default_dataset_name_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KmerAnnotationByFigfam.get_default_dataset_name", [], 1, _callback, _error_callback);
    };

    this.annotate_proteins = function (proteins, params, _callback, _errorCallback) {
    return json_call_ajax("KmerAnnotationByFigfam.annotate_proteins",
        [proteins, params], 1, _callback, _errorCallback);
};

    this.annotate_proteins_async = function (proteins, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KmerAnnotationByFigfam.annotate_proteins", [proteins, params], 1, _callback, _error_callback);
    };

    this.annotate_proteins_fasta = function (protein_fasta, params, _callback, _errorCallback) {
    return json_call_ajax("KmerAnnotationByFigfam.annotate_proteins_fasta",
        [protein_fasta, params], 1, _callback, _errorCallback);
};

    this.annotate_proteins_fasta_async = function (protein_fasta, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KmerAnnotationByFigfam.annotate_proteins_fasta", [protein_fasta, params], 1, _callback, _error_callback);
    };

    this.call_genes_in_dna = function (dna, params, _callback, _errorCallback) {
    return json_call_ajax("KmerAnnotationByFigfam.call_genes_in_dna",
        [dna, params], 1, _callback, _errorCallback);
};

    this.call_genes_in_dna_async = function (dna, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KmerAnnotationByFigfam.call_genes_in_dna", [dna, params], 1, _callback, _error_callback);
    };

    this.estimate_closest_genomes = function (proteins, dataset_name, _callback, _errorCallback) {
    return json_call_ajax("KmerAnnotationByFigfam.estimate_closest_genomes",
        [proteins, dataset_name], 1, _callback, _errorCallback);
};

    this.estimate_closest_genomes_async = function (proteins, dataset_name, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("KmerAnnotationByFigfam.estimate_closest_genomes", [proteins, dataset_name], 1, _callback, _error_callback);
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

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "http://localhost:7080";
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

    this.compose_app = function (app, _callback, _errorCallback) {
    return json_call_ajax("NarrativeJobService.compose_app",
        [app], 1, _callback, _errorCallback);
};

    this.compose_app_async = function (app, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeJobService.compose_app", [app], 1, _callback, _error_callback);
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
        _url = "https://kbase.us/services/narrative_method_store/rpc";
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

    this.status = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.status",
        [], 1, _callback, _errorCallback);
};

    this.status_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.status", [], 1, _callback, _error_callback);
    };

    this.list_categories = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_categories",
        [params], 4, _callback, _errorCallback);
};

    this.list_categories_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_categories", [params], 4, _callback, _error_callback);
    };

    this.get_category = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_category",
        [params], 1, _callback, _errorCallback);
};

    this.get_category_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_category", [params], 1, _callback, _error_callback);
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

    this.list_apps = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_apps",
        [params], 1, _callback, _errorCallback);
};

    this.list_apps_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_apps", [params], 1, _callback, _error_callback);
    };

    this.list_apps_full_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_apps_full_info",
        [params], 1, _callback, _errorCallback);
};

    this.list_apps_full_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_apps_full_info", [params], 1, _callback, _error_callback);
    };

    this.list_apps_spec = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_apps_spec",
        [params], 1, _callback, _errorCallback);
};

    this.list_apps_spec_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_apps_spec", [params], 1, _callback, _error_callback);
    };

    this.list_app_ids_and_names = function (_callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_app_ids_and_names",
        [], 1, _callback, _errorCallback);
};

    this.list_app_ids_and_names_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_app_ids_and_names", [], 1, _callback, _error_callback);
    };

    this.list_types = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.list_types",
        [params], 1, _callback, _errorCallback);
};

    this.list_types_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.list_types", [params], 1, _callback, _error_callback);
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

    this.get_app_brief_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_app_brief_info",
        [params], 1, _callback, _errorCallback);
};

    this.get_app_brief_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_app_brief_info", [params], 1, _callback, _error_callback);
    };

    this.get_app_full_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_app_full_info",
        [params], 1, _callback, _errorCallback);
};

    this.get_app_full_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_app_full_info", [params], 1, _callback, _error_callback);
    };

    this.get_app_spec = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_app_spec",
        [params], 1, _callback, _errorCallback);
};

    this.get_app_spec_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_app_spec", [params], 1, _callback, _error_callback);
    };

    this.get_type_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("NarrativeMethodStore.get_type_info",
        [params], 1, _callback, _errorCallback);
};

    this.get_type_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("NarrativeMethodStore.get_type_info", [params], 1, _callback, _error_callback);
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





function Transform(url, auth, auth_cb) {

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


    this.version = function (_callback, _errorCallback) {
    return json_call_ajax("Transform.version",
        [], 1, _callback, _errorCallback);
};

    this.version_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Transform.version", [], 1, _callback, _error_callback);
    };

    this.methods = function (query, _callback, _errorCallback) {
    return json_call_ajax("Transform.methods",
        [query], 1, _callback, _errorCallback);
};

    this.methods_async = function (query, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Transform.methods", [query], 1, _callback, _error_callback);
    };

    this.upload = function (args, _callback, _errorCallback) {
    return json_call_ajax("Transform.upload",
        [args], 1, _callback, _errorCallback);
};

    this.upload_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Transform.upload", [args], 1, _callback, _error_callback);
    };

    this.download = function (args, _callback, _errorCallback) {
    return json_call_ajax("Transform.download",
        [args], 1, _callback, _errorCallback);
};

    this.download_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Transform.download", [args], 1, _callback, _error_callback);
    };

    this.convert = function (args, _callback, _errorCallback) {
    return json_call_ajax("Transform.convert",
        [args], 1, _callback, _errorCallback);
};

    this.convert_async = function (args, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Transform.convert", [args], 1, _callback, _error_callback);
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





function UserProfile(url, auth, auth_cb) {

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
        _url = "https://kbase.us/services/user_profile/rpc";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.ver = function (_callback, _errorCallback) {
    return json_call_ajax("UserProfile.ver",
        [], 1, _callback, _errorCallback);
};

    this.ver_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserProfile.ver", [], 1, _callback, _error_callback);
    };

    this.filter_users = function (p, _callback, _errorCallback) {
    return json_call_ajax("UserProfile.filter_users",
        [p], 1, _callback, _errorCallback);
};

    this.filter_users_async = function (p, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserProfile.filter_users", [p], 1, _callback, _error_callback);
    };

    this.get_user_profile = function (usernames, _callback, _errorCallback) {
    return json_call_ajax("UserProfile.get_user_profile",
        [usernames], 1, _callback, _errorCallback);
};

    this.get_user_profile_async = function (usernames, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserProfile.get_user_profile", [usernames], 1, _callback, _error_callback);
    };

    this.set_user_profile = function (p, _callback, _errorCallback) {
    return json_call_ajax("UserProfile.set_user_profile",
        [p], 0, _callback, _errorCallback);
};

    this.set_user_profile_async = function (p, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserProfile.set_user_profile", [p], 0, _callback, _error_callback);
    };

    this.update_user_profile = function (p, _callback, _errorCallback) {
    return json_call_ajax("UserProfile.update_user_profile",
        [p], 0, _callback, _errorCallback);
};

    this.update_user_profile_async = function (p, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserProfile.update_user_profile", [p], 0, _callback, _error_callback);
    };

    this.lookup_globus_user = function (usernames, _callback, _errorCallback) {
    return json_call_ajax("UserProfile.lookup_globus_user",
        [usernames], 1, _callback, _errorCallback);
};

    this.lookup_globus_user_async = function (usernames, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserProfile.lookup_globus_user", [usernames], 1, _callback, _error_callback);
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


function fbaModelServices(url, auth, auth_cb) {

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


    this.get_models = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_models",
        [input], 1, _callback, _errorCallback);
};

    this.get_models_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_models", [input], 1, _callback, _error_callback);
    };

    this.get_fbas = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_fbas",
        [input], 1, _callback, _errorCallback);
};

    this.get_fbas_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_fbas", [input], 1, _callback, _error_callback);
    };

    this.get_gapfills = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_gapfills",
        [input], 1, _callback, _errorCallback);
};

    this.get_gapfills_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_gapfills", [input], 1, _callback, _error_callback);
    };

    this.get_gapgens = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_gapgens",
        [input], 1, _callback, _errorCallback);
};

    this.get_gapgens_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_gapgens", [input], 1, _callback, _error_callback);
    };

    this.get_reactions = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_reactions",
        [input], 1, _callback, _errorCallback);
};

    this.get_reactions_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_reactions", [input], 1, _callback, _error_callback);
    };

    this.get_compounds = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_compounds",
        [input], 1, _callback, _errorCallback);
};

    this.get_compounds_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_compounds", [input], 1, _callback, _error_callback);
    };

    this.get_alias = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_alias",
        [input], 1, _callback, _errorCallback);
};

    this.get_alias_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_alias", [input], 1, _callback, _error_callback);
    };

    this.get_aliassets = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_aliassets",
        [input], 1, _callback, _errorCallback);
};

    this.get_aliassets_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_aliassets", [input], 1, _callback, _error_callback);
    };

    this.get_media = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_media",
        [input], 1, _callback, _errorCallback);
};

    this.get_media_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_media", [input], 1, _callback, _error_callback);
    };

    this.get_biochemistry = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_biochemistry",
        [input], 1, _callback, _errorCallback);
};

    this.get_biochemistry_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_biochemistry", [input], 1, _callback, _error_callback);
    };

    this.import_probanno = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_probanno",
        [input], 1, _callback, _errorCallback);
};

    this.import_probanno_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_probanno", [input], 1, _callback, _error_callback);
    };

    this.genome_object_to_workspace = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.genome_object_to_workspace",
        [input], 1, _callback, _errorCallback);
};

    this.genome_object_to_workspace_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.genome_object_to_workspace", [input], 1, _callback, _error_callback);
    };

    this.genome_to_workspace = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.genome_to_workspace",
        [input], 1, _callback, _errorCallback);
};

    this.genome_to_workspace_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.genome_to_workspace", [input], 1, _callback, _error_callback);
    };

    this.domains_to_workspace = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.domains_to_workspace",
        [input], 1, _callback, _errorCallback);
};

    this.domains_to_workspace_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.domains_to_workspace", [input], 1, _callback, _error_callback);
    };

    this.compute_domains = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.compute_domains",
        [params], 1, _callback, _errorCallback);
};

    this.compute_domains_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.compute_domains", [params], 1, _callback, _error_callback);
    };

    this.add_feature_translation = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.add_feature_translation",
        [input], 1, _callback, _errorCallback);
};

    this.add_feature_translation_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.add_feature_translation", [input], 1, _callback, _error_callback);
    };

    this.genome_to_fbamodel = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.genome_to_fbamodel",
        [input], 1, _callback, _errorCallback);
};

    this.genome_to_fbamodel_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.genome_to_fbamodel", [input], 1, _callback, _error_callback);
    };

    this.translate_fbamodel = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.translate_fbamodel",
        [input], 1, _callback, _errorCallback);
};

    this.translate_fbamodel_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.translate_fbamodel", [input], 1, _callback, _error_callback);
    };

    this.build_pangenome = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.build_pangenome",
        [input], 1, _callback, _errorCallback);
};

    this.build_pangenome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.build_pangenome", [input], 1, _callback, _error_callback);
    };

    this.genome_heatmap_from_pangenome = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.genome_heatmap_from_pangenome",
        [input], 1, _callback, _errorCallback);
};

    this.genome_heatmap_from_pangenome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.genome_heatmap_from_pangenome", [input], 1, _callback, _error_callback);
    };

    this.ortholog_family_from_pangenome = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.ortholog_family_from_pangenome",
        [input], 1, _callback, _errorCallback);
};

    this.ortholog_family_from_pangenome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.ortholog_family_from_pangenome", [input], 1, _callback, _error_callback);
    };

    this.pangenome_to_proteome_comparison = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.pangenome_to_proteome_comparison",
        [input], 1, _callback, _errorCallback);
};

    this.pangenome_to_proteome_comparison_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.pangenome_to_proteome_comparison", [input], 1, _callback, _error_callback);
    };

    this.import_fbamodel = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_fbamodel",
        [input], 1, _callback, _errorCallback);
};

    this.import_fbamodel_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_fbamodel", [input], 1, _callback, _error_callback);
    };

    this.export_fbamodel = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.export_fbamodel",
        [input], 1, _callback, _errorCallback);
};

    this.export_fbamodel_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.export_fbamodel", [input], 1, _callback, _error_callback);
    };

    this.export_object = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.export_object",
        [input], 1, _callback, _errorCallback);
};

    this.export_object_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.export_object", [input], 1, _callback, _error_callback);
    };

    this.export_genome = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.export_genome",
        [input], 1, _callback, _errorCallback);
};

    this.export_genome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.export_genome", [input], 1, _callback, _error_callback);
    };

    this.adjust_model_reaction = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.adjust_model_reaction",
        [input], 1, _callback, _errorCallback);
};

    this.adjust_model_reaction_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.adjust_model_reaction", [input], 1, _callback, _error_callback);
    };

    this.adjust_biomass_reaction = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.adjust_biomass_reaction",
        [input], 1, _callback, _errorCallback);
};

    this.adjust_biomass_reaction_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.adjust_biomass_reaction", [input], 1, _callback, _error_callback);
    };

    this.addmedia = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.addmedia",
        [input], 1, _callback, _errorCallback);
};

    this.addmedia_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.addmedia", [input], 1, _callback, _error_callback);
    };

    this.export_media = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.export_media",
        [input], 1, _callback, _errorCallback);
};

    this.export_media_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.export_media", [input], 1, _callback, _error_callback);
    };

    this.runfba = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.runfba",
        [input], 1, _callback, _errorCallback);
};

    this.runfba_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.runfba", [input], 1, _callback, _error_callback);
    };

    this.quantitative_optimization = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.quantitative_optimization",
        [input], 1, _callback, _errorCallback);
};

    this.quantitative_optimization_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.quantitative_optimization", [input], 1, _callback, _error_callback);
    };

    this.generate_model_stats = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.generate_model_stats",
        [input], 1, _callback, _errorCallback);
};

    this.generate_model_stats_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.generate_model_stats", [input], 1, _callback, _error_callback);
    };

    this.minimize_reactions = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.minimize_reactions",
        [input], 1, _callback, _errorCallback);
};

    this.minimize_reactions_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.minimize_reactions", [input], 1, _callback, _error_callback);
    };

    this.export_fba = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.export_fba",
        [input], 1, _callback, _errorCallback);
};

    this.export_fba_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.export_fba", [input], 1, _callback, _error_callback);
    };

    this.import_phenotypes = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_phenotypes",
        [input], 1, _callback, _errorCallback);
};

    this.import_phenotypes_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_phenotypes", [input], 1, _callback, _error_callback);
    };

    this.simulate_phenotypes = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.simulate_phenotypes",
        [input], 1, _callback, _errorCallback);
};

    this.simulate_phenotypes_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.simulate_phenotypes", [input], 1, _callback, _error_callback);
    };

    this.add_media_transporters = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.add_media_transporters",
        [input], 1, _callback, _errorCallback);
};

    this.add_media_transporters_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.add_media_transporters", [input], 1, _callback, _error_callback);
    };

    this.export_phenotypeSimulationSet = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.export_phenotypeSimulationSet",
        [input], 1, _callback, _errorCallback);
};

    this.export_phenotypeSimulationSet_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.export_phenotypeSimulationSet", [input], 1, _callback, _error_callback);
    };

    this.integrate_reconciliation_solutions = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.integrate_reconciliation_solutions",
        [input], 1, _callback, _errorCallback);
};

    this.integrate_reconciliation_solutions_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.integrate_reconciliation_solutions", [input], 1, _callback, _error_callback);
    };

    this.queue_runfba = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.queue_runfba",
        [input], 1, _callback, _errorCallback);
};

    this.queue_runfba_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.queue_runfba", [input], 1, _callback, _error_callback);
    };

    this.queue_gapfill_model = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.queue_gapfill_model",
        [input], 1, _callback, _errorCallback);
};

    this.queue_gapfill_model_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.queue_gapfill_model", [input], 1, _callback, _error_callback);
    };

    this.gapfill_model = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.gapfill_model",
        [input], 1, _callback, _errorCallback);
};

    this.gapfill_model_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.gapfill_model", [input], 1, _callback, _error_callback);
    };

    this.queue_gapgen_model = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.queue_gapgen_model",
        [input], 1, _callback, _errorCallback);
};

    this.queue_gapgen_model_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.queue_gapgen_model", [input], 1, _callback, _error_callback);
    };

    this.gapgen_model = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.gapgen_model",
        [input], 1, _callback, _errorCallback);
};

    this.gapgen_model_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.gapgen_model", [input], 1, _callback, _error_callback);
    };

    this.queue_wildtype_phenotype_reconciliation = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.queue_wildtype_phenotype_reconciliation",
        [input], 1, _callback, _errorCallback);
};

    this.queue_wildtype_phenotype_reconciliation_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.queue_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback);
    };

    this.queue_reconciliation_sensitivity_analysis = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.queue_reconciliation_sensitivity_analysis",
        [input], 1, _callback, _errorCallback);
};

    this.queue_reconciliation_sensitivity_analysis_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.queue_reconciliation_sensitivity_analysis", [input], 1, _callback, _error_callback);
    };

    this.queue_combine_wildtype_phenotype_reconciliation = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation",
        [input], 1, _callback, _errorCallback);
};

    this.queue_combine_wildtype_phenotype_reconciliation_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.queue_combine_wildtype_phenotype_reconciliation", [input], 1, _callback, _error_callback);
    };

    this.run_job = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.run_job",
        [input], 1, _callback, _errorCallback);
};

    this.run_job_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.run_job", [input], 1, _callback, _error_callback);
    };

    this.queue_job = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.queue_job",
        [input], 1, _callback, _errorCallback);
};

    this.queue_job_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.queue_job", [input], 1, _callback, _error_callback);
    };

    this.set_cofactors = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.set_cofactors",
        [input], 1, _callback, _errorCallback);
};

    this.set_cofactors_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.set_cofactors", [input], 1, _callback, _error_callback);
    };

    this.find_reaction_synonyms = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.find_reaction_synonyms",
        [input], 1, _callback, _errorCallback);
};

    this.find_reaction_synonyms_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.find_reaction_synonyms", [input], 1, _callback, _error_callback);
    };

    this.role_to_reactions = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.role_to_reactions",
        [params], 1, _callback, _errorCallback);
};

    this.role_to_reactions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.role_to_reactions", [params], 1, _callback, _error_callback);
    };

    this.reaction_sensitivity_analysis = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.reaction_sensitivity_analysis",
        [input], 1, _callback, _errorCallback);
};

    this.reaction_sensitivity_analysis_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.reaction_sensitivity_analysis", [input], 1, _callback, _error_callback);
    };

    this.filter_iterative_solutions = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.filter_iterative_solutions",
        [input], 1, _callback, _errorCallback);
};

    this.filter_iterative_solutions_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.filter_iterative_solutions", [input], 1, _callback, _error_callback);
    };

    this.delete_noncontributing_reactions = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.delete_noncontributing_reactions",
        [input], 1, _callback, _errorCallback);
};

    this.delete_noncontributing_reactions_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.delete_noncontributing_reactions", [input], 1, _callback, _error_callback);
    };

    this.annotate_workspace_Genome = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.annotate_workspace_Genome",
        [params], 1, _callback, _errorCallback);
};

    this.annotate_workspace_Genome_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.annotate_workspace_Genome", [params], 1, _callback, _error_callback);
    };

    this.gtf_to_genome = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.gtf_to_genome",
        [params], 1, _callback, _errorCallback);
};

    this.gtf_to_genome_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.gtf_to_genome", [params], 1, _callback, _error_callback);
    };

    this.fasta_to_ProteinSet = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.fasta_to_ProteinSet",
        [params], 1, _callback, _errorCallback);
};

    this.fasta_to_ProteinSet_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.fasta_to_ProteinSet", [params], 1, _callback, _error_callback);
    };

    this.ProteinSet_to_Genome = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.ProteinSet_to_Genome",
        [params], 1, _callback, _errorCallback);
};

    this.ProteinSet_to_Genome_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.ProteinSet_to_Genome", [params], 1, _callback, _error_callback);
    };

    this.fasta_to_ContigSet = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.fasta_to_ContigSet",
        [params], 1, _callback, _errorCallback);
};

    this.fasta_to_ContigSet_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.fasta_to_ContigSet", [params], 1, _callback, _error_callback);
    };

    this.ContigSet_to_Genome = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.ContigSet_to_Genome",
        [params], 1, _callback, _errorCallback);
};

    this.ContigSet_to_Genome_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.ContigSet_to_Genome", [params], 1, _callback, _error_callback);
    };

    this.probanno_to_genome = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.probanno_to_genome",
        [params], 1, _callback, _errorCallback);
};

    this.probanno_to_genome_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.probanno_to_genome", [params], 1, _callback, _error_callback);
    };

    this.get_mapping = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_mapping",
        [params], 1, _callback, _errorCallback);
};

    this.get_mapping_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_mapping", [params], 1, _callback, _error_callback);
    };

    this.subsystem_of_roles = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.subsystem_of_roles",
        [params], 1, _callback, _errorCallback);
};

    this.subsystem_of_roles_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.subsystem_of_roles", [params], 1, _callback, _error_callback);
    };

    this.adjust_mapping_role = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.adjust_mapping_role",
        [params], 1, _callback, _errorCallback);
};

    this.adjust_mapping_role_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.adjust_mapping_role", [params], 1, _callback, _error_callback);
    };

    this.adjust_mapping_complex = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.adjust_mapping_complex",
        [params], 1, _callback, _errorCallback);
};

    this.adjust_mapping_complex_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.adjust_mapping_complex", [params], 1, _callback, _error_callback);
    };

    this.adjust_mapping_subsystem = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.adjust_mapping_subsystem",
        [params], 1, _callback, _errorCallback);
};

    this.adjust_mapping_subsystem_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.adjust_mapping_subsystem", [params], 1, _callback, _error_callback);
    };

    this.get_template_model = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.get_template_model",
        [params], 1, _callback, _errorCallback);
};

    this.get_template_model_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.get_template_model", [params], 1, _callback, _error_callback);
    };

    this.import_template_fbamodel = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_template_fbamodel",
        [input], 1, _callback, _errorCallback);
};

    this.import_template_fbamodel_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_template_fbamodel", [input], 1, _callback, _error_callback);
    };

    this.adjust_template_reaction = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.adjust_template_reaction",
        [params], 1, _callback, _errorCallback);
};

    this.adjust_template_reaction_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.adjust_template_reaction", [params], 1, _callback, _error_callback);
    };

    this.adjust_template_biomass = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.adjust_template_biomass",
        [params], 1, _callback, _errorCallback);
};

    this.adjust_template_biomass_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.adjust_template_biomass", [params], 1, _callback, _error_callback);
    };

    this.add_stimuli = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.add_stimuli",
        [params], 1, _callback, _errorCallback);
};

    this.add_stimuli_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.add_stimuli", [params], 1, _callback, _error_callback);
    };

    this.import_regulatory_model = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_regulatory_model",
        [params], 1, _callback, _errorCallback);
};

    this.import_regulatory_model_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_regulatory_model", [params], 1, _callback, _error_callback);
    };

    this.compare_models = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.compare_models",
        [params], 1, _callback, _errorCallback);
};

    this.compare_models_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.compare_models", [params], 1, _callback, _error_callback);
    };

    this.compare_genomes = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.compare_genomes",
        [params], 1, _callback, _errorCallback);
};

    this.compare_genomes_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.compare_genomes", [params], 1, _callback, _error_callback);
    };

    this.import_metagenome_annotation = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_metagenome_annotation",
        [params], 1, _callback, _errorCallback);
};

    this.import_metagenome_annotation_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_metagenome_annotation", [params], 1, _callback, _error_callback);
    };

    this.models_to_community_model = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.models_to_community_model",
        [params], 1, _callback, _errorCallback);
};

    this.models_to_community_model_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.models_to_community_model", [params], 1, _callback, _error_callback);
    };

    this.metagenome_to_fbamodels = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.metagenome_to_fbamodels",
        [params], 1, _callback, _errorCallback);
};

    this.metagenome_to_fbamodels_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.metagenome_to_fbamodels", [params], 1, _callback, _error_callback);
    };

    this.import_expression = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_expression",
        [input], 1, _callback, _errorCallback);
};

    this.import_expression_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_expression", [input], 1, _callback, _error_callback);
    };

    this.import_regulome = function (input, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_regulome",
        [input], 1, _callback, _errorCallback);
};

    this.import_regulome_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_regulome", [input], 1, _callback, _error_callback);
    };

    this.create_promconstraint = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.create_promconstraint",
        [params], 1, _callback, _errorCallback);
};

    this.create_promconstraint_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.create_promconstraint", [params], 1, _callback, _error_callback);
    };

    this.add_biochemistry_compounds = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.add_biochemistry_compounds",
        [params], 1, _callback, _errorCallback);
};

    this.add_biochemistry_compounds_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.add_biochemistry_compounds", [params], 1, _callback, _error_callback);
    };

    this.update_object_references = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.update_object_references",
        [params], 1, _callback, _errorCallback);
};

    this.update_object_references_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.update_object_references", [params], 1, _callback, _error_callback);
    };

    this.add_reactions = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.add_reactions",
        [params], 1, _callback, _errorCallback);
};

    this.add_reactions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.add_reactions", [params], 1, _callback, _error_callback);
    };

    this.remove_reactions = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.remove_reactions",
        [params], 1, _callback, _errorCallback);
};

    this.remove_reactions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.remove_reactions", [params], 1, _callback, _error_callback);
    };

    this.modify_reactions = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.modify_reactions",
        [params], 1, _callback, _errorCallback);
};

    this.modify_reactions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.modify_reactions", [params], 1, _callback, _error_callback);
    };

    this.add_features = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.add_features",
        [params], 1, _callback, _errorCallback);
};

    this.add_features_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.add_features", [params], 1, _callback, _error_callback);
    };

    this.remove_features = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.remove_features",
        [params], 1, _callback, _errorCallback);
};

    this.remove_features_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.remove_features", [params], 1, _callback, _error_callback);
    };

    this.modify_features = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.modify_features",
        [params], 1, _callback, _errorCallback);
};

    this.modify_features_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.modify_features", [params], 1, _callback, _error_callback);
    };

    this.import_trainingset = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.import_trainingset",
        [params], 1, _callback, _errorCallback);
};

    this.import_trainingset_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.import_trainingset", [params], 1, _callback, _error_callback);
    };

    this.preload_trainingset = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.preload_trainingset",
        [params], 1, _callback, _errorCallback);
};

    this.preload_trainingset_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.preload_trainingset", [params], 1, _callback, _error_callback);
    };

    this.build_classifier = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.build_classifier",
        [params], 1, _callback, _errorCallback);
};

    this.build_classifier_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.build_classifier", [params], 1, _callback, _error_callback);
    };

    this.classify_genomes = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.classify_genomes",
        [params], 1, _callback, _errorCallback);
};

    this.classify_genomes_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.classify_genomes", [params], 1, _callback, _error_callback);
    };

    this.build_tissue_model = function (params, _callback, _errorCallback) {
    return json_call_ajax("fbaModelServices.build_tissue_model",
        [params], 1, _callback, _errorCallback);
};

    this.build_tissue_model_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("fbaModelServices.build_tissue_model", [params], 1, _callback, _error_callback);
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





function MEME(url, auth, auth_cb) {

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


    this.find_motifs_with_meme = function (sequenceSet, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.find_motifs_with_meme",
        [sequenceSet, params], 1, _callback, _errorCallback);
};

    this.find_motifs_with_meme_async = function (sequenceSet, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.find_motifs_with_meme", [sequenceSet, params], 1, _callback, _error_callback);
    };

    this.find_motifs_with_meme_from_ws = function (ws_name, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.find_motifs_with_meme_from_ws",
        [ws_name, params], 1, _callback, _errorCallback);
};

    this.find_motifs_with_meme_from_ws_async = function (ws_name, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.find_motifs_with_meme_from_ws", [ws_name, params], 1, _callback, _error_callback);
    };

    this.find_motifs_with_meme_job_from_ws = function (ws_name, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.find_motifs_with_meme_job_from_ws",
        [ws_name, params], 1, _callback, _errorCallback);
};

    this.find_motifs_with_meme_job_from_ws_async = function (ws_name, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.find_motifs_with_meme_job_from_ws", [ws_name, params], 1, _callback, _error_callback);
    };

    this.compare_motifs_with_tomtom = function (query, target, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.compare_motifs_with_tomtom",
        [query, target, params], 1, _callback, _errorCallback);
};

    this.compare_motifs_with_tomtom_async = function (query, target, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.compare_motifs_with_tomtom", [query, target, params], 1, _callback, _error_callback);
    };

    this.compare_motifs_with_tomtom_by_collection = function (query, target, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.compare_motifs_with_tomtom_by_collection",
        [query, target, params], 1, _callback, _errorCallback);
};

    this.compare_motifs_with_tomtom_by_collection_async = function (query, target, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.compare_motifs_with_tomtom_by_collection", [query, target, params], 1, _callback, _error_callback);
    };

    this.compare_motifs_with_tomtom_by_collection_from_ws = function (ws_name, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.compare_motifs_with_tomtom_by_collection_from_ws",
        [ws_name, params], 1, _callback, _errorCallback);
};

    this.compare_motifs_with_tomtom_by_collection_from_ws_async = function (ws_name, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.compare_motifs_with_tomtom_by_collection_from_ws", [ws_name, params], 1, _callback, _error_callback);
    };

    this.compare_motifs_with_tomtom_job_by_collection_from_ws = function (ws_name, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.compare_motifs_with_tomtom_job_by_collection_from_ws",
        [ws_name, params], 1, _callback, _errorCallback);
};

    this.compare_motifs_with_tomtom_job_by_collection_from_ws_async = function (ws_name, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.compare_motifs_with_tomtom_job_by_collection_from_ws", [ws_name, params], 1, _callback, _error_callback);
    };

    this.find_sites_with_mast = function (query, target, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.find_sites_with_mast",
        [query, target, params], 1, _callback, _errorCallback);
};

    this.find_sites_with_mast_async = function (query, target, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.find_sites_with_mast", [query, target, params], 1, _callback, _error_callback);
    };

    this.find_sites_with_mast_by_collection = function (query, target, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.find_sites_with_mast_by_collection",
        [query, target, params], 1, _callback, _errorCallback);
};

    this.find_sites_with_mast_by_collection_async = function (query, target, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.find_sites_with_mast_by_collection", [query, target, params], 1, _callback, _error_callback);
    };

    this.find_sites_with_mast_by_collection_from_ws = function (ws_name, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.find_sites_with_mast_by_collection_from_ws",
        [ws_name, params], 1, _callback, _errorCallback);
};

    this.find_sites_with_mast_by_collection_from_ws_async = function (ws_name, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.find_sites_with_mast_by_collection_from_ws", [ws_name, params], 1, _callback, _error_callback);
    };

    this.find_sites_with_mast_job_by_collection_from_ws = function (ws_name, params, _callback, _errorCallback) {
    return json_call_ajax("MEME.find_sites_with_mast_job_by_collection_from_ws",
        [ws_name, params], 1, _callback, _errorCallback);
};

    this.find_sites_with_mast_job_by_collection_from_ws_async = function (ws_name, params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.find_sites_with_mast_job_by_collection_from_ws", [ws_name, params], 1, _callback, _error_callback);
    };

    this.get_pspm_collection_from_meme_result = function (meme_run_result, _callback, _errorCallback) {
    return json_call_ajax("MEME.get_pspm_collection_from_meme_result",
        [meme_run_result], 1, _callback, _errorCallback);
};

    this.get_pspm_collection_from_meme_result_async = function (meme_run_result, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.get_pspm_collection_from_meme_result", [meme_run_result], 1, _callback, _error_callback);
    };

    this.get_pspm_collection_from_meme_result_from_ws = function (ws_name, input_id, _callback, _errorCallback) {
    return json_call_ajax("MEME.get_pspm_collection_from_meme_result_from_ws",
        [ws_name, input_id], 1, _callback, _errorCallback);
};

    this.get_pspm_collection_from_meme_result_from_ws_async = function (ws_name, input_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.get_pspm_collection_from_meme_result_from_ws", [ws_name, input_id], 1, _callback, _error_callback);
    };

    this.get_pspm_collection_from_meme_result_job_from_ws = function (ws_name, input_id, _callback, _errorCallback) {
    return json_call_ajax("MEME.get_pspm_collection_from_meme_result_job_from_ws",
        [ws_name, input_id], 1, _callback, _errorCallback);
};

    this.get_pspm_collection_from_meme_result_job_from_ws_async = function (ws_name, input_id, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("MEME.get_pspm_collection_from_meme_result_job_from_ws", [ws_name, input_id], 1, _callback, _error_callback);
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





function ProbabilisticAnnotation(url, auth, auth_cb) {

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


    this.version = function (_callback, _errorCallback) {
    return json_call_ajax("ProbabilisticAnnotation.version",
        [], 1, _callback, _errorCallback);
};

    this.version_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("ProbabilisticAnnotation.version", [], 1, _callback, _error_callback);
    };

    this.annotate = function (input, _callback, _errorCallback) {
    return json_call_ajax("ProbabilisticAnnotation.annotate",
        [input], 1, _callback, _errorCallback);
};

    this.annotate_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("ProbabilisticAnnotation.annotate", [input], 1, _callback, _error_callback);
    };

    this.calculate = function (input, _callback, _errorCallback) {
    return json_call_ajax("ProbabilisticAnnotation.calculate",
        [input], 1, _callback, _errorCallback);
};

    this.calculate_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("ProbabilisticAnnotation.calculate", [input], 1, _callback, _error_callback);
    };

    this.get_rxnprobs = function (input, _callback, _errorCallback) {
    return json_call_ajax("ProbabilisticAnnotation.get_rxnprobs",
        [input], 1, _callback, _errorCallback);
};

    this.get_rxnprobs_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("ProbabilisticAnnotation.get_rxnprobs", [input], 1, _callback, _error_callback);
    };

    this.get_probanno = function (input, _callback, _errorCallback) {
    return json_call_ajax("ProbabilisticAnnotation.get_probanno",
        [input], 1, _callback, _errorCallback);
};

    this.get_probanno_async = function (input, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("ProbabilisticAnnotation.get_probanno", [input], 1, _callback, _error_callback);
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



/*
  Shock javascript client library

  This library allows the interaction with the Shock via javascript methods. The normal usage would be to first initialize the library with an authentication token and Shock url. It can then be used to retrieve, delete, update and create nodes in Shock. Refer to the function section below for details on the provided function calls. The upload of files uses chunking and automatically resumes failed uploads when the same file is uploaded again by the same user.

  FUNCTIONS

  constructor (params)
    initialize the Data Store client with: new ShockClient({ token: "myTokenString", url: "urlToShock", chunkSize: 2097152 })

  get_node
    retrieve a node from SHOCK with shockClient.get_node("myNodeId", retCallback, )
    The node-id parameter is mandatory. This function returns a promise that is fulfilled once the node is retrieved. The callback parameters in case they're defined should be functions.

  get_nodes
    retrieve all nodes for the current authentication setting with: shockClient.get_all_nodes({"my_prop": "my_value"}, retCallback, errorCallback)
    This function returns a promise that is fulfilled once the nodes are retrieved. The callback parameters in case they're defined should be functions.

  delete_node
    delete a node from SHOCK with shockClient.get_node("myNodeId", retCallback, errorCallback)
    The node-id parameter is mandatory. This function returns a promise that is fulfilled once the node is deleted. The callback parameters in case they're defined should be functions.

  upload_node
    create a new node with: shockClient.upload_node(file, shockNodeId, searchToResume, retCallback, errorCallback, cancelCallback)
    The input parameter is a file from input form field. If no file is to be added to the node, this parameter must be null. The callback parameters in case they're defined should be functions.

  update_node
    update the attributes of an existing node with: shockClient.update_node("myNodeId", attributes, retCallback, errorCallback)
    The attributes parameter must be a JSON structure of metadata that is to be added to the node. Existing values will be replaced. This function returns a promise that is fulfilled once the node is updated. The callback parameters in case they're defined should be functions.

  This code was built based on https://github.com/MG-RAST/Shock/blob/master/libs/shock.js .
  Authors: Tobias Paczian <paczian@mcs.anl.gov>, Roman Sutormin <rsutormin@lbl.gov> .
*/
function ShockClient(params) {
    
    var self = this;

    self.url = "https://kbase.us/services/shock-api/";
    self.auth_header = {};
    self.chunkSize = 2097152;
    
	if (params.url)
	    self.url = params.url;

	if (params.token)
		self.auth_header = {'Authorization': 'OAuth '+params.token};

	if (params.chunkSize)
		self.chunkSize = params.chunkSize;
	
    self.get_node = function (node, ret, errorCallback) {
    	var url = self.url+'/node/'+node
    	var promise = jQuery.Deferred();
    	
    	jQuery.ajax(url, {
    		success: function (data) {
    			var retval = null;
    			if (data != null && data.hasOwnProperty('data')) {
    			    if (data.error != null) {
    			    	if (errorCallback)
        					errorCallback(data);
    			    } else {
    	    			ret(data.data);
    			    }
    			} else {
    				if (errorCallback)
    					errorCallback("error: invalid return structure from SHOCK server");
    			}
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

    self.get_nodes = function (filters, ret, errorCallback) {
    	var url = self.url+'/node';
    	if (filters) {
    		url += "?query";
    		for (var key in filters) {
    			url += "&" + encodeURIComponent(key) + "=" + encodeURIComponent(filters[key]);
    		}
    	}
    	var promise = jQuery.Deferred();
    	jQuery.ajax(url, {
    		success: function(data) {
    			var retval = null;
    			if (data != null && data.hasOwnProperty('data')) {
    				if (data.error != null) {
        				if (errorCallback)
        					errorCallback(data.error);
    				} else {
    	    			ret(data.data);
    				}
    			} else {
    				if (errorCallback)
    					errorCallback(data);
    			}
    			promise.resolve();
    		},
    		error: function(jqXHR, error) {
				if (errorCallback)
					errorCallback(error);
    			promise.resolve();
    		},
    		headers: self.auth_header
    	});

    	return promise;
    };

    self.get_node_acls = function (id, ret, errorCallback) {
    	var url = self.url+'/node/' + id + "/acl/";
    	var promise = jQuery.Deferred();
    	jQuery.ajax(url, {
    		success: function(data) {
    			if (data.data) {
    				ret(data.data);
    			} else {
    				if (errorCallback)
    					errorCallback(data.error);
    			}
    			promise.resolve();
    		},
    		error: function(jqXHR, error) {
				if (errorCallback)
					errorCallback(error);
    			promise.resolve();
    		},
    		headers: self.auth_header
    	});

    	return promise;
    };

    self.delete_node = function (id, ret, errorCallback) {
    	var url = self.url+'/node';
    	var promise = jQuery.Deferred();
    	jQuery.ajax(url + "/" + id, {
    		success: function (data) {
    			ret(true);
    			promise.resolve();
    		},
    		error: function(jqXHR, error){
    			if (errorCallback)
					errorCallback(error);
    			promise.resolve();
    		},
    		headers: self.auth_header,
    		type: "DELETE"
    	});
    	return promise;
    };

    self.update_node = function (node, attr, ret, errorCallback) {
    	var url = self.url+'/node';
    	var promise = jQuery.Deferred();
	    var aFileParts = [ JSON.stringify(attr) ];
	    var oMyBlob = new Blob(aFileParts, { "type" : "text\/json" });
	    var fd = new FormData();
	    fd.append('attributes', oMyBlob);
	    jQuery.ajax(url +  "/" + node, {
	    	contentType: false,
	    	processData: false,
	    	data: fd,
	    	success: function(data){
		    	ret(data.data);
		    	promise.resolve();
	    	},
	    	error: function(jqXHR, error){
	    		if (errorCallback)
					errorCallback(error);
		    	promise.resolve();
	    	},
	    	headers: self.auth_header,
	    	type: "PUT"
	    });
		return promise;
    };
    
    self.check_file = function(file, ret, errorCallback) {
    	var promise = jQuery.Deferred();
	    var fsize = file.size;
	    var ftime = file.lastModifiedDate.getTime();
	    var filters = {'file_size': fsize, 'file_time': ftime, 'file_name': file.name, 'limit': 1};
	    self.get_nodes(filters, function (data) {
	    	ret(data.length == 0 ? null : data[0]);
	    	promise.resolve();
	    }, function(error) {
	    	if (errorCallback)
	    		errorCallback(error);
	    	promise.resolve();
	    });
	    return promise;
    };
    
    self.loadNext = function (file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback) {
		if (cancelCallback && cancelCallback())
			return;
	    var fileReader = new FileReader();
	    fileReader.onload = function(e) {
    		if (cancelCallback && cancelCallback())
    			return;
		    var fd = new FormData();
		    var oMyBlob = new Blob([e.target.result], { "type" : file.type });
		    fd.append(currentChunk+1, oMyBlob);
		    var lastChunk = (currentChunk + 1) * chunkSize >= file.size;
		    var incomplete_attr = { 
		    		"incomplete": (lastChunk ? "0" : "1"), 
		    		"file_size": "" + file.size, 
		    		"file_name": file.name,
		    		"file_time": "" + file.lastModifiedDate.getTime(), 
		    		"chunks": "" + (currentChunk+1),
		    		"chunk_size": "" + chunkSize};
		    var aFileParts = [ JSON.stringify(incomplete_attr) ];
		    var oMyBlob2 = new Blob(aFileParts, { "type" : "text\/json" });
		    fd.append('attributes', oMyBlob2);
		    jQuery.ajax(url, {
		    	contentType: false,
		    	processData: false,
		    	data: fd,
		    	success: function(data) {
		    		if (cancelCallback && cancelCallback())
		    			return;
		    		currentChunk++;
					var uploaded_size = Math.min(file.size, currentChunk * chunkSize);
				    ret({file_size: file.size, uploaded_size: uploaded_size, node_id: incompleteId});
				    if ((currentChunk * chunkSize) >= file.size) {
			    		promise.resolve();
				    } else {
				    	self.loadNext(file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback);
				    }
		    	},
		    	error: function(jqXHR, error) {
		    		if (errorCallback)
		    			errorCallback(error);
		    		promise.resolve();
		    	},
		    	headers: self.auth_header,
		    	type: "PUT"
		    });
		};
	    fileReader.onerror = function () {
    		if (errorCallback)
    			errorCallback("error during upload at chunk "+currentChunk+".");
		    promise.resolve();
		};
	    var start = currentChunk * chunkSize;
	    if (start < file.size) {
	    	var end = (start + chunkSize >= file.size) ? file.size : start + chunkSize;
	    	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice;
	    	fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));
	    } else {
		    ret({file_size: file.size, uploaded_size: file.size, node_id: incompleteId});
	    }
    };
    
    /**
     * Sends to ret function callback objects like {file_size: ..., uploaded_size: ..., node_id: ...}
     * for showing progress info in UI. Parameter "shockNodeId" is optional but if you know it
     * you can resume faster.
     */
    self.upload_node = function (file, shockNodeId, searchToResume, ret, errorCallback, cancelCallback) {
    	var url = self.url+'/node';
    	var promise = jQuery.Deferred();
	    // if this is a chunked upload, check if it needs to be resumed

    	function searchForIncomplete() {
    		if (searchToResume) {
    			self.check_file(file, function (incomplete) {
    				if (cancelCallback && cancelCallback())
    					return;
    				processNode(incomplete);
    			}, function(error){
    				if (errorCallback)
    					errorCallback(error);
    				promise.resolve();
    			});
    		} else {
    			processNode(null);
    		}
    	}
    	
    	function processNode(incomplete) {
    		if (incomplete != null) {
    			var incompleteId = incomplete["id"];
    			url += "/" + incomplete["id"];
    			var currentChunk = 0;
    			if (incomplete["attributes"]["incomplete_chunks"]) {
    				currentChunk = parseInt(incomplete["attributes"]["incomplete_chunks"]);
    			} else if (incomplete["attributes"]["chunks"]) {
    				currentChunk = parseInt(incomplete["attributes"]["chunks"]);
    			}
    			var chunkSize = self.chunkSize;
    			if (incomplete["attributes"]["chunk_size"])
    				chunkSize = parseInt(incomplete["attributes"]["chunk_size"]);
    			var uploadedSize = Math.min(file.size, currentChunk * chunkSize);
    			ret({file_size: file.size, uploaded_size: uploadedSize, node_id: incompleteId});
    			self.loadNext(file, url, promise, currentChunk, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback);
    		} else {
    			var chunkSize = self.chunkSize;
    			var chunks = Math.ceil(file.size / chunkSize);
    			var incomplete_attr = { "incomplete": "1", "file_size": "" + file.size, "file_name": file.name,
    					"file_time": "" + file.lastModifiedDate.getTime(), "chunk_size": "" + chunkSize};
    			var aFileParts = [ JSON.stringify(incomplete_attr) ];
    			var oMyBlob = new Blob(aFileParts, { "type" : "text\/json" });
    			var fd = new FormData();
    			fd.append('attributes', oMyBlob);
    			fd.append('parts', chunks);
    			jQuery.ajax(url, {
    				contentType: false,
    				processData: false,
    				data: fd,
    				success: function(data) {
    		    		if (cancelCallback && cancelCallback())
    		    			return;
    					var incompleteId = data.data.id;
    					var uploaded_size = 0;
    					ret({file_size: file.size, uploaded_size: uploaded_size, node_id: incompleteId});
    					url += "/" + data.data.id;
    					self.loadNext(file, url, promise, 0, chunks, incompleteId, chunkSize, ret, errorCallback, cancelCallback);
    				},
    				error: function(jqXHR, error){
    					if (errorCallback)
    						errorCallback(error);
    					promise.resolve();
    				},
    				headers: self.auth_header,
    				type: "POST"
    			});
    		}
    	}
    	
    	if (shockNodeId) {
    		self.get_node(shockNodeId, function(data) {
				if (cancelCallback && cancelCallback())
					return;
				if (data && 
						data["attributes"]["file_size"] === ("" + file.size) && 
						data["attributes"]["file_name"] === file.name &&
    					data["attributes"]["file_time"] === ("" + file.lastModifiedDate.getTime())) {
					processNode(data);
				} else {
					searchForIncomplete();
				}
    		}, function(error) {
				searchForIncomplete();
    		});
    	} else {
    		searchForIncomplete();
    	}
    	
	    return promise;
    };
    
    /**
     * Changes file.name prop indide shock node. Use this func at the end of chunk upload.
     */
    self.change_node_file_name = function (shockNodeId, fileName, ret, errorCallback) {
    	var url = self.url+'/node/' + shockNodeId;
    	var promise = jQuery.Deferred();
    	var fd = new FormData();
    	fd.append('file_name', fileName);
    	jQuery.ajax(url, {
    		contentType: false,
    		processData: false,
    		data: fd,
    		success: function(data) {
    			ret(data);
    			promise.resolve();
    		},
    		error: function(jqXHR, error){
    			if (errorCallback)
    				errorCallback(error);
    			promise.resolve();
    		},
    		headers: self.auth_header,
    		type: "PUT"
    	});
    };

}


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

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "https://kbase.us/services/userandjobstate/";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.ver = function (_callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.ver",
        [], 1, _callback, _errorCallback);
};

    this.ver_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.ver", [], 1, _callback, _error_callback);
    };

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

    this.has_state = function (service, key, auth, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.has_state",
        [service, key, auth], 1, _callback, _errorCallback);
};

    this.has_state_async = function (service, key, auth, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.has_state", [service, key, auth], 1, _callback, _error_callback);
    };

    this.get_has_state = function (service, key, auth, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_has_state",
        [service, key, auth], 2, _callback, _errorCallback);
};

    this.get_has_state_async = function (service, key, auth, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_has_state", [service, key, auth], 2, _callback, _error_callback);
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

    this.share_job = function (job, users, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.share_job",
        [job, users], 0, _callback, _errorCallback);
};

    this.share_job_async = function (job, users, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.share_job", [job, users], 0, _callback, _error_callback);
    };

    this.unshare_job = function (job, users, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.unshare_job",
        [job, users], 0, _callback, _errorCallback);
};

    this.unshare_job_async = function (job, users, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.unshare_job", [job, users], 0, _callback, _error_callback);
    };

    this.get_job_owner = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_job_owner",
        [job], 1, _callback, _errorCallback);
};

    this.get_job_owner_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_job_owner", [job], 1, _callback, _error_callback);
    };

    this.get_job_shared = function (job, _callback, _errorCallback) {
    return json_call_ajax("UserAndJobState.get_job_shared",
        [job], 1, _callback, _errorCallback);
};

    this.get_job_shared_async = function (job, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("UserAndJobState.get_job_shared", [job], 1, _callback, _error_callback);
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





function Workspace(url, auth, auth_cb) {

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
        _url = "https://kbase.us/services/ws/";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;


    this.ver = function (_callback, _errorCallback) {
    return json_call_ajax("Workspace.ver",
        [], 1, _callback, _errorCallback);
};

    this.ver_async = function (_callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.ver", [], 1, _callback, _error_callback);
    };

    this.create_workspace = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.create_workspace",
        [params], 1, _callback, _errorCallback);
};

    this.create_workspace_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.create_workspace", [params], 1, _callback, _error_callback);
    };

    this.alter_workspace_metadata = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.alter_workspace_metadata",
        [params], 0, _callback, _errorCallback);
};

    this.alter_workspace_metadata_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.alter_workspace_metadata", [params], 0, _callback, _error_callback);
    };

    this.clone_workspace = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.clone_workspace",
        [params], 1, _callback, _errorCallback);
};

    this.clone_workspace_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.clone_workspace", [params], 1, _callback, _error_callback);
    };

    this.lock_workspace = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.lock_workspace",
        [wsi], 1, _callback, _errorCallback);
};

    this.lock_workspace_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.lock_workspace", [wsi], 1, _callback, _error_callback);
    };

    this.get_workspacemeta = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_workspacemeta",
        [params], 1, _callback, _errorCallback);
};

    this.get_workspacemeta_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_workspacemeta", [params], 1, _callback, _error_callback);
    };

    this.get_workspace_info = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_workspace_info",
        [wsi], 1, _callback, _errorCallback);
};

    this.get_workspace_info_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_workspace_info", [wsi], 1, _callback, _error_callback);
    };

    this.get_workspace_description = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_workspace_description",
        [wsi], 1, _callback, _errorCallback);
};

    this.get_workspace_description_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_workspace_description", [wsi], 1, _callback, _error_callback);
    };

    this.set_permissions = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.set_permissions",
        [params], 0, _callback, _errorCallback);
};

    this.set_permissions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.set_permissions", [params], 0, _callback, _error_callback);
    };

    this.set_global_permission = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.set_global_permission",
        [params], 0, _callback, _errorCallback);
};

    this.set_global_permission_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.set_global_permission", [params], 0, _callback, _error_callback);
    };

    this.set_workspace_description = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.set_workspace_description",
        [params], 0, _callback, _errorCallback);
};

    this.set_workspace_description_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.set_workspace_description", [params], 0, _callback, _error_callback);
    };

    this.get_permissions = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_permissions",
        [wsi], 1, _callback, _errorCallback);
};

    this.get_permissions_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_permissions", [wsi], 1, _callback, _error_callback);
    };

    this.save_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.save_object",
        [params], 1, _callback, _errorCallback);
};

    this.save_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.save_object", [params], 1, _callback, _error_callback);
    };

    this.save_objects = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.save_objects",
        [params], 1, _callback, _errorCallback);
};

    this.save_objects_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.save_objects", [params], 1, _callback, _error_callback);
    };

    this.get_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object",
        [params], 1, _callback, _errorCallback);
};

    this.get_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object", [params], 1, _callback, _error_callback);
    };

    this.get_object_provenance = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_provenance",
        [object_ids], 1, _callback, _errorCallback);
};

    this.get_object_provenance_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_provenance", [object_ids], 1, _callback, _error_callback);
    };

    this.get_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_objects",
        [object_ids], 1, _callback, _errorCallback);
};

    this.get_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_objects", [object_ids], 1, _callback, _error_callback);
    };

    this.get_object_subset = function (sub_object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_subset",
        [sub_object_ids], 1, _callback, _errorCallback);
};

    this.get_object_subset_async = function (sub_object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_subset", [sub_object_ids], 1, _callback, _error_callback);
    };

    this.get_object_history = function (object, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_history",
        [object], 1, _callback, _errorCallback);
};

    this.get_object_history_async = function (object, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_history", [object], 1, _callback, _error_callback);
    };

    this.list_referencing_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_referencing_objects",
        [object_ids], 1, _callback, _errorCallback);
};

    this.list_referencing_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_referencing_objects", [object_ids], 1, _callback, _error_callback);
    };

    this.list_referencing_object_counts = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_referencing_object_counts",
        [object_ids], 1, _callback, _errorCallback);
};

    this.list_referencing_object_counts_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_referencing_object_counts", [object_ids], 1, _callback, _error_callback);
    };

    this.get_referenced_objects = function (ref_chains, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_referenced_objects",
        [ref_chains], 1, _callback, _errorCallback);
};

    this.get_referenced_objects_async = function (ref_chains, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_referenced_objects", [ref_chains], 1, _callback, _error_callback);
    };

    this.list_workspaces = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_workspaces",
        [params], 1, _callback, _errorCallback);
};

    this.list_workspaces_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_workspaces", [params], 1, _callback, _error_callback);
    };

    this.list_workspace_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_workspace_info",
        [params], 1, _callback, _errorCallback);
};

    this.list_workspace_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_workspace_info", [params], 1, _callback, _error_callback);
    };

    this.list_workspace_objects = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_workspace_objects",
        [params], 1, _callback, _errorCallback);
};

    this.list_workspace_objects_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_workspace_objects", [params], 1, _callback, _error_callback);
    };

    this.list_objects = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_objects",
        [params], 1, _callback, _errorCallback);
};

    this.list_objects_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_objects", [params], 1, _callback, _error_callback);
    };

    this.get_objectmeta = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_objectmeta",
        [params], 1, _callback, _errorCallback);
};

    this.get_objectmeta_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_objectmeta", [params], 1, _callback, _error_callback);
    };

    this.get_object_info = function (object_ids, includeMetadata, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_info",
        [object_ids, includeMetadata], 1, _callback, _errorCallback);
};

    this.get_object_info_async = function (object_ids, includeMetadata, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_info", [object_ids, includeMetadata], 1, _callback, _error_callback);
    };

    this.get_object_info_new = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_object_info_new",
        [params], 1, _callback, _errorCallback);
};

    this.get_object_info_new_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_object_info_new", [params], 1, _callback, _error_callback);
    };

    this.rename_workspace = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.rename_workspace",
        [params], 1, _callback, _errorCallback);
};

    this.rename_workspace_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.rename_workspace", [params], 1, _callback, _error_callback);
    };

    this.rename_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.rename_object",
        [params], 1, _callback, _errorCallback);
};

    this.rename_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.rename_object", [params], 1, _callback, _error_callback);
    };

    this.copy_object = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.copy_object",
        [params], 1, _callback, _errorCallback);
};

    this.copy_object_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.copy_object", [params], 1, _callback, _error_callback);
    };

    this.revert_object = function (object, _callback, _errorCallback) {
    return json_call_ajax("Workspace.revert_object",
        [object], 1, _callback, _errorCallback);
};

    this.revert_object_async = function (object, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.revert_object", [object], 1, _callback, _error_callback);
    };

    this.hide_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.hide_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.hide_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.hide_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.unhide_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.unhide_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.unhide_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.unhide_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.delete_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.delete_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.delete_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.delete_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.undelete_objects = function (object_ids, _callback, _errorCallback) {
    return json_call_ajax("Workspace.undelete_objects",
        [object_ids], 0, _callback, _errorCallback);
};

    this.undelete_objects_async = function (object_ids, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.undelete_objects", [object_ids], 0, _callback, _error_callback);
    };

    this.delete_workspace = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.delete_workspace",
        [wsi], 0, _callback, _errorCallback);
};

    this.delete_workspace_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.delete_workspace", [wsi], 0, _callback, _error_callback);
    };

    this.undelete_workspace = function (wsi, _callback, _errorCallback) {
    return json_call_ajax("Workspace.undelete_workspace",
        [wsi], 0, _callback, _errorCallback);
};

    this.undelete_workspace_async = function (wsi, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.undelete_workspace", [wsi], 0, _callback, _error_callback);
    };

    this.request_module_ownership = function (mod, _callback, _errorCallback) {
    return json_call_ajax("Workspace.request_module_ownership",
        [mod], 0, _callback, _errorCallback);
};

    this.request_module_ownership_async = function (mod, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.request_module_ownership", [mod], 0, _callback, _error_callback);
    };

    this.register_typespec = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.register_typespec",
        [params], 1, _callback, _errorCallback);
};

    this.register_typespec_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.register_typespec", [params], 1, _callback, _error_callback);
    };

    this.register_typespec_copy = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.register_typespec_copy",
        [params], 1, _callback, _errorCallback);
};

    this.register_typespec_copy_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.register_typespec_copy", [params], 1, _callback, _error_callback);
    };

    this.release_module = function (mod, _callback, _errorCallback) {
    return json_call_ajax("Workspace.release_module",
        [mod], 1, _callback, _errorCallback);
};

    this.release_module_async = function (mod, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.release_module", [mod], 1, _callback, _error_callback);
    };

    this.list_modules = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_modules",
        [params], 1, _callback, _errorCallback);
};

    this.list_modules_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_modules", [params], 1, _callback, _error_callback);
    };

    this.list_module_versions = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_module_versions",
        [params], 1, _callback, _errorCallback);
};

    this.list_module_versions_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_module_versions", [params], 1, _callback, _error_callback);
    };

    this.get_module_info = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_module_info",
        [params], 1, _callback, _errorCallback);
};

    this.get_module_info_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_module_info", [params], 1, _callback, _error_callback);
    };

    this.get_jsonschema = function (type, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_jsonschema",
        [type], 1, _callback, _errorCallback);
};

    this.get_jsonschema_async = function (type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_jsonschema", [type], 1, _callback, _error_callback);
    };

    this.translate_from_MD5_types = function (md5_types, _callback, _errorCallback) {
    return json_call_ajax("Workspace.translate_from_MD5_types",
        [md5_types], 1, _callback, _errorCallback);
};

    this.translate_from_MD5_types_async = function (md5_types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.translate_from_MD5_types", [md5_types], 1, _callback, _error_callback);
    };

    this.translate_to_MD5_types = function (sem_types, _callback, _errorCallback) {
    return json_call_ajax("Workspace.translate_to_MD5_types",
        [sem_types], 1, _callback, _errorCallback);
};

    this.translate_to_MD5_types_async = function (sem_types, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.translate_to_MD5_types", [sem_types], 1, _callback, _error_callback);
    };

    this.get_type_info = function (type, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_type_info",
        [type], 1, _callback, _errorCallback);
};

    this.get_type_info_async = function (type, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_type_info", [type], 1, _callback, _error_callback);
    };

    this.get_all_type_info = function (mod, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_all_type_info",
        [mod], 1, _callback, _errorCallback);
};

    this.get_all_type_info_async = function (mod, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_all_type_info", [mod], 1, _callback, _error_callback);
    };

    this.get_func_info = function (func, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_func_info",
        [func], 1, _callback, _errorCallback);
};

    this.get_func_info_async = function (func, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_func_info", [func], 1, _callback, _error_callback);
    };

    this.get_all_func_info = function (mod, _callback, _errorCallback) {
    return json_call_ajax("Workspace.get_all_func_info",
        [mod], 1, _callback, _errorCallback);
};

    this.get_all_func_info_async = function (mod, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.get_all_func_info", [mod], 1, _callback, _error_callback);
    };

    this.grant_module_ownership = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.grant_module_ownership",
        [params], 0, _callback, _errorCallback);
};

    this.grant_module_ownership_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.grant_module_ownership", [params], 0, _callback, _error_callback);
    };

    this.remove_module_ownership = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.remove_module_ownership",
        [params], 0, _callback, _errorCallback);
};

    this.remove_module_ownership_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.remove_module_ownership", [params], 0, _callback, _error_callback);
    };

    this.list_all_types = function (params, _callback, _errorCallback) {
    return json_call_ajax("Workspace.list_all_types",
        [params], 1, _callback, _errorCallback);
};

    this.list_all_types_async = function (params, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.list_all_types", [params], 1, _callback, _error_callback);
    };

    this.administer = function (command, _callback, _errorCallback) {
    return json_call_ajax("Workspace.administer",
        [command], 1, _callback, _errorCallback);
};

    this.administer_async = function (command, _callback, _error_callback) {
        deprecationWarning();
        return json_call_ajax("Workspace.administer", [command], 1, _callback, _error_callback);
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


