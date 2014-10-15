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

            this.render();
            return this;
        },

        render: function() {
            var inputWidget = this.defaultInputWidget;

            console.log('method!');
            console.log(this.method);
            if (this.method.widgets.input)
                inputWidget = this.method.widgets.input;

            var $inputDiv = $('<div>').append('inputs!');

            // These are the 'delete' and 'run' buttons for the cell
            this.$runButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Run')
                             .addClass('btn btn-primary btn-sm')
                             .append('Run');
            this.$runButton.click(
                $.proxy(function(event) {
                    console.log("run cell")
                    console.log(IPython.notebook.get_selected_cell());
                    this.trigger('runCell.Narrative');
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
                                               .css({'width' : '0%'}))
                                       .append($('<p>')
                                               .addClass('text-success')));

                // // The progress bar remains hidden until invoked by running the cell
                // var progressBar = "<div id='kb-func-progress' class='pull-left' style='display:none;'>" +
                //                     "<div class='progress progress-striped active kb-cell-progressbar'>" +
                //                         "<div class='progress-bar progress-bar-success' role='progressbar' aria-valuenow='0' " +
                //                         "aria-valuemin='0' aria-valuemax='100' style='width:0%'/>" +
                //                     "</div>" +
                //                     "<p class='text-success'/>" +
                //                   "</div>";

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




                // // Associate method title with description via BS3 collapsing
                // var methodId = cellId + "-method-details";
                // var buttonLabel = "...";
                // var methodDesc = method.description.replace(/"/g, "'"); // double-quotes hurt markdown rendering
                // var methodInfo = "<div class='kb-func-desc'>" +
                //                    "<h1><b>" + method.title + "</b></h1>" +
                //                    "<span class='pull-right kb-func-timestamp' id='last-run'></span>" +
                //                    "<button class='btn btn-default btn-xs' type='button' data-toggle='collapse'" +
                //                       " data-target='#" + methodId + "'>" + buttonLabel + "</button>" +
                //                     "<div><h2 class='collapse' id='" + methodId + "'>" +
                //                       methodDesc + "</h2></div>" +
                //                  "</div>";

            var $cellPanel = $('<div>')
                             .addClass('panel kb-func-panel kb-cell-run')
                             .attr('id', this.options.cellId)
                             .append($('<div>')
                                     .addClass('panel-heading')
                                     .append($methodInfo))
                             .append($('<div>')
                                     .addClass('panel-body')
                                     .append($inputDiv))
                             .append($('<div>')
                                     .addClass('panel-footer')
                                     .css({'overflow' : 'hidden'})
                                     .append($progressBar)
                                     .append($buttons));

            this.$elem.append($cellPanel);

                // // Bringing it all together...
                // cellContent = "<div class='panel kb-func-panel kb-cell-run' id='" + cellId + "'>" +
                //                   "<div class='panel-heading'>" +
                //                       methodInfo +
                //                   "</div>" +
                //                   "<div class='panel-body'>" +
                //                       inputDiv +
                //                   "</div>" +
                //                   "<div class='panel-footer' style='overflow:hidden'>" +
                //                       progressBar +
                //                       buttons +
                //                   "</div>" +
                //               "</div>" +
                //               "\n<script>" + 
                //               "$('#" + cellId + " > div > div#inputs')." + inputWidget + "({ method:'" +
                //                this.safeJSONStringify(method) + "'});" +
                //               "</script>";
        },

        getParameters: function() {
            return [ "returning parameter list" ];
        },

        getState: function() {
            return {};
        },

        loadState: function(state) {
            if (!state)
                return;
        },

        refresh: function() {

        },


    });

})( jQuery );