// test widget 1
(function( $, undefined ) {

	$.kbWidget("testWidget1", 'kbaseWidget', {
		version: "1.0.0",
		options: {},
		init: function(options) {
			this._super(options);
			return this;
		},
		render: function(options) {
			this.$elem.append("widget 1 here!");
		}
	});

})( jQuery );

(function( $, undefined ) {

	$.kbWidget("testWidget2", 'kbaseWidget', {
		version: "1.0.0",
		options: {},
		init: function(options) {
			this._super(options);
			this.trigger("WidgetInited", "Inited!");
			return this;
		},

		render: function(options) {
			this.$elem.append("widget 2 here!");
			this.trigger("WidgetRendered", "Rendered!");
		}
	});

})( jQuery );