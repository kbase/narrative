define([
    'kbwidget',
    'jquery',
    'base/js/namespace',
    'kbaseNarrativeDataPanel',
    'kbaseNarrativeAppPanel',
    'kbaseNarrativeManagePanel',
    'kbaseNarrativeOutlinePanel'
], (
    KBWidget,
    $,
    Jupyter,
    kbaseNarrativeDataPanel,
    kbaseNarrativeAppPanel,
    kbaseNarrativeManagePanel,
    kbaseNarrativeOutlinePanel
) => {
    'use strict';
    return KBWidget({
        name: 'kbaseNarrativeSidePanel',

        options: {
            autorender: true,
        },
        $dataWidget: null,
        dataWidgetListHeight: [340, 680], // [height with methods showing, max height], overwritten on window size change
        $methodsWidget: null,
        methodsWidgetListHeight: [300, 600], // [height with data showing, max height]

        heightListOffset: 220, // in px, space taken up by titles, header bar, etc.  The rest of the real estate is divided
        // by half for for the method and data lists
        heightPanelOffset: 110, // in px, space taken by just the header, the rest is for the full panel size, which is the
        // case for the narratives/jobs panels
        $narrativesWidget: null,
        $overlay: null,

        hideButtonSize: 4, //percent width

        /**
         * Does the initial panel layout - tabs and spots for each widget
         * It then instantiates them, but not until told to render (unless autorender = true)
         */
        init: function (options) {
            this._super(options);
            const analysisWidgets = this.buildPanelSet([
                {
                    name: 'kbaseNarrativeDataPanel',
                    params: {
                        collapseCallback: $.proxy(function (isMinimized) {
                            this.handleMinimizedDataPanel(isMinimized);
                        }, this),
                    },
                },
                {
                    name: 'kbaseNarrativeAppPanel',
                    params: {
                        autopopulate: false,
                        collapseCallback: $.proxy(function (isMinimized) {
                            this.handleMinimizedMethodPanel(isMinimized);
                        }, this),
                    },
                },
            ]);
            this.$dataWidget = analysisWidgets['kbaseNarrativeDataPanel'];
            this.$methodsWidget = analysisWidgets['kbaseNarrativeAppPanel'];

            const $analysisPanel = analysisWidgets['panelSet'];

            const manageWidgets = this.buildPanelSet([
                {
                    name: 'kbaseNarrativeManagePanel',
                    params: { autopopulate: false, showTitle: false },
                },
            ]);

            this.$narrativesWidget = manageWidgets['kbaseNarrativeManagePanel'];
            const $managePanel = manageWidgets['panelSet'];

            const outlineWidgets = this.buildPanelSet([
                {
                    name: 'kbaseNarrativeOutlinePanel',
                    params: { autopopulate: false, showTitle: false },
                },
            ]);

            this.$outlineWidget = outlineWidgets['kbaseNarrativeOutlinePanel'];
            const $outlinePanel = outlineWidgets['panelSet'];

            this.$tabs = this.buildTabs(
                [
                    {
                        tabName: 'Analyze',
                        content: $analysisPanel,
                        widgets: [this.$dataWidget, this.$methodsWidget],
                    },
                    {
                        tabName: 'Narratives',
                        content: $managePanel,
                        widgets: [this.$narrativesWidget],
                    },
                    {
                        tabName: 'Outline',
                        content: $outlinePanel,
                        widgets: [this.$outlineWidget],
                    },
                ],
                true
            );

            this.$elem.addClass('kb-side-panel');
            this.$elem.append(this.$tabs.header).append(this.$tabs.body);

            $(document).on('showSidePanelOverlay.Narrative', (event, $panel) => {
                this.showOverlay($panel);
            });

            $(document).on('hideSidePanelOverlay.Narrative', (event, $panel) => {
                this.hideOverlay($panel);
            });

            $(document).on('toggleSidePanelOverlay.Narrative', (event, $panel) => {
                this.toggleOverlay($panel);
            });

            // handle window size change in left panel, and call it once to set the correct size now
            $(window).on(
                'resize',
                $.proxy(function () {
                    this.windowSizeChange();
                }, this)
            );
            this.windowSizeChange();

            if (this.autorender) {
                this.render();
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
        setReadOnlyMode: function (readOnly) {
            this.$dataWidget.setReadOnlyMode(readOnly);
            this.$methodsWidget.setReadOnlyMode(readOnly);
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
        buildTabs: function (tabs, isOuter) {
            const $header = $('<div>');
            const $body = $('<div>');
            $body.addClass('narrative-side-panel-content');
            $body.css('height', 'calc(100% - 45px)');

            $header.append(
                $('<div>')
                    .addClass('kb-side-toggle')
                    .css('width', this.hideButtonSize + '%')
                    .append($('<span>').addClass('fa fa-caret-left'))
                    .click(() => {
                        Jupyter.narrative.toggleSidePanel();
                    })
            );
            for (let i = 0; i < tabs.length; i++) {
                const tab = tabs[i];
                $header.append(
                    $('<div>')
                        .addClass('kb-side-header')
                        .css('width', (100 - this.hideButtonSize) / tabs.length + '%')
                        .append(tab.tabName)
                        .attr('kb-data-id', i)
                );
                $body.append(
                    $('<div>').addClass('kb-side-tab').append(tab.content).attr('kb-data-id', i)
                );
            }

            $header.find('div[kb-data-id]').click(
                $.proxy(function (event) {
                    const $headerDiv = $(event.currentTarget);

                    if (!$headerDiv.hasClass('active')) {
                        const idx = $headerDiv.attr('kb-data-id');
                        $header.find('div').removeClass('active');
                        $headerDiv.addClass('active');
                        $body.find('div.kb-side-tab').removeClass('active');
                        $body.find('[kb-data-id=' + idx + ']').addClass('active');
                        tabs[idx].widgets.forEach((w) => {
                            w.activate();
                        });
                        if (isOuter) this.hideOverlay();
                    }
                }, this)
            );

            $header.find('div:nth-child(2)').addClass('active');
            $body.find('div:first-child.kb-side-tab').addClass('active');
            tabs[0].widgets.forEach((w) => {
                w.activate();
            });

            return {
                header: $header,
                body: $body,
            };
        },

        initOverlay: function () {
            const self = this;

            this.$overlayBody = $('<div class="kb-overlay-body">');
            this.$overlayFooter = $('<div class="kb-overlay-footer">');
            this.$overlay = $('<div>')
                .attr('data-test-id', 'side-overlay-container')
                .addClass('kb-side-overlay-container');

            $('body').append(this.$overlay);
            this.$overlay.hide();

            this.$narrativeDimmer = $('<div>').addClass('kb-overlay-dimmer');

            $('body').append(this.$narrativeDimmer);
            this.$narrativeDimmer.hide();
            this.updateOverlayPosition();

            // hide panel when clicking outside
            this.$narrativeDimmer.unbind('click');
            this.$narrativeDimmer.click(() => {
                self.hideOverlay();
            });
        },

        updateOverlayPosition: function () {
            this.$overlay.position({ my: 'left top', at: 'right top', of: this.$elem });
            this.$narrativeDimmer.position({ my: 'left top', at: 'right top', of: this.$elem });
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
        toggleOverlay: async function ($panel) {
            if (this.$overlay.is(':visible')) {
                await this.hideOverlay();
                if ($panel && $panel !== this.$currentPanel) {
                    await this.showOverlay($panel);
                }
            } else await this.showOverlay($panel);
        },

        showOverlay: function ($panel) {
            return new Promise((resolve) => {
                if (!this.$overlay || this.$overlay.is(':visible')) {
                    resolve();
                    return;
                }
                this.trigger('sidePanelOverlayShowing.Narrative', [$panel]);
                if ($panel) {
                    if (this.$currentPanel) {
                        this.$currentPanel.detach();
                    }
                    this.$overlay.append($panel);
                    this.$currentPanel = $panel;
                }
                Jupyter.narrative.disableKeyboardManager();
                this.$narrativeDimmer.show();
                this.$elem.find('.kb-side-header, .kb-side-toggle').addClass('kb-overlay-active');
                this.$overlay.show('slide', 'fast', () => {
                    this.trigger('sidePanelOverlayShown.Narrative');
                    resolve();
                });
            });
        },

        hideOverlay: function () {
            return new Promise((resolve) => {
                if (!this.$overlay || !this.$overlay.is(':visible')) {
                    resolve();
                    return;
                }
                this.trigger('sidePanelOverlayHiding.Narrative', [this.$currentPanel]);
                Jupyter.narrative.enableKeyboardManager();
                this.$narrativeDimmer.hide();
                this.$elem
                    .find('.kb-side-header, .kb-side-toggle')
                    .removeClass('kb-overlay-active');
                this.$overlay.hide('slide', 'fast', () => {
                    this.trigger('sidePanelOverlayHidden.Narrative');
                    resolve();
                });
            });
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
        buildPanelSet: function (widgets) {
            const $panelSet = $('<div>').addClass('kb-narr-side-panel-set').css('height', '100%');
            if (
                !widgets ||
                Object.prototype.toString.call(widgets) !== '[object Array]' ||
                widgets.length === 0
            )
                return $panelSet;

            const retObj = {};
            for (const widgetInfo of widgets) {
                const $widgetDiv = $('<div>').addClass('kb-side-separator');

                const constructor_mapping = {
                    kbaseNarrativeDataPanel: kbaseNarrativeDataPanel,
                    kbaseNarrativeAppPanel: kbaseNarrativeAppPanel,
                    kbaseNarrativeManagePanel: kbaseNarrativeManagePanel,
                    kbaseNarrativeOutlinePanel: kbaseNarrativeOutlinePanel,
                };
                retObj[widgetInfo.name] = new constructor_mapping[widgetInfo.name](
                    $widgetDiv,
                    widgetInfo.params
                );
                $panelSet.append($widgetDiv);
            }
            retObj['panelSet'] = $panelSet;
            return retObj;
        },

        /**
         * Specialized callback controlling heights of panels when data panel is minimized.
         * Assumes data and method panel are on the same tab.
         */
        handleMinimizedDataPanel: function (isMinimized) {
            if (isMinimized) {
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
        handleMinimizedMethodPanel: function (isMinimized) {
            if (isMinimized) {
                // data panel was minimized
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[1], true);
            } else {
                // data panel was maximized
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[0], true);
            }
        },

        windowSizeChange: function () {
            // determine height of panels, and set the bounds
            const $window = $(window);
            let h = $window.height();

            if (h < 300) {
                // below a height of 300px, don't trim anymore, just let the rest be clipped
                h = 300;
            }
            const max = h - this.heightListOffset;
            const min = (h - this.heightListOffset) / 2;
            this.methodsWidgetListHeight[0] = min;
            this.methodsWidgetListHeight[1] = max;
            this.dataWidgetListHeight[0] = min;
            this.dataWidgetListHeight[1] = max;

            // actually update the sizes
            if (this.$methodsWidget.isMinimized()) {
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[1]);
            } else {
                this.$dataWidget.setListHeight(this.dataWidgetListHeight[0]);
            }
            if (this.$dataWidget.isMinimized()) {
                this.$methodsWidget.setListHeight(this.methodsWidgetListHeight[1]);
            } else {
                this.$methodsWidget.setListHeight(this.methodsWidgetListHeight[0]);
            }

            const fullSize = h - this.heightPanelOffset;
            this.$narrativesWidget.setHeight(fullSize);
        },

        render: function () {
            this.initOverlay();
        },
    });
});
