define([
    'jquery',
    'jsonrpc/1.1/errors',
    'jsonrpc/1.1/jsonrpcErrors',
    'widgets/common/RenderJSON',

    // for effect
    'bootstrap',
    'css!./ErrorMessage',
], ($, errors, jsonrpcErrors, RenderJSON) => {
    'use strict';

    const { $renderJSON, $renderJSONObject } = RenderJSON;

    /**
     *
     *  message - canonical message
     *     error - may be an object with ...
     *        name - string - always JSONRPCError
     *        code - number - JSONRPC compatible error code
     *        message - string - canonical message
     *        error - string - captures trace
     *
     */

    /**
     * Given a string or jQuery objects, returns a jQuery object the value. This is a convenience
     * function for easily wrapping a somewhat arbitrary value. It could be extended to handle other
     * scalar-like values, but in this module that is not needed. It safely wraps strings using `text()`
     * but allows arbitrary html by accepting a jquery
     *
     * @param {(string | jQuery)} text A string to render inside the given tag
     * @param {string} tag The html tag name used to wrap the provided text; defaults to 'div'
     * @returns {jQuery} A JQuery object representing the value.
     */
    function $renderText(value, tag = 'div') {
        const $el = $(document.createElement(tag));
        return $el.text(value);
    }

    function $renderSectionHeader(headerText) {
        return $('<div>').addClass('ErrorMessage-sectionHeader').text(headerText);
    }

    function $renderError(err) {
        if (typeof err === 'string') {
            return $renderText(err);
        }

        // There are two types of KBase errors to handle specifically.

        // Those subclassed from jsonrpc/1.1/jsonrpcErrors.JSONRPCError are propagated from error responses
        // from services and dynamic services.

        // Those subclassed from jsonrpc/1.1/errors.ClientError are thrown by usage errors of
        // clients for core and dynamic services, as well as communication errors.

        if (err instanceof jsonrpcErrors.JSONRPCError) {
            // JSONRPC Errors show the primary text message, the common fields for
            // rpc requests (url, method, params), the common fields for
            // an error response (error)
            const jsonrpcError = err.toJSONRPCError();
            return $('<div>')
                .append($renderText(err.message, 'p'))
                .append($renderSectionHeader('Request'))
                .append(
                    $renderJSONObject({
                        url: err.url,
                        method: err.method,
                        params: err.params,
                    })
                )
                .append($renderSectionHeader('Error Response'))
                .append(
                    $renderJSONObject({
                        name: jsonrpcError.name,
                        code: jsonrpcError.code,
                        message: jsonrpcError.message,
                        error: jsonrpcError.error,
                    })
                );
        } else if (err instanceof errors.ClientError) {
            return $('<div>')
                .append($renderText(err.message, 'p'))
                .append($('<div>').text('Details'))
                .append($renderJSON(err.toJSON()));
        } else if (err instanceof Error) {
            if ('toJSON' in err && typeof err.toJSON === 'function') {
                return $('<div>')
                    .append($renderText(err.message, 'p'))
                    .append($renderJSON(err.toJSON()));
            }
            return $renderText(err.message);
        } else if (typeof err === 'object') {
            // Note that order is important.

            if (err === null) {
                return $renderText('Unsupported kind of error: "null"');
            }

            if (err.constructor === {}.constructor) {
                if ('message' in err && typeof err.message === 'string') {
                    return $('<div>').append($renderText(err.message)).append($renderJSON(err));
                } else {
                    return $renderJSON(err);
                }
            }

            if ('message' in err && typeof err.message === 'string') {
                return $renderText(err.message);
            }

            // We don't try to guess now.
            // The JSON-RPC specific handling above should be sufficient for KBase errors,
            // assuming one is using the newer JSON-RPC library.
            return $renderText(
                `Unsupported kind of error: type is "object", name is "${err.constructor.name}"`
            );
        } else {
            return $renderText(`Unsupported kind of error: type: type is "${typeof err}"`);
        }
    }

    /**
     *
     * @external "jQuery"
     * @see {@link https://api.jquery.com/Types/#jQuery}
     */

    /**
     *
     * @returns {jQuery} A jQuery object representing KBase support contact information
     */
    function $renderContactInfo() {
        return $('<div>')
            .addClass('Errormessage-contactInfo')
            .append($renderText('You may ', 'span'))
            .append(
                $('<a>')
                    .attr('href', 'https://www.kbase.us/support')
                    .attr('target', '_blank')
                    .text('contact the KBase team')
            )
            .append($renderText(' with the information above.', 'span'));
    }

    /**
     *
     * @param {SomeError} err -
     * @returns {jQuery} A jQuery object representing an error object
     */
    function $ErrorMessage(err, { title } = {}) {
        return $('<div>')
            .addClass('panel panel-danger')
            .append(
                $('<div>')
                    .addClass('panel-heading')
                    .append(
                        $('<h3>')
                            .addClass('panel-title')
                            .text(title || 'Error!')
                    )
            )
            .append($('<div>').addClass('panel-body').append($renderError(err)))
            .append($('<div>').addClass('panel-footer').append($renderContactInfo()));
    }

    return $ErrorMessage;
});
