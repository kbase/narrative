/*global define*/
/*jslint white:true,browser:true*/

define([
], function () {
    'use strict';
    
    
    function KBError(arg) {
        this.type = arg.type;
        this.message = arg.message;
        this.reason = arg.reason;
        this.original = arg.original;
        this.detail = arg.detail;
        this.info =arg.info;
        this.advice = arg.advice;

        this.blame = arg.blame;
        this.code = arg.code;
        this.suggestion = arg.suggestion;
    }
    KBError.prototype = new Error();

    function grokError(err) {
        if (err instanceof KBError) {
            return err;
        }
        if (err instanceof Error) {
            return new KBError({
                type: 'js-error',
                name: err.name,
                message: err.message,
                original: err
            });
        }

        switch (typeof err) {
            case 'string':
                return new KBError({
                    type: 'string-error',
                    message: err,
                    original: err
                });
            case 'object':
                if (err.error) {
                    // this is a kbase service client style error
                    return new KBError({
                        type: 'kbase-client-error',
                        name: err.error.name,
                        message: err.error.message,
                        detail: err.error.error,
                        original: err
                    });
                } else if (err.message) {
                    return new KBError({
                        type: 'js-error',
                        name: err.name,
                        message: err.message,
                        original: err
                    });
                } else {
                    return new KBError({
                        type: 'unknown-error',
                        name: 'Unknown',
                        message: 'An unknown error occurred',
                        original: err
                    });
                }
            default:
                return new KBError({
                    type: 'unknown-error',
                    name: 'Unknown',
                    message: 'An unknown error occurred',
                    original: err
                });
        }
    }


    return {
        grokError: grokError,
        KBError: KBError
    };
});
