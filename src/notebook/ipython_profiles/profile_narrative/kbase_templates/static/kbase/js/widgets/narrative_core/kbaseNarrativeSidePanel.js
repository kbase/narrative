(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeSidePanel',
        parent: 'kbaseWidget',
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            autorender: true
        },
        dataPanel: null,
        methodsPanel: null,
        narrativesPanel: null,
        jobsPanel: null,

        /**
         * Does the initial panel layout - tabs and spots for each widget
         * It then instantiates them, but not until told to render (unless autorender = true)
         */
        init: function(options) {
            this._super(options);

            var $managePanel = this.buildPanelSet();
            var $analysisPanel = this.buildPanelSet();
            // set up tabs
            this.$elem.kbaseTabs({
                tabPosition: 'top',
                canDelete: false,
                tabs: [
                    {
                        tab: 'Analyze',
                        content : $analysisPanel,
                    },
                    {
                        tab: 'Manage',
                        content : $managePanel,
                    },
                ],
            });

            if (this.autorender) {
                this.render();
            }
            else {

            }
            // add the stuff to the tabs

            return this;
        },

        /**
         * Builds the general structure for a panel set.
         * These are intended to start with 2 panels, but we can move from there if needed.
         */
        buildPanelSet: function() {
            var panelSet = $('<div>')
                           .css({'height' : '100%'})
                           .append($('<div>')
                                   .css({'height' : '50%','border' : 'solid 1px #555'}))
                           .append($('<div>')
                                   .css({'height' : '50%','border' : 'solid 1px #555'}));
            return panelSet;
        },

        render: function() {

        }
    })
})( jQuery );