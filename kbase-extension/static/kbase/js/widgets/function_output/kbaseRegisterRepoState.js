/**
 * Output widget to vizualize registered dynamic repo state.
 * Roman Sutormin <rsutormin@lbl.gov>
 * Michael Sneddon <mwsneddon@lbl.gov>
 * @public
 */

define(['jquery', 
		'kbwidget', 
		'kbaseAuthenticatedWidget', 
		'catalog-client-api'
		], function($) {
	$.KBWidget({
		name: 'kbaseRegisterRepoState',
		parent: 'kbaseAuthenticatedWidget',
		version: '1.0.0',
		options: {
		    git_url: null,
		    git_commit_hash: null,

            output: null, // this is generally the registration_id
            registration_id: null,

			// Service URL: should be in window.kbconfig.urls.
            catalogURL: 'https://ci.kbase.us/services/catalog',
			loadingImage: "static/kbase/images/ajax-loader.gif"
		},

		// Catalog client
		catalogClient: null,


        log: null,

        init: function(options) {
            this._super(options);
            this.registration_id = options.output;
            if(options.registration_id) {
                this.registration_id = options.registration_id;
            }
            if (window.kbconfig && window.kbconfig.urls)
                this.options.catalogURL = window.kbconfig.urls.catalog;
            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
            this.loading(true);


            this.log = [];
            return this;
        },

        loggedInCallback: function(event, auth) {
            // Build a client

            this.catalogClient = new Catalog(this.options.catalogURL, auth);

            if(!this.registration_id) {
                this.loading(false);
                this.showMessage("No registration_id provided or returned, so no build log can be shown.");
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

            var $table = $('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;" />');

            container.append($table);
            var width = "15%"

            $table.append('<tr><td width="'+width+'">Registration ID</td><td>'+self.registration_id+'</td></tr>');
            //table.append('<tr><td width="'+width+'">Is active</td><td id="'+pref+'_active"></td></tr>');
            //table.append('<tr><td width="'+width+'">Release Approval</td><td id="'+pref+'_release_approval"></td></tr>');
            //table.append('<tr><td width="'+width+'">Release Review</td><td id="'+pref+'_review_message"></td></tr>');
            self.$registration_state_td = $('<td></td>')
            $table.append(
                $('<tr>')
                    .append($('<td width="'+width+'">Progress</td>'))
                    .append(self.$registration_state_td));
            //table.append('<tr><td width="'+width+'">Error Mssg</td><td><textarea style="width:100%;" rows="2" readonly id="'+pref+'_error"/></td></tr>');

            self.$log_window = $('<textarea style="width:100%;font-family:Monaco,monospace;font-size:9pt;color:#555;resize:vertical;" rows="20" readonly>')
            container.append(self.$log_window);

            self.$track_checkbox= $('<input type="checkbox">').prop('checked', true);;
            var $checkboxContainer = $('<div>').addClass('checkbox').css({width:"100%"})
                .append($('<label>')
                    .append(self.$track_checkbox)
                    .append('Auto scroll to new log output'));
            
            //$checkboxContainer.append($('<label>').append(self.$track_checkbox));
            container.append($checkboxContainer)

            self.getLogAndState(self.registration_id,0);
        },
        

        getState: function() {
            return null;
        },

        loadState: function(state) {
        },

        getLogAndState: function(registration_id, skip) {
            var self = this;

            var chunk_size = 10000
            
            self.catalogClient.get_parsed_build_log({
                                            'registration_id':self.registration_id,
                                            'skip':skip,
                                            'limit':chunk_size
                                        },
                    function(build_info) {

                        // display the state
                        self.updateBuildState(build_info.registration, build_info.error_message);

                        // make sure our log array is big enough
                        var log_length = skip+build_info.log.length;
                        self.last_log_line = log_length;

                        for(var k=self.log.length; k<log_length; k++) {
                            if(k>=skip) {
                                self.log.push(build_info.log[k-skip]);
                                self.appendLineToLog(build_info.log[k-skip].content);
                            } else {
                                // odd- we're getting a chunk before an earlier chunk
                                self.log.push({'content':'','is_error':0})
                                self.appendLineToLog(''); // odd, we're 
                            }
                        }

                        // get the next chunk if there is more
                        if(build_info.log.length == chunk_size) {
                            setTimeout(self.getLogAndState(registration_id, skip+chunk_size), 50);
                            self.getLogAndState(registration_id, skip+chunk_size);
                        }

                    }, function(error) {
                        console.error(error);
                        //self.showData(data, error.error.error);
                    });
        },


        appendLineToLog: function(line) {
            self = this;
            self.$log_window.val(self.$log_window.val()+line)

            if(self.$track_checkbox.prop('checked')) {
                self.$log_window.scrollTop(self.$log_window[0].scrollHeight); // scroll to bottom
            }
        },

        updateBuildState: function(state, error) {
            var self = this;
            self.loading(false);
            self.$registration_state_td
            if (state === 'error') {
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
            }
        },

        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else
                this.hideMessage();                
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
