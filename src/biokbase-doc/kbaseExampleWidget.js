/**
 * An example widget that one might use to display results from running a 
 * back-end Narrative function.
 *
 * Notice that this is only using the KBase widget API - no fancy magic here,
 * other than that.
 *
 * If you were to run this, it should show a simple little string in its 
 * HTML target: "Output: <my output string>".
 * @author Bill Riehl <wjriehl@lbl.gov>
 */
(function($, undefined) {
	$.KBWidget({
		name: "kbaseExampleWidget",
		parent: "kbaseWidget",
		options: {
			output: "Some output placeholder",
		},

		init: function(options) {
			this._super(options);

			var outputStr = "Output: " + this.options.output;
			this.$elem.append(outputStr);

			return this;
		},
	});
})(jQuery);