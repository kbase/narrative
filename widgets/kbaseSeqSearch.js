(function( $, undefined ) {

$.kbWidget("kbaseSeqSearch", 'kbaseWidget', {
    version: "1.0.0",
    options: {
    },
    init: function(options) {
        this._super(options);
        var self = this;

        //$('.tree').tree();

        var cdmi = new CDMI_EntityAPI("http://kbase.us/services/cdmi_api/");
        var s_search = new seq_search("http://140.221.85.75:7080/");    
        //var kbws = new workspaceService('http://kbase.us/services/workspace/');

        //var test_seq = "MAGNTIGQLFRVTTFGESHGLALGCIVDGVPPGIPLTEADLQHDLDRRRPGTSRYTTQRREPDQVKILSGVFEGVTTGTSIGLLIENTDQRSQDYSAIKDVFRPGHADYTYEQKYGLRDYRGGGRSSARETAMRVAAGAIAKKYLAEKFGIEIRGCLTQMGDIPLDIKDWSQVEQNPFFCPDPDKIDALDELMRALKKEGDSIGAKVTVVASGVPAGLGEPVFDRLDADIAHALMSINAVKGVEIGDGFDVVALRGSQNRDEITKDGFQSNHAGGILGGISSGQQIIAHMALKPTSSITVPGRTINRFGEEVEMITKGRHDPCVGIRAVPIAEAMLAIVLMDHLLRQRAQNADVKTDIPRW"

        var init_data = {
            "fnDrawCallback": events,        
            "sPaginationType": "full_numbers",
            "iDisplayLength": 10,
            "aaData": [],
            "bScrollInfinite": true,
            "bScrollCollapse": true,
            "sScrollY": "200px",
            "aoColumns": [
                { "sTitle": "Genome" },
                { "sTitle": 'KBid'},
            ],
            "oLanguage": {
                "sSearch": "", //"Search genomes:",
                "sInfo": "Loaded _END_ of _TOTAL_ genomes"       
            },
            "fnInitComplete": function() {
                var table_header,
                  _this = this;
                table_header = $('.dataTables_scrollHeadInner').css('position', 'relative');
                $('body.admin.selections_index').find('.dataTables_scrollBody').bind('jsp-scroll-x', function(event, scrollPositionX, isAtLeft, isAtRight) {
                 table_header.css('right', scrollPositionX);
                }).jScrollPane();
              }
        }

        var select_table;

        function load_select_table() {
            $('.target-gnomes').show()

            if (select_table == undefined) {

                $('.target-genome-tbl').append('<p class="muted s-loader"> \
                         <img src="img/ajax-loader.gif"></img> loading...</p>')        
                var gnome_AJAX = cdmi.all_entities_Genome(0, 10000, ["scientific_name"]);
                $.when(gnome_AJAX).done(function(data){
                    $('.target-genomes').show();

                    var t_data = []
                    for (var key in data) {
                        t_data.push([data[key].scientific_name, key])
                    }
                    init_data.aaData = t_data;
                    select_table = $('.genome-selection').dataTable(init_data);
                    $('.dataTables_filter input').attr('placeholder', 'Type a genome')
                    //$('.genome-selection').jScrollPane();
                    events();
                    $('.s-loader').remove()
                });
            }

        }


        $('.target-db').change(function(){
            if ($(this).val() == 'Select KBase Genomes') {
                load_select_table()
            } else {
                $('.target-gnomes').hide()
            }
        })

        var active_list = []

        function events() {
            $('.genome-selection tr').unbind('click')
            $('.genome-selection tr').click( function() {
                var td = $(this).children('td');
                if ( td.hasClass('row-selected') ) {
                    td.removeClass('row-selected');
                } else {
                    td.addClass('row-selected');
                } 

                var col1 = td.first().text();
                var col2 = td.eq(1).text()
                var found, pos;
                for (var i in active_list) {
                    if (active_list[i][0] == col1) {
                        found = true;
                        pos = i;
                    }
                }

                if (found) {
                    if (active_list.length == 1) {
                        active_list = []
                    } else {
                        console.log(active_list.splice(pos,pos) )
                    }
                } else {

                    active_list.push([col1,col2]);
                }

                update_selected(active_list);
            });
        }

        function update_selected(active_list) {
            var d = $('.selected-genomes')
            d.html('')
            if (d.children().length == 0) {
                d.append('<h5>Selected Genomes:</h5>')
            }
            for (var i in active_list) {
                d.append('<div><span class="badge badge-important selected-genome">'+active_list[i][0]+' <a href="*">\
                            <i class="icon-remove"></i></a></span></div>');
            }
            $('.selected-genomes').html(d.html());
        }

        var init_results = {
            //"fnDrawCallback": events,        
            "sPaginationType": "full_numbers",
            "iDisplayLength": 10,      
            "aoColumns": [
                {mData: "e_value", sTitle: "e_value"},
                {mData: "genome", sTitle: "genome"},
                {mData: "feature", sTitle: "feature"},
                {mData: "feature_end", sTitle: "feature_end"},
                {mData: "feature_length", sTitle: "feature_length"},
                {mData: "feature_start", sTitle: "feature_start"},
                {mData: "query_end", sTitle: "query_end"},
                {mData: "query_length", sTitle: "query_length"},
                {mData: "query_start", sTitle: "query_start"},
                {mData: "strand", sTitle: "strand"}
            ],
            "oLanguage": {
                "sSearch": "", //"Search genomes:",
    //            "sInfo": "Loaded _END_ of _TOTAL_ genomes"       
            },
            "bLengthChange": false, "bPaginate": false
        }

        $('.submit-btn').click(function(){
            var seq = $('.seq-input').val();

            var genome_ids = [];
            for (var i in active_list) {
                genome_ids.push(active_list[i][1]);
            }
            if (results_tbl !== undefined ) results_tbl.fnDestroy();
            $('.results-container').html('')
            $('.results-container').append('<table class="results-tbl table-striped table-bordered"></table>')
            $('.results-container').append('<p class="muted results-loader"> \
                     <img src="img/ajax-loader.gif"></img> loading...</p>')
            console.log(genome_ids)
            if (genome_ids.length > 0) {
                var seq_AJAX = s_search.blast_one_sequence_against_a_genome(seq, genome_ids);
            } else {
                var seq_AJAX = s_search.blast_one_sequence_against_a_genome(seq, ["NR"]);
            }

            $.when(seq_AJAX).done(function(data){
                disp_results(data);
                $('.group-item-expander').prepend('<span class="caret"></span>')     
                $('.results-loader').remove();
            })
        })

        var results_tbl;
        function disp_results(data) {
            //$('.results-container').html(JSON.stringify(data))  
            if (results_tbl == undefined) {
                results_tbl = $('.results-tbl').dataTable(init_results)
                    .rowGrouping({ iGroupingColumnIndex: 1,
                                            sGroupBy: "name",
                                            bExpandableGrouping: true,
                                        asExpandedGroups: [],});
                for (var i in data[0]) {
                    var row = data[0][i]
                    row['genome'] = get_model_id(row.feature)
                }
                results_tbl.fnAddData(data[0])
            } else {
                results_tbl = undefined;
                results_tbl = $('.results-tbl').dataTable(init_results)
                    .rowGrouping({ iGroupingColumnIndex: 1,
                                            sGroupBy: "name",
                                            bExpandableGrouping: true,
                                        asExpandedGroups: [],});
                for (var i in data[0]) {
                    var row = data[0][i]
                    row['genome'] = get_model_id(row.feature)
                }
                results_tbl.fnAddData(data[0])

            }

        }

        function get_model_id(ws_id) {
            var pos = ws_id.indexOf('.');
            var ws_id = ws_id.slice(0, ws_id.indexOf('.', pos+1));
            return ws_id;
        }

        //this._rewireIds(this.$elem, this);
        return this;
    }  //end init
})
}( jQuery ) );
