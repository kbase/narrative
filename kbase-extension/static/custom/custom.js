/*global define*/
/*jslint white: true*/
// leave at least 2 line with only a star on it below, or doc generation fails
/**
 *
 *
 * Placeholder for custom user javascript
 * mainly to be overridden in profile/static/custom/custom.js
 * This will always be an empty file in IPython
 *
 * User could add any javascript in the `profile/static/custom/custom.js` file.
 * It will be executed by the ipython notebook at load time.
 *
 * Same thing with `profile/static/custom/custom.css` to inject custom css into the notebook.
 *
 *
 * The object available at load time depend on the version of IPython in use.
 * there is no guaranties of API stability.
 *
 * The example below explain the principle, and might not be valid.
 *
 * Instances are created after the loading of this file and might need to be accessed using events:
 *     define([
 *        'base/js/namespace',
 *        'base/js/events'
 *     ], function(IPython, events) {
 *         events.on("app_initialized.NotebookApp", function () {
 *             IPython.keyboard_manager....
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
 *    ], function(IPython, events) {
 *        events.on('app_initialized.NotebookApp', function(){
 *            IPython.toolbar.add_buttons_group([
 *                {
 *                    'label'   : 'run qtconsole',
 *                    'icon'    : 'icon-terminal', // select your icon from http://fortawesome.github.io/Font-Awesome/icons
 *                    'callback': function () {
 *                        IPython.notebook.kernel.execute('%qtconsole')
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
 * @module IPython
 * @namespace IPython
 * @class customjs
 * @static
 */
define(['jquery',
        'base/js/namespace',
        'base/js/security',
        'base/js/utils',
        'notebook/js/notebook',
        'notebook/js/textcell',
        'notebook/js/savewidget',
        'base/js/dialog',
        'base/js/keyboard',
        'notebook/js/cell',
        'services/config',
        'notebook/js/mathjaxutils',
        'components/marked/lib/marked',
        'components/requirejs/require',
        'narrative_paths'
        ],
    function($, 
             IPython, 
             security,
             utils,
             notebook,
             textCell,
             saveWidget,
             dialog,
             keyboard,
             cell,
             config,
             mathjaxutils,
             marked) {
        'use strict';

        // Patch the security mechanisms to allow any JavaScript to run for now.
        // TODO: update this so only the few KBase commands run.
        security.sanitize_html = function(html, allow_css) { return html; };
        security.sanitize_css = function(css, tagPolicy) { return css; };
        security.sanitize_stylesheets = function(html, tagPolicy) { return html; };

        // Patch the MarkdownCell renderer to run the Javascript we need.
        textCell.MarkdownCell.prototype.render = function () {
            var cont = textCell.TextCell.prototype.render.apply(this);
            if (cont) {
                var that = this,
                    text = this.get_text(),
                    math = null,
                    title, $html;
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
                        if (!title) {
                            title = $html.first().html().substr(0,50) || '';
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

                    $(that.element)
                        .trigger('set-title', [title || '?']);
                    
                    console.log('setting icon for markdown');
                    $(that.element)
                        .trigger('set-icon', ['<i class="fa fa-2x fa-paragraph markdown-icon"></i>']);
                    
                    that.set_rendered($html);
                    that.typeset();
                    that.events.trigger("rendered.MarkdownCell", {cell: that});
                });
            }
            return cont;
        };

        /** @method bind_events **/
        textCell.MarkdownCell.prototype.bind_events = function () {
            textCell.TextCell.prototype.bind_events.apply(this);
            var that = this;

            this.code_mirror.on('blur', function () {
                that.render();
            });
            
            var $cellNode = $(this.element);

            $cellNode
                .on('set-title', function (e, title) {
                    if (title === undefined) {
                        return;
                    } 
                    $cellNode.data('title', title);
                    $cellNode             
                        .find('.celltoolbar > .button_container')
                        .trigger('set-title', [title || '?']);
                });
            $cellNode               
                .on('set-icon', function (e, icon) {
                   $cellNode.data('icon', icon);
                    $cellNode
                    .find('.celltoolbar > .button_container')
                    .trigger('set-icon', [icon]);
            });
                

//            this.element.click(function () {
//                var cont = that.unrender();
//                if (cont) {
//                    that.focus_editor();
//                }
//            });
        };

        // Patch the MarkdownCell renderer to throw an error when failing to render Javascript we need.
        textCell.TextCell.prototype.set_rendered = function (text) {
            try {
                this.element.find('div.text_cell_render').html(text);
            } catch (error) {
                this.element.find('div.text_cell_render').html("Error while parsing markdown cell: " + error);
            }
        };
        
        
        // Patch the Notebook to return the right name
        notebook.Notebook.prototype.get_notebook_name = function () {
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
        $([IPython.events]).on('notebook_loaded.Notebook',
            function narrativeStart() {
                require(['kbaseNarrative'], function (Narrative) {
                    IPython.narrative = new Narrative();
                    IPython.narrative.init();
                });
            }
        );
    
        page.Page.prototype._resize_site = function() {
        // Update the site's size.
        $('div#site').height($(window).height() - $('#header').css('height'));
    };
    }
);
