define([
    'jquery',

    // for effect
    'bootstrap',
], ($) => {
    'use strict';

    function $AlertMessage(message, { type } = { type: 'info' }) {
        if (typeof type === 'string' && !['info', 'warning', 'danger', 'success'].includes(type)) {
            throw new Error(`Alert type "${type}" not recognized`);
        }
        return $('<div>').addClass(`alert alert-${type}`).text(message);
    }

    return $AlertMessage;
});
