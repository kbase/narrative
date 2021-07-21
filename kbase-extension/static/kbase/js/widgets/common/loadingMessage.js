define(['jquery'], ($) => {
    'use strict';
    function loadingMessage(message) {
        return $('<div>')
            .addClass('alert alert-info')
            .css('display', 'flex')
            .css('align-items', 'center')
            .css('justify-content', 'center')
            .css('margin', '10px auto')
            .css('max-width', '30em')
            .text(message)
            .append($('<i>').addClass('fa fa-spinner fa-spin fa-2x').css('margin-left', '1ex'));
    }
    return loadingMessage;
});
