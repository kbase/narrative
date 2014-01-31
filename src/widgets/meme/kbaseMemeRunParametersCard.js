(function($, undefined) {
    $.KBWidget({
        name: "KBaseMemeRunParametersCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "MEME run parameters",
            isInCard: false,
            width: 780
        },
        newWorkspaceServiceUrl: "https://kbase.us/services/ws", //"http://140.221.84.209:7058/",

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.collection === null) {
                //throw an error
                return;
            }

            this.workspaceClient = new Workspace(this.newWorkspaceServiceUrl, {'token': this.options.auth, 'user_id': this.options.userId});

            self.collection = this.options.collection;

            this.workspaceClient.get_object_info([{ref: self.collection.data.params.source_ref}],
            0,
                    function(data) {
                        self.input_info = data[0];

                        self.$elem.append($("<div />")
                                .append($("<table/>").addClass("invtable")
                                        .append($("<tr/>")
                                                .append($("<td />").append("MEME Version"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.version)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Command line"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.command_line)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Source reference"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.input_info[7] + "/" + self.input_info[1])))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Source ID"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.params.source_id)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Mode of distribution"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.mod)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Number of motifs"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.nmotifs)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Minimal motif width"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.minw)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Maximal motif width"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.maxw)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Minimal number of sites"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.minsites)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Maximal number of sites"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.maxsites)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Strands"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.collection.data.strands)))
                                        ));
                    },
                    function(data) {
                        self.$elem.append('<p>[Error] ' + data.error.message + '</p>');
                        return;
                    });


            return this;
        },
        getData: function() {
            return {
                type: "MemeRunResult",
                id: this.options.meme_run_result_id,
                workspace: this.options.workspace_id,
                title: "MEME run parameters"
            };
        }

    });
})(jQuery);
