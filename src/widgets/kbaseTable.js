/*

    e.g.,

    $('#table').kbaseTable(
        {
            structure : {
                header : [
                    {'value' : 'a', 'sortable' : true},
                    {'value' : 'b', 'sortable' : true, style : 'color : yellow'},
                    'c',
                    'd'
                ],
                rows : [
                    {
                        'a' : 'a1',
                        'b' : 'b1',
                        'c' : 'c1',
                        'd' : 'd1'
                    },
                    {
                        'a' : 'a2',
                        'b' : 'b4',
                        'c' : 'c2',
                        'd' : 'd2'
                    },
                    {
                        'a' : 'a2',
                        'b' : { value : 'b4', colspan : 1},
                        'c' : { value : 'acc'},
                        'd' : 'd2'
                    },
                    {
                        'a' : 'a3',
                        'b' : 'b3',
                        'c' : 'c3',
                        'd' : {
                            value : 'd3',
                            style : 'font-weight : bold; color : blue',
                            class : ['blue', 'green'],
                            mouseover : function(e) {
                                $(this).css('border', '5px solid blue');
                            },
                            mouseout : function(e) {
                                $(this).css('border', '');
                            }
                        }
                    },
                ],
                footer : [
                    'f1', 'f2', 'f3', 'f4'
                ]
            }
        }
    );


*/

