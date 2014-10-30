/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 * This is a generalized class for an input cell that sits in an IPython markdown cell.
 * It handles all of its rendering here (no longer in HTML in markdown), and invokes
 * an input widget passed to it.
 *
 * This expects a method object passed to it, and expects that object to have the new
 * format from the narrative_method_store service.
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeAppCell",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            app: null,
            cellId: null,
            loadingImage: 'static/kbase/images/ajax-loader.gif',
            methodStoreURL: 'https://kbase.us/services/narrative_method_store',
            
            appHelpLink: '/functional-site/#/narrativestore/app/',
            methodHelpLink: '/functional-site/#/narrativestore/method/',
        },
        IGNORE_VERSION: true,
        defaultInputWidget: 'kbaseNarrativeMethodInput',

        inputWidgets: null,
        inputDivs: null,
        
        
        /**
         * @private
         * @method
         * Initialization is done by the KBase widget architecture itself.
         * This requires and assumes that an app spec and cellId are both present.
         * TODO: add checks and failures for this.
         *
         * This renders by calling fetchMethodInfo, which grabs all the specs
         * for the intermediate steps, then renders the whole mess and 
         * refreshes to update with jobs and results and such.
         *
         */
        init: function(options) {
            this._super(options);

            if (window.kbconfig && window.kbconfig.urls) {
                this.options.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }
            this.methClient = new NarrativeMethodStore(this.options.methodStoreURL);

            this.options.appSpec = this.options.appSpec.replace(/\n/g, '');
            this.appSpec = JSON.parse(this.options.appSpec);
            this.cellId = this.options.cellId;

            this.$elem.append($('<img src="' + this.options.loadingImage + '">'))
                      .append($('<div>Loading App...</div>'));

            this.fetchMethodInfo();
            return this;
        },

        fetchMethodInfo: function() {
            if (!this.appSpec.steps || this.appSpec.steps.length === 0) {
                this.showError('App "' + this.appSpec.info.name + '" has no steps!');
            }
            // get the list of method ids
            var methodIds = [];
            for (var i=0; i<this.appSpec.steps.length; i++) {
                methodIds.push(this.appSpec.steps[i].method_id);
            }
            this.methClient.get_method_spec({'ids' : methodIds},
                $.proxy(function(specs) {
                    this.render(specs);
                }, this),
                $.proxy(function(error) {
                    this.showError(error);
                }, this)
            );
        },

        showError: function(error) {
            console.error(error);
            var $errorHeader = $('<div>')
                               .addClass('alert alert-danger')
                               .append('<b>Sorry, an error occurred while loading your KBase App.</b><br>Please contact the KBase team at <a href="mailto:help@kbase.us?subject=Narrative%App%20loading%20error">help@kbase.us</a> with the information below.');
            var $errorPanel = $('<div>')
                                .addClass('panel kb-app-panel');
            $errorPanel.append($errorHeader);

            // If it's a string, just dump the string.
            if (typeof error === 'string') {
                $errorPanel.append($('<div>').append(error));
            }

            // If it's an object, expect an error object as returned by the execute_reply callback from the IPython kernel.
            else if (typeof error === 'object') {
                var $details = $('<div>');
                $details.append($('<div>')
                                .append('<b>Error:</b> ' + error.error.message+ '<br><br>'));

                var $tracebackDiv = $('<div>')
                                    .addClass('kb-function-error-traceback');
                //if (error.traceback) {
                //    for (var i=0; i<error.traceback.length; i++) {
                //        $tracebackDiv.append(error.traceback[i] + "<br>");
                //    }
                //}
                if (error.error) {
                    error.error.error.replace(/\n/g, "<br>");
                    $tracebackDiv.append(error.error.error + "<br>");
                }

                var $tracebackPanel = $('<div>');
                var tracebackAccordion = [{'title' : 'Detailed Error Trace', 'body' : $tracebackDiv}];

                $errorPanel.append($details)
                           .append($tracebackPanel);
                $tracebackPanel.kbaseAccordion({ elements : tracebackAccordion });
            }
            this.$elem.empty().append($errorPanel);
        },

        /**
         * Renders this cell and its contained input widget.
         */
        render: function(stepSpecs) {
            var $runButton = $('<button>')
                              .attr('type', 'button')
                              .attr('value', 'Run')
                              .addClass('btn btn-success btn-sm')
                              .append('Run')
                              .click(
                                  $.proxy(function(event) {
                                      event.preventDefault();
                                      this.trigger('runApp.Narrative', { 
                                          cell: IPython.notebook.get_selected_cell(),
                                          appSpec: this.appSpec,
                                          parameters: this.getParameters()
                                      });
                                  }, this)
                              );

            var $appInfo = this.appSpec.info.name;
            this.$methodPanel = $('<div>')
                                .addClass('kb-app-steps');
            var stepHeaderText = "Step ";
            this.inputWidgets = [];
            this.inputDivs = [];
            for (var i=0; i<stepSpecs.length; i++) {
                var $stepPanel = this.renderStepDiv(stepSpecs[i], stepHeaderText + (i+1)+": ");
                this.$methodPanel.append($stepPanel);
            }

            var $buttons = $('<div>')
                           .addClass('buttons pull-right')
                           .append($runButton);

            
            console.log(this.appSpec);
            var $appDescriptionDiv = $("<div>")
                                        .addClass('kb-app-panel-description')
                                        .append(this.appSpec.info.subtitle);
            
            var $cellPanel = $('<div>')
                             .addClass('panel kb-app-panel kb-cell-run')
                             .append($('<div>')
                                     .addClass('panel-heading app-panel-heading')
                                     .append("<h1><b>"+$appInfo+"</b></h1>")
                                     .append($appDescriptionDiv))
                             .append($('<div>')
                                     .addClass('panel-body')
                                     .append(this.$methodPanel))
                             .append($('<div>')
                                     .addClass('panel-footer')
                                     .css({'overflow' : 'hidden'})
                                     .append($buttons));

            this.$elem.empty().append($cellPanel);

            // if (this.method.widgets.input)
            //     inputWidget = this.method.widgets.input;

            // this.$inputDiv = $('<div>');

            // // These are the 'delete' and 'run' buttons for the cell
            // this.$runButton = $('<button>')
            //                  .attr('id', this.cellId + '-run')
            //                  .attr('type', 'button')
            //                  .attr('value', 'Run')
            //                  .addClass('btn btn-primary btn-sm')
            //                  .append('Run');
            // this.$runButton.click(
            //     $.proxy(function(event) {
            //         event.preventDefault();
            //         this.trigger('runCell.Narrative', { 
            //             cell: IPython.notebook.get_selected_cell(),
            //             method: this.method,
            //             parameters: this.getParameters()
            //         });
            //     }, this)
            // );

            // this.$deleteButton = $('<button>')
            //                     .attr('id', this.cellId + '-delete')
            //                     .attr('type', 'button')
            //                     .attr('value', 'Delete')
            //                     .addClass('btn btn-default btn-sm')
            //                     .append('Delete');
            // this.$deleteButton.click(
            //     $.proxy(function(event) {
            //         event.preventDefault();
            //         this.trigger('deleteCell.Narrative', IPython.notebook.get_selected_index());
            //     }, this)
            // );

            // var $buttons = $('<div>')
            //                .addClass('buttons pull-right')
            //                .append(this.$deleteButton)
            //                .append(this.$runButton);


            // var $progressBar = $('<div>')
            //                    .attr('id', 'kb-func-progress')
            //                    .addClass('pull-left')
            //                    .css({'display' : 'none'})
            //                    .append($('<div>')
            //                            .addClass('progress progress-striped active kb-cell-progressbar')
            //                            .append($('<div>')
            //                                    .addClass('progress-bar progress-bar-success')
            //                                    .attr('role', 'progressbar')
            //                                    .attr('aria-valuenow', '0')
            //                                    .attr('aria-valuemin', '0')
            //                                    .attr('aria-valuemax', '100')
            //                                    .css({'width' : '0%'})))
            //                    .append($('<p>')
            //                            .addClass('text-success'));

            // var methodId = this.options.cellId + '-method-details';
            // var buttonLabel = '...';
            // var methodDesc = this.method.info.tooltip;
            // var $methodInfo = $('<div>')
            //                   .addClass('kb-func-desc')
            //                   .append('<h1><b>' + this.method.info.name + '</b></h1>')
            //                   .append($('<span>')
            //                           .addClass('pull-right kb-func-timestamp')
            //                           .attr('id', 'last-run'))
            //                   .append($('<button>')
            //                           .addClass('btn btn-default btn-xs')
            //                           .attr('type', 'button')
            //                           .attr('data-toggle', 'collapse')
            //                           .attr('data-target', '#' + methodId)
            //                           .append(buttonLabel))
            //                   .append($('<h2>')
            //                           .attr('id', methodId)
            //                           .addClass('collapse')
            //                           .append(methodDesc));

            // var $cellPanel = $('<div>')
            //                  .addClass('panel kb-func-panel kb-cell-run')
            //                  .attr('id', this.options.cellId)
            //                  .append($('<div>')
            //                          .addClass('panel-heading')
            //                          .append($methodInfo))
            //                  .append($('<div>')
            //                          .addClass('panel-body')
            //                          .append(this.$inputDiv))
            //                  .append($('<div>')
            //                          .addClass('panel-footer')
            //                          .css({'overflow' : 'hidden'})
            //                          .append($progressBar)
            //                          .append($buttons));

            // this.$elem.append($cellPanel);

            // var inputWidgetName = this.method.widgets.input;
            // if (!inputWidgetName || inputWidgetName === 'null')
            //     inputWidgetName = this.defaultInputWidget;

            // this.$inputWidget = this.$inputDiv[inputWidgetName]({ method: this.options.method });
        },

        // given a method spec, returns a jquery div that is rendered but not added yet to the dom
        // stepSpec - the spec from the narrative method store
        // stepHeading - something to show in front of the method title, e.g. Step 1, Step 2 ...
        renderStepDiv: function (stepSpec, stepHeading) {
            
            var $stepPanel = $("<div>");
            var $inputWidgetDiv = $("<div>");
            
            
            var methodId = stepSpec.info.id + '-step-details-' + this.genUUID();
            var buttonLabel = 'step details';
            var methodDesc = stepSpec.info.subtitle;
            var $methodInfo = $('<div>')
                              .addClass('kb-func-desc')
                              .append('<h1><b>' + stepHeading +'</b>'+ stepSpec.info.name + '</h1>')
                              //.append($('<span>')
                              //        .addClass('pull-right kb-func-timestamp')
                              //        .attr('id', 'last-run'))
                              //        .append("some time")
                              .append($('<button>')
                                      .addClass('btn btn-default btn-xs')
                                      .attr('type', 'button')
                                      .attr('data-toggle', 'collapse')
                                      .attr('data-target', '#' + methodId)
                                      .append(buttonLabel))
                              .append($('<div>')
                                      .attr('id', methodId)
                                      .addClass('collapse')
                                      .append($('<h2>')
                                         .append(methodDesc +
                                                 ' <a href="'+ this.options.methodHelpLink + stepSpec.info.id +
                                                        '" target="_blank">More documentation...</a>')));

            var $cellPanel = $('<div>')
                             .addClass('panel kb-func-panel kb-app-func-panel kb-cell-run')
                             //.attr('id', this.options.cellId)
                             .append($('<div>')
                                     .addClass('panel-heading')
                                     .append($methodInfo))
                             .append($('<div>')
                                     .addClass('panel-body')
                                     .append($inputWidgetDiv))

            $stepPanel.append($cellPanel);

            var inputWidgetName = stepSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null') {
                inputWidgetName = this.defaultInputWidget;
            }

            // todo, update input widget so that we don't have to stringify
            var inputWidget = $inputWidgetDiv[inputWidgetName]({ method: JSON.stringify(stepSpec) });
            
            this.inputWidgets.push(inputWidget);
            this.inputDivs.push($inputWidgetDiv);
                
            return $stepPanel;
        },
        
        
        
        
        /**
         * @method
         * Returns parameters from the contained input widget
         * @public
         */
        getParameters: function() {
            return [];
//            return this.$inputWidget.getParameters();
        },

        /**
         * @method
         * Returns the state as reported by the contained input widget.
         * @public
         */
        getState: function() {
            return this.$inputWidget.getState();
        },

        /**
         * @method
         * Passes along the state to its contained input widget.
         * @public
         */
        loadState: function(state) {
            return this.$inputWidget.loadState(state);
        },

        /**
         * Refreshes the input widget according to its own method.
         */
        refresh: function() {
            this.$inputWidget.refresh();
        },
        
        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }


    });

})( jQuery );