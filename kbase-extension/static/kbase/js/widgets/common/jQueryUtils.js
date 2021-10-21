define([
    'jquery'
], ($) => {
    'use strict';

    function $el(tagName) {
        return $(document.createElement(tagName));
    }

    function $row() {
        return $el('div').addClass('flex-row');
    };
    function $col() {
        return $el('div').addClass('flex-col');
    };

    return { $el, $row, $col };
});