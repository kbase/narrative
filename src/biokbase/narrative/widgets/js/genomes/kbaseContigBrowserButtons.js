(function( $, undefined ){
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
                console.log("No browser exists for the button set!");
                return;
            }

            var self = this;
            var $buttonSet = $("<div class='kbcb-buttons'/>")
                             .append($("<button/>")
                                     .append("First")
                                     .click(function() { self.options.browser.moveLeftEnd(); })
                                    )
                             .append($("<button/>")
                                     .append("Previous")
                                     .click(function() { self.options.browser.moveLeftStep(); })
                                    )
                             .append($("<button/>")
                                     .append("Zoom In")
                                     .click(function() { self.options.browser.zoomIn(); } )
                                    )
                             .append($("<button/>")
                                     .append("Zoom Out")
                                     .click(function() { self.options.browser.zoomOut(); })
                                    )
                             .append($("<button/>")
                                     .append("Next")
                                     .click(function() { self.options.browser.moveRightStep(); })
                                    )
                             .append($("<button/>")
                                     .append("Last")
                                     .click(function() { self.options.browser.moveRightEnd(); })
                                    );


            this.$elem.append($buttonSet);

            return this;

        },

        render: function() {
            return this;
        }
    });

})( jQuery );