/**
 * KBase preset wrapper for its cell menu.
 */
(function (IPython) {
    "use strict";

    var CellToolbar = IPython.CellToolbar;

    var $kbMenu = $('<span>');
    var makeKBaseMenu = function(div, cell) {
        require(['kbaseNarrativeCellMenu'], function() {
            $(div).kbaseNarrativeCellMenu({cell: cell});
        });
    };

    CellToolbar.register_callback('kbase.menu', makeKBaseMenu);
    var kbasePreset = [];
    kbasePreset.push('kbase.menu');

    CellToolbar.register_preset('KBase', kbasePreset);
    // console.log('KBase extension cell toolbar loaded.');
}(IPython));
