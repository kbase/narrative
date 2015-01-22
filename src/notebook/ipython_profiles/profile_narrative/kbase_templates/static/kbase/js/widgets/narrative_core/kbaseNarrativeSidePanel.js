(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeSidePanel',
        parent: 'kbaseWidget',
        options: {
            loadingImage: "static/kbase/images/ajax-loader.gif",
            autorender: true,
            workspaceURL: "https://kbase.us/services/ws", //used for data importer
            landingPageURL: "/functional-site/#/", // used for data importer
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

            // make sure we pick up the proper config urls
            if (window.kbconfig && window.kbconfig.urls) {
                this.options.workspaceURL = window.kbconfig.urls.workspace;
            }

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
                    name : 'kbaseNarrativeManagePanel',
                    params : { autopopulate: true }
                },
            ]);

            this.$narrativesWidget = manageWidgets['kbaseNarrativeAppsPanel'];
            var $managePanel = manageWidgets['panelSet'];

            var jobsWidget = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeJobsPanel',
                    params : { autopopulate: false }
                }
            ]);
            this.$jobsWidget = jobsWidget['kbaseNarrativeJobsPanel'];
            var $jobsPanel = jobsWidget['panelSet'];

            var $tabs = this.buildTabs([
                {
                    tabName : 'Analyze',
                    content : $analysisPanel
                },
                {
                    tabName : 'Narratives',
                    content: $managePanel
                },
                {
                    tabName : 'Jobs',
                    content: $jobsPanel
                }
            ], true);

            this.$elem.addClass('kb-side-panel');
            this.$elem.append($tabs.header).append($tabs.body);

            $(document).on('showSidePanelOverlay.Narrative', $.proxy(function(event, panel) {
                this.showOverlay(panel);
            }, this));

            $(document).on('hideSidePanelOverlay.Narrative', $.proxy(function(event, panel) {
                this.hideOverlay(panel);
            }, this));

            $(document).on('toggleSidePanelOverlay.Narrative', $.proxy(function(event, panel) {
                this.toggleOverlay(panel);
            }, this));

            if (this.autorender) {
                this.render();
            }
            else {

            }

            return this;
        },

        /**
         * @method
         * @private
         * Builds a very simple set of tabs.
         * @param {Array} tabs - a list of objects where each has a 'tabName' and 'content' property.
         * As you might expect, 'tabName' is the name of the tab that goes into the styled header,
         * and 'content' is the tab content, expected to be something that can be attached via .append()
         * @param isOuter - if true, treat these tabs as though they belong to the outer side panel,
         * not to an inner set of tabs. That is, when any new tab is selected, it hides the overlay,
         * if it's open.
         */
        buildTabs: function(tabs, isOuter) {
            var $header = $('<div>');
            var $body = $('<div>');

            for (var i=0; i<tabs.length; i++) {
                var tab = tabs[i];
                $header.append($('<div>')
                               .addClass('kb-side-header')
                               .css('width', (100/tabs.length)+'%')
                               .append(tab.tabName));
                $body.append($('<div>')
                             .addClass('kb-side-tab')
                             .append(tab.content));
            }

            $header.find('div').click($.proxy(function(event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.index();
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div.kb-side-tab').removeClass('active');
                    $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab').addClass('active');
                    if (isOuter)
                        this.hideOverlay();
                }
            }, this));

            $header.find('div:first-child').addClass('active');
            $body.find('div:first-child.kb-side-tab').addClass('active');

            return {
                header: $header,
                body: $body
            };
        },

        initOverlay: function() {
            var self = this;

            this.$overlayBody = $('<div class="kb-overlay-body">');
            this.$overlayFooter  = $('<div class="kb-overlay-footer">');
            this.$overlay = $('<div>')
                            .addClass('kb-side-overlay-container')
                            //.append(this.$overlayBody)
                            //.append(this.$overlayFooter);

            $('body').append(this.$overlay);
            this.$overlay.hide();

            this.$narrativeDimmer = $('<div>')
                                    .addClass('kb-overlay-dimmer');

            $('body').append(this.$narrativeDimmer);
            this.$narrativeDimmer.hide();
            this.updateOverlayPosition();

            // hide panel when clicking outside
            this.$narrativeDimmer.unbind('click');
            this.$narrativeDimmer.click(function() {
                self.hideOverlay();
            });
        },

        updateOverlayPosition: function() {
            this.$overlay.position({my: 'left top', at: 'right top', of: this.$elem});
            this.$narrativeDimmer.position({my: 'left top', at: 'right top', of: this.$elem});
        },

        /**
         * @method
         * @public
         * Also available through a trigger - 'toggleSidePanelOverlay.Narrative'
         * The behavior here is done in three cases.
         * 1. If the overlay is currently visible, it gets hidden.
         * 1a. If there is a panel given, and it is different from the currently attached panel, then
         *     the new panel is attached and the overlay is redisplayed.
         * 2. If the overlay is currently hidden, it is shown with the given panel.
         */
        toggleOverlay: function(panel) {
            if (this.$overlay.is(':visible')) {
                this.hideOverlay();
                if (panel && panel !== this.currentPanel) {
                    this.showOverlay(panel);
                }
            }
            else
                this.showOverlay(panel);
        },

        showOverlay: function(panel) {
            if (this.$overlay) {
                if (panel) {
                    if (this.currentPanel)
                        $(this.currentPanel).detach();
                    this.$overlay.append(panel);
                    this.currentPanel = panel;
                }
                this.$narrativeDimmer.show();
                this.$elem.find('.kb-side-header').addClass('overlay-active');
                this.$overlay.show('slide', 'fast', $.proxy(function() {
                }, this));
            }
        },

        hideOverlay: function() {
            if (this.$overlay) {
                this.$narrativeDimmer.hide();
                this.$elem.find('.kb-side-header').removeClass('overlay-active');
                this.$overlay.hide('slide', 'fast', $.proxy(function() {
                }, this));
            }
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
            var $panelSet = $('<div>')
                            .addClass('kb-narr-side-panel-set');
            if (!widgets || Object.prototype.toString.call(widgets) !== '[object Array]' || widgets.length === 0)
                return $panelSet;

            var height = 100 / widgets.length;
            var minHeight = 200;

            var retObj = {};
            for (var i=0; i<widgets.length; i++) {
                var widgetInfo = widgets[i];
                var $widgetDiv = $('<div>')
                                 .css({'height' : height + '%', 'border-bottom' : '5px solid #e0e0e0'});

                retObj[widgetInfo.name] = $widgetDiv[widgetInfo.name](widgetInfo.params);
                $panelSet.append($widgetDiv);
            }
            retObj['panelSet'] = $panelSet;
            return retObj;
        },

        render: function() {
            this.initOverlay();

            this.$methodsWidget.refreshFromService();
            setTimeout($.proxy(function() { this.$jobsWidget.refresh(false, true); }, this), 750);

        }

    })
})( jQuery );
