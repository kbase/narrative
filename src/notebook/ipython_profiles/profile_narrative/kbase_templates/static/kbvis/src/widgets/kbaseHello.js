/**
 * Just a simple example widget - makes a div with "Hello world!"
 * in a user-defined color (must be a css color - 'red' or 'yellow' or '#FF0000')
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "HelloWidget",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            color: "black",
        },

        init: function(options) {
            this._super(options);

            var self = this;
            var $helloDiv = $("<div/>")
                            .css("color", this.options.color)
                            .append("Hello, world!")
                            .on("click", function(event) {
                                self.trigger("helloClick", 
                                    { 
                                      message: "hello!", 
                                      event: event
                                    }
                                )
                            });
            this.$elem.append($helloDiv);
            return this;
        }

    });
})( jQuery )