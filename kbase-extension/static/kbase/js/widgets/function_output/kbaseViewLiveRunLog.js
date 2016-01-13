/**
 * @public
 */

define(['jquery', 
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'njs-wrapper-client-api'
        ], function($) {
    $.KBWidget({
        name: 'kbaseViewLiveRunLog',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            job_id: null,

            // Service URL: should be in window.kbconfig.urls.
            job_serviceURL: 'https://ci.kbase.us/services/njs_wrapper',
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },
        // Catalog client
        job_service: null,

        log: null,

        init: function(options) {
            this._super(options);
            this.job_id = options.job_id;
            if (window.kbconfig && window.kbconfig.urls)
                this.options.job_serviceURL = window.kbconfig.urls.job_service;
            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
            this.loading(true);

            this.log = [];
            return this;
        },

        loggedInCallback: function(event, auth) {
            // Build a client

            this.jobServiceClient = new NarrativeJobService(this.options.job_serviceURL, auth);

            if(!this.job_id) {
                this.loading(false);
                this.showMessage("No job_id provided or returned, so no build log can be shown.");
            } else {
                this.render();
            }
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.isLoggedIn = false;
            return this;
        },

        render: function() {
            var self = this;
            var container = this.$elem;

            //var $table = $('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;" />');

            //container.append($table);
            //var width = "15%"

            //$table.append('<tr><td width="'+width+'">Job ID</td><td>'+self.job_id+'</td></tr>');
            //self.$state_td = $('<td></td>')
            //$table.append(
            //    $('<tr>')
            //        .append($('<td width="'+width+'">State</td>'))
            //        .append(self.$state_td));

            self.$log_window = $('<textarea style="width:100%;font-family:Monaco,monospace;font-size:9pt;color:#555;resize:vertical;" rows="20" readonly>')
            container.append(self.$log_window);

            self.$track_checkbox= $('<input type="checkbox">').prop('checked', true);;
            self.$checkboxContainer = $('<div>').addClass('checkbox').css({width:"100%"})
                .append($('<label>')
                    .append(self.$track_checkbox)
                    .append('Auto scroll to new log output'));
            
            container.append(self.$checkboxContainer)

            self.getLogAndState(0);
        },
        

        getState: function() {
            return null;
        },

        loadState: function(state) {
        },

        getLogAndState: function(skip) {
            var self = this;
            
            self.jobServiceClient.check_job(self.job_id,
                    function(build_state) {

                        // display the state
                        self.updateBuildState(build_state);

                        self.jobServiceClient.get_job_logs({
                                            'job_id':self.job_id,
                                            'skip_lines':skip
                                        },
                                function(build_log) {

                                    // make sure our log array is big enough
                                    var log_length = skip+build_log.lines.length;
                                    self.last_log_line = log_length;

                                    for(var k=self.log.length; k<log_length; k++) {
                                        if(k>=skip) {
                                            self.log.push(build_log.lines[k-skip]);
                                            self.appendLineToLog(build_log.lines[k-skip].line);
                                        } else {
                                            // odd- we're getting a chunk before an earlier chunk
                                            self.log.push({'line':'','is_error':0})
                                            self.appendLineToLog('');
                                        }
                                    }

                                }, function(error) {
                                    console.error(error);
                                    self.hideMessage();
                                    self.showMessage('Warning- unable to fetch log.  This Job may be too old or does not yet support console log tracking.')
                                    self.$log_window.hide();
                                    self.$checkboxContainer.hide();
                                });

                    }, function(error) {
                        console.error(error);
                        self.hideMessage();
                        self.showMessage('Error in fetching console log for this Job.  The Job may not yet support console log tracking, or is too old, or has been deleted.')
                        self.$log_window.hide();
                        self.$checkboxContainer.hide();
                    });
        },


        appendLineToLog: function(line) {
            self = this;
            self.$log_window.val(self.$log_window.val()+line+'\n')

            if(self.$track_checkbox.prop('checked')) {
                self.$log_window.scrollTop(self.$log_window[0].scrollHeight); // scroll to bottom
            }
        },


        /* build state=
            typedef structure {
                string job_id;
                boolean finished;
                string ujs_url;
                UnspecifiedObject status;
                UnspecifiedObject result;
                JsonRpcError error;
            } JobState;
        */
        updateBuildState: function(build_state) {
            var self = this;
            self.loading(false);

            if(!build_state.finished) {
                setTimeout(function(event) {
                    self.getLogAndState(self.last_log_line);
                }, 1000);
            }

            /*if (state === 'error') {
                self.$registration_state_td.empty()
                    .append($('<span>').addClass('label label-danger').append(state))
                    .append('<br><br>')
                    .append(error)

                // now always show if something is in error field
                //$('#'+pref+'_error').val(data.error_message);
            } else if (state !== 'complete') {
                self.$registration_state_td.empty().append(state)
                setTimeout(function(event) {
                    self.getLogAndState(self.registration_id, self.last_log_line);
                }, 1000);
            } else {
                self.$registration_state_td.empty()
                    .append($('<span>').addClass('label label-success').append(state))
            }*/
        },

        loading: function(isLoading) {
            if (isLoading) {
                //this.showMessage("<img src='" + this.options.loadingImage + "'/>");
                this.showMessage('<i class="fa fa-spinner fa-spin"></i>');
            }
            else {
                this.hideMessage();                
            }
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);
            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        }     
    });
});
