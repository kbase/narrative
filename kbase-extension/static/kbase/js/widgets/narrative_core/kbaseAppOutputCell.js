define(['jquery', 'kbwidget', 'base/js/namespace'], ($, KBWidget, Jupyter) => {
    'use strict';
    return KBWidget({
        name: 'kbaseAppOutputCell',
        version: '1.0.0',
        options: {
            widget: 'kbaseDefaultNarrativeOutput',
            data: '{}',
            cellId: null,
            type: 'error',
            title: 'Output',
            time: '',
            showMenu: true,
        },
        OUTPUT_ERROR_WIDGET: 'kbaseNarrativeError',
        init: function (options) {
            this._super(options);

            this.data = this.options.data;
            this.options.type = this.options.type.toLowerCase();
            if (this.options.widget.toLowerCase() === 'null') {
                this.options.widget = 'kbaseDefaultNarrativeOutput';
            }

            this.render();

            if (Jupyter.narrative) {
                Jupyter.narrative.registerWidget(this, this.options.cellId);
            }

            return this;
        },
        render: function () {
            this.renderAppOutputCell();
        },
        renderAppOutputCell: function () {
            const $label = $('<span>').addClass('label label-info').append('Output');
            this.renderCell('kb-cell-output', 'panel-default', 'kb-out-desc', $label, 'app output');
            const $cell = this.$elem.closest('.cell');
            $cell.trigger('set-icon.cell', [
                '<i class="fa fa-2x fa-file-o method-output-icon"></i>',
            ]);
        },
        renderErrorOutputCell: function () {
            require(['kbaseNarrativeError'], $.proxy(function () {
                if (!this.options.title) this.options.title = 'Narrative Error';
                const $label = $('<span>').addClass('label label-danger').append('Error');
                this.renderCell('kb-cell-error', 'panel-danger', 'kb-err-desc', $label);
                const $cell = this.$elem.closest('.cell');
                $cell.trigger('set-icon.cell', [
                    '<i class="fa fa-2x fa-exclamation-triangle error-icon"></i>',
                ]);
                $cell.addClass('kb-error');
            }, this));
        },
        renderCell: function (baseClass, panelClass, headerClass, $label, titleSuffix) {
            // set up the widget line
            const widget = this.options.widget;
            const methodName = this.options.title ? this.options.title : 'Unknown method';
            let title = methodName;
            if (titleSuffix) {
                title += ' (' + titleSuffix + ')';
            }

            this.$elem.closest('.cell').trigger('set-title', [title]);

            let widgetData = this.options.data;
            if (widget === 'kbaseDefaultNarrativeOutput') widgetData = { data: this.options.data };

            this.$timestamp = $('<span>').addClass('pull-right kb-func-timestamp');

            if (this.options.time) {
                this.$timestamp.append(
                    $('<span>').append(this.readableTimestamp(this.options.time))
                );
                this.$elem
                    .closest('.cell')
                    .find('.button_container')
                    .trigger('set-timestamp.toolbar', this.options.time);
            }

            const $headerLabel = $('<span>').addClass('label label-info').append('Output');

            const $headerInfo = $('<span>')
                .addClass(headerClass)
                .append($('<b>').append(methodName))
                .append(this.$timestamp);

            const $body = $('<div class="kb-cell-output-content">');

            try {
                require([widget], (W) => {
                    // If we successfully Require the widget code, render it:
                    this.$outWidget = new W($body, widgetData);
                    // this.$outWidget = $body.find('.panel-body > div')[widget](widgetData);
                    this.$elem.append($body);
                }, (err) => {
                    // If we fail, render the error widget and log the error.
                    KBError(
                        'Output::' + this.options.title,
                        "failed to render app output widget: '" + widget
                    );
                    this.options.title = 'App Error';
                    this.options.data = {
                        error: {
                            msg: 'An error occurred while showing your output:',
                            method_name: 'kbaseNarrativeOutputCell.renderCell',
                            type: 'Output',
                            severity: '',
                            traceback:
                                'Failed while trying to show a "' +
                                widget +
                                '"\n' +
                                'With inputs ' +
                                JSON.stringify(widgetData) +
                                '\n\n' +
                                err.message,
                        },
                    };
                    this.options.widget = this.OUTPUT_ERROR_WIDGET;
                    this.renderErrorOutputCell();
                });
            } catch (err) {
                KBError(
                    'Output::' + this.options.title,
                    "failed to render app output widget: '" + widget
                );
                this.options.title = 'App Error';
                this.options.data = {
                    error: {
                        msg: 'An error occurred while showing your output:',
                        method_name: 'kbaseNarrativeOutputCell.renderCell',
                        type: 'Output',
                        severity: '',
                        traceback:
                            'Failed while trying to show a "' +
                            widget +
                            '"\n' +
                            'With inputs ' +
                            JSON.stringify(widgetData) +
                            '\n\n' +
                            err.message,
                    },
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
            let state = null;
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
            const format = function (x) {
                if (x < 10) x = '0' + x;
                return x;
            };

            const d = new Date(timestamp);
            const hours = format(d.getHours());
            const minutes = format(d.getMinutes());
            const seconds = format(d.getSeconds());
            const month = d.getMonth() + 1;
            const day = format(d.getDate());
            const year = d.getFullYear();

            return hours + ':' + minutes + ':' + seconds + ', ' + month + '/' + day + '/' + year;
        },
    });
});
