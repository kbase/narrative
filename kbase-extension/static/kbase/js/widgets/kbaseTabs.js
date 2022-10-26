/*

    Easy widget to serve as a tabbed container.

    It is an extension of the Bootstrap 3 tab (https://getbootstrap.com/docs/3.4/javascript/#tabs).

    The primary customizations are:
    - tabs can be set as deletable
    -

    var $tabs =  new kbaseTabs($('#tabs'), {
            tabPosition : 'bottom', // or 'left' or 'right' or 'top'. Defaults to 'top'
            canDelete : true,       // whether the tab can be removed. Defaults to false.
            tabs : [
                {
                    tab : 'T1',                                     //name of the tab
                    content : $('<div></div>').html("I am a tab"),  //jquery object to stuff into the content
                    canDelete : false,                              //override the canDelete param on a per tab basis
                },
                {
                    tab : 'T2',
                    content : $('<div></div>').html("I am a tab 2"),
                },
                {
                    tab : 'T3',
                    content : $('<div></div>').html("I am a tab 3"),
                    show : true,                                    //boolean. This tab gets shown by default. If not specified, the first tab is shown
                    showContentCallback: function // if you don't want to show the content right away, add a callback method that returns the content...
                },
            ],
        }
    );
*/

define([
    'kbwidget',
    'jquery',
    'kbaseDeletePrompt',
    'widgets/common/ErrorMessage',

    // For effect
    'bootstrap',
], (KBWidget, $, kbaseDeletePrompt, $ErrorMessage) => {
    'use strict';
    return KBWidget({
        name: 'kbaseTabs',

        version: '1.1.0',

        options: {
            canDelete: false,
            confirmDelete: true,
        },

        init: function (options) {
            this._super(options);

            this.data('tabs', {});
            this.data('nav', {});

            this.appendUI($(this.$elem));

            return this;
        },

        appendUI: function ($elem, tabs) {
            if (typeof tabs === 'undefined') {
                tabs = this.options.tabs;
            }

            const $tabset = $('<div>').addClass('tabbable');

            const $tabs = $('<div>').addClass('tab-content').attr('id', 'tabs-content');

            const $nav = $('<ul role="tablist" />').addClass('nav nav-tabs').attr('id', 'tabs-nav');

            $tabset.append($nav).append($tabs);

            this._rewireIds($tabset, this);

            $elem.append($tabset);

            if (tabs && tabs.length > 0) {
                // defaults to first tab being active if none are set as active by default.
                if (
                    !tabs.some((tab) => {
                        return tab.show;
                    })
                ) {
                    tabs[0].show = true;
                }
                tabs.forEach((tab) => {
                    this.addTab(tab);
                });
            }
        },

        renderDeleteTabButton: function (tab) {
            return $('<button>')
                .addClass('btn btn-default btn-xs')
                .append($('<span>').append('&#x2716;'))
                .css('padding', '0px')
                .css('width', '12px')
                .css('height', '12px')
                .css('margin-left', '10px')
                .css('font-size', '10px')
                .css('margin-bottom', '3px')
                .css('outline', 'none')
                .css('border', '0')
                .bind(
                    'click',
                    $.proxy(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (typeof tab.deleteCallback !== 'undefined') {
                            tab.deleteCallback(tab.tab);
                        } else if (typeof tab.confirmDelete === 'undefined') {
                            // In this case, there is no confirmDelete set on the tab,
                            // so we default to the global behavior.
                            if (
                                typeof this.options.confirmDelete === 'undefined' ||
                                this.options.confirmDelete
                            ) {
                                this.deletePrompt(tab.tab);
                            } else {
                                this.removeTab(tab.tab);
                            }
                        } else if (tab.confirmDelete) {
                            this.deletePrompt(tab.tab);
                        } else {
                            this.removeTab(tab.tab);
                        }
                    }, this)
                );
        },

        renderTabPanel: function (tab, $tabPanel) {
            // This may be called before the tab is added
            $tabPanel = $tabPanel || this.data('tabs')[tab.tab];
            if ($tabPanel.hasContent) {
                return;
            }
            if (tab.content) {
                $tabPanel.append(tab.content);
                $tabPanel.hasContent = true;
            } else if (tab.showContentCallback) {
                try {
                    $tabPanel.html(tab.showContentCallback($tabPanel));
                } catch (ex) {
                    $tabPanel.html($ErrorMessage(ex));
                }
                if (!tab.dynamicContent) {
                    $tabPanel.hasContent = true;
                }
            }
        },

        addTab: function (tab) {
            if (typeof tab.canDelete === 'undefined') {
                tab.canDelete = this.options.canDelete;
            }

            const $tabPanel = $('<div role="tabpanel"></div>').addClass('tab-pane fade');

            $tabPanel.hasContent = false;

            // TODO: this is a hack, remove it!
            // NOTE: So, I was wondering why this code is here? It is not necessary for the
            // kbaseTabs logic. However,  there are tab usages which presume that after the tab
            // is created, that all tab content is rendered and inserted into the DOM.
            // E.g. in kbaseExpressionFeatureClusters the content contains links which are treated as buttons,
            // whose event handlers are added as the tabset is rendered.
            // Any post-tab-render, per-tab logic should be handled by the onShown or whenShown callbacks.
            // Note that this approach will fail if a tab uses "showContentCallback".
            // However, if we use this.showTabPanel() here to possibly invoke showContentCallback, it obviates
            // the whole lazy nature of showContentCallback!
            // In other words, we need to keep this here as it is, until we can fix code which relies upon
            // this behavior.
            // Probably better is to fork this widget and it can incrementally spread throughout the codebase
            // until there are no usages of the old one left, then remove it.
            if (tab.content) {
                $tabPanel.append(tab.content);
                $tabPanel.hasContent = true;
            }

            // We need to preserve "this" for the jquery "click" handling below, since that code
            // uses the jquery logic for "this".
            const $widget = this;

            // Create the tab button itself.
            const $navButton = $('<a>')
                .attr('href', '#')
                .text(tab.tab)
                .attr('data-tab', tab.tab)
                .bind('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // NB this function mimics bootstrap tab's "show" method.
                    const previous = $widget.data('tabs-nav').find('.active:last a')[0];

                    // Danger: this calls the internal api for bootstrap tabs; that is
                    // where the mysterious "activate" lives.

                    // Deactivates the currently active tab
                    $.fn.tab.Constructor.prototype.activate.call(
                        $(this),
                        $(this).parent('li'),
                        $widget.data('tabs-nav')
                    );

                    // Rendering of the tab pane
                    $widget.renderTabPanel(tab, $tabPanel);

                    // Activate this tab, and emit events.
                    $.fn.tab.Constructor.prototype.activate.call(
                        $(this),
                        $tabPanel,
                        $tabPanel.parent(),
                        () => {
                            $tabPanel.trigger({
                                type: 'shown',
                                relatedTarget: previous,
                            });
                        }
                    );

                    // Take some action after the tab is rendered.
                    if (tab.onShown) {
                        try {
                            tab.onShown();
                        } catch (ex) {
                            console.error('Error in "onShown"', ex);
                        }
                    }
                });

            // Add the delete button if this is a deletable tab.
            if (tab.canDelete) {
                $navButton.append(this.renderDeleteTabButton(tab));
            }

            const $nav = $('<li role="tab"></li>').css('white-space', 'nowrap').append($navButton);

            this.data('tabs')[tab.tab] = $tabPanel;
            this.data('nav')[tab.tab] = $nav;

            this.data('tabs-content').append($tabPanel);
            this.data('tabs-nav').append($nav);

            // A tab requests that it be shown.
            // Note that the use case for this is more complicated than it may appear at first glance.
            //
            // Primary use cases:
            //
            // For tabsets which provide all tabs via the constructor and don't specify "show" on a tab,
            // the initial tab will be set to "show" in the constructor.
            //
            // For tabs which are dynamically added, the "show" property on that tab will indicate that it
            // should be shown as it is added.
            //
            // Less common use cases:
            //
            // The ui is invoked with the initial tab parameterized, and the code which creates the tabset
            // uses that to select a tab other than the first one as selected. I'm not sure that there is
            // any usage of this in the narrative codebase.
            //
            if (tab.show) {
                this.showTab(tab.tab);
            }
        },

        closeIcon: function () {
            return 'icon-remove';
        },

        deleteTabToolTip: function (tabName) {
            return 'Remove ' + tabName;
        },

        hasTab: function (tabName) {
            return this.data('tabs')[tabName];
        },

        showTab: function (tabName) {
            this.data('nav')[tabName].find('a').trigger('click');
        },

        removeTab: function (tabName) {
            const $tab = this.data('tabs')[tabName];
            const $nav = this.data('nav')[tabName];
            const deleteNav = () => {
                $nav.remove();
                delete this.data('nav')[tabName];
            };

            const deletePanel = () => {
                $tab.remove();
                delete this.data('tabs')[tabName];
            };

            const deleteTab = () => {
                deleteNav();
                deletePanel();
            };

            if ($nav.hasClass('active')) {
                const [$nextTab, $nextPanel] = (() => {
                    if ($nav.next('li').length) {
                        return [$nav.next('li'), $tab.next('[role="tabpanel"]')];
                    } else if ($nav.prev('li').length) {
                        return [$nav.prev('li'), $tab.prev('[role="tabpanel"]')];
                    } else {
                        return [null, null];
                    }
                })();

                if ($nextTab) {
                    // We remove the tab nav button, but hide the tab
                    // panel - this causes it to take up the same space and become
                    // transparent. This helps prevent the tab shrinking then expanding.
                    deleteNav();
                    $tab.css('visibility', 'hidden');

                    // We delete the panel after the new one is shown.
                    $nextPanel.one('shown', () => {
                        deletePanel();
                    });

                    // Simulate a user click of the next tab to display.
                    $nextTab.find('a').trigger('click');
                } else {
                    deleteTab();
                }
            } else {
                deleteTab();
            }
        },

        deletePrompt: function (tabName) {
            const $deleteModal = new kbaseDeletePrompt($('<div>'), {
                name: tabName,
                callback: () => {
                    $deleteModal.closePrompt();
                    this.removeTab(tabName);
                },
            });
            $deleteModal.openPrompt();
        },

        activeTab: function () {
            const activeNav = this.data('tabs-nav').find('.active:last a')[0];
            return $(activeNav).attr('data-tab');
        },
    });
});
