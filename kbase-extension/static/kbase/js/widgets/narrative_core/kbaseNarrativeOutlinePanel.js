/**
 * Widget for Narrative Outline Panel
 * @author David Lyon  <dlyon@lbl.gov>
 * @public
 */
define(['jquery', 'base/js/namespace', 'kbwidget', 'kbaseNarrativeControlPanel'], (
    $,
    Jupyter,
    KBWidget,
    ControlPanel
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
            // Header height for visibility & scroll functionality
            headerHeight: 80,
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
                'select.Cell' // Triggers on cell move
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
            if (this.refresh_timeout || !this.isActive) {
                return;
            }
            this.refresh_timeout = setTimeout(() => {
                this.refresh_timeout = undefined;
                this.renderOutline();
            }, this.options.refreshRate);
        },

        renderOutline: function () {
            const outline_items = this.getOutlineItems();

            // Compute state string to determine if we need to redraw
            const stateStr = JSON.stringify(outline_items.map(({ depth, title, icon }) => ([depth, title, icon])));
            if (stateStr !== this.drawnState) {
                const outline_root = this.nestOutlineItems(outline_items);
                // Redraw the outline tree
                this.body.empty();
                this.body.append(
                    $('<div>').addClass('kb-narr-outline')
                        .append(
                            this.renderOutlineNode(outline_root)
                        )
                );
                this.drawnState = stateStr;
            }

            // Apply highlights to each item in the outline as needed
            this.body.find('.kb-narr-outline__item').each(function (i) {
                const item = outline_items[i];
                $(this).toggleClass('kb-narr-outline__item--highlight', item.in_view);
                $(this).toggleClass('kb-narr-outline__item--highlight-selected', item.selected);
            });
        },

        /**
         * @typedef {Object} OutlineItem
         * @property {string} title - Title of the cell/item
         * @property {number} depth - Depth of the item in the outline tree
         * @property {jQuery} element - the cell's jquery element
         * @property {boolean} in_view - Whether the cell is visible on screen
         * @property {boolean} selected - Whether the cell is selected
         * @property {string} icon - Icon HTML for the cell, pulled using cell.getIcon()
         */

        /**
         * Extract Outline Items and their depth from notebook cells
         * @returns {OutlineItem[]} - Array of outline items
         */
        getOutlineItems: function () {
            const outline_items = [];
            Jupyter.notebook.get_cells().forEach((cell) => {
                // Find any headers in the cell
                let inner_headers = cell.element[0].querySelectorAll('h1, h2, h3');
                // Differentiate between cell types for creating items
                if (cell.cell_type === 'markdown' && inner_headers.length !== 0) {
                    // Create header items for markdown cell
                    if (!this.options.showAllHeaders) {
                        inner_headers = [inner_headers[0]];
                    }
                    const md_items = Array.from(inner_headers).map((h, i) => ({
                        title: h.innerText,
                        depth: parseInt(h.nodeName[1]),
                        element: i === 0 ? cell.element[0] : h,
                        in_view: this.cellInView(cell.element[0]),
                        selected: cell.selected,
                        icon: i === 0 ? cell.getIcon() : '',
                    }));
                    Array.prototype.push.apply(outline_items, md_items);
                } else {
                    // Create cell items for any other cell type
                    outline_items.push({
                        title: cell.metadata.kbase.attributes.title || 'Untitled Cell',
                        depth: 4,
                        element: cell.element[0],
                        in_view: this.cellInView(cell.element[0]),
                        selected: cell.selected,
                        icon: cell.getIcon(),
                    });
                }
            });
            return outline_items;
        },

        /**
         * @typedef {Object} OutlineNode
         * @property {OutlineItem} item - The outline item for this node
         * @property {OutlineNode[]} children - Array of child nodes
         */

        /**
         * Create nodes from Outline Items and nests them based on depth
         * @param {OutlineItem[]} outline_items - Array of outline items
         * @returns {OutlineNode} - Root node of the outline
         */
        nestOutlineItems: function (outline_items) {
            // Create root nested outline node
            const root_node = { content: null, children: [], item: { depth: 0 } };
            // Use a stack to nest outline nodes based on item depth
            const stack = [root_node];
            outline_items.forEach((item) => {
                while (stack[stack.length - 1].item.depth >= item.depth) {
                    stack.pop();
                }
                const node = {
                    item: item,
                    children: []
                };
                stack[stack.length - 1].children.push(node);
                stack.push(node);
            });
            return root_node;
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
                            .click(() => this.scrollToItem(node.item))
                    )
                    .click(() => this.scrollToItem(node.item));
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

        /**
         * Scroll to the cell corresponding to the given outline item
         * @param {OutlineItem} item - The outline item to scroll to
         */
        scrollToItem: function (item) {
            const nb = $('#notebook-container');
            const scroll_to = nb.scrollTop() + $(item.element).offset().top;
            nb.get(0).scrollTo({
                // scroll further down to account for header
                top: scroll_to - this.options.headerHeight,
                behavior: 'smooth',
            });
            item.element.click(); // select the cell
        },

        /**
         * Check if the given cell element is visible on screen, accounting for header height
         * @param {HTMLElement} el - The cell element to check
         */
        cellInView: function (el) {
            const box = el.getBoundingClientRect();
            const headerHeight = this.options.headerHeight;
            const windowHeight = $(window).height();
            if (
                // Fully visible or spanning the screen
                (box.top <= headerHeight && box.bottom >= windowHeight) ||
                (box.top >= headerHeight && box.bottom <= windowHeight)
            ) {
                return true;
            } else if (
                // Partially visible at either top or bottom
                (box.top >= headerHeight && box.top <= windowHeight) ||
                (box.bottom >= headerHeight && box.bottom <= windowHeight)
            ) {
                return true;
            }
            return false;
        },
    });
});
