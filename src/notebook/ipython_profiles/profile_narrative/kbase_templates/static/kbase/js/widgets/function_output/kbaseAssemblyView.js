/**
 * Output widget for visualization of assembly reports
 * @author Chris Bun <chrisbun@gmail.com>
 * @public
 */

 define(['jquery', 'kbwidget', 'kbaseAuthenticatedWidget'], function($) {
    $.KBWidget({
        name: "kbaseAssemblyView",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        ws_id: null,
        ws_name: null,
        token: null,
        job_id: null,
        width: 1150,
        options: {
            ws_id: null,
            ws_name: null,
            job_id: null
        },
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: window.kbconfig.urls.workspace,
        timer: null,

        init: function(options) {
            this._super(options);

            this.ws_name = options.ws_name;
            this.ws_id = options.ws_id;
            if (options.job_id)
                this.job_id = options.job_id;
            if (options.ws && options.id) {
                this.ws_id = options.id;
                this.ws_name = options.ws;
            }
            return this;
        },

        render: function() {
            var self = this;
            var pref = this.uuid();

            var container = this.$elem;
            if (self.token == null) {
                container.empty();
                container.append("<div>[Error] You're not logged in</div>");
                return;
            }

            var kbws = new Workspace(self.wsUrl, {'token': self.token});

            var ready = function() {
                container.empty();
                container.append("<div><img src=\""+self.loadingImage+"\">&nbsp;&nbsp;loading genome data...</div>");
                var objname;
                objname = self.ws_id
                console.log("wsid")
                console.log(self.ws_id)
                if (typeof self.ws_id == "string") {
                    if (self.ws_id.indexOf(".report") == -1) { //Check if contigset or report
                        objname = self.ws_id + ".report"
                    } 
                }

                kbws.get_objects([{ref: self.ws_name +"/"+ objname}], function(data) {
                    container.empty();
                    var report_div = '<div class="" style="margin-top:15px">'
                    var report = data[0].data.report
                    report_div += '<code style="">' + report +'</code><br>'
                    container.append(report_div);

                }, function(data) {
                    container.empty();
                    container.append('<p>[Error] ' + data.error.message + '</p>');
                });             
            };
            ready();
            return this;
        },

        getData: function() {
            return {
                type: "NarrativeTempCard",
                id: this.ws_name + "." + this.ws_id,
                workspace: this.ws_name,
                title: "Temp Widget"
            };
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
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
});