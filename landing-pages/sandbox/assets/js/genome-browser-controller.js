(function( $ ) {
	$(function() {
		var genomeWidget = $("#genome-browser-container").KBaseContigBrowser({
															'svgWidth' : 500,
															'svgHeight' : 10,
															'contig' : 'kb|g.0.c.1',
															'allowResize' : true,
															'onClickFunction' : selectHighlight,
															'centerFeature' : 'kb|g.0.peg.2173'
														});

		console.log(genomeWidget);

		// $("#contigFirstBase").on("click", genomeWidget.moveLeftEnd());
		// $("#contigLastBase").on("click", genomeWidget.moveRightEnd());
		$("#contigFirstBase").click(function() { genomeWidget.moveLeftEnd();});
		$("#contigLastBase").click(function() { genomeWidget.moveRightEnd(); });
		$("#contigStepPrev").click(function() { genomeWidget.moveLeftStep(); });
		$("#contigStepNext").click(function() { genomeWidget.moveRightStep(); });
		$("#contigZoomIn").click(function() { genomeWidget.zoomIn(); });
		$("#contigZoomOut").click(function() { genomeWidget.zoomOut(); });

		$("#test-card").landingPageCard();

		// $("#login-widget").kbaseLogin({
		// 	style: "text",

		// 	login_callback: function(args) {
		// 		loggedIn = true;
		// 		narrativeWsWidget.loggedIn(args);
		// 	},

		// 	logout_callback: function(args) {
		// 		loggedIn = false;
		// 		narrativeWsWidget.loggedOut(args);
		// 	},

		// 	prior_login_callback: function(args) {
		// 		loggedIn = true;
		// 		narrativeWsWidget.loggedIn(args);
		// 	}
		// });

	});

	/**
	 * function: selectHighlight(element, d, i)
	 * params:
	 *   element = an SVG element
	 *   d = the feature to be highlighted
	 *   i = the index of the feature to be highlighted
	 * returns:
	 *   nothing
	 * ------------------------------------------------
	 * Intended to be called when a user clicks on a feature (or otherwise selects it),
	 * this gives a bright highlight to the element, and displays basic feature data in
	 * specific fields.
	 */
	var selectHighlight = function(element, d) {
		d3.selectAll(".highlight")
		  .classed("highlight", false)
		  .style("fill", "red");

		d3.select(element)
		  .classed("highlight", true)
		  .style("fill", "yellow");

		var fid = d.feature_id;
		if (fid === undefined)
			fid = "";

		var fFunction = d.feature_function;
		if (fFunction === undefined)
			fFunction = "";

		var fLength = d.feature_length;
		if (fLength === undefined)
			fLength = "";

		$("#featureID").html("<a href=\"" + featureURL + fid + "\">" + fid + "</a>"); //&nbsp;&nbsp;&nbsp;" + toWorkflowButton);
		$("#featureFunction").html(fFunction);
		$("#featureLength").html(fLength + " bp");
	};

})( jQuery );

