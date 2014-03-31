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
        self.fba = options.fbaData

        var map = options.map_data;
        var map_id = options.map_id        

        var container = this.$elem;

        var stroke_color = '#666';
        var stroke_width = 2;


        container.html('<div id="'+map_id+'_pathway"></div>');

        var svg = d3.select('#'+map_id+'_pathway').append("svg")
                                    .attr("width", 800)
                                   .attr("height", 1000);

        // add arrow markers for use
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
        var maplinks = map.linkedmaps;

        var oset = 12, // off set for arrows
            threshold = 2, // threshold for deciding if connection is linear
            r = 12, // radial offset from circle.  Hooray for math degrees.
            max_x = 0,  // used for canvas size
            max_y = 0,  // used for canvas size
            c_pad = 200;  // padding around max_x/max_y

        var data = []
        for (var i in rxns) {
            data.push({'products': rxns[i].product_refs, 'substrates': rxns[i].substrate_refs});
        }

        var groups = getGroups(rxns);
        drawConnections();
        drawCompounds();
        drawReactions();
        drawMapLinks();
        //zoom()
        //splines();

        // addjust canvas size for map size //fixme: this could be precomputed
        svg.attr("width", max_x)
           .attr("height", max_y);

        if (options.editable) {
            editable()
        }
        /*
        var drag = d3.behavior.drag()
              .on("dragstart", function() {
                  d3.event.sourceEvent.stopPropagation()
              })
              .on("drag", dragmove);

        function dragmove(d) {
              var x = d3.event.x;
              var y = d3.event.y;
              d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
              if(d3.select(this).attr("class") == "first") {
                d3.select(this).attr("x1", x);
                d3.select(this).attr("y1", y);
              } else {
                d3.select(this).attr("x2", x);
                d3.select(this).attr("y2", y);
              }
          } */

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
            for (var i in rxns) {
                var rxn = rxns[i];

                var x = rxn.x - rxn.w/2,
                    y = rxn.y - rxn.h/2,
                    w = rxn.w+2,
                    h = rxn.h+2;
                if (x > max_x) max_x = x+w+c_pad;
                if (y > max_y) max_y = y+h+c_pad;                    

                var group = svg.append('g')

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
                var circle = svg.append('circle').attr('cx', cpd.x)
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
            // draw connections from substrate to producconsole.log(groups)
            for (var j in groups) {
                var rxn_set = groups[j];

                // get mid point of group
                var xs = [];
                for (var i in rxn_set) {
                    var rxn = rxn_set[i];
                    xs.push(rxn.x);
                }
                // get mid point of group
                var ys = []
                for (var i in rxn_set) {
                    var rxn = rxn_set[i];
                    ys.push(rxn.y);
                }

                var x = (Math.max.apply(Math, xs) + Math.min.apply(Math, xs)) / 2
                var y = (Math.max.apply(Math, ys) + Math.min.apply(Math, ys)) / 2

                // only need to do this once, since there are groups
                var rxn = rxn_set[0];

                var prods = rxn.product_refs;
                var subs = rxn.substrate_refs;

                // draw product lines
                for (var i in prods) {
                    var prod_name = prods[i]

                    for (var i in cpds) {
                        var cpd = cpds[i];

                        if (cpd.name != prod_name) continue;

                        // for when centers are "on" the same x axis, don't offset the y, etc
                        var g = svg.append('g')
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
                        } 
                    }
                }

                // draw substrate lines
                for (var i in subs) {
                    var sub_name = subs[i]

                    for (var i in cpds) {
                        var cpd = cpds[i];

                        if (cpd.name != sub_name ) continue;

                        // for when centers are "on" the same x axis, don't off setthe y, etc
                        var g = svg.append('g')                        
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
                    }
                }     
            } 
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

            var svg = d3.select("body").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
                .call(zoom);

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
                                  <button class="btn btn-primary btn-edit-map">Edit Map</button>\
                                  <button class="btn btn-default btn-map-opts">Options</button>\
                               </div>\
                               <span class="mouse-pos pull-right">\
                                    <span id="ele-type"></span>\
                                   x: <span id="x-pos">0</span>\
                                   y: <span id="y-pos">0</span>\
                               </span><br><br>')

            var opts = $('<div class="opts-dd">Display:\
                        <div class="checkbox">\
                            <label><input type="checkbox" data-type="g" value="" checked="checked">Enzymes</label>\
                        </div>\
                        <div class="checkbox">\
                            <label><input type="checkbox" data-type="circle" checked="checked">Compounds</label>\
                        </div>\
                        <div class="checkbox">\
                            <label><input type="checkbox" data-type="line" checked="checked">Lines</label>\
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
                                            container: 'body', trigger: 'click'});
            $('.btn-map-opts').click(function() {
                opts.find('input').unbind('change')
                opts.find('input').change(function() {
                    var type = $(this).data('type');
                    var checked = ($(this).attr('checked') == 'checked' ? true : false);

                    if (checked) {
                        svg.selectAll(type).style('display', 'none')
                        $(this).attr('checked', false)
                    } else {
                        svg.selectAll(type).style('display', 'block')
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
              .on("drag", dragmove);



            svg.selectAll('line').on('mouseover', function(){
                var line = d3.select(this)
                line.attr('stroke', 'green')
                    .attr('stroke-width', 5)
                    .attr('fill', 'green');
                var x1 = line.attr('x1')
                var x2 = line.attr('x2') 
                var y1 = line.attr('y1')
                var y2 = line.attr('y2')
                var g = line.node().parentNode
                console.log(g)

                d3.select(g).append("g")
                 .attr("transform", "translate(" + x1 + "," + y1 + ")")
                 .attr("class", "first")
                 .call(drag)
                 .append("circle").attr({
                   r: 20,
                 })
                 .style("fill", "#F00")

                d3.select(g).append("g")
                 .attr("transform", "translate(" + x2 + "," + y2 + ")")
                 .attr("class", "second")
                 .call(drag)
                 .append("circle").attr({
                   r: 20,
                 })
                 .style("fill", "#F00")                 

            }).on('mouseout', function() {
                d3.select(this).attr('stroke', stroke_color)
                               .attr('stroke-width', stroke_width)
                               .attr('fill', stroke_color);
            })


        }


          //Drag handler
          function dragmove(d) {
              var x = d3.event.x;
              var y = d3.event.y;
              d3.select(this).attr("transform", "translate(" + x + "," + y + ")");
              if(d3.select(this).attr("class") == "first") {
                line.attr("x1", x);
                line.attr("y1", y);
              } else {
                line.attr("x2", x);
                line.attr("y2", y);
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
                console.log(x1, y1)
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
            console.log(1)
            svg.append("rect")
                .attr('fill', 'none')
                .attr("width", width)
                .attr("height", height)
                .on("mousedown", mousedown);
console.log(2)
            svg.append("path")
                .datum(points)
                .attr("class", "line")
                .attr("fill", "none")
                .attr('stroke', 'steelblue')
                .attr('stroke-width', 2)
                .call(redraw);
console.log(3)
            d3.select(window)
                .on("mousemove", mousemove)
                .on("mouseup", mouseup)
                .on("keydown", keydown);

console.log(4)
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

