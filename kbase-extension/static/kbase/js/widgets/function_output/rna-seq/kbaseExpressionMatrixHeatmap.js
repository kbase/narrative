define ([
    'jquery',
    'kbwidget',
    'narrativeConfig',
    'kbaseAuthenticatedWidget',
    'kbaseHeatmap',
    'kb_common/jsonRpc/genericClient',
    // for effect
    'bootstrap',
], function(
    $,
    KBWidget,
    Config,
    kbaseAuthenticatedWidget,
    kbaseHeatmap,
    GenericClient
) {
    'use strict';

    return KBWidget({
        name: 'kbaseExpressionMatrixHeatmap',
        parent : kbaseAuthenticatedWidget,

        version: '1.0.0',
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
                    .html('Could not load object : ' + newDataset.description);
            } else {
                var $heatElem = $.jqElem('div').css({width : 800, height : newDataset.data.row_ids.length * 10});

                var $heatmap = new kbaseHeatmap($heatElem, {
                    xPadding : 170,
                });
                this.data('heatmap', $heatmap);
                this.data('heatElem', $heatElem);

                this.$elem.append($heatElem);

                //newDataset.data = newDataset.values;
                this.data('heatElem');
                this.data('heatmap').setDataset({
                    row_ids : newDataset.data.row_ids,
                    column_ids : newDataset.data.col_ids,
                    row_labels : newDataset.data.row_ids,
                    column_labels : newDataset.data.col_ids,
                    data : newDataset.data.values,
                });
            }
        },

        init : function init(options) {
            this._super(options);

            var self = this;

            this.appendUI(this.$elem);

            var ws = new GenericClient({
                module: 'Workspace',
                url: Config.url('workspace'),
                token: self.authToken()
            });

            ws.callFunc('get_objects2', [{
                objects: [{
                    workspace : this.options.workspace,
                    name : this.options.expression_object
                }]
            }])
                .spread(function (result) {
                    // crazy? The result from get_objects2 is a structure with one field "data",
                    // which is an array of objects, in which the associated object data of interest
                    // here is also ... data.
                    self.setDataset(result.data[0].data);
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                    self.$elem.empty();
                    self.$elem
                        .addClass('alert alert-danger')
                        .html('Could not load object : ' + err.message);
                });

            return this;
        },

        appendUI : function appendUI($elem) {
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
                );

            this._rewireIds($elem, this);
        }
    });
});