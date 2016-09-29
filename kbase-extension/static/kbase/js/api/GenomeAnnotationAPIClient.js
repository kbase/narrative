

function GenomeAnnotationAPI(url, auth, auth_cb, timeout, async_job_check_time_ms, service_version) {
    var self = this;

    this.url = url;
    var _url = url;

    this.timeout = timeout;
    var _timeout = timeout;
    
    this.async_job_check_time_ms = async_job_check_time_ms;
    if (!this.async_job_check_time_ms)
        this.async_job_check_time_ms = 100;
    this.async_job_check_time_scale_percent = 150;
    this.async_job_check_max_time_ms = 300000;  // 5 minutes
    this.service_version = service_version;
    if (!this.service_version)
        this.service_version = 'dev';

    if (typeof(_url) != "string" || _url.length == 0) {
        _url = "https://kbase.us/services/service_wizard";
    }
    var _auth = auth ? auth : { 'token' : '', 'user_id' : ''};
    var _auth_cb = auth_cb;

     this.get_taxon = function (inputs_get_taxon, _callback, _errorCallback) {
        if (typeof inputs_get_taxon === 'function')
            throw 'Argument inputs_get_taxon can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_taxon", 
                [inputs_get_taxon], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_assembly = function (inputs_get_assembly, _callback, _errorCallback) {
        if (typeof inputs_get_assembly === 'function')
            throw 'Argument inputs_get_assembly can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_assembly", 
                [inputs_get_assembly], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_types = function (inputs_get_feature_types, _callback, _errorCallback) {
        if (typeof inputs_get_feature_types === 'function')
            throw 'Argument inputs_get_feature_types can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_types", 
                [inputs_get_feature_types], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_type_descriptions = function (inputs_get_feature_type_descriptions, _callback, _errorCallback) {
        if (typeof inputs_get_feature_type_descriptions === 'function')
            throw 'Argument inputs_get_feature_type_descriptions can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_type_descriptions", 
                [inputs_get_feature_type_descriptions], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_type_counts = function (inputs_get_feature_type_counts, _callback, _errorCallback) {
        if (typeof inputs_get_feature_type_counts === 'function')
            throw 'Argument inputs_get_feature_type_counts can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_type_counts", 
                [inputs_get_feature_type_counts], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_ids = function (inputs_get_feature_ids, _callback, _errorCallback) {
        if (typeof inputs_get_feature_ids === 'function')
            throw 'Argument inputs_get_feature_ids can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_ids", 
                [inputs_get_feature_ids], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_features = function (inputs_get_features, _callback, _errorCallback) {
        if (typeof inputs_get_features === 'function')
            throw 'Argument inputs_get_features can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_features", 
                [inputs_get_features], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_features2 = function (params, _callback, _errorCallback) {
        if (typeof params === 'function')
            throw 'Argument params can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_features2", 
                [params], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_proteins = function (inputs_get_proteins, _callback, _errorCallback) {
        if (typeof inputs_get_proteins === 'function')
            throw 'Argument inputs_get_proteins can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_proteins", 
                [inputs_get_proteins], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_locations = function (inputs_get_feature_locations, _callback, _errorCallback) {
        if (typeof inputs_get_feature_locations === 'function')
            throw 'Argument inputs_get_feature_locations can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_locations", 
                [inputs_get_feature_locations], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_publications = function (inputs_get_feature_publications, _callback, _errorCallback) {
        if (typeof inputs_get_feature_publications === 'function')
            throw 'Argument inputs_get_feature_publications can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_publications", 
                [inputs_get_feature_publications], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_dna = function (inputs_get_feature_dna, _callback, _errorCallback) {
        if (typeof inputs_get_feature_dna === 'function')
            throw 'Argument inputs_get_feature_dna can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_dna", 
                [inputs_get_feature_dna], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_functions = function (inputs_get_feature_functions, _callback, _errorCallback) {
        if (typeof inputs_get_feature_functions === 'function')
            throw 'Argument inputs_get_feature_functions can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_functions", 
                [inputs_get_feature_functions], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_feature_aliases = function (inputs_get_feature_aliases, _callback, _errorCallback) {
        if (typeof inputs_get_feature_aliases === 'function')
            throw 'Argument inputs_get_feature_aliases can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_aliases", 
                [inputs_get_feature_aliases], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_cds_by_gene = function (inputs_get_cds_by_gene, _callback, _errorCallback) {
        if (typeof inputs_get_cds_by_gene === 'function')
            throw 'Argument inputs_get_cds_by_gene can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_cds_by_gene", 
                [inputs_get_cds_by_gene], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_cds_by_mrna = function (inputs_mrna_id_list, _callback, _errorCallback) {
        if (typeof inputs_mrna_id_list === 'function')
            throw 'Argument inputs_mrna_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_cds_by_mrna", 
                [inputs_mrna_id_list], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_gene_by_cds = function (inputs_get_gene_by_cds, _callback, _errorCallback) {
        if (typeof inputs_get_gene_by_cds === 'function')
            throw 'Argument inputs_get_gene_by_cds can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_gene_by_cds", 
                [inputs_get_gene_by_cds], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_gene_by_mrna = function (inputs_get_gene_by_mrna, _callback, _errorCallback) {
        if (typeof inputs_get_gene_by_mrna === 'function')
            throw 'Argument inputs_get_gene_by_mrna can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_gene_by_mrna", 
                [inputs_get_gene_by_mrna], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_mrna_by_cds = function (inputs_get_mrna_by_cds, _callback, _errorCallback) {
        if (typeof inputs_get_mrna_by_cds === 'function')
            throw 'Argument inputs_get_mrna_by_cds can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_by_cds", 
                [inputs_get_mrna_by_cds], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_mrna_by_gene = function (inputs_get_mrna_by_gene, _callback, _errorCallback) {
        if (typeof inputs_get_mrna_by_gene === 'function')
            throw 'Argument inputs_get_mrna_by_gene can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_by_gene", 
                [inputs_get_mrna_by_gene], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_mrna_exons = function (inputs_get_mrna_exons, _callback, _errorCallback) {
        if (typeof inputs_get_mrna_exons === 'function')
            throw 'Argument inputs_get_mrna_exons can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_exons", 
                [inputs_get_mrna_exons], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_mrna_utrs = function (inputs_get_mrna_utrs, _callback, _errorCallback) {
        if (typeof inputs_get_mrna_utrs === 'function')
            throw 'Argument inputs_get_mrna_utrs can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_utrs", 
                [inputs_get_mrna_utrs], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_summary = function (inputs_get_summary, _callback, _errorCallback) {
        if (typeof inputs_get_summary === 'function')
            throw 'Argument inputs_get_summary can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_summary", 
                [inputs_get_summary], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.save_summary = function (inputs_save_summary, _callback, _errorCallback) {
        if (typeof inputs_save_summary === 'function')
            throw 'Argument inputs_save_summary can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.save_summary", 
                [inputs_save_summary], 2, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_combined_data = function (params, _callback, _errorCallback) {
        if (typeof params === 'function')
            throw 'Argument params can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_combined_data", 
                [params], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.get_genome_v1 = function (params, _callback, _errorCallback) {
        if (typeof params === 'function')
            throw 'Argument params can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_genome_v1", 
                [params], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
 
     this.save_one_genome_v1 = function (params, _callback, _errorCallback) {
        if (typeof params === 'function')
            throw 'Argument params can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 1+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(1+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.save_one_genome_v1", 
                [params], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };
  
    this.status = function (_callback, _errorCallback) {
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2)
            throw 'Too many arguments ('+arguments.length+' instead of 2)';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.status", 
                [], 1, _callback, _errorCallback, null, deferred);
        }, function(err) {
            if (_errorCallback) {
                _errorCallback(err);
            } else {
                deferred.reject({
                    status: 500,
                    error: err
                });
            }
        });
        return deferred;
    };


    /*
     * JSON call using jQuery method.
     */
    function json_call_ajax(srv_url, method, params, numRets, callback, errorCallback, json_rpc_context, deferred) {
        if (!deferred)
            deferred = $.Deferred();

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
        if (json_rpc_context)
            rpc['context'] = json_rpc_context;

        var beforeSend = null;
        var token = (_auth_cb && typeof _auth_cb === 'function') ? _auth_cb()
            : (_auth.token ? _auth.token : null);
        if (token != null) {
            beforeSend = function (xhr) {
                xhr.setRequestHeader("Authorization", token);
            }
        }

        var xhr = jQuery.ajax({
            url: srv_url,
            dataType: "text",
            type: 'POST',
            processData: false,
            data: JSON.stringify(rpc),
            beforeSend: beforeSend,
            timeout: _timeout,
            success: function (data, status, xhr) {
                var result;
                try {
                    var resp = JSON.parse(data);
                    result = (numRets === 1 ? resp.result[0] : resp.result);
                } catch (err) {
                    deferred.reject({
                        status: 503,
                        error: err,
                        url: srv_url,
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


 