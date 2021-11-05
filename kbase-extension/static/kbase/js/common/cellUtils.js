define(['common/props', 'base/js/namespace'], (Props, Jupyter) => {
    'use strict';

    /**
     * This assumes a cell metadata structure built for KBase-enhanced cells.
     * This should have a minimal metadata structure under the "kbase" namespace, e.g.
     * {
     *   kbase: {
     *     someCellType: {
     *       info: 'information'
     *     }
     *   }
     * }
     *
     * Example calls here:
     * getMeta(cell, 'someCellType') => { info: 'information' }
     * getMeta(cell, 'someCellType', 'info') => 'information'
     * getMeta(cell, 'someCellType', 'notFound') => undefined
     *
     * @param {Object} cell a Jupyter notebook cell object
     * @param {string} group a metadata group name under the kbase metadata namespace
     * @param {string} name the specific key in the group to return
     * @returns the value matching the group and name in the cell's metadata
     */
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

    /**
     * Sets a value in the Jupyter notebook cell metadata. By convention, all KBase
     * metadata is keyed under the "kbase" namespace. The "group" parameter refers to
     * the top level key under that, and name is the optional next level beneath that.
     *
     * examples:
     * setMeta(cell, 'cellType', 'params', {p1: 1, p2: 2})
     *   sets metadata:
     *   {
     *     kbase: {
     *       cellType: {
     *         params: { p1: 1, p2: 2 }
     *       }
     *     }
     *   }
     *
     * setMeta(cell, 'cellType', {a: 1})
     *   sets metadata:
     *   {
     *     kbase: {
     *       cellType: { a: 1 }
     *     }
     *   }
     *
     * Note that values under name should not be set to 'undefined'. If the
     * "value" parameters is given as "undefined", then the "group" section will
     * be set to the "name" value. That is if running:
     * setMeta(cell, 'cellType', 'someKey', undefined)
     * you might expect to get:
     * {
     *   kbase: {
     *     cellType: {
     *       someKey: undefined
     *     }
     *   }
     * }
     * but will actually get:
     * {
     *   kbase: {
     *     cellType: 'someKey'
     *   }
     * }
     *
     * If cell is not a KBase-extended cell, this will throw a TypeError.
     * @param {Object} cell a Jupyter notebook cell
     * @param {string} group a metadata group name under the kbase metadata namespace
     * @param {string} name the specific key in the group to set
     * @param {any} value the value to set (optional - if not given, then the "group"
     *   key will be set to the "name" value)
     */
    function setMeta(cell, group, name, value) {
        /*
         * This funny business is because the trigger on setting the metadata
         * property (via setter and getter in core Cell object) is only invoked
         * when the metadata preoperty is actually set -- doesn't count if
         * properties of it are.
         */
        const temp = cell.metadata;
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

    /**
     * Sets a metadata item in the given cell by following the path to the
     * metadata key. Note that this requires the full path from the root of the
     * metadata item (i.e. kbase.appCell.params...).
     * e.g.:
     * setCellMeta(cell, 'kbase.appCell.params', {})
     * @param {Object} cell a Jupyter notebook cell
     * @param {string|Array} path a path to the value to set (with dots between
     *   layers for a string, or an array of layers)
     * @param {any} value the value to set
     * @param {boolean} forceRefresh (optional, default false) if true, will force
     *   the cell to refresh itself by resetting the metadata object
     */
    function setCellMeta(cell, path, value, forceRefresh) {
        if (!cell.metadata) {
            cell.metadata = {};
        }
        Props.setDataItem(cell.metadata, path, value);
        if (forceRefresh) {
            // eslint-disable-next-line no-self-assign
            cell.metadata = cell.metadata;
        }
    }

    /**
     * Gets a value from a Jupyter notebook cell's metadata. If that value isn't
     * present along the given path, returns the defaultValue or undefined.
     *
     * Note this this requires the full path down the metadata (i.e. kbase.appCell.params...)
     * @param {Object} cell a Jupyter notebook cell
     * @param {string|Array} path a path to the value to retrieve
     * @param {any} defaultValue if the value at the end of the path is undefined,
     *   return this as a default instead (default undefined)
     * @returns a value from the cell metadata
     */
    function getCellMeta(cell, path, defaultValue) {
        return Props.getDataItem(cell.metadata, path, defaultValue);
    }

    /**
     * Given a cell with the given id (as stored in the kbase.attributes metadata), this
     * returns the title of that cell (as stored in kbase.attributes.title).
     * If no cell is present with that id, returns undefined
     * @param {string} cellId the cell id stored in the kbase.attributes.id metadata field
     * @returns {string} the title of the cell with that id or undefined
     */
    function getTitle(cellId) {
        const cellWithId = findById(cellId);
        if (cellWithId) {
            return getCellMeta(cellWithId, 'kbase.attributes.title');
        }
    }

    /**
     * Given a unique cell id, this attempts to find and return associated the Jupyter
     * notebook cell. If there is no cell with that id, or more than one cell with that id,
     * this returns undefined. If and only if there's a single cell with that id, it gets returned.
     * @param {string} id the unique cell id stored in the kbase.attributes.id metadata
     * @returns a Jupyter notebook cell with the id, or undefined
     */
    function findById(id) {
        const matchingCells = Jupyter.notebook.get_cells().filter((cell) => {
            return id === getCellMeta(cell, 'kbase.attributes.id');
        });
        if (matchingCells.length === 1) {
            return matchingCells[0];
        }
        if (matchingCells.length > 1) {
            console.warn('Too many cells matched the given id: ' + id);
        }
    }

    return {
        getMeta,
        setMeta,
        getCellMeta,
        setCellMeta,
        getTitle,
        findById,
    };
});
