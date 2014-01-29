(function( $, undefined ){

	$.KBWidget({
		name: "LandingPageCard", 
		parent: "kbaseWidget",
		version: "1.0.0",
		options: { 
			draggable: true,
			autoOpen: true,
			closeOnEscape: false,
		},

		init: function(options) {
			this._super(options);

			var self = this;
			this.options.open = function(event, ui) {
				self.$elem.css('overflow', 'hidden');
			};
			this.options.close = function(event, ui) {
				self.$elem.remove();
			};
			this.$elem.dialog(this.options);

			return this;
		}
	});


})( jQuery );