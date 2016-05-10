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
    'kbaseNarrativeCellMenu'
], function ($, celltoolbar, Jupyter, html, KBaseNarrativeCellMenu) {
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

    function doEditNotebookMetadata() {
        Jupyter.notebook.edit_metadata({
            notebook: Jupyter.notebook,
            keyboard_manager: Jupyter.notebook.keyboard_manager
        });
    }
    function editNotebookMetadata(toolbarDiv, cell) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (cell.metadata.kbase.type !== 'method') {
            return;
        }
        var button = html.tag('button'),
            editButton = button({
                type: 'button',
                class: 'btn btn-default btn-xs',
                dataElement: 'kbase-edit-notebook-metadata'}, [
                'Edit Notebook Metadata'
            ]);
        toolbarDiv.append(editButton);
        toolbarDiv.find('[data-element="kbase-edit-notebook-metadata"]').on('click', function () {
            doEditNotebookMetadata(cell);
        });
    }

    function initCodeInputArea(cell) {
        var codeInputArea = cell.input.find('.input_area');
        if (!cell.kbase.inputAreaDisplayStyle) {
            cell.kbase.inputAreaDisplayStyle = codeInputArea.css('display');
        }
        setMeta(cell, 'user-settings', 'showCodeInputArea', false);
    }

    function showCodeInputArea(cell) {
        var codeInputArea = cell.input.find('.input_area');
        if (getMeta(cell, 'user-settings', 'showCodeInputArea')) {
            codeInputArea.css('display', cell.kbase.inputAreaDisplayStyle);
        } else {
            codeInputArea.css('display', 'none');
        }
    }

    function toggleCodeInputArea(cell) {
        /*
         * the code input area's style is stached for future restoration.
         */
        if (getMeta(cell, 'user-settings', 'showCodeInputArea')) {
            setMeta(cell, 'user-settings', 'showCodeInputArea', false);
        } else {
            setMeta(cell, 'user-settings', 'showCodeInputArea', true);
        }
        showCodeInputArea(cell);
        return getMeta(cell, 'user-settings', 'showCodeInputArea');
    }

    function makeKBaseMenu(div, cell) {
        new KBaseNarrativeCellMenu(div, {cell: cell});
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
        celltoolbar.CellToolbar.register_callback('kbase-toggle-input', toggleInput);
        celltoolbar.CellToolbar.register_callback('kbase-edit-notebook-metadata', editNotebookMetadata);
        celltoolbar.CellToolbar.register_callback('kbase.menu', makeKBaseMenu);
        celltoolbar.CellToolbar.register_callback('kbase-status', status);
        celltoolbar.CellToolbar.register_callback('kbase-job-status', jobStatus);

        // default.rawedit for the metadata editor
        celltoolbar.CellToolbar.register_preset('KBase', ['kbase.menu', 'default.rawedit', 'kbase-toggle-input', 'kbase-edit-notebook-metadata', 'kbase-status', 'kbase-job-status']);
    };
    return {register: register};
});