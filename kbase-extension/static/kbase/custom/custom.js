/*global define,require*/
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
 *     define (
 [
 'kbwidget',
 'bootstrap',
 '*        base/js/namespace',
 '*        base/js/events
 *'
 ], function(
 KBWidget,
 bootstrap,
 Jupyter,
 events
 ) {
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
define([
    'jquery',
    'handlebars',
    'numeral',
    'base/js/namespace',
    'kbaseNarrative',
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
    'notebook/js/keyboardmanager',
    'notebook/js/cell',
    'common/utils',
    'common/jupyter',
    'kb_common/html',

    'components/requirejs/require',
    'narrative_paths'
], function (
    $,
    Handlebars,
    numeral,
    Jupyter,
    Narrative,
    security,
    nbUtils,
    page,
    codeCell,
    notebook,
    textCell,
    saveWidget,
    cellToolbar,
    dialog,
    keyboard,
    keyboardManager,
    cell,
    utils,
    NarrativeRuntime,
    html
) {
    'use strict';

    // Handlebars global configuration. Since these changes affect all usage of handlebars
    // in this app, they should be performed just once.
    Handlebars.registerHelper('numeral', function(value, format, defaultValue, options) {
        // This bit is required since Handlebars sends 'options' as the final argument.
        if (!options) {
            options = defaultValue;
            defaultValue = undefined;
        }
        var missing = false;
        if (typeof value === 'string') {
            if (value.trim().length === 0) {
                missing = true;
            }
        } else if (typeof value !== 'number') {
            missing = true;
        }
        var numeralValue = numeral(value);
        if (isNaN(numeralValue)) {
            missing = true;
        }
        if (missing) {
            return defaultValue || 'n/a';
        }
        try {
            return numeralValue.format(format);
        } catch (ex) {
            return '** ER: ' + ex.message + '**';
        }
    });

    Handlebars.registerHelper('lineage', function(value, startAt, startAfter) {
        if (!value || value.length === 0) {
            return 'n/a';
        }
        var delimiter;
        if (value.indexOf(';') >= 0) {
            delimiter = ';';
        } else {
            delimiter = ',';
        }
        var lineage = value.split(delimiter)
            .map(function (item) {
                return item.trim();
            });
        var start;
        if (startAt) {
            start = lineage.indexOf(startAt);
            if (start >= 0) {
                lineage = lineage.slice(start);
            }
        } else if (startAfter) {
            start = lineage.indexOf(startAfter);
            if (start >= 0) {
                lineage = lineage.slice(start + 1);
            }
        }
        return new Handlebars.SafeString(lineage
            .map(function (item) {
                return Handlebars.Utils.escapeExpression(item.trim());
            })
            .join(' <span style="color: #AAA"> &gt; </span>'));
    });


    var t = html.tag,
        span = t('span');

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


    // Patch the security mechanisms to allow any JavaScript to run for now.
    // TODO: update this so only the few KBase commands run.

    // 3/19/2018 - removing this now as nobody is really using any ancient narratives that depend
    // on embedding code in markdown cells. At least, they shouldn't be.

    // security.sanitize_html = function (html, allow_css) {
    //     return html;
    // };
    // security.sanitize_css = function (css, tagPolicy) {
    //     return css;
    // };
    // security.sanitize_stylesheets = function (html, tagPolicy) {
    //     return html;
    // };

    // Make the favicon change a no-op for now. They use lots of hard-coded paths to
    // Jupyter icons, so it's hard to change branding...
    nbUtils.change_favicon = function() {};

    // TODO: refactor
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
        case 'kb_app':
            return 'app';
        case 'function_output':
            return 'output';
        default:
            return 'unknown';
        }

    }

    // CELLTOOLBAR

    // disable hiding of the toolbar
    cellToolbar.CellToolbar.prototype.hide = function () {
        return;
    };

    // CELL

    (function () {
        var p = cell.Cell.prototype;

        // This is how we extend methods.
        (function () {
            var originalMethod = p.select;
            p.select = function () {
                var wasSelected = originalMethod.apply(this);
                if (wasSelected) {
                    $(this.element).trigger('selected.cell');
                }
                return wasSelected;
            };
        }());

        // Extend
        (function () {
            var originalMethod = cell.Cell.prototype.unselect;
            cell.Cell.prototype.unselect = function (leave_selected) {
                var wasSelected = originalMethod.apply(this, [leave_selected]);
                $(this.element).trigger('unselected.cell');
                return wasSelected;
            };
        }());

        p.renderMinMax = function () {
            var $cellNode = $(this.element),
                metaToggleMode = utils.getCellMeta(this, 'kbase.cellState.toggleMinMax'),
                toggleMode = $cellNode.data('toggleMinMax');

            if (metaToggleMode) {
                if (!toggleMode) {
                    // The first time an existing cell is rendered after loading a
                    // notebook, the node data for toggleMinMax
                    // will be empty, so we need to initialize it. This is an auto-initialize.
                    toggleMode = metaToggleMode;
                    $cellNode.data('toggleMinMax', toggleMode);
                }
            } else if (!toggleMode) {
                // If there is neither a data attribute on the node nor a metadata
                // property, then this is a new cell, and it will be maximized.
                toggleMode = 'maximized';
                $cellNode.data('toggleMinMax', toggleMode);
            }

            switch (toggleMode) {
            case 'maximized':
                if (!this.maximize) {
                    console.log('HELP', this);
                    return;
                }
                this.maximize();
                break;
            case 'minimized':
                this.minimize();
                break;
            }
        };

        p.toggleMinMax = function () {
            var $cellNode = $(this.element),
                toggleMode = $cellNode.data('toggleMinMax') || 'maximized';

            switch (toggleMode) {
            case 'maximized':
                toggleMode = 'minimized';
                break;
            case 'minimized':
                toggleMode = 'maximized';
                break;
            }

            // NB namespacing is important with jquery messages because they
            // propagate through nodes like DOM messages (i.e. the toolbar, being
            // contained within the cell, propagates the event upwards, after
            // which it continues to the cell (and perhaps beyond). So using
            // the same event name will lead to an infinite loop.
            // this.celltoolbar.element.trigger('toggleMinMax.toolbar');

            $cellNode.data('toggleMinMax', toggleMode);

            this.renderMinMax();

            utils.setCellMeta(this, 'kbase.cellState.toggleMinMax', toggleMode, true);
        };

        (function () {
            var originalMethod = p.bind_events;
            p.bind_events = function () {
                var $el = $(this.element);
                originalMethod.apply(this);

                //                $el.on('toggle.cell', function () {
                //                    // Alas, it has no discriminating attributes!
                //                    thisCell.toggle();
                //                });
                //                $el.on('rendered.cell', function () {
                //                    thisCell.renderToggleState();
                //                    $(thisCell.element).trigger('set-title.cell', thisCell.getCellState('title'));
                //                });

                // Universal invocation of cell min max
                $el.on('toggleMinMax.cell', function () {
                    this.toggleMinMax();
                }.bind(this));

                // This is triggered by the installation of the 'KBase' cell toolbar. Before this event we
                // cannot safely rely upon the cell toolbar, which provides the min-max ui.
                // I believe the original reason for this event (it may be possible to also use notebook_loaded.Notebook,
                // but I'm not sure), is that the extensions were originally developed in raw Jupyter,
                // and only some cells had the KBase toolbar and behavior.
                // Actually, we do need to use the preset_activated event
                // because WE generate this event by activating the KBase
                // cell toolbar (in kbaseNarrative) after receiving
                // the notebeook_loaded event and also after setting up
                // the basic narrController with some info needed by the
                // cell toolbar (readonly, e.g.)
                this.events.on('preset_activated.CellToolbar', function (e, data) {
                    if (data.name === 'KBase') {
                        this.renderMinMax();
                    }
                }.bind(this));
            };
        }());
    }());

    // RAW CELL

    (function () {
        var p = textCell.RawCell.prototype;

        p.minimize = function () {
            var $cellNode = $(this.element);
            $cellNode.find('.inner_cell > div:nth-child(2)').addClass('hidden');
            $cellNode.find('.inner_cell > div:nth-child(3)').addClass('hidden');
            utils.setCellMeta(this, 'kbase.cellState.showTitle', true);
        };

        p.maximize = function () {
            var $cellNode = $(this.element);
            $cellNode.find('.inner_cell > div:nth-child(2)').removeClass('hidden');
            $cellNode.find('.inner_cell > div:nth-child(3)').removeClass('hidden');
            utils.setCellMeta(this, 'kbase.cellState.showTitle', false);
        };

        // We need this method because the layout of each type of cell and
        // interactions with min/max can be complex.
        p.renderPrompt = function () {
            var prompt = this.element[0].querySelector('.input_prompt');
            if (!prompt) {
                return;
            }
            prompt.innerHTML = '';
        };

        /** @method bind_events **/
        p.bind_events = function () {
            textCell.TextCell.prototype.bind_events.apply(this);

            var cell = this,
                $cellNode = $(this.element);

            /*
             * The cell toolbar buttons area knows how to set the title and
             * icon for itself. But we store the title and icon here in case
             * the celltoolbar is not fully built yet. In that case, it will
             * look at the containing cell to see if it has been set yet, and if
             * so will use that (of course listening for these events too.)
             */
            $cellNode.on('set-title.cell', function (e, title) {
                if (title === undefined) {
                    return;
                }
                // cell.setCellState('title', title);
                utils.setCellMeta(cell, 'kbase.cellState.title', title);
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('set-title.toolbar', [title || '']);
                if (cellType(cell) !== undefined) {
                    $(cell.element).trigger('show-title.cell');
                }
            });

            $cellNode.on('hide-title.cell', function (e) {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('hide-title.toolbar');
            });

            $cellNode.on('show-title.cell', function (e) {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('show-title.toolbar');
            });

            $cellNode.on('set-icon.cell', function (e, icon) {
                // cell.setCellState('icon', icon);
                utils.setCellMeta(cell, 'kbase.cellState.icon', icon);
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('set-icon.toolbar', [icon]);
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
            $cellNode.on('unselected.cell', function () {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                // cell.setCellState('selected', false);
                utils.setCellMeta(cell, 'kbase.cellState.selected', false);
                $menu.trigger('unselected.toolbar');
            });

            // this.events
            $cellNode.on('selected.cell', function () {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                utils.setCellMeta(cell, 'kbase.cellState.selected', true);
                // cell.setCellState('selected', true);
                $menu.trigger('selected.toolbar');
            });

            // Note - this event needs to be subscribed to in each cell interested.
            // This is really the kick-off for the narrative, since the
            // presets on the celltoobar are loaded via event calls,
            // so are not part of the synchronous process
            // which builds the UI.
            this.events.on('preset_activated.CellToolbar', function (e, data) {
                if (data.name === 'KBase') {
                    // ensure the icon is set?
                    utils.setCellMeta(this, 'kbase.attributes.icon', 'font');
                    // Set up the toolbar based on the state.
                    // TODO: refactor in general -- reconcile cellState and attributes

                    //$cellNode.trigger('set-title.cell', [cell.getCellState('title', '')]);
                    //$cellNode.trigger('set-icon.cell', [cell.getCellState('icon', '')]);

                    // DISABLED: toggling
                    // TODO: re-enable!
                    // cell.renderToggleState();
                }
            }.bind(this));
        };
    }());

    // MARKDOWN CELL

    (function () {
        var p = textCell.MarkdownCell.prototype;

        p.minimize = function () {
            var $cellNode = $(this.element);
            $cellNode.find('.inner_cell > div:nth-child(2)').addClass('hidden');
            $cellNode.find('.inner_cell > div:nth-child(3)').addClass('hidden');
            utils.setCellMeta(this, 'kbase.cellState.showTitle', true);
            utils.setCellMeta(this, 'kbase.cellState.message', '', true);
        };

        p.maximize = function () {
            var $cellNode = $(this.element);
            $cellNode.find('.inner_cell > div:nth-child(2)').removeClass('hidden');
            $cellNode.find('.inner_cell > div:nth-child(3)').removeClass('hidden');
            utils.setCellMeta(this, 'kbase.cellState.showTitle', false);

            // this is a little distracting to see in all markdown cells at all times.
            // it might make more sense in some kind of help settings? or as a tooltip?
            // but there's also already a placeholder in shiny new markdown cells, making this
            // redundant. This text has been moved there.
            // if (NarrativeRuntime.canEdit()) {
            //     utils.setCellMeta(this, 'kbase.cellState.message', 'Double click content to edit; click out of the edit area to preview', true);
            // }
        };

        // We need this method because the layout of each type of cell and
        // interactions with min/max can be complex.
        p.renderPrompt = function () {
            var prompt = this.element[0].querySelector('.input_prompt');
            if (!prompt) {
                return;
            }
            prompt.innerHTML = '';
        };

        p.getIcon = function () {
            var iconColor = 'silver';

            return span({ style: '' }, [
                span({ class: 'fa-stack fa-2x', style: { textAlign: 'center', color: iconColor } }, [
                    span({ class: 'fa fa-square fa-stack-2x', style: { color: iconColor } }),
                    span({ class: 'fa fa-inverse fa-stack-1x fa-' + 'paragraph' })
                ])
            ]);
        };

        /** @method bind_events **/
        // NOTE: We need to completely replace the markdown cell bind_events because we
        // need to disable the double-click to edit if in view mode. We would need to unregister
        // the original dbclick event handler, and we can't do that without
        var originalBindEvents = p.bind_events;
        p.bind_events = function () {
            originalBindEvents.apply(this);

            var cell = this,
                $cellNode = $(this.element);

            this.element.off('dblclick');

            this.element.on('dblclick', '.text_cell_render', function () {
                if (!NarrativeRuntime.canEdit()) {
                    return;
                }
                var cont = cell.unrender();
                if (cont) {

                    cell.focus_editor();
                }
            });

            // /*
            //  * This is the trick to get the markdown to render, and the edit area
            //  * to disappear, when the user clicks out of the edit area.
            //  */
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
            $cellNode.on('set-title.cell', function (e, title) {
                if (title === undefined) {
                    return;
                }
                // cell.setCellState('title', title);
                utils.setCellMeta(cell, 'kbase.cellState.title', title);
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('set-title.toolbar', [title || '']);
                if (cellType(cell) !== undefined) {
                    $(cell.element).trigger('show-title.cell');
                }
            });

            $cellNode.on('hide-title.cell', function (e) {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('hide-title.toolbar');
            });

            $cellNode.on('show-title.cell', function (e) {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('show-title.toolbar');
            });

            $cellNode.on('set-icon.cell', function (e, icon) {
                // cell.setCellState('icon', icon);
                utils.setCellMeta(cell, 'kbase.cellState.icon', icon);
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                $menu.trigger('set-icon.toolbar', [icon]);
            });

            $cellNode.on('job-state.cell', function (e, data) {
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
            $cellNode.on('unselected.cell', function () {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                // cell.setCellState('selected', false);
                utils.setCellMeta(cell, 'kbase.cellState.selected', false);
                $menu.trigger('unselected.toolbar');
            });

            // this.events
            $cellNode.on('selected.cell', function () {
                var $menu = $(cell.celltoolbar.element).find('.button_container');
                utils.setCellMeta(cell, 'kbase.cellState.selected', true);
                // cell.setCellState('selected', true);
                $menu.trigger('selected.toolbar');
            });

            this.events.on('rendered.MarkdownCell', function (e, data) {
                // cell.setCellState('icon', 'paragraph');
                utils.setCellMeta(cell, 'kbase.attributes.icon', 'paragraph');

                // DISABLED toggleing
                // TODO: re-enable!
                // cell.renderToggleState();

                // get the h1 if it exists.
                var title,
                    renderedContent = cell.element.find('.rendered_html'),
                    h1 = renderedContent.find('h1');
                if (h1.length > 0) {
                    title = h1[0].innerText;
                } else {
                    title = renderedContent[0].textContent;
                }

                if (title) {
                    // trim down to max 50 characters
                    if (title.length > 50) {
                        title = title.substr(0, 50) + '...';
                    }
                    // trim down to the 'paragraph' char - signifies the end of a header element
                    var paraIdx = title.indexOf('¶');
                    if (paraIdx !== -1) {
                        title = title.substr(0, paraIdx);
                    }
                    // trim down to the end of the first newline - a linebreak should be a title
                    var newLineIdx = title.indexOf('\n');
                    if (newLineIdx !== -1) {
                        title = title.substr(0, newLineIdx);
                    }
                } else {
                    title = '<i>empty markdown cell - add a title with # </i>';
                }

                utils.setCellMeta(cell, 'kbase.attributes.title', title, true);
            }.bind(this));

            // Note - this event needs to be subscribed to in each cell interested.
            // This is really the kick-off for the narrative, since the
            // presets on the celltoobar are loaded via event calls,
            // so are not part of the synchronous process
            // which builds the UI.
            this.events.on('preset_activated.CellToolbar', function (e, data) {
                if (data.name === 'KBase') {
                    // ensure the icon is set?
                    utils.setCellMeta(this, 'kbase.attributes.icon', 'paragraph');
                }
            }.bind(this));
        };
    }());

    // Patch the MarkdownCell renderer to run the Javascript we need.
    textCell.MarkdownCell.options_default = {
        cm_config: {
            mode: 'ipythongfm'
        },
        placeholder: '_Markdown_/LaTeX cell - double click here to edit, click out of the edit area to preview.'
    };

    // KEYBOARD MANAGER

    /*
     * Ensure that the keyboard manager does not reactivate during interaction
     * with the Narrative.
     *
     * Although we disable the keyboard manager at the outset, Jupyter will
     * hook into the blur event for inputs  within an inserted dom node.
     * This causes havoc when kbase widgets manipulate the dom by inserting
     * form controls.
     *
     * So ... we just disable this behavior by overriding the register_events
     * method.
     *
     */

    (function () {
        keyboardManager.KeyboardManager.prototype.register_events = function (e) {
            // NOOP
            return;
        };
    }());

    // CODE CELL

    /*
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
    (function () {
        var p = codeCell.CodeCell.prototype;

        p.minimize = function () {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper');

            inputArea.classList.remove('-show');
            outputArea.addClass('hidden');
        };

        p.maximize = function () {
            var inputArea = this.input.find('.input_area').get(0),
                outputArea = this.element.find('.output_wrapper');

            outputArea.removeClass('hidden');
        };

        // We need this method because the layout of each type of cell and
        // interactions with min/max can be complex.
        p.renderIcon = function () {
            var prompt = this.element.querySelector('.input_prompt');

            if (!prompt) {
                return;
            }

            prompt.innerHTML = 'prompt here';
        };

        p.getIcon = function () {
            var iconColor = 'silver';
            var icon;
            icon = span({ class: 'fa fa-inverse fa-stack-1x fa-spinner fa-pulse fa-fw' });

            return span({ style: '' }, [
                span({ class: 'fa-stack fa-2x', style: { textAlign: 'center', color: iconColor } }, [
                    span({ class: 'fa fa-square fa-stack-2x', style: { color: iconColor } }),
                    icon
                ])
            ]);
        };

        var originalBindEvents = codeCell.CodeCell.prototype.bind_events;
        p.bind_events = function () {
            originalBindEvents.apply(this);
            var $cellNode = $(this.element),
                thisCell = this;

            // TODO: toggle state on the cell object so we can be sure about this.

            $cellNode.on('unselected.cell', function () {
                var $menu = $(thisCell.celltoolbar.element).find('.button_container');
                utils.setCellMeta(cell, 'kbase.cellState.selected', false);
                $menu.trigger('unselected.toolbar');
            });

            // this.events
            $cellNode.on('selected.cell', function () {
                var $menu = $(thisCell.celltoolbar.element).find('.button_container');
                utils.setCellMeta(cell, 'kbase.cellState.selected', true);
                $menu.trigger('selected.toolbar');
            });

            $cellNode.on('toggleCodeArea.cell', function () {
                thisCell.toggleCodeInputArea();
            });

            $cellNode.on('hideCodeArea.cell', function () {
                thisCell.hideCodeInputArea();
            });

            if (this.code_mirror) {
                this.code_mirror.on('change', function (cm, change) {
                    var lineCount = cm.lineCount(),
                        commentRe = /^\.*?\#\s*(.*)$/;
                    for (var i = 0; i < lineCount; i += 1) {
                        var line = cm.getLine(i),
                            m = commentRe.exec(line);
                        if (m) {
                            utils.setCellMeta(thisCell, 'kbase.attributes.title', m[1], true);
                            break;
                        }
                    }
                });
            }
        };

        p.hideCodeInputArea = function () {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                codeInputArea.classList.remove('-show');
            }
        };

        p.isCodeShowing = function () {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                return codeInputArea.classList.contains('-show');
            }
            return false;
        };

        p.toggleCodeInputArea = function () {
            var codeInputArea = this.input.find('.input_area')[0];
            if (codeInputArea) {
                codeInputArea.classList.toggle('-show');
                this.metadata = this.metadata;
            }
        };

        // Filter execute through read-only mode
        // In generally we don't "run" code cells in ui view (aka read-only) mode,
        // because the back-end code may make modifications to the Narrative.
        // However, perhaps we should allow code execution as a
        // capability, and just block Narrative modifications?
        var originalExecute = codeCell.CodeCell.prototype.execute;
        p.execute = function () {
            if (Jupyter.narrative.readonly) {
                alert('Read only mode - execute prohibited');
                return;
            }
            return originalExecute.apply(this, arguments);
        };
    }());

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
        var parent = nbUtils.url_path_split(this.notebook_path)[0];
        var new_path = nbUtils.url_path_join(parent, new_name);
        return this.contents.rename(this.notebook_path, new_path).then(
            function (json) {
                that.notebook_name = json.name;
                that.notebook_path = json.path;
                that.last_modified = new Date(json.last_modified);
                // that.session.rename_notebook(json.path);
                that.events.trigger('notebook_renamed.Notebook', json);
            }
        );
    };

    // Extend methods.
    (function () {
        var p = notebook.Notebook.prototype;

        var sidecarData = null;

        // insert_cell_at_index wrapper
        // Adds a third argument, "data", which is passed in the
        // "insertedAtIndex.Cell" event to any listeners, esp.
        // notebook extensions for cells. Note that if "data" is absent
        // or falsey, the sidecarData closed-over variable is used. It
        // may be set by insert_cell_below or insert_cell_above if they
        // are called with a similarly new third argument.
        //
        // We use this technique since we do not want to re-implement the
        // underlying method, just wrap it.
        //
        // Note that the cell object created is not extensible, so we can't
        // store this on the cell object itself.
        //
        // Also note that this works because ... js is single threaded and there
        // is no possibility that another call will bump into this value.
        (function () {
            var originalMethod = p.insert_cell_at_index;
            p.insert_cell_at_index = function (type, index, data) {
                var cell = originalMethod.apply(this, arguments);
                var dataToSend = data || sidecarData;
                sidecarData = null;
                this.events.trigger('insertedAtIndex.Cell', {
                    type: type || 'code',
                    index: index,
                    cell: cell,
                    data: dataToSend
                });
                return cell;
            };
        }());

        // insert_cell_below wrapper
        // Accepts a third argument "data" not supported in the original.
        // Since it cannot be passed to the inner method, it is set
        // on the sidecarData variable, which is picked up above.
        // This method always calls insert_cell_at_index to do the
        // actual cell insertion, so is a reliable method of passing this
        // extra argument.
        (function () {
            var originalMethod = p.insert_cell_below;
            p.insert_cell_below = function (type, index, data) {
                sidecarData = data;
                var cell = originalMethod.apply(this, arguments);
                return cell;
            };
        }());
        (function () {
            var originalMethod = p.insert_cell_above;
            p.insert_cell_above = function (type, index, data) {
                sidecarData = data;
                var cell = originalMethod.apply(this, arguments);
                return cell;
            };
        }());
    }());

    // Patch the save widget to skip the 'notebooks' part of the URL when updating
    // after a notebook rename.
    saveWidget.SaveWidget.prototype.update_address_bar = function () {
        var base_url = this.notebook.base_url;
        var path = this.notebook.notebook_path;
        var state = { path: path };
        window.history.replaceState(state, '', nbUtils.url_path_join(
            base_url,
            nbUtils.encode_uri_components(path)));
    };

    // Patch the save widget to take in options at save time
    saveWidget.SaveWidget.prototype.rename_notebook = function (options) {
        // silently fail if a read-only narrative.
        if (Jupyter.narrative.readonly) {
            return;
        }
        Jupyter.narrative.getUserPermissions()
        .then((perm) => {
            if (perm !== 'a') {
                return;
            }
            options = options || {};
            var that = this;
            var dialog_body = $('<div>').append(
                $('<p>').addClass('rename-message')
                    .text(options.message ? options.message : 'Enter a new Narrative name:')
            ).append(
                $('<br>')
            ).append(
                $('<input>').attr('type', 'text').attr('size', '25').addClass('form-control')
                    .val(options.notebook.get_notebook_name())
            );
            var d = dialog.modal({
                title: 'Rename Narrative',
                body: dialog_body,
                notebook: options.notebook,
                keyboard_manager: this.keyboard_manager,
                buttons: {
                    'OK': {
                        class: 'btn-primary',
                        click: function () {
                            var new_name = d.find('input').val();
                            d.find('.rename-message').text('Renaming and saving...');
                            d.find('input[type="text"]').prop('disabled', true);
                            that.notebook.rename(new_name).then(
                                function () {
                                    d.modal('hide');
                                    that.notebook.metadata.name = new_name;
                                    that.element.find('span.filename').text(new_name);
                                    Jupyter.narrative.saveNarrative();
                                    if (options.callback) {
                                        options.callback();
                                    }
                                },
                                function (error) {
                                    d.find('.rename-message').text(error.message || 'Unknown error');
                                    d.find('input[type="text"]').prop('disabled', false).focus().select();
                                }
                            );
                            return false;
                        }
                    },
                    'Cancel': {}
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
        });
    };
});
