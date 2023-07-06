define([
    'jquery',

    // for effect
    'bootstrap',
], ($) => {
    'use strict';

    function $AlertMessage(message, options = {}) {
        const type = options.type || 'info';
        if (!['info', 'warning', 'danger', 'success'].includes(type)) {
            throw new Error(`Alert type "${type}" not recognized`);
        }
        return $('<div>').addClass(`alert alert-${type}`).text(message);
    }

    return $AlertMessage;
});
