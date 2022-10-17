/**
 * errorView - A widget which displays common error types, including
 * strings, exception objects descended from Error, and plain objects which
 * follow the KBase SDK JSON-RPC error form:
 * {name, code, message, error}
 *        name - string - always JSONRPCError
 *        code - number - JSONRPC compatible error code
 *        message - string - canonical message
 *        error - string - captures trace
 */
define([
    'jquery',
    'kb_common/jsonRpc/exceptions',
    'widgets/common/RenderIn',
    'widgets/common/JSONView',
], ($, jsonRPCExceptions, RenderIn, $JSONView) => {
    'use strict';

    const { $TextIn, $HTMLIn } = RenderIn;
    const UNKNOWN_ERROR_TEXT = 'Unknown error';

    function $renderJSONRPCException(err) {
        const $errorTable = $('<table>').addClass('table');

        const $tbody = $('<tbody>');
        $errorTable.append($tbody);

        const $renderRow = (label, value) => {
            return $('<tr>')
                .css('background-color', 'transparent')
                .append(
                    $('<th>').css('border', 'none').text(label),
                    $('<td>').css('border', 'none').text(value)
                );
        };

        $tbody.append($renderRow('Type', err.type));
        $tbody.append($renderRow('Code', err.code));
        $tbody.append($renderRow('Module', err.module));
        $tbody.append($renderRow('Function', err.func));
        $tbody.append($renderRow('Message', err.message));

        return $errorTable;
    }

    function $renderError(err) {
        if (typeof err === 'string') {
            return $TextIn(err);
        }

        // This may be a KBase service error, which are somewhat uniform.
        // We display some common fields at top, and then dump the
        // entire error info as nested tables.

        if (err instanceof jsonRPCExceptions.RpcError) {
            return $renderJSONRPCException(err);
        }

        // Some other error
        if (err instanceof Error) {
            return $HTMLIn([
                $TextIn(err.name, 'span'),
                $TextIn(': ', 'span'),
                $TextIn(err.message, 'span'),
            ]);
        }

        // Some other object
        if (typeof err === 'object') {
            // Note that order is important.

            if (err === null) {
                return $TextIn(UNKNOWN_ERROR_TEXT);
            }

            if ('message' in err && typeof err.message === 'string') {
                return $TextIn(err.message);
            }

            if (err.constructor === {}.constructor) {
                return $JSONView(err);
            }

            if ('toString' in err && typeof err.toString === 'function') {
                return $TextIn(`Unknown error: ${err.toString()}`);
            }
        }

        // Don't try to do anything fancy if the error value is outside what we are prepared
        // to handle.
        return $TextIn(UNKNOWN_ERROR_TEXT);
    }

    function $renderContactInfo() {
        return $('<div>')
            .css('margin-top', '20px')
            .append($TextIn('You may', 'span'))
            .append(' ')
            .append(
                $('<a>')
                    .attr('href', 'https://www.kbase.us/support')
                    .attr('target', '_blank')
                    .text('contact the KBase team')
            )
            .append(' ')
            .append($TextIn('with the information above.', 'span'));
    }

    function $renderTitle() {
        return $('<div>').css('font-weight', 'bold').text('Error');
    }

    function $ErrorView(err) {
        return $('<div>')
            .addClass('alert alert-danger')
            .append($renderTitle())
            .append($renderError(err))
            .append($renderContactInfo());
    }

    return $ErrorView;
});
