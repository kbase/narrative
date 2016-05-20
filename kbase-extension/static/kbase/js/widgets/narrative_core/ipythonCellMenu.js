/**
 * KBase preset wrapper for its cell menu.
 */
/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'notebook/js/celltoolbar',
    'base/js/namespace',
    'kb_common/html',
    'kbaseNarrativeCellMenu',
    'kbaseCellToolbarMenu'
], function ($, celltoolbar, Jupyter, html, KBaseNarrativeCellMenu, KBaseMenu) {
    "use strict";
    
    var t = html.tag,
        span = html.tag('span');

    /*
     * Dealing with metadata
     */
    function createMeta(cell, initial) {
        var meta = cell.metadata;
        meta.kbase = initial;
        cell.metadata = meta;
    }
    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (!cell.metadata.kbase[group]) {
            return;
        }
        return cell.metadata.kbase[group][name];
    }
    function setMeta(cell, group, name, value) {
        /*
         * This funny business is because the trigger on setting the metadata 
         * property (via setter and getter in core Cell object) is only invoked 
         * when the metadata preoperty is actually set -- doesn't count if 
         * properties of it are.
         */
        var temp = cell.metadata;
        if (!temp.kbase) {
            temp.kbase = {};
        }
        if (!temp.kbase[group]) {
            temp.kbase[group] = {};
        }
        temp.kbase[group][name] = value;
        cell.metadata = temp;
    }

    function makeKBaseMenux(div, cell) {
        new KBaseNarrativeCellMenu(div, {cell: cell});
    }
    function makeKBaseMenu($toolbarNode, cell) {
        var kbaseMenu = KBaseMenu.make();
        kbaseMenu.register_callback($toolbarNode, cell);
    }
    function toggleInput(toolbarDiv, cell) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (cell.metadata.kbase.type !== 'method') {
            return;
        }
        var button = html.tag('button'),
            inputAreaShowing = getMeta(cell, 'user-settings', 'showCodeInputArea'),
            label = inputAreaShowing ? 'Hide code' : 'Show code',
            toggleButton = button({
                type: 'button',
                class: 'btn btn-default btn-xs',
                dataElement: 'kbase-method-cell-hideshow'}, [
                label
            ]);
        toolbarDiv.append(toggleButton);
        toolbarDiv.find('[data-element="kbase-method-cell-hideshow"]').on('click', function (e) {
            toggleCodeInputArea(cell);
        });
    }

    function status(toolbarDiv, cell) {
        var status = getMeta(cell, 'attributes', 'status'),
            content = span({style: {fontWeight: 'bold'}}, status);
        toolbarDiv.append(span({style: {padding: '4px'}}, content));
    }
    
    function jobStatus(toolbarDiv, cell) {
        var jobStatus = getMeta(cell, 'attributes', 'jobStatus'),
            content = span({style: {fontWeight: 'bold'}}, jobStatus);
        $(toolbarDiv).append(span({style: {padding: '4px'}}, content));
    }

    var register = function (notebook) {
       
        celltoolbar.CellToolbar.register_callback('kbase.menu', makeKBaseMenux);
        celltoolbar.CellToolbar.register_callback('kbase-status', status);
        celltoolbar.CellToolbar.register_callback('kbase-job-status', jobStatus);
        celltoolbar.CellToolbar.register_callback('kbase-menu', makeKBaseMenu);

        // default.rawedit for the metadata editor
        celltoolbar.CellToolbar.register_preset('KBase', ['kbase-menu']);
    };
    return {register: register};
});