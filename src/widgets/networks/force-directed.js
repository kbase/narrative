/**
 * @class ForceDirectedNetwork
 *
 * Implements a force-directed network widget
 * 
 * @extends KBWidget
 *
 * And here's an example:
 *
 *     @example
 *     var widget = $.ForceDirectedNetwork({
 *         workspaceID: "workspace.1",
 *     });
 */
(function ($) {
    $.KBWidget({
        name: "ForceDirectedNetwork",
        version: "0.1.0",
        options: {},
        init: function (options) {
            this._super(options);
            this.render();
            return this;
        },
        render: function () {
            this.$elem.empty().append($("<h3>").text("Network Widget"));
            return this;
        }
    });
})(jQuery);