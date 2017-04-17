define([
    'jquery',
    'bootstrap',
    'bluebird',
    'kbase-generic-client-api',
    'narrativeConfig'
], function(
    $,
    Bootstrap,
    Promise,
    GenericClient,
    Config
) {

    var DynamicTable = function (elem, options) {
        // options = {
        //     headers: [{
        //         id: string,
        //         text: string,
        //         sortable: true/false,
        //         sortFunction: function -- should return sorted data
        //     }],
        //     decoration: [{
        //         col: int 0>n,
        //         type: str (link, button, etc),
        //         clickFunction: function
        //     }],
        //     data: {
        //         rows: Array of Arrays (same order as headers)
        //         total: total number of rows from query
        //     },
        //     pagingFunction: function(pageNum, itemsPerPage, sortInfo),
        //     class: str (like jquery add class for whole widget)
        //     style: { key1: value1, key2: value2} (css for whole widget)
        // }
        this.options = {
            class: '',
            style: {},
            searchPlaceholder: 'Search',
            rowsPerPage: 10,
            headers: [],
            decoration: [],
            data: []
        };
        $.extend(true, this.options, options);

        this.currentSort = {
            id: null,
            dir: null
        };
        this.currentPage = 0;
        this.sortCol = null;
        this.sortDir = null;
        this.rowsPerPage = options.rowsPerPage;
        this.total = 0;
        this.start = 0;
        this.end = 0;

        this.headers = options.headers;
        this.decoration = options.decoration;

        this.initialize(elem);
        this.update(options.data);
    };

    DynamicTable.prototype.initialize = function(elem) {
        this.$container = $('<div>').addClass('container-fluid ' + this.options.class);
        this.$container.css(this.options.style);

        this.$container.append(this.makeWidgetHeader());

        this.$table = $('<table id="dynamic_table" class="table table-striped table-bordered table-hover">');
        this.$tHeader = $('<tr>');
        this.headers.forEach(function (h) {
            this.$tHeader.append(this.makeTableHeader(h));
        }.bind(this));
        this.$table.append($('<thead>').append(this.$tHeader));
        this.$tBody = $('<tbody>');
        this.$table.append(this.$tBody);

        this.$container
            .append($('<div class="row">').append($('<div class="col-md-12">').append(this.$table)))
            .append(this.makeWidgetFooter());
        $(elem).append(this.$container);
    };

    DynamicTable.prototype.makeWidgetFooter = function() {
        this.$shownText = $('<span></span>');
        var $footer = $('<div class="row">')
                      .append($('<div class="col-md-12">')
                              .append(this.$shownText));
        return $footer;
    };

    DynamicTable.prototype.makeWidgetHeader = function() {
        var self = this;
        var $leftBtn = simpleButton('btn-md', 'fa fa-caret-left')
                       .click(function() {
                           var curP = self.currentPage;
                           if (self.getPrevPage() !== curP) {
                               self.getNewData();
                           }
                       });
        var $rightBtn = simpleButton('btn-md', 'fa fa-caret-right')
                        .click(function() {
                            var curP = self.currentPage;
                            if (self.getNextPage() !== curP) {
                                self.getNewData();
                            }
                        });
        var $pageBtns = $('<div class="col-md-4">')
                        .append($leftBtn)
                        .append($rightBtn);

        self.$loadingElement = $('<div>')
                               .attr('align', 'center')
                               .append($('<i>').addClass('fa fa-spinner fa-spin fa-2x'))
                               .hide();
        var $loadingDiv = $('<div class="col-md-4">').append(self.$loadingElement);

        var $searchElement = $('<input>')
                             .attr('type', 'text')
                             .addClass('form-control')
                             .attr('placeholder', self.options.searchPlaceholder)
                             .on('keyup', function() {
                                 self.currentQuery = $.trim($searchElement.val());
                                 self.getNewData();
                             });
        var $searchDiv = $('<div class="col-md-4 pull-right">').append($searchElement);

        return $('<div class="row" style="margin: 5px 0">')
                .append($pageBtns)
                .append($loadingDiv)
                .append($searchDiv);
    };

    DynamicTable.prototype.getPrevPage = function() {
        this.currentPage--;
        if (this.currentPage < 0) {
            this.currentPage = 0;
        }
        return this.currentPage;
    };

    DynamicTable.prototype.getNextPage = function() {
        this.currentPage++;
        if ((this.currentPage + 1) * this.rowsPerPage >= this.total) {
            this.currentPage--;
        }
        return this.currentPage;
    };

    var simpleButton = function(sizeClass, iconClass) {
        return $('<button>')
               .addClass('btn btn-default ' + sizeClass)
               .append($('<span>').addClass(iconClass));
    };

    DynamicTable.prototype.getNewData = function() {
        this.$loadingElement.show();
        this.options.updateFunction(this.currentPage,
                                    this.currentQuery,
                                    this.currentSort.id,
                                    this.currentSort.sortState)
            .then(function(data) {
                this.update(data);
            }.bind(this))
            .catch(function(error) {
                alert('error!');
                console.error(error);
            })
            .finally(function() {
                this.$loadingElement.hide();
            }.bind(this));
    };

    DynamicTable.prototype.makeTableHeader = function(header) {
        var $header = $('<th>').append($('<b>').append(header.text));
        header.sortState = 0;
        if (header.isSortable) {
            // add sorting.
            var $sortBtn = simpleButton('btn-xs', 'fa fa-sort text-muted').addClass('pull-right');
            $sortBtn.click(function() {
                // reset all other sort buttons
                var curState = header.sortState;
                this.headers.forEach(function(h) {
                    h.sortState = 0;
                });
                // set this one to sort. if up, then down, if down then up, if neither then up
                if (curState < 1) {
                    header.sortState = 1;
                }
                else {
                    header.sortState = -1;
                }
                this.currentSort = header;
                this.getNewData();
            }.bind(this));
            $header.append($sortBtn);
        }
        $header.resizable({
            handles: 'e'
        });
        return $header;
    };

    DynamicTable.prototype.setData = function(data) {
        // list of lists. Empty it out, then put it in place in the given order.
        this.$tBody.empty();
        data.forEach(function(row) {
            // decorate each row element as necessary
            this.decoration.forEach(function(dec) {
                if (dec.type == 'link') {
                    row[dec.col] = '<a style="cursor:pointer">' + row[dec.col] + '</a>';
                }
                else if (dec.type == 'button') {
                    row[dec.col] = '<button class="btn btn-default btn-sm">' + row[dec.col] + '</button>';
                }
            });
            // build the table row elem
            var $newRow = tableRow(row);
            // add click bindings to decorated elements
            this.decoration.forEach(function(dec) {
                if (dec.clickFunction) {
                    var $clickElem = $newRow.find('td:eq(' + dec.col + ') > :eq(0)');
                    $clickElem.click(function(e) {
                        dec.clickFunction($clickElem.text());
                    });
                }
            });
            this.$tBody.append($newRow);
        }.bind(this));
    };

    DynamicTable.prototype.update = function(data) {
        // update header sort buttons
        this.headers.forEach(function(h, idx) {
            if (h.isSortable) {
                var newClass = 'fa-sort text-muted';
                if (h.sortState == 1) {
                    newClass = 'fa-sort-up';
                }
                if (h.sortState == -1) {
                    newClass = 'fa-sort-down';
                }
                this.$tHeader
                    .find('th:eq(' + idx + ') .fa')
                    .removeClass('fa-sort fa-sort-down fa-sort-up text-muted')
                    .addClass(newClass);
            }
        }.bind(this));
        // update data
        this.setData(data.rows);
        this.start = data.start;
        this.end = data.start + data.rows.length;
        this.total = data.total;
        this.$shownText.text('Showing ' + this.start + ' to ' + this.end + ' of ' + this.total);
        //  + ' on page ' + this.currentPage);
    };

    /**
     * Converts an array to a table row.
     * e.g., if the array is ['abc', '123', 'xyz']
     * this returns:
     * <tr>
     *     <td>abc</td>
     *     <td>123</td>
     *     <td>xyz</td>
     * </tr>
     * as a jQuery node
     */
    var tableRow = function(data) {
        var elem = 'td';
        return $('<tr>').append(
            data.map(function(d) {
                return '<' + elem + '>' + d + '</' + elem + '>';
            }).join()
        );
    };

    return DynamicTable;
});
