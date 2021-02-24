/**
 * KBase preset wrapper for its cell menu.
 */
define([
    'jquery',
    'notebook/js/celltoolbar',
    'base/js/namespace',
    'kb_common/html',
    // 'kbaseNarrativeCellMenu',
    'kbaseCellToolbarMenu'
], (
    $,
    celltoolbar,
    Jupyter,
    html,
    // KBaseNarrativeCellMenu,
    KBaseMenu
) => {
    'use strict';

    const t = html.tag,
        span = t('span');

    /*
     * Dealing with metadata
     */
    function getMeta(cell, group, name) {
        if (!cell.metadata.kbase) {
            return;
        }
        if (!cell.metadata.kbase[group]) {
            return;
        }
        return cell.metadata.kbase[group][name];
    }

    function makeKBaseMenu($toolbarNode, cell) {
        const kbaseMenu = KBaseMenu.make();
        kbaseMenu.register_callback($toolbarNode, cell);
    }

    function status(toolbarDiv, cell) {
        const status = getMeta(cell, 'attributes', 'status'),
            content = span({ style: { fontWeight: 'bold' } }, status);
        toolbarDiv.append(span({ style: { padding: '4px' } }, content));
    }

    function jobStatus(toolbarDiv, cell) {
        const jobStatus = getMeta(cell, 'attributes', 'jobStatus'),
            content = span({ style: { fontWeight: 'bold' } }, jobStatus);
        $(toolbarDiv).append(span({ style: { padding: '4px' } }, content));
    }

    const register = function (notebook) {
        celltoolbar.CellToolbar.register_callback('kbase-status', status);
        celltoolbar.CellToolbar.register_callback('kbase-job-status', jobStatus);
        celltoolbar.CellToolbar.register_callback('kbase-menu', makeKBaseMenu);

        // default.rawedit for the metadata editor
        celltoolbar.CellToolbar.register_preset('KBase', ['kbase-menu']);
    };
    return { register: register };
});
