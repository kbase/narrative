/*

    Easy widget to serve as a tabbed container.

    var $tabs =  new kbaseTabs($('#tabs'), {
            tabPosition : 'bottom', //or left or right or top. Defaults to 'top'
            canDelete : true,       //whether or not the tab can be removed. Defaults to false.
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

    useful methods would be:

    $('#tabs').kbaseTabs('showTab', 'T1');
    $('#tabs').kbaseTabs('addTab', tabObject);  //the tabObject defined up above

*/

define(['kbwidget', 'bootstrap', 'jquery', 'kbaseDeletePrompt'], (
    KBWidget,
    bootstrap,
    $,
    kbaseDeletePrompt
) => {
    'use strict';
    
    return KBWidget({
        name: 'kbaseTabs',

        version: '1.0.0',

        _accessors: ['tabsHeight'],

        options: {
            tabPosition: 'top',
            canDelete: false,
            borderColor: 'lightgray',
        },

        init: function (options) {
            this._super(options);

            this.data('tabs', {});
            this.data('nav', {});

            this.tabHistory = [];

            this.appendUI($(this.$elem));

            return this;
        },

        appendUI: function ($elem, tabs) {
            if (tabs == undefined) {
                tabs = this.options.tabs;
            }

            const $block = $('<div></div>').addClass('tabbable');
            const $tabs = $('<div></div>')
                .addClass('tab-content')
                .attr('id', 'tabs-content')
                .css('height', this.tabsHeight());
            const $nav = $('<ul role="tablist"></ul>')
                .addClass('nav nav-tabs')
                .attr('id', 'tabs-nav');
            $block.append($nav).append($tabs);

            this._rewireIds($block, this);

            $elem.append($block);

            if (tabs) {
                $.each(
                    tabs,
                    $.proxy(function (idx, tab) {
                        this.addTab(tab);
                    }, this)
                );
            }
        },

        addTab: function (tab) {
            if (tab.canDelete == undefined) {
                tab.canDelete = this.options.canDelete;
            }

            const $tab = $('<div role="tabpanel"></div>').addClass('tab-pane fade');

            $tab.hasContent = false;
            if (tab.content) {
                $tab.append(tab.content);
                $tab.hasContent = true;
            }

            if (this.options.border) {
                $tab.css('border', 'solid ' + this.options.borderColor);
                $tab.css('border-width', '0px 1px 0px 1px');
                $tab.css('padding', '3px');
            }

            const $that = this;

            const $nav = $('<li role="tab"></li>')
                .css('white-space', 'nowrap')
                .append(
                    $('<a></a>')
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
                                    $that.tabHistory.push(tab);
                                    $tab.trigger({
                                        type: 'shown',
                                        relatedTarget: previous,
                                    });
                                }
                            );

                            // This is our stuff.
                            if (!$tab.hasContent) {
                                if (tab.showContentCallback) {
                                    $tab.append(tab.showContentCallback($tab));
                                    if (!tab.dynamicContent) {
                                        $tab.hasContent = true;
                                    }
                                }
                            }
                        })
                        .append(
                            $('<button></button>')
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
                                        if (tab.deleteCallback != undefined) {
                                            tab.deleteCallback(tab.tab);
                                        } else {
                                            this.deletePrompt(tab.tab);
                                        }
                                    }, this)
                                )
                        )
                );

            // TODO: only add the button in the first place if the tab can be deleted.
            if (!tab.canDelete) {
                $nav.find('button').remove();
            }

            this.data('tabs')[tab.tab] = $tab;
            this.data('nav')[tab.tab] = $nav;

            this.data('tabs-content').append($tab);
            this.data('tabs-nav').append($nav);

            const tabCount = this.data('tabs').length;
            if (tab.show || tabCount == 1) {
                this.showTab(tab.tab);
            }
        },

        deleteTabToolTip: function (tabName) {
            return 'Remove ' + tabName;
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

            // Remove this tab from all of history.
            this.tabHistory = this.tabHistory.filter((tab) => {
                return tab.tab !== tabName;
            });

            const deleteTab = () => {
                $tab.remove();
                $nav.remove();

                delete this.data('tabs')[tabName];
                delete this.data('nav')[tabName];
            };

            if ($nav.hasClass('active')) {
                if (this.tabHistory.length > 0) {
                    const nextTab = this.tabHistory.pop();
                    const $nextNav = this.data('nav')[nextTab.tab];
                    const $nextTab = this.data('tabs')[nextTab.tab];
                    $nextTab.one('shown', () => {
                        deleteTab();
                    });
                    $nextNav.find('a').trigger('click');
                } else {
                    deleteTab();
                }
            } else {
                deleteTab();
            }
        },

        deletePrompt: function (tabName) {
            const $deleteModal = new kbaseDeletePrompt($('<div></div>'), {
                name: tabName,
                callback: this.deleteTabCallback(tabName),
            });
            $deleteModal.openPrompt();
        },

        deleteTabCallback: function (tabName) {
            return $.proxy(function (e, $prompt) {
                if ($prompt != undefined) {
                    $prompt.closePrompt();
                }

                this.removeTab(tabName);
            }, this);
        },

        activeTab: function () {
            const activeNav = this.data('tabs-nav').find('.active:last a')[0];
            return $(activeNav).attr('data-tab');
        },
    });
});
