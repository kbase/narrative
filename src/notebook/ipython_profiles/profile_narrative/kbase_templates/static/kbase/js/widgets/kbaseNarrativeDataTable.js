/**
 * A decompartmentalized data table widget, factored out of the kbaseWorkspaceDataDeluxe widget.
 * This is just a fancy datatables object that shows a single column (data id), with clickable buttons
 * that will trigger a dataInfoClicked.Narrative event.
 * It also has a Select element that allows the user to filter on object type, similar to the 
 * Workspace browser.
 * 
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeDataTable',
        parent: 'kbaseWidget',
        version: '1.0.0',
        options: {
            noDataText: "No data found",
            data: null
        },

        /**
         * @method init
         * Builds the DOM structure for the widget.
         * Includes the tables and panel.
         * If any data was passed in (options.data), that gets shoved into the datatable.
         * @param {Object} - the options set.
         * @returns {Object} this shiny new widget.
         * @private
         */
        init: function(options) {
            this._super(options);

            this.$dataTable = $('<table cellpadding="0" cellspacing="0" border="0" class="table kb-data-table">');
            this.$dataSelect = $('<select>')
                               .addClass('form-control')
                               .css({'width' : '95%'});
            this.$dataSearch = $('<input>')
                               .attr({
                                  'type' : 'text',
                                  'class' : 'form-control',
                                  'style' : 'width: 95%',
                                  'placeholder' : 'Search',
                               });

            /* Really, we have just 3 elements.
             * 1. the <select> filter
             * 2. the search bar
             * 3. the table itself.
             * and they stack on each other like that.
             */
            this.$elem.append($('<div>').append(this.$dataSelect))
                      .append($('<div>').append(this.$dataSearch))
                      .append(this.$dataTable);

            this.$dataSelect.change($.proxy(function(event) {
                var filterValue = '';
                this.$dataSelect.find('option:selected').each(function(){ filterValue = $( this ).val(); });
                if (filterValue.length > 0)
                    this.$dataTable.fnFilter("^" + filterValue + "$", 2, true);
                else
                    this.$dataTable.fnFilter("", 2, true);
            }, this));

            // just filter the search bar on keyup events.
            // maybe add keydown? i don't know? i don't think we need to, though.
            this.$dataSearch.keyup($.proxy(function(event) {
                var value = this.$dataSearch.val();
                this.$dataTable.fnFilter(value, 1);
            }, this));

            /*
             * Make the datatable! It includes a 'no data found' text box if it's empty.
             * This should be styled to how the data is used.
             */
            this.$dataTable.dataTable({
                iDisplayLength: -1,
                bPaginate: false,
                oLanguage: {
                    sZeroRecords: '<div style="text-align: center">' + this.options.noDataText + '</div>',
                },
                aoColumns: [
                    { "sTitle": "Workspace", bVisible: false},
                    { "sTitle": "ID" },
                    { "sTitle": "Type", bVisible: false },
                ],
                aoColumnDefs: [
                    { 'bSortable': false, 'aTargets': [ 0 ] },
                    {
                        mRender: function(data, type, row) {
                            // if the 'data' (name) is too long,
                            // truncate it and give it a tooltip with the full name.
                            var type = row[2];
                            var typeName = /^(\S+)-/.exec(type);
                            if (typeName && typeName[1]) {
                                type = typeName[1];
                            }
                            return "<div data-toggle='tooltip' title='" + type + "\n" + data + "'>" + 
                                   "<span class='kb-data-obj-name' >" +
                                            data + 
                                   "</span>" +
                                   "<span class='glyphicon glyphicon-question-sign kb-function-help' " + 
                                          "data-ws='" + row[0] + "' " +
                                          "data-id='" + row[1] + "' " + 
                                          "style='display: inline-block;'>" +
                                   "</span>" +
                                   "</div>";

                        },
                        aTargets: [1]
                    },
                ],
                bInfo: false,
                bLengthChange: false,
                bPaginate: false,
                bAutoWidth: true,
                bScrollCollapse: true,
                sScrollY: '225px',
            });

            if (this.options.data)
                this.setData(this.options.data);

            return this;
        },

        /**
         * Sets the data to be shown in this widget.
         * @param {Object} data - this is expected to be a mapping from data type to array of data.
         * e.g.:
         * {
         *   'data_type' : [
         *                   [ 'workspace', 'object name', 'data_type' ],
         *                   [ 'workspace', 'object name', 'data_type' ],
         *                 ],
         *   'data_type2' : [
         *                    [ 'workspace', 'object name', 'data_type' ],
         *                    [ 'workspace', 'object name', 'data_type' ],
         *                  ]
         * }
         *
         * The extra 'data_type' in the elements is a little redundant, but it speeds up pre-processing
         * by allowing this widget to just dump everything in the table, and is necessary to be in the 
         * table's row for filtering (though it's currently invisible).
         * @private
         */
        setData: function(data) {
            this.$dataSelect.empty();
            if (!data || data.length === 0)
                return;

            // Add an 'all types' filter option that just shows everything.
            this.$dataSelect.append('<option value="">All Types</option>');

            var dataList = [];
            var dataKeys = Object.keys(data);
            // The types to be filtered should be alphabetically sorted
            dataKeys.sort();
            $.each(dataKeys, $.proxy(function(idx, key) {
                this.$dataSelect.append($('<option>')
                                          .attr('value', key)
                                          .append(key + ' (' + data[key].length + ')'));
                // Just grab everything from each type and throw it into the dataList array
                dataList = dataList.concat(data[key]);
            }, this));

            this.$dataTable.fnClearTable();
            this.$dataTable.fnAddData(dataList);
            // Once the table's rendered, we can bind the click events.
            // This would be trickier if we were paginating the table. But we're not!
            this.$dataTable.find('.kb-function-help').click(
                $.proxy(function(event) {
                    var ws = $(event.target).attr('data-ws');
                    var id = $(event.target).attr('data-id');
                    this.trigger('dataInfoClicked.Narrative', [ws, id]);
                }, 
                this)
            );
//             this.$dataTable.find('span.kb-data-obj-name').each(function(i) {
//                 var elem = $(this)
//                            .clone()
// //                           .removeClass('kb-data-obj-name')
//                            .css({display: 'inline', width: 'auto', visibility: 'hidden'})
//                            .appendTo('body');

//                 if (elem.width() > $(this).width())
//                     $(this).css({color: '#ff0000'});
//                 console.log(elem.width() + " " + $(this).width())

//                 elem.remove();
//             });
            this.$dataTable.find('[data-toggle="tooltip"]').tooltip({'placement':'right', container: 'body'});
        },
    })

})(jQuery);