

angular.module('modeling-directives', []);
angular.module('modeling-directives')
.directive('pathways', function($location, $compile, $rootScope, $stateParams) {
    return {
        link: function(scope, ele, attrs) {
            var type = scope.type;
            var map_ws = 'nconrad:paths';
            console.log('default map', $stateParams.map)


            $.fn.pathways = function(options) {
                self.models = options.modelData;
                self.fbas = options.fbaData;
                self.ws = options.ws;
                self.default_map = options.defaultMap

                var maps = [];

                var container = $(this);

                var stroke_color = '#666';


                var tableSettings = {
                    "sPaginationType": "bootstrap",
                    "iDisplayLength": 10,
                    "aaData": [],
                    "fnDrawCallback": events,
                    "aaSorting": [[ 1, "asc" ]],
                    "aoColumns": [
                        { sTitle: 'Name', mData: 'name'}, 
                        { sTitle: 'Map ID', mData: 'id'},
                        { sTitle: 'Rxn Count', mData: 'rxn_count', sWidth: '10%'},
                        { sTitle: 'Cpd Count', mData: 'cpd_count',  sWidth: '10%'} ,                                                                                            
                        //{ sTitle: "Source","sWidth": "10%"},
                    ],                         
                    "oLanguage": {
                        "sEmptyTable": "No objects in workspace",
                        "sSearch": "Search:"
                    }
                }


                //container.prepend('<span class="label label-danger pull-left">Beta</span>')
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
                            var link = '<a class="pathway-link" data-map="'+obj[1]+'">'+obj[10].name+'</a>'                            
                            var name = link;

                            // add metadata if it is there
                            if ('reaction_ids' in obj[10] && 'compound_ids' in obj[10]) {
                                var rxn_count = obj[10].reaction_ids.split(',').length;
                                var cpd_count = obj[10].compound_ids.split(',').length;  
                            } else {
                                var rxn_count = 'n/a';
                                var cpd_count = 'n/a';
                            }
    
                            var row = {name: name, id: obj[1], rxn_count: rxn_count, 
                                       cpd_count: cpd_count};
                            aaData.push(row)

                            var map = {name: obj[10].name, id: obj[1], 
                                       rxn_count: rxn_count, cpd_count: cpd_count};
                            maps.push(map)

                        }

                        tableSettings.aaData = aaData; 

                        var table_id = 'pathway-table';
                        $('#path-list').append('<table id="'+table_id+'" \
                                       class="table table-bordered table-striped" style="width: 100%;"></table>');
                        var table = $('#'+table_id).dataTable(tableSettings);  
                        $compile(table)(scope);


                        if (self.default_map && self.default_map != 'list') {
                            for (var i in maps) {
                                map_obj = maps[i]
                                if (map_obj.id == self.default_map) {
                                    new_map_tab(self.default_map, map_obj.name);
                                    self.loadMap(self.default_map);
                                }
                            }
                        } 

                    }).fail(function(e){
                        container.prepend('<div class="alert alert-danger">'+
                                    e.error.message+'</div>')
                    });
                }
                load_map_list()

                self.loadMap = function(map) {
                    // there needs to be all this manual tab styling due to 
                    // url parms.
                    $('.tab').removeClass('active')
                    $('#path-tab-'+map).addClass('active');
                    $('.tab-pane').removeClass('active');                             
                    $('#path-'+map).addClass('active');
                    $('#path-'+map).loading();
                    var p = kb.ws.get_objects([{workspace: self.ws, name: map}])
                    $.when(p).done(function(d) {
                        $('#path-'+map).rmLoading();                        
                        var d = d[0].data

                        $('#path-'+map).kbasePathway({ws: self.ws, 
                                                     mapID: map, 
                                                     mapData: d,
                                                     editable: true,
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
                        console.log('new tab 1', map, name)
                        if (!exists) new_map_tab(map, name);
                    });

                    // tooltip for hover on pathway name
                    container.find('.pathway-link')
                             .tooltip({title: 'Open path tab', 
                                       placement: 'right', delay: {show: 1000}});

                } // end events


                function new_map_tab(map, name) {
                    var tab = $('<li class="tab pathway-tab" data-map="'+map+'" id="path-tab-'+map+'"><a>'
                                        +name.slice(0, 12)+'...</a>'+
                                '</li>')          

                    container.find('.tab-content')
                            .append('<div class="tab-pane" id="path-'+map+'"></div>'); 

                    $('.pathway-tabs').append(tab);

                    $('.pathway-tab').unbind('click');
                    $('.pathway-tab').click(function() {
                        $('.pathway-tabs li').removeClass('active')                        
                        var map = $(this).data('map');

                        $location.search({map: map});
                        scope.$apply();

                        self.loadMap(map);
                    }); 
                }
            }


            // fba selector dropdown
            $(ele).loading();            
            $.when(scope.ref_obj_prom).done(function() {
                console.log('adding dropdown')
                var fba_selector = get_fba_selector(scope.fba_refs)
                $('.pathway-tabs').prepend(fba_selector)

                loadMapSelector(scope.fba_refs[0].ws, scope.fba_refs[0].name)

                fba_selector.find('select').change(function() { 
                    console.log('change')
                    // special container for loading notice since floated
                    var spin = $('<div id="loading pull-right">')
                    spin.loading();
                    $('.pathway-options').append(spin);
                    
                    var selected_fba = get_selected_fba();
                    loadMapSelector(selected_fba.ws, selected_fba.name);

                })

            }).fail(function() {
                $(ele).html("<h5>There are currently no FBA \
                                    results associated with this model.\
                                      You may want to FBA analysis.</h5>")
            })



            function loadMapSelector(ws, fba_name) {
                $('#path-list').remove()

                if (fba_name) {
                    var p2 = kb.get_fba(ws, fba_name);
                } else { 
                    var p2;
                }

                var p1 = kb.get_model(scope.selected[0].workspace, scope.selected[0].name);
                $.when(p1, p2 ).done(function(d, fba) {
                    console.log('reloading pathway with ',fba)
                    var data = [d[0].data];
                    var fba = fba ? [fba[0].data] : null;

                    $rootScope.org_name = d[0].data.name;
                    scope.$apply();

                    $(ele).rmLoading();
                    $(ele).pathways({modelData: data, fbaData: fba,
                                ws: map_ws, defaultMap: scope.defaultMap,
                                scope: scope});
                    $(ele).find('.pathway-tabs')
                          .append('<div class="label label-primary pull-right">'+map_ws+'</div>');
                }).fail(function(e){
                    $(ele).append('<div class="alert alert-danger">'+
                                e.error.message+'</div>');
                });
            }

            function get_fba_selector(fba_refs) {
                 var ver_selector = $('<select class="form-control fba-selector">');
                for (var i in fba_refs) {
                    var ref = fba_refs[i];
                    ver_selector.append('<option value="'+ref.name+'+'+ref.ws+'" '+'>'
                                            +ref.name+' | '+ref.ws+' | '+ref.date+'</option>')
                }
                var form = $('<div class="col-xs-5">');
                form.append(ver_selector)
                var row = $('<div class="row pathway-options">');
                row.append(form)

                return row;
            }

            function get_selected_fba() {
                var selected_fba = $('.fba-selector').val()
                var name = selected_fba.split('+')[0];
                var ws = selected_fba.split('+')[1];
                return {ws: ws, name:name}
            }


            $('#pathway-selection').click(function() {
                // highlight tab
                $('.pathway-tab').removeClass('active');
                $(this).addClass('active')

                // change tab content panes
                $('.tab-pane').removeClass('active')
                $('#path-list').addClass('active');
            })


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
        }
    };
})


