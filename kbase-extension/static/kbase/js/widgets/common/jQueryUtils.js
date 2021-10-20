define([
    'jquery'
], ($) => {
    'use strict';

    function $el(tagName) {
        return $(document.createElement(tagName));
    }

    return { $el };
});