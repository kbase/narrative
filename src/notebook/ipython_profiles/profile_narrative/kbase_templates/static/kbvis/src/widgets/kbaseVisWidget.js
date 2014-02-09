/*

*/

define('kbaseVisWidget',
    [
        'jquery',
        'd3',
        'kbwidget',
        'RGBColor',
        'geometry_rectangle',
        'geometry_point',
        'geometry_size'
    ], function( $ ) {

    $.KBWidget({

	    name: "kbaseVisWidget",

        version: "1.0.0",
        options: {
            xGutter     : 20,
            xPadding    : 30,
            yGutter     : 20,
            yPadding    : 30,

            width       : 300,
            height      : 300,

            xScaleType      : 'linear',
            yScaleType      : 'linear',

            useIDMapping    : false,
            bgColor : 'white',
            scaleXAxis : false,
            scaleYAxis : false,
            scaleAxes  : false,

            transitionTime : 100,
            ulIcon         : 'img/labs_icon.png',
        },

        shouldScaleAxis : function (axis) {
            if (this.options.scaleAxes) {
                return true;
            }
            else if (axis == 'x' && this.options.scaleXAxis) {
                return true;
            }
            else if (axis == 'y' && this.options.scaleYAxis) {
                return true;
            }
            else {
                return false;
            }
        },

        _accessors : [
            'xGutter',
            'xPadding',
            'yGutter',
            'yPadding',
            'width',
            'height',
            {name : 'dataset', setter : 'setDataset'},
            {name : 'input',   setter : 'setInput'},
            {name : 'xLabel', setter : 'setXLabel'},
            {name : 'yLabel', setter : 'setYLabel'},
            {name : 'xScale', setter : 'setXScale'},
            {name : 'yScale', setter : 'setYScale'},
            'xScaleType',
            'yScaleType',
            'yHeightScaleType',
            'xIDMap',
            'yIDMap',
        ],

        input : function() {
            return this.dataset();
        },

        setInput : function(newInput) {

            if ($.isPlainObject(newInput) && newInput.dataset != undefined) {
                return this.setValuesForKeys(newInput);
            }
            else {
                return this.setDataset(newInput);
            }

        },

        setXLabel : function (newXLabel) {
            this.setValueForKey('xLabel',newXLabel);
            this.render('xLabel');
        },

        setYLabel : function (newYLabel) {
            this.setValueForKey('yLabel',newYLabel);
            this.render('yLabel');
        },

        setXScale : function (newXScale) {
            this.setValueForKey('xScale', newXScale);
            this.render('xAxis');
        },

        setYScale : function (newYScale) {
            this.setValueForKey('yScale', newYScale);
            this.render('yAxis');
        },

        createIDMapForDomain : function (domain) {
            var map = {};
            $.each(
                domain,
                function (idx, val) {
                    map[idx] = val;
                }
            );
            return map;
        },

        setXScaleDomain : function(domain, scaleType) {
            var xScale = this.xScale();

            if (xScale == undefined) {
                if (scaleType == undefined) {
                    scaleType = this.xScaleType() || this.options.xScaleType;
                }

                xScale = d3.scale[scaleType]();

                this.setXScaleRange([0, this.chartBounds().size.width], xScale);
                this.setValueForKey('xScale', xScale);
            }

            xScale.domain(domain);

            if (this.options.useIDMapping && this.xIDMap() == undefined) {
                this.xIDMap(this.createIDMapForDomain(domain));
            }

            this.render('xAxis');

            return xScale;
        },

        setXScaleRange : function(range, xScale) {
            if (xScale == undefined) {
                xScale = this.xScale();
            }
            xScale.range(range);

            return xScale;
        },

        setYScaleDomain : function(domain, scaleType) {
            var yScale = this.yScale();

            if (yScale == undefined) {
                if (scaleType == undefined) {
                    scaleType = this.yScaleType() || this.options.yScaleType;
                }
                yScale = d3.scale[scaleType]();

                this.setYScaleRange([0,this.chartBounds().size.height], yScale);
                this.setValueForKey('yScale', yScale);
            }

            yScale.domain(domain);

            if (this.options.useIDMapping && this.yIDMap() == undefined) {
                this.yIDMap(this.createIDMapForDomain(domain));
            }

            this.render('yAxis');

            return yScale;
        },

        setYScaleRange : function(range, yScale) {
            if (yScale == undefined) {
                yScale = this.yScale();
            }
            yScale.range(range);

            return yScale;
        },


        init: function(options) {

            this._super(options);

            this.width(this.$elem.width());
            this.height(this.$elem.height());

            this.appendUI(this.$elem);

            if (this.xScale()) {
                this.setXScaleRange([0, this.chartBounds().size.width], this.xScale());
            }
            if (this.yScale()) {
                this.setYScaleRange([0, this.chartBounds().size.height], this.yScale());
            }

            this.callAfterInit(
                $.proxy(function() {
                    this.render();
                }, this)
            );

            return this;

        },

        render : function(field) {

            if (! this._init) {
                return;
            }

            if (field == undefined || field == 'chart') {
                this.renderChart();
            }

            if (field == undefined || field == 'xAxis') {
                this.renderXAxis();
            }

            if (field == undefined || field == 'yAxis') {
                this.renderYAxis();
            }

            if (field == undefined || field == 'xLabel') {
                this.renderXLabel();
            }

            if (field == undefined || field == 'yLabel') {
                this.renderYLabel();
            }

            if (field == undefined || field == 'ulCorner') {
                this.renderULCorner();
            }

        },

        renderULCorner : function() {

            var ulBounds = this.ULBounds();

            var imgSize = new Size(
                ulBounds.size.width,
                ulBounds.size.height
            );

            var inset = 5;

            imgSize.width  -= inset;
            imgSize.height -= inset;

            if (imgSize.width > imgSize.height) {
                imgSize.width = imgSize.height;
            }
            else if (imgSize.height > imgSize.width) {
                imgSize.height = imgSize.width;
            }

            if (imgSize.width < 25) {
                return;
            }

            var ulDataset = [this.options.ulIcon];

            if (this.options.ulIcon) {
                var ulLabel = this.data('D3svg').select('.UL').selectAll('.ULLabel');

                ulLabel
                    .data(ulDataset)
                    .enter()
                        .append('image')
                            .attr('x', inset / 2)
                            .attr('y', inset / 2)
                            .attr('width', imgSize.width)
                            .attr('height', imgSize.height)
                            .attr('xlink:href', function(d) { return d})
            }
        },

        setDataset : function(newDataset) {

            this.setValueForKey('dataset', newDataset);

            if (this.shouldScaleAxis('x')) {
                this.setXScaleDomain(this.defaultXDomain());
            }

            if (this.shouldScaleAxis('y')) {
                this.setYScaleDomain(this.defaultYDomain());
            }

            this.render('chart');
        },

        defaultXDomain : function() {
            return [0,100];
        },

        defaultYDomain : function() {
            return [0,100];
        },

        renderXLabel : function() {
            var yGutterBounds = this.yGutterBounds();

            var xLabeldataset = [this.xLabel()];

            var xLabel = this.data('D3svg').select('.yGutter').selectAll('.xLabel');
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

            var yLabeldataset = [this.yLabel()];

            var xLabel = this.data('D3svg').select('.xGutter').selectAll('.yLabel');
            xLabel
                .data(yLabeldataset)
                    .text( this.yLabel() )
                .enter()
                    .append('text')
                        .attr('class', 'yLabel')
                        .attr('x', xGutterBounds.size.width / 2)
                        .attr('y', xGutterBounds.size.height / 2 + 3)
                        .attr('text-anchor', 'middle')
                        .attr('font-size', '11px')
                        .attr('font-family', 'sans-serif')
                        .attr('fill', 'black')
                        .attr('transform', 'rotate(90,'
                            + (xGutterBounds.size.width / 2 - 7)
                            + ','
                            + xGutterBounds.size.height / 2
                            + ')')
                        .text(this.yLabel());
            ;

        },

        xTickValues : function() {
            return;
        },

        xTickLabel : function(val) {
            return val;
        },

        renderXAxis : function() {

            var $self = this;

            if (this.xScale() == undefined || this.xScale().domain == undefined) {
                return;
            }

            var xAxis =
                d3.svg.axis()
                    .scale(this.xScale())
                    .orient('bottom');

            var ticks = this.xTickValues();

            if (ticks != undefined) {
                xAxis
                    .tickValues(ticks)
                    .tickSubdivide(0)
                    .tickFormat( function(d) { return $self.xTickLabel.call($self, d) } )
                ;
            }

            var gxAxis = this.data('D3svg').select('.yPadding').select('.xAxis');

            if (gxAxis[0][0] == undefined) {
                gxAxis = this.data('D3svg').select('.yPadding')
                    .append('g')
                        .attr('class', 'xAxis axis')
            }

            gxAxis.transition().call(xAxis);

        },

        svg2HTML : function() {
            var $container = $.jqElem('div')
                .append(this.data('$svg'));

            return $container.html();
        },

        renderYAxis : function() {

            if (this.yScale() == undefined) {
                return;
            }

            var yAxis =
                d3.svg.axis()
                    .scale(this.yScale())
                    .orient('left');

            var gyAxis = this.data('D3svg').select('.xPadding').select('.yAxis');

            if (gyAxis[0][0] == undefined) {
                gyAxis = this.data('D3svg').select('.xPadding')
                    .append('g')
                        .attr('class', 'yAxis axis')
                        .attr("transform", "translate(" + this.xPaddingBounds().size.width + ",0)")
            }

            gyAxis.transition().call(yAxis);
        },



        renderChart : function() {

        },

        setGutter : function(newGutter) {
            this.xGutter(newGutter);
            this.yGutter(newGutter);
        },

        setPadding : function(newPadding) {
            this.xPadding(newPadding);
            this.yPadding(newPadding);
        },

/*
        +------------------------+
        | UL|   yGutter      |UR |
        +------------------------+
        | X |   chart        | X |
        | P |                | G |
        +------------------------+
        | LL|   yPadding     |LR |
        +------------------------+
*/

        appendUI : function ($elem) {

            $elem.append(
                $.jqElem('style')
                    .html('.axis path, .axis line { fill : none; stroke : black; shape-rendering : crispEdges;} .axis text \
                        {font-family : sans-serif; font-size : 11px}')
            );

            var D3svg = d3.select($elem.get(0))
                .append('svg')
                .attr('width', this.width())
                .attr('height', this.height())
                .attr('style', this.options.debug ? 'border : 1px solid blue' : undefined);

            var tooltip = d3.select('body').selectAll('.visToolTip')
                .data([0])
                .enter()
                    .append('div')
                        .attr('class', 'visToolTip')
                        .style(
                            {
                                position                : 'absolute',
                                'max-width'             : '300px',
                                height                  : 'auto',
                                padding                 : '10px',
                                'background-color'      : 'white',
                                '-webkit-border-radius' : '10px',
                                '-moz-border-radius'    : '10px',
                                'border-radius'         : '10px',
                                '-webkit-box-shadow'    : '4px 4px 10px rgba(0, 0, 0, 0.4)',
                                '-moz-box-shadow'       : '4px 4px 10px rgba(0, 0, 0, 0.4)',
                                'box-shadow'            : '4px 4px 10px rgba(0, 0, 0, 0.4)',
                                'pointer-events'        : 'none',
                                'display'               : 'none',
                                'font-family'   : 'sans-serif',
                                'font-size'     : '12px',
                                'line-height'   : '20px',
                                'display'       : 'none',
                            }
                        )
            ;

            this.data('D3svg', D3svg);


            var regions = [
                'chart', //add the chart first, because we want it to be at the lowest level.
                'UL','UR','LL','LR', //corners are low priority
                'yGutter','xGutter','yPadding','xPadding'   //labels win
            ];

            //used when debug is on.
            var colors = [
                'red',      'green',    'blue',
                'cyan',     'magenta',  'yellow',
                'purple',   'orange',   'gray'
            ];


            var $vis = this;

            D3svg.selectAll('g')
                .data(regions)
                .enter()
                    .append('g')
                        .attr('class', function(region) { return region } )
                        .attr('data-x', $.proxy(function(region) { var bounds = this[region + 'Bounds'](); return bounds.origin.x }, this) )
                        .attr('data-y', $.proxy(function(region) { var bounds = this[region + 'Bounds'](); return bounds.origin.y }, this) )
                        .attr('data-width',  $.proxy(function(region) { var bounds = this[region + 'Bounds'](); return bounds.size.width }, this) )
                        .attr('data-height', $.proxy(function(region) { var bounds = this[region + 'Bounds'](); return bounds.size.height }, this) )
                        .attr('transform',
                            $.proxy(
                                function(region) {
                                    var bounds = this[region + 'Bounds']();
                                    return 'translate(' + bounds.origin.x + ',' + bounds.origin.y + ')';
                                }, this)
                        )
                        .append('rect')
                            .attr('x', 0 )
                            .attr('y', 0 )
                            .attr('width',  $.proxy(function(region) { var bounds = this[region + 'Bounds'](); return bounds.size.width }, this) )
                            .attr('height', $.proxy(function(region) { var bounds = this[region + 'Bounds'](); return bounds.size.height }, this) )
                            .attr('fill', function(d) {return $vis.options.debug ? colors.shift() : $vis.options.bgColor})
                            .attr('class', 'background')

            ;

        },

        ULBounds : function() {
            return new Rectangle(
                new Point(0, 0),
                new Size(this.xPadding(), this.yGutter())
            );
        },

        URBounds : function() {
            return new Rectangle(
                new Point(this.xPadding() + this.chartBounds().size.width, 0),
                new Size(this.xGutter(), this.yGutter())
            );
        },

        LLBounds : function() {
            return new Rectangle(
                new Point(0, this.yGutter() + this.chartBounds().size.height),
                new Size(this.xPadding(), this.yPadding())
            );
        },

        LRBounds : function() {
            return new Rectangle(
                new Point(this.xPadding() + this.chartBounds().size.width, this.yGutter() + this.chartBounds().size.height),
                new Size(this.xPadding(), this.yPadding())
            );
        },

        xPaddingBounds : function() {
            return new Rectangle(
                new Point(0, this.yGutter()),
                new Size(this.xPadding(), this.chartBounds().size.height)
            );
        },

        xGutterBounds : function() {
            return new Rectangle(
                new Point(this.xPadding() + this.chartBounds().size.width, this.yGutter()),
                new Size(this.xPadding(), this.chartBounds().size.height)
            );
        },

        yGutterBounds : function() {
            return new Rectangle(
                new Point(this.xPadding(), 0),
                new Size(this.chartBounds().size.width, this.yGutter())
            );
        },

        yPaddingBounds : function() {
            return new Rectangle(
                new Point(this.xPadding(), this.yGutter() + this.chartBounds().size.height),
                new Size(this.chartBounds().size.width, this.yPadding())
            );
        },

        chartBounds : function() {

            var widgetWidth  = this.width();
            var widgetHeight = this.height();

            return new Rectangle(
                new Point(this.xPadding(), this.yGutter()),
                new Size(
                    widgetWidth  - this.xPadding() - this.xGutter(),
                    widgetHeight - this.yGutter()  - this.yPadding()
                )
            );
        },

        showToolTip : function(args) {

            if (args.event == undefined) {
                args.event = d3.event;
            }

            d3.selectAll('.visToolTip')
                .style('display','block')
                .html(args.label)
                .style("left", (args.event.pageX+10) + "px")
                .style("top", (args.event.pageY-10) + "px");
        },

        hideToolTip : function(args) {
            d3.selectAll('.visToolTip').style('display', 'none');
        },



    });

} );
