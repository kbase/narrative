(function($, undefined) {
    $.KBWidget({
        name: "KBaseTomtomRunParametersCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "TOMTOM run parameters",
            isInCard: false,
            width: 400
        },
        newWorkspaceServiceUrl: "https://kbase.us/services/ws", //"http://140.221.84.209:7058/",

        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.tomtomresult === null) {
                //throw an error
                return;
            }

            this.workspaceClient = new Workspace(this.newWorkspaceServiceUrl, {'token': this.options.auth, 'user_id': this.options.userId});

            self.tomtomresult = this.options.tomtomresult;

            this.workspaceClient.get_object_info([{ref: self.tomtomresult.data.params.query_ref},
                {ref: self.tomtomresult.data.params.target_ref}],
            0,
                    function(data) {
                        self.query_info = data[0];
                        self.target_info = data[1];

                        self.$elem.append($("<div />")
                                .append($("<table/>").addClass("invtable")
                                        .append($("<tr/>")
                                                .append($("<td />").append("Query reference"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.query_info[7] + "/" + self.query_info[1])))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Target reference"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.target_info[7] + "/" + self.target_info[1])))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Threshold"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.tomtomresult.data.params.thresh.toString())))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Distance scoring"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.tomtomresult.data.params.dist)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Use evalue"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.tomtomresult.data.params.evalue.toString())))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Use internal"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.tomtomresult.data.params.internal.toString())))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Minimal overlap"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.tomtomresult.data.params.min_overlap.toString())))
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
                type: "TomtomRunResult",
                id: this.options.tomtomresult.data.id,
                workspace: this.options.workspace_id,
                title: "TOMTOM run parameters"
            };
        },
    });
})(jQuery);
