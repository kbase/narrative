/* eslint-env browser */
/**
 * Widget for Narrative Outline Panel
 * @author David Lton  <dlyon@lbl.gov>
 * @public
 */
define([
    'jquery',
    'base/js/namespace',
    'kbwidget',
    'kbaseNarrativeControlPanel'
], (
    $,
    Jupyter,
    KBWidget,
    ControlPanel,
) => {
    'use strict';
    return new KBWidget({
        name: 'kbaseNarrativeOutlinePanel',
        parent: ControlPanel,
        version: '1.0.0',
        options: {},
        ws_name: null,
        $mainPanel: null,
        SHOW_ALL_HEADERS: false,

        init: function (options) {
            this._super(options);

            this.$mainPanel = $('<div>').css({"padding":"0 1em 0 1em"}).appendTo(this.body());

            // the string name of the workspace.
            this.ws_name = Jupyter.narrative.getWorkspaceName();
            
            
            const refresh = this.refresh.bind(this);
            // Trigger refresh
            $([Jupyter.events]).on('notebook_saved.Notebook', refresh);
            $([Jupyter.events]).on('notebook_renamed.Notebook', refresh);
            $([Jupyter.events]).on('command_mode.Notebook', refresh); // Clicking out of a cell
            $([Jupyter.events]).on('create.Cell', refresh);
            $([Jupyter.events]).on('delete.Cell', refresh);
            $([Jupyter.events]).on('select.Cell', refresh); // Triggers on cell move
            $('#notebook-container').scroll(refresh);
            

            // doesn't need a title, so just hide it to avoid padding.
            // yes, it's a hack. mea culpa.
            this.$elem.find('.kb-title').hide();
            return this;
        },

        activate: function () {
            this.refresh();
        },

        refresh: function () {
            if (this.refresh_timeout) return;
            this.refresh_timeout = setTimeout(() => {
                this.refresh_timeout = undefined;
                this.doRefresh();
            }, 100);
        },

        doRefresh: function () {
            // Extract Outline Items and their depth from notebook cells
            const outline_items = [];
            Jupyter.notebook.get_cells().forEach((cell) => {
                // Find any headers in the cell
                let inner_headers = cell.element[0].querySelectorAll('h1, h2, h3');

                if (cell.cell_type === 'markdown' && inner_headers.length !== 0) {
                    if (!this.SHOW_ALL_HEADERS) inner_headers  = [inner_headers[0]];
                    const md_items = Array.from(inner_headers).map((h,i)=>({
                        title: h.innerText,
                        depth: parseInt(h.nodeName[1]),
                        element: h,
                        in_view: this.elementInView(cell.element[0]),
                        selected: cell.selected,
                        icon: i===0?cell.getIcon():''
                    }));
                    Array.prototype.push.apply(outline_items, md_items)
                } else {
                    outline_items.push({
                        depth: 4,
                        title: cell.metadata.kbase.attributes.title || 'Untitled Cell',
                        element: cell.element[0],
                        in_view: this.elementInView(cell.element[0]),
                        selected: cell.selected,
                        icon: cell.getIcon()
                    })
                }               
            });

            // Create the outline root node
            const $outline = $('<div>').addClass('kb-narr-outline');
            const root_node = {content:$outline, children:[], depth:0};

            // Use a stack to nest the outline nodes based on item depth
            const stack = [root_node];
            outline_items.forEach((item) => {
                while (stack[stack.length-1].depth >= item.depth) {
                    stack.pop();
                }
                const node = {
                    item:item,
                    children: [],
                    depth: item.depth,
                }
                stack[stack.length-1].children.push(node);
                stack.push(node);
            });

            // Render the outline tree
            this.renderOutlineNode(root_node);
            // Mount the outline tree
            this.$mainPanel.empty();
            this.$mainPanel.append(
                $('<h5>').css({
                    "color": "#006698",
                    "font-weight": "bold",
                    "font-size": "15px"
                }).text(Jupyter.notebook.metadata.name)
            ).append($outline);
        },

        elementInView: function (el) {
            const box = el.getBoundingClientRect();
            const header_height = 80;
            const window_height = $(window).height();
            if ( // Fully visible or spanning the screen
                box.top <= header_height && box.bottom >= window_height ||
                box.top >= header_height && box.bottom <= window_height
            ) {
                return true;
            } else if ( // Partially visible at either top or bottom
                box.top >= header_height && box.top <= window_height ||
                box.bottom >= header_height && box.bottom <= window_height
            ){
                return true;
            }
            return false
        },

        renderOutlineNode: function (node) {
            if(!node.content){
                node.content = $('<div>').addClass('kb-narr-outline__item')
                    .append(
                        $('<span>').addClass('kb-narr-outline__item-icon-wrapper')
                            .append(
                                $(node.item.icon).addClass('kb-narr-outline__item-icon')
                            )
                    )
                    .append(
                        $('<a>').text(node.item.title).attr('href', '#')
                            .addClass('kb-narr-outline__item-content')
                            .click(() => {
                                const nb = $("#notebook-container");
                                const scroll_to = nb.scrollTop() + $(node.item.element).offset().top;
                                nb.get(0).scrollTo({
                                    top: scroll_to - 80, // scroll further to account for header
                                    behavior:"smooth",
                                })
                                node.item.element.click(); // select the cell
                            })
                    );

                if(node.item.in_view || node.item.selected){
                    node.content.addClass('kb-narr-outline__highlight');
                    if(node.item.selected){
                        node.content.addClass('kb-narr-outline__highlight--selected');
                    } 
                } 
            }
            const ul = $('<ul>');
            node.children.forEach((child) => {
                ul.append(  this.renderOutlineNode(child) ); 
            });
            if(node.depth === 0) {
                return node.content.append(ul);
            } else {
                return $('<li>').append(node.content).append(ul);
            }
        }
    });
});
