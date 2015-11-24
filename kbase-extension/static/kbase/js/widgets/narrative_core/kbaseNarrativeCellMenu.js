/*global define,IPython*/
/*jslint white:true,browser:true*/
define(['jquery', 'kbwidget', 'bootstrap'], function ($) {
    'use strict';
    $.KBWidget({
        name: 'kbaseNarrativeCellMenu',
        parent: 'kbaseWidget',
        options: {cell: null, kbWidget: null, kbWidgetType: null},
        genId: function () {
            if (!this.lastId) {
                this.lastId = 1;
            } else {
                this.lastId += 1;
            }
            return 'kbaseNarrativeCellMenu_' + this.lastId;
        },
        init: function (options) {
            var self = this;
            this._super(options);

            // console.log(['cell menu', this.options.cell]);
//            var outputPane = this.$elem.closest('.cell').find('.inner_cell > div:nth-child(2)').get(0);
//            if (!outputPane.id) {
//                outputPane.id = this.genId();
//            }
//            this.$elem.data('ouputPaneId', outputPane.id);

            var $deleteBtn = $('<button type="button" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="left" Title="Delete Cell">')
                .append($('<span class="fa fa-trash-o" style="font-size:14pt; padding-left: 5px;">'))
                .click($.proxy(function () {
                    this.trigger('deleteCell.Narrative', IPython.notebook.get_selected_index());
                }, this)),
                $menuBtn = $('<button type="button" data-toggle="dropdown" aria-haspopup="true" class="btn btn-default btn-xs">')
                .append($('<span class="fa fa-cog" style="font-size:14pt">')),
                // $collapseBtn = $('<button class="btn btn-default" role="button" data-toggle="collapse" href="#' + outputPane.id + '" aria-controls="' + $outputPane.id + '">Open</button>'),
                $collapseBtn = $('<button type="button" class="btn btn-default btn-xs" role="button"><span class="fa fa-chevron-down"></button>')
                .on('click', function () {
                    self.$elem.trigger('toggle-output');
                    var icon = $(this).find('span.fa');
                    if (icon.hasClass('fa-chevron-right')) {
                        icon.removeClass('fa-chevron-right');
                        icon.addClass('fa-chevron-down');
                    } else {
                        icon.removeClass('fa-chevron-down');
                        icon.addClass('fa-chevron-right');
                    }
                })

            this.$elem.on('toggle-output', function () {
                var pane = self.$elem.closest('.cell').find('.inner_cell > div:nth-child(3)');
                if (pane) {
                    pane.toggle();
                }
            });

            this.$menu = $('<ul>')
                .addClass('dropdown-menu dropdown-menu-right');
            
            
            
          
            if (window.kbconfig && window.kbconfig.mode === "debug") {
                this.addMenuItem({
                    icon: 'fa fa-code',
                    text: 'View Job Submission',
                    action: function () {
                        var metadata = IPython.notebook.get_selected_cell().metadata,
                            stackTrace = [],
                            cell = IPython.notebook.insert_cell_below('code');
                        if (metadata['kb-cell'] && metadata['kb-cell'].stackTrace) {
                            stackTrace = metadata['kb-cell'].stackTrace;
                        }
                        console.log(stackTrace);
                        if (stackTrace instanceof Array) {
                            cell.set_text('job_info=' + stackTrace[stackTrace.length - 1] + '\njob_info');
                            IPython.notebook.get_selected_cell().execute();
                        } else {
                            cell.set_text('job_info=' + stackTrace);
                        }
                    }
                });
            }

            this.addMenuItem({
                icon: 'fa fa-arrow-up',
                text: 'Move Cell Up',
                action: function () {
                    IPython.notebook.move_cell_up();
                }
            });

            this.addMenuItem({
                icon: 'fa fa-arrow-down',
                text: 'Move Cell Down',
                action: function () {
                    IPython.notebook.move_cell_down();
                }
            });

            this.addMenuItem({
                icon: 'fa fa-caret-square-o-up',
                text: 'Insert Cell Above',
                action: function () {
                    IPython.notebook.insert_cell_above('markdown');
                }
            });

            this.addMenuItem({
                icon: 'fa fa-caret-square-o-down',
                text: 'Insert Cell Below',
                action: function () {
                    IPython.notebook.insert_cell_below('markdown');
                }
            });

            // only add this if it was controlled by a KBase Widget
            if (this.options.kbWidget && this.options.kbWidgetType) {
                this.addMenuItem({
                    icon: 'fa fa-copy',
                    text: 'Duplicate Cell',
                    action: $.proxy(function () {
                        // get the current state, and clear it of its running state
                        var kbWidget = options.kbWidget,
                            currentState = kbWidget.getState();
                        if (this.options.kbWidgetType === 'method') {
                            // put the method in the narrative
                            this.trigger('methodClicked.Narrative', kbWidget.method);

                            // the method initializes an internal method input widget, but in an async way
                            // so we have to wait and check when that is done.  When it is, we can update state
                            var newCell = IPython.notebook.get_selected_cell();
                            var newWidget = $('#' + $(newCell.get_text())[0].id).kbaseNarrativeMethodCell();
                            var updateState = function (state) {
                                if (newWidget.$inputWidget) {
                                    // if the $inputWidget is not null, we are good to go, so set the state
                                    newWidget.loadState(currentState.params);
                                } else {
                                    // not ready yet, keep waiting
                                    window.setTimeout(updateState, 500);
                                }
                            };
                            window.setTimeout(updateState, 50);
                        }
                    }, this)
                });
            }

            // if (this.options.cell && this.options.cell.metadata['kb-cell'] === undefined) {
            //     this.addMenuItem({
            //         icon: 'fa fa-terminal',
            //         text: 'Toggle Cell Type',
            //         action: function() {
            //             if (this.options.cell.cell_type === "markdown") {
            //                 IPython.notebook.to_code();
            //             }
            //             else {

            //             }
            //         },
            //         disable: true
            //     });
            // }
//
//            this.addMenuItem({
//                icon: 'fa fa-trash-o',
//                text: 'Delete Cell',
//                action: $.proxy(function () {
//                    this.trigger('deleteCell.Narrative', IPython.notebook.get_selected_index());
//                }, this)
//            });

            // this shows whether the app is running
            var self = this;
            this.$runningIcon = $("<span>")
                .addClass("fa fa-circle-o-notch fa-spin")
                .css({color: "rgb(42,121,191)"})
                .hide();
            this.$elem.data('runningIcon', this.$runningIcon);
            this.$elem.on('start-running', function () {
                self.$runningIcon.show();
            });
            this.$elem.on('stop-running', function () {
                self.$runningIcon.hide();
            });

            // this shows on error
            this.$errorIcon = $("<span>")
                .addClass("fa fa-exclamation-triangle")
                .css({color: "red"})
                .hide();
            this.$elem.data('errorIcon', this.$errorIcon);
            this.$elem.on('show-error', function () {
                self.$errorIcon.hide();
            });
            this.$elem.on('hide-error', function () {
                self.$errorIcon.hide();
            });


            var $dropdownMenu = $('<span class="btn-group">')
                .append($menuBtn)
                .append(this.$menu);

            this.$elem.on('show-buttons', function () {
                $deleteBtn.removeClass('disabled');
                $dropdownMenu.find('.btn').removeClass('disabled');
            });
            this.$elem.on('hide-buttons', function () {
                $deleteBtn.addClass('disabled');
                $dropdownMenu.find('.btn').addClass('disabled');
            });

            this.$elem.append(
                $('<div class="kb-cell-toolbar container-fluid">')
                .append($('<div class="row">')
                    .append($('<div class="col-md-1">')
                        .append($('<div class="buttons pull-left">')
                            .append($collapseBtn)
                        )
                    )
                    .append($('<div class="col-md-7">')
                        .append($('<div class="title pull-left">')
                            .append('<span data-element="title" class="title"></span>') // title here
                        )
                    )
                    .append($('<div class="col-md-4">')
                        .append($('<div class="buttons pull-right">')
                            .append(this.$runningIcon)
                            .append(this.$errorIcon)
                            .append($deleteBtn)
                            .append($dropdownMenu)
                        )
                    )
                )
            );
            $deleteBtn.tooltip();
            // Set up title.
            var $titleNode = this.$elem.find('[data-element="title"]');
            this.$elem.on('set-title', function (e, title) {                
                e.stopPropagation();
                $titleNode.html(title);
            });
            
            // And an icon -- hack to go into the input prompt for now...
            //$cell =  = $(options.cell.element);
           
            this.$elem.on('set-icon', function (e, icon) {
                var $cell = self.$elem.closest('.cell'),
                    $iconNode = $cell.find('.prompt');
                console.log('ICON'); 
                console.log($cell);
                console.log($iconNode);
                e.stopPropagation();
                var wrapped = '<div style="text-align: center;">' + icon + '</div>';
                $iconNode.html(wrapped)
                
                console.log(wrapped);
                console.log($iconNode);
            });
            var $cell = (options && options.cell && $(options.cell.element)) || self.$elem.closest('.cell');
            console.log('CELL');
            console.log($cell);
            var icon = $cell.data('icon');
            if (icon) {
                this.$elem.trigger('set-icon', [icon]);
            }

            // but maybe have the title already.
            var title = $cell.data('title');
            if (title) {
                this.$elem.trigger('set-title', [title]);
            }

            return this;
        },
        addMenuItem: function (item) {
            var label = '';
            if (item.icon) {
                label += '<span class="' + item.icon + '"></span> ';
            }
            if (item.text) {
                label += ' ' + item.text;
            }
            var $item = $('<a>')
                .append(label)
                .click($.proxy(function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (!item.disable) {
                        if (item.action)
                            item.action();
                        this.$menu.dropdown('toggle');
                    }
                }, this));
            var $itemElem = $('<li>').append($item);
            if (item.disable) {
                $itemElem.addClass('disabled');
            }
            this.$menu.append($itemElem);
        }
    });
});