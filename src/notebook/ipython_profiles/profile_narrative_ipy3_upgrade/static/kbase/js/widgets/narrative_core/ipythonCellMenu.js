/**
 * KBase preset wrapper for its cell menu.
 */

define([
    'jquery',
    'notebook/js/celltoolbar',
], function($, celltoolbar) {
    "use strict";

    var CellToolbar = celltoolbar.CellToolbar;

    var $kbMenu = $('<span>');
    var makeKBaseMenu = function(div, cell) {
        require(['kbaseNarrativeCellMenu'], function() {
            $(div).kbaseNarrativeCellMenu({cell: cell});
        });
    };

    var register = function(notebook) {
        CellToolbar.register_callback('kbase.menu', makeKBaseMenu);
        var kbasePreset = [];
        kbasePreset.push('kbase.menu');

        CellToolbar.register_preset('KBase', kbasePreset);
        console.log('KBase extension cell toolbar loaded.');
    };
    return {'register': register};
});