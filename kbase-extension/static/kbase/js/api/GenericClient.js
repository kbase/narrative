/*global define*/
/*jslint white:true,browser:true*/

define([
    'jquery',
    'bluebird'
], function (
    $,
    Promise
    ) {
    'use strict';
    function GenericClient(url, auth, auth_cb, use_url_lookup, timeout, async_job_check_time_ms) {
        var self = this;

        this.url = url;
        var lookup_url = url;
        this.use_url_lookup = use_url_lookup;
        var _use_url_lookup = (typeof use_url_lookup !== 'undefined') &&
            (use_url_lookup !== null) ? use_url_lookup : true;

        this.timeout = timeout;
        var _timeout = timeout;

        this.async_job_check_time_ms = async_job_check_time_ms;
        if (!this.async_job_check_time_ms) {
            this.async_job_check_time_ms = 5000;
        }

        var _auth = auth ? auth : {'token': '', 'user_id': ''};
        var _auth_cb = auth_cb;


        this.sync_call = function (service_method, param_list, _callback, _errorCallback, service_version) {
            if (Object.prototype.toString.call(param_list) !== '[object Array]') {
                throw 'Argument param_list must be an array';
            }
            if (_callback && typeof _callback !== 'function') {
                throw 'Argument _callback must be a function if defined';
            }
            if (_errorCallback && typeof _errorCallback !== 'function') {
                throw 'Argument _errorCallback must be a function if defined';
            }
            if (typeof arguments === 'function' && arguments.length > 5) {
                throw 'Too many arguments (' + arguments.length + ' instead of 5)';
            }
            var _url = lookup_url;
            if (_use_url_lookup) {
                var deferred = $.Deferred();
                var module_name = service_method.split('.')[0];
                console.log('looking up service module', module_name, service_version);
                json_call_ajax(_url, 'ServiceWizard.get_service_status', [{
                        module_name: module_name,
                        version: service_version || null
                    }], 1, function (service_status_ret) {
                    _url = service_status_ret.url;
                    json_call_ajax(_url, service_method, param_list, 0, _callback, _errorCallback, deferred);
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
            } else {
                return json_call_ajax(_url, service_method, param_list, 0, _callback, _errorCallback);
            }
        };


        /*
         * JSON call using jQuery method.
         */
        function json_call_ajax(_url, method, params, numRets, callback, errorCallback, deferred) {
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
                version: "1.1",
                id: String(Math.random()).slice(2)
            };

            var beforeSend = null;
            var token = (_auth_cb && typeof _auth_cb === 'function') ? _auth_cb()
                : (_auth.token ? _auth.token : null);
            if (token !== null) {
                beforeSend = function (xhr) {
                    xhr.setRequestHeader("Authorization", token);
                };
            }

            var xhr = $.ajax({
                url: _url,
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
                            url: _url,
                            resp: data
                        });
                        return;
                    }
                    deferred.resolve(result);
                },
                error: function (xhr, textStatus, errorThrown) {
                    var errObj = JSON.parse(xhr.responseText);
                    console.error('ERR?', errObj , xhr);
                    console.error('ERR!', errObj.error.error.replace('\n', '<br>'));
                    console.error('URL', _url, _use_url_lookup);
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
            return Promise.resolve(promise);
        }
    }
    return GenericClient;
});
