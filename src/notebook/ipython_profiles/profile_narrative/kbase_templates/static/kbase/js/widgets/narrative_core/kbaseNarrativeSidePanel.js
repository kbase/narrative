(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeSidePanel',
        parent: 'kbaseWidget',
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            autorender: true,
        },
        $dataWidget: null,
        $methodsWidget: null,
        $narrativesWidget: null,
        $jobsWidget: null,
        $overlay: null,

        /**
         * Does the initial panel layout - tabs and spots for each widget
         * It then instantiates them, but not until told to render (unless autorender = true)
         */
        init: function(options) {
            this._super(options);

            var analysisWidgets = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeDataPanel',
                    params : {}
                },
                {
                    name : 'kbaseNarrativeMethodPanel',
                    params : { autopopulate: false }
                }
            ]);
            this.$dataWidget = analysisWidgets['kbaseNarrativeDataPanel'];
            this.$methodsWidget = analysisWidgets['kbaseNarrativeMethodPanel'];
            var $analysisPanel = analysisWidgets['panelSet'];

            var manageWidgets = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeAppsPanel',
                    params : { autopopulate: true }
                },
                {
                    name : 'kbaseNarrativeJobsPanel',
                    params : { autopopulate: false }
                }
            ]);

            this.$narrativesWidget = manageWidgets['kbaseNarrativeAppsPanel'];
            this.$jobsWidget = manageWidgets['kbaseNarrativeJobsPanel'];
            var $managePanel = manageWidgets['panelSet'];


            // set up tabs
            this.$elem.append($('<button>')
                              .addClass('btn btn-default btn-sm')
                              .append('click me!')
                              .click($.proxy(function(event) {
                                this.toggleOverlay();
                              }, this)));

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

        initOverlay: function() {
            var $overlayHeader = $('<div>')
                                 .addClass('pull-right')
                                 .append($('<span>')
                                         .addClass('glyphicon glyphicon-remove kb-function-help'))
                                 .click($.proxy(function(event) {
                                    this.toggleOverlay();
                                 }, this));

            var $overlayBody = $('<div>empty</div>');

            this.$overlay = $('<div>')
                            .css({
                                'width' : '50vw', 
                                'height' : '80vh', 
                                'border' : '1px dashed black',
                                'z-index' : 10000,
                                'background' : 'white',
                                'position' : 'fixed'
                            })
                            .append($overlayHeader)
                            .append($overlayBody);
            $('body').append(this.$overlay);
            this.$overlay.hide();
            this.$overlay.position({my: 'left top', at: 'right top', of: this.$elem});
        },

        toggleOverlay: function() {
            if (this.$overlay)
                this.$overlay.toggle('slide', 'fast');
        },

        showOverlay: function() {
            if (this.$overlay)
                this.$overlay.show('slide', 'fast');
        },

        hideOverlay: function() {
            if (this.$overlay)
                this.$overlay.hide('slide', 'fast');
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
            var retObj = {};
            for (var i=0; i<widgets.length; i++) {
                var widgetInfo = widgets[i];
                var $widgetDiv = $('<div>')
                                 .css({'height' : height + '%', 'border' : 'solid 1px #555'});

                retObj[widgetInfo.name] = $widgetDiv[widgetInfo.name](widgetInfo.params);
                $panelSet.append($widgetDiv);
            }
            retObj['panelSet'] = $panelSet;
            return retObj;
        },

        render: function() {
            this.initOverlay();

            this.$methodsWidget.refreshFromService();
            setTimeout($.proxy(function() { this.$jobsWidget.refresh(); }, this), 750);

        }
    })
})( jQuery );