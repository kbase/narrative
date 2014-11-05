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
        defaultOutputWidget: 'kbaseDefaultNarrativeOutput',

        appSpec: null,
        methodSpecs: null,
        inputSteps: null,
        inputStepLookup: null,
        
        $runButton: null,
        $stopButton: null,
        
        
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
                    this.methodSpecs = specs;
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

        /* temp hack to deal with current state of NJS */
        getSpecAndParameterInfo: function() {
            return {
                appSpec : this.appSpec,
                methodSpecs : this.methodSpecs,
                parameterValues: this.getAllParameterValues()
            };
        },
        
        /**
         * Renders this cell and its contained input widget.
         */
        render: function(stepSpecs) {
            this.methodSpecs = {};

            var self = this;
            this.$runButton = $('<button>')
                              .attr('type', 'button')
                              .attr('value', 'Run')
                              .addClass('btn btn-success btn-sm')
                              .append('Run')
                              .click(
                                  $.proxy(function(event) {
                                      self.startAppRun();
                                      event.preventDefault();
                                      this.trigger('runApp.Narrative', { 
                                          cell: IPython.notebook.get_selected_cell(),
                                          appSpec: this.appSpec,
                                          methodSpecs: this.methodSpecs,
                                          parameters: this.getParameters()
                                      });
                                  }, this)
                              );
            this.$stopButton = $('<button>')
                              .attr('type', 'button')
                              .attr('value', 'Stop')
                              .addClass('btn btn-warning btn-sm')
                              .append('Stop')
                              .click(
                                  $.proxy(function(event) {
                                      self.stopAppRun();
                                  }, this)
                              )
                              .hide();
                            

            var $appInfo = this.appSpec.info.name;
            this.$methodPanel = $('<div>')
                                .addClass('kb-app-steps');
            var stepHeaderText = "Step ";
            this.inputSteps = [];
            this.inputStepLookup = {};
            var inputStep = {};
            for (var i=0; i<stepSpecs.length; i++) {
                var $stepPanel = this.renderStepDiv(this.appSpec.steps[i].step_id, stepSpecs[i], stepHeaderText + (i+1)+": ");
                this.$methodPanel.append($stepPanel);
                this.methodSpecs[stepSpecs[i].info.id] = stepSpecs[i];
            }

            var $buttons = $('<div>')
                           .addClass('buttons pull-right')
                           .append(this.$runButton)
                           .append(this.$stopButton);

            var $appSubtitleDiv = $("<div>")
                                        .addClass('kb-app-panel-description')
                                        .append(this.appSpec.info.subtitle);
            
            var headerCleaned = this.appSpec.info.header.replace(/&quot;/g, "")
            var $appHeaderDiv = $("<div>")
                                        .addClass('kb-app-panel-header')
                                        .append(headerCleaned);
            
            var $cellPanel = $('<div>')
                             .addClass('panel kb-app-panel kb-cell-run')
                             .append($('<div>')
                                     .addClass('panel-heading app-panel-heading')
                                     .append("<h1><b>"+$appInfo+"</b></h1>")
                                     .append($appSubtitleDiv))
                             .append($('<div>')
                                     .addClass('panel-body')
                                     .append($appHeaderDiv))
                             .append($('<div>')
                                     .addClass('panel-body')
                                     .append(this.$methodPanel))
                             .append($('<div>')
                                     .addClass('panel-footer')
                                     .css({'overflow' : 'hidden'})
                                     .append($buttons));


            //now we link the step parameters together that are linked
            this.linkStepsTogether();
            
            // then we show the result
            this.$elem.empty().append($cellPanel);
            
            // finally, we refresh so that our drop down or other boxes can be populated
            this.refresh();
            
            //this.updateStepStatus("step_2","status");
            //this.setStepOutput("step_2",{data:{id:"IntegratedModel",ws:"wstester1:home"}});
            //this.setRunningStep("step_2");
            
        },

        // given a method spec, returns a jquery div that is rendered but not added yet to the dom
        // stepSpec - the spec from the narrative method store
        // stepHeading - something to show in front of the method title, e.g. Step 1, Step 2 ...
        renderStepDiv: function (stepId, stepSpec, stepHeading) {
            
            var $stepPanel = $("<div>").addClass('kb-app-step-container');
            
            var $statusPanel = $('<div>');
            var $outputPanel = $('<div>');
            
            
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
            $stepPanel.append($statusPanel);
            $stepPanel.append($outputPanel);

            var inputWidgetName = stepSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null') {
                inputWidgetName = this.defaultInputWidget;
            }
            var outputWidgetName = stepSpec.widgets.output;
            //if (!outputWidgetName || outputWidgetName === 'null') {
                outputWidgetName = this.defaultOutputWidget;
            //}

            // todo, update input widget so that we don't have to stringify
            var inputWidget = $inputWidgetDiv[inputWidgetName]({ method: JSON.stringify(stepSpec) });
            var inputStepData = {id:stepId ,methodId: stepSpec.info.id, widget:inputWidget, $stepContainer:$stepPanel, $statusPanel:$statusPanel, $outputPanel:$outputPanel, outputWidgetName:outputWidgetName }
            this.inputSteps.push(inputStepData);
            this.inputStepLookup[stepId] = inputStepData;
            return $stepPanel;
        },
        
        linkStepsTogether: function() {
            var self = this;
            if(this.appSpec && this.inputSteps) {
                var steps = this.appSpec.steps;
                for(var s=0; s<steps.length; s++) {
                    var input_mapping = steps[s].input_mapping;
                    for(var m=0; m<input_mapping.length; m++) {
                        if (input_mapping[m].is_from_input) { // should be 1 for true, 0 for false
                            // first disable the input box
                            this.inputStepLookup[steps[s].step_id].widget.disableParameterEditing(input_mapping[m].to);
                            // connect the values
                            if(this.inputStepLookup[input_mapping[m].step_source]) {
                                var step_target = this.inputStepLookup[steps[s].step_id].widget;
                                var step_source = this.inputStepLookup[input_mapping[m].step_source].widget;
                                var from = input_mapping[m].from;
                                var to = input_mapping[m].to;
                                // set the value to the original value
                                step_target.setParameterValue(to, step_source.getParameterValue(from));
                                // make sure the value changes every time the source input changes
                                step_source.addInputListener(
                                    from,
                                    function() {
                                        step_target.setParameterValue(to, step_source.getParameterValue(from));
                                    }
                                );
                            } else {
                                console.error("invalid input mapping in spec for "+steps[s].step_id+", from step does not exist.");
                                console.error(this.appSpec);
                            }
                        }
                    }
                }
            }
            return;
        },
        
        
        /* locks inputs and updates display properties to reflect the running state */
        startAppRun: function() {
            var self = this;
            self.$runButton.hide();
            self.$stopButton.show();
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    this.inputSteps[i].widget.lockInputs();
                }
            }
        },
        
        /* unlocks inputs and updates display properties to reflect the not running state */
        stopAppRun: function() {
            var self = this;
            self.$stopButton.hide();
            self.$runButton.show();
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    this.inputSteps[i].widget.unlockInputs();
                }
            }
        },
        
        
        
        
        
        
        /**
         * DO NOT USE!!  use getAllParameterValues instead from now on...
         */
        getParameters: function() {
            return this.getAllParameterValues();
        },
        
        
        /**
         * returns structure that preserves method/parameter ordering in original spec
         * [
         *   { stepId: id, values = [
         *          {id: paramid, value: v},
         *          ...
         *      ]
         *   },
         *   ...
         * ]
         */
        getAllParameterValues: function() {
            var allValues = [];
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    var stepId = this.inputSteps[i].id;
                    var methodId = this.inputSteps[i].methodId;
                    var values = this.inputSteps[i].widget.getAllParameterValues();
                    allValues.push({stepId:stepId, methodId:methodId, values:values});
                }
            }
            return allValues;
        },

        /**
         * @method
         * Returns the state as reported by the contained input widget.
         * @public
         */
        getState: function() {
            var state = {};
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    var id = this.inputSteps[i].id;
                    state[id] = this.inputSteps[i].widget.getState();
                }
            }
            return state;
        },

        /**
         * @method
         * Passes along the state to its contained input widget.
         * @public
         */
        loadState: function(state) {
            if (!state) {
                return;
            }
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    var id = this.inputSteps[i].id;
                    if (state.hasOwnProperty(id)) {
                        this.inputSteps[i].widget.loadState(state[id]);
                    }
                }
            }
            return;
        },

        
        
        /** methods for setting the app state based on the job status **/
        setRunningStep: function(stepId) {
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    this.inputSteps[i].$stepContainer.removeClass("kb-app-step-running");
                    if (this.inputSteps[i].id === stepId) {
                        this.inputSteps[i].$stepContainer.addClass("kb-app-step-running");
                    }
                }
            }
        },
        
        updateStepStatus: function(stepId, status) {
            if (this.inputStepLookup) {
                if(this.inputStepLookup[stepId]) {
                    this.inputStepLookup[stepId].$statusPanel.empty();
                    var $statusCell = $("<div>").addClass("kb-cell-output").css({"padding-top":"5px"}).append(
                                            $('<div>').addClass("panel panel-default")
                                                .append($('<div>').addClass("panel-body").html(status))
                                            );
                    this.inputStepLookup[stepId].$statusPanel.append($statusCell);
                }
            }
        },
        
        setStepOutput: function(stepId, output) {
            if (this.inputStepLookup) {
                if(this.inputStepLookup[stepId]) {
                    this.inputStepLookup[stepId].$outputPanel.empty();
                    
                    var widgetName = this.inputStepLookup[stepId].outputWidgetName;
                    var $outputWidget = $('<div>'); var widget;
                    if (widgetName !== "kbaseDefaultNarrativeOutput")
                        widget = $outputWidget[widgetName](output);
                    else
                        widget = $outputWidget[widgetName]({data:output});
                    
        
                    var header = '<span class="kb-out-desc">Output</span><span class="pull-right kb-func-timestamp">' + 
                                    this.readableTimestamp(new Date().getTime()) +
                                    '</span>';
        
                    var $outputCell = $("<div>").addClass("kb-cell-output").css({"padding-top":"5px","padding-bottom":"5px"}).append(
                                            $('<div>').addClass("panel panel-default")
                                                .append($('<div>').addClass("panel-heading").append(header))
                                                .append($('<div>').addClass("panel-body").append($outputWidget))
                                            );
        
                    this.inputStepLookup[stepId].$outputPanel.append($outputCell);
                    
                    // todo: save outputwidget in list so that state can be saved
                }
            }
        },
        
        setStepError: function(stepId, error) {
            if (this.inputStepLookup) {
                if(this.inputStepLookup[stepId]) {
                    this.inputStepLookup[stepId].$outputPanel.html(error);
                    // todo: actually render with the error widget
                }
            }
        },
        
        /** end methods for setting the app state based on the job status **/
        
        /**
         * Refreshes the input widget according to its own method.
         */
        refresh: function() {
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    this.inputSteps[i].widget.refresh();
                }
            }
        },
        
        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
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