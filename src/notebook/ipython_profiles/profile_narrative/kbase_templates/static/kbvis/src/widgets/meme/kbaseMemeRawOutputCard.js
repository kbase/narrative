(function( $, undefined ) { 
    $.KBWidget({ 
        name: "KBaseMemeRawOutputCard", 
        parent: "kbaseWidget", 
        version: "1.0.0",

        options: {
            title: "MEME raw output",
            isInCard: false,
            width: 800,
            height: 600
        },

//        workspaceURL: "https://kbase.us/services/workspace",

        init: function(options) {
            this._super(options);
            
            if (this.options.memeOutput === null) {
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
            self.memeOutput = this.options.memeOutput;

	        self.$elem.append($("<div />").append($("<pre />").append(this.options.memeOutput)));

            return this;
        },

        getData: function() {
            return {
                type: "MemeRunResult",
//                id: this.options.meme_run_result_id,
                workspace: this.options.workspace_id,
                title: "MEME raw output"
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
