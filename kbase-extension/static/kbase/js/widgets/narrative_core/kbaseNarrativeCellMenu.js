/*global define*/
/*jslint white: true*/
define(['jquery', 
        'narrativeConfig',
        'util/timeFormat',
        'kbwidget', 
        'bootstrap'], 
function($, Config, TimeFormat) {
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

            this.$subtitle = $('<div class="subtitle">').hide();

            this.$timestamp = $('<span class="kb-func-timestamp">');

            var $deleteBtn = $('<button type="button" class="btn btn-default btn-xs" data-toggle="tooltip" data-placement="left" Title="Delete Cell">')
                .append($('<span class="fa fa-trash-o" style="font-size:14pt;">'))
                .click(function () {
                    this.trigger('deleteCell.Narrative', Jupyter.notebook.find_cell_index(this.options.cell));
                }.bind(this));

            var $menuBtn = $('<button type="button" data-toggle="dropdown" aria-haspopup="true" class="btn btn-default btn-xs">')
                .append($('<span class="fa fa-cog" style="font-size:14pt">'));

            this.$collapseBtn = $('<button type="button" class="btn btn-default btn-xs" role="button" data-button="toggle" style="width:20px"><span class="fa fa-chevron-down"></button>')
                .on('click', function () {
                    this.$elem.trigger('toggle.toolbar');
                }.bind(this));

            var cell = this.options.cell;



            this.$menu = $('<ul>')
                .addClass('dropdown-menu dropdown-menu-right');
            
            if (Config.debug) {
                this.addMenuItem({
                    icon: 'fa fa-code',
                    text: 'View Job Submission',
                    action: function () {
                        var metadata = this.options.cell.metadata,
                            stackTrace = [],
                            newCell = Jupyter.narrative.insertAndSelectCell('code', 'below', Jupyter.notebook.find_cell_index(this.options.cell));
                        if (metadata['kb-cell'] && metadata['kb-cell'].stackTrace) {
                            stackTrace = metadata['kb-cell'].stackTrace;
                        }
                        console.log(stackTrace);
                        if (stackTrace instanceof Array) {
                            newCell.set_text('job_info=' + stackTrace[stackTrace.length - 1] + '\njob_info');
                            newCell.execute();
                        } else {
                            newCell.set_text('job_info=' + stackTrace);
                        }
                    }
                }.bind(this));
            }

            this.addMenuItem({
                icon: 'fa fa-arrow-up',
                text: 'Move Cell Up',
                action: function () {
                    Jupyter.notebook.move_cell_up();
                }
            });

            this.addMenuItem({
                icon: 'fa fa-arrow-down',
                text: 'Move Cell Down',
                action: function () {
                    Jupyter.notebook.move_cell_down();
                }
            });

            this.addMenuItem({
                icon: 'fa fa-caret-square-o-up',
                text: 'Insert Cell Above',
                action: function () {
                    Jupyter.narrative.insertAndSelectCellAbove('markdown');
                }
            });

            this.addMenuItem({
                icon: 'fa fa-caret-square-o-down',
                text: 'Insert Cell Below',
                action: function () {
                    Jupyter.narrative.insertAndSelectCellBelow('markdown');
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
                            var newCell = Jupyter.notebook.get_selected_cell();
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

            if (this.options.cell && this.options.cell.metadata['kb-cell'] === undefined) {
                this.addMenuItem({
                    icon: 'fa fa-terminal',
                    text: 'Toggle Cell Type',
                    action: function() {
                        if (this.options.cell.cell_type === "markdown") {
                            Jupyter.notebook.to_code();
                        }
                        else {
                            Jupyter.notebook.to_markdown();
                        }
                    }.bind(this),
                });
            }

            var self = this;
            
            // Job State Icon
            this.$jobStateIcon = $('<span>');

            // this shows whether the app is running
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
            
            this.$elem.on('runningIndicator.toolbar', function (e, data) {
//                if (data.enabled) {
//                    self.$runningIcon.show();
//                } else {
//                    self.$runningIcon.hide();
//                }
//                if (data.enabled) {
//                    self.$jobStateIcon.html(makeIcon({
//                        class: 'wifi', 
//                        color: 'orange', 
//                        spin: true,
//                        label: 'Sending'
//                    }));
//                }
            });
            
            this.$elem.on('show-title.toolbar', function () {
                this.$elem.find('div.title').css('display', 'inline-block');
            }.bind(this));

            this.$elem.on('hide-title.toolbar', function() {
                this.$elem.find('div.title').css('display', 'none');
            }.bind(this));

            this.$elem.on('mousedown', function () {
                Jupyter.notebook.events.trigger('select.Cell', this.options.cell);
            }.bind(this));

            this.$elem.dblclick(function(e) {
                e.stopPropagation();
                $(this).trigger('toggle.toolbar');
            });

            /* 
             * Each cell type unfortunately has a different top level layout.
             * Not that it matters, but I don't see why there isn't a uniform layout 
             * for the primary layout areas - prompt, toolbar, body, as they exist
             * now, and another nice one would be a message/notification area.
             */
            this.$elem.on('toggle.toolbar', function () {
                var $cellNode = self.$elem.closest('.cell');
                $cellNode
                    .trigger('toggle.cell');
            });

            function makeIcon(icon) {
                var spinClass = icon.spin ? 'fa-spin' : '',
                    label = icon.label ? icon.label + ' ' : '',
                    iconHtml = '<span>'+label+'<i class="fa fa-' + icon.class + " " + spinClass +'" style="color: '+ (icon.color || '#000') +'"></i></span>';
                return iconHtml;
            }
            
            this.$elem.on('run-state.toolbar', function (e, data) {
                switch (data.status) {
                    case 'submitted':
                        self.$jobStateIcon.html(makeIcon({
                            class: 'asterisk', 
                            color: 'orange', 
                            spin: true,
                            label: 'Queued'
                        }));
                        break;
                    case 'running': 
                        self.$jobStateIcon.html(makeIcon({class: 'circle-o-notch', color: 'blue', spin: true, label: 'Running'}));
                        break;
                    case 'complete':
                        self.$jobStateIcon.html(makeIcon({class: 'check', color: 'green', label: 'Finished'}));
                        break;
                    case 'error': 
                        self.$jobStateIcon.html('ERROR');
                        break;
                    default: 
                        self.$jobStateIcon.html('?: ' + data.status); 
                }
            })
            
            this.$elem.on('job-state.toolbar', function (e, data) {
                switch (data.status) {
                    case 'queued':
                        self.$jobStateIcon.html(makeIcon({
                            class: 'asterisk', 
                            color: 'orange', 
                            spin: true,
                            label: 'Queued'
                        }));
                        break;
                    case 'in-progress':
                    case 'running': 
                        self.$jobStateIcon.html(makeIcon({class: 'circle-o-notch', color: 'blue', spin: true, label: 'Running'}));
                        break;
                    case 'error': 
                        self.$jobStateIcon.html('ERROR');
                        break;
                    case 'complete':
                    case 'completed':
                        self.$jobStateIcon.html(makeIcon({class: 'check', color: 'green', label: 'Finished'}));
                        break;
                    default: 
                        self.$jobStateIcon.html('?: ' + data.status); 
                }
            });

            /*
             * Events emitted by the cell to indicate that the toolbar should be
             * selected or unselected. Or rather, that the cell has been selected
             * or unselected.
             */
            this.$elem.on('selected.toolbar', function (e) {
                e.stopPropagation();
                $deleteBtn.removeClass('disabled');
                $dropdownMenu.find('.btn').removeClass('disabled');
            });
            this.$elem.on('unselected.toolbar', function (e) {
                e.stopPropagation();
                $deleteBtn.addClass('disabled');
                $dropdownMenu.find('.btn').addClass('disabled');
            });

            this.$elem.on('set-timestamp.toolbar', function (e, time) {
                this.$timestamp.text(TimeFormat.readableTimestamp(time));
            }.bind(this));

            // this shows on error
            this.$errorIcon = $("<span>")
                .addClass("fa fa-exclamation-triangle")
                .css({color: "red", 'font-size': '14pt'})
                .hide();
            this.$elem.data('errorIcon', this.$errorIcon);
            this.$elem.on('show-error', function () {
                self.$errorIcon.hide();
            });
            this.$elem.on('hide-error', function () {
                self.$errorIcon.hide();
            });
            this.$elem.on('errorIndicator.toolbar', function (e, data) {
                if (data.enabled) {
                    self.$errorIcon.show();
                } else {
                    self.$errorIcon.hide();
                }
            });

            var $dropdownMenu = $('<span class="btn-group">')
                .append($menuBtn)
                .append(this.$menu);

            this.$elem.append(
                $('<div class="kb-cell-toolbar container-fluid">')
                .append($('<div class="row">')
                    .append($('<div class="col-sm-8">')
                        .append($('<div class="buttons pull-left">')
                            .append(this.$collapseBtn)
                        )
                        .append($('<div class="title" style="display:inline-block">')
                            .append('<div data-element="title" class="title"></div>') // title here
                            .append(this.$subtitle)
                        )
                    )
                    .append($('<div class="col-sm-4">')
                        .append($('<div class="buttons pull-right">')
                            .append(this.$timestamp)
                            .append(this.$runningIcon)
                            .append(this.$errorIcon)
                            .append(this.$jobStateIcon)
                            .append($deleteBtn)
                            .append($dropdownMenu)
                        )
                    )
                )
            );
            $deleteBtn.tooltip();
            
            /*
             * A workaround to provide the default state to buttons, et al.
             * jupyter should call select/unselect on each cell as they are added,
             * to allow the cell to set up state. There is an unselect cell method,
             * but no unselect event upon which to trigger actions.
             * Actually, there should be a 'can unselect' as well, since a cell
             * might no be happy with being left in an unfinished state.
            */
            $dropdownMenu.find('.btn').addClass('disabled');
            $deleteBtn.addClass('disabled');

            // Set up title.
            var $titleNode = this.$elem.find('[data-element="title"]');            
            this.$elem.on('set-title.toolbar', function (e, title) { 
                e.stopPropagation();
//                if (typeof title === 'object') {
//                    if (title.suffix) {
//                        $titleNode.html($titleNode.html() + '(' + title.suffix + ')');
//                    }
//                } else {
//                    $titleNode.html(title);
//                }
                $titleNode.html(title);
            });
            
            /* And an icon -- hack to go into the input prompt for now...
             *
             * Get the cell node from the cell passed in, rather than use our
             * node and find it.
             * $cell =  = $(options.cell.element);
            */
           
            this.$elem.on('set-icon.toolbar', function (e, icon) {
                var $cell = $(self.options.cell.element), 
                    $iconNode = $cell.find('.prompt');
                e.stopPropagation();
                var wrapped = '<div style="text-align: center;">' + icon + '</div>';
                $iconNode.html(wrapped);
            });
            
            var $cell = (options && options.cell && $(options.cell.element)) || self.$elem.closest('.cell'),
                icon = $cell.data('icon');
            
            if (icon) {
                this.$elem.trigger('set-icon.toolbar', [icon]);
            }

            // but maybe have the title already.
            var title = $cell.data('title');
            // var title = cell.metadata.kbstate.title;
            if (title) {
                this.$elem.trigger('set-title.toolbar', [title]);
            }
            
            // Rendering done, now add events.
            
            // Events done, not call actions.
            // this.options.cell.celltoobar.renderToggleState();


            return this;
        },

        toggleState: function(state) {
            var $icon = this.$collapseBtn.find('span.fa');

            switch (state) {
                case 'closed':
                    $icon.removeClass('fa-chevron-down');
                    $icon.addClass('fa-chevron-right');
                    this.$elem.parent().removeClass('kb-toolbar-open');
                    if (this.options.cell.metadata['kb-cell'] && this.$subtitle) {
                        var type = this.options.cell.metadata['kb-cell']['type'];
                        var $kbCell = $(this.options.cell.element).find('[id^=kb-cell]');
                        if ($kbCell) {
                            switch(type) {
                                case 'kb_app':
                                    this.$subtitle.html($kbCell.kbaseNarrativeAppCell('getSubtitle'));
                                    break;
                                case 'kb_error':
                                    this.$subtitle.html('An error has occurred in this cell!');
                                    break;
                                case 'function_output':
                                    // this.$subtitle.html($kbCell.kbaseNarrativeOutputCell('getSubtitle'));
                                    break;
                                case 'function_input':
                                    // doing this more declarative causes some funky rendering issues.
                                    // we need some better message passing, I think.
                                    $kbCell.trigger('get_cell_subtitle.Narrative', function(text) {
                                        this.$subtitle.html(text);
                                    }.bind(this));
                                    break;
                                default:
                                    break;
                            }
                            this.$subtitle.show();
                        }
                    }
                    break;
                default:
                    $icon.removeClass('fa-chevron-right');
                    $icon.addClass('fa-chevron-down');
                    this.$elem.parent().addClass('kb-toolbar-open');
                    this.$subtitle.hide();
                    break;
            }
        },

        setSubtitle: function (value) {
            if (this.$subtitle)
                this.$subtitle.html(value);
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
