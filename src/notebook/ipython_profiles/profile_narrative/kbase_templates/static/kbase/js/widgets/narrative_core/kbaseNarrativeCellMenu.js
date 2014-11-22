(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeCellMenu',
        parent: 'kbaseWidget',
        options: {},

        init: function(options) {
            this._super(options);

            var $btn = $('<button type="button" data-toggle="dropdown" aria-haspopup="true" class="btn btn-default btn-xs">')
                       .append($('<span class="fa fa-cog" style="font-size:10pt">'));

            this.$menu = $('<ul>')
                         .addClass('dropdown-menu')
                         .css({
                                'right' : '0', 
                                'left' : 'auto', 
                                'margin' : '0'
                         });
/*

        this.element.find('#move_cell_up').click(function () {
            IPython.notebook.move_cell_up();
        });
        this.element.find('#move_cell_down').click(function () {
            IPython.notebook.move_cell_down();
        });

        this.element.find('#insert_cell_above').click(function () {
            IPython.notebook.insert_cell_above('code');
        });  
        this.element.find('#insert_cell_below').click(function () {
            IPython.notebook.insert_cell_below('code');
        });


        this.element.find('#to_code').click(function () {
            IPython.notebook.to_code();
        });

        this.element.find('#delete_cell').click(function () {
            IPython.notebook.delete_cell();
        });

*/

            this.addMenuItem({
                icon: 'fa fa-arrow-up',
                text: 'Move Cell Up',
                action: function() {
                    IPython.notebook.move_cell_up();
                }
            });

            this.addMenuItem({
                icon: 'fa fa-arrow-down',
                text: 'Move Cell Down',
                action: function() {
                    IPython.notebook.move_cell_down();
                }
            });

            this.addMenuItem({
                icon: 'fa fa-caret-square-o-up',
                text: 'Insert Cell Above',
                action: function() {
                    var cell = IPython.notebook.insert_cell_above('markdown');
                }
            });

            this.addMenuItem({
                icon: 'fa fa-caret-square-o-down',
                text: 'Insert Cell Below',
                action: function() {
                    var cell = IPython.notebook.insert_cell_below('markdown');
                }
            });

            this.addMenuItem({
                icon: 'fa fa-terminal',
                text: 'Convert to code cell',
                action: function() {
                    //IPython.notebook.to_code();
                },
                disable: true
            });

            this.addMenuItem({
                icon: 'fa icon-remove',
                text: 'Delete Cell',
                action: function() {
                    IPython.notebook.delete_cell();
                }
            });

            this.$elem.append($('<div class="dropdown">')
                              .append($btn)
                              .append(this.$menu));

            return this;
        },

        addMenuItem: function(item) {
            var $label = $('<span>');
            if (item.icon)
                $label.addClass(item.icon);
            if (item.text)
                $label.append(' ' + item.text);
            var $item = $('<a>')
                        .append($label)
                        .click($.proxy(function(event) {
                            event.preventDefault();
                            event.stopPropagation();
                            if (!item.disable) {
                                if (item.action)
                                    item.action();
                                this.$elem.find('[data-toggle]').dropdown('toggle');
                            }
                        }, this));
            var $itemElem = $('<li>').append($item);
            if (item.disable)
                $itemElem.addClass('disabled');
            this.$menu.append($itemElem);
        },
    });
})( jQuery );