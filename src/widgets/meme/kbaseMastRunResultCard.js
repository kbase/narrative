(function($, undefined) {
    $.KBWidget({
        name: "KBaseMastRunResultCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            id: null,
            ws: null,
            auth: null,
            userId: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "MAST Run Result Overview",
            isInCard: false,
            width: 400
        },
//        workspaceURL: "https://kbase.us/services/workspace",
        newWorkspaceServiceUrl: "https://kbase.us/services/ws", //"http://140.221.84.209:7058/",

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.id === null) {
                //throw an error
                return;
            }

            this.workspaceClient = new Workspace(this.newWorkspaceServiceUrl, {'token': this.options.auth, 'user_id': this.options.userId});

            var container = $('<div id="container" />');
            this.$elem.append(container);

            this.tableLoading = $('<div id="table-loading" style="text-align: center; margin-top: 60px;"><img src="assets/img/ajax-loader.gif" /><p class="text-muted">Loading...<p></div>');
            container.append(this.tableLoading);

            this.contentDiv = $('<div id="table-container" />');
            this.contentDiv.addClass('hide');
            container.append(this.contentDiv);


            this.workspaceClient.get_objects([{workspace: this.options.ws, name: this.options.id}],
            function(data) {
                self.mastresult = data[0];
                var d = new Date(parseInt(self.mastresult.data.timestamp));
                var creationMonth = d.getMonth() + 1;

                self.contentDiv.append($("<h4 />").append("MAST Run Info"));

                self.contentDiv.append($("<div />").
                        append($("<table/>").addClass("invtable")
                                .append($("<tr/>")
                                        .append($("<td/>").append("Object name"))
                                        .append($("<td/>").addClass("invtable-boldcell").append(self.mastresult.data.id)))
                                .append($("<tr/>")
                                        .append($("<td/>").append("Created"))
                                        .append($("<td/>").addClass("invtable-cell").append(creationMonth + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds())))
                                .append($("<tr/>")
                                        .append($("<td/>").append("Threshold"))
                                        .append($("<td/>").addClass("invtable-boldcell").append(self.mastresult.data.mt)))
                                .append($("<tr/>")
                                        .append($("<td/>").append("Number of hits"))
                                        .append($("<td/>").addClass("invtable-boldcell").append(self.mastresult.data.hits.length)))
                                ));

                self.contentDiv.append($("<button class='btn btn-default'>Show MAST run parameters</button>")
                        .on("click",
                                function(event) {
                                    self.trigger("showMastRunParameters", {mastresult: self.mastresult, event: event});

                                })
                        );

                self.contentDiv.append($("<h4 />").append("View hits"));
                self.contentDiv.append($("<button class='btn btn-default'>Show hit list</button>")
                        .on("click",
                                function(event) {
                                    self.trigger("showMastHits", {mastresult: self.mastresult, event: event});

                                })
                        );


                self.loading(false);

            },
                    function(data) {
                        self.contentDiv.remove();
                        self.loading(false);
                        self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
                        return;
                    }
            );
            return this;
        },
        loading: function(flag) {
            if (flag) {
                this.tableLoading.removeClass('hide');
                this.contentDiv.addClass('hide');
            } else {
                this.contentDiv.removeClass('hide');
                this.tableLoading.addClass('hide');
            }
        },
        getData: function() {
            return {
                type: "MastRunResult",
                id: this.options.id,
                workspace: this.options.ws,
                auth: this.options.auth,
                userId: this.options.userId,
                title: "MAST Run Result Overview"
            };
        }

    });
})(jQuery);
