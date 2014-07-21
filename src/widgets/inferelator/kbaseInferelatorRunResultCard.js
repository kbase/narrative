(function($, undefined) {
    $.KBWidget({
        name: "KBaseInferelatorRunResultCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            id: null,
            ws: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "Inferelator Run Result Overview",
            isInCard: false,
            width: 600,
            height: 400
        },
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
                self.collection = data[0];

                self.workspaceClient.get_object_info([{ref: self.collection.data.params.tf_list_ws_ref},
                                {ref: self.collection.data.params.expression_series_ws_ref},
                                {ref: self.collection.data.params.cmonkey_run_result_ws_ref}],
                    0,
                    function(data) {
                            self.tflist_info = data[0];
                            self.expression_info = data[1];
                            self.cmonkey_info = data[2];

                            self.contentDiv.append($("<h4 />").append("Inferelator Run Info"));

                            self.contentDiv.append($("<div />").
                                    append($("<table/>").addClass("invtable")
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Object name"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.collection.data.id)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Organism"))
                                                    .append($("<td/>").addClass("invtable-emcell").append(self.collection.data.organism)))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Number of hits"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.collection.data.hits.length)))
                                            ));

                            self.contentDiv.append($("<h4 />").append("Input data"));

                            self.contentDiv.append($("<div />").
                                    append($("<table/>").addClass("invtable")
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("List of regulators"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.tflist_info[7] + "/" + self.tflist_info[1])))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Expression data"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.expression_info[7] + "/" + self.expression_info[1])))
                                            .append($("<tr/>")
                                                    .append($("<td/>").append("Bi-cluster network"))
                                                    .append($("<td/>").addClass("invtable-boldcell").append(self.cmonkey_info[7] + "/" + self.cmonkey_info[1])))
                                            ));

                        self.contentDiv.append($("<h4 />").append("View hits"));

                            self.$elem.append($("<button class='btn btn-default'>Show hit list</button>")
                                    .on("click",
                                            function(event) {
                                                self.trigger("showInferelatorHits", {inferelatorrunresult: self.collection, event: event});
                                            })
                                    );

                    },
                    function(data) {
                            self.contentDiv.remove();
                            self.loading(false);
                            self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
                            return;
                    }
                )

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
                type: "InferelatorRunResult",
                id: this.options.id,
                workspace: this.options.ws,
                auth: this.options.auth,
                userId: this.options.userId,
                title: "Inferelator Run Result Overview"
            };
        },
    });
})(jQuery);
