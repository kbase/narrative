/**
 * @class KBApplication
 *
 * Represents a single-page application comprising one or more widgets.
 * 
 * @extends KBWidget
 */
(function ($) {
    $.KBApplication = $.fn.KBApplication = function (def) {
        this.constructor = $.KBWidget.constructor;
        return this;
    }
})(jQuery);