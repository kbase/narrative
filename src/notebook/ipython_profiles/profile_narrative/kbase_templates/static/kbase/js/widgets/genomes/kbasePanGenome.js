/**
 *  widget to display a pangenome object
 * 
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbasePanGenome",
        parent: "kbaseWidget",
        version: "1.0.0",
        init: function(options) {
            this._super(options);
            var self = this;
            var ws = options.ws;
            var name = options.name;            

            var container = this.$elem;

            container.loading();           
            var prom = kb.ws.get_objects([{workspace:ws, name: name}])
            $.when(prom).done(function(data) {
                container.rmLoading();
                var data = data[0].data;
                buildTable(data)
            }).fail(function(e){
                $(ele).rmLoading();
                $(ele).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            });

            function buildTable(data) {
                console.log(data)

                var table = $('<table class="table table-bordered table-striped"'+
                                    'style="width: 100%;">');
                var tabs = container.kbTabs({tabs: [
                                            {name: 'Orthologs', content: table, active: true}]
                                         });

                var tableSettings = {
                    "sPaginationType": "bootstrap",
                    "iDisplayLength": 10,
                    "aaData": data.orthologs,
                    "aaSorting": [[ 3, "desc" ]],
                    "aoColumns": [
                      { "sTitle": "Function", 'mData': 'function'},
                      { "sTitle": "ID", 'mData': 'id'}, //"sWidth": "10%"
                      { "sTitle": "Type", 'mData': 'type'},
                      { "sTitle": "Ortholog Count", 'mData': function(d) {
                            return '<a class="show-orthologs" data-id="'+d.id+'">'
                                    +d.orthologs.length+'</a>'
                          },
                      },
                    ],
                    "oLanguage": {
                        "sEmptyTable": "No objects in workspace",
                        "sSearch": "Search: "
                    },
                    'fnDrawCallback': events
                }


                // create the table
                table.dataTable(tableSettings);

                function events() {
                    // event for clicking on ortholog count
                    $('.show-orthologs').unbind('click');
                    $('.show-orthologs').click(function() {
                        var id = $(this).data('id');
                        var info = 'blah blah';
                        tabs.addTab({name: id, content: 'Coming soon', removable: true});
                    })
                }

                // work in progress
                function getOrthologInfo(id) {
                    console.log(data)
                    for (var i in data) {
                        if (data[i].id == id) {
                            console.log('match')

                            var ort_list = data.orthologs
                            return ort_list
                        }
                    }
                }
            }
    
            return this;
        }
    });
})( jQuery )