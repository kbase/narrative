/**
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @author Michael Sneddon <mwsneddon@lbl.gov>
 * @author Dan Gunter <dkgunter@lbl.gov>
 * @public
 * This is a generalized class for an input cell that sits in an IPython markdown cell.
 * It handles all of its rendering here (no longer in HTML in markdown), and invokes
 * an input widget passed to it.
 *
 * This expects a method object passed to it, and expects that object to have the new
 * format from the narrative_method_store service.
 */

(function( $, undefined ) {
  require(['jquery', 'kbwidget'], function($) {
    $.KBWidget({
        name: "kbaseNarrativeAppCell",
        parent: "kbaseAuthenticatedWidget",
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

        $errorModal: null,
        $errorModalContent:null,

        OUTPUT_ERROR_WIDGET: 'kbaseNarrativeError',

        state: null,

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

            // initialize the state
            this.state = {
                    runningState: {
                        appRunState: "input", // could be 'input' || 'running' || 'error' || 'done', something else?
                        runningStep: null
                    },
                    step: { }
                };
            this.initErrorModal();

            this.fetchMethodInfo();

            return this;
        },

        fetchMethodInfo: function() {
            if (!this.appSpec.steps || this.appSpec.steps.length === 0) {
                KBError("App::" + this.appSpec.info.name, "has no steps");
                this.showAppLoadingError('App "' + this.appSpec.info.name + '" has no steps!');
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
                    KBError('get_method_spec', error);
                    this.showAppLoadingError(error);
                }, this)
            );
        },

        /**
         * Shows an error that occurred while loading app information. This essentially breaks the cell.
         * @method
         * @private
         */
        showAppLoadingError: function(error) {
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

        /**
         * Fetches the app spec, method specs, and parameter values
         * These are used elsewhere to set up the NJS job and to send
         * returned output values to the right place.
         */
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
                              .addClass('kb-app-run')
                              .append('Run')
                              .click(
                                  $.proxy(function(event) {
                                      var submittedText = "submitted on "+this.readableTimestamp(new Date().getTime());
                                      if(this.auth()) {
                                          if(this.auth().user_id)
                                              submittedText += ' by <a href="functional-site/#/people/'+this.auth().user_id
                                                                      +'" target="_blank">' + this.auth().user_id + "</a>";
                                      }
                                      this.$submitted.html(submittedText);
                                      var isGood = self.startAppRun();
                                      if (!isGood) { return; }

                                      event.preventDefault();
                                      this.trigger('runApp.Narrative', {
                                          cell: IPython.notebook.get_selected_cell(),
                                          appSpec: this.appSpec,
                                          methodSpecs: this.methodSpecs,
                                          parameters: this.getParameters()
                                      });
                                  }, this)
                              );


            /* A little debug button for fetching the app's state. */
            this.$stateDebugBtn = $('<button>')
                                  .attr('type', 'button')
                                  .attr('value', 'Get State')
                                  .addClass('btn btn-danger btn-sm')
                                  .append('Get State')
                                  .click(
                                      function(event) {
                                          console.log(self.getState());
                                      }
                                  );


            //We cannot stop a method from running, so this button for now is gone.
            this.$stopButton = $('<button>')
                              .attr('type', 'button')
                              .attr('value', 'Cancel')
                              .addClass('kb-app-run kb-app-cancel')
                              .append('Cancel')
                              .css({'margin-right':'5px'})
                              .click(
                                  $.proxy(function(event) {
                                      self.stopAppRun();
                                  }, this)
                              )
                              .hide();
            // Reset the inputs and prepare for another "run"
            this.$resetButton = $('<button>')
                .attr('type', 'button')
                .attr('value', 'Reset')
                .addClass('kb-app-run kb-app-reset')
                .append('Reset')
                .css({'margin-right':'5px', 'margin-left':'10px'})
                .click(
                    $.proxy(function(event) {
                    self.resetAppRun(true);
                }, this)
            )
            .hide();

            this.$submitted = $('<span>').addClass("kb-func-timestamp").hide();

            var appInfo = this.appSpec.info.name;
            this.$methodPanel = $('<div>')
                                .addClass('kb-app-steps');
            var stepHeaderText = "Step ";
            this.inputSteps = [];
            this.inputStepLookup = {};
            var inputStep = {};
            for (var i=0; i<stepSpecs.length; i++) {
                var $stepPanel = this.renderStepDiv(this.appSpec.steps[i].step_id, stepSpecs[i], stepHeaderText + (i+1));


                this.$methodPanel.append($stepPanel);
                this.methodSpecs[stepSpecs[i].info.id] = stepSpecs[i];
            }

            var $buttons = $('<div>')
                           .addClass('buttons pull-left')
                           .append(this.$runButton)
                           .append(this.$stopButton)
                           .append(this.$resetButton)
                           //.append(this.$stateDebugBtn)
                           .append(this.$submitted);

            var $appSubtitleDiv = $("<div>")
                                        .addClass('kb-app-panel-description')
                                        .append(this.appSpec.info.subtitle)
                                        .append('&nbsp;&nbsp;<a href="'+this.options.appHelpLink+this.appSpec.info.id+'" target="_blank">more...</a>');

            var headerCleaned = this.appSpec.info.header.replace(/&quot;/g, '"')
            var $appHeaderDiv = $("<div>")
                                        .addClass('kb-app-panel-header')
                                        .html(headerCleaned);

            var $menuSpan = $('<div class="pull-right">');

            // Controls (minimize)
            var $controlsSpan = $('<div>').addClass("pull-left");
            var $minimizeControl = $("<span class='glyphicon glyphicon-chevron-down'>")
                        .css({color: "#888", fontSize: "14pt", cursor:'pointer', paddingTop: "7px", margin: "5px"});
            $controlsSpan.append($minimizeControl);

            var $cellPanel = $('<div>')
                             .addClass('panel kb-app-panel kb-cell-run')
                             .append($controlsSpan)
                             .append($menuSpan)
                             .append($('<div>')
                                        .addClass('panel-heading')
                                        .append($('<div>').addClass('app-panel-heading')
                                                   .append($('<div>')
                                                           .append($('<h1><b>' + appInfo + '</b></h1>')))
                                                   .append($appSubtitleDiv)))
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
            require(['kbaseNarrativeCellMenu'], $.proxy(function() {
                this.cellMenu = $menuSpan.kbaseNarrativeCellMenu();
            }, this));


            //now we link the step parameters together that are linked
            this.linkStepsTogether();

            // then we show the result
            this.$elem.empty().append($cellPanel);

            // Add minimize/restore actions.
            // These mess with the CSS on the cells!
            var $mintarget = $cellPanel;
            this.panel_minimized = false;
            var self = this;
            $controlsSpan.click(function() {
                if (self.panel_minimized) {
                    $mintarget.find(".panel-body").slideDown();
                    $mintarget.find(".panel-footer").slideDown();
                    $minimizeControl.removeClass("glyphicon-chevron-right")
                                    .addClass("glyphicon-chevron-down");
                    self.panel_minimized = false;
                }
                else {
                    $mintarget.find(".panel-footer").slideUp();
                    $mintarget.find(".panel-body").slideUp();
                    $minimizeControl.removeClass("glyphicon-chevron-down")
                                    .addClass("glyphicon-chevron-right");
                    self.panel_minimized = true;
                }
            });

            // finally, we refresh so that our drop down or other boxes can be populated
            this.refresh();
        },

        minimizePanel: function() {
            // console.debug("minimize panel");
        },

        showFullPanel: function() {
            // console.debug("restore panel to full size");
        },

        // given a method spec, returns a jquery div that is rendered but not added yet to the dom
        // stepSpec - the spec from the narrative method store
        // stepHeading - something to show in front of the method title, e.g. Step 1, Step 2 ...
        renderStepDiv: function (stepId, stepSpec, stepHeading) {
            var $stepPanel = $("<div>").addClass('kb-app-step-container');

            var $statusPanel = $('<div>');
            var $outputPanel = $('<div>');


            // First setup the Input widget header
            var $inputWidgetDiv = $("<div>");
            var methodId = stepSpec.info.id + '-step-details-' + this.genUUID();
            var buttonLabel = 'details';
            var methodDesc = stepSpec.info.subtitle;
            var $header = $('<div>').css({'margin-top':'4px'})
                              .addClass('kb-func-desc');
            var $staticMethodInfo = $('<div>')
                              .append('<h1><b>' + stepHeading +'&nbsp&nbsp-&nbsp '+ stepSpec.info.name + '</b></h1>')
                              .append($('<h2>')
                                      .attr('id', methodId)
                                      .append(methodDesc +
                                            ' &nbsp&nbsp<a href="'+ this.options.methodHelpLink + stepSpec.info.id +
                                                '" target="_blank">more...</a>'
                                      ));
            $header.append($staticMethodInfo);
            var $dynamicMethodSummary = $('<div>');
            $header.append($dynamicMethodSummary);

            // Next the min/max controls
            var $controlsSpan = $('<div>').addClass("pull-left");
            var $minimizeControl = $("<span class='glyphicon glyphicon-chevron-down'>")
                                    .css({color: "#888", fontSize: "14pt", cursor:'pointer',
                                          paddingTop: "7px", margin: "5px"});
            $controlsSpan.append($minimizeControl);

            var $cellPanel = $('<div>')
                             .addClass('panel kb-func-panel kb-app-func-panel kb-cell-run')
                             .append($controlsSpan)
                             //.attr('id', this.options.cellId)
                             .append($('<div>')
                                     .addClass('panel-heading')
                                     .append($header))
                             .append($('<div>')
                                     .addClass('panel-body')
                                     .append($inputWidgetDiv));

            $stepPanel.append($cellPanel);
            $stepPanel.append($statusPanel);
            $stepPanel.append($outputPanel);

            var inputWidgetName = stepSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null') {
                inputWidgetName = this.defaultInputWidget;
            }
            var outputWidgetName = stepSpec.widgets.output;
            if (!outputWidgetName || outputWidgetName === 'null') {
                outputWidgetName = this.defaultOutputWidget;
            }

            var stepIdx = this.inputSteps.length;
            var self = this;
            $controlsSpan.click(function() {
                self.toggleStepMinimization(stepIdx);
            });


            // todo, update input widget so that we don't have to stringify
            var inputWidget = $inputWidgetDiv[inputWidgetName]({ method: JSON.stringify(stepSpec) });
            var inputStepData = {
              id:stepId ,methodId: stepSpec.info.id, 
              widget:inputWidget,
              $stepContainer:$stepPanel, 
              $statusPanel:$statusPanel, 
              $outputPanel:$outputPanel,
              utputWidgetName:outputWidgetName,
              minimized: false,
              $minimizeControl:$minimizeControl
            }
            this.inputSteps.push(inputStepData);
            this.inputStepLookup[stepId] = inputStepData;

            this.state.step[stepId] = { };

            return $stepPanel;
        },

        toggleStepMinimization: function(stepIdx) {
            var self = this;
            if(self.inputSteps[stepIdx].minimized) {
                self.maximizeStepView(stepIdx);
            } else {
                self.minimizeStepView(stepIdx);
            }
        },

        minimizeStepView: function(stepIdx, noAnimation) {
            var self = this;
            var $mintarget = self.inputSteps[stepIdx].$stepContainer;

            //self.$staticMethodInfo.hide();

            // create the dynamic summary based on the run state
            //self.updateDynamicMethodSummaryHeader()
            //self.$dynamicMethodSummary.show();
            if(noAnimation) {
                $mintarget.find(".panel-footer").hide();
                $mintarget.find(".panel-body").hide();
            } else {
                $mintarget.find(".panel-footer").slideUp();
                $mintarget.find(".panel-body").slideUp();
            }
            self.inputSteps[stepIdx].$minimizeControl.removeClass("glyphicon-chevron-down")
                              .addClass("glyphicon-chevron-right");
            self.inputSteps[stepIdx].minimized = true;
        },

        maximizeStepView: function(stepIdx) {
            var self = this;
            var $mintarget = self.inputSteps[stepIdx].$stepContainer;
            $mintarget.find(".panel-body").slideDown();
            $mintarget.find(".panel-footer").slideDown();
            self.inputSteps[stepIdx].$minimizeControl.removeClass("glyphicon-chevron-right")
                                .addClass("glyphicon-chevron-down");
            //self.$dynamicMethodSummary.hide();
            //self.$staticMethodInfo.show();
            self.inputSteps[stepIdx].minimized = false;
        },

        minimizeAllSteps: function() {
            for(var k=0; k<this.inputSteps.length; k++) {
                this.minimizeStepView(k);
            }
        },

        maximizeAllSteps: function() {
            for(var k=0; k<this.inputSteps.length; k++) {
                this.maximizeStepView(k);
            }
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
                                (function(localS, localM) {
                                    var step_target = self.inputStepLookup[steps[localS].step_id].widget;
                                    var step_source = self.inputStepLookup[input_mapping[localM].step_source].widget;
                                    var from = input_mapping[localM].from;
                                    var to = input_mapping[localM].to;
                                    // set the value to the original value
                                    step_target.setParameterValue(to, step_source.getParameterValue(from));
                                    // make sure the value changes every time the source input changes
                                    step_source.addInputListener(
                                        from,
                                        function() {
                                            step_target.setParameterValue(to, step_source.getParameterValue(from));
                                        }
                                    );
                                })(s,m);
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

        /**
         * Checks all parameters across all steps for validity. If any are invalid,
         * this returns them in {stepErrors: []} and the valid state in {isValid:boolean}
         * @method
         * @private
         */
        validateParameters : function() {
            var isValidRet = {isValid:true, stepErrors:[]}
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    var v = this.inputSteps[i].widget.isValid();
                    if (!v.isValid) {
                        isValidRet.isValid = false;
                        isValidRet.stepErrors.push({
                            stepId:this.inputSteps[i].step_id,
                            stepNum:(i+1),
                            errormssgs:v.errormssgs});
                    }
                }
            }
            return isValidRet;
        },

        /*
         * This function is invoked every time we run app. This is the difference between it
         * and getAllParameterValues/getParameterValue which could be invoked many times before running
         * (e.g. when widget is rendered).
         */
        prepareDataBeforeRun: function() {
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++)
                    var v = this.inputSteps[i].widget.prepareDataBeforeRun();
            }
        },

        /**
         * locks inputs and updates display properties to reflect the running state
         * returns true if everything is valid and we can start, false if there were errors
         */
        startAppRun: function(ignoreValidCheck) {
            var self = this;
            if (ignoreValidCheck) {
                //code
            } else {
                var v = self.validateParameters();
                // Take these action if the app input is not valid?
                if (!v.isValid) {
                    var errorCount = 1;
                    self.$errorModalContent.empty();
                    for(var k=0; k<v.stepErrors.length; k++) {
                        var $errorStep = $('<div>');
                        $errorStep.append($('<div>').addClass("kb-app-step-error-heading").append('Errors in Step '+v.stepErrors[k].stepNum+':'));
                        for (var e=0; e<v.stepErrors[k].errormssgs.length; e++) {
                            $errorStep.append($('<div>').addClass("kb-app-step-error-mssg").append('['+errorCount+']: ' + v.stepErrors[k].errormssgs[e]));
                            errorCount = errorCount+1;
                        }
                        self.$errorModalContent.append($errorStep);
                        KBError("App::" + this.appSpec.info.name, "errors=" + errorCount);
                    }
                    self.$errorModal.modal('show');
                    return false;
                }
            }
            self.prepareDataBeforeRun();
            self.$submitted.show();
            self.$runButton.hide();
            self.$stopButton.show();
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    this.inputSteps[i].widget.lockInputs();
                }
            }
            this.minimizeAllSteps();
            this.state.runningState.appRunState = "running";
            this.displayRunning(true);
            return true;
        },

        /* Show/hide running icon */
        displayRunning: function(is_running, had_error) {
            if (is_running) {
                this.cellMenu.$runningIcon.show();
                // never show error icon while running
                this.cellMenu.$errorIcon.hide();
            }
            else {
                this.cellMenu.$runningIcon.hide();
                // only display error when not running
                if (had_error) { this.cellMenu.$errorIcon.show(); }
                else { this.cellMenu.$errorIcon.hide(); }
            }
        },

        /*
         * Reset parameters and allow to re-run
         */
        resetAppRun: function(clear_inputs) {
            this.displayRunning(false);
            // buttons
            this.$stopButton.hide();
            this.$resetButton.hide();
            this.$submitted.hide();
            this.maximizeAllSteps();
            // clear inputs
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    this.inputSteps[i].widget.unlockInputs();
                    this.inputSteps[i].$stepContainer.removeClass('kb-app-step-running');
                    // If invoked from "Reset" button, then clear_inputs will be
                    // true and we need to get back to the original state.
                    // If invoked from "Cancel" button we skip this step and
                    // allow the user to Reset later.
                    if (clear_inputs) {
                        var c = this.inputSteps[i].$stepContainer;
                        // clear text fields
                        c.find("span.kb-parameter-data-selection").text("");
                        // remove old output
                        c.find(".kb-cell-output").remove();
                    }
                }
            }
            if (clear_inputs) {
                this.setErrorState(false);
                this.state.runningState.appRunState = "input";
                this.$runButton.show();
            }
            else {
                this.state.runningState.appRunState = "canceled"; // XXX?
                this.$runButton.show();
                this.$resetButton.hide();
            }
        },

        /* unlocks inputs and updates display properties to reflect the not running state */
        stopAppRun: function() {
            // trigger a cancel job action
            // if that returns something truthy (i.e. auto canceled, or user chose to cancel),
            // then continue and reset the state to input.
            // Otherwise, bail.
            var self = this;
            this.trigger('cancelJobCell.Narrative', [this.cellId, true, $.proxy(function(isCanceled) {
                if (isCanceled) {
                  self.resetAppRun(false);
                }
            }, this)]);
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
            // get the state of each step and return (all other properties of this.state should be set elsewhere)
            if (this.inputSteps) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    var id = this.inputSteps[i].id;
                    this.state.step[id].inputState = this.inputSteps[i].widget.getState();
                    // if there is an output widget, then we need to set its state too
                    if(this.inputSteps[i].outputWidget && this.inputSteps[i].outputWidget.getState) {
                        this.state.step[id].outputState.widgetState = this.inputSteps[i].outputWidget.getState();
                    }
                }
            }
            this.state.runningState.submittedText = this.$submitted.html();
            return this.state;
        },

        getRunningState: function() {
            return this.state.runningState.appRunState;
        },

        /**
         * @method
         * Passes along the state to its contained input widget.
         * @public
         */
        loadState: function(state) {
            console.log(state);
            if (!state) {
                return;
            }
            //console.log("setting app state:");
            //console.log(state);
            // set the step states
            if (this.inputSteps && state.step) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    var id = this.inputSteps[i].id;
                    if (state.step.hasOwnProperty(id)) {
                        // set the input states
                        if (state.step[id].inputState) {
                            this.inputSteps[i].widget.loadState(state.step[id].inputState);
                        }
                    }
                }
            }

            // if we were in the running state before, set the values
            if (state.runningState) {
                
                if (state.runningState.appRunState) {
                    if (state.runningState.submittedText) {
                        this.$submitted.html(state.runningState.submittedText);
                    }
                    if (state.runningState.appRunState === "running") {
                        if (state.runningState.runningStep) {
                            this.setRunningStep(state.runningState.runningStep);
                        }
                        this.startAppRun();
                    }
                    else if (state.runningState.appRunState === "done") {
                        this.$submitted.show();
                        this.$runButton.hide();
                    }
                    else if (state.runningState.appRunState === "complete") {
                        this.$submitted.show();
                        this.$runButton.hide();
                    }
                }
            }

            // set the output state (we do this last so that in case we run into an error, we still show that we are running)
            if (this.inputSteps && state.step) {
                for(var i=0; i<this.inputSteps.length; i++) {
                    var id = this.inputSteps[i].id;
                    if (state.step.hasOwnProperty(id)) {
                        // set the output states
                        if (state.step[id].outputState) {
                            if (state.step[id].outputState.output) {
                                this.setStepOutput(id, state.step[id].outputState.output, state.step[id].outputState.widgetState, true);
                            }
                        }
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
                        this.state.runningState.runningStep = stepId;
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

        setRunningState: function(state) {
            //console.debug('app state!'); console.debug(state);
            state = state.toLowerCase();
            if (state === 'error') {
                this.setErrorState(true);
                for (var i=0; i<this.inputSteps.length; i++) {
                    if (this.inputSteps[i].$stepContainer.hasClass('kb-app-step-running')) {
                        this.inputSteps[i].$stepContainer.removeClass('kb-app-step-running');
                        this.inputSteps[i].$stepContainer.addClass('kb-app-step-error');
                    }
                }
            }
            else if (state === 'complete') {
                for (var i=0; i<this.inputSteps.length; i++) {
                    this.inputSteps[i].$stepContainer.removeClass('kb-app-step-running');
                }
                this.state.runningState.runningStep = null;
                this.state.runningState.appRunState = state;
                this.$stopButton.hide();
                // Show the 'next-steps' to take, if there are any
                this.getNextSteps(
                  $.proxy(function(next_steps) {
                    if (next_steps.apps || next_steps.methods) {
                      this.trigger("showNextSteps.Narrative",
                        {elt: this.$elem, "next_steps": next_steps});
                    }
                  }, this)
                );
            }
        },


    /**
    * Get next steps, and invoke `render_cb` to render
    * the specs returned by the trigger:getFunctionSpecs.Narrative for
    * each of the possible apps/methods.
    */
    getNextSteps: function(render_cb) {
      var app = this.appSpec;
      //console.debug("Find next steps for app", app);
      // fetch full info, which contains suggested next steps
      var params = {ids: [app.info.id]};
      var result = {};
      this.methClient.get_app_full_info(params,
        $.proxy(function(info_list) {
          //console.debug("Got full info for app:", info_list);
          var sugg = info_list[0].suggestions;
          //console.debug("Suggestions for app:", sugg);
          var params = {apps: sugg.next_apps,methods: sugg.next_methods };
          //console.debug("Getting function specs, params=", params);
          // Pass callback to render each retrieved function spec
          this.trigger('getFunctionSpecs.Narrative', [params, function(specs) {
            render_cb(specs);
          }]);
        }, this),
        $.proxy(function() {
          KBError("kbaseNarrativeMethodCell.getNextSteps",
          "Could not get full info for app:" + app.info.id);
        }, this));
      },

        /*
         * Handle error in app.
         */
        setErrorState: function(isError) {
            if (isError) {
                this.state.runningState.appRunState = "error";
                this.displayRunning(false, true);
                this.$elem.find('.kb-app-panel').addClass('kb-app-error');
                this.$runButton.hide();
                this.$stopButton.hide();
                this.$resetButton.show();
                this.$submitted.show();
            }
            else {
                this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
            }
        },

        /* optional state parameter, if null then no state is set on the widget */
        /** ALSO TRIGGERS A SAVE! **/
        setStepOutput: function(stepId, output, state, preventSave) {
            if (this.inputStepLookup) {
                if(this.inputStepLookup[stepId]) {
                    if (this.inputStepLookup[stepId].outputWidget) {
                        //output is already set and cannot change, so we do not rerender
                        return;
                    }
                    // clear the output panel, and assume we are no longer running this step
                    this.inputStepLookup[stepId].$outputPanel.empty();
                    this.inputStepLookup[stepId].$stepContainer.removeClass("kb-app-step-running");

                    var widgetName = this.inputStepLookup[stepId].outputWidgetName;
                    var $outputWidget = $('<div>').css({'padding':'5px 0'});
                    $outputWidget.kbaseNarrativeOutputCell({
                        widget: widgetName,
                        data: output,
                        type: 'app',
                        title: this.methodSpecs[this.inputStepLookup[stepId].methodId].info.name,
                        showMenu: false,
                        time: new Date().getTime()
                    });
                    if (state) {
                        $outputWidget.loadState(state);
                    }
                    this.inputStepLookup[stepId].$outputPanel.append($outputWidget);
                    this.inputStepLookup[stepId].outputWidget = $outputWidget;
                    var objCopy = $.extend(true, {}, output);
                    this.state.step[stepId].outputState = {
                        output: objCopy
                    };

                    if (IPython && IPython.narrative && !preventSave)
                        IPython.narrative.saveNarrative();
                }
            }
        },

        /** ALSO TRIGGERS A SAVE! **/
        setStepError: function(stepId, error) {
            if (this.inputStepLookup) {
                if(this.inputStepLookup[stepId]) {
                    this.inputStepLookup[stepId].kbaseNarrativeOutputCell({
                        widget: this.OUTPUT_ERROR_WIDGET,
                        data: error,
                        type: 'error',
                        showMenu: false,
                        time: new Date().getTime()
                    });
                    if (IPython && IPython.narrative)
                        IPython.narrative.saveNarrative();
                }
            }
        },

        /** end methods for setting the app state based on the job status **/

        initErrorModal: function() {
            var self=this;
            var errorModalId = "app-error-modal-"+ self.genUUID();
            var modalLabel = "app-error-modal-lablel-"+ self.genUUID();
            self.$errorModalContent = $('<div>');
            self.$errorModal =  $('<div id="'+errorModalId+'" tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true">').addClass("modal fade");
            self.$errorModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">Problems exist in your parameter settings.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(self.$errorModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append(
                            $('<button type="button" data-dismiss="modal">').addClass("btn btn-default").append("Dismiss"))
                    )
                ));
            self.$elem.append(self.$errorModal);
        },

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
  });
})( jQuery );
