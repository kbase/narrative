

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbwidget',
		'kbaseAuthenticatedWidget',
		'kbaseTabs',
		'kbaseHistogram',
		'kbaseTable'
	], function(
		KBWidget,
		bootstrap,
		$,
		KBWidget,
		kbaseAuthenticatedWidget,
		kbaseTabs,
		kbaseHistogram,
		kbaseTable
	) {

    'use strict';

    return KBWidget({

	    name: "kbasePValueHistogram",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {

        },

        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
            //{name: 'barchartDataset', setter: 'setBarchartDataset'},
        ],

        failure : function failure(d) {

            $self.$elem.empty();
            $self.$elem
                .addClass('alert alert-danger')
                .html("Could not load object : " + d.error.message);
        },

        setDataset : function setDataset(newDataset) {

            this.data('histogram').setDataset(newDataset.data.data[0]);

            this.data('loader').hide();
            this.data('histElem').show();
        },

        init : function init(options) {
            this._super(options);

            var $self = this;

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $self.authToken()});
            //var ws = new Workspace('https://ci.kbase.us/services/ws', {token : $self.authToken()});

            var ws_params = {
                workspace : this.options.workspace,
                name : this.options.figure_object
            };

            this.appendUI(this.$elem);

            ws.get_objects([ws_params]).then(function (d) {

                ws.get_objects([{ref : d[0].data.data_ref}]).then(function(r) {
                    $self.setDataset(r[0]);
                }).fail(this.failure);

            }).fail(this.failure)

            return this;
        },

        appendUI : function appendUI($elem) {

            var $me = this;


            var $histElem = $.jqElem('div').css({width : 800, height : 500});

            $elem
                .append( $histElem )
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

                        //yLabel : 'Number of Genes',
                        //xLabel : 'Gene Expression Level log2(FPKM + 1)',
                        xAxisVerticalLabels : true,
                        useUniqueID : true,

                        //colors : ['#FF0000', '#990000'],
                        //tickColor : 'red',

                    }
                )
            ;

            this.data('histElem',   $histElem);
            this.data('histogram', $histogram);

        },

    });

} );
