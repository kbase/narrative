(function( $, undefined ) {

$.KBWidget({
    name: "kbasePathways",     
    version: "1.0.0",
    options: {
    },
    
    init: function(options) {
        var self = this;
        this._super(options);

        self.models = options.modelData;
        self.fbas = options.fbaData;
        self.ws = options.ws;
        self.default_map = options.defaultMap
        self.state = options.state;  //this should be an angular widget

        console.log(self.state)
        console.log(self.fbas)

        var container = this.$elem;

        var stroke_color = '#666';

        var tableSettings = {
                        "sPaginationType": "bootstrap",
                        "iDisplayLength": 10,
                        "aaData": [],
                        "fnDrawCallback": events,
                        "aaSorting": [[ 1, "asc" ]],
                        "aoColumns": [
                            { "sTitle": "Name"}, //"sWidth": "10%"
                            //{ "sTitle": "Map id"} ,                            
                            //{ "sTitle": "Rxn Count", "sWidth": "12%"},
                            //{ "sTitle": "Cpd Count", "sWidth": "12%"},
                            //{ "sTitle": "Source","sWidth": "10%"},
                        ],                         
                        "oLanguage": {
                            "sEmptyTable": "No objects in workspace",
                            "sSearch": "Search:"
                        }
                    }

        container.append('<span class="label label-danger pull-right">Beta</span><ul class="nav nav-tabs">\
                              <li class="active"><a href="#path-list" data-toggle="tab">Maps</a></li>\
                        </ul>');
        container.append('<div class="tab-content" style="margin-top:15px;">\
                              <div class="tab-pane active" style="margin-top:15px;" id="path-list"></div>\
                          </div>');

        // load table for maps
        var p = kb.ws.list_objects({workspaces: [self.ws]})
        $.when(p).done(function(d){
            var aaData = [];
            for (var i in d) {

                var obj = d[i]
                var name = '<a class="pathway-link" data-map="'+obj[1]+'">'+obj[1]+'</a>';
                aaData.push([name])
            }

            tableSettings.aaData = aaData; 

            var table_id = 'pathway-table';
            $('#path-list').append('<table id="'+table_id+'" \
                           class="table table-bordered table-striped" style="width: 100%;"></table>');
            var table = $('#'+table_id).dataTable(tableSettings);  
        }).fail(function(e){
            container.prepend('<div class="alert alert-danger">'+
                        e.error.message+'</div>')
        });



        self.loadMap = function(map) {
            var p = kb.ws.get_objects([{workspace: self.ws, name: map}])
            $.when(p).done(function(d) {
                var d = d[0].data

                $('#path-'+map).kbasePathway({ws: self.ws, 
                                             mapID: map, 
                                             mapData: d,
                                             editable:true,
                                             modelData: self.models,
                                             fbaData: self.fbas
                                         })
            }).fail(function(e){
                container.prepend('<div class="alert alert-danger">'+
                e.error.message+'</div>')
            });
        }



        function events() {
            // event for clicking on pathway link
            container.find('.pathway-link').unbind('click')
            container.find('.pathway-link').click(function() {
                var map = $(this).data('map');
                new_map_tab(map)
            });

        
            // tooltip for hover on pathway name
            container.find('.pathway-link').tooltip({title: 'Open path tab', placement: 'right', delay: {show: 500}});
        } // end events


        function new_map_tab(map) {
            var tab = $('<li><a class="pathway-tab" href="#path-'+map+'"\
                            data-map="'+map+'" data-toggle="tab">'
                                +map.slice(0, 10)+'</a>'+
                        '</li>')          

            container.find('.tab-content')
                    .append('<div class="tab-pane" id="path-'+map+'"></div>'); 

            container.find('.nav-tabs').append(tab);

            container.find('.pathway-tab').unbind('click');
            container.find('.pathway-tab').click(function() {
                var map = $(this).data('map');
                if (self.models) {
                    self.state.transitionTo('ws.models', {map: map})
                } else if (self.fbas) {
                    console.log('calling', map)
                    console.log(self.state)
                    self.state.transitionTo('ws.fbas', {map: map})
                }
            });
        }


        if (self.default_map) {
            new_map_tab(self.default_map);
            self.loadMap(self.default_map);
        }


        return this;
    }  //end init

})
}( jQuery ) );

