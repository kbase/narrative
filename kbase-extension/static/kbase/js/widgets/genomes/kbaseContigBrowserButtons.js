/**
 * Requires bootstrap 3 for buttons
 */
define(['jquery', 'kbwidget'], function($) {
    $.KBWidget({
        name: "KBaseContigBrowserButtons",
        parent: "kbaseWidget", 
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

            var self = this;
            var $buttonSet = $("<div/>")
                             .addClass("btn-group")
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("First")
                                     .click(function() { self.options.browser.moveLeftEnd(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Previous")
                                     .click(function() { self.options.browser.moveLeftStep(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Zoom In")
                                     .click(function() { self.options.browser.zoomIn(); } )
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Zoom Out")
                                     .click(function() { self.options.browser.zoomOut(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Next")
                                     .click(function() { self.options.browser.moveRightStep(); })
                                    )
                             .append($("<button/>")
                                     .attr("type", "button")
                                     .addClass("btn btn-default")
                                     .append("Last")
                                     .click(function() { self.options.browser.moveRightEnd(); })
                                    );


            this.$elem.append($("<div align='center'/>").append($buttonSet));

            return this;

        },

        render: function() {
            return this;
        }
    });

});