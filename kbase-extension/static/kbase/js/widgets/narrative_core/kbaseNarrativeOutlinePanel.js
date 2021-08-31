/* eslint-env browser */
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
            /** If true, all markdown H1-H3 will be outline items
             * If false, only the first header will be an outline item */
            showAllHeaders: false,
            /** Header height for visibility & scroll functionality */
            headerHeight: 80,
            /** Refresh throttle rate in ms */
            refreshRate: 100,
        },

        isActive: false,
        body: undefined,
        drawnState: '', // string representing the items drawn used to eliminate excess dom manipulation

        init: function (options) {
            this._super(options);
            this.body = $(this.body());

            const refresh = this.refresh.bind(this);
            // Trigger refresh on the following events
            $([Jupyter.events]).on('notebook_loaded.Notebook', refresh);
            $([Jupyter.events]).on('notebook_saved.Notebook', refresh);
            $([Jupyter.events]).on('notebook_renamed.Notebook', refresh);
            $([Jupyter.events]).on('command_mode.Notebook', refresh); // Clicking out of a cell
            $([Jupyter.events]).on('create.Cell', refresh);
            $([Jupyter.events]).on('delete.Cell', refresh);
            $([Jupyter.events]).on('select.Cell', refresh); // Triggers on cell move
            $('#notebook-container').scroll(refresh);

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
            if (this.refresh_timeout || !this.isActive) return;
            this.refresh_timeout = setTimeout(() => {
                this.refresh_timeout = undefined;
                this.renderOutline();
            }, this.options.refreshRate);
        },

        renderOutline: function () {
            // Extract Outline Items and their depth from notebook cells
            const outline_items = [];
            Jupyter.notebook.get_cells().forEach((cell) => {
                // Find any headers in the cell
                let inner_headers = cell.element[0].querySelectorAll('h1, h2, h3');
                // Differentiate between cell types for creating items
                if (cell.cell_type === 'markdown' && inner_headers.length !== 0) {
                    // Create header items for markdown cell
                    if (!this.options.showAllHeaders) inner_headers = [inner_headers[0]];
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

            const stateStr = outline_items.reduce((stateStr, item) => {
                return stateStr + '|' + [item.depth, item.title, item.icon].join('|');
            }, '');

            if (stateStr !== this.drawnState) {
                // Create root nested outline node
                const root_node = { content: null, children: [], depth: 0 };
                // Use a stack to nest outline nodes based on item depth
                const stack = [root_node];
                outline_items.forEach((item) => {
                    while (stack[stack.length - 1].depth >= item.depth) {
                        stack.pop();
                    }
                    const node = {
                        item: item,
                        children: [],
                        depth: item.depth,
                    };
                    stack[stack.length - 1].children.push(node);
                    stack.push(node);
                });

                // Render the outline tree
                this.body.empty();
                this.body.append(
                    $('<div>').addClass('kb-narr-outline').append(this.renderOutlineNode(root_node))
                );
                this.drawnState = stateStr;
            }

            // Highlight Items
            this.body.find('.kb-narr-outline__item').each(function (i) {
                const item = outline_items[i];
                $(this).toggleClass('kb-narr-outline__item--highlight', item.in_view);
                $(this).toggleClass('kb-narr-outline__item--highlight-selected', item.selected);
            });
        },

        /** Render a nested outline node and its children recursively */
        renderOutlineNode: function (node) {
            // If not the root node, create the item
            if (node.depth !== 0) {
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

            if (node.depth === 0) {
                return children;
            } else {
                return $('<li>').append(node.content).append(children);
            }
        },

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
