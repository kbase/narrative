/**
 * KBase preset wrapper for its cell menu.
 */

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'notebook/js/celltoolbar',
		'kbaseNarrativeCellMenu'
	], function(
		KBWidget,
		bootstrap,
		$,
		celltoolbar,
		kbaseNarrativeCellMenu
	) {
    "use strict";

    var CellToolbar = celltoolbar.CellToolbar;

    var $kbMenu = $('<span>');
    var makeKBaseMenu = function(div, cell) {
         new kbaseNarrativeCellMenu($(div), {cell: cell});
    };

    var register = function(notebook) {
        CellToolbar.register_callback('kbase.menu', makeKBaseMenu);
        var kbasePreset = [];
        kbasePreset.push('kbase.menu');

        CellToolbar.register_preset('KBase', kbasePreset);
    };
    return {'register': register};
});