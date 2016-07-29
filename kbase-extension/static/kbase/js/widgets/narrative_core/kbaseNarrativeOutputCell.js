/*global define*/
/*jslint white:true,browser:true*/
define([
    'jquery',
    'kbwidget',
    'base/js/namespace'
], function (
    $,
    KBWidget,
    Jupyter
    ) {
    "use strict";
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
            showMenu: true
        },
        OUTPUT_ERROR_WIDGET: 'kbaseNarrativeError',
        init: function (options) {
            this._super(options);

            this.data = this.options.data;
            this.options.type = this.options.type.toLowerCase();
            this.cell = Jupyter.narrative.getCellByKbaseId(this.$elem.attr('id'));
            this.cell.element.trigger('hideCodeArea.cell');
            if (this.options.widget.toLowerCase() === "null") {
                this.options.widget = 'kbaseDefaultNarrativeOutput';
            }

            /*
             * This sets up "lazy" rendering.
             * Cells that are not visible are not rendered initially.
             * To render them when they scroll into view, a handler is
             * added to the container that will check their visibility on
             * every scroll event.
             * XXX: Not sure whether "on every scroll event" is going to be
             * too heavy-weight a check once there are 100 elements to worry about.
             */
            this.is_rendered = false;
            var nb_container = $('#notebook-container'); 
            this.visible_settings = {
                container: nb_container,
                threshold: 100 };
            this.lazyRender({data: this}); // try to render at first view
            if (!this.is_rendered) {
                // Not initially rendered, so add handler to re-check after scroll events
                nb_container.scroll(this, this.lazyRender);
            }

            return this;
        },

        // Log debug message with cell id
        cellDebug: function(msg) {
            console.debug('cell ' + this.options.cellId + ': ' + msg);
        },

        // Return true if cell is visible on page, false otherwise
        lazyVisible: function () {
            return this.inviewport(this.$elem, this.visible_settings);
        },

        // Possibly render lazily not-yet-rendered cell
        lazyRender: function(event) {
            var self = event.data;
            if (self.is_rendered) {
                //self.cellDebug('already rendered');
                // Note: We could also see if a cell that is rendered, is now
                // no longer visible, and somehow free its resources.
                return;
            }
            // see if it is visible before trying to render
            if ( !self.lazyVisible() ) {
                //self.cellDebug('do not render cell. not visible');
                return;
            }
            //self.cellDebug('visible: true');
            return self.render();
        },

        // Render cell (unconditionally)
        render: function () {
            // render the cell
            this.cellDebug('begin: render cell');
            var icon;
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
            this.is_rendered = true;
            this.cellDebug('end: render cell');
        },
        renderViewerCell: function () {
            require(['kbaseNarrativeDataCell'], $.proxy(function () {
                var $label = $('<span>').addClass('label label-info').append('Viewer');
                this.renderCell('kb-cell-output', 'panel-default', 'kb-out-desc', $label, 'data viewer');
                var $cell = this.$elem.closest('.cell');
                $cell.trigger('set-icon.cell', ['<i class="fa fa-2x fa-table data-viewer-icon"></i>']);
            }, this));
        },
        renderMethodOutputCell: function () {
            var $label = $('<span>').addClass('label label-info').append('Output');
            this.renderCell('kb-cell-output', 'panel-default', 'kb-out-desc', $label, 'method output');
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
            require(['kbaseNarrativeError'], $.proxy(function () {
                if (!this.options.title)
                    this.options.title = 'Narrative Error';
                var $label = $('<span>').addClass('label label-danger').append('Error');
                this.renderCell('kb-cell-error', 'panel-danger', 'kb-err-desc', $label);
                var $cell = this.$elem.closest('.cell');
                $cell.trigger('set-icon.cell', ['<i class="fa fa-2x fa-exclamation-triangle error-icon"></i>']);
                $cell.addClass('kb-error');
            }, this));
        },
        renderCell: function (baseClass, panelClass, headerClass, $label, titleSuffix) {
            // set up the widget line
            var widget = this.options.widget;
            var methodName = this.options.title ? this.options.title : 'Unknown method';
            var title = methodName;
            if (titleSuffix) {
                title += ' (' + titleSuffix + ')';
            }

// TODO: a label which can appear above or instaead of the icon in the prmopt area.
//            this.$elem
//                .closest('.cell')
//                .trigger('set-label', [$label.html()]);

            // this.$elem
            //     .closest('.cell')
            //     .trigger('set-title', [title]);

            // TODO: omit this? v
//            if (!(this.cell.metadata.kbase)) {
//                this.cell.metadata.kbase = {
//                    'attributes': {
//                    },
//                    'type': 'output'
//                };
//            }
//            var meta = this.cell.metadata;
//            if (meta.kbase.type && meta.kbase.type === 'output') {
//                meta.kbase.attributes.title = title;
//            }
//
//            this.cell.metadata = meta;
            // TODO: omit? ^


            var widgetData = this.options.data;
            if (widget === 'kbaseDefaultNarrativeOutput')
                widgetData = {data: this.options.data};

            this.$timestamp = $('<span>')
                .addClass('pull-right kb-func-timestamp');

            if (this.options.time) {
                this.$timestamp.append($('<span>')
                    .append(this.readableTimestamp(this.options.time)));
                this.$elem.closest('.cell').find('.button_container').trigger('set-timestamp.toolbar', this.options.time);
            }

            var $headerLabel = $('<span>')
                .addClass('label label-info')
                .append('Output');

            var $headerInfo = $('<span>')
                .addClass(headerClass)
                .append($('<b>').append(methodName))
                .append(this.$timestamp);

            var $body = $('<div class="kb-cell-output-content">');

            try {
                require([widget],
                    function (W) {
                        // If we successfully Require the widget code, render it:
                        this.$outWidget = new W($body, widgetData);
                        // this.$outWidget = $body.find('.panel-body > div')[widget](widgetData);
                        this.$elem.append($body);
                    }.bind(this),
                    function (err) {
                        // If we fail, render the error widget and log the error.
                        KBError("Output::" + this.options.title, "failed to render output widget: '" + widget);
                        this.options.title = 'App Error';
                        this.options.data = {
                            error: {
                                msg: 'An error occurred while showing your output:',
                                method_name: 'kbaseNarrativeOutputCell.renderCell',
                                type: 'Output',
                                severity: '',
                                traceback: 'Failed while trying to show a "' + widget + '"\n' +
                                    'With inputs ' + JSON.stringify(widgetData) + '\n\n' +
                                    err.message
                            }
                        };
                        this.options.widget = this.OUTPUT_ERROR_WIDGET;
                        this.renderErrorOutputCell();
                    }.bind(this));
            } catch (err) {
                KBError("Output::" + this.options.title, "failed to render output widget: '" + widget);
                this.options.title = 'App Error';
                this.options.data = {
                    error: {
                        msg: 'An error occurred while showing your output:',
                        method_name: 'kbaseNarrativeOutputCell.renderCell',
                        type: 'Output',
                        severity: '',
                        traceback: 'Failed while trying to show a "' + widget + '"\n' +
                            'With inputs ' + JSON.stringify(widgetData) + '\n\n' +
                            err.message
                    }
                };
                this.options.widget = this.OUTPUT_ERROR_WIDGET;
                this.renderErrorOutputCell();

                // this.$outWidget = $body.find('.panel-body > div')[this.OUTPUT_ERROR_WIDGET]({'error': {
                //     'msg': 'An error occurred while showing your output:',
                //     'method_name': 'kbaseNarrativeOutputCell.renderCell',
                //     'type': 'Output',
                //     'severity': '',
                //     'traceback': 'Failed while trying to show a "' + widget + '"\n' +
                //                  'With inputs ' + JSON.stringify(widgetData) + '\n\n' +
                //                  err.message
                // }});
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
                    this.$timestamp.html(readableTimestamp(state.time));
                }
                if (this.$outWidget && this.$outWidget.loadState) {
                    this.$outWidget.loadState(state);
                }
            }
        },
        /**
         * Returns a timestamp in milliseconds since the epoch.
         * (This is a one-liner, but kept as a separate function in case our needs change.
         * Maybe we'll want to use UTC or whatever...)
         * @public
         */
        getTimestamp: function () {
            return new Date().getTime();
        },
        /**
         * Converts a timestamp to a simple string.
         * Do this American style - HH:MM:SS MM/DD/YYYY
         *
         * @param {string} timestamp - a timestamp in number of milliseconds since the epoch.
         * @return {string} a human readable timestamp
         */
        readableTimestamp: function (timestamp) {
            var format = function (x) {
                if (x < 10)
                    x = '0' + x;
                return x;
            };

            var d = new Date(timestamp);
            var hours = format(d.getHours());
            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth() + 1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return hours + ":" + minutes + ":" + seconds + ", " + month + "/" + day + "/" + year;
        },
        /* -------------------------------------------------------
         * Code modified from:
         * Lazy Load - jQuery plugin for lazy loading images
         * Copyright (c) 2007-2015 Mika Tuupola
         * Licensed under the MIT license
         * Project home: http://www.appelsiini.net/projects/lazyload
         */
        inviewport: function(element, settings) {
             var fold = settings.container.offset().top + settings.container.height(),
                 element_top = $(element).offset().top - settings.threshold;
             return element_top <= fold; // test if it is "above the fold"
        }
        /* End of Lazy Load code.
         * ------------------------------------------------------- */
    });
});
