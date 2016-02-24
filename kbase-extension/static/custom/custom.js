/*global define*/
/*jslint white: true*/
// leave at least 2 line with only a star on it below, or doc generation fails
/**
 *
 *
 * Placeholder for custom user javascript
 * mainly to be overridden in profile/static/custom/custom.js
 * This will always be an empty file in Jupyter
 *
 * User could add any javascript in the `profile/static/custom/custom.js` file.
 * It will be executed by the Jupyter notebook at load time.
 *
 * Same thing with `profile/static/custom/custom.css` to inject custom css into the notebook.
 *
 *
 * The object available at load time depend on the version of Jupyter in use.
 * there is no guaranties of API stability.
 *
 * The example below explain the principle, and might not be valid.
 *
 * Instances are created after the loading of this file and might need to be accessed using events:
 *     define([
 *        'base/js/namespace',
 *        'base/js/events'
 *     ], function(Jupyter, events) {
 *         events.on("app_initialized.NotebookApp", function () {
 *             Jupyter.keyboard_manager....
 *         });
 *     });
 *
 * __Example 1:__
 *
 * Create a custom button in toolbar that execute `%qtconsole` in kernel
 * and hence open a qtconsole attached to the same kernel as the current notebook
 *
 *    define([
 *        'base/js/namespace',
 *        'base/js/events'
 *    ], function(Jupyter, events) {
 *        events.on('app_initialized.NotebookApp', function(){
 *            Jupyter.toolbar.add_buttons_group([
 *                {
 *                    'label'   : 'run qtconsole',
 *                    'icon'    : 'icon-terminal', // select your icon from http://fortawesome.github.io/Font-Awesome/icons
 *                    'callback': function () {
 *                        Jupyter.notebook.kernel.execute('%qtconsole')
 *                    }
 *                }
 *                // add more button here if needed.
 *                ]);
 *        });
 *    });
 *
 * __Example 2:__
 *
 * At the completion of the dashboard loading, load an unofficial javascript extension
 * that is installed in profile/static/custom/
 *
 *    define([
 *        'base/js/events'
 *    ], function(events) {
 *        events.on('app_initialized.DashboardApp', function(){
 *            require(['custom/unofficial_extension.js'])
 *        });
 *    });
 *
 * __Example 3:__
 *
 *  Use `jQuery.getScript(url [, success(script, textStatus, jqXHR)] );`
 *  to load custom script into the notebook.
 *
 *    // to load the metadata ui extension example.
 *    $.getScript('/static/notebook/js/celltoolbarpresets/example.js');
 *    // or
 *    // to load the metadata ui extension to control slideshow mode / reveal js for nbconvert
 *    $.getScript('/static/notebook/js/celltoolbarpresets/slideshow.js');
 *
 *
 * @module Jupyter
 * @namespace Jupyter
 * @class customjs
 * @static
 */
