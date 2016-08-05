

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

     this.get_taxon = function (ref, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
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
                [ref], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_assembly = function (ref, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
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
                [ref], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_types = function (ref, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
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
                [ref], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_type_descriptions = function (ref, feature_type_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_type_list === 'function')
            throw 'Argument feature_type_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_type_descriptions", 
                [ref, feature_type_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_type_counts = function (ref, feature_type_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_type_list === 'function')
            throw 'Argument feature_type_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_type_counts", 
                [ref, feature_type_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_ids = function (ref, filters, group_type, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof filters === 'function')
            throw 'Argument filters can not be a function';
        if (typeof group_type === 'function')
            throw 'Argument group_type can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 3+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(3+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_ids", 
                [ref, filters, group_type], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_features = function (ref, feature_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_id_list === 'function')
            throw 'Argument feature_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_features", 
                [ref, feature_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_proteins = function (ref, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
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
                [ref], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_locations = function (ref, feature_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_id_list === 'function')
            throw 'Argument feature_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_locations", 
                [ref, feature_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_publications = function (ref, feature_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_id_list === 'function')
            throw 'Argument feature_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_publications", 
                [ref, feature_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_dna = function (ref, feature_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_id_list === 'function')
            throw 'Argument feature_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_dna", 
                [ref, feature_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_functions = function (ref, feature_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_id_list === 'function')
            throw 'Argument feature_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_functions", 
                [ref, feature_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_feature_aliases = function (ref, feature_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof feature_id_list === 'function')
            throw 'Argument feature_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_feature_aliases", 
                [ref, feature_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_cds_by_gene = function (ref, gene_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof gene_id_list === 'function')
            throw 'Argument gene_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_cds_by_gene", 
                [ref, gene_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_cds_by_mrna = function (ref, mrna_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof mrna_id_list === 'function')
            throw 'Argument mrna_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_cds_by_mrna", 
                [ref, mrna_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_gene_by_cds = function (ref, cds_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof cds_id_list === 'function')
            throw 'Argument cds_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_gene_by_cds", 
                [ref, cds_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_gene_by_mrna = function (ref, mrna_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof mrna_id_list === 'function')
            throw 'Argument mrna_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_gene_by_mrna", 
                [ref, mrna_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_mrna_by_cds = function (ref, cds_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof cds_id_list === 'function')
            throw 'Argument cds_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_by_cds", 
                [ref, cds_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_mrna_by_gene = function (ref, gene_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof gene_id_list === 'function')
            throw 'Argument gene_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_by_gene", 
                [ref, gene_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_mrna_exons = function (ref, mrna_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof mrna_id_list === 'function')
            throw 'Argument mrna_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_exons", 
                [ref, mrna_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_mrna_utrs = function (ref, mrna_id_list, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
        if (typeof mrna_id_list === 'function')
            throw 'Argument mrna_id_list can not be a function';
        if (_callback && typeof _callback !== 'function')
            throw 'Argument _callback must be a function if defined';
        if (_errorCallback && typeof _errorCallback !== 'function')
            throw 'Argument _errorCallback must be a function if defined';
        if (typeof arguments === 'function' && arguments.length > 2+2)
            throw 'Too many arguments ('+arguments.length+' instead of '+(2+2)+')';
        var deferred = $.Deferred();
        json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name' : "GenomeAnnotationAPI", 
                'version' : self.service_version}], 1, function(service_status_ret) {
            srv_url = service_status_ret['url'];
            json_call_ajax(srv_url, "GenomeAnnotationAPI.get_mrna_utrs", 
                [ref, mrna_id_list], 1, _callback, _errorCallback, null, deferred);
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
 
     this.get_summary = function (ref, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
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
                [ref], 1, _callback, _errorCallback, null, deferred);
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
 
     this.save_summary = function (ref, _callback, _errorCallback) {
        if (typeof ref === 'function')
            throw 'Argument ref can not be a function';
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
                [ref], 1, _callback, _errorCallback, null, deferred);
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


 