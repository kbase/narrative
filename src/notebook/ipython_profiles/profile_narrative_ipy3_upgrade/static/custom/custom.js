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
        'notebook/js/textcell',
        'notebook/js/cell',
        'services/config',
        'notebook/js/mathjaxutils',
//        'notebook/js/celltoolbar',
        'components/marked/lib/marked',
//        'codemirror/lib/codemirror',
//        'codemirror/mode/gfm/gfm',
//        'notebook/js/codemirror-ipythongfm'
        ], 
    function($, 
             IPython, 
             security, 
             textCell,
             cell,
             config,
             mathjaxutils,
             marked) {
        security.sanitize_html = function(html, allow_css) { return html; };
        security.sanitize_css = function(css, tagPolicy) { return css };
        security.sanitize_stylesheets = function(html, tagPolicy) { return html };

        textCell.MarkdownCell.prototype.render = function() {
            var cont = textCell.TextCell.prototype.render.apply(this);
            if (cont) {
                var that = this;
                var text = this.get_text();
                var math = null;
                if (text === "") { text = this.placeholder; }
                var text_and_math = mathjaxutils.remove_math(text);
                text = text_and_math[0];
                math = text_and_math[1];
                marked(text, function (err, html) {
                    html = mathjaxutils.replace_math(html, math);
                    html = security.sanitize_html(html);
                    try {
                        html = $($.parseHTML(html, undefined, true));
                    }
                    catch (error) {
                        html = "Error while parsing markdown cell: " + error;
                    }
                    // add anchors to headings
                    html.find(":header").addBack(":header").each(function (i, h) {
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
                    html.find("a[href]").not('[href^="#"]').attr("target", "_blank");
                    that.set_rendered(html);
                    that.typeset();
                    that.events.trigger("rendered.MarkdownCell", {cell: that});
                });
            }
            return cont;
        };

        textCell.TextCell.prototype.set_rendered = function(text) {
            try {
                this.element.find('div.text_cell_render').html(text);
            }
            catch (error) {
                this.element.find('div.text_cell_render').html("Error while parsing markdown cell: " + error);
            }
        }
    }
);