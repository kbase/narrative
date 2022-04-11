/**
 * KBase preset wrapper for its cell menu.
 */
define(['notebook/js/celltoolbar', 'kbaseCellToolbarMenu'], (celltoolbar, KBaseCellToolbarMenu) => {
    'use strict';

    function makeKBaseMenu($toolbarNode, cell) {
        const kbaseMenu = KBaseCellToolbarMenu.make();
        kbaseMenu.register_callback($toolbarNode, cell);
    }

    const register = function () {
        celltoolbar.CellToolbar.register_callback('kbase-menu', makeKBaseMenu);
        celltoolbar.CellToolbar.register_preset('KBase', ['kbase-menu']);
    };
    return { register };
});
