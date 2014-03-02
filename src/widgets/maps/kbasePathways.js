(function( $, undefined ) {

$.KBWidget({
    name: "kbasePathways",     
    version: "1.0.0",
    options: {
    },
    
    init: function(options) {
        var self = this;
        this._super(options);

        //var map = options.map;

        var container = this.$elem;

        var stroke_color = '#666';

        var tableSettings = {
                        "sPaginationType": "bootstrap",
                        "iDisplayLength": 10,
                        "aaData": [],
                        //"fnDrawCallback": events,
                        "aaSorting": [[ 1, "asc" ]],
                        "aoColumns": [
                            { "sTitle": "Name"}, //"sWidth": "10%"
                            { "sTitle": "Map id"} ,                            
                            { "sTitle": "Rxn Count", "sWidth": "12%"},
                            { "sTitle": "Cpd Count", "sWidth": "12%"},
                            { "sTitle": "Source","sWidth": "10%"},
                        ],                         
                        "oLanguage": {
                            "sEmptyTable": "No objects in workspace",
                            "sSearch": "Search:"
                        }
                    }


        container.append('<ul class="nav nav-tabs">\
                              <li class="active"><a href="#path-list" data-toggle="tab">Maps</a></li>\
                        </ul>')
        container.append('<div class="tab-content">\
                              <div class="tab-pane active" id="path-list"></div>\
                          </div>')


        var proms = getPathwayTableData();  // replace with workspace api call
        $.when.apply($, proms).done(function(){
            var aaData = [];
            for (var i in arguments) {
                var obj = arguments[i][0]
                var name = '<a class="pathway-link" data-id="'+obj.id+'">'+obj.name+'</a>'
                aaData.push([name, obj.id, obj.reaction_ids.length, 
                    obj.compound_ids.length, obj.source])
            }

            tableSettings.aaData = aaData; 

            var table_id = 'pathway-table';
            $('#path-list').append('<table id="'+table_id+'" \
                           class="table table-bordered table-striped" style="width: 100%;"></table>');
            var table = $('#'+table_id).dataTable(tableSettings);  
            container.find('.pathway-link').tooltip({title: 'Open path tab', placement: 'right', delay: {show: 500}})             

            container.find('.pathway-link').click(function() {
                var map_id = $(this).data('id');
                var name = $(this).text()

    
                var tab = $('<li><a class="pathway-tab" href="#path-'+map_id+'"\
                                data-id="'+map_id+'" data-toggle="tab">'
                                    +name.slice(0, 10)+'</a>'+
                            '</li>')          

                container.find('.tab-content')
                        .append('<div class="tab-pane" id="path-'+map_id+'"></div>');                 

                container.find('.nav-tabs').append(tab)

                container.find('.pathway-tab').unbind('click');
                container.find('.pathway-tab').click(function() {
                    var map_id = $(this).data('id');
                    console.log('drawing', map_id);
                    var p = $.getJSON('http://localhost/functional-site/assets/data/maps/xml/'+
                                 map_id+'_graph.json');                    
                    $.when(p).done(function(map_data){
                        drawPathway(map_id, map_data);
                    });
                });
            });



        });

        function drawPathway(map_id, map_data) {
            var map = map_data;

            container.find('#path-'+map_id).html('<div class="pathway"></div>')

            var svg = d3.select('#path-'+map_id+" .pathway").append("svg")
                                        .attr("width", 800)
                                       .attr("height", 1000);

            svg.append('svg:defs').append('svg:marker')
                .attr('id', 'end-arrow')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 6)
                .attr('markerWidth', 3)
                .attr('markerHeight', 3)
                .attr('orient', 'auto')
              .append('svg:path')
                .attr('d', 'M0,-5L10,0L0,5')
                .attr('fill', '#000');

            svg.append('svg:defs').append('svg:marker')
                .attr('id', 'start-arrow')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 4)
                .attr('markerWidth', 3)
                .attr('markerHeight', 3)
                .attr('orient', 'auto')
              .append('svg:path')
                .attr('d', 'M10,-5L0,0L10,5')
                .attr('fill', '#000');            

            var rxns = map.reactions;
            var cpds = map.compounds;        

            var data = []
            for (var i in rxns) {
                data.push({'products': rxns[i].products, 'substrates': rxns[i].substrates})
            }


            var groups = [];
            var grouped_ids = [];

            // create groups
            for (var i in rxns) {
                var group = [];
                var rxn = rxns[i];

                // skip any reaction that has already been grouped
                if (grouped_ids.indexOf(rxn.id) > 0) continue;

                group.push(rxn);
                grouped_ids.push(rxn.id);

                for (var j in rxns) {
                    var rxn2 = rxns[j];

                    // skip the reaction in question already
                    if (rxn2.id == rxn.id) continue;

                    // skip any reaction that has already been grouped
                    if (grouped_ids.indexOf(rxn2.id) > 0) continue;                    

                    // if reactions share same substrates and products, add to group
                    if (angular.equals(rxn.products, rxn2.products) && 
                        angular.equals(rxn.substrates, rxn2.substrates)) {
                        group.push(rxn2);
                        grouped_ids.push(rxn2.id);
                    }
                }

                groups.push(group)
            }


            var oset = 12; // off set for arrows


            // draw connections from substrate to product
            for (var j in groups) {
                var rxn_set = groups[j];

                // get mid point of group
                var xs = []
                for (var i in rxn_set) {
                    var rxn = rxn_set[i];
                    xs.push(rxn.x)
                }
                // get mid point of group
                var ys = []
                for (var i in rxn_set) {
                    var rxn = rxn_set[i];
                    ys.push(rxn.y)
                }

                var x = (Math.max.apply(Math, xs) + Math.min.apply(Math, xs)) / 2
                var y = (Math.max.apply(Math, ys) + Math.min.apply(Math, ys)) / 2

                //for (var i in rxn_set) { // only need to do this once, since there are groups
                    var rxn = rxn_set[0];

                    var prods = rxn.products;
                    var subs = rxn.substrates;

                    // draw product lines
                    for (var i in prods) {
                        var prod_id = prods[i].id

                        for (var i in cpds) {
                            var cpd = cpds[i];

                            if (cpd.id != prod_id) continue;

                            // for when centers are "on" the same x axis, don't offset the y, etc
                            if (Math.abs(cpd.x-x) < 2) {
                                var circ = svg.append("line")
                                     .attr("x1", x)
                                     .attr("y1", y)
                                     .attr("x2", cpd.x)
                                     .attr("y2", (cpd.y  > y ? cpd.y-oset : cpd.y+oset)) 
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color)
                                     .attr('marker-end', "url(#end-arrow)");
                            } else if (Math.abs(cpd.y-y) < 2) {
                                var circ = svg.append("line")
                                     .attr("x1", x)
                                     .attr("y1", y)
                                     .attr("x2", (cpd.x  > x ? cpd.x-oset : cpd.x+oset))
                                     .attr("y2", cpd.y)
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color)
                                     .attr('marker-end', "url(#end-arrow)");                            
                            } else if (cpd.x > x && cpd.y > y ) {
                                var circ = svg.append("line")
                                     .attr("x1", x)
                                     .attr("y1", y)
                                     .attr("x2", cpd.x-oset)
                                     .attr("y2", cpd.y)
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color)
                                     .attr('marker-end', "url(#end-arrow)");                             
                            } else {
                                var circ = svg.append("line")
                                     .attr("x1", x)
                                     .attr("y1", y)
                                     .attr("x2", cpd.x)
                                     .attr("y2", cpd.y)
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color)
                                     .attr('marker-end', "url(#end-arrow)")                         
                            }
                        }
                    }

                    // draw substrate lines
                    for (var i in subs) {
                        var sub_id = subs[i].id

                        for (var i in cpds) {
                            var cpd = cpds[i];

                            if (cpd.id != sub_id ) continue;

                            // for when centers are "on" the same x axis, don't off setthe y, etc
                            if (Math.abs(cpd.x-x) < 2) {
                                svg.append("line")
                                     .attr("x1", cpd.x)
                                     .attr("y1", (cpd.y  > y ? cpd.y-oset : cpd.y+oset) )
                                     .attr("x2", x)
                                     .attr("y2", y)
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color);
                            } else if (Math.abs(cpd.y-y) < 2) {
                                svg.append("line")
                                     .attr("x1", (cpd.x  > x ? cpd.x-oset : cpd.x+oset))
                                     .attr("y1", cpd.y )
                                     .attr("x2", x)
                                     .attr("y2", y)
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color)                            
                            } else if (Math.abs(cpd.x-x)< 8  && Math.abs(cpd.y-y)<8 ) {
                                svg.append("line")
                                     .attr("x1", cpd.x-oset )
                                     .attr("y1", cpd.y )
                                     .attr("x2", x)
                                     .attr("y2", y)
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color);
                            } else {
                                svg.append("line")
                                     .attr("x1", cpd.x )
                                     .attr("y1", cpd.y )
                                     .attr("x2", x)
                                     .attr("y2", y)
                                     .attr("stroke-width", 2)
                                     .attr("stroke", stroke_color);
                            }
                        }
                    }     
                //}
            }  // end draw reactions


            // draw reactions
            for (var i in rxns) {
                var rxn = rxns[i];
                console.log(rxn)

                var x = rxn.x - rxn.w/2;
                var y = rxn.y - rxn.h/2;

                // draw reactions (rectangles)
                var rect = svg.append('rect').attr('x', x-1)
                                  .attr('y', y-1)
                                  .attr('width', rxn.w+2)
                                  .attr('height', rxn.h+2)
                                  .style('fill', '#fff')
                                  .style('stroke', stroke_color);

                var subs = []
                for (var i in rxn.substrates) {
                    subs.push(rxn.substrates[i].cpd)
                }

                var prods = []
                for (var i in rxn.products) {
                    prods.push(rxn.products[i].cpd)
                }


                var content = 'ID: ' + rxn.id+'<br>'+
                              'Rxns: ' + rxn.rxns.join(', ')+'<br>'+
                              'Substrates: ' + subs.join(', ')+'<br>'+
                              'Products: ' + prods.join(', ')+'<br>';


                $(rect.node()).popover({html: true, content: content, 
                                        container: 'body', trigger: 'hover'});

                // add reaction label
                svg.append('text').text(rxn.name)
                                  .attr('x', x+2)
                                  .attr('y', y+rxn.h/2 + 2)
                                  .style("font-size", "10px")
                                  .style('stroke', stroke_color);

            }

            var rects = svg.selectAll("rect");
            rects.data(data);


            // draw compounds (circles)
            for (var i in cpds) {
                var cpd = cpds[i];
                var r = cpd.w;
                var circle = svg.append('circle').attr('cx', cpd.x)
                                  .attr('cy', cpd.y)
                                  .attr('r', r)
                                  .style('fill', '#fff')
                                  .style('stroke', '#666');

                var content = 'ID: ' + cpd.id+'<br>'+
                              'kegg id: ' + cpd.name;
                $(circle.node()).popover({html: true, content: content, 
                                        container: 'body', trigger: 'hover'});
            }



        }





        function getPathwayTableData() {
            var map_ids = ["00010", "00450", "00670",
                            "00020", "00460", "00680",
                            "00030", "00471", "00710",
                            "00040", "00472", "00720",
                            "00051", "00473", "00730",
                            "00052", "00480", "00740",
                            "00053", "00500", "00750",
                            "00061", "00510", "00760",
                            "00062", "00511", "00770",
                            "00071", "00512", "00780",
                            "00072", "00513", "00785",
                            "00100", "00520", "00790",
                            "00120", "00521", "00791",
                            "00130", "00522", "00830",
                            "00140", "00523", "00860",
                            "00190", "00531", "00900",
                            "00195", "00532", "00901",
                            "00196", "00533", "00902",
                            "00230", "00534", "00903",
                            "00231", "00540", "00904",
                            "00232", "00550", "00905",
                            "00240", "00561", "00906",
                            "00253", "00562", "00908",
                            "00260", "00563", "00910",
                            "00280", "00564", "00920",
                            "00281", "00565", "00930",
                            "00290", "00590", "00940",
                            "00300", "00591", "00941",
                            "00310", "00592", "00942",
                            "00311", "00600", "00943",
                            "00312", "00601", "00944",
                            "00330", "00603", "00950",
                            "00331", "00604", "00960",
                            "00340", "00620", "00970",
                            "00350", "00621", "00980",
                            "00351", "00622", "00981",
                            "00360", "00623", "00982",
                            "00361", "00624", "00983",
                            "00362", "00625", "01040",
                            "00363", "00626", "01051",
                            "00364", "00627", "01053",
                            "00380", "00630", "01055",
                            "00400", "00633", "01056",
                            "00401", "00640", "01057",
                            "00402", "00642", "01058",
                            "00410", "00643", "01100",
                            "00430", "00650", "01110",
                            "00440", "00660", "01120"]

            var proms = [];
            for (var i in map_ids) {
                var prom = $.getJSON('http://localhost/functional-site/assets/data/maps/xml/map'+
                            map_ids[i]+'_graph.json');
                proms.push(prom)
            }
            return proms 
        }

        return this;

    }  //end init

})
}( jQuery ) );





/*
                svg.append("svg:defs")
                  .append("svg:marker")
                    .attr("id", "arrowhead")
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', 7)
                    .attr('refY', 0)
                    .attr("markerWidth", 3)
                    .attr("markerHeight", 3)
                  .append("svg:path")
                    .attr('d', 'M0,-5L10,0L0,5');
                    */