/*global define */
/*jslint white:true,browser:true*/
define([], function () {
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

     
    function RequestException(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    RequestException.prototype = Object.create(Error.prototype);
    RequestException.prototype.constructor = RequestException;
    RequestException.prototype.name = 'RequestException';
    
    function AbortException(message, xhr) {
        this.xhr = xhr;
        this.message = message;
    }
    AbortException.prototype = Object.create(Error.prototype);
    AbortException.prototype.constructor = AbortException;
    AbortException.prototype.name = 'AbortException';

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
        
        // json rpc level errors
        ClientException: ClientException,
        ServerException: ServerException,
        TimeoutException: TimeoutException,
        RequestException: RequestException,
        AbortException: AbortException,
        
        // api level errors
        InvalidResponseError: InvalidResponseError,
        RequestError: RequestError,
        JsonRpcError: JsonRpcError,
        AttributeError: AttributeError
    });
    
});