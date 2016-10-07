/*global define */
/*jslint white:true,browser:true,jsnomen:true*/
define(['jquery', 'bluebird'], function ($, Promise) {
    'use strict';

    /*
     * A reponse which is invalid.
     * A valid response is most likely a non- or improper-JSON string
     * 
     */
    function InvalidResponseError(originalError, serviceWizardUrl, srv_url, data) {
        this.name = 'InvalidResponseError';
        this.originalError = originalError;
        this.serviceWizardUrl = serviceWizardUrl;
        this.apiUrl = srv_url;
        this.responseData = data;
    }
    InvalidResponseError.prototype = Object.create(Error);
    InvalidResponseError.prototype.constructor = InvalidResponseError;

    /*
     * An error returned by the http server (an http server error)
     */
    function ServerError(statusCode, statusText, serviceWizardUrl, srv_url, message) {
        this.name = 'ServerError';
        this.serviceWizardUrl = serviceWizardUrl;
        this.apiUrl = srv_url;
        this.message = message;
        this.statusCode = statusCode;
        this.statusText = statusText;
    }
    ServerError.prototype = Object.create(Error);
    ServerError.prototype.constructor = ServerError;

    /*
     * An error making the request
     */
    function RequestError(originalError) {
        this.error = 'RequestError';
        this.originalError = originalError;
        this.message = originalError.message;
    }
    RequestError.prototype = Object.create(Error);
    RequestError.prototype.constructor = RequestError;

    function TaxonAPI(serviceWizardUrl, auth, auth_cb, timeout, async_job_check_time_ms, service_version) {
        var self = this;

        this.serviceWizardUrl = serviceWizardUrl;
        this.timeout = timeout;

        this.service_version = service_version;
        if (!this.service_version) {
            this.service_version = 'dev';
        }

        // TODO: is this wise? Shouldn't the client just error out if the base
        // service discovery url is empty?
        if (typeof serviceWizardUrl !== 'string' || serviceWizardUrl.length === 0) {
            serviceWizardUrl = 'https://kbase.us/services/service_wizard';
        }
        var _auth = auth ? auth : {token: '', user_id: ''};
        var _auth_cb = auth_cb;

        this.get_parent = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_parent',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_children = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_children',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_genome_annotations',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_scientific_lineage = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_scientific_lineage',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_scientific_name = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_scientific_name',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_taxonomic_id = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_taxonomic_id',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_kingdom = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_kingdom',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_domain = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_domain',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_genetic_code = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_genetic_code',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_aliases = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_aliases',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_info = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_info',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_history = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_history',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_provenance = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_provenance',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_id = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_id',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_name = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_name',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                });
                return deferred;
            });
        };

        this.get_version = function (ref, _callback, _errorCallback) {
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
                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', [{module_name: 'TaxonAPI',
                        version: self.service_version}], 1, function (service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.get_version',
                        [ref], 1, _callback, _errorCallback, null, deferred);
                }, function (err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
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
                // TODO: this will never be true -- arguments is an array object.
                if (typeof arguments === 'function' && arguments.length > 2) {
                    throw new Error('Too many arguments (' + arguments.length + ' instead of 2)');
                }
                var deferred = $.Deferred();

                function success(service_status_ret) {
                    var srv_url = service_status_ret.url;
                    json_call_ajax(srv_url, 'TaxonAPI.status', [], 1, _callback, _errorCallback, null, deferred);
                }

                function error(err) {
                    if (_errorCallback) {
                        _errorCallback(err);
                    } else {
                        deferred.reject(new RequestError(err));
                    }
                }

                var params = [{
                    module_name: 'TaxonAPI',
                    version: self.service_version
                }];

                json_call_ajax(serviceWizardUrl, 'ServiceWizard.get_service_status', params, 1, success, error);
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
                rpc.context = json_rpc_context;
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
                timeout: timeout,
                success: function (data) {
                    try {
                        var resp = JSON.parse(data);
                        var result = (numRets === 1 ? resp.result[0] : resp.result);
                        deferred.resolve(result);
                    } catch (err) {
                        deferred.reject(new InvalidReponseError(err, serviceWizardUrl, srv_url, data));
                    }
                },
                error: function (xhr, textStatus, errorThrown) {
                    if (xhr.responseText) {
                        try {
                            var resp = JSON.parse(xhr.responseText);
                            // error = resp.error;
                            // This is an error response with a valid error json response.
                            // TODO: this should really never occur. A valid jsonrpc error
                            // response will be a normal response (200) with an error
                            // json payload.
                            // Still, lets honor this and issue a warning.
                            console.warning('Invalid JSON RPC error response', resp);
                            deferred.resolve(resp);
                        } catch (err) {
                            // A server error which is not valid JSON.
                            // This actually is the expected condition for a server error.
                            deferred.reject(new ServerError(xhr.status, xhr.statusText, serviceWizardUrl, srv_url, xhr.responseText));
                        }
                    } else {
                        deferred.reject(new ServerError(xhr.status, xhr.statusText, serviceWizardUrl, srv_url, 'Unknown Error'));
                    }
                }
            });
        }
    }

    return {
        TaxonAPI: TaxonAPI,
        InvalidResponseError: InvalidResponseError,
        ServerError: RequestError,
        RequestError: RequestError
    };
});