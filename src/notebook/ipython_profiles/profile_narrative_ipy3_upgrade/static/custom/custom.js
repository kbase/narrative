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
        'components/marked/lib/marked',
        'components/requirejs/require'
        ], 
    function($, 
             IPython, 
             security, 
             textCell,
             cell,
             config,
             mathjaxutils,
             marked) {
        "use strict";
        security.sanitize_html = function(html, allow_css) { return html; };
        security.sanitize_css = function(css, tagPolicy) { return css };
        security.sanitize_stylesheets = function(html, tagPolicy) { return html };

        // Patch the MarkdownCell renderer to run the Javascript we need.
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

        // Patch the MarkdownCell renderer to throw an error when failing to render Javascript we need.
        textCell.TextCell.prototype.set_rendered = function(text) {
            try {
                this.element.find('div.text_cell_render').html(text);
            }
            catch (error) {
                this.element.find('div.text_cell_render').html("Error while parsing markdown cell: " + error);
            }
        };

        console.log('Loading KBase Narrative setup routine.');

// require(['domReady!', 'kbwidget', 'kbapi', 'kbase-client-api'], function() {
//     require(['kbaseNarrativePrestart', 
//              'kbaseLogging', 
//              'narrativeLogin', 
//              'kbaseNarrativeOutputCell', 
//              'kbaseNarrativeAppCell',
//              'kbaseNarrativeMethodCell',
//              'IPythonCustom', 
//              ], function() {
//         console.log('Done with code loading, Starting IPython...');
//         require(['IPythonMain']);
//     });


        $([IPython.events]).on('app_initialized.NotebookApp', function() {
            $.getScript('/static/narrative_paths.js', function() {
                console.log('Performing narrative startup');

                // Dumb thing to get the workspace ID just like the back end does - from the URL at startup.
                // This snippet keeps the workspace ID local, so it shouldn't be changed if someone pokes at the URL
                // before trying to fetch it again.
                var workspaceId = null;
                var m = window.location.href.match(/ws\.(\d+)\.obj\.(\d+)/);
                if (m && m.length > 1)
                    workspaceId = parseInt(m[1]);

                var configJSON = $.parseJSON(
                    $.ajax({
                        url: '/static/kbase/config.json',
                        async: false,
                        dataType: 'json',
                        cache: false
                    }).responseText
                );
                var landingPageMap = {};
                /*
                we no longer use the crazy landing page map, but keep the variable here
                so things we don't know about don't break
                */
                var icons = $.parseJSON(
                  $.ajax({
                    url: '/static/kbase/icons.json',
                    async: false,
                    dataType: 'json',
                    cache: false
                  }).responseText
                );
                window.kbconfig = { urls: configJSON[configJSON['config']],
                                    version: configJSON['version'],
                                    name: configJSON['name'],
                                    git_commit_hash: configJSON['git_commit_hash'],
                                    git_commit_time: configJSON['git_commit_time'],
                                    landing_page_map: landingPageMap,
                                    release_notes: configJSON['release_notes'],
                                    mode: configJSON['mode'],
                                    icons: icons,
                                    workspaceId: workspaceId
                                  };

                require(['kbwidget',
                         'kbapi',
                         'kbase-client-api',
                         'kbaseNarrativePrestart', 
                         'kbaseLogging', 
                         'narrativeLogin', 
                         'kbaseNarrativeOutputCell', 
                         'kbaseNarrativeAppCell', 
                         'kbaseNarrativeMethodCell', 
                         'kbaseNarrative'], 
                         function(kbwidget,
                                  kbapi,
                                  kbClientApi,
                                  kbaseNarrativePrestart,
                                  kbaseLogging,
                                  narrativeLogin,
                                  kbaseNarrativeOutputCell,
                                  kbaseNarrativeAppCell,
                                  kbaseNarrativeMethodCell,
                                  Narrative) {
                    IPython.narrative = new Narrative();
                    IPython.narrative.init();
                });
                // require(['kbasePrompt'], function() {
                //     $('body').kbasePrompt().openPrompt();
                // });
            });
        });

    }
);