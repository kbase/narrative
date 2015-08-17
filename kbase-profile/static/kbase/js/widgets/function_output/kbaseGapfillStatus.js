
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
        parent: "kbaseAuthenticatedWidget",

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

        wsUrl: window.kbconfig.urls.workspace,
        loadingImage: window.kbconfig.loading_gif,
        
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
            var self = this;
            var pref = this.uuid();
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
                            kbws.get_jobs({auth: self.authToken(), jobids: [job_data.id]}, function(data) {
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
                                                
                                                if (status === 'running') {
                                                    tdElem.html(status+"... &nbsp &nbsp <img src=\""+self.loadingImage+"\">");
                                                }
                                                if (status === 'error') {
                                                    console.error("Error in kbaseGapfillStatus widget: "+ JSON.stringify(data, null, 4));
                                                    clearInterval(timer);
                                                    tdElem.html("<span class=\"label label-danger\">Error</span>");
                                                    var mssg = data[0].jobdata.error;
                                                    var errorRegex = /_ERROR_[^]+_ERROR_/gm
                                                    var errormssg = mssg.match(errorRegex);
                                                    errormssg = errormssg.join("\n\n").replace(/_ERROR_/gm,'')
                                                    self.$elem.kbaseNarrativeError({'error': {
                                                                                        'msg' :  errormssg +"\n\n"+mssg,
                                                                                        'method_name' : 'Gapfill an FBA Model',
                                                                                        'type' : 'Error',
                                                                                        'severity' : 'Low'
                                                                                        }});
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

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }
    });
})(jQuery);