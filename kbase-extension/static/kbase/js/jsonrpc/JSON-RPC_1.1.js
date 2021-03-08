/*jslint white:true,browser:true*/
define(['uuid'], (Uuid) => {
    'use strict';

    /* 
    JSONRPC errors capture the calling information and some
    error state. This or a sublcass should be used for all errors
    encountered within the request function. Subclasses may capture
    more specific information about specific errors.
    */
    class JSONRPCError extends Error {
        constructor(message, { module, func, params, url, originalMessage }) {
            super(message);
            this.url = url;
            this.module = module;
            this.func = func;
            this.params = params;
            this.originalMessage = originalMessage;
        }
        toJSON() {
            return {
                message: this.message,
                url: this.url,
                module: this.module,
                func: this.func,
                params: this.params,
                originalMessage: this.originalMessage,
            };
        }
    }

    /**
     * An error returned from a JSON-RPC 1.1. method call
     */
    class JSONRPCMethodError extends JSONRPCError {
        constructor(message, { module, func, params, url, originalMessage, error }) {
            super(message, { module, func, params, url, originalMessage });
            this.error = error;
        }
        toJSON() {
            return {
                message: this.message,
                url: this.url,
                module: this.module,
                func: this.func,
                params: this.params,
                originalMessage: this.originalMessage,
                error: this.error,
            };
        }
    }

    async function request(url, module, func, params, options = {}) {
        const rpc = {
            params,
            method: `${module}.${func}`,
            version: '1.1',
            id: new Uuid(4).format(),
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
                body: JSON.stringify(rpc),
            });
        } catch (ex) {
            throw new JSONRPCError('Error fetching JSON-RPC 1.1', {
                module,
                func,
                params,
                url,
                originalMessage: ex.mesage,
            });
        }

        let data;
        try {
            const textResponse = await response.text();
            data = JSON.parse(textResponse);
        } catch (ex) {
            throw new JSONRPCError('Error parsing JSON-RPC 1.1 response', {
                module,
                func,
                params,
                url,
                originalMessage: ex.mesage,
            });
        }

        if (data.result) {
            return data.result;
        }
        if (!data.error) {
            throw new JSONRPCError('Invalid JSON-RPC 1.1 response - no result or error', {
                module,
                func,
                params,
                url,
            });
        }

        throw new JSONRPCMethodError('Error running JSON-RPC 1.1 method', {
            module,
            func,
            params,
            url,
            error: data.error,
        });
    }

    return Object.freeze({
        request,
        JSONRPCError,
        JSONRPCMethodError,
    });
});
