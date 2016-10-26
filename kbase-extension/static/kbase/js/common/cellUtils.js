/*global define*/
/*jslint white:true,browser:true*/

define([
    'kb_common/html',
    'kb_common/format',
    'common/props',
    'base/js/namespace'
], function (html, format, Props, Jupyter) {
    'use strict';

    function createMeta(cell, initial) {
        var meta = cell.metadata;
        meta.kbase = initial;
        cell.metadata = meta;
    }
    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (name === undefined) {
            return cell.metadata.kbase[group];
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
        // Handle the case of setting a group to an entire object
        if (value === undefined) {
            temp.kbase[group] = name;
        } else {
            if (!temp.kbase[group]) {
                temp.kbase[group] = {};
            }
            temp.kbase[group][name] = value;
        }
        cell.metadata = temp;
    }
    function pushMeta(cell, props, value) {
        var meta = Props.make(cell.metadata.kbase);
        meta.incrItem(props, value);
    }
    
    function getTitle(cellId) {
        var cells = Jupyter.notebook.get_cells().filter(function (cell) {
            return (cellId === Props.getDataItem(cell.metadata, 'kbase.attributes.id'));
        });
        if (cells.length === 0) {
            return;
        }
        return Props.getDataItem(cells[0].metadata, 'kbase.attributes.title');

    }
    
    function findById(id) {
            var matchingCells = Jupyter.notebook.get_cells().filter(function (cell) {
                if (cell.metadata && cell.metadata.kbase) {
                    return (cell.metadata.kbase.attributes.id === id);
                }
                return false;
            });
            if (matchingCells.length === 1) {
                return matchingCells[0];
            }
            if (matchingCells.length > 1) {
                addNotification('Too many cells matched the given id: ' + id);
            }
            return null;
        }



    return {
        createMeta: createMeta,
        getMeta: getMeta,
        setMeta: setMeta,
        pushMeta: pushMeta,
        getTitle: getTitle,
        findById: findById
    };
});