define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseLinechart'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseLinechart
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseSparkline",
	  parent : kbaseLinechart,

        version: "1.0.0",
        options: {

            xInset              : 0.02,
            yInset              : 0.02,
            lineWidth           : 1,
            useHighlightLine    : false,
            useOverLine         : false,
            autoLegend          : false,
            scaleAxes           : true,
            transitionTime      : 500,
            xPadding            : 0,
            xGutter             : 0,
            yPadding            : 0,
            yGutter             : 0,

            addLastPoint        : true,
            lastPointShape      : 'circle',
            lastPointShapeArea  : 9,
            lastPointColor      : 'red',
            shouldRenderXAxis   : false,
            shouldRenderYAxis   : false,

        },

        setDataset : function(dataset) {

            var sparkValues = dataset;

            dataset = [
                {
                    values : dataset
                }
            ];

            this._super(dataset);

            if (this.options.addLastPoint) {
                var lastPoint = sparkValues[sparkValues.length - 1];
                lastPoint.shape     = this.options.lastPointShape;
                lastPoint.shapeArea = this.options.lastPointShapeArea;
                lastPoint.color     = this.options.lastPointColor;
            }
            

        }
    })
});
