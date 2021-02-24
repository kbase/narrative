/**
 * Requires bootstrap 3 for buttons
 */
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery'
	], (
		KBWidget,
		bootstrap,
		$
	) => {
    return KBWidget({
        name: "KBaseContigBrowserButtons",
         
        version: "1.0.0",
        options: {
            direction: "horizontal", // also "vertical" eventually.
            browser: null
        },

        init: function(options) {
            this._super(options);

            if (this.options.browser === null) {
                return;
            }

            const self = this;
            const $buttonSet = $("<div/>")
                             .addClass("btn-group")
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("First")
                                     .click(() => { self.options.browser.moveLeftEnd(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Previous")
                                     .click(() => { self.options.browser.moveLeftStep(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Zoom In")
                                     .click(() => { self.options.browser.zoomIn(); } )
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Zoom Out")
                                     .click(() => { self.options.browser.zoomOut(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Next")
                                     .click(() => { self.options.browser.moveRightStep(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Last")
                                     .click(() => { self.options.browser.moveRightEnd(); })
                                    );


            this.$elem.append($("<div align='center'/>").append($buttonSet));

            return this;

        },

        render: function() {
            return this;
        }
    });

});