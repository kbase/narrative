/**
 * Narrative data cell.
 *
 * @public
 */
(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeDataCell',
        parent: 'kbaseNarrativeCell',
        version: '0.0.1',
        options: {
            name: null,
            type: null,
            id: null,
            version: null
        },

        /**
         * Initialize
         */
        init: function(options) {
            console.debug("kbaseNarrativeDataCell.init");
            this._super(options);
            this.render();
            return this;
        },

        /**
         * Render
         */
        render: function() {
            var v = this.options;
            console.debug("this in render = ", this);
            var $brief = $('<span>')
              .addClass('kb-data-cell-brief')
              .text(v.type + ' ' + v.name);
            var $d = $("<div>")
                       .addClass("kb-data-cell")
                       .append($brief);
            this.$elem.append($d);
            return this;
        },


    })
})(jQuery);
