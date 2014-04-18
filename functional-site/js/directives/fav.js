
/*
 *  Directives
 *  
 *  These can be thought of as the 'widgets' on a page.  
 *  Scope comes from the controllers.
 *
*/


angular.module('fav-directives', []);
angular.module('fav-directives')
.directive('favoritesidebar', function($location) {
    return {
        link: function(scope, element, attrs) {


        }
    };
})


.directive('favoritetable', function($location, $compile) {
    return {

        link: function(scope, element, attrs, compile) {
            // retrieve again





            function showWidgets(data) {
                for (var i in data) {
                    var obj = data[i];
                    if (obj == null) continue;
                    scope.ws = obj.ws; 
                    scope.id = obj.id;
                    var el = $compile( '<div '+obj.widget+' class="widget widget-type-'+obj.type+'"></div>' )( scope ); 
                    $('#sortable-landing').append( el );
                }

                $( "#sortable-landing" ).sortable({placeholder: "drag-placeholder", 
                    start: function() {
                        $(this).find('.panel-body').addClass('hide');
                        $(this).sortable('refreshPositions');
                },
                    stop: function() {
                        $(this).find('.panel-body').removeClass('hide');
                      }
                });

                $( "#sortable-landing" ).disableSelection();
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
                console.log('feature domains', featuredomains)
                var domains = []
                for (var i in featuredomains) {
                    if ( featuredomains[i].domains) {

                        var d = featuredomains[i].domains
                        domains.push(d)

                    }
                }
                console.log(domains)
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






