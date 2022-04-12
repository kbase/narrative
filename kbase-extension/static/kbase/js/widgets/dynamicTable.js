/**
 * A DynamicTable widget.
 * This is a very very lightweight table that uses a callback to set its data based on user actions.
 * Make it like this:
 *
 * var targetDiv = '<div>';
 * var myTable = new DynamicTable(targetDiv, {
 *   headers: [{
 *       id: 'col1',
 *       text: 'First Col',
 *       isSortable: false,
 *   }, {
 *       id: 'col2',
 *       text: 'Second Col',
 *       isSortable: true
 *   }],
 *   decoration: [{
 *       col: 'col1',
 *       type: 'link',
 *       clickFunction: function(text) { do stuff with text }
 *   }],
 *   updateFunction: function(pageNum, query, sortColId, sortColDir) {
 *       return Promise.try(function() {
 *           return {
 *               rows: [['row1,col1', 'row1,col2'],
 *                      ['row2,col1', 'row2,col2']],
 *               start: 0,
 *               total: 1000,
 *               query: ''
 *           }
 *       });
 *   rowsPerPage: 10,
 *   searchPlaceholder: 'Search for data',
 *   class: 'css classes to apply to outer container',
 *   style: 'css style to apply to outer container',
 *   rowFunction: function($row) {
 *      return $row; (after doing whatever to it)
 *   },
 *   enableDownload: true/false,
 *   downloadFileName: string,
 */
/**
 * Some further notes:
 * The updateFunction should return a Promise that ultimately returns the data.
 * That data should be an object with the following attributes:
 *   rows - an array of row data (an array of arrays) with each 'row' being an array of data
 *          in the correct column order.
 *   start - the index of the first row returned
 *   total - the total number of rows available in the table, NOT just in the current data slice.
 *   query - the query used to fetch that data.
 */
