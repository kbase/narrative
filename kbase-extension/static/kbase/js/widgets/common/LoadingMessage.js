define(['jquery', 'css!./LoadingMessage.css'], ($) => {
    'use strict';
    function $LoadingMessage(message) {
        return $('<div>')
            .addClass('alert alert-info LoadingMessage')
            .text(message)
            .append($('<i>').addClass('fa fa-spinner fa-spin fa-2x LoadingMessage-icon'));
    }
    return $LoadingMessage;
});
