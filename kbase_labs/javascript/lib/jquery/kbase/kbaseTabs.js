/*

    Easy widget to serve as a tabbed container.

    var $tabs = $('#tabs').kbaseTabs(
        {
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
                },
            ],
        }
    );

    useful methods would be:

    $('#tabs').kbaseTabs('showTab', 'T1');
    $('#tabs').kbaseTabs('addTab', tabObject);  //the tabObject defined up above

*/

(function( $, undefined ) {


    $.kbWidget("kbaseTabs", 'kbaseWidget', {
        version: "1.0.0",
        options: {
            tabPosition : 'top',
            canDelete : false,
            borderColor : 'lightgray',
        },

        init: function(options) {

            this._super(options);

            this.data('tabs', {});
            this.data('nav', {});

            this.appendUI( $( this.$elem ) );

            return this;

        },

        appendUI : function ($elem, tabs) {

            if (tabs == undefined) {
                tabs = this.options.tabs;
            }

            var $block =
                $('<div></div>')
                    .addClass('tabbable')
            ;

            var $tabs = $('<div></div>')
                .addClass('tab-content')
                .attr('id', 'tabs-content')
            ;
            var $nav = $('<ul></ul>')
                .addClass('nav nav-tabs')
                .attr('id', 'tabs-nav')
            ;

            if (this.options.tabPosition == 'top') {
                $block.addClass('tabs-above');
                $block.append($nav).append($tabs);
            }
            else if (this.options.tabPosition == 'bottom') {
                $block.addClass('tabs-below');
                $block.append($tabs).append($nav);
            }
            else if (this.options.tabPosition == 'left') {
                $block.addClass('tabs-left');
                $block.append($nav).append($tabs);
            }
            else if (this.options.tabPosition == 'right') {
                $block.addClass('tabs-right');
                $block.append($tabs).append($nav);
            }

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

        addTab : function (tab) {

            if (tab.canDelete == undefined) {
                tab.canDelete = this.options.canDelete;
            }

            var $tab = $('<div></div>')
                .addClass('tab-pane fade')
                .append(tab.content);

            if (this.options.border) {
                $tab.css('border', 'solid ' + this.options.borderColor);
                $tab.css('border-width', '0px 1px 0px 1px');
                $tab.css('padding', '3px');
            }

            var $that = this;   //thanks bootstrap! You suck!

            var $nav = $('<li></li>')
                .css('white-space', 'nowrap')
                .append(
                    $('<a></a>')
                        .attr('href', '#')
                        .text(tab.tab)
                        .attr('data-tab', tab.tab)
                        .bind('click',
                            function (e) {
                                e.preventDefault();
                                e.stopPropagation();

                                var previous = $that.data('tabs-nav').find('.active:last a')[0];

                                //we can't just call 'show' directly, since it requires an href or data-target attribute
                                //on the link which MUST be an idref to something else in the dom. We don't have those,
                                //so we just do what show does and call activate directly.
                                //
                                //oh, but we can't just say $(this).tab('activate',...) because bootstrap is specifically
                                //wired up now to pass along any arguments to methods invoked in this manner.
                                //
                                //Because bootstrap -sucks-.
                                $.fn.tab.Constructor.prototype.activate.call(
                                    $(this),
                                    $(this).parent('li'),
                                    $that.data('tabs-nav')
                                );

                                $.fn.tab.Constructor.prototype.activate.call(
                                    $(this),
                                    $tab,
                                    $tab.parent(),
                                    function () {
                                        $(this).trigger({
                                            type            : 'shown',
                                            relatedTarget   : previous
                                        })
                                    });

                            }
                        )
                    .append(
                        $('<button></button>')
                            .addClass('btn btn-mini')
                            .append($('<i></i>').addClass(this.closeIcon()))
                            .css('padding', '0px')
                            .css('width', '22px')
                            .css('height', '22px')
                            .css('margin-left', '10px')
                            .attr('title', this.deleteTabToolTip(tab.tab))
                            .tooltip()
                            .bind('click', $.proxy(function (e) {
                                e.preventDefault();
                                e.stopPropagation();

                                this.deletePrompt(tab.tab);
                            },this))
                    )
                )
            ;

            if (! tab.canDelete) {
                $nav.find('button').remove();
            }

            this.data('tabs')[tab.tab] = $tab;
            this.data('nav')[tab.tab] = $nav;

            this.data('tabs-content').append($tab);
            this.data('tabs-nav').append($nav);

            var tabCount = 0;
            for (t in this.data('tabs')) { tabCount++; }
            if (tab.show || tabCount == 1) {
                this.showTab(tab.tab);
            }
        },

        closeIcon : function () { return 'icon-remove'; },

        deleteTabToolTip : function (tabName) {
            return 'Remove ' + tabName;
        },

        showTab : function (tab) {
            if (this.shouldShowTab(tab)) {
                this.data('nav')[tab].find('a').trigger('click');
            }
        },

        shouldShowTab : function (tab) { return 1; },

        deletePrompt : function(tabName) {
            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name     : tabName,
                    callback : this.deleteTabCallback(tabName),
                }
            );

            $deleteModal.openPrompt();
        },

        deleteTabCallback : function (tabName) {
            return $.proxy(function(e, $prompt) {
                if ($prompt != undefined) {
                    $prompt.closePrompt();
                }

                var $tab = this.data('tabs')[tabName];
                var $nav = this.data('nav')[tabName];

                if ($nav.hasClass('active')) {
                    if ($nav.next('li').length) {
                        $nav.next().find('a').trigger('click');
                    }
                    else {
                        $nav.prev('li').find('a').trigger('click');
                    }
                }
                if (this.shouldDeleteTab(tabName)) {
                    $tab.remove();
                    $nav.remove();
                }
            }, this);
        },

        shouldDeleteTab : function (tabName) { return 1; },

        activeTab : function() {
            var activeNav = this.data('tabs-nav').find('.active:last a')[0];
            return $(activeNav).attr('data-tab');
        },

    });

}( jQuery ) );
