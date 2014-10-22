/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeCell",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            method: null,
            cellId: null,
        },
        IGNORE_VERSION: true,

        init: function(options) {
            this._super(options);

            this.options.method = this.options.method.replace(/\n/g, '');
            this.method = JSON.parse(this.options.method);
            this.cellId = this.options.cellId;
            this.defaultInputWidget = 'kbaseNarrativeMethodInput';
            this.render();
            return this;
        },

        render: function() {
            if (this.method.widgets.input)
                inputWidget = this.method.widgets.input;

            this.$inputDiv = $('<div>');

            // These are the 'delete' and 'run' buttons for the cell
            this.$runButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Run')
                             .addClass('btn btn-primary btn-sm')
                             .append('Run');
            this.$runButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    this.trigger('runCell.Narrative', { 
                        cell: IPython.notebook.get_selected_cell(),
                        method: this.method,
                        parameters: this.getParameters()
                    });
                }, this)
            );

            this.$deleteButton = $('<button>')
                                .attr('id', this.cellId + '-delete')
                                .attr('type', 'button')
                                .attr('value', 'Delete')
                                .addClass('btn btn-default btn-sm')
                                .append('Delete');
            this.$deleteButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    this.trigger('deleteCell.Narrative', IPython.notebook.get_selected_index());
                }, this)
            );

            var $buttons = $('<div>')
                           .addClass('buttons pull-right')
                           .append(this.$deleteButton)
                           .append(this.$runButton);


            var $progressBar = $('<div>')
                               .attr('id', 'kb-func-progress')
                               .addClass('pull-left')
                               .css({'display' : 'none'})
                               .append($('<div>')
                                       .addClass('progress progress-striped active kb-cell-progressbar')
                                       .append($('<div>')
                                               .addClass('progress-bar progress-bar-success')
                                               .attr('role', 'progressbar')
                                               .attr('aria-valuenow', '0')
                                               .attr('aria-valuemin', '0')
                                               .attr('aria-valuemax', '100')
                                               .css({'width' : '0%'})))
                               .append($('<p>')
                                       .addClass('text-success'));

            var methodId = this.options.cellId + '-method-details';
            var buttonLabel = '...';
            var methodDesc = this.method.info.tooltip;
            var $methodInfo = $('<div>')
                              .addClass('kb-func-desc')
                              .append('<h1><b>' + this.method.info.name + '</b></h1>')
                              .append($('<span>')
                                      .addClass('pull-right kb-func-timestamp')
                                      .attr('id', 'last-run'))
                              .append($('<button>')
                                      .addClass('btn btn-default btn-xs')
                                      .attr('type', 'button')
                                      .attr('data-toggle', 'collapse')
                                      .attr('data-target', '#' + methodId)
                                      .append(buttonLabel))
                              .append($('<h2>')
                                      .attr('id', methodId)
                                      .addClass('collapse')
                                      .append(methodDesc));

            var $cellPanel = $('<div>')
                             .addClass('panel kb-func-panel kb-cell-run')
                             .attr('id', this.options.cellId)
                             .append($('<div>')
                                     .addClass('panel-heading')
                                     .append($methodInfo))
                             .append($('<div>')
                                     .addClass('panel-body')
                                     .append(this.$inputDiv))
                             .append($('<div>')
                                     .addClass('panel-footer')
                                     .css({'overflow' : 'hidden'})
                                     .append($progressBar)
                                     .append($buttons));

            this.$elem.append($cellPanel);

            var inputWidgetName = this.method.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = this.defaultInputWidget;

            this.$inputWidget = this.$inputDiv[inputWidgetName]({ method: this.options.method });
        },

        getParameters: function() {
            return this.$inputWidget.getParameters();
        },

        getState: function() {
            return this.$inputWidget.getState();
        },

        loadState: function(state) {
            return this.$inputWidget.loadState(state);
        },

        refresh: function() {
            this.$inputWidget.refresh();
        },


    });

})( jQuery );