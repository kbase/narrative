/*

    e.g.,

     new kbaseTable($('#table'), {
            structure : {
                header : [
                    'a',
                    'b',
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
                        'd' : 'd3',
                    },
                ],
                footer : [
                    'f1', 'f2', 'f3', 'f4'
                ]
            }
        }
    );


*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseDeletePrompt',
		'kbaseButtonControls',
		'kbaseSearchControls'
	], (
		KBWidget,
		bootstrap,
		$,
		kbaseDeletePrompt,
		kbaseButtonControls,
		kbaseSearchControls
	) => {



    return KBWidget({

		  name: "kbaseTable",

        version: "1.0.0",
        _accessors : ['numRows', 'sortButtons', 'visRowString'],
        options: {
            sortable    : false,
            striped     : true,
            hover       : true,
            bordered    : true,
            headerOptions : {},
            resizable   : false,

            header_callback : function(header) {
                if (header.label != undefined) {
                    return header.label;
                }
                else {
                    return header.value.replace(/(?:^|\s+)([a-z])/g, (v) => { return v.toUpperCase(); });
                }
            },

            row_callback : function (cell, header, row, $kb) {},
            sortButtons : {},
            navControls : false,
            allowNullRows : true,

        },

        default_row_callback : function (cell) {

            if (cell == undefined) {
                return cell;
            }

            if (cell.label != undefined) {
                return cell.label;
            }
            else {
                value = typeof cell != 'object'
                    ? cell
                    : cell.value;

                if (cell.type == 'th') {
                    value = value.replace(/(?:^|\s+)([a-z])/g, (v) => { return v.toUpperCase(); });
                    //value += ' : ';
                }

                if (typeof cell == 'object' && cell.setup != undefined) {
                    cell.setup(value, cell);
                }

                return value;
            }
        },

        init: function(options) {

            this._super(options);

            this.appendUI( $( this.$elem ), this.options.structure );

            return this;

        },

        appendUI : function ($elem, struct) {

            $elem.empty();

            const $tbl = $('<table></table>')
                .attr('id', 'table')
                .css('margin', '0px')
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
                const $thead = $('<thead></thead>')
                    .attr('id', 'thead');

                $thead.append(this.navControls(struct.header.length));

                const $tr = $('<tr></tr>')
                    .attr('id', 'headerRow');

                $.each(
                    struct.header,
                    $.proxy(function (idx, header) {

                        if (typeof header == 'string') {
                            header = {value : header};
                            struct.header[idx] = header;
                        }

                        const callback = header.callback || this.options.header_callback;

                        const label = callback(header, this);
                        const h = header.value;

                        const $th = $.jqElem('th')
                            .append(label)
                        ;

                        if (this.options.resizable) {
                            $th.resizable({
                                handles: 'e'
                            });
                        }

                        this.addOptions($th, $.extend(true, {}, this.options.headerOptions, header));

                        if (header.sortable || (header.sortable == undefined && this.options.sortable)) {

                            const buttonId = header.value + '-sortButton';
                            const $buttonIcon = $('<i></i>')
                                .addClass('fa fa-sort');
                            const $button = $('<button></button>')
                                .addClass('btn btn-default btn-xs')
                                .attr('id', buttonId)
                                .css('display', 'none')
                                .css('float', 'right')
                                .append($buttonIcon)
                                .data('shouldHide', true)
                            ;
                            $button.bind('click', $.proxy(function (e) {

                                    const $lastSort = this.data('lastSort');
                                    if ($lastSort != undefined && $lastSort.get(0) != $button.get(0)) {
                                        $lastSort.children(':first').removeClass('fa fa-sort-up');
                                        $lastSort.children(':first').removeClass('fa fa-sort-down');
                                        $lastSort.children(':first').addClass('fa fa-sort');
                                        $lastSort.data('shouldHide', true);
                                        $lastSort.css('display', 'none');
                                    }

                                    this.data('lastSortHeader', h);

                                    if ($buttonIcon.hasClass('fa fa-sort')) {
                                        $buttonIcon.removeClass('fa fa-sort');
                                        $buttonIcon.addClass('fa fa-sort-up');
                                        $button.data('shouldHide', false);
                                        this.sortAndLayoutOn(h, 1);
                                        this.data('lastSortDir', 1);
                                        this.data('lastSort', $button);
                                    }
                                    else if ($buttonIcon.hasClass('fa fa-sort-up')) {
                                        $buttonIcon.removeClass('fa fa-sort-up');
                                        $buttonIcon.addClass('fa fa-sort-down');
                                        $button.data('shouldHide', false);
                                        this.sortAndLayoutOn(h, -1);
                                        this.data('lastSortDir', -1);
                                        this.data('lastSort', $button);
                                    }
                                    else if ($buttonIcon.hasClass('fa fa-sort-down')) {
                                        $buttonIcon.removeClass('fa fa-sort-down');
                                        $buttonIcon.addClass('fa fa-sort');
                                        $button.data('shouldHide', true);
                                        this.sortAndLayoutOn(undefined);
                                        this.data('lastSortHeader', undefined);
                                        this.data('lastSortDir', undefined);
                                        this.data('lastSort', undefined);
                                    }


                                }, this))
                            ;

                            this.sortButtons()[header.value] = $button;

                            $th.append($button);
                            $th.bind('mouseover', $.proxy((e) => {
                                $button.css('display', 'inline');
                            }, this));
                            $th.bind('mouseout', $.proxy((e) => {
                                if ($button.data('shouldHide')) {
                                    $button.css('display', 'none');
                                }

                            }, this));
                        }

                        $tr.append($th);

                    }, this)
                );

                $thead.append($tr);
                $tbl.append($thead);

            }

            if (struct.rows) {

                const $tbody = this.data('tbody', $('<tbody></tbody>'));
                this.layoutRows(struct.rows, struct.header);

                $tbl.append($tbody);
            }

            if (struct.footer) {
                const $tfoot = $('<tfoot></tfoot>')
                    .attr('id', 'tfoot')
                ;

                const $tfootTR = $.jqElem('tr');
                $tfoot.append($tfootTR);

                for (let idx = 0; idx < struct.footer.length; idx++) {
                    const fcell = struct.footer[idx];

                    let value = fcell;
                    var style;
                    var colspan;

                    if (typeof fcell == 'object') {
                        value = fcell.value;
                        style = fcell.style;
                        colspan = fcell.colspan;
                    }

                    const $td = $.jqElem('td')
                        .append(value)
                    ;
                    if (style) {
                        $td.attr('style', style);
                    }
                    if (colspan) {
                        $td.attr('colspan', colspan);
                    }

                    $tfootTR.append($td);
                }

                $tbl.append($tfoot);
            }

            this._rewireIds($tbl, this);

            $elem.append($tbl);

            return $elem;

        },

        navControls : function(colspan) {

            const $tbl = this;

            const controlsTR = $.jqElem('tr')
                .css('display', this.options.navControls ? undefined : 'none')
                .append(
                    $.jqElem('td')
                        .attr('colspan', colspan)
                        .css('background-color', 'lightgray')
                        .append(
                            $.jqElem('div')
                                .addClass('pull-left')
                                .addClass('input-group input-group-sm')
                                .append(
                                    $.jqElem('span')
                                        .addClass('input-group-btn')
                                        .append(
                                            $.jqElem('button')
                                                .addClass('btn btn-default')
                                                .attr('id', 'pageLeftButton')
                                                .append(
                                                    $.jqElem('i')
                                                        .attr('id', 'leftIcon')
                                                        .addClass('fa fa-caret-left')
                                                )
                                                .on('click', function(e) {
                                                    const maxRows = $tbl.options.maxVisibleRowIndex || $tbl.numRows();
                                                    const minRows = $tbl.options.minVisibleRowIndex || 0;
                                                    const visRows = maxRows - minRows;

                                                    let newMin = minRows - visRows;
                                                    if (newMin <= 0) {
                                                        $(this).attr('disabled', true);
                                                        newMin = 0;
                                                    }
                                                    const newMax = newMin + visRows;

                                                    $tbl.options.minVisibleRowIndex = newMin;
                                                    $tbl.options.maxVisibleRowIndex = newMax;

                                                    $tbl.displayRows();

                                                })
                                        )
                                )
                                /*.append(
                                    $.jqElem('span')
                                        .attr('id', 'visRecords')
                                        .kb_bind(this, 'visRowString')
                                )*/
                                .append(
                                    $.jqElem('span')
                                        .attr('id', 'visRecords')
                                        .addClass('input-group-addon')
                                        .kb_bind(this, 'visRowString')
                                )
                                .append(
                                    $.jqElem('span')
                                        .addClass('input-group-btn')
                                        .append(
                                            $.jqElem('button')
                                                .addClass('btn btn-default')
                                                .attr('id', 'pageRightButton')
                                                .append(
                                                    $.jqElem('i')
                                                        .attr('id', 'rightIcon')
                                                        .addClass('fa fa-caret-right')
                                                )
                                                .on('click', function(e) {
                                                    const maxRows = $tbl.options.maxVisibleRowIndex || $tbl.numRows();
                                                    const minRows = $tbl.options.minVisibleRowIndex || 0;
                                                    const visRows = maxRows - minRows;

                                                    let newMax = maxRows + visRows;
                                                    if (newMax >= $tbl.numRows()) {
                                                        newMax = $tbl.numRows();
                                                        $(this).attr('disabled', true);
                                                    }
                                                    const newMin = newMax - visRows;

                                                    $tbl.options.minVisibleRowIndex = newMin;
                                                    $tbl.options.maxVisibleRowIndex = newMax;

                                                    $tbl.displayRows();

                                                })
                                        )
                                )
                        )
                        .append(
                            $.jqElem('div')
                                .addClass('pull-left')
                                .addClass('input-group input-group-sm')
                                .append(
                                    $.jqElem('span')
                                        .addClass('input-group-btn')
                                        .append(
                                            $.jqElem('button')
                                                .addClass('btn btn-default')
                                                .attr('id', 'removeButton')
                                                .append(
                                                    $.jqElem('i')
                                                        .attr('id', 'removeIcon')
                                                        .addClass('fa fa-minus')
                                                )
                                                .on('click', (e) => {

                                                    let currentVis = $tbl.options.maxVisibleRowIndex || 0;

                                                    currentVis--;

                                                    if (currentVis < 1) {
                                                        currentVis = 1;
                                                    }

                                                    $tbl.options.maxVisibleRowIndex = currentVis;

                                                    $tbl.displayRows();
                                                })
                                        )
                                )
                                .append(
                                    $.jqElem('span')
                                        .addClass('input-group-btn')
                                        .append(
                                            $.jqElem('button')
                                                .addClass('btn btn-default')
                                                .attr('id', 'addButton')
                                                .append(
                                                    $.jqElem('i')
                                                        .attr('id', 'addIcon')
                                                        .addClass('fa fa-plus')
                                                )
                                                .on('click', (e) => {
                                                    let currentVis = $tbl.options.maxVisibleRowIndex || 0;
                                                    currentVis++;

                                                    if (currentVis > $tbl.numRows()) {
                                                        const visDiff = currentVis - $tbl.numRows();
                                                        currentVis = $tbl.options.structure.rows.length;
                                                        $tbl.options.minVisibleRowIndex -= visDiff;
                                                        if ($tbl.options.minVisibleRowIndex < 0) {
                                                            $tbl.options.minVisibleRowIndex = 0;
                                                        }
                                                    }

                                                    $tbl.options.maxVisibleRowIndex = currentVis;

                                                    $tbl.displayRows();
                                                })
                                        )
                                )
                        )
                        .append(
                            $.jqElem('div')
                                .addClass('pull-right')
                                .attr('id', 'searchDiv')
                        )
                )
            ;

            this._rewireIds(controlsTR, this);

             new kbaseSearchControls(this.data('searchDiv'), {
                    onMouseover : false,
                    type : 'inline',
                    context : this,
                    searchCallback : function(e, value, $tbl) {
                        $tbl.refilter(value);
                    }
                }
            );

            return controlsTR;

        },

        sort : function(header, direction) {

            const $sortButton = this.sortButtons()[header];

            if (direction == -1 || direction == 1 && $sortButton != undefined) {

                const lsh = this.data('lastSortHeader');
                const lsd = this.data('lastSortDir');

                if (header == lsh && direction == lsd) {
                    return;
                }
                else if (header == lsh) {
                    if (direction == 1 && lsh == -1) {
                        $sortButton.trigger('click');
                        $sortButton.trigger('click');
                    }
                    else if (direction == -1 && lsh == 1) {
                        $sortButton.trigger('click');
                    }
                }
                else {
                    $sortButton.trigger('click');
                    if (direction == -1) {
                        $sortButton.trigger('click');
                    }
                }

                $sortButton.css('display', 'inline');
            }
        },

        refilter : function (filter) {
            this.options.filter = filter;
            this.sortAndLayoutOn(this.data('lastSortHeader'), this.data('lastSortDir'));
        },

        sortAndLayoutOn : function(h, dir) {

            let sortedRows = this.options.structure.rows;

            if (h != undefined) {

                //var h = header.value;

                sortedRows =
                    this.options.structure.rows.slice().sort(
                        (a,b) => {
                            let keyA = a[h];
                            let keyB = b[h];

                            if (keyA != undefined && keyA.sortValue != undefined) {
                                keyA = keyA.sortValue;
                            }
                            else {
                                keyA = typeof keyA == 'string' ? keyA.toLowerCase() : keyA;
                            }
                            if (keyB != undefined && keyB.sortValue != undefined) {
                                keyB = keyB.sortValue;

                            }
                            else {
                                keyB = typeof keyB == 'string' ? keyB.toLowerCase() : keyB;
                            }

                                 if (keyA < keyB) { return 0 - dir }
                            else if (keyA > keyB) { return dir }
                            else                  { return 0   }

                        }
                    )
                ;
            }

            this.layoutRows(sortedRows, this.options.structure.header);

        },

        layoutRows : function (rows, header) {

            this.data('tbody').empty();

            let numRows = 0;

            if ($.isArray(rows)) {
                for (var idx = 0; idx < rows.length; idx++) {
                    var $row = this.createRow(rows[idx], header);
                    if ($row != undefined && $row.children().length) {
                        numRows++;
                        this.data('tbody').append($row);
                    }
                }
            }
            else if (this.options.structure.keys != undefined) {

                for (var idx = 0; idx < this.options.structure.keys.length; idx++) {
                    let key = this.options.structure.keys[idx];

                    if (typeof key != 'object') {
                        key = { value : key };
                    }

                    key.type = 'th';

                    if (key.style == undefined) {
                      key.style = '';
                    }
                    key.style += '; white-space : nowrap';

                    if (rows[key.value] != undefined || this.options.allowNullRows) {
                      var $row = this.createRow(
                          {
                              key : key,
                              value : {value : rows[key.value], key : key.value},
                          },
                          [{value : 'key'}, {value : 'value'}]
                      );

                      if ($row != undefined && $row.children().length) {
                          numRows++;
                          this.data('tbody').append($row);
                      }
                    }
                }
            }

            this.numRows(numRows);

            this.displayRows();

        },

        displayRows : function() {
            this.data('tbody')
                .find('tr')
                .css('display', '');

            let maxRows = this.options.maxVisibleRowIndex || this.numRows();
            if (maxRows > this.numRows()) {
                maxRows = this.numRows();
            }

            const minRows = this.options.minVisibleRowIndex || 0;

            this.data('tbody')
                .find('> tr:lt(' + minRows + ')')
                .css('display', 'none');

            this.data('tbody')
                .find('> tr:gt(' + (maxRows - 1) + ')')
                .css('display', 'none');

            this.visRowString('Rows ' + (minRows + 1) + ' to ' + maxRows + ' of ' + this.numRows());

            if (this.options.navControls) {
                this.data('pageLeftButton').attr('disabled', minRows == 0);
                this.data('pageRightButton').attr('disabled', maxRows == this.numRows());

                this.data('removeButton').attr('disabled', maxRows - minRows == 1);
                this.data('addButton').attr('disabled', maxRows == this.numRows());
            }
        },

        addOptions : function ($cell, options) {

            if (typeof options == 'string' || options == undefined) {
                return;
            }

            if (options.style != undefined) {
                $cell.attr('style', options.style);
            }
            if (options.class != undefined) {
                const classes = typeof options.class == 'string'
                    ? [ options.class ]
                    : options.class;

                $.each(
                    classes,
                    $.proxy((idx, cl) => {
                        $cell.addClass(cl);
                    }, this)
                );
            }

            const events = ['mouseover', 'mouseout', 'click'];
            $.each(
                events,
                $.proxy((idx, e) => {
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

            let $tr = $.jqElem('tr')
                //if we don't explicitly set the background color at this level, then
                //overlapping background elements will occasionally be visible. This is
                //stupid and seems like a rendering error. Nonetheless, we hack around it.
                .css('background-color', 'white');

            const callback = this.options.row_callback;

            let filterString = '';

            if ( $.isArray(rowData) ) {

                $.each(
                    rowData,
                    $.proxy( function(idx, cell) {

                        const value = typeof cell == 'object'
                            ? cell.value
                            : cell;

                        if (value == undefined) {
                            return;
                        }

                        filterString += value instanceof jQuery ? value.text() : value;

                        const $td = $.jqElem('td').append(value);

                        if (typeof cell == 'object') {

                            this.addOptions($td, cell);
                        }

                        $tr.append($td);

                    }, this)
                );
            }
            else if (headers != undefined && headers.length) {

                $.each(
                    headers,
                    $.proxy(function (hidx, header) {
                        const h = header.value;

                        let type = 'td';

                        // null is an irritating special case. Because it's not defined,
                        // but it is a type of object. frick.

                        if (rowData[h] == null) {
                            rowData[h] = undefined;
                        }
                        if (typeof rowData[h] == 'object' && rowData[h].value == null) {
                            rowData[h].value = '';
                        }

                        if (typeof rowData[h] == 'object' && rowData[h].type != undefined) {
                            type = rowData[h].type;
                        }

                        const $td = $.jqElem(type);

                        let label = callback(rowData[h], h, rowData, this);
                        if (label == undefined) {
                            label = this.default_row_callback(rowData[h], h, rowData, this);
                        }

                        filterString += label instanceof jQuery ? label.text() : label;

                        if (rowData[h] && ! rowData[h].externalSortValue) {

                            rowData[h].sortValue = label instanceof jQuery
                                ? label.text()
                                : label;
                        }

                        $td.append(label);

                        if (typeof rowData[h] != 'string') {
                            this.addOptions($td, rowData[h]);
                        }

                        if (label != undefined) {
                            $tr.append($td);
                        }

                    }, this)
                );
            }

            if (this.options.filter != undefined) {
                const filterRegex = new RegExp(this.options.filter, 'i');
                if (! filterString.match(filterRegex)) {
                    $tr = undefined;
                }
            }

            return $tr;

        },


        deletePrompt : function(row) {
            const $deleteModal =  new kbaseDeletePrompt($('<div></div>'), {
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

});
