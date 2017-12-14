/*global define,require, KBError */
/*jslint white:true,browser:true*/
define([
    'jquery',
    'bluebird',
    'kbwidget',
    'base/js/namespace',
    'util/timeFormat',
    'narrativeConfig',
    'kbase/js/widgets/narrative_core/objectCellHeader',
    'api/upa'
], function (
    $,
    Promise,
    KBWidget,
    Jupyter,
    TimeFormat,
    Config,
    ObjectCellHeader,
    UpaApi
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
        headerShown: false,

        initMetadata: function () {
            var baseMeta = {
                kbase: {
                    dataCell: {}
                }
            };
            if (!this.cell) {
                return baseMeta;
            }
            else {
                var metadata = this.cell.metadata;
                if (!metadata || !metadata.kbase) {
                    metadata = baseMeta;
                    this.cell.metadata = metadata;
                }
                if (!metadata.kbase.dataCell) {
                    metadata.kbase.dataCell = {};
                }
                return metadata;
            }
        },

        init: function (options) {
            // handle where options.widget == null.
            options.widget = options.widget || this.options.widget;
            // handle where options.widget == 'null' string. I know. It happens.
            options.widget = options.widget === 'null' ? this.options.widget : options.widget;
            this._super(options);
            this.upaApi = new UpaApi();

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

            this.metadata = this.initMetadata();

            if (this.cell) {
                this.handleUpas();
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

        /**
         * handle upas here! Needs to do the following:
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
         *
         * useLocal - forces the serialization to use only the locally defined upas
         *            in this.upas, NOT the ones in the cell metadata.
         */
        handleUpas: function(useLocal) {
            // if useLocal, then drop the current values in this.upas into the metadata.
            // otherwise, if there's existing upas in metadata, supplant this.upas with those.
            if (!this.metadata.kbase.dataCell.upas) {
                this.metadata.kbase.dataCell.upas = this.upaApi.serializeAll(this.options.upas);
            }
            else if (!useLocal && this.metadata.kbase.dataCell.upas) {
                this.options.upas = this.upaApi.deserializeAll(this.metadata.kbase.dataCell.upas);
            }
            else {
                this.metadata.kbase.dataCell.upas = this.upaApi.serializeAll(this.options.upas);
            }
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

            this.$timestamp = $('<span>')
                .addClass('pull-right kb-func-timestamp');

            if (this.options.time) {
                this.$timestamp.append($('<span>')
                    .append(TimeFormat.readableTimestamp(this.options.time)));
                this.$elem.closest('.cell').find('.button_container').trigger('set-timestamp.toolbar', this.options.time);
            }

            if (this.isRendered) {
                // update the header
                this.headerWidget.updateUpas(this.options.upas);
            }
            else {
                if (this.$body) {
                    this.$body.remove();
                }
                var $headController = $('<div>').hide();
                this.headerWidget = new ObjectCellHeader($headController, {
                    upas: this.options.upas,
                    versionCallback: this.displayVersionChange.bind(this),
                });
                var $headerBtn = $('<button>')
                    .addClass('btn btn-default kb-data-obj')
                    .attr('type', 'button')
                    .text('Details...')
                    .click(function() {
                        if (this.headerShown) {
                            $headController.hide();
                            this.headerShown = false;
                        } else {
                            $headController.show();
                            this.headerShown = true;
                        }
                    }.bind(this));
                this.$body = $('<div class="kb-cell-output-content">')
                    .append($headController)
                    .append($headerBtn);
                this.$elem.append(this.$body);
            }

            return this.renderBody()
                .then(function() {
                    this.isRendered = true;
                }.bind(this));
        },

        renderBody: function() {
            var self = this;
            return new Promise(function(resolve) {
                var widget = self.options.widget,
                    widgetData = self.options.data;
                if (widget === 'kbaseDefaultNarrativeOutput') {
                    widgetData = { data: self.options.data };
                }
                widgetData.upas = self.options.upas;

                require([widget],
                    function (W) {
                        if (self.$widgetBody) {
                            self.$widgetBody.remove();
                        }
                        self.$widgetBody = $('<div>');
                        self.$body.append(self.$widgetBody);
                        self.$outWidget = new W(self.$widgetBody, widgetData);
                        resolve();
                    },
                    function (err) {
                        return self.renderError(err);
                    }
                );
            });
        },

        displayVersionChange: function(upaId, newVersion) {
            /* Modify upa.
             * Serialize.
             * re-render all the things.
             */
            var newUpa = this.upaApi.changeUpaVersion(this.options.upas[upaId], newVersion);
            this.options.upas[upaId] = newUpa;
            this.handleUpas(true);
            this.render();
        },

        renderError: function(err) {
            // KBError('Output::' + this.options.title, 'failed to render output widget: "' + this.options.widget + '"');
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
            return this.render();
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
            if (!element || !settings) {
                return true;
            }
            var fold = settings.container.offset().top + settings.container.height(),
                elementTop = $(element).offset().top - settings.threshold;
            return elementTop <= fold; // test if it is "above the fold"
        }
        /* End of Lazy Load code.
         * ------------------------------------------------------- */
    });
});
