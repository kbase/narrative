

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'colorbrewer',
		'd3',
		'kbaseBarchart',
		'kbaseTable',
		'kbwidget',
		'kbaseAuthenticatedWidget',
		'kbaseTabs'
	], function(
		KBWidget,
		bootstrap,
		$,
		colorbrewer,
		d3,
		kbaseBarchart,
		kbaseTable,
		KBWidget,
		kbaseAuthenticatedWidget,
		kbaseTabs
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseRNASeqHistogram",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {

        },


        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
        ],


        setDataset : function setDataset(newDataset) {

            var bars = [];

            var i = 0;
            while (newDataset.data[0].length) {
                var xCoord = newDataset.data[0].shift();

                while (i < xCoord) {
                    bars.push(
                        {
                            bar : i++,
                            value : 0,
                            color : 'blue',
                        }
                    );
                }

                bars.push(
                    {
                        bar : i++,
                        value : newDataset.data[1].shift() || 0,
                        color : 'blue',
                    }
                );
            }

            this.setBarchartDataset(bars, newDataset.row_labels[0], newDataset.column_labels[0]);

            this.data('loader').hide();
            this.data('barchartElem').show();
        },

        setBarchartDataset : function setBarchartDataset(bars, xLabel, yLabel) {
            this.data('barchart').setXLabel(xLabel);
            this.data('barchart').setYLabel(yLabel);
            this.data('barchart').setDataset(bars);
        },

        init : function init(options) {
            this._super(options);

            var $hist = this;

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $hist.authToken()});

            var ws_params = {
                workspace : this.options.workspace,
                //ws_id : ws_id_key != undefined ? $pie.options[ws_id] : undefined,
                name : this.options.output
            };

            ws.get_objects([ws_params]).then(function (d) {
                $hist.setDataset(d[0].data);
            })
            .fail(function(d) {

                $hist.$elem.empty();
                $hist.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            })

            this.appendUI(this.$elem);

            return this;
        },

        appendUI : function appendUI($elem) {

            $elem
                .append(
                    $.jqElem('div')
                        .attr('id', 'barchartElem')
                        .css('display', 'none')
                        .css('width', 800) //$elem.width())
                        .css('height', 500) //$elem.height() - 30)
                )
                .append(
                    $.jqElem('div')
                        .attr('id', 'loader')
                        .append('<br>&nbsp;Loading data...<br>&nbsp;please wait...')
                        .append($.jqElem('br'))
                        .append(
                            $.jqElem('div')
                                .attr('align', 'center')
                                .append($.jqElem('i').addClass('fa fa-spinner').addClass('fa fa-spin fa fa-4x'))
                        )
                )
            ;

            this._rewireIds($elem, this);

            this.data('barchart',
                 new kbaseBarchart(this.data('barchartElem'), {
                        scaleAxes   : true,
                        xPadding : 60,

                        xLabelRegion : 'yPadding',
                        yLabelRegion : 'xPadding',

                        xLabelOffset : 10,
                        yLabelOffset : -10,

                        //xLabel      : 'PMI in some manner',
                        //xAxisRegion : 'chart',
                        //xAxisVerticalLabels : true,
                        //yLabel      : 'Meaningful data',
                        //hGrid : true,
                        //useUniqueID : true,
                    }
                )
            );

            var $barchart = this.data('barchart');
            $barchart.superRenderChart = $barchart.renderChart;
            $barchart.renderChart = function() {
                $barchart.superRenderChart();

                this.D3svg()
                    .selectAll('.xAxis .tick text')
                    .data(this.dataset())
                    .attr('fill', function (L, i) {
                        var val = $barchart.dataset()[i].value;
                        return val[0] === 0 ? undefined : 'blue';
                    })
                    .on('mouseover', function(L, i) {
                        var tip = $barchart.dataset()[i].value;
                        if (tip[0]) {
                            $barchart.showToolTip(
                                {
                                    label : $barchart.dataset()[i].value,
                                }
                            );
                        }
                    })
                    .on('mouseout', function(d) {
                        $barchart.hideToolTip();
                    })
            };

        },

    });

} );
