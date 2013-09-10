(function( $, undefined ){

	$.KBWidget({
		name: "LandingPageCard", 
		parent: "kbaseWidget",
		version: "1.0.0",
		options: { 
			draggable: true,
			autoOpen: true,
			closeOnEscape: false,
			position: null,
			close: function(event, ui) {
				console.log('wut');
			}
		},

		init: function(options) {
			this._super(options);

			if (this.options.position === null) {
				this.options.position = {
					my: "center",
					at: "center"
				};
			}

			var self = this;
			this.options.open = function(event, ui) {
				self.$elem.css('overflow', 'hidden');
			};
			this.options.close = function(event, ui) {
				self.$elem.remove();
			};

			this.$elem.addClass("kblpc");
			this.$elem.dialog(this.options);

			return this;
		}
	});


})( jQuery );