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

    /**
     * }
     */

    var DynamicTable = function (elem, options) {
        // options = {
        //     headers: [{
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
        //     pagingFunction: function(pageNum, itemsPerPage, sortInfo)
        // }
        this.headers = options.headers;
        this.decoration = options.decoration || [];
        this.initialize(elem);
        this.update(options.data);
        this.page = 0;
        this.total = 0;
        this.start = 0;
    };

    DynamicTable.prototype.initialize = function(elem) {
        this.$header = this.makeHeader()
        this.$table = $('<table id="dynamic_table" class="table table-striped table-bordered table-hover">');
        this.$tHeader = $('<tr>');
        this.headers.forEach(function (h) {
            this.$tHeader.append(this.makeTableHeader(h));
        }.bind(this));
        this.$table.append($('<thead>').append(this.$tHeader));
        this.$tBody = $('<tbody>');
        this.$table.append(this.$tBody);
        $(elem).append(this.$table);
    };

    DynamicTable.prototype.makeHeader = function() {

    };

    DynamicTable.prototype.makeTableHeader = function(header) {
        var $header = $('<th>').append($('<b>').append(header.text));
        header.sortState = 0;
        if (header.sortFunction) {
            // add sorting.
            var $sortBtn = makeSortButton();
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
                Promise.try(function() {
                    return header.sortFunction(header.sortState);
                })
                .then(function(data) {
                    this.update(data);
                }.bind(this))
                .catch(function(error) {
                    alert('error!');
                    console.error(error);
                });
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
            if (h.sortable) {
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
    };

    var makeSortButton = function() {
        return $('<button>')
               .addClass('btn btn-default btn-xs pull-right')
               .append($('<span>')
                       .addClass('fa fa-sort text-muted'));
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
    var tableRow = function(data, isHeader) {
        var elem = 'td';
        if (isHeader) {
            elem = 'th';
        }
        return $('<tr>').append(data.map(function(d) { return '<' + elem + '>' + d + '</' + elem + '>'; }).join());
    };

    return DynamicTable;
});
