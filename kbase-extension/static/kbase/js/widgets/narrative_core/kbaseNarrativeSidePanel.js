/*global define*/
/*jslint white: true*/
define(['jquery', 
        'narrativeConfig',
        'jqueryui',
        'kbwidget', 
        'kbaseNarrativeDataPanel', 
        'kbaseNarrativeMethodPanel', 
        'kbaseNarrativeManagePanel', 
        'kbaseNarrativeJobsPanel',
        'kbaseNarrative'],
function($, Config) {
    'use strict',
    $.KBWidget({
        name: 'kbaseNarrativeSidePanel',
        parent: 'kbaseWidget',
        options: {
            loadingImage: Config.get('loading_gif'),
            autorender: true,
            workspaceURL: Config.url('workspace'),
        },
        $dataWidget: null,
        dataWidgetListHeight: [340, 680], // [height with methods showing, max height], overwritten on window size change
        $methodsWidget: null,
        methodsWidgetListHeight: [300, 600], // [height with data showing, max height]

        heightListOffset: 220,  // in px, space taken up by titles, header bar, etc.  The rest of the real estate is divided
                                // by half for for the method and data lists
        heightPanelOffset: 110, // in px, space taken by just the header, the rest is for the full panel size, which is the
                                // case for the narratives/jobs panels
        $narrativesWidget: null,
        $jobsWidget: null,
        $overlay: null,

        hideButtonSize: 4, //percent width

        /**
         * Does the initial panel layout - tabs and spots for each widget
         * It then instantiates them, but not until told to render (unless autorender = true)
         */
        init: function(options) {
            this._super(options);
            var analysisWidgets = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeDataPanel',
                    params : {
                        collapseCallback: $.proxy(function(isMinimized) { 
                                this.handleMinimizedDataPanel(isMinimized);
                            }
                            ,this)
                    }
                },
                {
                    name : 'kbaseNarrativeMethodPanel',
                    params : { 
                        autopopulate: false , 
                        collapseCallback: $.proxy(function(isMinimized) { 
                                this.handleMinimizedMethodPanel(isMinimized);
                            }
                            ,this)
                    }
                }
            ]);
            this.$dataWidget = analysisWidgets['kbaseNarrativeDataPanel'];
            this.$methodsWidget = analysisWidgets['kbaseNarrativeMethodPanel'];

            var $analysisPanel = analysisWidgets['panelSet'];

            var manageWidgets = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeManagePanel',
                    params : { autopopulate: true, showTitle: false }
                },
            ]);

            this.$narrativesWidget = manageWidgets['kbaseNarrativeManagePanel'];
            var $managePanel = manageWidgets['panelSet'];

            var jobsWidget = this.buildPanelSet([
                {
                    name : 'kbaseNarrativeJobsPanel',
                    params : { autopopulate: true, showTitle: false }
                }
            ]);
            this.$jobsWidget = jobsWidget['kbaseNarrativeJobsPanel'];
            var $jobsPanel = jobsWidget['panelSet'];

            this.$tabs = this.buildTabs([
                {
                    tabName : 'Analyze',
                    content : $analysisPanel
                },
                {
                    tabName : 'Narratives',
                    content: $managePanel
                },
                {
                    tabName : this.$jobsWidget.title,
                    content: $jobsPanel
                }
            ], true);

            this.$elem.addClass('kb-side-panel');
            this.$elem.append(this.$tabs.header)
                      .append(this.$tabs.body);

            $(document).on('showSidePanelOverlay.Narrative', $.proxy(function(event, panel) {
                this.showOverlay(panel);
            }, this));

            $(document).on('hideSidePanelOverlay.Narrative', $.proxy(function(event, panel) {
                this.hideOverlay(panel);
            }, this));

            $(document).on('toggleSidePanelOverlay.Narrative', $.proxy(function(event, panel) {
                this.toggleOverlay(panel);
            }, this));

            // handle window size change in left panel, and call it once to set the correct size now
            $(window).on('resize',$.proxy(function() { this.windowSizeChange(); }, this));
            this.windowSizeChange();

            if (this.autorender) {
                this.render();
            }
            else {

            }


            return this;
        },

        /**
         * @method
         * @public
         * A bit of a hack. Set a specific read-only mode where we don't see the jobs or methods panel,
         * only the data panel and narratives panel.
         * So we need to remove the 'Jobs' header all together, then hide the methods panel,
         * and expand the data panel to fill the screen
         */
        setReadOnlyMode: function(readOnly) {
            // toggle off the methods and jobs panels
            this.$methodsWidget.$elem.toggle(!readOnly);
            this.$jobsWidget.$elem.toggle(!readOnly);

            // toggle off the jobs header
            this.$tabs.header.find('div:nth-child(4).kb-side-header').toggle(!readOnly); // hide the jobs header
            this.$tabs.header.find('div.kb-side-header').css({'width': (readOnly ? ((100-this.hideButtonSize)/2)+'%' : ((100-this.hideButtonSize)/3)+'%')});

            this.$dataWidget.setReadOnlyMode(readOnly);
            this.handleMinimizedMethodPanel(readOnly);
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

            $header.append($('<div>')
                           .addClass('kb-side-toggle')
                           .css('width', this.hideButtonSize + '%')
                           .append($('<span>')
                                   .addClass('fa fa-caret-left'))
                           .click(function() {
                               Jupyter.narrative.toggleSidePanel();
                           }));
            for (var i=0; i<tabs.length; i++) {
                var tab = tabs[i];
                $header.append($('<div>')
                               .addClass('kb-side-header')
                               .css('width', ((100-this.hideButtonSize)/tabs.length)+'%')
                               .append(tab.tabName)
                               .attr('kb-data-id', i));
                $body.append($('<div>')
                             .addClass('kb-side-tab')
                             .append(tab.content)
                             .attr('kb-data-id', i));
            }

            $header.find('div[kb-data-id]').click($.proxy(function(event) {
                event.preventDefault();
                event.stopPropagation();
                var $headerDiv = $(event.currentTarget);

                if (!$headerDiv.hasClass('active')) {
                    var idx = $headerDiv.attr('kb-data-id');
                    $header.find('div').removeClass('active');
                    $headerDiv.addClass('active');
                    $body.find('div.kb-side-tab').removeClass('active');
                    // $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab').addClass('active');
                    $body.find('[kb-data-id=' + idx + ']').addClass('active');
                    if (isOuter)
                        this.hideOverlay();
                }
            }, this));

            $header.find('div:nth-child(2)').addClass('active');
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
                            .addClass('kb-side-overlay-container');
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
                Jupyter.narrative.disableKeyboardManager();
                this.$narrativeDimmer.show();
                this.$elem.find('.kb-side-header, .kb-side-toggle').addClass('kb-overlay-active');
                this.$overlay.show('slide', 'fast', $.proxy(function() {
                    this.trigger('sidePanelOverlayShown.Narrative');
                }, this));
            }
        },

        hideOverlay: function() {
            if (this.$overlay) {
                Jupyter.narrative.enableKeyboardManager();
                this.$narrativeDimmer.hide();
                this.$elem.find('.kb-side-header, .kb-side-toggle').removeClass('kb-overlay-active');
                this.$overlay.hide('slide', 'fast', $.proxy(function() {
                    this.trigger('sidePanelOverlayHidden.Narrative');
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
                                 .addClass('kb-side-separator')
                                 .css({'height' : height + '%'});

                retObj[widgetInfo.name] = $widgetDiv[widgetInfo.name](widgetInfo.params);
                $panelSet.append($widgetDiv);
            }
            retObj['panelSet'] = $panelSet;
            return retObj;
        },


        /**
         * Specialized callback controlling heights of panels when data panel is minimized.
         * Assumes data and method panel are on the same tab.
         */
        handleMinimizedDataPanel: function(isMinimized) {
            if(isMinimized) {
                // data panel was minimized
                this.$methodsWidget.setListHeight(this.methodsWidgetListHeight[1], true);
            } else {
                // data panel was maximized
                this.$methodsWidget.setListHeight(this.methodsWidgetListHeight[0], true);
            }
        },

        /**
         * Specialized callback controlling heights of panels when method panel is minimized.
         * Assumes data and method panel are on the same tab.
         */
        handleMinimizedMethodPanel: function(isMinimized) {
            if(isMinimized) {
                // data panel was minimized
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[1], true);
            } else {
                // data panel was maximized
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[0], true);
            }
        },


        windowSizeChange: function() {

            // determine height of panels, and set the bounds
            var $window = $(window);
            var h = $window.height();

            if(h<300) { // below a height of 300px, don't trim anymore, just let the rest be clipped
                h = 300;
            }
            var max = h - this.heightListOffset;
            var min = (h-this.heightListOffset)/2;
            this.methodsWidgetListHeight[0]=min;
            this.methodsWidgetListHeight[1]=max;
            this.dataWidgetListHeight[0]=min;
            this.dataWidgetListHeight[1]=max;

            // actually update the sizes
            if(this.$methodsWidget.isMinimized()) {
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[1]);
            } else {
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[0]);
            }
            if(this.$dataWidget.isMinimized()) {
                this.$methodsWidget.setListHeight(this.methodsWidgetListHeight[1]);
            } else {
                this.$methodsWidget.setListHeight(this.methodsWidgetListHeight[0]);
            }

            var fullSize = h - this.heightPanelOffset;
            this.$narrativesWidget.setHeight(fullSize);
            this.$jobsWidget.setHeight(fullSize);
        },


        render: function() {
            this.initOverlay();
            this.$methodsWidget.refreshFromService();
        }

    })
});
