/**
   Create a card with a cytoscape.js viewer for a network
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "KBaseNetworkCard",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
	    width: 500,
	    height: 500,
            network: "",
	    netname: "",
        },

        init: function(options) {
            var self = this;
            this._super(options);

	    var csOuter = $('<div id="csOuter" style="width:100%;height:100%;" />');
            this.$elem.append(csOuter);
            var csDiv = $('<div id="cytoscape" style="width:100%;height:100%;"><i>Initializing...</i></div>');
	    csOuter.append(csDiv);

	    console.log("network is "+this.options.network);

	    var network = JSON.parse(this.options.network);

	    $('#cytoscape').html('');
	    $('#cytoscape').cytoscape({
		showOverlay: false,
		layout: { "name": "arbor",
			  "maxSimulationTime": 10000,
			  "fit": true,
			  "liveUpdate": false },
		elements: network,
                style: cytoscape.stylesheet().
                    selector("node").css({
                        "content": "data(label)",
			"height": "data(width)",
			"width": "data(width)",
                        "border-color": "black",
			"border-width": 1,
                        "text-halign": "center",
                        "text-valign": "center",
                        "color" : "black",
                        "background-color" : "data(color)",
                    }).
                    selector("edge").css({
                        "line-color": "data(color)",
                        "width": "data(width)",
                    }),
	    });

            $("#cytoscape").cytoscapePanzoom();
	    this.cy = $("#cytoscape").cytoscape("get");
	    // self.cy.fit();

            $(window).on("resize", function() {
		self.cy.reset();
		// self.cy.fit();
            });

            return this;
        },

        getData: function() {
            return {
                type: "KbaseNetwork",
                id: this.options.netname,
                title: "Network Card"
            };
        }

    });
})( jQuery )