define(['jquery',
    'base/js/namespace',
    'base/js/security',
    'base/js/utils',
    'base/js/page',
    'notebook/js/codecell',
    'notebook/js/notebook',
    'notebook/js/textcell',
    'notebook/js/savewidget',
    'notebook/js/celltoolbar',
    'base/js/dialog',
    'base/js/keyboard',
    'notebook/js/cell',
    'services/config',
    'notebook/js/mathjaxutils',
    'components/marked/lib/marked',
    'components/requirejs/require',
    'narrative_paths',
    'kbaseNarrativeCellMenu'
],
    function ($,
        Jupyter,
        security,
        utils,
        page,
        codeCell,
        notebook,
        textCell,
        saveWidget,
        cellToolbar,
        dialog,
        keyboard,
        cell,
        config,
        mathjaxutils,
        marked) {
        'use strict';

        // Patch the security mechanisms to allow any JavaScript to run for now.
        // TODO: update this so only the few KBase commands run.
        security.sanitize_html = function (html, allow_css) {
            return html;
        };
        security.sanitize_css = function (css, tagPolicy) {
            return css;
        };
        security.sanitize_stylesheets = function (html, tagPolicy) {
            return html;
        };

        cellToolbar.CellToolbar.prototype.renderToggleState = function () {
            var toggleState = this.cell.getCellState('toggleState', 'unknown');
            // Test to see if the kbaseNarrativeCellMenu is attached to this toolbar.
            var elemData = $(this.inner_element).find('.button_container').data();
            if (elemData && elemData['kbaseNarrativeCellMenu'])
               $(this.inner_element).find('.button_container').kbaseNarrativeCellMenu('toggleState', toggleState);
        };
        
        // disable hiding of the toolbar
        cellToolbar.CellToolbar.prototype.hide = function () {
            return;
        }

        textCell.MarkdownCell.prototype.renderToggleState = function () {
            cell.Cell.prototype.renderToggleState.apply(this);
            var $cellNode = $(this.element);
            var type = cellType(this) || 'unknown';
            switch (this.getCellState('toggleState', 'unknown')) {
                case 'closed':
                    $cellNode.removeClass('opened');
                    $cellNode.trigger('show-title.cell');
                    $cellNode.find('.inner_cell > div:nth-child(2)').css('display', 'none');
                    $cellNode.find('.inner_cell > div:nth-child(3)').css('display', 'none');
                    break;
                case 'open':
                    $cellNode.addClass('opened');
                    if (type === 'unknown') {
                        $cellNode.trigger('hide-title.cell');
                    }
                    $cellNode.find('.inner_cell > div:nth-child(2)').css('display', '');
                    $cellNode.find('.inner_cell > div:nth-child(3)').css('display', '');
                    break;
                case 'unknown':
                    $cellNode.addClass('opened');
                    if (type === 'unknown') {
                        $cellNode.trigger('hide-title.cell');
                    }
                    $cellNode.find('.inner_cell > div:nth-child(2)').css('display', '');
                    $cellNode.find('.inner_cell > div:nth-child(3)').css('display', '');
                    break;
            }
        };

        // Patch the MarkdownCell renderer to run the Javascript we need.
        textCell.MarkdownCell.options_default = {
            cm_config: {
                mode: 'ipythongfm'
            },
            placeholder: "_Markdown_ and LaTeX cell - double click here to edit."
            // "Type _Markdown_ and LaTeX: $\\alpha^2$" +
            //     "<!-- " +
            //     "The above text is Markdown and LaTeX markup.\n" +
            //     "It is provided as a quick sample of what you can do in a Markdown cell.\n" +
            //     "Markdown cells are marked with the paragraph icon.\n" +
            //     "This is a comment, so it does not appear when rendered.\n" +
            //     "Also note that the first item in the cell or the first first-level" +
            //     "header will appear as the cell title." +
            //     "-->"
        };

        var original_unselect = cell.Cell.prototype.unselect;
        cell.Cell.prototype.unselect = function (leave_selected) {
            var wasSelected = original_unselect.apply(this, [leave_selected]);
            $(this.element).trigger('unselected.cell');
            return wasSelected;
        };
        
        var original_select = cell.Cell.prototype.select;
        cell.Cell.prototype.select = function () {
            var wasSelected = original_select.apply(this);
            if (wasSelected) {
                $(this.element).trigger('selected.cell');
            }
            return wasSelected;
        };
        
        cell.Cell.prototype.getCellState = function (name, defaultValue) {
            if (!this.metadata.kbstate) {
                this.metadata.kbstate = {};
            }
            var value = this.metadata.kbstate[name];
            if (value === undefined) {
                return defaultValue;
            } else {
                return value;
            }
        };

        cell.Cell.prototype.setCellState = function (name, value) {
            if (!this.metadata.kbstate) {
                this.metadata.kbstate = {};
            }
            this.metadata.kbstate[name] = value;
        };
        
        cell.Cell.prototype.toggle = function () {
            switch (this.getCellState('toggleState', 'unknown')) {
                case 'closed':
                    this.setCellState('toggleState', 'open');
                    break;
                case 'open':
                    this.setCellState('toggleState', 'closed');
                    break;
                case 'unknown':
                    this.setCellState('toggleState', 'closed');
                    break;
            }
            this.renderToggleState();
        };
        
        cell.Cell.prototype.renderToggleState = function () {
            this.celltoolbar.renderToggleState();
        };
        
        function cellType(cell) {
            // Cells are (currently) rendered twice. The first time the kb metadata
            // is not available, but we can rely on future renders.
            if (cell.renderCount > 1) {
                return;
            }

            var type = cell.metadata &&
                    cell.metadata['kb-cell'] &&
                    cell.metadata['kb-cell']['type'];
                
            // Markdown cells don't of course have a kb cell type.
            if (type === undefined) {
                return;
            }
                
            switch (type) {
                case 'function_input': 
                    return 'method';
                    break;
                case 'kb_app':
                    return 'app';
                    break;
                case 'function_output':
                    return 'output';
                    break;
                default:
                    return 'unknown';
            }
            
        }

        textCell.MarkdownCell.prototype.render = function () {
            /*
             * Ahem, these silly javascript method overriding or extensions. 
             * First, you need to know what the parent object prototype
             * does, in order for this to make any sense. For rendering, what 
             * does it mean to extend or override the rendering? Does the parent
             * class actually do any rendering, i.e. create display elements based
             * on data? In this case, no. TextCell has no base render method, but
             * above that Cell does, but it only checks to see if the rendering 
             * flags mean that rendering is required and returns that value. It
             * is that return value which is used here to determine whether 
             * rendering should be done or not. 
             * I would argue that there should just be a method "needRender".
             */
            var needsToRender = textCell.TextCell.prototype.render.apply(this);
            
            // which cell type is it? KBase hosts apps, methods, and output cells
            // within markdown cells.
            if (cell.renderCount === undefined) {
                cell.renderCount = 0;
            }
            cell.renderCount += 1;
            var kbCellType = cellType(this);

            if (kbCellType) {
                $(this.element).addClass('kb-cell');
                this.set_rendered(this.get_text());
                this.typeset();
                return needsToRender;
            }
            
            if (needsToRender) {
                var that = this,
                    text = this.get_text(),
                    math = null,
                    $html;

                if (text === "") {
                    text = this.placeholder;
                }
                var text_and_math = mathjaxutils.remove_math(text);
                text = text_and_math[0];
                math = text_and_math[1];
                
                marked(text, function (err, html) {
                    html = mathjaxutils.replace_math(html, math);
                    html = security.sanitize_html(html);
                    try {
                        $html = $($.parseHTML(html, undefined, true));

                        // Extract title from h1, if any. otheriwse, first 50 characters
                        var title = $html.filter('h1').first().first().text();
                        if (!title && $html.first().html()) {
                            title = $html.first().html().substr(0, 50) || '';
                        }

                        // add anchors to headings
                        $html.find(":header").addBack(":header").each(function (i, h) {
                            h = $(h);
                            var hash = h.text().replace(/ /g, '-');
                            h.attr('id', hash);
                            h.append(
                                $('<a/>')
                                .addClass('anchor-link')
                                .attr('href', '#' + hash)
                                .text('¶')
                                );
                        });
                        // links in markdown cells should open in new tabs
                        $html.find("a[href]").not('[href^="#"]').attr("target", "_blank");


                    } catch (error) {
                        title = 'Markdown Error';
                        $html = "Error while parsing markdown cell: " + error;
                    }

                    that.setCellState('title', title || '');
                    // that.setCellState('icon', '<i class="fa fa-2x fa-paragraph markdown-icon"></i>');
                    that.set_rendered($html);
                    that.typeset();
                    that.events.trigger("rendered.MarkdownCell", {cell: that});
                });
            }
            return needsToRender;
        };

        /** @method bind_events **/
        textCell.MarkdownCell.prototype.bind_events = function () {
            textCell.TextCell.prototype.bind_events.apply(this);

            var cell = this,
                $cellNode = $(this.element);

            this.element.dblclick(function () {
                var cont = cell.unrender();
                if (cont) {
                    cell.focus_editor();
                }
            });

            /*
             * This is the trick to get the markdown to render, and the edit area
             * to disappear, when the user clicks out of the edit area.
             */
            this.code_mirror.on('blur', function () {
                cell.render();
            });


            /*
             * The cell toolbar buttons area knows how to set the title and 
             * icon for itself. But we store the title and icon here in case
             * the celltoolbar is not fully built yet. In that case, it will
             * look at the containing cell to see if it has been set yet, and if
             * so will use that (of course listening for these events too.)
             */
            $cellNode
                .on('set-title.cell', function (e, title) {
                    if (title === undefined) {
                        return;
                    }
                    cell.setCellState('title', title);
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    $menu.trigger('set-title.toolbar', [title || '']);
                    if (cellType(cell) !== undefined)
                        $(cell.element).trigger('show-title.cell');
                });

            $cellNode
                .on('hide-title.cell', function (e) {
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    $menu.trigger('hide-title.toolbar');
                });

            $cellNode
                .on('show-title.cell', function (e) {
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    $menu.trigger('show-title.toolbar');
                });

            $cellNode
                .on('set-icon.cell', function (e, icon) {
                    cell.setCellState('icon', icon);
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    $menu.trigger('set-icon.toolbar', [icon]);
                });
                
            $cellNode
                .on('job-state.cell', function (e, data) {
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    $menu.trigger('job-state.toolbar', data);
                });


            /*
             * This is how the cell propagates the select/unselect events to
             * the child "widget" -- the celltoolbar in this case.
             * But, of course, it is a hack.
             * - we should be able to add it as a behavior on the cell prototype
             * - we should be able to propagate it to the celltoolbar itself, we
             *   are talking to the button area, because that is what we are able
             *   to control inside the celltoolbar
             */
            // this.events
            $(this.element)
                .on('unselected.cell', function (e) {
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    cell.setCellState('selected', false);
                    $menu.trigger('unselected.toolbar');
                });

            // this.events
            $(this.element)
                .on('selected.cell', function (e) {
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    cell.setCellState('selected', true); 
                    $menu.trigger('selected.toolbar');
                });

            this.events.on('rendered.MarkdownCell', function (e, data) {
                cell.renderToggleState();
                $(cell.element).trigger('set-title.cell', cell.getCellState('title'));
                //$(cell.element).trigger('set-icon.cell', ['<i class="fa fa-2x fa-paragraph markdown-icon"></i>']);
            });

            this.events.on('preset_activated.CellToolbar', function (e, data) {
                if (data.name === 'KBase') {
                    // This is really the kick-off for the narrative, since the
                    // presets on the celltoobar are loaded via event calls,
                    // so are not necessarily part of the synchronous process
                    // which builds the UI, and also of course the 
                   
                    // Set up the toolbar based on the state.
                    $(cell.element)
                        .trigger('set-title.cell', [cell.getCellState('title', '')]);
                    
                    $(cell.element)
                        .trigger('set-icon.cell', [cell.getCellState('icon', '')]);

                    cell.renderToggleState();
                }
            });
        };

        // Patch the MarkdownCell renderer to throw an error when failing to render Javascript we need.
        textCell.TextCell.prototype.set_rendered = function (text) {
            try {
                this.element.find('div.text_cell_render').html(text);
            } catch (error) {
                this.element.find('div.text_cell_render').html("Error while parsing markdown cell: " + error);
            }
        };

        /*
         * NEW:
         * 
         * Extend the Cell bind_events.
         * 
         * Adds cell toggling.
         */
        var original_cell_bind_events = cell.Cell.prototype.bind_events;
        cell.Cell.prototype.bind_events = function () {
            var cell = this;
            original_cell_bind_events.apply(this);
            $(this.element)
                .on('toggle.cell', function (e) {
                    // Alas, it has no discriminating attributes!
                    cell.toggle();
                });
        };

        /*
         * NEW:
         * 
         * Extend the CodeCell bind_events method to add handling of toolbar
         * events.
         * 
         *  A note on "extension" of a function object's function prototype:
         *  We first save the existing function, and then replace it with a new
         *  one which in its first statement executes the original one.
         *  This represents the existing behavior.
         *  Code following this represents the additional or extended behavior.
         *
         */
        var original_bind_events = codeCell.CodeCell.prototype.bind_events;
        codeCell.CodeCell.prototype.bind_events = function () {
            original_bind_events.apply(this);
            var $cellNode = $(this.element), cell = this;

            // TODO: toggle state on the cell object so we can be sure about this.
                
            $cellNode
                .on('unselected.cell', function (e) {
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    cell.setCellState('selected', false);
                    $menu.trigger('unselected.toolbar');
                });

            // this.events
            $cellNode
                .on('selected.cell', function (e) {
                    var $menu = $(cell.celltoolbar.element).find('.button_container');
                    cell.setCellState('selected', true);
                    $menu.trigger('selected.toolbar');
                });                
                
        };
        
        /*
         * NEW: 
         * 
         * Hides and shows code cell components based on the current toggle 
         * state of the cell, as reflected in the cell metadata
         * (via getCellState).
         */
        codeCell.CodeCell.prototype.renderToggleState = function () {
            cell.Cell.prototype.renderToggleState.apply(this);
            var $cellNode = $(this.element);
            var elemsToToggle = [
                $cellNode.find('.input .input_area'),
                // $cellNode.find('.widget-area'),
                $cellNode.find('.output_wrapper')
            ];
            switch (this.getCellState('toggleState', 'unknown')) {
                case 'closed':
                    $.each(elemsToToggle, function(i, elem) {
                        elem.hide();
                    });
                    break;
                default:
                    $.each(elemsToToggle, function(i, elem) {
                        elem.show();
                    });
                    break;
            }
        };

        notebook.Notebook.prototype.eachCell = function (fun) {
            var cells = this.get_cells();
            cells.forEach(function (cell) {
                fun(cell);
            });
        }


        // Patch the Notebook to return the right name
        notebook.Notebook.prototype.get_notebook_name = function () {
            if (!this.metadata.name) {
                this.metadata.name = this.notebook_name;
            }
            return this.metadata.name;
        };

        // Patch the Notebook to not wedge a file extension on a new Narrative name
        notebook.Notebook.prototype.rename = function (new_name) {
            var that = this;
            var parent = utils.url_path_split(this.notebook_path)[0];
            var new_path = utils.url_path_join(parent, new_name);
            return this.contents.rename(this.notebook_path, new_path).then(
                function (json) {
                    that.notebook_name = json.name;
                    that.notebook_path = json.path;
                    that.last_modified = new Date(json.last_modified);
                    that.session.rename_notebook(json.path);
                    that.events.trigger('notebook_renamed.Notebook', json);
                }
            );
        };

        // Patch the save widget to take in options at save time
        saveWidget.SaveWidget.prototype.rename_notebook = function (options) {
            options = options || {};
            var that = this;
            var dialog_body = $('<div/>').append(
                $("<p/>").addClass("rename-message")
                .text('Enter a new Narrative name:')
                ).append(
                $("<br/>")
                ).append(
                $('<input/>').attr('type', 'text').attr('size', '25').addClass('form-control')
                .val(options.notebook.get_notebook_name())
                );
            var d = dialog.modal({
                title: "Rename Narrative",
                body: dialog_body,
                notebook: options.notebook,
                keyboard_manager: this.keyboard_manager,
                buttons: {
                    "OK": {
                        class: "btn-primary",
                        click: function () {
                            var new_name = d.find('input').val();
                            d.find('.rename-message').text("Renaming and saving...");
                            d.find('input[type="text"]').prop('disabled', true);
                            that.notebook.rename(new_name).then(
                                function () {
                                    d.modal('hide');
                                    that.notebook.metadata.name = new_name;
                                    that.element.find('span.filename').text(new_name);
                                    Jupyter.narrative.saveNarrative();
                                }, function (error) {
                                d.find('.rename-message').text(error.message || 'Unknown error');
                                d.find('input[type="text"]').prop('disabled', false).focus().select();
                            }
                            );
                            return false;
                        }
                    },
                    "Cancel": {}
                },
                open: function () {
                    /**
                     * Upon ENTER, click the OK button.
                     */
                    d.find('input[type="text"]').keydown(function (event) {
                        if (event.which === keyboard.keycodes.enter) {
                            d.find('.btn-primary').first().click();
                            return false;
                        }
                    });
                    d.find('input[type="text"]').focus().select();
                }
            });
        };

        // Kickstart the Narrative loading routine once the notebook is loaded.
        $([Jupyter.events]).on('notebook_loaded.Notebook', function () {
            require(['kbaseNarrative'], function (Narrative) {
                Jupyter.narrative = new Narrative();

                $([Jupyter.events]).one('kernel_connected.Kernel', function() {
                    Jupyter.narrative.init();
                });

                /*
                 * Override the move-cursor-down-or-next-cell and 
                 * move-cursor-up-or-previous-cell actions.
                 *
                 * When editing a textcell (markdown or code), if a user uses 
                 * the arrow keys to move to another cell, it normally lands
                 * there in edit mode.
                 * 
                 * This is bad for KBase-ified markdown cells, since it shows
                 * the div and script tags that are used to render them, and
                 * screws up the state management. These overrides just
                 * check if the next cell is a KBase cell, and doesn't enable
                 * edit mode if so.
                 */
                Jupyter.keyboard_manager.actions.register(
                    {
                        handler: function(env, event) {
                            var index = env.notebook.get_selected_index();
                            var cell = env.notebook.get_cell(index);
                            if (cell.at_bottom() && index !== (env.notebook.ncells()-1)) {
                                if(event){
                                    event.preventDefault();
                                }
                                env.notebook.command_mode();
                                env.notebook.select_next(true);
                                if (!env.notebook.get_selected_cell().metadata['kb-cell']) {
                                    env.notebook.edit_mode();
                                    var cm = env.notebook.get_selected_cell().code_mirror;
                                    cm.setCursor(0, 0);
                                }
                            }
                            return false;
                        }
                    },
                    'move-cursor-down',
                    'jupyter-notebook'
                );

                Jupyter.keyboard_manager.actions.register(
                    {
                        handler: function(env, event) {
                            var index = env.notebook.get_selected_index();
                            var cell = env.notebook.get_cell(index);
                            var cm = env.notebook.get_selected_cell().code_mirror;
                            var cur = cm.getCursor();
                            if (cell && cell.at_top() && index !== 0 && cur.ch === 0) {
                                if(event){
                                    event.preventDefault();
                                }
                                env.notebook.command_mode();
                                env.notebook.select_prev(true);
                                if (!env.notebook.get_selected_cell().metadata['kb-cell']) {
                                    env.notebook.edit_mode();
                                    cm = env.notebook.get_selected_cell().code_mirror;
                                    cm.setCursor(cm.lastLine(), 0);
                                }
                            }
                            return false;
                        }
                    },
                    'move-cursor-up',
                    'jupyter-notebook'
                );
            });
        });

        /*
         * We override this method because jupyter uses .height() rather than 
         * css('height'). In the former just the internal height is returned, 
         * although later versions of jquery (should be the one we are using,
         * but it didn't appear to be so) should have fixed this behavior when
         * box-sizing: border-box is used. I tried that, but it didn't seem to
         * work. Using css('height'), however, works.
         * This bug was manifested in a permanent scrollbar for the main content
         * area, since its size was set too tall.
         */
        page.Page.prototype._resize_site = function () {
            // Update the site's size.
            $('div#site').height($(window).height() - $('#header').css('height'));
        };
    }
);
