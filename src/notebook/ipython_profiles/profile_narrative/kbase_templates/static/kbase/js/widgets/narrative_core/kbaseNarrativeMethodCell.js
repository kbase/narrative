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
        name: "kbaseNarrativeMethodCell",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            method: null,
            cellId: null,
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
                    this.trigger('runCell.Narrative', {
                        cell: IPython.notebook.get_selected_cell(),
                        method: this.method,
                        parameters: this.getParameters()
                    });
                    this.changeState('submitted');
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
            var $methodInfo = $('<div>')
                              .addClass('kb-func-desc')
                              .append('<h1><b>' + this.method.info.name + '</b></h1>')
                              .append($menuSpan)
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

            // Controls (minimize)
            var $controlsSpan = $('<div>').addClass("pull-left");
            var $minimizeControl = $("<span class='glyphicon glyphicon-chevron-down'>")
                                    .css({color: "#888", fontSize: "14pt",
                                          paddingTop: "7px"});
            $controlsSpan.append($minimizeControl);

            this.$cellPanel = $('<div>')
                              .addClass('panel kb-func-panel kb-cell-run')
                              .append($controlsSpan)
                              .append($('<div>')
                                      .addClass('panel-heading')
                                      .append($methodInfo))
                              .append($('<div>')
                                      .addClass('panel-body')
                                      .append(this.$inputDiv))
                              .append($('<div>')
                                      .addClass('panel-footer')
                                      .css({'overflow' : 'hidden'})
                                      .append($buttons));

            $menuSpan.kbaseNarrativeCellMenu();
            this.$elem.append(this.$cellPanel);

            // Add minimize/restore actions.
            // These mess with the CSS on the cells!
            var $mintarget = this.$cellPanel;
            this.panel_minimized = false;
            var self = this;
            $controlsSpan.click(function() {
              if (self.panel_minimized) {
                console.debug("restore full panel");
                $mintarget.find(".panel-body").slideDown();
                $mintarget.find(".panel-footer").show();
                $minimizeControl.removeClass("glyphicon-chevron-right")
                                .addClass("glyphicon-chevron-down")
                                .css({paddingTop: "7px"});
                self.panel_minimized = false;
              }
              else {
                console.debug("minimize panel");
                $mintarget.find(".panel-footer").hide();
                $mintarget.find(".panel-body").slideUp();
                $minimizeControl.removeClass("glyphicon-chevron-down")
                                 .addClass("glyphicon-chevron-right")
                                 .css({paddingTop: "7px"});
               self.panel_minimized = true;
              }
            });

            var inputWidgetName = this.method.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = this.defaultInputWidget;

            this.$inputWidget = this.$inputDiv[inputWidgetName]({ method: this.options.method });
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
            if (state.hasOwnProperty('params') && state.hasOwnProperty('runningState')) {
                this.allowOutput = state.runningState.outputState;
                this.$inputWidget.loadState(state.params);
                this.submittedText = state.runningState.submittedText;
                this.changeState(state.runningState);
            }
            else
                this.$inputWidget.loadState(state);
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
                        break;
                    case 'complete':
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$submitted.html(this.submittedText).show();
                        this.$runButton.hide();
                        this.$stopButton.hide();
                        this.$inputWidget.lockInputs();
                        // maybe unlock? show a 'last run' box?
                        break;
                    case 'running':
                        this.$submitted.html(this.submittedText).show();
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$cellPanel.addClass('kb-app-step-running');
                        this.$runButton.hide();
                        this.$stopButton.show();
                        this.$inputWidget.lockInputs();
                        break;
                    case 'error':
                        this.$submitted.html(this.submittedText).show();
                        this.$cellPanel.addClass('kb-app-step-running');
                        this.$runButton.hide();
                        this.$stopButton.show();
                        this.$inputWidget.lockInputs();
                        this.$elem.find('.kb-app-panel').addClass('kb-app-error');
                        break;
                    default:
                        this.$cellPanel.removeClass('kb-app-step-running');
                        this.$elem.find('.kb-app-panel').removeClass('kb-app-error');
                        this.$submitted.hide();
                        this.$runButton.show();
                        this.$stopButton.hide();
                        this.$inputWidget.unlockInputs();
                        break;
                }
            }
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
                this.trigger('createOutputCell.Narrative', data);
                this.changeState('complete');
            }
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
})( jQuery );
