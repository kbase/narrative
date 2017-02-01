/*
    // tabs.js widget for creating and displaying tabs

    // Instantiation
    // optional: content, active, removable
    // you can make all tabs or individual tabs removable

        var tabs = $('#ele').tabs();

        //or

        var tabs = $('#ele').tabs({tabs: [
                                {name: 'tab1', content: 'foo text or html', active: true},
                                {name: 'tab2', content: 'text or html 2', removable: true}
                                ]
                              });

    // Add a new tab
    // optional: content, active

        tabs.addTab({name: 'tab3', content: 'new content'})

    // Retrieve a tab button
    // (useful for adding events or other stuff)

        var mytab = tabs.tab('tab1')

    // Add content to existing tab
    // (useful for ajax/event stuff)

        tabs.tab({name: 'tab3', content: 'blah blah blah'})

    // manually show a tab
    // Tab panes are shown when clicked automatically.
    // This is a programmatic way of showing a tab.

        tabs.showTab('tab_name');
*/

define(['kbwidget', 'jquery', 'bootstrap'],
function(KBWidget, $, bootstrap) {

    return KBWidget({
        name: "kbaseTabTableTabs",
        version: "1.0.0",
        init: function(options) {

            this._super(options);
            if (!options) options = {};
            var container = this.$elem;
            var self = this;

            var tabs = $('<ul class="nav nav-'+(options.pills ? 'pills' : 'tabs')+'">');
            var tab_contents = $('<div class="tab-content">');
            container.append(tabs, tab_contents);

            // adds a single tab and content
            this.addTab = function(p) {
                // if tab exists, don't add
                if ( tabs.find('a[data-id="'+p.name+'"]').length > 0)
                    return;

                var tab = $('<li class="'+(p.active ? 'active' :'')+'">');
                var tab_link = $('<a data-toggle="tab" data-id="'+p.name+'">'+p.name+'</a>');

                // animate by sliding tab up
                if (p.animate === false) {
                    tab.append(tab_link)
                    tabs.append(tab);
                } else {
                    tab.append(tab_link).hide();
                    tabs.append(tab);
                    tab.toggle('slide', {direction: 'down', duration: 'fast'});
                }

                // add close button if needed
                if (p.removable || options.removable) {
                    var rm_btn = $('<span class="glyphicon glyphicon-remove">');
                    tab_link.append(rm_btn);

                    rm_btn.click(function(e) {
                        self.rmTab(p.name)
                    })
                }

                // add content pane
                var c = $('<div class="tab-pane '+(p.active ? 'active' :'')+'" data-id="'+p.name+'">')
                c.append((p.content ? p.content : ''))
                tab_contents.append(c);

                tab.click(function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var id = $(this).find('a').data('id');
                    self.showTab(id);
                })

                return p.content;
            }

            // remove tab and tab content
            this.rmTab = function(name) {
                var tab = tabs.find('a[data-id="'+name+'"]').parent('li');
                var tab_content = tab_contents.children('[data-id="'+name+'"]')

                // get previous or next tab
                if (tab.next().length > 0)
                    var id = tab.next().children('a').data('id');
                else
                    var id = tab.prev().children('a').data('id');

                // remove the tab
                tab.remove();
                tab_content.remove();

                // show prev or next tab
                self.showTab(id);
            }

            // returns tab
            this.tab = function(name) {
                return tabs.children('[data-id="'+name+'"]');
            }

            // returns content of tab
            this.tabContent = function(name) {
                return tab_contents.children('[data-id="'+name+'"]');
            }

            // adds content to existing tab pane; useful for ajax
            this.addContent = function(p) {
                var c = tab_contents.children('[data-id="'+p.name+'"]')
                c.append((p.content ? p.content : ''));

                return c;
            }

            // highlights tab and shows content
            this.showTab = function(id) {
                tabs.children('li').removeClass('active');
                tab_contents.children('.tab-pane').removeClass('active');

                tabs.find('a[data-id="'+id+'"]').parent().addClass('active');
                tab_contents.children('[data-id="'+id+'"]').addClass('active');
            }

            this.getTabNav = function() {
                return tabs;
            }

            // if tabs are supplied, add them
            // don't animate intial tabs
            if ('tabs' in options) {
                for (var i in options.tabs) {
                    var p = $.extend(options.tabs[i], {animate: false})
                    this.addTab(p)
                }
            }


            return this;
        },
    });
})
