define(['jquery', 'jsonrpc/1.1/errors'], ($, errors) => {
    'use strict';
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
    function renderJSONArray(data) {
        const $rows = data.map((value, index) => {
            return $('<tr>').append(
                $('<th>').css('color', 'rgba(150, 150, 150, 1)').text(String(index)),
                $('<td>').addClass('fa fa-arrow-right'),
                $('<td>').html(renderJSON(value))
            );
        });
        return $('<table>').addClass('table table-striped').html($('<tbody>').append($rows));
    }

    function renderJSONObject(data) {
        const $rows = Object.entries(data).map(([key, value]) => {
            return $('<tr>').append(
                $('<th>').css('color', 'rgba(150, 150, 150, 1)').text(key),
                $('<td>').addClass('fa fa-arrow-right'),
                $('<td>').html(renderJSON(value))
            );
        });
        return $('<table>').addClass('table table-striped').html($('<tbody>').append($rows));
    }

    function renderJSON(data) {
        switch (typeof data) {
            case 'string':
                return $textIn(data);
            case 'number':
                return $textIn(String(data));
            case 'boolean':
                return $textIn(String(data));
            case 'object':
                if (data === null) {
                    return $textIn('NULL');
                }
                if (data instanceof Array) {
                    return renderJSONArray(data);
                } else {
                    return renderJSONObject(data);
                }
            default:
                return $textIn('Not representable: ' + typeof data);
        }
    }

    /**
     * Given a string, returns a jquery object wrapping an html tag which contains the
     * string set, safely, via text().
     * 
     * @param {string} text A string to render inside the given tag
     * @param {string} tag The html tag name used to wrap the provided text; defaults to 'div'
     * @returns JQuery object
     */
    function $textIn(text, tag = 'div') {
        return $(document.createElement(tag)).text(text);
    }

    function $renderError(err) {
        if (typeof err === 'string') {
            return $textIn(err);
        }

        // This may be a KBase service error, which are somewhat uniform.
        // We display some common fields at top, and then dump the
        // entire error info as nested tables.
        if (err instanceof errors.JSONRPCError) {
            const $errorDump = renderJSON(err.toJSON());
            return $('<div>')
                .append(
                    $('<table>')
                        .addClass('table')
                        .append(
                            $('<tbody>')
                                .append(
                                    $('<tr>')
                                        .append($('<th>').text('module'))
                                        .append($('<td>').text(err.module))
                                )
                                .append(
                                    $('<tr>')
                                        .append($('<th>').text('method'))
                                        .append($('<td>').text(err.method))
                                )
                                .append(
                                    $('<tr>')
                                        .append($('<th>').text('code'))
                                        .append($('<td>').text(err.code))
                                )
                        )
                )
                .append($('<div>').text('Details'))
                .append($errorDump);
        }

        // Some other error
        if (err instanceof Error) {
            if ('toJSON' in err && typeof err.toJSON === 'function') {
                return $('<div>')
                    .append($('<p>').text(err.message))
                    .append(renderJSON(err.toJSON()));
            }
            return $textIn(err.message);
        }

        // Some other object
        if (typeof err === 'object') {
            // Note that order is important.

            if (err === null) {
                return $textIn('Unknown');
            }

            if (err.constructor === {}.constructor) {
                if ('message' in err && typeof err.message === 'string') {
                    return $('<div>').append($textIn(err.message)).append(renderJSON(err));
                } else {
                    return renderJSON(err);
                }
            }

            if ('message' in err && typeof err.message === 'string') {
                return $textIn(err.message);
            }

            // We don't try to guess now.
            // The JSON-RPC specific handling above should be sufficient for KBase errors,
            // assuming one is using the newer JSON-RPC library.
            if ('toString' in err && typeof err.toString === 'function') {
                return $textIn(`Unknown error: ${err.toString()}`);
            }
        }

        // Don't try to do anything fancy if the error value is outside what we are prepared
        // to handle.
        return $textIn('Unknown error');
    }
    function $renderContactInfo() {
        return $('<div>')
            .css('margin-top', '20px')
            .append($textIn('You may', 'span'))
            .append(' ')
            .append(
                $('<a>')
                    .attr('href', 'https://www.kbase.us/support')
                    .attr('target', '_blank')
                    .text('contact the KBase team')
            )
            .append(' ')
            .append($textIn('with the information above.', 'span'));
    }

    function errorMessage(err) {
        return $('<div>')
            .addClass('alert alert-danger')
            .append($renderError(err))
            .append($renderContactInfo());
    }

    return errorMessage;
});
