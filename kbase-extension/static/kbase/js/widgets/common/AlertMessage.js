define([
    'jquery',

    // for effect
    'bootstrap'
], ($) => {
    'use strict';

    /**
     *
     * @param {message} message - The plain text message to display
     * @param {Options} - Optional configuration
     * @returns {jQuery} A jQuery object representing an error object
     */
    function $AlertMessage(message, { type } = {}) {
        return $('<div>')
            .addClass(`alert alert-${type || 'info'}`)
            .text(message);
    }

    return $AlertMessage;
});
