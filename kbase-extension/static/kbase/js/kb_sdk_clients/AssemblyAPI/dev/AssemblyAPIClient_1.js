/*global define */
/*jslint white:true,browser:true,nomen:true,multivar:true*/
define(['jquery', 'bluebird'], function ($, Promise) {
    'use strict';

    function AssemblyAPI(url, auth, auth_cb, timeout, async_job_check_time_ms, service_version) {
        var self = this;

        this.url = url;
        var _url = url;

        this.timeout = timeout;
        var _timeout = timeout;

        this.async_job_check_time_ms = async_job_check_time_ms;
        if (!this.async_job_check_time_ms) {
            this.async_job_check_time_ms = 100;
        }
        this.async_job_check_time_scale_percent = 150;
        this.async_job_check_max_time_ms = 300000;  // 5 minutes
        this.service_version = service_version;
        if (!this.service_version) {
            this.service_version = 'dev';
        }

        if (typeof _url !== 'string' || _url.length === 0) {
            _url = 'https://kbase.us/services/service_wizard';
        }
        var _auth = auth ? auth : {'token': '', 'user_id': ''};
        var _auth_cb = auth_cb;

        this.get_assembly_id = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_assembly_id',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_genome_annotations = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_genome_annotations',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_external_source_info = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_external_source_info',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_stats = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_stats',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_number_contigs = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_number_contigs',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_gc_content = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_gc_content',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_dna_size = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_dna_size',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_contig_ids = function (ref, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 1 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (1 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_contig_ids',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_contig_lengths = function (ref, contig_id_list, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (typeof contig_id_list === 'function') {
                    throw new Error('Argument contig_id_list can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 2 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (2 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_contig_lengths',
                        [ref, contig_id_list], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_contig_gc_content = function (ref, contig_id_list, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (typeof contig_id_list === 'function') {
                    throw new Error('Argument contig_id_list can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 2 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (2 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_contig_gc_content',
                        [ref, contig_id_list], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.get_contigs = function (ref, contig_id_list, _callback, _errorCallback) {
            return Promise.try(function () {
                if (typeof ref === 'function') {
                    throw new Error('Argument ref can not be a function');
                }
                if (typeof contig_id_list === 'function') {
                    throw new Error('Argument contig_id_list can not be a function');
                }
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 2 + 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of ' + (2 + 2) + ')');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.get_contigs',
                        [ref, contig_id_list], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };

        this.status = function (_callback, _errorCallback) {
            return Promise.try(function () {
                if (_callback && typeof _callback !== 'function') {
                    throw new Error('Argument _callback must be a function if defined');
                }
                if (_errorCallback && typeof _errorCallback !== 'function') {
                    throw new Error('Argument _errorCallback must be a function if defined');
                }
                if (typeof arguments === 'function' && arguments.length > 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of 2)');
                }
                var deferred = $.Deferred();
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{'module_name': 'AssemblyAPI',
                        'version': self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret['url'];
                    json_call_ajax(srv_url, 'AssemblyAPI.status',
                        [], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
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
            });
        };


        /*
         * JSON call using jQuery method.
         */
        function json_call_ajax(srv_url, method, params, numRets, callback, errorCallback, json_rpc_context, deferred) {
            if (!deferred) {
                deferred = $.Deferred();
            }

            if (typeof callback === 'function') {
                deferred.done(callback);
            }

            if (typeof errorCallback === 'function') {
                deferred.fail(errorCallback);
            }

            var rpc = {
                params: params,
                method: method,
                version: '1.1',
                id: String(Math.random()).slice(2)
            };
            if (json_rpc_context) {
                rpc['context'] = json_rpc_context;
            }

            var beforeSend = null;
            var token = (_auth_cb && typeof _auth_cb === 'function') ? _auth_cb()
                : (_auth.token ? _auth.token : null);
            if (token !== null) {
                beforeSend = function (xhr) {
                    xhr.setRequestHeader('Authorization', token);
                };
            }

            $.ajax({
                url: srv_url,
                dataType: 'text',
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
                            error = 'Unknown error - ' + xhr.responseText;
                        }
                    } else {
                        error = 'Unknown Error';
                    }
                    deferred.reject({
                        status: 500,
                        error: error
                    });
                }
            });
        }
    }

    return AssemblyAPI;
});
