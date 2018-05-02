/*

    var pavel_data = {"data":[[0,0,1],[0,1,0.22437378465723734],[0,2,-0.05282216846735438],[0,3,-0.0657336809229566],[0,4,0.6097317208913948],[0,5,0.5425176628844238],[0,6,0.3439309383221102],[0,7,0.037145407026350594],[0,8,0.3089556469216014],[0,9,0.7417790860781828],[0,10,-0.46134326224504935],[1,0,0.22437378465723734],[1,1,1],[1,2,0.8302880807243083],[1,3,0.7636362475320498],[1,4,0.5779936789503318],[1,5,0.839948116422643],[1,6,0.8103994528862233],[1,7,0.7998426636454904],[1,8,0.861243414952622],[1,9,0.5590565296292523],[1,10,0.39261594349622286],[2,0,-0.05282216846735438],[2,1,0.8302880807243083],[2,2,1],[2,3,0.9539172382917777],[2,4,0.4878810638547996],[2,5,0.7069512016501768],[2,6,0.5392833855877311],[2,7,0.8462648456039754],[2,8,0.7922441597490814],[2,9,0.1432476127981901],[2,10,0.2660510734471336],[3,0,-0.0657336809229566],[3,1,0.7636362475320498],[3,2,0.9539172382917777],[3,3,1],[3,4,0.5532743721921256],[3,5,0.7059430904874227],[3,6,0.4675358273403718],[3,7,0.8323376367269241],[3,8,0.7283585026398363],[3,9,0.12217567101908242],[3,10,0.15325316115813803],[4,0,0.6097317208913948],[4,1,0.5779936789503318],[4,2,0.4878810638547996],[4,3,0.5532743721921256],[4,4,1],[4,5,0.8292934171251002],[4,6,0.5990312343088248],[4,7,0.37503028486045814],[4,8,0.5344077210261144],[4,9,0.5959107085990492],[4,10,-0.28738289592618543],[5,0,0.5425176628844238],[5,1,0.839948116422643],[5,2,0.7069512016501768],[5,3,0.7059430904874227],[5,4,0.8292934171251002],[5,5,1],[5,6,0.6209056238338956],[5,7,0.7560802936681007],[5,8,0.8087395364615049],[5,9,0.5604869559136527],[5,10,-0.05083306073047172],[6,0,0.3439309383221102],[6,1,0.8103994528862233],[6,2,0.5392833855877311],[6,3,0.4675358273403718],[6,4,0.5990312343088248],[6,5,0.6209056238338956],[6,6,1],[6,7,0.428199713846343],[6,8,0.5870017427704819],[6,9,0.6863426121415102],[6,10,0.46752671641992993],[7,0,0.037145407026350594],[7,1,0.7998426636454904],[7,2,0.8462648456039754],[7,3,0.8323376367269241],[7,4,0.37503028486045814],[7,5,0.7560802936681007],[7,6,0.428199713846343],[7,7,1],[7,8,0.8696648038744825],[7,9,0.18044270237528454],[7,10,0.21519669543929473],[8,0,0.3089556469216014],[8,1,0.861243414952622],[8,2,0.7922441597490814],[8,3,0.7283585026398363],[8,4,0.5344077210261144],[8,5,0.8087395364615049],[8,6,0.5870017427704819],[8,7,0.8696648038744825],[8,8,1],[8,9,0.5433832909292271],[8,10,0.036165574629291444],[9,0,0.7417790860781828],[9,1,0.5590565296292523],[9,2,0.1432476127981901],[9,3,0.12217567101908242],[9,4,0.5959107085990492],[9,5,0.5604869559136527],[9,6,0.6863426121415102],[9,7,0.18044270237528454],[9,8,0.5433832909292271],[9,9,1],[9,10,-0.09118786691187009],[10,0,-0.46134326224504935],[10,1,0.39261594349622286],[10,2,0.2660510734471336],[10,3,0.15325316115813803],[10,4,-0.28738289592618543],[10,5,-0.05083306073047172],[10,6,0.46752671641992993],[10,7,0.21519669543929473],[10,8,0.036165574629291444],[10,9,-0.09118786691187009],[10,10,1]],"labels":["VNG0001H","VNG0002G","VNG0003C","VNG0006G","VNG0013C","VNG0014C","VNG0361C","VNG0518H","VNG0868H","VNG0289H","VNG0852C"]};

    var heatmap =
        {
            row_ids : [],
            row_labels : [],
            column_ids : [],
            column_labels : [],
            data : [],
        };

    for (var idx = 0; idx < 11; idx++) {
        var row = [];
        heatmap.data.push(row);
        for (var jdx = 10; jdx >= 0; jdx--) {
            row.push(pavel_data.data[idx * 11 + jdx][2]);
        }
    }

    for (var ldx = pavel_data.labels.length - 1; ldx >= 0 ; ldx--) {
        var label = pavel_data.labels[ldx];
        heatmap.row_ids.push(label + '-row');
        heatmap.row_labels.push(label);
        heatmap.column_ids.unshift(label + '-column');
        heatmap.column_labels.unshift(label);
    }

    var $hm =  new kbaseHeatmap($('#heatmap').css({width : '1000px', height : '500px'}), {
            dataset : heatmap,
            colors : ['#0000AA', '#FFFFFF', '#AA0000'],
            //ulIcon : '/functional-site/assets/navbar/images/kbase_logo.png',
            minValue : -1.0,
            maxValue : 1.0,
        }
    );

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'd3',
		'kbaseVisWidget',
		'RGBColor',
		'geometry_rectangle',
		'geometry_point',
		'geometry_size'
	], function(
		KBWidget,
		bootstrap,
		$,
		d3,
		kbaseVisWidget,
		RGBColor,
		geometry_rectangle,
		geometry_point,
		geometry_size
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseHeatmap",
	  parent : kbaseVisWidget,

        version: "1.0.0",
        options: {
            scaleAxes   : true,
            xScaleType  : 'ordinal',
            yScaleType  : 'ordinal',
            yGutter     : 80,
            yPadding    : 20,

            xPadding    : 150,
            xGutter     : 110,
            overColor   : '#999900',
            hmBGColor     : 'lightgray',
            colors : ['#0000FF', '#FFFFFF', '#FF0000'],

            //clickCallback : function(d, $hm) {
            //    $hm.debug(d);
            //},

            rx : 2,
            ry : 2,

            cellPadding : 1,

        },

        _accessors : [
            'spectrum',
        ],

        init : function(options) {
            this._super(options);

            return this;
        },

        setDataset : function(newDataset) {
            if (newDataset.data != undefined && ! $.isArray(newDataset.data) ) {
                newDataset = newDataset.data;
            }

            this._super(newDataset);

            var colorScaleDomain = this.colorScale().nice().domain();

            var zeroPercent = 100 * Math.abs(colorScaleDomain[0]) / (Math.abs(colorScaleDomain[0]) + Math.abs(colorScaleDomain[2]));

            this.callAfterInit(
              $.proxy(function() {
                this.options.gradientID = this.linearGradient(
                    {
                        colors : this.options.colors,
                        gradStops : ['0%', zeroPercent + '%', '100%'],
                    }
                );
              }, this)
            );
        },

        setSpectrum : function(newSpectrum) {
            this.spectrum(
                d3.scale.ordinal()
                    .domain(d3.range(0,1))
                    .range(newSpectrum)
            );
        },

        defaultXDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            //return this.dataset().map(function(d) { return d.x });
            //var i = 0;
            //return this.dataset().data[0].map(function(d) { return i++});
            return this.dataset().column_labels;
        },

        defaultYDomain : function() {

            if (this.dataset() == undefined) {
                return [0,0];
            }

            //return this.dataset().map(function(d) { return d.y });
            //var i = 0;
            //return this.dataset().data.map(function(d) { return i++});
            return this.dataset().row_labels;
        },

        setXScaleRange : function(range, xScale) {
            if (xScale == undefined) {
                xScale = this.xScale();
            }
            xScale.rangeBands(range);

            return xScale;
        },

        setYScaleRange : function(range, yScale) {

            if (yScale == undefined) {
                yScale = this.yScale();
            }

            yScale.rangeBands(range);

            return yScale;
        },

        renderXAxis : function() {

            if (this.xScale() == undefined || this.xScale().domain == undefined) {
                return;
            }

            var xAxis =
                d3.svg.axis()
                    .scale(this.xScale())
                    .orient('top');

            /*xAxis.tickFormat(function(d) {
                if (d.length > 15) {
                    return d.substring(0,15) + '...';
                }
                return d;
            });*/

            var gxAxis = this.D3svg().select('.yGutter').select('.xAxis');

            if (gxAxis[0][0] == undefined) {
                gxAxis = this.D3svg().select('.yGutter')
                    .append('g')
                        .attr('class', 'xAxis axis')
                        .attr("transform", "translate(0," + this.yGutterBounds().size.height + ")")
            }

            var $hm = this;

            gxAxis
                .transition()
                .duration(0)
                .call(xAxis)
            ;

            /*
                As is typical, my life is pain. Here's the deal -

                when the axes are updated, d3 is insisting upon dropping the item and adding a new one at the same position.
                Visually, it looks the same, but it's stored in a different place in the array. So if you have 100 elements and
                change the label for the 0th element, it actually gets dropped, everything re-indexed, and a new label placed
                at position 100.

                The problem is that we need to know the associated ID for a given label, so we can no longer just gleefully look up
                the id at the given index, since the labels and IDs are now at different indexes.

                The "solution" is to no longer format the the label using tickFormat (up above), and instead manually format it within
                the selection. There may be a slight blink as that updates. We can then use that raw original label to look up the index
                of that label in the original array, and then use that index to lookup the ID.

                THIS WILL BREAK IF TWO IDs HAVE THE SAME LABEL.

                Of course, you shouldn't be giving two ids the same label, but other than this you -could- do so if you really wanted to.

                But now, because of this, we're boned. Until I can figure out a way to force d3 to keep the labels in the same order as the IDs,
                there's the potential for a screw up.

                Maybe I'll retool it to have the scale map to the IDs instead of the label and then still lookup by index, because the ID
                is guaranteed to be unique.

                Sigh.

            */

            gxAxis.selectAll('text').each(function(d,i) {

                var label = d3.select(this).text();
                if (label.length > 15) {
                    d3.select(this).text(label.substring(0,12) + '...');
                }

                var label_idx = $hm.dataset().column_labels.indexOf(label);

                d3.select(this).attr('data-id', $hm.dataset().column_ids[label_idx]);
                d3.select(this)
                    .attr("transform", function (d, i) {
                        var bounds = $hm.yGutterBounds();
                        //bullshit hardwired magic numbers. The xAxis is "known"(?) to position @ (0,-9)
                        //arbitrarily rotate around -12 because it looks right. I got nothin'.
                        //then we move it 5 pixels to the right, which in our rotate coordinate system is
                        //5 pixels up. Whee!

                        var width = d3.select(this).node().getComputedTextLength();
                        return "rotate(-45,0,0) translate(" + (width / 2 + 5) + ",5)";// translate(2,3)";
                    })
                    .on('mouseover', function(d) {
                        d3.select(this).attr('fill', $hm.options.overColor);
                        var d3this = d3.select(this);

                        if ($hm.options.labelOver) {
                            $hm.options.labelOver.call(this, d);
                        }
                        else if (d3this.text() != label) {
                            $hm.showToolTip(
                                {
                                    label : label
                                }
                            );
                        }
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).attr('fill', 'black');

                        if ($hm.options.labelOut) {
                            $hm.options.labelOut.call(this, d);
                        }
                        else {
                            $hm.hideToolTip();
                        }
                    })
            });

        },

        renderXLabel : function() {
            var yGutterBounds = this.yGutterBounds();

            var xLabeldataset = [this.xLabel()];

            var xLabel = this.D3svg().select('.yPadding').selectAll('.xLabel');
            xLabel
                .data(xLabeldataset)
                    .text( this.xLabel() )
                .enter()
                    .append('text')
                        .attr('class', 'xLabel')
                        .attr('x', yGutterBounds.size.width / 2)
                        .attr('y', yGutterBounds.size.height / 2 + 3)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '11px')
                        .attr('font-family', 'sans-serif')
                        .attr('fill', 'black')
                        .text(this.xLabel());
            ;

        },

        renderYLabel : function() {
            var xGutterBounds = this.xGutterBounds();

            var yLabel = this.D3svg().select( this.region('xGutter') ).selectAll('.yLabel').data([0]);

            yLabel.enter()
                .append('rect')
                    .attr('x', 5)
                    .attr('y', 0)
                    .attr('width',  xGutterBounds.size.width / 3)
                    .attr('height', xGutterBounds.size.height)
                    .attr('font-size', '11px')
                    .attr('font-family', 'sans-serif')
                    .attr('fill', 'black')
                    .attr('fill', 'url(#' + this.options.gradientID + ')')
            ;

            var colorScale = this.colorScale();

            var domain = [ colorScale.domain()[colorScale.domain().length - 1], colorScale.domain()[0] ];

            var tempScale =
                d3.scale.linear()
                    .domain( domain )
                    .range( [0, xGutterBounds.size.height] )
                    .nice();

            var tempAxis =
                d3.svg.axis()
                    .scale(tempScale)
                    .orient('right')
            ;


            var gtempAxis = this.D3svg().select( this.region('xGutter') ).select('.tempAxis');

            var $hm = this;

            if (gtempAxis[0][0] == undefined) {
                gtempAxis = this.D3svg().select( this.region('xGutter') )
                    .append('g')
                        .attr('class', 'tempAxis axis')
                        .attr("transform", "translate(" + (xGutterBounds.size.width / 3 + 6) + ",0)")
            }

            tempAxis.tickFormat(
                d3.format('.2f')
                /*function(d) {
                    if (d.length > 23) {
                        return d.substring(0,20) + '...';
                    }
                    return d;
                }*/
            );

            gtempAxis.transition().call(tempAxis);


        },

        renderYAxis : function() {

            if (this.yScale() == undefined) {
                return;
            }
            var yAxis =
                d3.svg.axis()
                    .scale(this.yScale())
                    .orient('left');

            var gyAxis = this.D3svg().select( this.region('xPadding') ).select('.yAxis');

            var $hm = this;

            if (gyAxis[0][0] == undefined) {
                gyAxis = this.D3svg().select( this.region('xPadding') )
                    .append('g')
                        .attr('class', 'yAxis axis')
                        .attr("transform", "translate(" + this.xPaddingBounds().size.width + ",0)")
            }

            /*yAxis.tickFormat(function(d) {
                if (d.length > 23) {
                    return d.substring(0,20) + '...';
                }
                return d;
            });*/

            /*
                XXX - The way this is implemented is stupid and fragile. See notes in renderXAxis.
            */

            gyAxis.transition().call(yAxis);

            gyAxis.selectAll('text').each(function(d,i) {

                var label = d3.select(this).text();
                if (label.length > 23) {
                    d3.select(this).text(label.substring(0,18) + '...');
                }

                var label_idx = $hm.dataset().row_labels.indexOf(label);

                d3.select(this).attr('data-id', $hm.dataset().row_ids[label_idx]);
                d3.select(this)
                    .on('mouseover', function(d) {
                        d3.select(this).attr('fill', $hm.options.overColor);
                        var d3this = d3.select(this);

                        if ($hm.options.labelOver) {
                            $hm.options.labelOver.call(this, d);
                        }
                        else if (d3this.text() != label) {
                            $hm.showToolTip(
                                {
                                    label : label
                                }
                            );
                        }
                    })
                    .on('mouseout', function(d) {
                        d3.select(this).attr('fill', 'black');
                        if ($hm.options.labelOut) {
                            $hm.options.labelOut.call(this, d);
                        }
                        else {
                            $hm.hideToolTip();
                        }
                    })
            });

        },

        colorScale : function() {

            var colorScale = this.options.colorScale;

            if (colorScale == undefined) {

                var max = this.options.maxValue;
                var min = this.options.minValue;
                if (this.dataset() != undefined) {
                    if (max == undefined || min == undefined) {
                        max = 0;
                        min = 0;
                        for (var i = 0; i < this.dataset().data.length; i++) {
                            var row = this.dataset().data[i];
                            for (var j = 0; j < row.length; j++) {
                                if (row[j] > max) {
                                    max = row[j];
                                }
                                if (row[j] < min) {
                                    min = row[j];
                                }
                            }
                        }
                    }
                }

                //var domain = d3.range(min, max, (max - min) / this.options.colors.length);
                var domain = [min, 0, max];
                domain[0] = min;
                domain[domain.length - 1] = max;

                colorScale = d3.scale.linear()
                    .domain(domain)
                    .range(this.options.colors);
            }

            return colorScale;
        },

        cellHeight : function cellHeight() {
            return this.yScale().rangeBand() - this.options.cellPadding * 2
        },

        renderChart : function() {

            var $hm = this;
            var bounds = this.chartBounds();

            if (this.dataset() == undefined) {
                return;
            }


        var yIdScale = this.yScale().copy();
        yIdScale.domain(this.dataset().row_ids);

        var xIdScale = this.xScale().copy();
        xIdScale.domain(this.dataset().column_ids);

        var funkyTown = function() {
            this
                .attr('x',
                    function (d) {
                        var xId = d.x;
                        if ($hm.options.useIDMapping) {
                            xId = $hm.xIDMap()[xId];
                        }

                        var scaled = xIdScale(xId) + 1;
                        return scaled;//$hm.xScale()(xId) + 1
                    }
                )
                .attr('y',
                    function (d) {

                        var yId = d.y;
                        if ($hm.options.useIDMapping) {
                            yId = $hm.yIDMap()[yId];
                        }

                        var scaled = yIdScale(yId) + 1;
                        return scaled;//$hm.yScale()(yId) + 1
                    }
                )
                //.attr('y', function (d) { return $hm.yScale()(d.y) })
                //.attr('opacity', function (d) { return d.value })
                .attr('width', $hm.xScale().rangeBand() - $hm.options.cellPadding * 2)
                .attr('height', $hm.cellHeight())
                .attr('rx', $hm.options.rx)
                .attr('ry', $hm.options.ry)
                .attr('fill',
                    function(d) {

                        /*var colorScale = d3.scale.linear()
                            .domain([0,1])
                            .range(['white', d.color]);

                        return colorScale(d.value);*/

                        return d.color;
                    }
                )
                ;
            return this;
        }

            var mouseAction = function() {
                this.on('mouseover', function(d) {
                    if ($hm.options.overColor) {
                        d3.select(this)
                            //.attr('fill', $hm.options.overColor)
                            .attr('stroke', $hm.options.overColor)
//                            .attr('opacity', '100%')
                            .attr('stroke-width', 5);

                        $hm.D3svg().select('.yGutter').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                    var xId = d.x;
                                    if ($hm.options.useIDMapping) {
                                        xId = $hm.xIDMap()[xId];
                                    }

                                    if (d3.select(this).attr('data-id') == xId) {
                                        return $hm.options.overColor;
                                    }
                                }
                        );

                        $hm.D3svg().select('.xPadding').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                    var yId = d.y;
                                    if ($hm.options.useIDMapping) {
                                        yId = $hm.yIDMap()[yId];
                                    }
                                    if (d3.select(this).attr('data-id') == yId) {
                                        return $hm.options.overColor;
                                    }
                                }
                        );

                        var xId = d.x;
                        if ($hm.options.useIDMapping) {
                            xId = $hm.xIDMap()[xId];
                        }
                        var yId = d.y;
                        if ($hm.options.useIDMapping) {
                            yId = $hm.yIDMap()[yId];
                        }

                        $hm.showToolTip(
                            {
                                label : d.label || 'Value for: ' + d.row + ' - ' + d.column + '<br>is ' + d.value.toPrecision(4),
                            }
                        );

                    }
                })
                .on('mouseout', function(d) {
                    if ($hm.options.overColor) {
                        d3.select(this)
                            //.transition()
                            //.attr('fill', d.color)
//                            .attr('opacity', function (d) { return d.value })
                            .attr('stroke', 0);

                        $hm.D3svg().select('.yGutter').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                   return 'black';
                                }
                        );

                        $hm.D3svg().select('.xPadding').selectAll('g g text')
                            .attr("fill",
                                function(r,ri){
                                   return 'black';
                                }
                        );

                        $hm.hideToolTip();

                    }
                })
                .on('click', function(d) {
                    if ($hm.options.clickCallback) {
                        $hm.options.clickCallback(d, $hm);
                    }
                })
                return this;
            };

            var transitionTime = this.initialized
                ? this.options.transitionTime
                : 0;

            var heatmap = this.D3svg().select( this.region('chart') ).selectAll('.hmBG').data([0]);

            heatmap
                .enter()
                    .append('rect')
                        .attr('x', 0 )
                        .attr('y', 0 )
                        .attr('width',  bounds.size.width )
                        .attr('height', bounds.size.height )
                        .attr('fill', $hm.options.hmBGColor )
                        .attr('class', 'hmBG');


            var oldStyleDataset = [];

            var colorScale = this.colorScale();

            for (var i = 0; i < this.dataset().data.length; i++) {
                var row = this.dataset().data[i];
                for (var j = 0; j < row.length; j++) {
                    oldStyleDataset.push(
                        {
                            x : this.dataset().column_ids[j],
                            y : this.dataset().row_ids[i],
                            column : this.dataset().column_labels[j],
                            row : this.dataset().row_labels[i],
                            value : row[j],//valScale(row[j]),
                            color : colorScale(row[j]),
                        }
                    );
                }
            }


            var chart = this.D3svg().select( this.region('chart') ).selectAll('.davis-cell').data(oldStyleDataset);
            chart
                .enter()
                    .append('rect')
                    .attr('class', 'davis-cell')
            ;

            chart
                .call(mouseAction)
                .transition()
                .duration(transitionTime)
                .call(funkyTown)
                .call($hm.endall, function() {
                    $hm.initialized = true;
                });
            ;

            chart
                .data(oldStyleDataset)
                .exit()
                    .remove();


        },


    });

} );
