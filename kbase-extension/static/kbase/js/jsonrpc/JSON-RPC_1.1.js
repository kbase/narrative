/*jslint white:true,browser:true*/
define(['./exceptions'], function (exceptions) {
    'use strict';

    function request(url, module, func, params, options) {
        // Argh -- a poor man's json rpc.
        const rpc = {
            params,
            method: module + '.' + func,
            version: '1.1',
            id: String(Math.random()).slice(2)
        };
        const headers = {};

        if (options.rpcContext) {
            rpc.context = options.rpcContext;
        }

        if (options.authorization !== null) {
            headers.Authorization = options.authorization;
        }

        return fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(rpc)
        })
            .then((response) => {
                return response.text();
            })
            .then(function (textResponse) {
                var data = JSON.parse(textResponse);
                if (data.result) {
                    return data.result;
                }
                if (!data.error) {
                    throw new exceptions('Invalid JSON-RPC 1.1 response - no result or error');
                }
                // DANGER: This is highly dependent up on what is returned in
                // the "error.error" property of ... the error object.
                // It is assumed to be a newline separated list of strings
                // the penultimate one of which is a simple string expressing
                // the exception.
                let maybeStackTrace,
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
                    default:
                        throw new exceptions.JsonRpcError(module, func, params, url, data.error);
                }
            })
            .catch(function (err) {
                // not json, oh well.                        
                throw new exceptions.RequestError(err.xhr.status, err.xhr.statusText, url, err.xhr.responseText);

            });
    }

    return Object.freeze({
        request
    });
});