(function( $, undefined ) {


    $.KBWidget({

		  name: "kbaseTable",

        version: "1.0.0",
        options: {
            sortable    : false,
            striped     : true,
            hover       : true,
            bordered    : true,
        },

        init: function(options) {

            this._super(options);

            this.appendUI( $( this.$elem ), this.options.structure );

            return this;

        },

        appendUI : function ($elem, struct) {
            struct = (struct || {});

            $elem.empty();

            var $tbl = $('<table></table>')
                .attr('id', 'table')
                .addClass('table');

            if (this.options.tblOptions) {
                this.addOptions($tbl, this.options.tblOptions);
            }


            if (this.options.striped) {
                $tbl.addClass('table-striped');
            }
            if (this.options.hover) {
                $tbl.addClass('table-hover');
            }
            if (this.options.bordered) {
                $tbl.addClass('table-bordered');
            }

            if (this.options.caption) {
                $tbl.append(
                    $('<caption></caption>')
                        .append(this.options.caption)
                )
            }

            if (struct.header) {
                var $thead = $('<thead></thead>')
                    .attr('id', 'thead');

                var $tr = $('<tr></tr>')
                    .attr('id', 'headerRow');

                $.each(
                    struct.header,
                    $.proxy(function (idx, header) {

                        var h = this.nameOfHeader(header);
                        var zed = new Date();

                        var $th = $('<th></th>')
                            .append(h)
                        ;

                        if (typeof header != 'string') {
                            this.addOptions($th, header);

                            if (header.sortable) {
                                var buttonId = h + '-sortButton';
                                var $buttonIcon = $('<i></i>')
                                    .addClass('icon-sort');
                                var $button = $('<button></button>')
                                    .addClass('btn btn-default btn-xs')
                                    .attr('id', buttonId)
                                    .css('display', 'none')
                                    .css('float', 'right')
                                    .append($buttonIcon)
                                    .data('shouldHide', true)
                                ;
                                $button.bind('click', $.proxy(function (e) {

                                        var $lastSort = this.data('lastSort');
                                        if ($lastSort != undefined && $lastSort.get(0) != $button.get(0)) {
                                            $lastSort.children(':first').removeClass('icon-sort-up');
                                            $lastSort.children(':first').removeClass('icon-sort-down');
                                            $lastSort.children(':first').addClass('icon-sort');
                                            $lastSort.data('shouldHide', true);
                                            $lastSort.css('display', 'none');
                                        }

                                        if ($buttonIcon.hasClass('icon-sort')) {
                                            $buttonIcon.removeClass('icon-sort');
                                            $buttonIcon.addClass('icon-sort-up');
                                            $button.data('shouldHide', false);
                                            this.sortAndLayoutOn(h, 1);
                                        }
                                        else if ($buttonIcon.hasClass('icon-sort-up')) {
                                            $buttonIcon.removeClass('icon-sort-up');
                                            $buttonIcon.addClass('icon-sort-down');
                                            $button.data('shouldHide', false);
                                            this.sortAndLayoutOn(h, -1);
                                        }
                                        else if ($buttonIcon.hasClass('icon-sort-down')) {
                                            $buttonIcon.removeClass('icon-sort-down');
                                            $buttonIcon.addClass('icon-sort');
                                            $button.data('shouldHide', true);
                                            this.sortAndLayoutOn(undefined);
                                        }

                                        this.data('lastSort', $button);

                                    }, this))
                                ;

                                $th.append($button);
                                $th.bind('mouseover', $.proxy(function(e) {
                                    $button.css('display', 'inline');
                                }, this));
                                $th.bind('mouseout', $.proxy(function(e) {
                                    if ($button.data('shouldHide')) {
                                        $button.css('display', 'none');
                                    }

                                }, this));
                            }
                        }

                        $tr.append($th);

                    }, this)
                );

                $thead.append($tr);
                $tbl.append($thead);

            }

            if (struct.rows) {

                var $tbody = this.data('tbody', $('<tbody></tbody>'));
                this.layoutRows(struct.rows, struct.header);

                $tbl.append($tbody);
            }

            if (struct.footer) {
                var $tfoot = $('<tfoot></tfoot>')
                    .attr('id', 'tfoot');

                for (var idx = 0; idx < struct.footer.length; idx++) {
                    $tfoot.append(
                        $('<td></td>')
                            .append(struct.footer[idx])
                    );
                }

                $tbl.append($tfoot);
            }


            this._rewireIds($tbl, this);

            $elem.append($tbl);

            return $elem;

        },

        sortAndLayoutOn : function(header, dir) {

            var sortedRows = this.options.structure.rows;

            if (header != undefined) {

                var h = this.nameOfHeader(header);

                sortedRows =
                    this.options.structure.rows.slice().sort(
                        function (a,b) {
                            var keyA = a[h];
                            var keyB = b[h];

                            keyA = typeof keyA == 'string' ? keyA.toLowerCase() : keyA;
                            keyB = typeof keyB == 'string' ? keyB.toLowerCase() : keyB;

                                 if (keyA < keyB) { return 0 - dir }
                            else if (keyA > keyB) { return dir }
                            else                  { return 0   }

                        }
                    )
                ;
            }

            this.layoutRows(sortedRows, this.options.structure.header);

        },

        nameOfHeader : function (header) {
            return typeof header == 'string'
                ? header
                : header.value;
        },

        layoutRows : function (rows, header) {

            this.data('tbody').empty();

            for (var idx = 0; idx < rows.length; idx++) {

                this.data('tbody').append(this.createRow(rows[idx], header));

            }
        },

        addOptions : function ($cell, options) {
            if (options.style != undefined) {
                $cell.attr('style', options.style);
            }
            if (options.class != undefined) {
                var classes = typeof options.class == 'string'
                    ? [ options.class ]
                    : options.class;

                $.each(
                    classes,
                    $.proxy(function(idx, cl) {
                        $cell.addClass(cl);
                    }, this)
                );
            }

            var events = ['mouseover', 'mouseout', 'click'];
            $.each(
                events,
                $.proxy(function(idx, e) {
                    if (options[e] != undefined) {
                        $cell.bind(e,options[e])
                    }
                }, this)
            );

            if (options.colspan) {
                $cell.attr('colspan', options.colspan);
            }

            if (options.rowspan) {
                $cell.attr('rowspan', options.rowspan);
            }

        },


        createRow : function (rowData, headers) {

            var $tr = $('<tr></tr>');

            if ( $.isArray(rowData) ) {

                $.each(
                    rowData,
                    $.proxy( function(idx, row) {

                        var value = typeof row == 'string' || typeof row == 'number'
                            ? row
                            : row.value;

                        var $td = $.jqElem('td').append(value);

                        if (typeof row != 'string' && typeof row != 'number') {
                            this.addOptions($td, row);
                        }

                        if (value != undefined) {
                            $tr.append($td);
                        }

                    }, this)
                );
            }
            else {

                $.each(
                    headers,
                    $.proxy(function (hidx, header) {
                        var h = this.nameOfHeader(header);

                        var $td = $('<td></td>');

                        if (rowData[h] != undefined) {

                            var value = typeof rowData[h] == 'string'
                                ? rowData[h]
                                : rowData[h].value;

                            $td.append(value);

                            if (typeof rowData[h] != 'string') {
                                this.addOptions($td, rowData[h]);
                            }
                        }

                        if (value != undefined) {
                            $tr.append($td);
                        }

                    }, this)
                );
            }

            return $tr;

        },


        deletePrompt : function(row) {
            var $deleteModal = $('<div></div>').kbaseDeletePrompt(
                {
                    name     : row,
                    callback : this.deleteRowCallback(row),
                }
            );

            $deleteModal.openPrompt();
        },

        deleteRowCallback : function (row) {

        },

        shouldDeleteRow : function (row) { return 1; },


    });

}( jQuery ) );
