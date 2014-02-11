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
            var main = $('<div>');
            
            // Create overview
            var url = 'http://140.221.85.116/mgoverview.html?metagenome='+this.options.mgid;
            var iframe = $('<iframe>')
                .attr({'src': url})
                .css({'scrolling': 'auto', 'width': '800px', 'height': '800px'});
            main.append(iframe);
            
            // put container in cell
            this.$elem.append(main);
            return this;
        },

    });
})(jQuery);