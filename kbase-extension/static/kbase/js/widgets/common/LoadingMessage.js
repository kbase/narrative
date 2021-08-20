define(['jquery', 'css!./LoadingMessage.css'], ($) => {
    'use strict';
    function $LoadingMessage(message) {
        let $message;
        if (typeof message === 'string') {
            $message = $('<span>').text(message);
        } else {
            $message = message;
        }
        return $('<div>')
            .addClass('alert alert-info LoadingMessage')
            .append($message)
            .append($('<i>').addClass('fa fa-spinner fa-spin fa-2x LoadingMessage-icon'));
    }
    return $LoadingMessage;
});
