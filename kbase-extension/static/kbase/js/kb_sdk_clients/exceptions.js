/*global define */
/*jslint white:true,browser:true*/
define([], function () {
    'use strict';

/*
     * A reponse which is invalid.
     * A valid response is most likely a non- or improper-JSON string
     * 
     */
    function InvalidResponseError(originalError, url, data) {
        this.originalError = originalError;
        this.url = url;
        this.responseData = data;
    }
    InvalidResponseError.prototype = Object.create(Error.prototype);
    InvalidResponseError.prototype.constructor = InvalidResponseError;
    InvalidResponseError.prototype.name = 'InvalidResponseError';

    /*
     * An error returned by the http server (an http server error)
     */
    function RequestError(statusCode, statusText, url, message) {
        this.url = url;
        this.message = message;
        this.statusCode = statusCode;
        this.statusText = statusText;
    }
    RequestError.prototype = Object.create(Error.prototype);
    RequestError.prototype.constructor = RequestError;
    RequestError.prototype.name = 'RequestError';
    
    function JsonRpcError(module, func, params, url, error) {
        this.url = url;
        this.message = error.message;
        this.detail = error.error;
        this.type = error.name;
        this.code = error.code;
        this.module = module;
        this.func = func;
        this.params = params;
    }
    JsonRpcError.prototype = Object.create(Error.prototype);
    JsonRpcError.prototype.constructor = JsonRpcError;
    JsonRpcError.prototype.name = 'JsonRpcError';
    
    function AttributeError(module, func, originalError) {
        this.module = module;
        this.func = func;
        this.originalError = originalError;
    }
    AttributeError.prototype = Object.create(Error.prototype);
    AttributeError.prototype.constructor = AttributeError;
    AttributeError.prototype.name = 'AttributeError';
    
    return Object.freeze({
        InvalidResponseError: InvalidResponseError,
        RequestError: RequestError,
        JsonRpcError: JsonRpcError,
        AttributeError: AttributeError
    });
    
});