.directive('fvaviewer', function($location) {

    return {
        link: function(scope, ele, atttr) {
            $(ele).loading();



        }

    }

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

.directive('etcviewer', function($location) {
    return {
        link: function(scope, ele, attrs) {


            var p = kb.ws.get_objects([{workspace: scope.ws, name: scope.id}])
            $.when(p).done(process);

            function process(data) {
                var data = data[0].data;
                //var treeData = processData2(data);
                //drawTree(treeData)

                var prom = getCompoundNames(data);

                $.when(prom).done(function(cpd_dict){
                    var data = group_data(data);
                    drawMap(data, cpd_dict);
                })
            }


            function drawMap(data, cpd_dict) {



                var width = 800;
                var height = 600;

                $(ele).append('<div id="etc-viewer">')
                var svg = d3.select("#etc-viewer")
                            .append("svg")
                             .attr("width", width)
                            .attr("height", height);

                var w = 100;
                var h = 20;
                var center_x = 200
                var center_y = 200


                for (var j in data.pathways) {
                    var path = data.pathways[j];

                    var name = path.electron_acceptor
                    var steps = path.steps;

                    for (var i = 0; i < steps.length; i++) {
                        var rxns = steps[i].reactions;

                        svg.append('rect')
                           .attr('class', 'etc-step-box')
                           .attr('x', center_x + (i*w))
                           .attr('y', center_y + (j*h))
                           .attr('width', w)
                           .attr('height', h)


                        var cpd_name = cpd_dict[steps[i].substrates.compound_refs[0]].name

                        svg.append('text')
                           .attr('class', 'etc-step-text')
                           .attr('x', center_x + (i*w)+2)
                           .attr('y', center_y + (j*h)+h/2 +3)
                           .text(cpd_name)
                        
                    }

                    svg.append('text')
                       .attr('class', 'etc-step-text')
                       .attr('x', center_x+(steps.length*w)+2)
                       .attr('y', center_y  + (j*h)+h/2 +3)
                       .text(name)                        

                }

            }
/*
            function groupData(data) {
                var paths = {}
                for (var i in data.pathways) {

                    var path = data.pathways[j];

                    var name = path.electron_acceptor

                    paths[name] = []

                    var steps = path.steps;                    
                    for (var j in steps) {
                        var step = steps[j];

                        sub_name = step.substrates.compound_refs;






                    }
                }
            }*/

            function getCompoundNames(data) {
                cpd_ids = []
                for (var i in data.pathways) {
                    var path = data.pathways[i];
                    var steps = path.steps;

                    for (var k = 0; k < steps.length; k++) {
                        var ids = steps[k].substrates.compound_refs;

                        for (var j in ids) {
                            if (cpd_ids.indexOf(ids[j]) != -1) {
                                continue;
                            } else {
                                cpd_ids.push(ids[j])
                            }
                        }

                    }
                }

                var prom = kb.fba.get_compounds({compounds: cpd_ids})

                var p = $.when(prom).then(function(cpds) {
                    var obj = {}    
                    for (var i in cpds) {
                        obj[cpds[i].id] = cpds[i]
                    }
                    return obj
                });

                return p;
            }

            function processData(data) {
                var paths = data.pathways;

                var treeData = [];

                for (var i in paths){
                    tree_obj = {}
                    var path = paths[i];

                    var ea = path.electron_acceptor;
                    var steps = path.steps;
                    for (var j in steps) {
                        var step = steps[j];
                        var substrates = step.substrates;
                        var products = step.products;
                        var prod_name = products.name
                        var sub_name = substrates.name;

                        // add to tree object

                        // look to see if tree in already
                        var presentInTree;
                        for (var k in treeData) {
                            if (treeData[k].name == sub_name) {
                                presentInTree = true;
                                break;
                            }
                        }
                        if (presentInTree) continue;

                        // if top level node, add, etc
                        if (treeData.length == 0) {
                            tree_obj.name = sub_name;
                            tree_obj.parent = "null";
                            tree_obj.children = [{name: prod_name, parent: sub_name}];
                            treeData.push(tree_obj);   
                        } else {
                            for (var k in treeData) {
                                for (var z in treeData[k].children[z]) {
                                    if ( treeData[k].children[z].name == sub_name) {
                                        treeData[k].children[z].children = [{name: prod_name, parent: sub_name}]
                                        break;
                                    }                                    
                                }

                            }
                            //tree_obj.children.push({})
                        }

                        tree_obj.name = sub_name;
                        tree_obj.parent = "null";
                        tree_obj.children = [];
                        treeData.push(tree_obj);

                    }

                    treeData.push(tree_obj);
                }
                return treeData

            }


            function processData2(data) { 
                var paths = data.pathways;

                /*
                var data = [
                    { "name" : "Level 2: A", "parent":"Top Level" },
                    { "name" : "Top Level", "parent":"null" },
                    { "name" : "Son of A", "parent":"Level 2: A" },
                    { "name" : "Daughter of A", "parent":"Level 2: A" },
                    { "name" : "Level 2: B", "parent":"Top Level" }
                    ];
                    */

                var data =[]

                for (var i in paths){
                    tree_obj = {}
                    var path = paths[i];

                    var ea = path.electron_acceptor;
                    var steps = path.steps;
                    for (var j in steps) {
                        var step = steps[j];
                        var substrates = step.substrates;
                        var products = step.products;
                        var prod_name = products.name
                        var sub_name = substrates.name;


                        if (data.length == 0) {
                            data.push({name: sub_name, parent: null}) 
                        } else {
                            var presentInTree;
                            for (var k in data) {
                                if (data[k].name == sub_name) {
                                    presentInTree = true
                                    break;
                                }                    
                            }
                            if (presentInTree) {
                                console.error('skipping')
                                continue;
                            } else if (j >= 1) {
                                console.error('adding:', {name: sub_name, parent: steps[j-1].substrates.name})
                                data.push({name: sub_name, parent: steps[j-1].substrates.name})
                            } else {
                                console.error('else statement:', j)
                            }
                        }

                        // if last step, add product
                        if (j == steps.length - 1) {
                            data.push({name: prod_name, parent: steps[j].substrates.name})
                        }

                    }                    
                }

                // create a name: node map
                var dataMap = data.reduce(function(map, node) {
                    map[node.name] = node;
                    return map;
                }, {});

                // create the tree array
                var treeData = [];
                data.forEach(function(node) {
                    // add to parent
                    var parent = dataMap[node.parent];
                    if (parent) {
                        // create child array if it doesn't exist
                        (parent.children || (parent.children = []))
                            // add node to child array
                            .push(node);
                    } else {
                        // parent is null or missing
                        treeData.push(node);
                    }
                });

                return treeData;
            }


            function drawTree(treeData) {
                console.log('tree data' , treeData)

                /*

                var treeData = [
                  {
                    "name": "Top Level",
                    "parent": "null",
                    "children": [
                      {
                        "name": "Level 2: A",
                        "parent": "Top Level",
                        "children": [
                          {
                            "name": "Son of A",
                            "parent": "Level 2: A"
                          },
                          {
                            "name": "Daughter of A",
                            "parent": "Level 2: A"
                          }
                        ]
                      },
                      {
                        "name": "Level 2: B",
                        "parent": "Top Level"
                      }
                    ]
                  }
                ];
                */

                // ************** Generate the tree diagram  *****************
                var margin = {top: 20, right: 120, bottom: 20, left: 120},
                 width = 960 - margin.right - margin.left,
                 height = 200 - margin.top - margin.bottom;
                 
                var i = 0;

                var tree = d3.layout.tree()
                 .size([height, width]);

                var diagonal = d3.svg.diagonal()
                 .projection(function(d) { return [d.y, d.x]; });

                $(ele).append('<div id="etc-viewer-tree">')
                var svg = d3.select("#etc-viewer-tree").append("svg")
                 .attr("width", width + margin.right + margin.left)
                 .attr("height", height + margin.top + margin.bottom)
                  .append("g")
                 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                root = treeData[0];
                  
                update(root);

                function update(source) {

                  // Compute the new tree layout.
                  var nodes = tree.nodes(root).reverse(),
                   links = tree.links(nodes);

                  // Normalize for fixed-depth.
                  nodes.forEach(function(d) { d.y = d.depth * 180; });

                  // Declare the nodesâ€¦
                  var node = svg.selectAll("g.node")
                   .data(nodes, function(d) { return d.id || (d.id = ++i); });

                  // Enter the nodes.
                  var nodeEnter = node.enter().append("g")
                   .attr("class", "node")
                   .attr("transform", function(d) { 
                    return "translate(" + d.y + "," + d.x + ")"; });

                  nodeEnter.append("circle")
                   .attr("r", 10)
                   .style("fill", "#fff");

                  nodeEnter.append("text")
                   .attr("x", function(d) { 
                    return d.children || d._children ? -13 : 13; })
                   .attr("dy", ".35em")
                   .attr("text-anchor", function(d) { 
                    return d.children || d._children ? "end" : "start"; })
                   .text(function(d) { return d.name; })
                   .style("fill-opacity", 1);

                  // Declare the linksâ€¦
                  var link = svg.selectAll("path.link")
                   .data(links, function(d) { return d.target.id; });

                  // Enter the links.
                  link.enter().insert("path", "g")
                   .attr("class", "link")
                   .attr("d", diagonal);

                }

            }

        }
    }
})


.directive('provenance', function($location) {
    return {
        link: function(scope, ele, attrs) {


            var graph = {
                  "nodes":[
                    {"name":"Myriel","group":1},
                    {"name":"Napoleon","group":1},
                    {"name":"Mlle.Baptistine","group":1},
                    {"name":"Mme.Magloire","group":1},
                    {"name":"CountessdeLo","group":1},
                    {"name":"Geborand","group":1},
                    {"name":"Champtercier","group":1},
                    {"name":"Cravatte","group":1},
                    {"name":"Count","group":1},
                    {"name":"OldMan","group":1},
                    {"name":"Labarre","group":2},
                    {"name":"Valjean","group":2},
                    {"name":"Marguerite","group":3},
                    {"name":"Mme.deR","group":2},
                    {"name":"Isabeau","group":2},
                    {"name":"Gervais","group":2},
                    {"name":"Tholomyes","group":3},
                    {"name":"Listolier","group":3},
                    {"name":"Fameuil","group":3},
                    {"name":"Blacheville","group":3},
                    {"name":"Favourite","group":3},
                    {"name":"Dahlia","group":3},
                    {"name":"Zephine","group":3},
                    {"name":"Fantine","group":3},
                    {"name":"Mme.Thenardier","group":4},
                    {"name":"Thenardier","group":4},
                    {"name":"Cosette","group":5},
                    {"name":"Javert","group":4},
                    {"name":"Fauchelevent","group":0},
                    {"name":"Bamatabois","group":2},
                    {"name":"Perpetue","group":3},
                    {"name":"Simplice","group":2},
                    {"name":"Scaufflaire","group":2},
                    {"name":"Woman1","group":2},
                    {"name":"Judge","group":2},
                    {"name":"Champmathieu","group":2},
                    {"name":"Brevet","group":2},
                    {"name":"Chenildieu","group":2},
                    {"name":"Cochepaille","group":2},
                    {"name":"Pontmercy","group":4},
                    {"name":"Boulatruelle","group":6},
                    {"name":"Eponine","group":4},
                    {"name":"Anzelma","group":4},
                    {"name":"Woman2","group":5},
                    {"name":"MotherInnocent","group":0},
                    {"name":"Gribier","group":0},
                    {"name":"Jondrette","group":7},
                    {"name":"Mme.Burgon","group":7},
                    {"name":"Gavroche","group":8},
                    {"name":"Gillenormand","group":5},
                    {"name":"Magnon","group":5},
                    {"name":"Mlle.Gillenormand","group":5},
                    {"name":"Mme.Pontmercy","group":5},
                    {"name":"Mlle.Vaubois","group":5},
                    {"name":"Lt.Gillenormand","group":5},
                    {"name":"Marius","group":8},
                    {"name":"BaronessT","group":5},
                    {"name":"Mabeuf","group":8},
                    {"name":"Enjolras","group":8},
                    {"name":"Combeferre","group":8},
                    {"name":"Prouvaire","group":8},
                    {"name":"Feuilly","group":8},
                    {"name":"Courfeyrac","group":8},
                    {"name":"Bahorel","group":8},
                    {"name":"Bossuet","group":8},
                    {"name":"Joly","group":8},
                    {"name":"Grantaire","group":8},
                    {"name":"MotherPlutarch","group":9},
                    {"name":"Gueulemer","group":4},
                    {"name":"Babet","group":4},
                    {"name":"Claquesous","group":4},
                    {"name":"Montparnasse","group":4},
                    {"name":"Toussaint","group":5},
                    {"name":"Child1","group":10},
                    {"name":"Child2","group":10},
                    {"name":"Brujon","group":4},
                    {"name":"Mme.Hucheloup","group":8}
                  ],
                  "links":[
                    {"source":1,"target":0,"value":1},
                    {"source":2,"target":0,"value":8},
                    {"source":3,"target":0,"value":10},
                    {"source":3,"target":2,"value":6},
                    {"source":4,"target":0,"value":1},
                    {"source":5,"target":0,"value":1},
                    {"source":6,"target":0,"value":1},
                    {"source":7,"target":0,"value":1},
                    {"source":8,"target":0,"value":2},
                    {"source":9,"target":0,"value":1},
                    {"source":11,"target":10,"value":1},
                    {"source":11,"target":3,"value":3},
                    {"source":11,"target":2,"value":3},
                    {"source":11,"target":0,"value":5},
                    {"source":12,"target":11,"value":1},
                    {"source":13,"target":11,"value":1},
                    {"source":14,"target":11,"value":1},
                    {"source":15,"target":11,"value":1},
                    {"source":17,"target":16,"value":4},
                    {"source":18,"target":16,"value":4},
                    {"source":18,"target":17,"value":4},
                    {"source":19,"target":16,"value":4},
                    {"source":19,"target":17,"value":4},
                    {"source":19,"target":18,"value":4},
                    {"source":20,"target":16,"value":3},
                    {"source":20,"target":17,"value":3},
                    {"source":20,"target":18,"value":3},
                    {"source":20,"target":19,"value":4},
                    {"source":21,"target":16,"value":3},
                    {"source":21,"target":17,"value":3},
                    {"source":21,"target":18,"value":3},
                    {"source":21,"target":19,"value":3},
                    {"source":21,"target":20,"value":5},
                    {"source":22,"target":16,"value":3},
                    {"source":22,"target":17,"value":3},
                    {"source":22,"target":18,"value":3},
                    {"source":22,"target":19,"value":3},
                    {"source":22,"target":20,"value":4},
                    {"source":22,"target":21,"value":4},
                    {"source":23,"target":16,"value":3},
                    {"source":23,"target":17,"value":3},
                    {"source":23,"target":18,"value":3},
                    {"source":23,"target":19,"value":3},
                    {"source":23,"target":20,"value":4},
                    {"source":23,"target":21,"value":4},
                    {"source":23,"target":22,"value":4},
                    {"source":23,"target":12,"value":2},
                    {"source":23,"target":11,"value":9},
                    {"source":24,"target":23,"value":2},
                    {"source":24,"target":11,"value":7},
                    {"source":25,"target":24,"value":13},
                    {"source":25,"target":23,"value":1},
                    {"source":25,"target":11,"value":12},
                    {"source":26,"target":24,"value":4},
                    {"source":26,"target":11,"value":31},
                    {"source":26,"target":16,"value":1},
                    {"source":26,"target":25,"value":1},
                    {"source":27,"target":11,"value":17},
                    {"source":27,"target":23,"value":5},
                    {"source":27,"target":25,"value":5},
                    {"source":27,"target":24,"value":1},
                    {"source":27,"target":26,"value":1},
                    {"source":28,"target":11,"value":8},
                    {"source":28,"target":27,"value":1},
                    {"source":29,"target":23,"value":1},
                    {"source":29,"target":27,"value":1},
                    {"source":29,"target":11,"value":2},
                    {"source":30,"target":23,"value":1},
                    {"source":31,"target":30,"value":2},
                    {"source":31,"target":11,"value":3},
                    {"source":31,"target":23,"value":2},
                    {"source":31,"target":27,"value":1},
                    {"source":32,"target":11,"value":1},
                    {"source":33,"target":11,"value":2},
                    {"source":33,"target":27,"value":1},
                    {"source":34,"target":11,"value":3},
                    {"source":34,"target":29,"value":2},
                    {"source":35,"target":11,"value":3},
                    {"source":35,"target":34,"value":3},
                    {"source":35,"target":29,"value":2},
                    {"source":36,"target":34,"value":2},
                    {"source":36,"target":35,"value":2},
                    {"source":36,"target":11,"value":2},
                    {"source":36,"target":29,"value":1},
                    {"source":37,"target":34,"value":2},
                    {"source":37,"target":35,"value":2},
                    {"source":37,"target":36,"value":2},
                    {"source":37,"target":11,"value":2},
                    {"source":37,"target":29,"value":1},
                    {"source":38,"target":34,"value":2},
                    {"source":38,"target":35,"value":2},
                    {"source":38,"target":36,"value":2},
                    {"source":38,"target":37,"value":2},
                    {"source":38,"target":11,"value":2},
                    {"source":38,"target":29,"value":1},
                    {"source":39,"target":25,"value":1},
                    {"source":40,"target":25,"value":1},
                    {"source":41,"target":24,"value":2},
                    {"source":41,"target":25,"value":3},
                    {"source":42,"target":41,"value":2},
                    {"source":42,"target":25,"value":2},
                    {"source":42,"target":24,"value":1},
                    {"source":43,"target":11,"value":3},
                    {"source":43,"target":26,"value":1},
                    {"source":43,"target":27,"value":1},
                    {"source":44,"target":28,"value":3},
                    {"source":44,"target":11,"value":1},
                    {"source":45,"target":28,"value":2},
                    {"source":47,"target":46,"value":1},
                    {"source":48,"target":47,"value":2},
                    {"source":48,"target":25,"value":1},
                    {"source":48,"target":27,"value":1},
                    {"source":48,"target":11,"value":1},
                    {"source":49,"target":26,"value":3},
                    {"source":49,"target":11,"value":2},
                    {"source":50,"target":49,"value":1},
                    {"source":50,"target":24,"value":1},
                    {"source":51,"target":49,"value":9},
                    {"source":51,"target":26,"value":2},
                    {"source":51,"target":11,"value":2},
                    {"source":52,"target":51,"value":1},
                    {"source":52,"target":39,"value":1},
                    {"source":53,"target":51,"value":1},
                    {"source":54,"target":51,"value":2},
                    {"source":54,"target":49,"value":1},
                    {"source":54,"target":26,"value":1},
                    {"source":55,"target":51,"value":6},
                    {"source":55,"target":49,"value":12},
                    {"source":55,"target":39,"value":1},
                    {"source":55,"target":54,"value":1},
                    {"source":55,"target":26,"value":21},
                    {"source":55,"target":11,"value":19},
                    {"source":55,"target":16,"value":1},
                    {"source":55,"target":25,"value":2},
                    {"source":55,"target":41,"value":5},
                    {"source":55,"target":48,"value":4},
                    {"source":56,"target":49,"value":1},
                    {"source":56,"target":55,"value":1},
                    {"source":57,"target":55,"value":1},
                    {"source":57,"target":41,"value":1},
                    {"source":57,"target":48,"value":1},
                    {"source":58,"target":55,"value":7},
                    {"source":58,"target":48,"value":7},
                    {"source":58,"target":27,"value":6},
                    {"source":58,"target":57,"value":1},
                    {"source":58,"target":11,"value":4},
                    {"source":59,"target":58,"value":15},
                    {"source":59,"target":55,"value":5},
                    {"source":59,"target":48,"value":6},
                    {"source":59,"target":57,"value":2},
                    {"source":60,"target":48,"value":1},
                    {"source":60,"target":58,"value":4},
                    {"source":60,"target":59,"value":2},
                    {"source":61,"target":48,"value":2},
                    {"source":61,"target":58,"value":6},
                    {"source":61,"target":60,"value":2},
                    {"source":61,"target":59,"value":5},
                    {"source":61,"target":57,"value":1},
                    {"source":61,"target":55,"value":1},
                    {"source":62,"target":55,"value":9},
                    {"source":62,"target":58,"value":17},
                    {"source":62,"target":59,"value":13},
                    {"source":62,"target":48,"value":7},
                    {"source":62,"target":57,"value":2},
                    {"source":62,"target":41,"value":1},
                    {"source":62,"target":61,"value":6},
                    {"source":62,"target":60,"value":3},
                    {"source":63,"target":59,"value":5},
                    {"source":63,"target":48,"value":5},
                    {"source":63,"target":62,"value":6},
                    {"source":63,"target":57,"value":2},
                    {"source":63,"target":58,"value":4},
                    {"source":63,"target":61,"value":3},
                    {"source":63,"target":60,"value":2},
                    {"source":63,"target":55,"value":1},
                    {"source":64,"target":55,"value":5},
                    {"source":64,"target":62,"value":12},
                    {"source":64,"target":48,"value":5},
                    {"source":64,"target":63,"value":4},
                    {"source":64,"target":58,"value":10},
                    {"source":64,"target":61,"value":6},
                    {"source":64,"target":60,"value":2},
                    {"source":64,"target":59,"value":9},
                    {"source":64,"target":57,"value":1},
                    {"source":64,"target":11,"value":1},
                    {"source":65,"target":63,"value":5},
                    {"source":65,"target":64,"value":7},
                    {"source":65,"target":48,"value":3},
                    {"source":65,"target":62,"value":5},
                    {"source":65,"target":58,"value":5},
                    {"source":65,"target":61,"value":5},
                    {"source":65,"target":60,"value":2},
                    {"source":65,"target":59,"value":5},
                    {"source":65,"target":57,"value":1},
                    {"source":65,"target":55,"value":2},
                    {"source":66,"target":64,"value":3},
                    {"source":66,"target":58,"value":3},
                    {"source":66,"target":59,"value":1},
                    {"source":66,"target":62,"value":2},
                    {"source":66,"target":65,"value":2},
                    {"source":66,"target":48,"value":1},
                    {"source":66,"target":63,"value":1},
                    {"source":66,"target":61,"value":1},
                    {"source":66,"target":60,"value":1},
                    {"source":67,"target":57,"value":3},
                    {"source":68,"target":25,"value":5},
                    {"source":68,"target":11,"value":1},
                    {"source":68,"target":24,"value":1},
                    {"source":68,"target":27,"value":1},
                    {"source":68,"target":48,"value":1},
                    {"source":68,"target":41,"value":1},
                    {"source":69,"target":25,"value":6},
                    {"source":69,"target":68,"value":6},
                    {"source":69,"target":11,"value":1},
                    {"source":69,"target":24,"value":1},
                    {"source":69,"target":27,"value":2},
                    {"source":69,"target":48,"value":1},
                    {"source":69,"target":41,"value":1},
                    {"source":70,"target":25,"value":4},
                    {"source":70,"target":69,"value":4},
                    {"source":70,"target":68,"value":4},
                    {"source":70,"target":11,"value":1},
                    {"source":70,"target":24,"value":1},
                    {"source":70,"target":27,"value":1},
                    {"source":70,"target":41,"value":1},
                    {"source":70,"target":58,"value":1},
                    {"source":71,"target":27,"value":1},
                    {"source":71,"target":69,"value":2},
                    {"source":71,"target":68,"value":2},
                    {"source":71,"target":70,"value":2},
                    {"source":71,"target":11,"value":1},
                    {"source":71,"target":48,"value":1},
                    {"source":71,"target":41,"value":1},
                    {"source":71,"target":25,"value":1},
                    {"source":72,"target":26,"value":2},
                    {"source":72,"target":27,"value":1},
                    {"source":72,"target":11,"value":1},
                    {"source":73,"target":48,"value":2},
                    {"source":74,"target":48,"value":2},
                    {"source":74,"target":73,"value":3},
                    {"source":75,"target":69,"value":3},
                    {"source":75,"target":68,"value":3},
                    {"source":75,"target":25,"value":3},
                    {"source":75,"target":48,"value":1},
                    {"source":75,"target":41,"value":1},
                    {"source":75,"target":70,"value":1},
                    {"source":75,"target":71,"value":1},
                    {"source":76,"target":64,"value":1},
                    {"source":76,"target":65,"value":1},
                    {"source":76,"target":66,"value":1},
                    {"source":76,"target":63,"value":1},
                    {"source":76,"target":62,"value":1},
                    {"source":76,"target":48,"value":1},
                    {"source":76,"target":58,"value":1}
                  ]
                }



            var width = 500
            var height = 500


            $(ele).append('<div id="provenance-viewer">');

            var color = d3.scale.category20();

            var force = d3.layout.force()
                .charge(-120)
                .linkDistance(30)
                .size([width, height]);

            var svg = d3.select("#provenance-viewer").append("svg")
                .attr("width", width)
                .attr("height", height);

//            d3.json("miserables.json", function(error, graph) {
              force
                  .nodes(graph.nodes)
                  .links(graph.links)
                  .start();

              var link = svg.selectAll(".link")
                  .data(graph.links)
                .enter().append("line")
                  .attr("class", "link")
                  .style("stroke-width", function(d) { return Math.sqrt(d.value); });

              var node = svg.selectAll(".node")
                  .data(graph.nodes)
                .enter().append("circle")
                  .attr("class", "node")
                  .attr("r", 5)
                  .style("fill", function(d) { return color(d.group); })
                  .call(force.drag);

              node.append("title")
                  .text(function(d) { return d.name; });

              force.on("tick", function() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; });

                node.attr("cx", function(d) { return d.x; })
                    .attr("cy", function(d) { return d.y; });
              });
//            });

        }
    }
})
