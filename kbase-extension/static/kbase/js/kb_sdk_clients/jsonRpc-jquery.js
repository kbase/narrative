/*global define */
/*jslint white:true,browser:true*/
define(['jquery', 'bluebird', './exceptions'], function ($, Promise, exceptions) {
    'use strict';

    function request(url, method, params, numRets, options) {
        var rpc = {
            params: params,
            method: method,
            version: '1.1',
            id: String(Math.random()).slice(2)
        },
            beforeSend;

        if (options.rpcContext) {
            rpc.context = options.rpcContext;
        }

        if (options.authorization !== null) {
            beforeSend = function (xhr) {
                xhr.setRequestHeader('Authorization', options.authorization);
            };
        }
        
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: url,
                dataType: 'text',
                type: 'POST',
                processData: false,
                data: JSON.stringify(rpc),
                beforeSend: beforeSend,
                timeout: options.timeout,
                success: function (data) {
                    try {
                        var resp = JSON.parse(data);
                        // Is this a good idea?
                        if (numRets === 1) {
                            resolve(resp.result[0]);
                        } else {
                            resolve(resp.result);
                        }
                    } catch (err) {
                        reject(new exceptions.InvalidResponseError(err, url, data));
                    }
                },
                error: function (xhr, textStatus) {
                    if (xhr.responseText) {
                        try {
                            var resp = JSON.parse(xhr.responseText);
                            // error = resp.error;
                            // This is an error response with a valid error json response.
                            // TODO: this should really never occur. A valid jsonrpc error
                            // response will be a normal response (200) with an error
                            // json payload.
                            // Still, lets honor this and issue a warning.
                            console.warn('Invalid JSON RPC error response - should not return json-rpc error as http error', xhr.status, xhr.statusText, resp);
                            resolve(resp);
                        } catch (err) {
                            // A server error which is not valid JSON.
                            // This actually is the expected condition for a server error.
                            reject(new exceptions.RequestError(xhr.status, xhr.statusText, textStatus, url, xhr.responseText));
                        }
                    } else {
                        reject(new exceptions.RequestError(xhr.status, xhr.statusText, url, 'Unknown Error'));
                    }
                }
            });
        });
    }

    return Object.freeze({
        request: request
    });
});