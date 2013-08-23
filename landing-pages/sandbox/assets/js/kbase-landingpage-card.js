(function( $, undefined ){

	$.KBWidget("landingPageCard", 'kbaseWidget', {
		version: "1.0.0",
		$cardBody: null,

		options: {
			title: 'KBase Card',
			minHeight: 10,			//pixels
			minWidth: 100,			//pixels
			defaultHeight: 100,		//pixels
			defaultWidth: 100		//pixels
		},

		init: function(options) {
			this._super(options);

			this.$cardBody = $("<div/>")
							 .addClass("kblp-body")
							 .append("Body.Body.Body.Body.Body. Body.Body.Body.Body.Body.")
							 .css("min-height", this.options.defaultHeight + "px")
							 .css("min-width", this.options.defaultWidth + "px")
							 .css("width", this.options.defaultWidth + "px");

			var $cardBlock = $("<div/>")
							 .addClass("kblp-card")
							 .append($("<div/>")
							 		 .addClass("kblp-header")
							 		 .append($("<div/>")
							 		 		 .addClass("kblp-header-name")
							 		 		 .append(this.options.title)
							 		 		)
							 		 .append($("<div/>")
							 		 		 .addClass("kblp-header-buttons")
							 		 		 .append("buttons!")
							 		 		)
							 		)
							 .append(this.$cardBody)
							 .append($("<div/>")
							 		 .addClass("kblp-footer")
							 		 .append("Footer.")
							 		);

			this.$elem.append($cardBlock);
			return this;
		},

		render: function(options) {
			return this;
		},
	});


})( jQuery );