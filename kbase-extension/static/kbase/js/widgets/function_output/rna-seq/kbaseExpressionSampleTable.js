

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseAuthenticatedWidget',
		'kbaseTabs',
		'kbaseHistogram',
		'kbaseTable'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseAuthenticatedWidget,
		kbaseTabs,
		kbaseHistogram,
		kbaseTable
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseExpressionSampleTable",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {
            numBins : 50,
            minCutoff : 0.001,
        },

        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
            //{name: 'barchartDataset', setter: 'setBarchartDataset'},
        ],

        getState : function() {
            return this.data('histogram').getState();
        },

        loadState : function(state) {
            this.data('histogram').loadState(state);
            this.data('histogram').renderHistogram();
        },


        setDataset : function setDataset(newDataset) {

            var rows = [];
            var barData = [];

            var min = Number.MAX_VALUE;
            var max = Number.MIN_VALUE;

            var exprKeys = Object.keys(newDataset.expression_levels).sort();

            $.each(
                exprKeys,
                function (i,k) {

                    var val = Math.round(newDataset.expression_levels[k] * 1000) / 1000;

                    rows.push( [k, val] );

                    if (val < min) {
                        min = val;
                    }
                    if (val > max) {
                        max = val;
                    }
                    barData.push(val);

                    /*var bin = Math.floor(newDataset.expression_levels[k]);

                    if (barData[bin] == undefined) {
                        barData[bin] = 0;
                    }
                    barData[bin]++;*/

                }
            );

            //this.setBarchartDataset(barData);
            this.data('histogram').setDataset(barData);
            //this.renderHistogram(this.options.numBins);

            var $dt = this.data('tableElem').dataTable({
                aoColumns : [
                    { title : 'Gene ID'},
                    { title : 'Feature Value : log2(FPKM + 1)'}
                ]
            });
            $dt.fnAddData(rows);


            this.data('loader').hide();
            this.data('containerElem').show();

        },

        init : function init(options) {
            this._super(options);

            var $self = this;

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $self.authToken()});
            //var ws = new Workspace('https://ci.kbase.us/services/ws', {token : $self.authToken()});

            var ws_params = {
                workspace : this.options.workspace,
                wsid : this.options.wsid,
                name : this.options.output
            };

            this.appendUI(this.$elem);

            ws.get_objects([ws_params]).then(function (d) {
                $self.setDataset(d[0].data);
            }).fail(function(d) {

                $self.$elem.empty();
                $self.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + d.error.message);
            })

            return this;
        },

        appendUI : function appendUI($elem) {

            var $me = this;

            var $tableElem = $.jqElem('table')
                .css('width', '95%')
                    .append(
                        $.jqElem('thead')
                            .append(
                                $.jqElem('tr')
                                    .append($.jqElem('th').append('Gene ID'))
                                    .append($.jqElem('th').append('Feature Value : log2(FPKM + 1)'))
                            )
                    )
            ;

            var $histElem = $.jqElem('div').css({width : 800, height : 500});

            var $containerElem = $.jqElem('div').attr('id', 'containerElem').css('display', 'none');

            var $container =  new kbaseTabs($containerElem, {
                    tabs : [
                        {
                            tab : 'Overview',
                            content : $tableElem
                        },
                        {
                            tab : 'Histogram',
                            content : $histElem
                        }
                    ]
                }
            )

            $container.$elem.find('[data-tab=Histogram]').on('click', function(e) {
                $histogram.renderXAxis();
                setTimeout(function() {$histogram.renderHistogram() }, 300);
            });

            $elem
                .append( $containerElem )
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

            var $histogram =
                 new kbaseHistogram($histElem, {
                        scaleAxes   : true,
                        xPadding : 60,
                        yPadding : 120,

                        xLabelRegion : 'yPadding',
                        yLabelRegion : 'xPadding',

                        xLabelOffset : 45,
                        yLabelOffset : -10,

                        yLabel : 'Number of Genes',
                        xLabel : 'Gene Expression Level log2(FPKM + 1)',
                        xAxisVerticalLabels : true,
                        useUniqueID : true,

                    }
                )
            ;

            this.data('tableElem', $tableElem);
            this.data('histElem',   $histElem);
            this.data('container', $container);
            this.data('histogram', $histogram);

        },

    });

} );
