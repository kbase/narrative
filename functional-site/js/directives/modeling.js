

angular.module('modeling-directives', []);
angular.module('modeling-directives')
.directive('pathways', function($location, $compile) {
    return {
        link: function(scope, element, attrs) {
            var type = scope.type;
            var map_ws = 'nconrad:paths';
            console.log(type, map_ws)

            var p = $(element).kbasePanel({title: 'Pathways', 
                                           type: 'Pathway',
                                           rightLabel: map_ws,
                                           subText: scope.id});
            p.loading();


            if (type == "Model") {
                var prom = get_objects(scope.ids, scope.ws)
                                   
                $.when(prom).done(function(d) {
                    var data = [d[0].data];
                    $(p.body()).pathways({modelData: data, 
                                ws: map_ws, defaultMap: scope.defaultMap,
                                scope: scope});
                }).fail(function(e){
                    $(p.body()).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>');
                });

            } else if (type == "FBA") {
                //var prom = get_objects(scope.ids, scope.ws);
                console.log('calling!')
                var prom = kb.req('ws', 'get_objects', scope.selected);

                $.when(prom).done(function(d) {
                    var data = [d[0].data];
                    console.log(data)
                    $(p.body()).pathways({fbaData: data, 
                                ws: map_ws, defaultMap: scope.defaultMap,
                                scope: scope})   
                }).fail(function(e){
                    $(p.body()).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>');
                });
            }


            function get_objects(ids, workspaces) {
                var identities = []
                for (var i=0; i< ids.length; i++) {
                    var identity = {}
                    identity.name = ids[i];
                    identity.workspace = workspaces[i]
                }

                var prom = kb.req('ws', 'get_objects', identities);
                return prom;
            }

            $.fn.pathways = function(options) {
                self.models = options.modelData;
                self.fbas = options.fbaData;
                self.ws = options.ws;
                self.default_map = options.defaultMap

                console.log('fba data', self.fbas)
                var container = $(this);

                var stroke_color = '#666';

                console.log('called widget again')

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

                var tab = $('<li class="tab active"><a>Maps</a></li>')
                tab.click(function(){
                    if(scope.id && scope.ws) {
                        $location.search({map: 'list'})
                        scope.$apply();
                    }
                    $('.tab').removeClass('active');
                    $(this).addClass('active')
                    $('.tab-pane').removeClass('active');                             
                    $('#path-list').addClass('active');    
                })
                
                var tabs = $('<ul class="nav nav-tabs"></ul>');
                tabs.append(tab);

                container.append(tabs);
                container.prepend('<span class="label label-danger pull-right">Beta</span>')
                container.append('<div class="tab-content" style="margin-top:15px;">\
                                      <div class="tab-pane active" style="margin-top:15px;" id="path-list"></div>\
                                  </div>');


                function load_map_list() {
                    // load table for maps
                    var p = kb.ws.list_objects({workspaces: [self.ws]})
                    $.when(p).done(function(d){
                        var aaData = [];
                        for (var i in d) {

                            var obj = d[i];

                            if (type == 'Model') {
                                var route = 'models';
                            } else {
                                var route = 'fbas';
                            }

                            // if this is a usual page (and not another app)
                            if (scope.ws && scope.id) {
                                var url = 'ws.'+route+"({ws:'"+scope.ws+"', id:'"+scope.id+"'})";
                            }

                            var link = '<a '+(url ? 'ui-sref="'+url+'" ' : '')+
                                    'class="pathway-link" data-map="'+obj[1]+'">'+obj[1]+'</a>'
                            var name = link

                            aaData.push([name])
                        }

                        tableSettings.aaData = aaData; 

                        var table_id = 'pathway-table';
                        $('#path-list').append('<table id="'+table_id+'" \
                                       class="table table-bordered table-striped" style="width: 100%;"></table>');
                        var table = $('#'+table_id).dataTable(tableSettings);  
                        $compile(table)(scope);
                    }).fail(function(e){
                        container.prepend('<div class="alert alert-danger">'+
                                    e.error.message+'</div>')
                    });
                }
                load_map_list()

                self.loadMap = function(map) {
                    // there needs to be all this manual tab styling due to 
                    // url parms, i think.  I'm not sure
                    $('.tab').removeClass('active')
                    $('#path-tab-'+map).addClass('active');
                    $('.tab-pane').removeClass('active');                             
                    $('#path-'+map).addClass('active');                        
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
                        var exists;
                        $('.pathway-tab').each(function() {
                            var map = $(this).data('map');
                            new_map_tab(map)                            
                        })
                        var map = $(this).data('map');
                        new_map_tab(map)
                    });

                    // tooltip for hover on pathway name
                    container.find('.pathway-link').tooltip({title: 'Open path tab', placement: 'right', delay: {show: 500}});

                } // end events


                function new_map_tab(map) {
                    var tab = $('<li class="tab pathway-tab" data-map="'+map+'" id="path-tab-'+map+'"><a>'
                                        +map.slice(0, 10)+'</a>'+
                                '</li>')          

                    container.find('.tab-content')
                            .append('<div class="tab-pane" id="path-'+map+'"></div>'); 

                    container.find('.nav-tabs').append(tab);

                    container.find('.pathway-tab').unbind('click');
                    container.find('.pathway-tab').click(function() {
                        var map = $(this).data('map');
                        $location.search({map: map});
                        scope.$apply();
                        self.loadMap(map);
                    }); 
                }

                if (self.default_map) {
                    if (self.default_map != 'list') {
                        new_map_tab(self.default_map);
                        self.loadMap(self.default_map);
                    }
                } 
            }    

        }
    };
})
