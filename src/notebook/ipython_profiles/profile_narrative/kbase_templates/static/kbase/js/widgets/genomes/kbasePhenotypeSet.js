/**
 * Just a simple example widget to display phenotypedata
 * 
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbasePhenotypeSet",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
            color: "black",
        },

        translaterefs: function(reflist,refhash) {
            // removed
        },

        init: function(options) {
            this._super(options);
            var self = this;
            var data = options.data
            data = $.extend(data,{})
            var container = this.$elem;
            var reflist = data[0].refs;
            reflist.push(data[0].data.genome_ref);

            var prom = kb.ui.translateRefs(reflist);  // this should be done outside the widget
            $.when(prom).done(function(refhash) {

                // setup tabs
                var phenoTable = $('<table class="table table-bordered table-striped" style="width: 100%;">');
                console.log('loading tabs')
                var tabs = container.tabs({tabs: [
                                            {name: 'Overview', active: true},
                                            {name: 'Phenotypes', content: phenoTable}]
                                          })

                console.log('tabs', tabs)
                // Code to displaying phenotype overview data
                var keys = [
                    {key: 'wsid'},
                    {key: 'ws'},
                    {key: 'kbid'},
                    {key: 'source'},
                    {key: 'genome'},
                    {key: 'type'},
                    {key: 'errors'},
                    {key: 'owner'},
                    {key: 'date'}
                ];
                var phenooverdata = {
                    wsid: data[0].info[1],
                    ws: data[0].info[7],
                    kbid: data[0].data.id,
                    source: data[0].data.source,
                    genome: refhash[data[0].data.genome_ref].link, //data[0].data.genome_ref, 
                    type: data[0].data.type,
                    errors: data[0].data.importErrors,
                    owner: data[0].creator,
                    date: data[0].created,
                };
                var labels = ['Name','Workspace','KBID','Source','Genome','Type','Errors','Owner','Creation date'];
                var table = kb.ui.objTable('overview-table',phenooverdata,keys,labels);
                tabs.tabContent('Overview').append(table)

                //Code for loading the phenotype list table
                pheno = data[0].data;
                var tableSettings = {
                     "sPaginationType": "bootstrap",
                     "iDisplayLength": 10,
                     "aaData": pheno.phenotypes,
                     "aaSorting": [[ 3, "desc" ]],
                     "aoColumns": [
                       { "sTitle": "Name", 'mData': 'name'},
                       { "sTitle": "Media", 'mData': function(d) {
                         return '<a data-ref="'+refhash[d.media_ref].label+
                                    '" class="btn-show-media-tab">'+
                                    refhash[d.media_ref].label+
                                '</a>'; //d.media_ref
                       }},
                       { "sTitle": "Gene KO", 'mData': function(d) {
                         return d.geneko_refs.join("<br>")
                       }},
                       { "sTitle": "Additional compounds", 'mData': function(d) {
                         return d.additionalcompound_refs.join("<br>")
                       }},
                       { "sTitle": "Growth", 'mData': 'normalizedGrowth'},
                     ],                         
                     "oLanguage": {
                         "sEmptyTable": "No objects in workspace",
                         "sSearch": "Search: "
                     },
                     'fnDrawCallback': events
                }
                var table = phenoTable.dataTable(tableSettings);


                function events() {
                    $('.btn-show-media-tab').unbind('click');
                    $('.btn-show-media-tab').click(function() {
                        var ref = $(this).data('ref');
                        var ele = $('<div>').loading();
                        tabs.addTab({name: ref, content: ele, removable: true});
                        mediaTab(ele, ref.split('/')[0], ref.split('/')[1])
                    })
                }

                function mediaTab(ele, ws, id) {
                    var prom = kb.fba.get_media({medias: [id], workspaces: [ws]})
                    $.when(prom).done(function(data) {
                        ele.rmLoading();
                        $(ele).kbaseMediaEditor({ids: [id], 
                                                 workspaces : [ws],
                                                 data: data});
                    }).fail(function(e){
                        $(ele).rmLoading();
                        $(ele).append('<div class="alert alert-danger">'+
                                        e.error.message+'</div>')
                    });
                }

            })            

            return this;
        }

    });
})( jQuery )