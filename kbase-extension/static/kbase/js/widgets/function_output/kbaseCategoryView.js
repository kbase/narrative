/**
 * KBase widget to display an lists within categories.
 */
(function ($, undefined) {
    return KBWidget({
        name: 'CategoryViewWidget',
        version: '1.0.0',
        options: {
            data: null,
        },
        init: function (options) {
            this._super(options);
            return this.render();
        },
        render: function () {
            // creater main comtainer
            const index = Math.floor(Math.random() * 1000 + 1);
            const main = $('<div>').attr('id', index);
            // Create accordian
            if (this.options.data !== null) {
                main.addClass('panel-group').css({ margin: '0', padding: '0' });
                let i, j;
                for (i = 0; i < this.options.data.length; i++) {
                    const catid = index + '_' + i;
                    const cnum = this.options.data[i]['items'].length;
                    const clist = $('<ul>')
                        .addClass('list-group')
                        .css({ margin: '0', padding: '0' });
                    for (j = 0; j < cnum; j++) {
                        clist.append(
                            $('<li>')
                                .addClass('list-group-item')
                                .css({ margin: '0', padding: '0' })
                                .html(this.options.data[i]['items'][j])
                        );
                    }
                    main.append(
                        $('<div>')
                            .addClass('panel panel-default')
                            .css({ margin: '0', padding: '0' })
                            .append(
                                $('<div>')
                                    .addClass('panel-heading')
                                    .css({ margin: '0', padding: '0' })
                                    .append(
                                        $('<h4>')
                                            .addClass('panel-title')
                                            .css({ margin: '0', padding: '0' })
                                            .append(
                                                $('<a>')
                                                    .attr({
                                                        'data-toggle': 'collapse',
                                                        'data-parent': '#' + index,
                                                        href: '#' + catid,
                                                    })
                                                    .html(this.options.data[i]['title'])
                                            )
                                    )
                            )
                            .append(
                                $('<div>')
                                    .attr('id', catid)
                                    .css({ margin: '0', padding: '0' })
                                    .addClass('panel-collapse collapse')
                                    .append(
                                        $('<div>')
                                            .addClass('panel-body')
                                            .css({ margin: '0', padding: '0' })
                                            .append(clist)
                                    )
                            )
                    );
                }
            }
            // put container in cell
            this.$elem.append(main);
            return this;
        },
    });
})(jQuery);
