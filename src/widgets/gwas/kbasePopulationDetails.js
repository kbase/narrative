(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBasePopulationDetails", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            genomeID: null,
            workspaceID: null,
            loadingImage: "../../widgets/images/ajax-loader.gif",
            isInCard: false,
        },

        cdmiURL: "https://kbase.us/services/cdmi_api",
        workspaceURL: "https://kbase.us/services/workspace",

        init: function(options) {
            this._super(options);
            if (this.options.genomeID === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

            this.cdmiClient = new CDMI_API(this.cdmiURL);
            this.entityClient = new CDMI_EntityAPI(this.cdmiURL);
            this.workspaceClient = new workspaceService(this.workspaceURL);

            return this.render();
        },

        render: function(options) {
            this.showMessage("<img src='" + this.options.loadingImage + "'/>");

            var self = this;

            var $infoTable = $("<div />")  // should probably be styled somehow. Bootstrapish?
            .append($("<table/>")
               .addClass("table table-bordered table-striped")
               .append($("<tr/>")
                   .append("<td>ID</td><td>Hellow world!</td>")
                   )
               );
            self.$elem.append($infoTable);           

            this.hideMessage();
            return this;
        },

        getData: function() {
            return {
                type: "Genome",
                id: this.options.ID,
                workspace: this.options.workspaceID,
                title: "GWAS Population"
            };
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.removeClass("kbwidget-hide-message");
        },

        hideMessage: function() {
            this.$messagePane.addClass("kbwidget-hide-message");
            this.$messagePane.empty();
        },

        clientError: function(error) {
        }

    });
})( jQuery );