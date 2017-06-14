/*

*/

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'd3',
		'kbasePiechart'
	], function(
		KBWidget,
		bootstrap,
		$,
		d3,
		kbasePiechart
	) {

    return KBWidget({

	    name: "kbaseCircularHeatmap",
	  parent : kbasePiechart,

        version: "1.0.0",

        options: {
            labels : false,
            draggable : false,
            gradient : false,
            pieColor : 'black',
            gbgColor : '#00FF00',
            gmidColor : 'black',
            gfgColor : '#FF0000',
            highlightColor : 'cyan',
            colorScale : function(idx,data,$pie) {

                if ($pie.colorScale == undefined) {

                    var domain = [0,1];
                    var range = [$pie.options.gbgColor || $pie.options.pieColor, $pie.options.gfgColor];
                    if ($pie.options.gmidColor) {
                        range.splice(1,0,$pie.options.gmidColor);
                        domain.splice(1,0,0.5);
                    }

                    $pie.colorScale = d3.scale.linear()
                        .domain(domain)
                        .range(range);
                }

                return $pie.colorScale(data.val);

            },

        },

        _accessors : [
            {name : 'datasets', setter : 'setDatasets'}
        ],

        init : function(options) {

            this._super(options);

            if (this.options.parent) {
                if (this.options.gbgColor == undefined) {
                    this.options.gbgColor = this.options.pieColor;
                }
                delete this.options.pieColor;
            }

            return this;
        },

        setDatasets : function (newDatasets) {

            var $me = this;
            var _super = $me._super;
            var sd = function() {
                var standardLength = newDatasets.length ? newDatasets[0] : 0;

                for (var i = 0; i < newDatasets.length; i++) {
                    if (newDatasets[i].length != standardLength.length) {
                        throw "Cannot set datasets! Non-standard lengths of circles!";
                    }

                    for (var j = 0; j < newDatasets[i].length; j++) {
                        newDatasets[i][j].value = 1 / newDatasets[i].length;
                    }
                }

                if ($me.originalInnerRadius == undefined) {
                    $me.originalInnerRadius = $me.innerRadius();
                }

                $me.options.innerRadius = 0 - ($me.outerRadius() - $me.originalInnerRadius) / newDatasets.length;

                //return $me._super(newDatasets);
                return _super.call($me, newDatasets);
            };

            $me.callAfterInit(sd);

        },

        sliceAction : function($pie) {

            var radius = $pie.outerRadius();

            return function() {

                this.on('mouseover', function(d) {

                    if (d.data.gap) {
                        return;
                    }

                    var highlightColor = $pie.options.highlightColor;

                    if (highlightColor == undefined) {
                        //xxx. Doesn't automatically invert the gfgColor yet
                    }

                    d3.select(this).attr('fill', highlightColor);

                    var coordinates = [0, 0];
                    coordinates = d3.mouse(this);
                    var x = coordinates[0];
                    var y = coordinates[1];

                    if ($pie.options.tooltips) {
                        $pie.showToolTip(
                            {
                                label : d.data.tooltip || d.data.label + ' : ' + d.data.value,
                                event : {
                                    pageX : $pie.options.cornerToolTip ? $pie.$elem.prop('offsetLeft') + 5 : d3.event.pageX,
                                    pageY : $pie.options.cornerToolTip ? $pie.$elem.prop('offsetTop') + 20 : d3.event.pageY
                                }
                            }
                        );
                    }

                })
                .on('mouseout', function(d) {

                    if (d.data.gap) {
                        return;
                    }

                    if ($pie.options.tooltips) {
                        $pie.hideToolTip();
                    }

                    d3.select(this).attr('fill', function (d2, idx) { return d.data.color || $pie.options.colorScale(idx, d.data, $pie) })
                })
                .on('dblclick', function(d) {

                    if (d.data.gap) {
                        return;
                    }

                    if ($pie.options.draggable) {

                        $pie.options.startAngle = $pie.options.startAngle - d.startAngle;
                        $pie.renderChart();
                    }
                })
                ;
                return this;
            }
        },


    });

} );
