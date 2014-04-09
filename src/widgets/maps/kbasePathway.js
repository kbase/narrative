(function( $, undefined ) {

$.KBWidget({
    name: "kbasePathway",     
    version: "1.0.0",
    options: {
    },
    
    init: function(options) {
        var self = this;
        this._super(options);

        self.models = options.modelData;
        self.fbas = options.fbaData
        self.workspace = options.ws


        var map = options.mapData;
        var map_id = options.mapID;

        var container = this.$elem;

        var stroke_color = '#666';
        var stroke_width = 2;
        var highlight = 'steelblue';

        var flux_threshold = 0.001;
        var heat_colors = ['#731d1d','#8a2424', '#b35050', '#d05060', '#f28e8e'];
        var neg_heat_colors = ['#4f4f04','#7c7c07', '#8b8d08', '#acc474', '#dded00'];
        var gapfill_color = '#f000ff';
        var gene_stroke = '#777';
        var g_present_color = '#8bc7e5';   

        var rxns = map.reactions;
        var cpds = map.compounds;
        var maplinks = map.linkedmaps;
        var groups = map.groups;

        var oset = 12, // off set for arrows
            threshold = 2, // threshold for deciding if connection is linear
            r = 12, // radial offset from circle.  Hooray for math degrees.
            max_x = 0,  // used for canvas size
            max_y = 0,  // used for canvas size
            c_pad = 200,  // padding around max_x/max_y
            svg;

        var data = []
        for (var i in rxns) {
            data.push({'products': rxns[i].product_refs, 'substrates': rxns[i].substrate_refs});
        }



        self.drawMap = function() {
            container.html('<div id="'+map_id+'_pathway"></div>');

            svg = d3.select('#'+map_id+'_pathway').append("svg")
                                        .attr("width", 800)
                                       .attr("height", 1000);

            // add arrow markers for use
            svg.append("svg:defs").selectAll("marker")
                .data(["end"])      // Different link/path types can be defined here
              .enter().append("svg:marker")    // This section adds in the arrows
                .attr("id", 'end-arrow')
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 18)
                .attr("refY", 0)
                .attr("markerWidth", 5)
                .attr("markerHeight", 5)
                .attr("orient", "auto")
                .attr('fill', '#666')
              .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

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

            drawConnections();
            drawReactions();
            drawMapLinks();


            // addjust canvas size for map size //fixme: this could be precomputed
            svg.attr("width", max_x)
               .attr("height", max_y);

            if (options.editable) {
                editable()
            }
        }

        self.drawMap()
       
        // deprecated
        function getGroups() {
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
                    if (angular.equals(rxn.product_refs, rxn2.product_refs) && 
                        angular.equals(rxn.substrate_refs, rxn2.substrate_refs)) {
                        group.push(rxn2);
                        grouped_ids.push(rxn2.id);
                    }
                }

                groups.push(group)
            }
            return groups;
        }


        // draw reactions
        function drawReactions() {

            // for each rxn on the map
            for (var i in rxns) {
                var rxn = rxns[i];

                var x = rxn.x - rxn.w/2,
                    y = rxn.y - rxn.h/2,
                    w = rxn.w+2,
                    h = rxn.h+2;
                if (x > max_x) max_x = x+w+c_pad;
                if (y > max_y) max_y = y+h+c_pad;                    

                var group = svg.append('g').attr('class', 'rect');

                // draw reactions (rectangles)
                var outer_rect = group.append('rect').attr('x', x-1)
                                  .attr('y', y-1)
                                  .attr('width', w)
                                  .attr('height', h)
                                  .attr('fill', '#fff')
                                  .attr('stroke', stroke_color);

                found_rxns = getModelRxns(rxn.rxns);

                // divide box for number of models being displayed
                if (self.models) {
                    var w = rxn.w / self.models.length;

                    for (var i in found_rxns) {
                        var found_rxn = found_rxns[i];
                            var rect = group.append('rect').attr('x', x+(w*i))
                                        .attr('y', y-1)
                                        .attr('width', w)
                                        .attr('height', h)

                        if (found_rxn.length > 0) {
                            rect.attr('fill', '#bbe8f9')
                        } else {
                            rect.attr('fill', '#fff')
                        }
                    }
                }

                fba_rxns = getFbaRxns(rxn.rxns);

                // color flux depending on rxns found for each modle
                if (self.fbas) {
                    var w = rxn.w / self.fbas.length;

                    for (var i in fba_rxns) {
                        var found_rxn = fba_rxns[i];
                        var rect = group.append('rect').attr('x', x+(w*i))
                                        .attr('y', y-1)
                                        .attr('width', w)
                                        .attr('height', h)

                        if (found_rxn.length) {
                            var flux = found_rxn[i][1]
                        }

                        var color = get_heat_color(flux)

                        rect.attr({'fill':color});
                    }
                }                

                // get substrates and products
                var subs = []
                for (var i in rxn.substrates_refs) {
                    subs.push(rxn.substrates);
                }
                var prods = []
                for (var i in rxn.products_refs) {
                    prods.push(rxn.products);
                }

                // add reaction label
                var text = group.append('text').text(rxn.name)
                                  .attr('x', x+2)
                                  .attr('y', y+h/2 + 2)
                                  .style("font-size", "10px")
                                  .style('stroke', stroke_color);


                //content for tooltip //fixme: need to do tooltips for each model
                var content = 'ID: ' + rxn.id+'<br>'+
                              'Rxns: ' + rxn.rxns.join(', ')+'<br>'+
                              'Substrates: ' + subs.join(', ')+'<br>'+
                              'Products: ' + prods.join(', ')+'<br>';
                $(group.node()).popover({html: true, content: content, animation: false,
                                        container: 'body', trigger: 'hover'});

                // hide and show text on hoverover
                $(group.node()).hover(function() {
                    $(this).find('text').hide();
                }, function() {
                    $(this).find('text').show();
                })
            }

            // bad attempt at adding data for use later
            //var rects = svg.selectAll("rect");
            //rects.data(data);
        }
       

        function drawCompounds() {
            for (var i in cpds) {
                var cpd = cpds[i];
                var r = cpd.w;
                var g = svg.append('g').attr('class', 'circle');
                var circle = g.append('circle').attr('cx', cpd.x)
                                  .attr('cy', cpd.y)
                                  .attr('r', r)
    	   						  .attr("stroke-width", stroke_width)                              
                                  .style('fill', '#fff')
                                  .style('stroke', stroke_color);


                var content = 'ID: ' + cpd.id+'<br>'+
                              'kegg id: ' + cpd.name;
                $(circle.node()).popover({html: true, content: content, animation: false,
                                        container: 'body', trigger: 'hover'});
            }
        }

        function drawConnections() {
            var node_ids =[]
            var nodes = []
            var links = []

            // draw connections from substrate to producconsole.log(groups)
            for (var j in groups) {
                var group = groups[j];

                var group_rxn_ids = group.rxn_ids;
                var x = group.x
                var y = group.y

                // get all model rxn objects for each rxn id in map
                var model_rxns = []
                for (var i in rxns) {
                    if (group_rxn_ids.indexOf(rxns[i].id) != -1) {
                        var rxn = rxns[i];
                        model_rxns = model_rxns.concat(rxn.rxns)
                    }
                }

                // only need rxn object to get product_refs and substrate_refs
                // since there are groups of reactions
                var prods = rxn.product_refs;
                var subs = rxn.substrate_refs;
                console.log(model_rxns)

                // draw substrate lines
                for (var i in subs) {
                    var sub_id = subs[i].id

                    // find associated compound (for position)
                    for (var k in cpds) {
                        var cpd = cpds[k];

                        if (cpd.id != sub_id ) continue;

                        var id = cpd.id
                        
                        // if node has already been created, 
                        // create link from that node.  Otherwise, create new node and link.
                        if (node_ids.indexOf(id) != -1) {

                            // create link from existing node to next node
                            links.push({source: node_ids.indexOf(id), target: nodes.length, 
                                       value: 1, cpd_id: id, group_index: j, rxns:model_rxns,
                                       line_type: 'substrate'}); 

                            // if there is a special path to draw the line on,
                            // draw nodes and links along path.
                            if (group.substrate_path) { 
                                var path = group.substrate_path;
                                links.push({source: nodes.length, target: nodes.length+1, 
                                       value: 1, cpd_id: id, group_index: j, rxns: model_rxns,
                                       line_type: 'substrate'}); 
                                for (var k=1; k < path.length; k++) {
                                    nodes.push({ x:path[k][0], y: path[k][1], fixed: true, 
                                                point: 'point'});
                                    node_ids.push('null');
                                }
                            } else {
                                nodes.push({ x:x, y:y, fixed: true, point: 'point'});
                                node_ids.push('null');
                            }

                        }  else {
                            links.push({source: nodes.length, target: nodes.length+1, value: 1,
                                        cpd_id: id, group_index: j, line_type: 'substrate', rxns:model_rxns}); 
                            nodes.push({ x: cpd.x, y:cpd.y, fixed: true, type: 'compound', 
                                        name: cpd.label, cpd_index: k, rxns: model_rxns,
                                        label_x: cpd.label_x, label_y: cpd.label_y});
                            nodes.push({ x:x, y:y, fixed: true, point: 'reaction'});
                            node_ids.push(id);
                            node_ids.push('null');
                        }
                    }
                }

                // draw product lines
                for (var i in prods) {
                    var prod_id = prods[i].id

                    for (var k in cpds) {
                        var cpd = cpds[k];

                        if (cpd.id != prod_id) continue;

                        var id = cpd.id

                        if (node_ids.indexOf(id) != -1 ) {
                            links.push({source: nodes.length, target: node_ids.indexOf(id), 
                                        value: 1, type: 'arrow', cpd_id: id, group_index: j,
                                        line_type: 'product', rxns:model_rxns})

                            if (group.product_path) { 
                                var path = group.product_path;
                                links.push({source: nodes.length-1, target: nodes.length, 
                                       value: 1, cpd_id: id, group_index: j,
                                       line_type: 'product', rxns:model_rxns});                                 
                                for (var k=1; k < path.length; k++) {
                                    nodes.push({ x:path[k][0], y: path[k][1], fixed: true, 
                                                point: 'point'});
                                    node_ids.push('null');
                                }
                            } else {
                                nodes.push({ x: x, y:y, fixed:true})
                                node_ids.push('null');
                            }

                        } else {
                            links.push({source: nodes.length, target: nodes.length+1, 
                                        value: 1, type: 'arrow', cpd_id: id, group_index: j,
                                        line_type: 'product', rxns:model_rxns})
                            nodes.push({ x: x, y:y, fixed:true, point:'reaction'})
                            nodes.push({ x:cpd.x, y:cpd.y, fixed: true, point: 'compound', 
                                        name: cpd.label, cpd_index: k,
                                        label_x: cpd.label_x, label_y: cpd.label_y})
                            node_ids.push('null');
                            node_ids.push(id);
                        }
                    }
                }          
            } 


            // the following does all the drawing
            force = d3.layout.force()
                            .nodes(nodes)
                            .links(links)
                            .charge(-400)
                            .linkDistance(40)
                            .on('tick', tick)
                            .start()

            var link = svg.selectAll(".link")
                  .data(links)
                .enter().append("g").append('line')
                  .attr("class", "link")
                  .style("stroke-width", 2)
                  .style('stroke', function(d) {
                    // fixme: this only works for one model
                    console.log('model_rxns used', d.rxns)
                    var found_rxns = getFbaRxns(d.rxns)[0]
                    console.log('result', found_rxns)

                    if (found_rxns.length) {
                        // fixme: only using first flux value from first model
                        var flux = found_rxns[0][1];
                        console.log(flux)

                        if (flux > flux_threshold) {
                            var c = '#f28e8e'
                        } else if (-flux > flux_threshold) {
                            var c = '#c9d33e'
                        } else {
                           c = '#666'; 
                       }
                    } else {
                        c = '#666';
                    }
                    return c;
                  })

            var node = svg.selectAll(".node")
                  .data(nodes)
                .enter().append('g')
                .attr("class", "node")
                  .call(force.drag)

            node.append("circle")
                  .attr('fill', '#fff')
                  .attr('stroke-width', '2')
                  .attr('stroke', stroke_color)

            node.append("text")
                .attr("class", "cpd-label")
                .attr("x", 10)
                .attr("dy", ".35em")
                .style('font-size', '8pt')
                .attr("transform", function(d) { return "translate(" + d.label_x + "," + d.label_y + ")"; })
                .text(function(d) { return d.name; });


            function tick() {
                link.attr("x1", function(d) { return d.source.x; })
                    .attr("y1", function(d) { return d.source.y; })
                    .attr("x2", function(d) { return d.target.x; })
                    .attr("y2", function(d) { return d.target.y; })
                    .attr('marker-end', function(d) { 
                          if (d.type == 'arrow') {
                              return 'url(#end-arrow)'
                          } else {
                              return ''
                          }
                    });  

                node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            
                // size the circles depending on kind of point
                node.select('circle').attr("r", function(d) { 
                        if (d.point == "point") {
                            return 0;
                        } else if (d.point == "reaction") {
                            return 1;
                        } else {
                            return 7;
                        }
                    })
            };                  

        } // end draw connections

        function drawMapLinks() {
            for (var i in maplinks) {
                var map = maplinks[i];

                var x = map.x - map.w/2,
                    y = map.y - map.h/2,
                    w = parseInt(map.w)+2,
                    h = parseInt(map.h)+2;
                if (x > max_x) max_x = x+w+c_pad;
                if (y > max_y) max_y = y+h+c_pad;                          

                var group = svg.append('g');

                // draw reactions (rectangles)
                var rect = group.append('rect').attr('x', x)
                                  .attr('y', y)
                                  .attr('width', w)
                                  .attr('height', h)
                                  .style('fill', '#fff')
                                  .style('stroke', stroke_color)

                var text = group.append('text').text(map.name)
                                  .attr('x', x+2)
                                  .attr('y', y+h/2)
                                  .style("font-size", "10px")
                                  .style('stroke', stroke_color)
                                  .call(wrap, w+2);

            }
        
        }


        function wrap(text, width) {
            //var dy = 3;
            var dy = 0;

            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    y = text.attr("y"),
                    x = text.attr('x'),
                    tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

                while (word = words.pop()) {
                  line.push(word);
                  tspan.text(line.join(" "));
                  if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                  }
                }
            });
        }

       


        function getModelRxns(rxn_ids) {
            // get a list of rxn objects (or undefined) 
            // for each model supplied          

            // this is a list of lists, where is list are rxnobjs 
            // for each model for a given set of rxn_ids.  phew.
            var found_rxns = [];

            // for each model, look for model data
            for (var j in self.models) {
                var model = self.models[j];
                rxn_objs = model.reactions;

                // see if we can find the rxn in that model's list of reactions
                var found_rxn = [];
                for (var i in rxn_objs) {
                    rxn_obj = rxn_objs[i];
                    if (rxn_ids.indexOf(rxn_obj.reaction) != -1) {
                        found_rxn.push(rxn_obj);
                    }
                }

                found_rxns.push(found_rxn); // either an raction object or undefined
            }
        
            return found_rxns;
        }

        function getFbaRxns(rxn_ids) {
            // get a list of fba arrays (or undefined) 
            // for each model supplied          

            var found_rxns = [];

            // for each model, look for model data
            for (var j in self.fbas) {
                var fba_obj = self.fbas[j];
                fba_arrays = fba_obj.reactionFluxes;

                // see if we can find the rxn in that fbas's list of reactions
                var found_rxn = [];

                for (var i in fba_arrays) {
                    fba_array = fba_arrays[i];
                    if (rxn_ids.indexOf(fba_array[0].split('_')[0]) != -1) {
                        found_rxn.push(fba_array);
                    }
                }

                found_rxns.push(found_rxn); // either an raction object or undefined
            }
        
            return found_rxns;
        }

        function get_heat_color(flux) {
            if (flux >= 100){
                var color = heat_colors[0];
            } else if (flux >= 50) {
                var color = heat_colors[1];
            } else if (flux >= 10) {
                var color = heat_colors[2];
            } else if (flux >= 5) {
                var color = heat_colors[3];
            } else if (flux <= -5) {
                var color = neg_heat_colors[0]
            } else if (flux <= -10) {
                var color = neg_heat_colors[1]
            } else if (flux <= -50) {
                var color = neg_heat_colors[2]
            } else if (flux <= -100) {
                var color = neg_heat_colors[3]
            } else {
                var color = '#fff';
            }

            return color;
        }


        function zoom() {
            var margin = {top: -5, right: -5, bottom: -5, left: -5},
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var zoom = d3.behavior.zoom()
                .scaleExtent([1, 10])
                .on("zoom", zoomed);

            var drag = d3.behavior.drag()
                .origin(function(d) { return d; })
                .on("dragstart", dragstarted)
                .on("drag", dragged)
                .on("dragend", dragended);

            //var svg = d3.select("body").append("svg")
            //    .attr("width", width + margin.left + margin.right)
             //   .attr("height", height + margin.top + margin.bottom)
            //  .append("g")
            //    .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
             //   .call(zoom);
             svg.call(zoom)

            var rect = svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all");

            var container = svg.append("g");

            container.append("g")
                .attr("class", "x axis")
              .selectAll("line")
                .data(d3.range(0, width, 10))
              .enter().append("line")
                .attr("x1", function(d) { return d; })
                .attr("y1", 0)
                .attr("x2", function(d) { return d; })
                .attr("y2", height);

            container.append("g")
                .attr("class", "y axis")
              .selectAll("line")
                .data(d3.range(0, height, 10))
              .enter().append("line")
                .attr("x1", 0)
                .attr("y1", function(d) { return d; })
                .attr("x2", width)
                .attr("y2", function(d) { return d; });

                /*
            d3.tsv("dots.tsv", dottype, function(error, dots) {
              dot = container.append("g")
                  .attr("class", "dot")
                .selectAll("circle")
                  .data(dots)
                .enter().append("circle")
                  .attr("r", 5)
                  .attr("cx", function(d) { return d.x; })
                  .attr("cy", function(d) { return d.y; })
                  .call(drag);
            });*/

            function dottype(d) {
              d.x = +d.x;
              d.y = +d.y;
              return d;
            }

            function zoomed() {
              container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }

            function dragstarted(d) {
              d3.event.sourceEvent.stopPropagation();
              d3.select(this).classed("dragging", true);
            }

            function dragged(d) {
              d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
            }

            function dragended(d) {
              d3.select(this).classed("dragging", false);
            }
        }


        function editable() {
            var edit_opts = $('<div class="map-opts pull-left">\
                                  <!--<button class="btn btn-primary btn-edit-map">Edit Map</button>-->\
                                  <button class="btn btn-default btn-map-opts">Options <div class="caret"></div></button>\
                                  <button class="btn btn-default btn-map-cancel">Done</button>\
                                  <button class="btn btn-default btn-map-save">Save</button>\
                               </div>\
                               <span class="mouse-pos pull-right">\
                                    <span id="ele-type"></span>\
                                   x: <span id="x-pos">0</span>\
                                   y: <span id="y-pos">0</span>\
                               </span>\
                               <br><br>');

            var opts = $('<div class="opts-dd">Display:\
                        <div class="checkbox">\
                            <label><input type="checkbox" data-type="rect" value="" checked="checked">Enzymes</label>\
                        </div>\
                        <div class="checkbox">\
                            <label><input type="checkbox" data-type="circle" checked="checked">Compounds</label>\
                        </div>\
                        <div class="checkbox">\
                            <label><input type="checkbox" data-type="line" checked="checked">Lines</label>\
                        </div>\
                        <div class="checkbox">\
                            <label><input type="checkbox" data-type="cpd-label" checked="checked">Labels</label>\
                        </div>\
                        </div>')

            // display x, y coordinates (on top left)
            svg.on('mousemove', function () {
                c = d3.mouse(this);
                var x = c[0];
                var y = c[1];
                $('#x-pos').html(x);
                $('#y-pos').html(y); 
            });
            container.prepend(edit_opts)

            // event for options
            $('.btn-map-opts').popover({html: true, content: opts, animation: false,
                                       container: 'body', trigger: 'click', placement: 'bottom'});
            $('.btn-map-opts').click(function() {
                opts.find('input').unbind('change')
                opts.find('input').change(function() {
                    var type = $(this).data('type');
                    var checked = ($(this).attr('checked') == 'checked' ? true : false);

                    if (checked) {
                        svg.selectAll('.'+type).style('display', 'none')
                        $(this).attr('checked', false)
                    } else {
                        svg.selectAll('.'+type).style('display', 'block')
                        $(this).attr('checked', true)        
                    }
                })
            })

            // event for highlighting elements
            /*svg.selectAll('g').on('mouseover', function(){
                d3.select(this).attr('stroke', 'green')
                               .attr('stroke-width', 5);
                edit_opts.find('#ele-type').html(d3.select(this))
            }).on('mouseout', function() {
                d3.select(this).attr('stroke', stroke_color)
                               .attr('stroke-width', stroke_width);
            })*/

            // drag event
            var drag = d3.behavior.drag()
              .on("dragstart", function() {
                  d3.event.sourceEvent.stopPropagation()
              })
              .on("drag", function(){
                dragmove(this)
              });

            
            svg.selectAll('.link').on('click', function(){
                $('.first, .last, .middle').remove()
                editLine(this);
                edit_opts.find('.btn-map-save').addClass('btn-primary')                
            })

            svg.selectAll('.cpd-label').on('click', function(){
                $('.first, .last, .middle').remove()
                editLabel(this);
                edit_opts.find('.btn-map-save').addClass('btn-primary')
            })

            edit_opts.find('.btn-map-cancel').click(function() {
                //$('.first, .second, .middle').remove()
            })


            edit_opts.find('.btn-map-save').click(function() {
                console.log('saving map')
                saveMap();
            })


            function editLabel(label) {
                var label = d3.select(label)
                            .call(drag)
                label.attr('fill', highlight)
                     .attr('class', 'edited-label')
            }

            function editLine(line) {
                var line = d3.select(line)

                // highlight line
                line.attr('stroke', highlight)
                    .attr('fill', highlight)
                    .attr('stroke-width', 2);
                
                // getting start and end of line    
                var x1 = line.attr('x1')
                var y1 = line.attr('y1')
                var x2 = line.attr('x2') 
                var y2 = line.attr('y2')
                var g = line.node().parentNode

                // start, draggalbe circle
                var start = d3.select(g).append("g")
                 .attr("transform", "translate(" + x1 + "," + y1 + ")")
                 .attr("class", "first")
                 .call(drag)
                 .append("circle").attr({
                   r: 0,
                 }).attr('class','line-start')
                 .style("fill", "#F00")
                 .attr('fill-opacity', .3)
                 .attr('stroke', '#000')
                 .attr('stroke-width', 1)
                 .transition()
                      .duration(750)
                      .ease("elastic")
                      .attr("r", 8)  


                // end, dragable circle
                var end = d3.select(g).append("g")
                 .attr("transform", "translate(" + x2 + "," + y2 + ")")
                 .attr("class", "last")
                 .call(drag)
                 .append("circle").attr({
                   r: 0,
                 }).attr('class','line-end')
                 .style("fill", "#F00")
                 .attr('fill-opacity', .3)
                 .attr('stroke', '#000')
                 .attr('stroke-width', 1)
                 .transition()
                      .duration(750)
                      .ease("elastic")
                      .attr("r", 8)   
             

                // when clicking on selected line, divide into two lines.
                line.on('click', function() {
                    // add class to denoted edited lines
                    d3.select(g).attr('class', 'edited-line')

                    d3.event.stopPropagation(); 
                    // get position of new circle
                    var x = d3.mouse(this)[0];
                    var y = d3.mouse(this)[1];

                    var type = d3.select(this).data()[0].type

                    // remove old line
                    d3.select(this).remove() 

                    // add new lines
                    var line1 = d3.select(g).append("line")
                                 .attr('class', 'line1')
                                 .attr("x1", x1)
                                 .attr("y1", y1)
                                 .attr("x2", x)
                                 .attr("y2", y)
                                 .attr("stroke-width", stroke_width)
                                 .attr("stroke", stroke_color)
                                 .attr("fill", stroke_color)

                    var line2 = d3.select(g).append("line")
                                 .attr('class', 'line2')
                                 .attr("x1", x)
                                 .attr("y1", y)
                                 .attr("x2", x2)
                                 .attr("y2", y2)
                                 .attr("stroke-width", stroke_width)
                                 .attr("stroke", stroke_color)
                                 .attr("fill", stroke_color)

                    if (type == 'arrow') {
                        line2.attr('marker-end', "url(#end-arrow)");
                    }

                    // to be stored
                    var wayPoints = [[x1, y1], [x,y], [x2,y2]]
                    /*
                    svg.append("circle")
                      .attr("r", 1e-6)
                      .attr("cx", x)
                      .attr("cy", y)
                      .attr('class', 'middle')
                      .style("fill", "#F00")
                      .attr('fill-opacity', .3)
                      .attr('stroke', '#000')
                      .attr('stroke-width', 1)                                           
                    .transition()
                      .duration(750)
                      .ease("elastic")
                      .attr("r", 6.5)*/

                      // mid, draggable circle
                      var mid = d3.select(g).append("g")
                         .attr("transform", "translate(" + x + "," + y + ")")
                         .attr("class", "middle")
                         .call(drag)
                         .append("circle").attr({
                           r: 0,
                         }).attr('class','line-end')
                         .style("fill", "#F00")
                         .attr('fill-opacity', .3)
                         .attr('stroke', '#000')
                         .attr('stroke-width', 1)
                         .transition()
                              .duration(750)
                              .ease("elastic")
                              .attr("r", 8)              
                })
            }
        }


        function saveMap() {
            var new_map = $.extend({}, map)

            // get data on edited lines 
            var g = svg.selectAll('.edited-line');
            g.each(function(d, i){
                var l1 = d3.select(this).select('.line1');
                var l2 = d3.select(this).select('.line2');
                var cpd_id = l1.data()[0].cpd_id
                var group_index = l1.data()[0].group_index
                var line_type = l1.data()[0].line_type


                var x1 = parseInt(l1.attr('x1'))
                var y1 = parseInt(l1.attr('y1'))
                var x = parseInt(l1.attr('x2'))
                var y = parseInt(l1.attr('y2'))
                var x2 = parseInt(l2.attr('x2'))
                var y2 = parseInt(l2.attr('y2'))

                var path = [[x1, y1], [x, y], [x2, y2]];

                var groups = new_map.groups;
                if (line_type == 'substrate') {
                    groups[group_index]['substrate_path'] = path;
                } else if (line_type == 'product') {
                    groups[group_index]['product_path'] = path;
                }

                console.log('saving new group', group_index, 'with:', path)
            })

            // get data on edited compound labels 
            var labels = svg.selectAll('.edited-label');
            labels.each(function(d, i){
                var l = d3.select(this)

                var transform = l.attr('transform')

                // if label hasn't been moved, don't save
                if (!transform) return;

                var x = parseInt(transform.split(',')[0].split('(')[1] )
                var y = parseInt(transform.split(',')[1].split(')')[0] )
                var cpd_index = l.data()[0].cpd_index


                var cpds = new_map.compounds;
                console.log('saving cpd label with index', cpd_index, 'at', x, y)
                cpds[cpd_index].label_x = x
                cpds[cpd_index].label_y = y
            })


            // saving object to workspace
            var p = kb.ws.save_object({'workspace': self.workspace, 
                    'data': new_map, 
                    'id': map_id,
                    'type': 'KBaseBiochem.MetabolicMap'
                    })

            $.when(p).done(function(d) {
                var msg = $('<div class="alert alert-success pull-left">Saved.</div>')
                msg.css('padding', '7px');  // one exception for putting this in js
                msg.css('margin-left', '10px')
                msg.css('margin-bottom', 0);
                container.find('.map-opts').after(msg);
                msg.delay(3000).fadeOut(500);

                // redraw map
                self.drawMap();

            }).fail(function(e){
                container.prepend('<div class="alert alert-danger">'+
                                e.error.message+'</div>')
            })
    
        }

        //Drag handler
        function dragmove(d) {

            var x = d3.event.x;
            var y = d3.event.y;
            d3.select(d).attr("transform", "translate(" + x + "," + y + ")");


            if (d3.select(d).attr("class") == "first") {
                d3.select(d.parentNode).select('line').attr("x1", x);
                d3.select(d.parentNode).select('line').attr("y1", y);
            } else if ( (d3.select(d).attr("class") == "middle")) {               
                d3.select(d.parentNode).select('.line1').attr("x2", x);
                d3.select(d.parentNode).select('.line1').attr("y2", y);
                d3.select(d.parentNode).select('.line2').attr("x1", x);
                d3.select(d.parentNode).select('.line2').attr("y1", y);                 
            } else {
                d3.select(d.parentNode).select('line').attr("x2", x);
                d3.select(d.parentNode).select('line').attr("y2", y);
            }

        }

        function splines() {

            var width = 960,
                height = 500;            
                
            var points = d3.select('line').each(function() {
                var x1 = d3.select(this).attr('x1')
                var y1 = d3.select(this).attr('y1')
                svg.append()
                d3.select(this).attr('class', 'special')
                return [x1, y1];
            })

            /*
            var points = d3.range(1, 5).map(function(i) {
              return [i * width / 5, 50 + Math.random() * (height - 100)];
            });*/


            var dragged = null,
                selected = points[0];

            var line = d3.select('line');

            /*
            var svg = d3.select('.panel-body').append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("tabindex", 1);
            */
            svg.append("rect")
                .attr('fill', 'none')
                .attr("width", width)
                .attr("height", height)
                .on("mousedown", mousedown);

            svg.append("path")
                .datum(points)
                .attr("class", "line")
                .attr("fill", "none")
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 2)
                .call(redraw);

            d3.select(window)
                .on("mousemove", mousemove)
                .on("mouseup", mouseup)
                .on("keydown", keydown);


            d3.select("#interpolate")
                .on("change", change)
              .selectAll("option")
                .data([
                  "linear",
                  "step-before",
                  "step-after",
                  "basis",
                  "basis-open",
                  "basis-closed",
                  "cardinal",
                  "cardinal-open",
                  "cardinal-closed",
                  "monotone"
                ])
              .enter().append("option")
                .attr("value", function(d) { return d; })
                .text(function(d) { return d; });

            svg.node().focus();

            function redraw() {

              svg.select("path").attr("d", line);

              var circle = svg.selectAll(".special")
                  .data(points, function(d) { return d; });

              circle.enter().append("circle")
                  .attr("r", 1e-6)
                  .on("mousedown", function(d) { selected = dragged = d; redraw(); })
                .transition()
                  .duration(750)
                  .ease("elastic")
                  .attr("r", 6.5);

              circle
                  .classed("selected", function(d) { return d === selected; })
                  .attr("cx", function(d) { return d[0]; })
                  .attr("cy", function(d) { return d[1]; });

              circle.exit().remove();

              if (d3.event) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
              }
            }

            function change() {
              line.interpolate(this.value);
              redraw();
            }

            function mousedown() {
              points.push(selected = dragged = d3.mouse(svg.node()));
              redraw();
            }

            function mousemove() {
              if (!dragged) return;
              var m = d3.mouse(svg.node());
              dragged[0] = Math.max(0, Math.min(width, m[0]));
              dragged[1] = Math.max(0, Math.min(height, m[1]));
              redraw();
            }

            function mouseup() {
              if (!dragged) return;
              mousemove();
              dragged = null;
            }

            function keydown() {
              if (!selected) return;
              switch (d3.event.keyCode) {
                case 8: // backspace
                case 46: { // delete
                  var i = points.indexOf(selected);
                  points.splice(i, 1);
                  selected = points.length ? points[i > 0 ? i - 1 : 0] : null;
                  redraw();
                  break;
                }
              }
            }


        }

        return this;

    }  //end init

})
}( jQuery ) );






    // for when centers are "on" the same x axis, don't offset the y, etc
    /*var g = svg.append('g').attr('class', 'line')
    var line = g.append("line")
             .attr("x1", x)
             .attr("y1", y)
             .attr("stroke-width", stroke_width)
             .attr("stroke", stroke_color)
             .attr("fill", stroke_color)
             .attr('marker-end', "url(#end-arrow)");                                     
    if (Math.abs(cpd.x-x) < threshold) {
        var line = line.attr("x2", cpd.x)
                       .attr("y2", (cpd.y  > y ? cpd.y-oset : cpd.y+oset));
    } else if (Math.abs(cpd.y-y) < threshold) {
        var line = line.attr("x2", (cpd.x  > x ? cpd.x-oset : cpd.x+oset))
                       .attr("y2", cpd.y);
    } else { 
        var d = Math.abs( Math.sqrt( Math.pow(cpd.y - y,2)+Math.pow(cpd.x - x,2) ) )
        var line = line.attr("x2", cpd.x - (r/d)*(cpd.x - x) )
                       .attr("y2", cpd.y - (r/d)*(cpd.y - y) )
    } */




                        // for when centers are "on" the same x axis, don't off setthe y, etc
                        /*
                        var g = svg.append('g').attr('class','line')                      
                        var line = g.append("line").attr("x2", x)
                                 .attr("y2", y)
                                 .attr("stroke-width", stroke_width)
                                 .attr("stroke", stroke_color)
                                 .attr("fill", stroke_color);

                        if (Math.abs(cpd.x-x) < threshold) {
                            var line = line.attr("x1", cpd.x)
                                           .attr("y1", (cpd.y  > y ? cpd.y-oset : cpd.y+oset) )
                        } else if (Math.abs(cpd.y-y) < threshold) {
                            var line = line.attr("x1", (cpd.x  > x ? cpd.x-oset : cpd.x+oset))
                                          .attr("y1", cpd.y );
                        } else { 
                            var d = Math.abs( Math.sqrt( Math.pow(cpd.y - y,2)+Math.pow(cpd.x - x,2) ) ); 
                            var line = line.attr("x1", cpd.x - (r/d)*(cpd.x - x) )
                                           .attr("y1", cpd.y - (r/d)*(cpd.y - y) )
                        }
                        */
   /*
                svg.on('click', function() {
                    var x = d3.mouse(this)[0];
                    var y = d3.mouse(this)[1];
                    console.log(d3.mouse(this))
                    svg.append("circle")
                      .attr("r", 1e-6)
                      .attr("cx", x)
                      .attr("cy", y)
                      .style("fill", "#F00")
                      .attr('fill-opacity', .3)
                      .attr('stroke', '#000')
                      .attr('stroke-width', 1)                                           
                    .transition()
                      .duration(750)
                      .ease("elastic")
                      .attr("r", 6.5)


                    var g = svg.append('g').attr('class', 'line');
                    var line = g.append("line")
                                 .attr("x1", x2)
                                 .attr("y1", y2)
                                 .attr("x2", x)
                                 .attr("y2", y)
                                 .attr("stroke-width", stroke_width)
                                 .attr("stroke", stroke_color)
                                 .attr("fill", stroke_color)
                                 .attr('marker-end', "url(#end-arrow)")
                })*/

