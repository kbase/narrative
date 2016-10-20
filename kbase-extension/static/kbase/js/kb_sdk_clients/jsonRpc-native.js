/*global define */
/*jslint white:true,browser:true*/
define(['./ajax', './exceptions'], function (ajax, exceptions) {
    'use strict';

    function request(url, module, func, params, numRets, options) {
        // Argh -- a poor man's json rpc.
        var rpc = {
            params: params,
            method: module + '.' + func,
            version: '1.1',
            id: String(Math.random()).slice(2)
        },
        header = {};

        if (options.rpcContext) {
            rpc.context = options.rpcContext;
        }

        if (options.authorization !== null) {
            header.Authorization = options.authorization;
        }

        return ajax.post({
            url: url,
            timeout: options.timeout,
            data: JSON.stringify(rpc),
            header: header
        })
            .then(function (response) {
                var data = JSON.parse(response);
                if (numRets === 1) {
                    return data.result[0];
                }
                return data.result;
            })
            .catch(function (err) {
                if (err.xhr && err.xhr.responseText) {
                    var data;
                    try {
                        data = JSON.parse(err.xhr.responseText);
                        // follows a weird convention. In any case, let us throw
                        // it as an exception.
                    } catch (ex) {
                        // not json, oh well.                        
                        throw new exceptions.RequestError(err.xhr.status, err.xhr.statusText, url, err.xhr.responseText);
                    }
                    
                    // DANGER: This is highly dependent up on what is returned in
                    // the "error.error" property of ... the error object.
                    // It is assumbed to be a newline separated list of strings
                    // the penultimate one of which is a simple string expressing
                    // the exception.
                    var maybeStackTrace,
                        maybeErrorName;
                        
                    if (data.error && data.error.error && typeof data.error.error === 'string') {                    
                        maybeStackTrace = data.error.error.split('\n');
                    
                        if (maybeStackTrace.length >= 2) {
                            maybeErrorName = maybeStackTrace[maybeStackTrace.length - 2];
                        }
                    }
                        
                    switch (maybeErrorName) {
                        case 'AttributeError': 
                            throw new exceptions.AttributeError(module, func, data);
                            break;
                        default:
                            throw new exceptions.JsonRpcError(module, func, params, url, data.error);
                    }
                    
                }
                throw err;
            });
    }

    return Object.freeze({
        request: request
    });
});