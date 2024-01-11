/*
    Easy widget to serve as a tabbed container.

    It is an extension of the Bootstrap 3 tab
    (https://getbootstrap.com/docs/3.4/javascript/#tabs).
    
    Below is a commented usage example:

    const $tabs =  new kbaseTabs($('#tabs'), {
        // boolean; whether a tab which does not otherwise specify this option
        // will have a close button and can be removed. Defaults to false, overridden
        // if set on a tab.
        canDelete : true,
    
        tabs : [
            {
                // string; label of the tab
                tab : 'First Tab',
    
                // jquery "content" (string markup, string text, element, jquery
                // object); displayed as the tab pane content; note will be displayed
                // "eagerly", i.e. when tab is created (not on first render)
                content : $('<div></div>').html("I am a tab"),  
    
                // boolean; if true, the tab will have a close button, the clicking of
                // which will cause the tab navigation and tab pane to be removed.
                canDelete : true

                // boolean; if true, the tab will pop up a confirmation dialog when
                // the close button is clicked
                confirmDelete: true
            },
            {
                tab : 'Second Tab',
                content : $('<div></div>').html("I am a tab 2")
            },
            {
                tab : 'Tab the Third',
    
                // boolean; If true the tab is shown by default. If not specified, the first
                // tab is shown.
                show : true,
    
                // function returning jquery "content" (see above); renders tab pane
                // content to enable "lazy" rendering of a tab pane when the
                // corresponding tab is shown.
                // In modern times, this is known commonly named "render"
                showContentCallback: function($element) {
                    $element.html('hello');
                }
            }
        ]
    });
*/

define([
    'kbwidget',
    'jquery',
    'uuid',
    'widgets/kbaseConfirmationPrompt',
    'widgets/common/ErrorMessage',

    // For effect
    'bootstrap',
], (KBWidget, $, UUID, $ConfirmationPrompt, $ErrorMessage) => {
    'use strict';

    const $el = (tagName) => {
        return $(document.createElement(tagName));
    };

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

            const $tabset = $el('div').addClass('tabbable');

            const $tabs = $el('div').addClass('tab-content').attr('id', 'tabs-content');

            const $nav = $el('ul')
                .attr('role', 'tablist')
                .addClass('nav nav-tabs')
                .attr('id', 'tabs-nav');

            $tabset.append($nav).append($tabs);

            this._rewireIds($tabset, this);

            $elem.append($tabset);

            if (tabs && tabs.length > 0) {
                // defaults to first tab being active if none are set as active by
                // default.
                const shownTabCount = tabs.filter(({ show }) => show).length;

                if (shownTabCount == 0) {
                    // No tabs configured to show? Okay, then show the first one.
                    tabs[0].show = true;
                } else if (shownTabCount > 1) {
                    // More than one tab configured to show? This is a programmer error,
                    // but let's be nice and only show the first, but issue an warning
                    // to the console.
                    console.warn(
                        'more than one tab configured to show; only showing the first one'
                    );

                    let shownTabSelected = false;
                    for (const tab of tabs) {
                        if (tab.show) {
                            if (shownTabSelected) {
                                tab.show = false;
                            } else {
                                shownTabSelected = true;
                            }
                        }
                    }
                }

                tabs.forEach((tab) => {
                    this.addTab(tab);
                });
            }
        },

        renderDeleteTabButton: function (tab) {
            return $el('button')
                .addClass('btn btn-default btn-xs kbaseTabs-delete-button')
                .append($el('span').addClass('fa fa-times'))
                .bind(
                    'click',
                    $.proxy(function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        // If a delete callback is defined, avoid the confirmation dialog.
                        if (typeof tab.deleteCallback !== 'undefined') {
                            tab.deleteCallback(tab.tab);
                        } else {
                            const confirmDelete = (() => {
                                if (typeof tab.confirmDelete === 'undefined') {
                                    return this.options.confirmDelete;
                                }
                                return this.tab.confirmDelete;
                            })();

                            if (confirmDelete) {
                                this.deletePrompt(tab.tab);
                            } else {
                                this.removeTab(tab.tab);
                            }
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
            
            const $tabPanel = $el('div')
                .attr('role', 'tabpanel')
                .addClass('tab-pane fade');

            $tabPanel.hasContent = false;

            // Note - this code implements eager tab rendering if the "content" for a
            // tab is already set. The "content" property essentially implements static
            // tab content.
            //
            // So, I was wondering why have such eager insertion of tab pane content
            // into the DOM? It does not seem necessary for kbaseTabs logic, as there
            // are callbacks for tab display.
            //
            // However, there are tab usages in the codebase which presume that after
            // the tab is created, that all tab content is rendered and inserted into
            // the DOM.
            //
            // E.g. in kbaseExpressionFeatureClusters the content contains links which
            // are treated as buttons, whose event handlers are added as the tabset is
            // constructed.
            //
            // There may be reasons for this, but it does seem that, given the onShown
            // or whenShown callbacks, per-tab setup logic could (should) be implemented
            // lazily through these callbacks, even for otherwise static content.
            //
            if (tab.content) {
                $tabPanel.append(tab.content);
                $tabPanel.hasContent = true;
            }

            // We need to preserve "this" for the jquery "click" handling below, since
            // that code uses the jquery logic for "this".
            const $widget = this;

            // Create the tab button itself.
            const $navButton = $el('a')
                .attr('href', '#')
                .addClass('kbaseTabs-tab')
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

                    // Optionally take some action after the tab is rendered.
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

            const $nav = $el('li')
                .attr('role', 'tab')
                .css('white-space', 'nowrap')
                .append($navButton);

            this.data('tabs')[tab.tab] = $tabPanel;
            this.data('nav')[tab.tab] = $nav;

            this.data('tabs-content').append($tabPanel);
            this.data('tabs-nav').append($nav);

            // A tab requests that it be shown.
            //
            // Note that the use case for this is more complicated than it may appear at
            // first glance.
            //
            // Primary use cases:
            //
            // For tabsets which provide all tabs via the constructor and don't specify
            // "show" on a tab, the initial tab will be set to "show" in the
            // constructor.
            //
            // For tabs which are dynamically added, the "show" property on that tab
            // will indicate that it should be shown as it is added.
            //
            // Less common use cases:
            //
            // The ui is invoked with the initial tab parameterized, and the code which
            // creates the tabset uses that to select a tab other than the first one as
            // selected. I'm not sure that there is any usage of this in the narrative
            // codebase.
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
                    }
                    if ($nav.prev('li').length) {
                        return [$nav.prev('li'), $tab.prev('[role="tabpanel"]')];
                    }
                    return [null, null];
                })();

                if ($nextTab) {
                    // We remove the tab nav button, but hide the tab panel - this
                    // causes it to take up the same space and become transparent. This
                    // helps prevent the tab shrinking then expanding.
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
            const $confirmationPrompt = new $ConfirmationPrompt($('<div>'), {
                title: 'Confirm Tab Deletion',
                message: `Really delete tab <b>${tabName}</b>?`,
                verb: 'Delete Tab',
                onConfirm: (close) => {
                    close();
                    // Do what you want to do
                    this.removeTab(tabName);
                },
            });
            $confirmationPrompt.open();
        },

        activeTab: function () {
            const activeNav = this.data('tabs-nav').find('.active:last a')[0];
            return $(activeNav).attr('data-tab');
        },
    });
});
