/**
 * @typedef {Object} RootWidgetParams
 * @property {string} hostNodeId The id attribute for the DOM node into which this
 * widget should added.
 * @property {string} cellId The unique, permanent identifier for the cell for which
 * this widget serves
 * @property {object} state TO BE DESCRIBED
 * @property {string} moduleName The name of the dynamic service module from which to
 * request the service widget app
 * @property {string} widgetName The name of the widget within the dynamic service
 * @property {object} params The parameters object to be passed to the widget
 */

define([
    'preact',
    'htm',
    'common/jupyter',
    'base/js/namespace',
    'common/cellUtils',
    '../components/Main',
], (preact, htm, notebook, Jupyter, cellUtils, Main) => {
    'use strict';

    const { h } = preact;
    const html = htm.bind(h);

    const { getCellMeta } = cellUtils;

    /**
     * As the cell widget runs independently, it does not automatically have a
     * reference to a cell.
     *
     * @private
     *
     * @param {string} id
     *
     * @returns {NotebookCell}
     */
    function findCellForId(id) {
        const matchingCells = Jupyter.notebook.get_cells().filter((cell) => {
            if (cell.metadata && cell.metadata.kbase && cell.metadata.kbase.attributes) {
                return cell.metadata.kbase.attributes.id === id;
            }
            return false;
        });
        if (matchingCells.length === 1) {
            return matchingCells[0];
        }
        throw new Error(`Cannot find cell for id "${id}"`);
    }

    /**
     *
     * @param {RootWidgetParams} params
     */
    function Root({ hostNodeId, cellId, state, moduleName, widgetName, params }) {
        const container = document.createElement('div');
        container.classList.add('nbextensions-serviceWidgetCell-Root');

        const hostNode = document.getElementById(hostNodeId);

        if (hostNode === null) {
            console.error(`fCannot find host node with id "${hostNodeId}`);
        }

        hostNode.appendChild(container);

        const cell = findCellForId(cellId);

        const deleteTasks = [];

        const onDelete = (task) => {
            deleteTasks.push(task);
        };

        notebook.onEvent('delete.Cell', (_event, payload) => {
            const deletedCellId = getCellMeta(payload.cell, 'kbase.attributes.id');
            if (deletedCellId !== cellId) {
                return;
            }
            for (const task of deleteTasks) {
                try {
                    task();
                } catch (ex) {
                    console.error('Task with error, skipped: ', ex);
                }
            }
        });

        const content = html`
            <${Main}
                moduleName=${moduleName}
                isDynamicService=${true}
                widgetName=${widgetName}
                params=${params}
                state=${state}
                cell=${cell}
                onDelete=${onDelete}
            />
        `;
        preact.render(content, container);
    }

    return Root;
});
