/*jslint white:true,browser:true*/
define([
    'uuid'
], function (
    Uuid
) {
    'use strict';

    /* 
    JSONRPC errors capture the calling information and some
    error state. Subclasses capture more specific information about
    more specific errors.
    */
    class JSONRPCError extends Error {
        constructor (message, {module, func, params, url, originalMessage}) {
            super(message);
            this.url = url;
            this.module = module;
            this.func = func;
            this.params = params;
            this.originalMessage = originalMessage;
        }
    }

    /**
 * An error returned from a JSON-RPC 1.1. call
 * @param {} module 
 * @param {*} func 
 * @param {*} params 
 * @param {*} url 
 * @param {*} error 
 */
    class JSONRPCMethodError extends JSONRPCError {
        constructor (message, {module, func, params, url, originalMessage, error}) {
            super(message, {module, func, params, url, originalMessage});
            this.message = error.message;
            this.detail = error.error;
            this.type = error.name;
            this.code = error.code;
        }
    }

    async function request(url, module, func, params, options) {
        const rpc = {
            params,
            method: `${module}.${func}`,
            version: '1.1',
            id: new Uuid(4).format()
        };
        const headers = {};

        if (options.rpcContext) {
            rpc.context = options.rpcContext;
        }

        if (options.authorization !== null) {
            headers.Authorization = options.authorization;
        }

        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(rpc)
            });
        } catch (ex) {
            throw new JSONRPCError('Error fetching JSON-RPC 1.1', {module, func, params, url, originalMessage: ex.mesage});
        }

        let data;
        try {
            const textResponse = await response.text();
            data = JSON.parse(textResponse);
        } catch (ex) {
            throw new JSONRPCError('Error parsing JSON-RPC 1.1 response', {module, func, params, url, originalMessage: ex.mesage});
        }

        if (data.result) {
            return data.result;
        }
        if (!data.error) {
            throw new JSONRPCError('Invalid JSON-RPC 1.1 response - no result or error', {module, func, params, url});
        }
                
        throw new JSONRPCMethodError('Error running JSON-RPC 1.1 method', {module, func, params, url, error: data.error});

    }

    return Object.freeze({
        request,
        JSONRPCError,
        JSONRPCMethodError
    });
});