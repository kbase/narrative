/**
 * Widget for Narrative Outline Panel
 * @author David Lyon  <dlyon@lbl.gov>
 * @public
 */
define(['jquery', 'base/js/namespace', 'kbwidget', 'kbaseNarrativeControlPanel', 'util/display'], (
    $,
    Jupyter,
    KBWidget,
    ControlPanel,
    DisplayUtil
) => {
    'use strict';
    return new KBWidget({
        name: 'kbaseNarrativeOutlinePanel',
        parent: ControlPanel,
        version: '1.0.0',
        options: {
            // If true, all markdown H1-H3 will be outline items
            // If false, only the first header will be an outline item
            showAllHeaders: false,
            // Refresh throttle rate in ms
            refreshRate: 100,
        },

        isActive: false,
        body: undefined,
        // string representing the items drawn used to eliminate excess dom manipulation
        drawnState: '',

        init: function (options) {
            this._super(options);
            this.body = $(this.body());

            const refresh = this.refresh.bind(this);
            $('#notebook-container').scroll(refresh);
            // Trigger refresh on the following jupyter events
            const refreshJupyterEvents = [
                'notebook_loaded.Notebook',
                'notebook_saved.Notebook',
                'notebook_renamed.Notebook',
                'command_mode.Notebook', // Triggers on clicking out of editing cell
                'create.Cell',
                'delete.Cell',
                'select.Cell', // Triggers on cell move
            ];
            $([Jupyter.events]).on(refreshJupyterEvents.join(' '), refresh);

            // Hide panel header
            this.$elem.find('.kb-title').hide();

            return this;
        },

        activate: function () {
            // Render when the panel is activated
            this.renderOutline();
            this.isActive = true;
        },

        deactivate: function () {
            this.isActive = false;
        },

        refresh: function () {
            if (this.refreshTimeout || !this.isActive) {
                return;
            }
            this.refreshTimeout = setTimeout(() => {
                this.refreshTimeout = undefined;
                this.renderOutline();
            }, this.options.refreshRate);
        },

        renderOutline: function () {
            const outlineItems = this.getOutlineItems();

            // Compute state string to determine if we need to redraw
            const stateStr = JSON.stringify(
                outlineItems.map(({ depth, title, icon }) => [depth, title, icon])
            );
            if (stateStr !== this.drawnState) {
                const outlineRoot = this.nestOutlineItems(outlineItems);
                // Redraw the outline tree
                this.body.empty();
                this.body.append(
                    $('<div>')
                        .addClass('kb-narr-outline')
                        .append(this.renderOutlineNode(outlineRoot))
                );
                this.drawnState = stateStr;
            }

            // Apply highlights to each item in the outline as needed
            this.body.find('.kb-narr-outline__item').each(function (i) {
                const item = outlineItems[i];
                $(this).toggleClass('kb-narr-outline__item--highlight', item.inView);
                $(this).toggleClass('kb-narr-outline__item--highlight-selected', item.selected);
            });
        },

        /**
         * @typedef {Object} OutlineItem
         * @property {string} title - Title of the cell/item
         * @property {number} depth - Depth of the item in the outline tree
         * @property {jQuery} element - the cell's jquery element
         * @property {boolean} inView - Whether the cell is visible on screen
         * @property {boolean} selected - Whether the cell is selected
         * @property {string} icon - Icon HTML for the cell, pulled using cell.getIcon()
         * @property {function} scrollTo - Calling this function will scroll the item's cell into view and select it
         */

        /**
         * Extract Outline Items and their depth from notebook cells
         * @returns {OutlineItem[]} - Array of outline items
         */
        getOutlineItems: function () {
            const outlineItems = [];
            Jupyter.notebook.get_cells().forEach((cell) => {
                // Find any headers in the cell
                let innerHeaders = cell.element[0].querySelectorAll('h1, h2, h3');
                // Differentiate between cell types for creating items
                if (cell.cell_type === 'markdown' && innerHeaders.length !== 0) {
                    // Create header items for markdown cell
                    if (!this.options.showAllHeaders) {
                        innerHeaders = [innerHeaders[0]];
                    }
                    const mdItems = Array.from(innerHeaders).map((h, i) => ({
                        title: h.innerText,
                        depth: parseInt(h.nodeName[1]),
                        element: i === 0 ? cell.element[0] : h,
                        inView: DisplayUtil.verticalInViewport(cell.element[0]),
                        selected: cell.selected,
                        icon: i === 0 ? cell.getIcon() : '',
                        scrollTo: () => Jupyter.narrative.scrollToCell(cell, true),
                    }));
                    Array.prototype.push.apply(outlineItems, mdItems);
                } else {
                    // Create cell items for any other cell type
                    outlineItems.push({
                        title: cell.metadata.kbase.attributes.title || 'Untitled Cell',
                        depth: 4,
                        element: cell.element[0],
                        inView: DisplayUtil.verticalInViewport(cell.element[0]),
                        selected: cell.selected,
                        icon: cell.getIcon(),
                        scrollTo: () => Jupyter.narrative.scrollToCell(cell, true),
                    });
                }
            });
            return outlineItems;
        },

        /**
         * @typedef {Object} OutlineNode
         * @property {OutlineItem} item - The outline item for this node
         * @property {OutlineNode[]} children - Array of child nodes
         */

        /**
         * Create nodes from Outline Items and nests them based on depth
         * @param {OutlineItem[]} outlineItems - Array of outline items
         * @returns {OutlineNode} - Root node of the outline
         */
        nestOutlineItems: function (outlineItems) {
            // Create root nested outline node
            const rootNode = { content: null, children: [], item: { depth: 0 } };
            // Use a stack to nest outline nodes based on item depth
            const stack = [rootNode];
            outlineItems.forEach((item) => {
                while (stack[stack.length - 1].item.depth >= item.depth) {
                    stack.pop();
                }
                const node = {
                    item: item,
                    children: [],
                };
                stack[stack.length - 1].children.push(node);
                stack.push(node);
            });
            return rootNode;
        },

        /**
         * Render a nested outline node and its children recursively
         * @param {OutlineNode} node - The node to render
         * @returns {jQuery} - The rendered node
         */
        renderOutlineNode: function (node) {
            // If not the root node, create the item
            if (node.item.depth !== 0) {
                node.content = $('<div>')
                    .addClass('kb-narr-outline__item')
                    .attr('title', node.item.title)
                    .append(
                        $('<span>')
                            .addClass('kb-narr-outline__item-icon-wrapper')
                            .append($(node.item.icon).addClass('kb-narr-outline__item-icon'))
                    )
                    .append(
                        $('<a>')
                            .text(node.item.title)
                            .attr('href', '#')
                            .attr('title', node.item.title)
                            .addClass('kb-narr-outline__item-content')
                            .click(() => node.item.scrollTo())
                    )
                    .click(() => node.item.scrollTo());
            }

            // Render the children
            const children = $('<ul>');
            node.children.forEach((child) => {
                children.append(this.renderOutlineNode(child));
            });

            if (node.item.depth === 0) {
                return children;
            } else {
                return $('<li>').append(node.content).append(children);
            }
        },
    });
});
