(function( $, undefined ) {
    $.KBWidget({
        name: 'kbaseNarrativeDataTable',
        parent: 'kbaseWidget',
        version: '1.0.0',
        options: {
            workspaceURL: "http://140.221.84.209:7058", // "http://kbase.us/services/ws",
            wsBrowserURL: "http://140.221.85.168/landing-pages/#/ws/",
            landingPageURL: "http://140.221.85.168/landing-pages/#/",
            noDataText: "No data found",
            data: null
        },

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
                                  'style' : 'width:95%',
                                  'placeholder' : 'Search',
                               });

            this.$elem.append($('<div>').append(this.$dataSelect))
                      .append($('<div>').append(this.$dataSearch))
                      .append(this.$dataTable);

            this.$dataSelect.change($.proxy(function(event) {
                var filterValue = '';
                this.$dataSelect.find('option:selected').each(function(){ filterValue = $( this ).val(); });
                this.$dataTable.fnFilter(filterValue, 2);
            }, this));

            this.$dataSearch.keyup($.proxy(function(event) {
                var value = this.$dataSearch.val();
                this.$dataTable.fnFilter(value, 1);
            }, this));

            this.$dataTable.dataTable({
                sScrollX: '100%',
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
                            return data + 
                                   "<span class='glyphicon glyphicon-question-sign kb-function-help' " + 
                                   "data-ws='" + row[0] + "' " +
                                   "data-id='" + row[1] + "' " + 
                                   "style='margin-top: -3px'></span>";
                        },
                        aTargets: [1]
                    },
                ],
                bInfo: false,
                bLengthChange: false,
                bPaginate: false,
                bAutoWidth: true,
                bScrollCollapse: true,
                sScrollY: '240px',
            });

            if (this.options.data)
                this.setData(this.options.data);

            return this;
        },

        /**
         * Sets the data to be shown in this widget.
         * @param {Array} data - this is expected to be an Array of Arrays, which each sub-array representing
         * a single object. It is expected to have the fields: [workspace, ID, type] (though type isn't currently used)
         */
        setData: function(data) {
            this.$dataSelect.empty();
            this.$dataSelect.append('<option value="">All Types</option>');

            var dataList = [];
            var dataKeys = Object.keys(data);
            dataKeys.sort();
            $.each(dataKeys, $.proxy(function(idx, key) {
                this.$dataSelect.append($('<option>')
                                          .attr('value', key)
                                          .append(key + ' (' + data[key].length + ')'));
                dataList = dataList.concat(data[key]);
            }, this));

            this.$dataTable.fnClearTable();
            this.$dataTable.fnAddData(dataList);
            this.$dataTable.find('.kb-function-help').click(
                $.proxy(function(event) {
                    var ws = $(event.target).attr('data-ws');
                    var id = $(event.target).attr('data-id');
                    this.trigger('dataInfoClicked.Narrative', [ws, id]);
                }, 
                this)
            );
        },
    })

})(jQuery);