/*global define,require, KBError */
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kbwidget',
    'base/js/namespace',
    'util/timeFormat',
    'narrativeConfig',
    'kbase/js/widgets/narrative_core/objectCellHeader'
], function (
    $,
    Promise,
    KBWidget,
    Jupyter,
    TimeFormat,
    Config,
    ObjectCellHeader
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

            /* handle upas here! Needs to do the following:
             * - check cell metadata. if no field present for upas, drop them in. if present, use
             *   them instead.
             *     - might need to double check key names. maybe a silly user repurposed/re-ran the
             *       cell? Should try to get the Python stack to reset the metadata in that case.
             *       Not sure if that's possible.
             * - have cell header widget control which version of objects are seen.
             *   - should auto-serialize on change
             *   - should re-render widget as appropriate
             * - Finally, all widgets should take upas as inputs. Enforce that here.
             * - All widgets should have an 'upas' input that handles the mapping. Part of spec?
             * - Need to start writing widget spec / standard. Share with Jim & Erik & Steve/Shane
             */

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
                var $nbContainer = $('#notebook-container');
                this.visibleSettings = {
                    container: $nbContainer,
                    threshold: 100
                };
                this.lazyRender({data: this}); // try to render at first view
                if (!this.isRendered) {
                    // Not initially rendered, so add handler to re-check after scroll events
                    // $nbContainer.scroll(this, this.lazyRender);
                    this.visibleSettings.container.scroll(this, this.lazyRender);
                }
            }
            /* For testing/comparison, do eager-rendering instead */
            else {
                this.render();
            }

            return this;
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
            if (!self.inViewport(self.$elem, self.visibleSettings)) {
                return;
            }
            return self.render();
        },

        render: function () {
            // set up the widget line
            // todo find cell and trigger icon setting.

            var widget = this.options.widget;
            var methodName = this.options.title ? this.options.title : 'Unknown App';
            var title = methodName;

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

            var $headController = $('<div>');
            var $widgetBody = $('<div>');
            var $body = $('<div class="kb-cell-output-content">')
                .append($headController)
                .append($widgetBody);

            this.headerWidget = new ObjectCellHeader($headController, { upas: this.options.upas });

            try {
                new Promise(function (resolve, reject) {
                    try {
                        require([widget], resolve, reject);
                    } catch (ex) {
                        reject(ex);
                    }
                })
                    .then(function (W) {
                        this.$outWidget = new W($widgetBody, widgetData);
                        this.$elem.append($body);
                    }.bind(this))
                    .catch(function (err) {
                        // If we fail, render the error widget and log the error.
                        this.renderError(err);
                    }.bind(this));

            } catch (err) {
                this.renderError(err);
            }
            this.isRendered = true;
        },

        renderError: function(err) {
            KBError('Output::' + this.options.title, 'failed to render output widget: "' + this.options.widget + '"');
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
            this.render();
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
        inViewport: function (element, settings) {
            var fold = settings.container.offset().top + settings.container.height(),
                elementTop = $(element).offset().top - settings.threshold;
            return elementTop <= fold; // test if it is "above the fold"
        }
        /* End of Lazy Load code.
         * ------------------------------------------------------- */
    });
});
