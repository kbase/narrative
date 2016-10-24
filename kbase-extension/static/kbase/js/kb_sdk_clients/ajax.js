/*global define */
/*jslint white: true */
define([
    'bluebird',
    './exceptions'
], function (Promise, exceptions) {
    'use strict';

    function post(options) {
        var timeout = options.timeout || 60000,
            startTime = new Date();
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new exceptions.ClientException(xhr.status, 'Client Error', xhr));
                } else if (xhr.status >= 500) {
                    reject(new ServerException(xhr.status, 'Server Error', xhr));
                } else {

                    // var buf = new Uint8Array(xhr.response);
                    try {
                        resolve(xhr.response);
                    } catch (ex) {
                        reject(ex);
                    }
                }
            };
            
            xhr.ontimeout = function () {
                var elapsed = (new Date()) - startTime;
                reject(new exceptions.TimeoutException(timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = function () {
                reject(new exceptions.RequestException('General request error', xhr));
            };
            xhr.onabort = function () {
                reject(new exceptions.AbortException('Request was aborted', xhr));
            };


            xhr.timeout = options.timeout || 60000;
            try {
                xhr.open('POST', options.url, true);
            } catch (ex) {
                reject(new exceptions.RequestException('Error opening request', xhr));
            }

            try {                
                if (options.header) {
                    Object.keys(options.header).forEach(function (key) {
                        xhr.setRequestHeader(key, options.header[key]);
                    });
                }
                if (options.responseType) {
                    xhr.responseType = options.responseType;
                }
                xhr.withCredentials = options.withCredentials || false;
                
                // We support two types of data to send ... strings or int (byte) buffers
                if (typeof options.data === 'string') {
                    xhr.send(options.data);
                } else if (options.data instanceof Array) {
                    xhr.send(new Uint8Array(options.data));
                } else {
                    reject(new Error('Invalid type of data to send'));
                }
            } catch (ex) {
                reject(new exceptions.RequestException('Error sending data in request', xhr));
            }
        });
    }
    
    function get(options) {
        var timeout = options.timeout || 60000,
            startTime = new Date();
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function (e) {
                if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new exceptions.ClientException(xhr.status, 'Client Error', xhr));
                }
                if (xhr.status >= 500) {
                    reject(new exceptions.ServerException(xhr.status, 'Server Error', xhr));
                }
                
                // var buf = new Uint8Array(xhr.response);
                try {
                    resolve(xhr.response);
                } catch (ex) {
                    reject(ex);
                }
            };
            
            xhr.ontimeout = function () {
                var elapsed = (new Date()) - startTime;
                reject(new exceptions.TimeoutException(timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = function () {
                reject(new exceptions.RequestException('General request error', xhr));
            };
            xhr.onabort = function () {
                reject(new exceptions.AbortException('Request was aborted', xhr));
            };

            xhr.timeout = options.timeout || 60000;
            try {
                xhr.open('GET', options.url, true);
            } catch (ex) {
                reject(new exceptions.RequestException('Error opening request', xhr));
            }

            try {
                
                if (options.header) {
                    Object.keys(options.header).forEach(function (key) {
                        xhr.setRequestHeader(key, options.header[key]);
                    });
                }
                if (options.responseType) {
                    xhr.responseType = options.responseType;
                }
                xhr.withCredentials = options.withCredentials || false;
                
                // We support two types of data to send ... strings or int (byte) buffers
                xhr.send();
            } catch (ex) {
                reject(new exceptions.RequestException('Error sending data in request', xhr));
            }
        });
    }

    return {
        get: get,
        post: post,
        RequestException: exceptions.RequestException,
        AbortException: exceptions.AbortException,
        TimeoutException: exceptions.TimeoutException,
        ServerException: exceptions.ServerException,
        ClientException: exceptions.ClientException
    };
});