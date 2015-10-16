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
            table.append('<tr><td>Is active</td><td id="'+pref+'_active"></td></tr>');
            table.append('<tr><td>Approval</td><td id="'+pref+'_release_approval"></td></tr>');
            table.append('<tr><td>Review</td><td id="'+pref+'_review_message"></td></tr>');
            table.append('<tr><td>State</td><td id="'+pref+'_registration"></td></tr>');
            self.refreshState();
        },
        
        refreshState: function() {
            var self = this;
            var pref = this.pref;
            self.catalogClient.get_module_state({git_url: self.options.git_url},
                function(data) {
                    self.loading(false);
                    console.log(data);
                    var state = data.registration;
                    if (state === 'error') {
                        self.showMessage(data.error_message);
                    } else {
                        $('#'+pref+'_active').html('' + data.active);
                        $('#'+pref+'_release_approval').html(data.release_approval);
                        $('#'+pref+'_review_message').html(data.review_message ? data.review_message : "");
                        $('#'+pref+'_registration').html('' + data.registration);
                        if (state === 'building')
                            setTimeout(function(event) {
                                self.refreshState($active, $release_approval, $review_message, $registration);
                            }, 5000);
                    }
                },
                function(error) {
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
