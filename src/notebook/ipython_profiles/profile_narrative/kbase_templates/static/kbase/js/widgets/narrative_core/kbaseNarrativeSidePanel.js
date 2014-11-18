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

            var $tabs = this.buildTabs([
                {
                    tabName : 'Analyze',
                    content : $analysisPanel
                },
                {
                    tabName : 'Manage',
                    content: $managePanel
                }
            ]);

            this.$elem.append($tabs);

            $(document).on('toggleSidePanelOverlay.Narrative', $.proxy(function(event) {
                this.toggleOverlay();
            }, this));

            if (this.autorender) {
                this.render();
            }
            else {

            }
            // add the stuff to the tabs

            return this;
        },

        buildTabs: function(tabs) {
            var $header = $('<div>');
            var $body = $('<div>');

            for (var i=0; i<tabs.length; i++) {
                var tab = tabs[i];
                $header.append($('<div>')
                               .addClass('kb-side-header')
                               .append(tab.tabName));
                $body.append($('<div>')
                             .addClass('kb-side-tab')
                             .append(tab.content));
            }

            $header.find('div').click(function(event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.index();
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div').removeClass('active');
                    $body.find('div:nth-child(' + (idx+1) + ')').addClass('active');
                }
            });

            $header.find('div:first-child').addClass('active');
            $body.find('div:first-child').addClass('active');

            var $tabPanel = $('<div>')
                            .addClass('kb-side-panel')
                            .append($header)
                            .append($body);
            return $tabPanel;
        },

        initOverlay: function() {
            var $overlayHeader = $('<div>')
                                 .addClass('kb-side-overlay-header')
                                 .append('Header!')
                                 .append($('<div>')
                                        .addClass('pull-right')
                                        .append($('<span>')
                                                .addClass('kb-side-overlay-close glyphicon glyphicon-remove')
                                        .click($.proxy(function(event) {
                                           this.toggleOverlay();
                                        }, this))));

            var $overlayBody = $('<div>empty</div>');

            this.$overlay = $('<div>')
                            .addClass('kb-side-overlay-container')
                            .append($overlayHeader)
                            .append($overlayBody);
            $('body').append(this.$overlay);
            this.$overlay.hide();
            this.$overlay.position({my: 'left top', at: 'right top', of: this.$elem});

            this.$narrativeDimmer = $('<div>')
                                    .addClass('kb-overlay-dimmer');
            $('body').append(this.$narrativeDimmer);
            this.$narrativeDimmer.hide();
            this.$narrativeDimmer.position({my: 'left top', at: 'right top', of: this.$elem});
        },

        toggleOverlay: function() {
            if (this.$overlay.is(':visible'))
                this.hideOverlay();
            else
                this.showOverlay();
        },

        showOverlay: function() {
            if (this.$overlay) {
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
            var $panelSet = $('<div>');
            if (!widgets || Object.prototype.toString.call(widgets) !== '[object Array]' || widgets.length === 0)
                return $panelSet;

            var height = 100 / widgets.length;
            var minHeight = 200;

            $panelSet.css({'height': '85vh', 'min-height' : (minHeight * widgets.length) + 'px'});
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