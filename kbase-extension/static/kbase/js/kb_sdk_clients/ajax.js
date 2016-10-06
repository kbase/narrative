/*global define */
/*jslint white: true */
define([
    'bluebird'
], function (Promise) {
    'use strict';
    function ClientException(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
    }
    ClientException.prototype = Object.create(Error.prototype);
    ClientException.prototype.constructor = ClientException;
    ClientException.prototype.name = 'ClientException';
    
    function ServerException(code, message, xhr) {
        this.code = code;
        this.xhr = xhr;
        this.message = message;
    }
    ServerException.prototype = Object.create(Error.prototype);
    ServerException.prototype.constructor = ServerException;
    ServerException.prototype.name = 'ServerException';
    
    function TimeoutException(timeout, elapsed, message, xhr) {
        this.timeout = timeout;
        this.elapsed = elapsed;
        this.xhr = xhr;
        this.message = message;
    }
    TimeoutException.prototype = Object.create(Error.prototype);
    TimeoutException.prototype.constructor = TimeoutException;
    TimeoutException.prototype.name = 'TimeoutException';

     
    function GeneralException(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    GeneralException.prototype = Object.create(Error.prototype);
    GeneralException.prototype.constructor = GeneralException;
    GeneralException.prototype.name = 'GeneralException';
    
    function AbortException(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    AbortException.prototype = Object.create(Error.prototype);
    AbortException.prototype.constructor = AbortException;
    AbortException.prototype.name = 'AbortException';
    
    function post(options) {
        var timeout = options.timeout || 60000,
            startTime = new Date();
        return new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function () {
                if (xhr.status >= 400 && xhr.status < 500) {
                    reject(new ClientException(xhr.status, 'Client Error', xhr));
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
                reject(new TimeoutException(timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = function () {
                reject(new GeneralException('General request error', xhr));
            };
            xhr.onabort = function () {
                reject(new AbortException('Request was aborted', xhr));
            };


            xhr.timeout = options.timeout || 60000;
            try {
                xhr.open('POST', options.url, true);
            } catch (ex) {
                reject(new GeneralException('Error opening request', xhr));
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
                reject(new GeneralException('Error sending data in request', xhr));
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
                    reject(new ClientException(xhr.status, 'Client Error', xhr));
                }
                if (xhr.status >= 500) {
                    reject(new ServerException(xhr.status, 'Server Error', xhr));
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
                reject(new TimeoutException(timeout, elapsed, 'Request timeout', xhr));
            };
            xhr.onerror = function () {
                reject(new GeneralException('General request error', xhr));
            };
            xhr.onabort = function () {
                reject(new AbortException('Request was aborted', xhr));
            };

            xhr.timeout = options.timeout || 60000;
            try {
                xhr.open('GET', options.url, true);
            } catch (ex) {
                reject(new GeneralException('Error opening request', xhr));
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
                reject(new GeneralException('Error sending data in request', xhr));
            }
        });
    }

    return {
        get: get,
        post: post,
        GeneralException: GeneralException,
        AbortException: AbortException,
        TimeoutException: TimeoutException,
        ServerException: ServerException,
        ClientException: ClientException
    };
});