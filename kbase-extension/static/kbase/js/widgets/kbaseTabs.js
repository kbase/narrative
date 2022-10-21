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

            const $block = $('<div>').addClass('tabbable');
            const $tabs = $('<div>').addClass('tab-content').attr('id', 'tabs-content');
            const $nav = $('<ul role="tablist" />').addClass('nav nav-tabs').attr('id', 'tabs-nav');
            $block.append($nav).append($tabs);

            this._rewireIds($block, this);

            $elem.append($block);

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

        addTab: function (tab) {
            if (typeof tab.canDelete === 'undefined') {
                tab.canDelete = this.options.canDelete;
            }

            const $tab = $('<div role="tabpanel"></div>').addClass('tab-pane fade');

            $tab.hasContent = false;

            const $that = this;

            const $navButton = $('<a>')
                .attr('href', '#')
                .text(tab.tab)
                .attr('data-tab', tab.tab)
                .bind('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();

                    // NB this function mimics bootstrap tab's "show" method.

                    const previous = $that.data('tabs-nav').find('.active:last a')[0];

                    // Danger: this calls the internal api for bootstrap tabs; that is
                    // where the mysterious "activate" lives.

                    // Deactivates the currently active tab
                    $.fn.tab.Constructor.prototype.activate.call(
                        $(this),
                        $(this).parent('li'),
                        $that.data('tabs-nav')
                    );

                    // Activate this tab, and emit events.
                    $.fn.tab.Constructor.prototype.activate.call(
                        $(this),
                        $tab,
                        $tab.parent(),
                        () => {
                            $tab.trigger({
                                type: 'shown',
                                relatedTarget: previous,
                            });
                        }
                    );

                    // Rendering of the tab pane
                    if (!$tab.hasContent) {
                        if (tab.content) {
                            $tab.append(tab.content);
                            $tab.hasContent = true;
                        } else if (tab.showContentCallback) {
                            try {
                                $tab.html(tab.showContentCallback($tab));
                            } catch (ex) {
                                $tab.html($ErrorMessage(ex));
                            }
                            if (!tab.dynamicContent) {
                                $tab.hasContent = true;
                            }
                        }
                    }
                });

            if (tab.canDelete) {
                $navButton.append(
                    $('<button>')
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
                        )
                );
            }

            const $nav = $('<li role="tab"></li>').css('white-space', 'nowrap').append($navButton);

            this.data('tabs')[tab.tab] = $tab;
            this.data('nav')[tab.tab] = $nav;

            this.data('tabs-content').append($tab);
            this.data('tabs-nav').append($nav);

            const tabCount = this.data('tabs').length;
            if (tab.show || tabCount === 1) {
                this.showTab(tab.tab);
            }
        },

        hasTab: function (tabName) {
            return this.data('tabs')[tabName];
        },

        showTab: function (tab) {
            this.data('nav')[tab].find('a').trigger('click');
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
                    if ($deleteModal) {
                        $deleteModal.closePrompt();
                    }
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