define([
    'jquery',
    'bootstrap',
    'bluebird',
    'kbase-generic-client-api',
    'util/display',
    'util/string',
    'fileSaver',
    'jqueryui',
], (
    $,
    Bootstrap,
    Promise,
    GenericClient,
    Display,
    StringUtil,
    FileSaver //enables the saveAs function.
) => {
    'use strict';
    const DynamicTable = function (elem, options) {
        this.options = {
            class: '',
            style: {},
            searchPlaceholder: 'Search',
            rowsPerPage: 10,
            headers: [],
            decoration: [],
            data: [],
            enableDownload: false,
            downloadFileName: 'table_data.csv',
        };
        $.extend(true, this.options, options);

        this.currentData = [];
        this.currentSort = {
            id: null,
            dir: null,
            sortState: null,
        };
        this.currentPage = 0;
        this.sortCol = null;
        this.sortDir = null;
        this.rowsPerPage = this.options.rowsPerPage;
        this.total = 0;
        this.start = 0;
        this.end = 0;

        this.headers = this.options.headers;
        this.decoration = this.options.decoration;

        this.initialize(elem);
        return this.getNewData();
    };

    /**
     * Initialize the whole shebang with the given options.
     * Starts with creating a container for all the elements to live in,
     * then builds the header, table, and footer.
     * This doesn't actually set the data or anything, it just inits the various
     * DOM elements and events.
     */
    DynamicTable.prototype.initialize = function (elem) {
        this.$container = $('<div>').addClass('container-fluid ' + this.options.class);
        this.$container.css(this.options.style);

        this.$container.append(this.makeWidgetHeader());

        this.$table = $(
            '<table id="dynamic_table" class="table table-striped table-bordered table-hover">'
        );
        this.$tHeader = $('<tr>');
        this.headers.forEach((h) => {
            this.$tHeader.append(this.makeTableHeader(h));
        });
        this.$table.append($('<thead>').append(this.$tHeader));
        this.$tBody = $('<tbody>');
        this.$table.append(this.$tBody);

        this.$notificationArea = $('<div>');
        this.$container
            .append(this.$notificationArea)
            .append($('<div class="row">').append($('<div class="col-md-12">').append(this.$table)))
            .append(this.makeWidgetFooter());
        $(elem).append(this.$container);
    };

    /**
     * Builds the footer for the whole widget, sits below the table.
     * Just shows what rows are visible right now.
     */
    DynamicTable.prototype.makeWidgetFooter = function () {
        // var dropdownId = 'dtable-' + StringUtil.uuid();
        this.$shownText = $('<span></span>');
        const $footer = $('<div class="row">').append(
            $('<div class="col-md-6">').append(this.$shownText)
        );

        if (this.options.enableDownload) {
            const self = this;
            const csvRows = function (data) {
                const headerNames = [];
                self.headers.forEach((h) => {
                    headerNames.push(h.text);
                });
                data.unshift(headerNames);
                return data.map((row) => {
                    return row.join(',') + '\n';
                });
            };
            const $dlBtn = Display.simpleButton(
                'btn-md btn-default dropdown-toggle',
                'fa fa-download'
            ).click(() => {
                saveAs(new Blob(csvRows(self.currentData)), self.options.downloadFileName);
            });
            const $dlAllBtn = Display.simpleButton(
                'btn-md btn-default dropdown-toggle',
                'fa fa-cloud-download'
            ).click(() => {
                self.options
                    .downloadAllDataFunction(self.currentSort.id, self.currentSort.sortState)
                    .then((data) => {
                        saveAs(new Blob(csvRows(data)), self.options.downloadFileName);
                    });
            });
            $footer.append(
                $('<div class="col-md-6">').append(
                    $('<div class="pull-right">').append($dlBtn).append($dlAllBtn)
                )
            );
        }
        return $footer;
    };

    /**
     * Makes the header for the whole table widget.
     * This includes L/R buttons for table pagination, a hideable spinner for loading,
     * and a search element.
     */
    DynamicTable.prototype.makeWidgetHeader = function () {
        const self = this;
        const $leftBtn = Display.simpleButton('btn-md', 'fa fa-caret-left').click(() => {
            const curP = self.currentPage;
            if (self.getPrevPage() !== curP) {
                self.getNewData();
            }
        });
        const $rightBtn = Display.simpleButton('btn-md', 'fa fa-caret-right').click(() => {
            const curP = self.currentPage;
            if (self.getNextPage() !== curP) {
                self.getNewData();
            }
        });
        const $pageBtns = $('<div class="col-md-4">').append($leftBtn).append($rightBtn);

        self.$loadingElement = $('<div>')
            .attr('align', 'center')
            .append($('<i>').addClass('fa fa-spinner fa-spin fa-2x'))
            .hide();
        const $loadingDiv = $('<div class="col-md-4">').append(self.$loadingElement);

        var $searchElement = $('<input>')
            .attr('type', 'text')
            .addClass('form-control')
            .attr('placeholder', self.options.searchPlaceholder)
            .on('keyup', () => {
                self.currentQuery = $.trim($searchElement.val());
                self.currentPage = 0;
                self.getNewData();
            });
        const $searchDiv = $('<div class="col-md-4 pull-right">').append($searchElement);

        return $('<div class="row" style="margin-bottom: 5px">')
            .append($pageBtns)
            .append($loadingDiv)
            .append($searchDiv);
    };

    /**
     * Updates the current page to the previous one, as long as it's >= 0.
     */
    DynamicTable.prototype.getPrevPage = function () {
        this.currentPage--;
        if (this.currentPage < 0) {
            this.currentPage = 0;
        }
        return this.currentPage;
    };

    /**
     * Updates the current page to the next one, if available.
     * If not, nothing changes.
     */
    DynamicTable.prototype.getNextPage = function () {
        this.currentPage++;
        if (this.currentPage * this.rowsPerPage >= this.total) {
            this.currentPage--;
        }
        return this.currentPage;
    };

    /**
     * Displays an error using the Narrative DisplayUtil stuff.
     */
    DynamicTable.prototype.displayError = function (error) {
        let errorObj = error;
        if (error.status && error.error && error.error.error) {
            errorObj = error.error;
        }
        this.$notificationArea.empty().append(Display.createError('Table data error', errorObj));
        console.error(error);
    };

    /**
     * This fetches a new set of data, by firing the updateFunction
     * with the current table state, including page, etc.
     */
    DynamicTable.prototype.getNewData = function () {
        this.$loadingElement.show();
        return this.options
            .updateFunction(
                this.currentPage,
                this.currentQuery,
                this.currentSort.id,
                this.currentSort.sortState
            )
            .then((data) => {
                this.update(data);
            })
            .catch((error) => {
                this.displayError(error);
            })
            .finally(() => {
                this.$loadingElement.hide();
            });
    };

    /**
     * Build the header row for the table.
     * This makes each th element bold (with the given header.text value), and adds a sort
     * button if necessary.
     */
    DynamicTable.prototype.makeTableHeader = function (header) {
        const $header = $('<th>').append($('<b>').append(header.text));
        header.sortState = 0;
        if (header.isSortable) {
            // add sorting.
            const $sortBtn = Display.simpleButton('btn-xs', 'fa fa-sort text-muted').addClass(
                'pull-right'
            );
            $sortBtn.click(() => {
                // reset all other sort buttons
                const curState = header.sortState;
                this.headers.forEach((h) => {
                    h.sortState = 0;
                });
                // set this one to sort. if up, then down, if down then up, if neither then up
                if (curState < 1) {
                    header.sortState = 1;
                } else {
                    header.sortState = -1;
                }
                this.currentSort = header;
                this.getNewData();
            });
            $header.append($sortBtn);
        }
        $header.resizable({
            handles: 'e',
        });
        return $header;
    };

    /*
     * Sets the actual data into the table.
     * This empties out the current table body, and replaces the contents with the values in data.
     * Data is expected to be a list of lists.
     * If this DynamicTable was initialized with a decoration on each column, those columns have
     * their decoration applied to them as well, and linked to the clickFunction.
     */
    DynamicTable.prototype.setData = function (data) {
        // list of lists. Empty it out, then put it in place in the given order.
        this.currentData = data;
        this.$tBody.empty();
        data.forEach((row) => {
            // decorate each row element as necessary
            const renderedRow = row.slice(); // make a copy by value
            this.options.decoration.forEach((dec) => {
                if (dec.type == 'link') {
                    renderedRow[dec.col] =
                        '<a style="cursor:pointer">' + renderedRow[dec.col] + '</a>';
                } else if (dec.type == 'button') {
                    renderedRow[dec.col] =
                        '<button class="btn btn-default btn-sm">' +
                        renderedRow[dec.col] +
                        '</button>';
                }
            });
            // build the table row elem
            let $newRow = tableRow(renderedRow);
            // add click bindings to decorated elements
            this.options.decoration.forEach((dec) => {
                if (dec.clickFunction) {
                    const $clickElem = $newRow.find('td:eq(' + dec.col + ') > :eq(0)');
                    $clickElem.click(() => {
                        dec.clickFunction($clickElem.text());
                    });
                }
            });
            if (this.options.rowFunction) {
                $newRow = this.options.rowFunction($newRow, row);
            }
            this.$tBody.append($newRow);
        });
    };

    /**
     * Updates the table based on the given data.
     * Data should have the following keys:
     * rows = list of lists, contains the actual data
     * start = int, the index of the first value, compared to the total available data
     * total = int, the total available rows (not just in this view)
     */
    DynamicTable.prototype.update = function (data) {
        // update header sort buttons
        this.headers.forEach((h, idx) => {
            if (h.isSortable) {
                let newClass = 'fa-sort text-muted';
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
        });
        // update data
        if (!data) {
            throw {
                message: 'There was no data or information about it provided for the table.',
                name: 'no data',
            };
        }
        this.setData(data.rows);
        this.start = data.start;
        this.end = data.start + data.rows.length;
        this.total = data.total;
        this.$shownText.text(
            'Showing ' + (this.start + 1) + ' to ' + this.end + ' of ' + this.total
        );
        //  + ' on page ' + this.currentPage);
    };

    /**
     * Converts an array to a table row.
     * e.g., if the array is ['abc', '123']
     * this returns:
     * <tr>
     *     <td>abc</td>
     *     <td>123</td>
     * </tr>
     */
    var tableRow = function (data) {
        const elem = 'td';
        return $('<tr>').append(
            data
                .map((d) => {
                    return '<' + elem + '>' + d + '</' + elem + '>';
                })
                .join()
        );
    };

    return DynamicTable;
});
