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


    // var $dataWidget = $('#kb-ws').kbaseNarrativeDataPanel();
    // $dataWidget.showLoadingMessage('Waiting for Narrative to finish loading...');

    // var $functionWidget = $('#kb-function-panel').kbaseNarrativeMethodPanel({ autopopulate: false });
    // $functionWidget.refreshFromService();

    // var $jobsWidget = $('#kb-jobs-panel').kbaseNarrativeJobsPanel({ autopopulate: false });
    // $jobsWidget.showLoadingMessage('Waiting for Narrative to finish loading...');
    
    // var $appsWidget = $('#kb-apps-panel').kbaseNarrativeAppsPanel({ autopopulate: true });


            var $analysisPanel = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeDataPanel',
                    params : {}
                },
                {
                    name : 'kbaseNarrativeMethodPanel',
                    params : {autopopulate: false}
                }
            ]);
            var $managePanel = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeAppsPanel',
                    params : {autopopulate: false}
                },
                {
                    name : 'kbaseNarrativeJobsPanel',
                    params : {autopopulate: false}
                }
            ]);

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
         *
         * (I'll jsdoc this up in a bit)
         * widgets = [
         *     {
         *         name: kbaseNarrativeDataPanel (for instance)
         *         params: {}
         *     }
         * ]
         * @param {object} widgets
         *
         */
        buildPanelSet: function(widgets) {
            var $panelSet = $('<div>');
            if (!widgets || Object.prototype.toString.call(widgets) !== '[object Array]' || widgets.length === 0)
                return $panelSet;

            var height = 100 / widgets.length;
            var minHeight = 200;

            $panelSet.css({'height': '90vh', 'min-height' : (minHeight * widgets.length) + 'px'});

            for (var i=0; i<widgets.length; i++) {
                var $widgetDiv = $('<div>')
                                 .css({'height' : height + '%', 'border' : 'solid 1px #555'});
                var $widget = $widgetDiv[widgets[i].name](widgets[i].params);
                $panelSet.append($widgetDiv);
            }

            return $panelSet;
        },

        render: function() {

        }
    })
})( jQuery );