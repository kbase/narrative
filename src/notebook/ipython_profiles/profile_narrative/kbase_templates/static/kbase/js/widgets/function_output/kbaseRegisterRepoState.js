/**
 * Output widget to vizualize registered dynamic repo state.
 * Roman Sutormin <rsutormin@lbl.gov>
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
		    output: null,

			// Service URL: should be in window.kbconfig.urls.
            catalogURL: 'https://ci.kbase.us/services/catalog',
			loadingImage: "static/kbase/images/ajax-loader.gif"
		},
		// Prefix for all element ids
		pref: null,
		// Catalog client
		catalogClient: null,

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();
            if (window.kbconfig && window.kbconfig.urls)
                this.options.catalogURL = window.kbconfig.urls.catalog;
            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);
            this.loading(true);
            return this;
        },

        loggedInCallback: function(event, auth) {
            // error if not properly initialized
            if (this.options.git_url == null) {
                this.showMessage("[Error] Couldn't retrieve repository state.");
                return this;
            }
            // Build a client
            this.catalogClient = new Catalog(this.options.catalogURL, auth);           
            // Let's go...
            this.render();           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.isLoggedIn = false;
            return this;
        },

        render: function() {
            var self = this;
            var pref = this.pref;
            var container = this.$elem;
            var table = $('<table class="table table-striped table-bordered" \
                    style="margin-left: auto; margin-right: auto;" id="'+pref+'info-table"/>');
            container.append(table);
            var width = "15%"
            table.append('<tr><td width="'+width+'">Timestamp</td><td id="'+pref+'_timestamp"></td></tr>');
            table.append('<tr><td width="'+width+'">Is active</td><td id="'+pref+'_active"></td></tr>');
            table.append('<tr><td width="'+width+'">Release Approval</td><td id="'+pref+'_release_approval"></td></tr>');
            table.append('<tr><td width="'+width+'">Release Review</td><td id="'+pref+'_review_message"></td></tr>');
            table.append('<tr><td width="'+width+'">State</td><td id="'+pref+'_registration"></td></tr>');
            table.append('<tr><td width="'+width+'">Error</td><td><textarea style="width:100%;" rows="2" readonly id="'+pref+'_error"/></td></tr>');
            table.append('<tr><td width="'+width+'">Build-log</td><td><textarea style="width:100%;" rows="5" readonly id="'+pref+'_build_log"/></td></tr>');
            self.refreshState();
        },
        

        getState: function() {
            var self = this;
            if(self.state) return self.state
            return null;
        },

        loadState: function(state) {
            var self = this;
            if(state) {
                self.state = state;
                self.catalogClient.get_build_log(self.options.output, function(data2) {
                    //console.log(data2);
                    self.showData(state, data2);
                }, function(error) {
                    //console.log(error);
                    self.showData(data, error.error.error);
                });
            }
        },

        showData : function(data, build_log) {
            var self = this;
            self.loading(false);
            var pref = this.pref;
            var state = data.registration;
            $('#'+pref+'_timestamp').html('' + self.options.output);
            $('#'+pref+'_active').html(data.active ? ''+data.active : '[unknown]');
            $('#'+pref+'_release_approval').html(data.release_approval ? data.release_approval : '[unknown]');
            $('#'+pref+'_review_message').html(data.review_message ? data.review_message : '');
            $('#'+pref+'_registration').html(state ? state : '[unknown]');
            $('#'+pref+'_error').val(data.error_message ? data.error_message : '');
            $('#'+pref+'_build_log').val('' + build_log);
            $('#'+pref+'_build_log').scrollTop($('#'+pref+'_build_log')[0].scrollHeight); // scroll to bottom
            if (state === 'error') {
                self.state = data
                $('#'+pref+'_registration').empty()
                    .append($('<span>').addClass('label label-danger').append(state))
                // now always show if something is in error field
                //$('#'+pref+'_error').val(data.error_message);
            } else if (state !== 'complete') {
                setTimeout(function(event) {
                    self.refreshState();
                }, 1000);
            } else {
                $('#'+pref+'_registration').empty()
                    .append($('<span>').addClass('label label-success').append(state))
                self.state = data
            }
        },


        refreshState: function() {
            var self = this;
            self.catalogClient.get_module_state({git_url: self.options.git_url},
                function(data) {
                    // If state was already defined, then it might have been set by the narrative, and
                    // we just reload it.
                    if(self.state) {
                        self.loadState(self.state)
                        return
                    }
                    //console.log(data);
                    self.catalogClient.get_build_log(self.options.output, function(data2) {
                        //console.log(data2);
                        self.showData(data, data2);
                    }, function(error) {
                        //console.log(error);
                        self.showData(data, error.error.error);
                    });
                },
                function(error) {
                    console.log(error);
                    self.clientError(error);
                }
            );
        },

        getData: function() {
            return {
                type: 'RegisterRepoState',
                id: this.options.expressionMatrixID,
                workspace: this.options.workspaceID,
                title: 'Repository State'
            };
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
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
        }        
    });
});
