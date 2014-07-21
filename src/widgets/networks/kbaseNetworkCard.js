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

	    var layout = { name: "arbor",
			   maxSimulationTime: 1000,
			   fit: true,
			   liveUpdate: false };
	    self.needResize = false;
	    if (network.nodes.length==1) {
		self.needResize = true;
		layout = { name: "grid",
			   fit: true };
	    }
	    $('#cytoscape').html('');
	    $('#cytoscape').cytoscape({
		showOverlay: false,
		elements: network,
		layout: layout,
                style: cytoscape.stylesheet().
                    selector('node').css({
                        'content': 'data(label)',
			'height': 'data(width)',
			'width': 'data(width)',
                        'border-color': 'black',
			'border-width': 1,
                        'text-halign': 'center',
                        'text-valign': 'center',
                        'color': 'black',
                        'background-color': 'data(color)',
                    }).
                    selector('edge').css({
                        'line-color': 'data(color)',
                        'width': 'data(width)',
                    }).
                    selector('edge[directed=1]').css({
			'target-arrow-shape': 'triangle',
			'target-arrow-color': 'black',
                    }),
		ready: function(e){
		    if (self.needResize)
			self.cy.fit();
		},
	    });

            $("#cytoscape").cytoscapePanzoom();
	    this.cy = $("#cytoscape").cytoscape("get");

            $(window).on("resize", function() {
		self.cy.reset();
		self.cy.fit();
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