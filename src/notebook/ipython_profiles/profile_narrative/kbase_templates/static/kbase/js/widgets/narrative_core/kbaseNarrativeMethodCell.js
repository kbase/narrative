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
  require(['jquery', 'kbwidget'], function($) {
    $.KBWidget({
        name: "kbaseNarrativeMethodCell",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
            method: null,
            cellId: null,
            methodHelpLink: '/functional-site/#/narrativestore/method/'
        },
        IGNORE_VERSION: true,
        defaultInputWidget: 'kbaseNarrativeMethodInput',
        allowOutput: true,
        runState: 'input',

        /**
         * @private
         * @method
         * Initialization is done by the KBase widget architecture itself.
         * This requires and assumes that a method and cellId are both present
         * as options
         * TODO: add checks and failures for this.
         */
        init: function(options) {
            this._super(options);

            this.options.method = this.options.method.replace(/\n/g, '');
            this.method = JSON.parse(this.options.method);
            this.cellId = this.options.cellId;
            this.initErrorModal();
            this.methClient = new NarrativeMethodStore(window.kbconfig.urls.narrative_method_store);
            this.render();
            return this;
        },

        /**
         * Renders this cell and its contained input widget.
         */
        render: function() {
            this.$inputDiv = $('<div>');
            this.$submitted = $('<span>').addClass("kb-func-timestamp").hide();

            // These are the 'delete' and 'run' buttons for the cell
            this.$runButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Run')
                             .addClass('kb-method-run')
                             .append('Run');
            this.$runButton.click(
                $.proxy(function(event) {
                    event.preventDefault();

                    if (!this.checkMethodRun())
                        return;

                    this.submittedText = 'submitted on ' + this.readableTimestamp();
                    if(this.auth()) {
                        if(this.auth().user_id)
                            this.submittedText += ' by <a href="functional-site/#/people/'+this.auth().user_id
                                +'" target="_blank">' + this.auth().user_id + "</a>";
                    }
                    this.changeState('submitted');
                    this.minimizeView();
                    this.trigger('runCell.Narrative', {
                        cell: IPython.notebook.get_selected_cell(),
                        method: this.method,
                        parameters: this.getParameters(),
                        widget: this
                    });
                }, this)
            );

            this.$stopButton = $('<button>')
                              .attr('type', 'button')
                              .attr('value', 'Cancel')
                              .addClass('kb-app-run kb-app-cancel')
                              .append('Cancel')
                              .css({'margin-right':'5px'})
                              .click(
                                  $.proxy(function(event) {
                                      this.stopRunning();
                                  }, this)
                              )
                              .hide();

            var $buttons = $('<div>')
                           .addClass('buttons pull-left')
                           .append(this.$runButton)
                           .append(this.$stopButton)
                           .append(this.$submitted);

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

            var methodId = this.options.cellId + '-method-details-'+this.genUUID();
            var buttonLabel = 'details';
            var methodDesc = this.method.info.tooltip;
            var $menuSpan = $('<div class="pull-right">');

            this.$header = $('<div>').css({'margin-top':'4px'})
                              .addClass('kb-func-desc')
                              .append($menuSpan)
            this.$staticMethodInfo = $('<div>')
                              .append('<h1><b>' + this.method.info.name + '</b></h1>')
                              .append($('<h2>')
                                      .attr('id', methodId)
                                      .append(methodDesc +
                                            ' &nbsp&nbsp<a href="'+ this.options.methodHelpLink + this.method.info.id +
                                                '" target="_blank">more...</a>'
                                      ));

            this.$header.append(this.$staticMethodInfo);

            this.$dynamicMethodSummary = $('<div>');
            this.$header.append(this.$dynamicMethodSummary);

            // Controls (minimize)
            var $controlsSpan = $('<div>').addClass("pull-left");
            this.$minimizeControl = $("<span class='glyphicon glyphicon-chevron-down'>")
                                    .css({color: "#888", fontSize: "14pt",  cursor:'pointer',
                                          paddingTop: "7px", margin: "5px"});
            $controlsSpan.append(this.$minimizeControl);
            this.panel_minimized = false;

            this.$cellPanel = $('<div>')
                              .addClass('panel kb-func-panel kb-cell-run')
                              .append($controlsSpan)
                              .append($('<div>')
                                      .addClass('panel-heading')
                                      .append(this.$header))
                              .append($('<div>')
                                      .addClass('panel-body')
                                      .append(this.$inputDiv))
                              .append($('<div>')
                                      .addClass('panel-footer')
                                      .css({'overflow' : 'hidden'})
                                      .append($buttons));

            this.cellMenu = $menuSpan.kbaseNarrativeCellMenu({'kbWidget':this, 'kbWidgetType':'method'});
            this.$elem.append(this.$cellPanel);

            // Add minimize/restore actions.
            // These mess with the CSS on the cells!
            var self = this;
            $controlsSpan.click(function() {
                var $mintarget = self.$cellPanel;
                if (self.panel_minimized) {
                    self.maximizeView();
                }
                else {
                    self.minimizeView();
                }
            });

            var inputWidgetName = this.method.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = this.defaultInputWidget;

            require([inputWidgetName], 
              $.proxy(function() {
                this.$inputWidget = this.$inputDiv[inputWidgetName]({ method: this.options.method });
              }, this),
              $.proxy(function() {
                console.error('Error while trying to load widget "' + inputWidgetName + '"');
              }));
        },

        /**
         * @method
         * Invoke this method- basically the API way to click on the run button.
         * @public
         */
        runMethod: function() {
            if(this.$runButton) {
                this.$runButton.click();
            } else {
                console.error('Attempting to run a method, but the method is not yet initialized/rendered.')
            }
        },

        /**
         * @method
         * Returns parameters from the contained input widget
         * @public
         */
        getParameters: function() {
            if (this.$inputWidget)
                return this.$inputWidget.getParameters();
            return null;
        },

        /**
         * @method
         * Returns parameters from the contained input widget as a map designed for display
         * @public
         */
        getParameterMapForReplacementText: function() {

            if (this.$inputWidget) {
                var paramMap = {};
                var paramList = this.$inputWidget.getParameters();
                for(var k=0; k<this.method.parameters.length; k++) {
                    if(k<paramList.length) {
                        paramMap[this.method.parameters[k].id] = paramList[k];

                        // detect if it is a workspace object - if so we make things bold and linkable
                        if(typeof paramList[k] === 'string' &&
                            this.method.parameters[k].text_options) {
                          if(this.method.parameters[k].text_options.valid_ws_types) {
                            if(this.method.parameters[k].text_options.valid_ws_types.length>0) {
                              paramMap[this.method.parameters[k].id] = '<b><a>' + paramList[k] + '</a></b>';

                            }
                          }
                        }

                    }
                }
                return paramMap;
            }
            return null;
        },

        /**
         * @method
         * Returns the state as reported by the contained input widget.
         * @public
         */
        getState: function() {
            return {
                'runningState' : {
                    'runState' : this.runState,
                    'submittedText' : this.submittedText,
                    'outputState' : this.allowOutput
                },
                'minimized' : this.panel_minimized,
                'params' : this.$inputWidget.getState()
            };
        },

        /**
         * @method
         * Passes along the state to its contained input widget.
         * @public
         */
        loadState: function(state) {
            // cases (for older ones)
            // 1. state looks like:
            // { params: {},
            //   runningState: {runState,
            //                  submittedText,
            //                  outputState}
            // }
            // That's new!
            // old one just has the state that should be passed to the input widget.
            // that'll be deprecated soonish.
            console.debug('loading state!');
            console.debug(state);
            if (state.hasOwnProperty('params') 
              && state.hasOwnProperty('runningState')) {
                this.allowOutput = state.runningState.outputState;
                this.$inputWidget.loadState(state.params);
                this.submittedText = state.runningState.submittedText;
                this.changeState(state.runningState.runState);
                if(state.minimized) {
                    this.minimizeView(true); // true so that we don't show slide animation
                }
            }
            else
                this.$inputWidget.loadState(state);
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

        /**
         * @method
         * This sends a trigger to the jobs panel to stop any running jobs. If the callback is
         * truthy, this resets the cell to an input state.
         */
        stopRunning: function() {
            this.trigger('cancelJobCell.Narrative', [this.cellId, true, $.proxy(function(isCanceled) {
                if (isCanceled) {
                    this.changeState('input');
                }
            }, this)]);
        },
        /**
         * @method
         * Shows an associated error with a cell (if available)
         */
        showError: function() {
            this.trigger('showJobError.Narrative', [this.cellId, true, $.proxy(function(isCanceled) {
                if (isCanceled) {
                    this.changeState('input');
                }
            }, this)]);
        },



        /**
         * @method
         * Updates the method cell's state.
         * Currently supports "input", "submitted", "running", or "complete".
         */
        changeState: function(runState) {
            if (!this.$cellPanel)
                return;
            if (this.runState !== runState) {
                this.runState = runState.toLowerCase();
                switch(this.runState) {
                    case 'submitted':
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$submitted.html(this.submittedText).show();
                        this.$runButton.hide();
                        this.$stopButton.hide();
                        this.$inputWidget.lockInputs();
                        this.displayRunning(true);
                        break;
                    case 'complete':
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$submitted.html(this.submittedText).show();
                        this.$runButton.hide();
                        this.$stopButton.hide();
                        this.$inputWidget.lockInputs();
                        this.displayRunning(false);
                        // maybe unlock? show a 'last run' box?
                        break;
                    case 'running':
                        this.$submitted.html(this.submittedText).show();
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$cellPanel.addClass('kb-app-step-running');
                        this.$runButton.hide();
                        this.$stopButton.show();
                        this.$inputWidget.lockInputs();
                        this.displayRunning(true);
                        break;
                    case 'error':
                        this.$submitted.html(this.submittedText).show();
                        this.$cellPanel.addClass('kb-app-step-error');
                        this.$runButton.hide();
                        this.$stopButton.show();
                        this.$inputWidget.lockInputs();
                        this.$elem.find('.kb-app-panel').addClass('kb-app-error');
                        this.displayRunning(false, true);
                        break;
                    default:
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$submitted.hide();
                        this.$runButton.show();
                        this.$stopButton.hide();
                        this.$inputWidget.unlockInputs();
                        this.displayRunning(false);
                        break;
                }
            }
        },

        isAwaitingInput: function() {
            if(this.runState) {
                if(this.runState==='input') { return true; }
                return false;
            }
            return true;
        },


        getRunningState: function() {
            return this.runState;
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

        /* locks inputs and updates display properties to reflect the running state
            returns true if everything is valid and we can start, false if there were errors
        */
        checkMethodRun: function() {
            var v = this.$inputWidget.isValid();
            if (!v.isValid) {
                this.$errorModalContent.empty();
                for (var i=0; i<v.errormssgs.length; i++) {
                    this.$errorModalContent.append($('<div>')
                                                   .addClass("kb-app-step-error-mssg")
                                                   .append('['+(i+1)+']: ' + v.errormssgs[i]));
                }
                this.$errorModal.modal('show');
                return false;
            }

            return true;
        },

        initErrorModal: function() {
            // var errorModalId = "app-error-modal-"+ this.genUUID();
            // var modalLabel = "app-error-modal-lablel-"+ this.genUUID();
            this.$errorModalContent = $('<div>');
            this.$errorModal =  $('<div tabindex="-1" role="dialog" aria-hidden="true">').addClass("modal fade");
            this.$errorModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" >Problems exist in your parameter settings.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(this.$errorModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append(
                            $('<button type="button" data-dismiss="modal">').addClass("btn btn-default").append("Dismiss"))
                    )
                ));
            this.$elem.append(this.$errorModal);
        },

        /**
         * Refreshes the input widget according to its own method.
         */
        refresh: function() {
            if (this.$inputWidget)
                this.$inputWidget.refresh();
        },

        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        },

        /* temp hack to deal with current state of NJS */
        getSpecAndParameterInfo: function() {
            return {
                methodSpec : this.method,
                parameterValues: this.getParameters()
            };
        },

        setOutput: function(data) {
            if (data.cellId && this.allowOutput) {
                this.allowOutput = false;
                // Show the 'next-steps' to take, if there are any
                var self = this;
                this.getNextSteps( function(next_steps) {
                    data.next_steps = next_steps;
                    self.trigger('createOutputCell.Narrative', data);
                    self.changeState('complete');
                });
            }
        },


        updateDynamicMethodSummaryHeader: function() {
            var self = this;
            self.$dynamicMethodSummary.empty();

            // First set the main text
            if(self.method.replacement_text && 
              self.submittedText && !self.isAwaitingInput()) {
                // If replacement text exists, and the method was submitted, use it
                var template = Handlebars.compile(self.method.replacement_text);
                self.$dynamicMethodSummary.append($('<h1>').html(template(self.getParameterMapForReplacementText())));
                self.$dynamicMethodSummary.append($('<h2>').append(self.submittedText));
            } else {
                self.$dynamicMethodSummary.append($('<h1>').append(self.method.info.name));
                if(self.submittedText && !self.isAwaitingInput()) {
                    self.$dynamicMethodSummary.append($('<h2>').append(self.submittedText));
                } else {
                    self.$dynamicMethodSummary.append($('<h2>').append('Not yet submitted.'));
                }
            }
        },


        minimizeView: function(noAnimation) {
            var self = this;
            var $mintarget = self.$cellPanel;

            self.$staticMethodInfo.hide();

            // create the dynamic summary based on the run state
            self.updateDynamicMethodSummaryHeader()
            self.$dynamicMethodSummary.show();
            if(noAnimation) {
                $mintarget.find(".panel-footer").hide();
                $mintarget.find(".panel-body").hide();
            } else {
                $mintarget.find(".panel-footer").slideUp();
                $mintarget.find(".panel-body").slideUp();
            }
            self.$minimizeControl.removeClass("glyphicon-chevron-down")
                              .addClass("glyphicon-chevron-right");
            self.panel_minimized = true;
        },

        maximizeView: function() {
            var self = this;
            var $mintarget = self.$cellPanel;
            $mintarget.find(".panel-body").slideDown();
            $mintarget.find(".panel-footer").slideDown();
            self.$minimizeControl.removeClass("glyphicon-chevron-right")
                                .addClass("glyphicon-chevron-down");

            self.$dynamicMethodSummary.hide();
            self.$staticMethodInfo.show();
            self.panel_minimized = false;
        },


        /**
         * Get next steps, and invoke render_cb() with
         * the specs returned by the trigger:getFunctionSpecs.Narrative for
         * each of the possible apps/methods.
         */
        getNextSteps: function(render_cb) {
          //console.debug("Find next steps for method",this.method);
          // fetch full info, which contains suggested next steps
          var params = {ids: [this.method.info.id]};
          var result = {};
          this.methClient.get_method_full_info(params,
            $.proxy(function(info_list) {
              //console.debug("Full info for method: ", info_list);
              var sugg = info_list[0].suggestions;
              //console.debug("Suggestions for next methods: ", sugg);
              var params = {apps: sugg.next_apps, methods: sugg.next_methods};
              //console.debug("Getting function specs, params=", params);
              this.trigger('getFunctionSpecs.Narrative', [params,
                function(specs) { render_cb(specs); }]);
            }, this),
            function() {
              KBError("kbaseNarrativeMethodCell.getNextSteps",
                       "Could not get full info for method: " + self.method.info.id);
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

            var d = null;
            if (timestamp)
                d = new Date(timestamp);
            else
                d = new Date();
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
