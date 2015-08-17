(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeSidePanel',
        parent: 'kbaseWidget',
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
        },

        init: function(options) {
            this._super(options);

            if (this.autorender) {
                this.render();
            }
            else {
            }
            // set up tabs
            this.$elem.kbaseTabs({
                tabPosition: 'top',
                canDelete: false,
                tabs: [
                    {
                        tab: 'Data',
                        content : $('<div>').html('Data goes here'),
                    },
                    {
                        tab: 'Methods',
                        content : $('<div>').html('Methods and apps go here'),
                    },
                    {
                        tab: 'Jobs',
                        content : $('<div>').html('Job management goes here')
                    },
                ],
            });

            // add the stuff to the tabs

            return this;
        },
    })
})( jQuery );