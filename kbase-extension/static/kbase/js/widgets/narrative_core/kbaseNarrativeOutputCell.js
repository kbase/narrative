/*global define,require */
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kbwidget',
    'base/js/namespace',
    'util/timeFormat',
    'narrativeConfig'
], function (
    $,
    Promise,
    KBWidget,
    Jupyter,
    TimeFormat,
    Config
) {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeOutputCell',
        version: '1.0.0',
        options: {
            widget: 'kbaseDefaultNarrativeOutput',
            data: '{}',
            cellId: null,
            type: 'error',
            title: 'Output',
            time: '',
            showMenu: true,
            lazyRender: true // used in init()
        },
        isRendered: false,
        OUTPUT_ERROR_WIDGET: 'kbaseNarrativeError',
        init: function (options) {
            // handle where options.widget == null.
            options.widget = options.widget || this.options.widget;
            // handle where options.widget == 'null' string. I know. It happens.
            options.widget = options.widget === 'null' ? this.options.widget : options.widget;
            this._super(options);

            this.data = this.options.data;
            this.options.type = this.options.type.toLowerCase();
            if (this.options.cellId) {
                this.cell = Jupyter.narrative.getCellByKbaseId(this.options.cellId);
                if (!this.cell) {
                    var cellElem = $('#' + this.options.cellId).parents('.cell').data();
                    if (cellElem) {
                        this.cell = cellElem.cell;
                    }
                }
                if (this.cell) {
                    this.cell.element.trigger('hideCodeArea.cell');
                }
            }

            /*
             * This sets up "lazy" rendering.
             * Cells that are not visible are not rendered initially.
             * To render them when they scroll into view, a handler is
             * added to the container that will check their visibility on
             * every scroll event.
             * XXX: Not sure whether "on every scroll event" is going to be
             * too heavy-weight a check once there are 100+ elements to worry about.
             */
            if (Config.get('features').lazyWidgetRender) {
                var nbContainer = $('#notebook-container');
                this.visibleSettings = {
                    container: nbContainer,
                    threshold: 100
                };
                this.lazyRender({data: this}); // try to render at first view
                if (!this.isRendered) {
                    // Not initially rendered, so add handler to re-check after scroll events
                    nbContainer.scroll(this, this.lazyRender);
                }
            }
            /* For testing/comparison, do eager-rendering instead */
            else {
                this.render();
            }

            return this;
        },
        // Return true if cell is visible on page, false otherwise
        lazyVisible: function () {
            return this.inviewport(this.$elem, this.visibleSettings);
        },
        // Possibly render lazily not-yet-rendered cell
        lazyRender: function (event) {
            var self = event.data;
            if (self.isRendered) {
                // Note: We could also see if a cell that is rendered, is now
                // no longer visible, and somehow free its resources.
                return;
            }
            // see if it is visible before trying to render
            if (!self.lazyVisible()) {
                return;
            }
            return self.render();
        },
        // Render cell (unconditionally)
        render: function () {
            // render the cell
            switch (this.options.type) {
            case 'method':
                this.renderMethodOutputCell();
                break;
            case 'app':
                this.renderAppOutputCell();
                break;
            case 'error':
                this.renderErrorOutputCell();
                break;
            case 'viewer':
                this.renderViewerCell();
                break;
            default:
                this.renderErrorOutputCell();
                break;
            }
            // remember; don't render again
            this.isRendered = true;
        },
        renderViewerCell: function () {
            var $label = $('<span>').addClass('label label-info').append('Viewer');
            this.renderCell('kb-cell-output', 'panel-default', 'kb-out-desc', $label, 'data viewer');
            var $cell = this.$elem.closest('.cell');
            $cell.trigger('set-icon.cell', ['<i class="fa fa-2x fa-table data-viewer-icon"></i>']);
        },
        renderMethodOutputCell: function () {
            var $label = $('<span>').addClass('label label-info').append('Output');
            this.renderCell('kb-cell-output', 'panel-default', 'kb-out-desc', $label, 'app output');
            var $cell = this.$elem.closest('.cell');
            $cell.trigger('set-icon.cell', ['<i class="fa fa-2x fa-file-o method-output-icon"></i>']);
        },
        // same as method for now
        renderAppOutputCell: function () {
            var $label = $('<span>').addClass('label label-info').append('Output');
            this.renderCell('kb-cell-output', 'panel-default', 'kb-out-desc', $label, 'app output');
            var $cell = this.$elem.closest('.cell');
            $cell.trigger('set-icon.cell', ['<i class="fa fa-2x fa-file-o app-output-icon"></i>']);
        },
        renderErrorOutputCell: function () {
            require(['kbaseNarrativeError'], function () {
                if (!this.options.title) {
                    this.options.title = 'Narrative Error';
                }
                var $label = $('<span>').addClass('label label-danger').append('Error');
                this.renderCell('kb-cell-error', 'panel-danger', 'kb-err-desc', $label);
                var $cell = this.$elem.closest('.cell');
                $cell.trigger('set-icon.cell', ['<i class="fa fa-2x fa-exclamation-triangle error-icon"></i>']);
                $cell.addClass('kb-error');
            }.bind(this));
        },
        renderCell: function (baseClass, panelClass, headerClass, $label, titleSuffix) {
            // set up the widget line
            var widget = this.options.widget;
            var methodName = this.options.title ? this.options.title : 'Unknown App';
            var title = methodName;
            if (titleSuffix) {
                title += ' (' + titleSuffix + ')';
            }

            if (this.cell) {
                var meta = this.cell.metadata;
                if (!meta.kbase) {
                    meta.kbase = {};
                }
                if (!meta.kbase.attributes) {
                    meta.kbase.attributes = {};
                }
                /* This is a bit of a hack - if the cell's metadata already has a title,
                 * then don't change it. It was likely set by the creating App cell.
                 * BUT this means that if someone manually executes the cell again to show
                 * a different output, it still won't change, and might be weird.
                 *
                 * I suspect that will be a very rare case, and this solves an existing
                 * problem with App cells, so here it is.
                 */
                if (!meta.kbase.attributes.title) {
                    meta.kbase.attributes.title = title;
                }
                this.cell.metadata = meta;
            }


            var widgetData = this.options.data;
            if (widget === 'kbaseDefaultNarrativeOutput')
                widgetData = {data: this.options.data};

            this.$timestamp = $('<span>')
                .addClass('pull-right kb-func-timestamp');

            if (this.options.time) {
                this.$timestamp.append($('<span>')
                    .append(TimeFormat.readableTimestamp(this.options.time)));
                this.$elem.closest('.cell').find('.button_container').trigger('set-timestamp.toolbar', this.options.time);
            }

            var $body = $('<div class="kb-cell-output-content">');

            try {
                new Promise(function (resolve, reject) {
                    try {
                        require([widget], resolve, reject);
                    } catch (ex) {
                        reject(ex);
                    }
                })
                    .then(function (W) {
                        this.$outWidget = new W($body, widgetData);
                        this.$elem.append($body);
                    }.bind(this))
                    .catch(function (err) {
                        // If we fail, render the error widget and log the error.
                        KBError("Output::" + this.options.title, "failed to render output widget: '" + widget);
                        this.options.title = 'App Error';
                        this.options.data = {
                            error: {
                                msg: 'An error occurred while showing your output:',
                                method_name: 'kbaseNarrativeOutputCell.renderCell',
                                type: 'Output',
                                severity: '',
                                traceback: err.stack
                            }
                        };
                        this.options.widget = this.OUTPUT_ERROR_WIDGET;
                        this.renderErrorOutputCell();
                    }.bind(this));

            } catch (err) {
                this.options.title = 'App Error';
                this.options.data = {
                    error: {
                        msg: 'An error occurred while showing your output:',
                        method_name: 'kbaseNarrativeOutputCell.renderCell',
                        type: 'Output',
                        severity: '',
                        trace: err.trace
                    }
                };
                this.options.widget = this.OUTPUT_ERROR_WIDGET;
                this.renderErrorOutputCell();
            }
        },

        getState: function () {
            var state = null;
            if (this.$outWidget && this.$outWidget.getState) {
                state = this.$outWidget.getState();
            }
            return state;
        },

        loadState: function (state) {
            if (state) {
                if (state.time) {
                    this.$timestamp.html(TimeFormat.readableTimestamp(state.time));
                }
                if (this.$outWidget && this.$outWidget.loadState) {
                    this.$outWidget.loadState(state);
                }
            }
        },

        /* -------------------------------------------------------
         * Code modified from:
         * Lazy Load - jQuery plugin for lazy loading images
         * Copyright (c) 2007-2015 Mika Tuupola
         * Licensed under the MIT license
         * Project home: http://www.appelsiini.net/projects/lazyload
         */
        inviewport: function (element, settings) {
            var fold = settings.container.offset().top + settings.container.height(),
                elementTop = $(element).offset().top - settings.threshold;
            return elementTop <= fold; // test if it is "above the fold"
        }
        /* End of Lazy Load code.
         * ------------------------------------------------------- */
    });
});
