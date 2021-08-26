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

        init: function (options) {
            this._super(options);

            this.$mainPanel = $('<div>');
            this.body().append(this.$mainPanel);
            this.$mainPanel.append(
                $('<h5>').text('KBase Narrative Outline')
            )
            
            // Extract Outline Items and their depth from notebook cells
            const outline_items = [];
            Jupyter.notebook.get_cells().forEach((cell) => {
                // Find any headers in the cell
                const inner_headers = cell.element[0].querySelectorAll('h1, h2, h3');

                if (cell.cell_type === 'markdown' && inner_headers.length !== 0) {
                    const md_items = Array.from(inner_headers).map(h=>({
                        title: h.innerText,
                        depth: parseInt(h.nodeName[1]),
                        element: h
                    }));
                    Array.prototype.push.apply(outline_items, md_items)
                } else {
                    outline_items.push({
                        depth: 4,
                        title: cell.metadata.kbase.attributes.title || 'Untitled Cell',
                        element: cell.element[0]
                    })
                }               
            });

            // Create the outline root node
            const $outline = $('<div>').addClass('kb-narr-outline').appendTo(this.$mainPanel);
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

            // the string name of the workspace.
            this.ws_name = Jupyter.narrative.getWorkspaceName();

            $([Jupyter.events]).on('notebook_saved.Notebook', () => {
                this.refresh();
            });

            // doesn't need a title, so just hide it to avoid padding.
            // yes, it's a hack. mea culpa.
            this.$elem.find('.kb-title').hide();
            return this;
        },

        renderOutlineNode: function (node) {
            if(!node.content){
                node.content = $('<div>').addClass('kb-narr-outline__item').append(
                    $('<a>').text(node.item.title).attr('href', '#')
                        .click(() => {
                            node.item.element.scrollIntoView({behavior:"smooth"});
                            node.item.element.click();
                        })
                );
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
