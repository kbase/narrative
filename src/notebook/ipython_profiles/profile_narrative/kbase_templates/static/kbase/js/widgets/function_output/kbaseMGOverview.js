/**
 * KBase widget to display an image.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'MGOverviewWidget',
        version: '1.0.0',
        options: {
            mgid: null
        },
        
        init: function(options) {
            this._super(options);
            // on error, may be called with null
            if (this.options.mgid === null) {
                this.$elem.html("No result");
            }
            else {
                this.render();
            }
            return this;
        },
        
        render: function() {
            // creater main comtainer
            var main = $('<div>')
                .css({ 'width': '900px',
                       'height': '700px',
                       'padding': '0'
            });
            
            // Create overview
            var url = 'http://narrative.kbase.us/functional-site/communities/metagenome.html?metagenome='+this.options.mgid;
            var iframe = $('<iframe>')
                .attr({'src': url})
                .css({ 'width': '1285',
                       'height': '1000',
                       'border': '0',
                       'overflow-x': 'hidden',
                       'overflow-y': 'scroll',
                       'position': 'relative',
                       '-ms-transform': 'scale(0.7)',
                       '-moz-transform': 'scale(0.7)',
                       '-o-transform': 'scale(0.7)',
                       '-webkit-transform': 'scale(0.7)',
                       'transform': 'scale(0.7)',
                       '-ms-transform-origin': '0 0',
                       '-moz-transform-origin': '0 0',
                       '-o-transform-origin': '0 0',
                       '-webkit-transform-origin': '0 0',
                       'transform-origin': '0 0',
            });
            main.append(iframe);
            
            // put container in cell
            this.$elem.append(main);
            return this;
        },

    });
})(jQuery);