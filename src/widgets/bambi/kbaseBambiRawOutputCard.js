(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseBambiRawOutputCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "BAMBI raw output",
            isInCard: false,
            width: 800
        },

//        workspaceURL: "https://kbase.us/services/workspace",

        init: function(options) {
            this._super(options);
            
            if (this.options.raw_output  === null) {
                //throw an error
                return;
            }

            this.$messagePane = $("<div/>")
                                .addClass("kbwidget-message-pane")
                                .addClass("kbwidget-hide-message");
            this.$elem.append(this.$messagePane);

//            this.workspaceClient = new workspaceService(this.workspaceURL);
            return this.render();

        },

        render: function(options) {

            /**
             * Fields to show:
             * ID
             * Timestamp
             * Run parameters
             * Number of motifs
             */
            var self = this;
            self.raw_output= this.options.raw_output;

	        self.$elem.append($("<div />").append($("<pre />").append(this.options.raw_output)));

            return this;
        },

        getData: function() {
            return {
                type: "BambiRunResult",
                workspace: this.options.workspace_id,
                title: "BAMBI raw output"
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

        rpcError: function(error) {
            console.log("An error occurred: " + error);
        }
	
    });
})( jQuery );
