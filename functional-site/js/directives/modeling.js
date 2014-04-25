

angular.module('modeling-directives', []);
angular.module('modeling-directives')
.directive('pathways', function($location, $compile) {
    return {
        link: function(scope, element, attrs) {
            var type = scope.type;
            var map_ws = 'nconrad:paths';
            //var ids = (scope.ids ? scope.ids : [scope.id]); //fixme

            var p = $(element).kbasePanel({title: 'Pathways', 
                                           type: 'Pathway',
                                           rightLabel: map_ws,
                                           subText: scope.id});
            p.loading();


            if (type == "Model") {
                var prom = kb.req('ws', 'get_objects', scope.selected);
                                   
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
                var prom = kb.req('ws', 'get_objects', scope.selected);

                $.when(prom).done(function(d) {
                    var data = [d[0].data];
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

                var container = $(this);

                var stroke_color = '#666';


                var tableSettings = {
                                "sPaginationType": "bootstrap",
                                "iDisplayLength": 10,
                                "aaData": [],
                                "fnDrawCallback": events,
                                "aaSorting": [[ 1, "asc" ]],
                                "aoColumns": [
                                    { "sTitle": "Name"}, //"sWidth": "10%"
                                    { "sTitle": "Map ID"},
                                    { "sTitle": "Rxn Count", "sWidth": "10%"} , 
                                    { "sTitle": "Cpd Count", "sWidth": "10%"} ,                                                                                            
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
                    var p = kb.ws.list_objects({workspaces: [self.ws], includeMetadata: 1})
                    $.when(p).done(function(d){
                        var aaData = [];
                        for (var i in d) {
                            var obj = d[i];
                            console.log(obj)
                            console.log('type!', type)

                            if (type == 'Model') {
                                var route = 'models';
                            } else {
                                var route = 'fbas';
                            }
                            console.log('route', route)

                            // if this is a usual page (and not another app)
                            if (scope.ws && scope.id) {
                                var url = 'ws.'+route+"({ws:'"+scope.ws+"', id:'"+scope.id+"'})";
                            }

                            var link = '<a '+(url ? 'ui-sref="'+url+'" ' : '')+
                                    'class="pathway-link" data-map="'+obj[1]+'">'+obj[10].name+'</a>'
                            var name = link;

                            var rxn_count = obj[10].reaction_ids.split(',').length;
                            var cpd_count = obj[10].compound_ids.split(',').length;
                            aaData.push([name, obj[1], rxn_count, cpd_count])
                            //aaData.push([name, obj[1]])
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
                        var map = $(this).data('map');
                        var name = $(this).text();
                        var exists;

                        // see if map tab already exists
                        $('.pathway-tab').each(function() {
                            var existing_map = $(this).data('map');
                            if (map == existing_map) {
                                exists = true;
                                return
                            }          
                        })

                        if (!exists) new_map_tab(map, name);
                    });

                    // tooltip for hover on pathway name
                    container.find('.pathway-link').tooltip({title: 'Open path tab', placement: 'right', delay: {show: 500}});

                } // end events


                function new_map_tab(map, name) {
                    var tab = $('<li class="tab pathway-tab" data-map="'+map+'" id="path-tab-'+map+'"><a>'
                                        +name.slice(0, 12)+'...</a>'+
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

.directive('cddviewer', function($location) {
    return {
        link: function(scope, ele, attrs) {
            //$(ele).loading()
            $.when(scope.prom).done(function() {
                scope.drawChart()

            })

            scope.drawChart = function() {
                var data = [];
                var proms = [];
                for (var i in scope.favs) {
                    var ws = scope.favs[i].ws;
                    var id = scope.favs[i].id;

                    var p = kb.req('ws', 'get_objects', [{workspace: ws,
                                                          name: id}])
                    proms.push(p);
                }

                $.when.apply($, proms).done(function() {
                    $(ele).rmLoading()

                    var data = arguments[0][0].data;

                    process(data)
                })
            }

            function process(data) {
                var featuredomains = data.featuredomains;
                var domains = []
                for (var i in featuredomains) {
                    if ( featuredomains[i].domains) {
                        var d = featuredomains[i].domains
                        domains.push(d)
                    }
                }
            }


            var width = 600;
            var height = 300;
            padding_bottom = 50

            var max_end = 200

            var h = 10;



            // random data
            var count = 100;
            var max_length = 10
            var numbers = []
            for (var i=0; i<count; i++) {
                var num = Math.floor((Math.random()*(max_end-max_length))+1);
                var num2 = Math.floor((Math.random()*max_length)+1);
                numbers.push( [num,num+num2] )
            }
            console.log('numbers', numbers)


            $(ele).append('<div id="cdd-chart"></div>')


            //Create the Scale we will use for the Axis
            var x = d3.scale.linear()
                                 .domain([0, max_end])
                                 .range([20, width-20]);

        

            //Create the Axis

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom")

            
            var zoom = d3.behavior.zoom()
                .x(x)
                .scaleExtent([1, 10])
                .on("zoom", zoomed);


            var svg = d3.select("#cdd-chart").append("svg")
                                             .attr("width", width)
                                             .attr("height", height)

                                            .attr("transform", "translate(" + 0 + "," + 0 + ")")
                                            .call(zoom);


            svg.append("rect")
                .attr("class", "overlay")
                .attr("width", width)
                .attr("height", height);                                            

            //Create an SVG group Element for the Axis elements and call the xAxis function
            var xAxisGroup = svg.append("g")
                            .attr("class", "x axis")
                            .attr("transform", "translate(0," + (height - padding_bottom) + ")")
                                .call(xAxis);
                            

            function zoomed() {
                svg.select(".x.axis").call(xAxis);
                //svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");                
                svg.selectAll('.cdd-box').attr("x", function(d) {
                    var start = d3.select(this).data()[0].start 
                    var end = d3.select(this).data()[0].end                    
                    return x(start) 
                })
                .attr('width', function(){
                    var start = d3.select(this).data()[0].start 
                    var end = d3.select(this).data()[0].end                    
                    return ( x(end)-x(start) );
                });  
            }
            
            var ystart = 20

            // create row heights
            var row_count = 25;
            var row_h = {}
            for (var i=1; i <= row_count; i++) {
                row_h[i] = height - padding_bottom - ystart-(2*(i-1)*h)
            }

            var rows = {}
            for (var i=1; i <= row_count; i++) {
                rows[i] = []
            }

            /*
            var row_h = {1: height - ystart, 
                         2: height - ystart-(2*h),
                         3: height - ystart-(4*h),
                         4: height - ystart-(6*h),
                         5: height - ystart-(8*h),
                        } */
                        /*
            var rows = {1: [],
                        2:[],
                        3:[],
                        4:[],
                        5:[]}*/




            for (var i in numbers) {
                var start = numbers[i][0];
                var end = numbers[i][1];
    
                // go through existing rows to see if there is a good row
                var found_row = 0 // starting with non existant key
                for (var key in rows) {
                    var row = rows[key]

                    var good_row = true;
                    for (var j in row) {
                        var s = row[j][0]
                        var e = row[j][1]

                        // if outside existing box, continue
                        if (start > e || end < s) {
                            continue
                        } else {
                            good_row = false
                            break;
                        }
                    }

                    if (!good_row) {
                        continue
                    } else {
                        found_row = key
                        row.push([start, end])
                        break
                    }
                }

                if (found_row) {
                    drawBox(start, end, row_h[found_row])
                } else {
                    console.error('did not find a place for ', start, end)
                }
            }


            function drawBox(start, end, height) {
                var rect = svg.append('rect')
                              .data([{start: start, end: end}])   
                              .attr('class', 'cdd-box')
                              .attr('x', x(0))
                              .attr('y', 0)
                              .attr('width', x(0)-x(0))
                              .attr('height', h)                                   
                              .transition()
                                  .duration(1000)
                                  .ease("elastic")
                                  .attr('x', x(start))
                                   .attr('y', height)                                  
                                  .attr('width', x(end)-x(start))
                                  .each("end", events)


                var content = '<b>start:</b> '+start+'<br>'+
                              '<b>end:</b> '+end+'<br>'+
                              '<b>length:</b> '+(end-start);

                //$(rect.node()).popover({html: true, content: content, animation: false,
                //                        container: 'body', trigger: 'hover'});


            }


            function events() {
                d3.select(this).on('mouseover', function(d){
                    var rect = d3.select(this);
                    var start = rect.data()[0].start
                    var end = rect.data()[0].end
                    var s = x(start);
                    var e = x(end);


                    rect.transition()
                        .duration(200)
                        .style("fill", 'steelblue');


                    svg.append('line')
                        .attr('class', 'grid-line')
                        .attr('x1', s)
                        .attr('y1', 0)
                        .attr('x2', s)
                        .attr('y2', height)
                        .attr('stroke-dasharray', "5,5" )                            

                    svg.append('line')
                        .attr('class', 'grid-line')
                        .attr('x1', e)
                        .attr('y1', 0)
                        .attr('x2', e)
                        .attr('y2', height)
                        .attr('stroke-dasharray', "5,5" )

                    svg.append('text')
                        .attr('class', 'grid-label')
                       .text(start)
                        .attr('x', s-20)
                        .attr('y', height -10)

                    svg.append('text')
                        .attr('class', 'grid-label')
                       .text(end)
                        .attr('x', e+2)
                        .attr('y', height - 10)                            


                }).on('mouseout', function(d){
                    d3.selectAll('.cdd-box')
                            .transition()
                            .duration(200)
                            .style('fill', 'lightsteelblue')
                    d3.selectAll('.grid-line').remove()
                    d3.selectAll('.grid-label').remove()
                })

                svg.on('mousemove', function () {
                   coordinates = d3.mouse(this);
                    var x = coordinates[0];
                    var y = coordinates[1];

                });                
            }            
        }
    };
})
