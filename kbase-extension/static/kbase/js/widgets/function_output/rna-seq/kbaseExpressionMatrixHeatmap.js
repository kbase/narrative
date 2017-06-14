

define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseAuthenticatedWidget',
		'kbaseHeatmap'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseAuthenticatedWidget,
		kbaseHeatmap
	) {

    'use strict';

    return KBWidget({

	    name: "kbaseExpressionMatrixHeatmap",
	    parent : kbaseAuthenticatedWidget,

        version: "1.0.0",
        options: {
            numBins : 10,
        },

        _accessors : [
            {name: 'dataset', setter: 'setDataset'},
            {name: 'barchartDataset', setter: 'setBarchartDataset'},
        ],


        setDataset : function setDataset(newDataset) {
            this.data('loader').hide();

            if (newDataset.data.values.length == 0) {
                this.$elem.empty();
                this.$elem
                    .addClass('alert alert-danger')
                    .html("Could not load object : " + newDataset.description);
            }
            else {

                var $heatElem = $.jqElem('div').css({width : 800, height : newDataset.data.row_ids.length * 10});

                var $heatmap =
                     new kbaseHeatmap($heatElem, {
                            xPadding : 170,
                        }
                    )
                ;
                this.data('heatmap', $heatmap);
                this.data('heatElem', $heatElem);

                this.$elem.append($heatElem);


                //newDataset.data = newDataset.values;
                this.data('heatElem')
                this.data('heatmap').setDataset(
                    {
                        row_ids : newDataset.data.row_ids,
                        column_ids : newDataset.data.col_ids,
                        row_labels : newDataset.data.row_ids,
                        column_labels : newDataset.data.col_ids,
                        data : newDataset.data.values,
                    }
                );
            }


        },


        init : function init(options) {

            this._super(options);

            var $self = this;

            this.appendUI(this.$elem);

            var ws = new Workspace(window.kbconfig.urls.workspace, {token : $self.authToken()});
            //var ws = new Workspace('https://ci.kbase.us/services/ws', {token : $self.authToken()});

            var ws_params = {
                workspace : this.options.workspace,
                name : this.options.expression_object
            };

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


            $elem
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

        },

    });

} );
