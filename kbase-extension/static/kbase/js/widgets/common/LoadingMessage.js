define(['jquery'], ($) => {
    'use strict';
    function $LoadingMessage(message) {
        const $message = () => {
            if (typeof message === 'string') {
                return $('<span>').text(message);
            } else {
                return message;
            }
        };
        return $('<div>')
            .addClass('alert alert-info')
            .css('display', 'flex')
            .css('flex-direction', 'row')
            .css('align-items', 'center')
            .css('margin', '10px auto')
            .css('max-width', '30em')
            .append($message)
            .append(' ')
            .append($('<i>').addClass('fa fa-spinner fa-spin fa-2x'));
    }
    return $LoadingMessage;
});
