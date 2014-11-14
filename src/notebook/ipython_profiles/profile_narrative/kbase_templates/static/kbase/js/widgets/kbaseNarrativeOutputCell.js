(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeOutputCell',
        parent: 'kbaseWidget',
        version: '1.0.0',
        options: {
            widget: 'kbaseDefaultNarrativeOutput',
            data: '{}',
            cellId: null,
            type: 'error',
            title: 'Output',
            time: '',
        },

        init: function(options) {
            this._super(options);

            this.data = this.options.data;
            this.options.type = this.options.type.toLowerCase();

            this.render();

            return this;
        },

        render: function() {
            switch(this.options.type) {
                case 'method':
                    this.renderMethodOutputCell();
                    break;
                case 'app':
                    this.renderAppOutputCell();
                    break;
                case 'error':
                    this.renderErrorOutputCell();
                    break;
                default:
                    this.renderErrorOutputCell();
                    break;
            }
        },

        renderMethodOutputCell: function() {
            var $label = $('<span>').addClass('label label-info').append('Output');
            this.renderCell('kb-cell-output', 'panel-default', 'kb-out-desc', $label);
        },

        // same as method for now
        renderAppOutputCell: function() {
            renderMethodOutputCell();
        },

        renderErrorOutputCell: function() {
            if (!this.options.title)
                this.options.title = 'Narrative Error';
            var $label = $('<span>').addClass('label label-danger').append('Error');
            this.renderCell('kb-cell-error', 'panel-danger', 'kb-err-desc', $label);
        },

        renderCell: function(baseClass, panelClass, headerClass, $label) {
            // set up the widget line
            var widget = this.options.widget;
            var methodName = this.options.title ? this.options.title : 'Unknown method';

            var widgetData = this.options.data;
            if (widget === 'kbaseDefaultNarrativeOutput')
                widgetData = { data : this.options.data };

            this.$timestamp = $('<span>')
                              .addClass('pull-right kb-func-timestamp');

            if (this.options.time) {
                this.$timestamp.html(this.readableTimestamp(this.options.time));
            }

            var $headerLabel = $('<span>')
                               .addClass('label label-info')
                               .append('Output');

            var $headerInfo = $('<span>')
                              .addClass(headerClass)
                              .append($('<b>').append(methodName))
                              .append(this.$timestamp);

            var $body = $('<div>')
                        .addClass(baseClass)
                        .append($('<div>')
                                .addClass('panel ' + panelClass)
                                .append($('<div>')
                                        .addClass('panel-heading')
                                        .append($label)
                                        .append($headerInfo))
                                .append($('<div>')
                                        .addClass('panel-body')
                                        .append($('<div>'))));

            this.$elem.append($body);

            this.$outWidget = $body.find('.panel-body > div')[widget](widgetData);
        },

        getState: function() {
            var state = null;
            if (this.$outWidget && this.$outWidget.getState) {
                state = this.$outWidget.getState();
            }
            return state;
        },

        loadState: function(state) {
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
        getTimestamp: function() {
            return new Date().getTime();
        },

        /**
         * Converts a timestamp to a simple string.
         * Do this American style - HH:MM:SS MM/DD/YYYY
         *
         * @param {string} timestamp - a timestamp in number of milliseconds since the epoch.
         * @return {string} a human readable timestamp
         */
        readableTimestamp: function(timestamp) {
            var format = function(x) {
                if (x < 10)
                    x = '0' + x;
                return x;
            };

            var d = new Date(timestamp);
            var hours = format(d.getHours());
            var minutes = format(d.getMinutes());
            var seconds = format(d.getSeconds());
            var month = d.getMonth()+1;
            var day = format(d.getDate());
            var year = d.getFullYear();

            return hours + ":" + minutes + ":" + seconds + ", " + month + "/" + day + "/" + year;
        }

    });
})( jQuery );