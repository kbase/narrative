/**
 * Browsing of genes with basic stat and heatmap calculated for a set of conditions
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define([
    'kbwidget',
    'jquery',
    'd3',
    'kbaseExpressionConditionsetBaseWidget',
    // for effect
    'bootstrap',
    'jquery-dataTables',
], (KBWidget, $, d3, kbaseExpressionConditionsetBaseWidget) => {
    'use strict';

    return KBWidget({
        name: 'kbaseExpressionFeatureTableHeatmap',
        parent: kbaseExpressionConditionsetBaseWidget,
        version: '1.0.0',

        colorGenerator: null,

        // To be overriden to specify additional parameters
        getSubmtrixParams: function () {
            const self = this;
            // self.setTestParameters();

            // check options
            this.minColorValue = -2;
            this.maxColorValue = 2;

            if (self.options.min_colorvalue) {
                self.minColorValue = self.options.min_colorvalue;
            }
            if (self.options.max_colorvalue) {
                self.maxColorValue = self.options.max_colorvalue;
            }

            let conditions = [];
            if (self.options.conditionIds) {
                if ($.type(self.options.conditionIds) === 'array') {
                    conditions = self.options.conditionIds;
                } else {
                    conditions = $.map(self.options.conditionIds.split(','), $.trim);
                }
            }

            return {
                input_data: self.options.workspaceID + '/' + self.options.expressionMatrixID,
                column_ids: conditions,
                fl_column_set_stat: 1,
                fl_row_set_stats: 1,
                fl_values: 1,
            };
        },

        $tableDiv: null,

        buildWidget: function ($containerDiv) {
            const self = this;

            self.$tableDiv = $('<div>');

            $containerDiv
                .append(
                    $(
                        '<div style="font-size: 1.2em; width:100%; text-align: center;">Browse Features</div>'
                    )
                )
                .append(
                    $(
                        '<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; ' +
                            'text-align: center;">Statistics calculated for the selected conditions for all features</div>'
                    )
                )
                .append(self.$tableDiv);

            // Define stype for the heat cell
            $(
                "<style type='text/css'> \
                .heat_cell{  \
                    float: left;\
                    width: 1em; \
                    height: 1em; \
                    border: 0.1em solid #AAAAAA; \
                    border-radius: 0.2em; \
                } \
                </style>"
            ).appendTo('head');

            self.redrawTable();

            const minCell = $('<div>')
                .addClass('heat_cell')
                .css('float', 'right')
                .css('padding', '4px')
                .css('background', self.colorGenerator(self.minColorValue));

            const maxCell = $('<div>')
                .addClass('heat_cell')
                .css('float', 'right')
                .css('padding', '4px')
                .css('background', self.colorGenerator(self.maxColorValue));

            $containerDiv.append('<br><br><br>');
            const padding = '2px';
            const $rangeController = $('<div class="row">');
            const $minInput = $('<input id="min" type="text" size="6">').val(self.minColorValue);
            const $maxInput = $('<input id="max" type="text" size="6">').val(self.maxColorValue);
            const $btn = $('<button>')
                .addClass('btn btn-default btn-sm')
                .append('Update')
                .on('click', () => {
                    const min = parseFloat($minInput.val());
                    if (min && !isNaN(min)) {
                        self.minColorValue = min;
                    }
                    $minInput.val(self.minColorValue);
                    const max = parseFloat($maxInput.val());
                    if (max && !isNaN(max)) {
                        self.maxColorValue = max;
                    }
                    $maxInput.val(self.maxColorValue);
                    self.redrawTable();
                });
            $rangeController
                .append($('<div class="form-group col-xs-4">'))
                .append(
                    $('<div class="form-group col-xs-2 text-right">')
                        .css('padding', padding)
                        .append('<small>Min Color Range</small>&nbsp')
                        .append(minCell)
                )
                .append(
                    $('<div class="form-group col-xs-1 text-left">')
                        .css('padding', padding)
                        .append($minInput)
                )
                .append(
                    $('<div class="form-group col-xs-2 text-right">')
                        .css('padding', padding)
                        .append('<small>Max Color Range</small>&nbsp')
                        .append(maxCell)
                )
                .append(
                    $('<div class="form-group col-xs-1 text-left">')
                        .css('padding', padding)
                        .append($maxInput)
                )
                .append(
                    $('<div class="form-group col-xs-1 text-right">')
                        .css('padding', padding)
                        .append($btn)
                );
            $minInput.keyup((event) => {
                if (event.keyCode == 13) {
                    $btn.click();
                }
            });
            $maxInput.keyup((event) => {
                if (event.keyCode == 13) {
                    $btn.click();
                }
            });
            $containerDiv.append($rangeController);
        },

        getState: function () {
            const self = this;
            return { minColor: self.minColorValue, maxColor: self.maxColorValue };
        },

        loadState: function (state) {
            const self = this;
            let needsReload = false;
            if (state.minColor !== self.minColorValue) {
                self.minColorValue = state.minColor;
                needsReload = true;
            }
            if (state.maxColor !== self.maxColorValue) {
                self.maxColorValue = state.maxColor;
                needsReload = true;
            }
            if (needsReload) {
                self.redrawTable();
            }
        },

        redrawTable: function () {
            const self = this;

            self.updateColorGenerator();

            // NB this strange ordering because data table will not work unless the table is
            // actually in the dom.
            self.$tableDiv.empty();
            $(
                '<table id="' +
                    self.pref +
                    'features-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>'
            )
                .appendTo(self.$tableDiv)
                .dataTable({
                    sDom: 'lftip',
                    iDisplayLength: 10,
                    scrollX: true,
                    aaData: self.buildFeaturesTableData(),
                    aoColumns: [
                        { sTitle: 'Feature ID', mData: 'id' },
                        { sTitle: 'Function', mData: 'function' },
                        { sTitle: 'Min', mData: 'min' },
                        { sTitle: 'Max', mData: 'max' },
                        { sTitle: 'Average', mData: 'avg' },
                        { sTitle: 'Std. Dev.', mData: 'std' },
                        {
                            sTitle: 'Expression Values',
                            mData: 'values',
                            mRender: function (values) {
                                const $heatRow = $('<div class="heat_row"/>');

                                for (let i = 0; i < values.length; i++) {
                                    const heatCell = $('<div/>')
                                        .addClass('heat_cell')
                                        .css('background', self.colorGenerator(values[i]))
                                        .attr(
                                            'title',
                                            'Condition: ' +
                                                self.submatrixStat.column_descriptors[i].id +
                                                '\n' +
                                                'Value: ' +
                                                values[i].toFixed(2)
                                        );
                                    $heatRow.append(heatCell);
                                }
                                return $heatRow.html();
                            },
                        },
                    ],
                });
        },
        buildFeaturesTableData: function () {
            const tableData = [];

            const submatrixStat = this.submatrixStat;
            const rowDescriptors = submatrixStat.row_descriptors;
            const columnDescriptors = submatrixStat.column_descriptors;
            const stat = submatrixStat.row_set_stats;
            const values = submatrixStat.values;
            for (let ri = 0; ri < rowDescriptors.length; ri++) {
                const desc = rowDescriptors[ri];

                const rowValues = [];
                for (let ci = 0; ci < columnDescriptors.length; ci++) {
                    rowValues.push(values[ri][ci]);
                }

                const gene_function = desc.properties['function'];

                tableData.push({
                    id: desc.id,
                    function: gene_function ? gene_function : ' ',
                    min: stat.mins[ri] == null ? ' ' : stat.mins[ri].toFixed(2),
                    max: stat.maxs[ri] == null ? ' ' : stat.maxs[ri].toFixed(2),
                    avg: stat.avgs[ri] == null ? ' ' : stat.avgs[ri].toFixed(2),
                    std: stat.stds[ri] == null ? ' ' : stat.stds[ri].toFixed(2),
                    missing_values: stat.missing_values[ri],
                    values: rowValues,
                });
            }
            return tableData;
        },

        minColorValue: null,
        maxColorValue: null,

        updateColorGenerator: function () {
            const self = this;
            const min = this.minColorValue;
            const max = this.maxColorValue;
            self.colorGenerator = d3.scale
                .linear()
                .domain([min, (max + min) / 2, max])
                .range(['#FFA500', '#FFFFFF', '#0066AA']);
            self.colorGenerator.clamp(true);
        },
    });
});
