(function($, undefined) {
    $.KBWidget({
        name: "KBaseBambiRunResultCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            bambi_run_result_id: null,
            workspace_id: null,
            loadingImage: "assets/img/ajax-loader.gif",
            title: "BAMBI Run Result Overview",
            isInCard: false,
            width: 500
        },
        newWorkspaceServiceUrl: "https://kbase.us/services/ws", //"http://140.221.84.209:7058/",

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.bambi_run_result_id === null) {
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


            this.workspaceClient.get_objects([{workspace: this.options.workspace_id, name: this.options.bambi_run_result_id}],
            function(data) {
                self.collection = data[0];
                var d = new Date(parseInt(self.collection.data.timestamp));
                var creationMonth = d.getMonth() + 1;

                self.contentDiv.append($("<h4 />").append("MEME Run Info"));

                self.contentDiv.append($("<div />").
                        append($("<table/>").addClass("invtable")
                                .append($("<tr/>")
                                        .append($("<td/>").append("Object name"))
                                        .append($("<td/>").addClass("invtable-boldcell").append(self.collection.data.id)))
                                .append($("<tr/>")
                                        .append($("<td/>").append("Created"))
                                        .append($("<td/>").addClass("invtable-cell").append(creationMonth + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds())))
                                .append($("<tr/>")
                                        .append($("<td/>").append("Number of motifs"))
                                        .append($("<td/>").addClass("invtable-boldcell").append(self.collection.data.motifs.length)))
                                ));

                self.contentDiv.append($("<h4 />").append("View motifs"));

                var $dropdown = $("<select />");
                for (var motif in self.collection.data.motifs) {
                    $dropdown.append("<option id='" + motif + "'>" + self.collection.data.motifs[motif].description + "</option>");
                }
                self.contentDiv.append($dropdown);
                self.contentDiv.append($("<button class='btn btn-default'>Show Motif</button>")
                        .on("click",
                                function(event) {
                                    $($(self.elem).find('div').selector + " > select option:selected").each(function() {
                                                              	console.log(event);
                                        self.trigger("showBambiMotif", {motif: self.collection.data.motifs[$(this).attr("id")], event: event});
                                    });
                                })
                        );

                self.contentDiv.append($("<div />").append("<br><button class='btn btn-default'>Show BAMBI run parameters</button>")
                        .on("click",
                                function(event) {
                                    self.trigger("showBambiRunParameters", {collection: self.collection, event: event});
                                })
                        );

                self.contentDiv.append($("<div />").append("<br><button class='btn btn-default'>Show BAMBI raw output</button>")
                        .on("click",
                                function(event) {
                                    self.trigger("showBambiRawOutput", {raw_output: self.collection.data.raw_output, event: event});
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
                type: "BambiRunResult",
                id: this.options.bambi_run_result_id,
                workspace: this.options.workspace_id,
                auth: this.options.auth,
                userId: this.options.userId,
                title: "BAMBI Run Result Overview"
            };
        }

    });
})(jQuery);
