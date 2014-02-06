
(function($, undefined) {
    $.KBWidget({
        /* 
         * (required) Your widget should be named in CamelCase.
         */
        name: 'kbaseGapfillStatus',

        /*
         * Extending kbaseAuthenticatedWidget lets you use auth tokens
         * semi-automatically, assuming the page this is used in fires
         * the loggedIn.kbase, loggedOut.kbase, and loggedInQuery events.
         * These are usually fired by the kbaseLogin widget.
         *
         * this.user_id() = the logged in user id
         * this.authToken() = the current authentication token
         */
        parent: 'kbaseWidget',

        /*
         * (optional) Widgets should be semantically versioned.
         * See http://semver.org
         */
        version: '1.0.0',

        /*
         * (optional) Widgets are implied to include an options structure.
         * It's useful to put default values here.
         */
        options: {
        },

        wsUrl: "https://kbase.us/services/workspace",
        
        /**
         * (required) This is the only required function for a KBase Widget.
         * @param {object} options - a structure containing the set of 
         * options to be passed to this widget.
         * @private
         */
        init: function(options) {
            this._super(options);
            return this.render(options);
        },

        render: function(options) {
            //console.log("Error in kbaseGapfillStatus widget: "+ JSON.stringify(options, null, 4));
            var self = this;
            var pref = (new Date()).getTime();
            var container = this.$elem;
            var job_data = options.job_data
            var kbws = new workspaceService(this.wsUrl);
            if (job_data.id) {
                     var panel = $('<div class="loader-table"/>');
                     container.append(panel);
                     var table = $('<table class="table table-striped table-bordered" \
                                     style="margin-left: auto; margin-right: auto;" id="'+pref+'overview-table"/>');
                     panel.append(table);
                     table.append('<tr><td>Gapfill Job was created with id:</td><td>'+job_data.id+'</td></tr>');
                     table.append('<tr><td>Gapfilling will run on model named</td><td>'+job_data.jobdata.model+'</td></tr>');
                     
                     table.append('<tr><td>Based on your input parameters, the estimated runtime is:</td><td>'+options.estimated_time_str+'</td></tr>');
                     table.append('<tr><td>Current job state is</td><td id="'+pref+'job">'+job_data.status+'</td></tr>');
                     var timeLst = function(event) {
                            kbws.get_jobs({auth: job_data.auth, jobids: [job_data.id]}, function(data) {
                                    if (data.length == 0) {
                                        var tdElem = $('#'+pref+'job');
                                        tdElem.html("<span class=\"label label-danger\">Error retrieving job status!</span>");
                                        clearInterval(timer);
                                    } else {
                                        var status = data[0]['status'];
                                            if (status === 'done') {
                                                clearInterval(timer);
                                                var tdElem = self.$elem.find('#'+pref+'job');
                                                tdElem.html("<span class=\"label label-success\">Done! </span> &nbsp&nbsp View model details for gapfill solutions");
                                                 //ready();
                                            } else {
                                                var tdElem = self.$elem.find('#'+pref+'job');
                                                tdElem.html(status);
                                                if (status === 'error') {
                                                    clearInterval(timer);
                                                    console.error("Error in kbaseGapfillStatus widget: "+ JSON.stringify(data, null, 4));
                                            }
                                        }
                                    }
                            }, function(data) {
                                    var tdElem = self.$elem.find('#'+pref+'job');
                                    tdElem.html("<span class=\"label label-danger\">Error connecting to jobs server!</span>");
                                    console.error("Error in kbaseGapfillStatus widget: "+ JSON.stringify(data, null, 4));
                                    clearInterval(timer);
                            });
                    };
                    timeLst();
                    timer = setInterval(timeLst, 5000);
            } else {
                     //ready();
            }
            

            return this;
        },
    });
})(jQuery);