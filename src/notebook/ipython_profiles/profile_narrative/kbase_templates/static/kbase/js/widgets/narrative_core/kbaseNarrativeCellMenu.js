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
                text: $('<span>')
                      .addClass('fa fa-arrow-up')
                      .append(' Move Cell Up'),
                action: function() {
                    IPython.notebook.move_cell_up();
                }
            });

            this.addMenuItem({
                text: $('<span>')
                      .addClass('fa fa-arrow-down')
                      .append(' Move Cell Down'),
                action: function() {
                    IPython.notebook.move_cell_down();
                }
            });

            this.addMenuItem({
                text: $('<span>')
                      .addClass('fa icon-remove')
                      .append(' Delete Cell'),
                action: function() {
                    IPython.notebook.delete_cell();
                }
            });

            this.addMenuItem({
                text: $('<span>')
                      .addClass('fa fa-caret-square-o-up')
                      .append(' Insert Code Cell Above'),
                action: function() {
                    IPython.notebook.insert_cell_above('code');
                }
            });

            this.addMenuItem({
                text: $('<span>')
                      .addClass('fa fa-caret-square-o-down')
                      .append(' Insert Code Cell Below'),
                action: function() {
                    IPython.notebook.insert_cell_below('code');
                }
            });

            this.addMenuItem({
                text: $('<span>')
                      .addClass('fa fa-terminal')
                      .append(' Convert to code cell'),
                action: function() {
                    //IPython.notebook.to_code();
                },
                disable: true
            });


            this.$elem.append($('<div class="dropdown">')
                              .append($btn)
                              .append(this.$menu));

            return this;
        },

        addMenuItem: function(item) {
            var $item = $('<a>')
                        .append(item.text)
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