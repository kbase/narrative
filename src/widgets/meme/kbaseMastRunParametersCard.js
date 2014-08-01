(function($, undefined) {
    $.KBWidget({
        name: "KBaseMastRunParametersCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            title: "MAST run parameters",
            isInCard: false,
            width: 400
        },
        init: function(options) {
            this._super(options);
            var self = this;

            if (this.options.collection === null) {
                //throw an error
                return;
            }

            this.workspaceClient = new Workspace(this.newWorkspaceServiceUrl, {'token': this.options.auth, 'user_id': this.options.userId});

            self.mastresult = this.options.mastresult;


            this.workspaceClient.get_object_info([{ref: self.mastresult.data.params.query_ref},
                {ref: self.mastresult.data.params.target_ref}],
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
                                                .append($("<td />").append("PSPM ID"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.mastresult.data.params.pspm_id)))
                                        .append($("<tr/>")
                                                .append($("<td />").append("Threshold"))
                                                .append($("<td />").addClass("invtable-boldcell").append(self.mastresult.data.params.mt.toString())))
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
                type: "MastRunResult",
                id: this.options.mastresult.data.id,
                workspace: this.options.ws,
                title: "MAST run parameters"
            };
        }

    });
})(jQuery);
