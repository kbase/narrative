/**
 * Expression profile for a set of genes
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

define(['kbwidget', 'bootstrap', 'jquery', 'kbaseExpressionGenesetBaseWidget', 'kbaseLinechart'], (
    KBWidget,
    bootstrap,
    $,
    kbaseExpressionGenesetBaseWidget,
    kbaseLinechart
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseExpressionSparkline',
        parent: kbaseExpressionGenesetBaseWidget,
        version: '1.0.0',

        // To be overriden to specify additional parameters
        getSubmtrixParams: function () {
            const self = this;

            let features = [];
            if (self.options.geneIds) {
                features = $.map(self.options.geneIds.split(','), $.trim);
            }

            return {
                input_data: self.options.workspaceID + '/' + self.options.expressionMatrixID,
                row_ids: features,
                fl_column_set_stat: 1,
                fl_row_set_stats: 1,
                fl_mtx_column_set_stat: 1,
            };
        },

        buildWidget: function ($containerDiv) {
            const submatrixStat = this.submatrixStat;
            const columnDescriptors = submatrixStat.column_descriptors;
            const columnSetStats = submatrixStat.column_set_stat;
            const mtxColumnSetStats = submatrixStat.mtx_column_set_stat;
            const matrixAvg = [];
            const clusterAvg = [];
            const clusterDisp = [];

            let condition;
            for (let i = 0; i < columnSetStats.size; i++) {
                condition = columnDescriptors[i].id;
                matrixAvg.push({
                    x: i + 5,
                    y: mtxColumnSetStats.avgs[i],
                    name: condition,
                });
                clusterAvg.push({
                    x: i + 5,
                    y: columnSetStats.avgs[i],
                    name: condition,
                });
                clusterDisp.push({
                    x: i + 5,
                    y: columnSetStats.mins[i],
                    y2: columnSetStats.maxs[i],
                    name: condition,
                });
            }

            const $lineChartDiv = $("<div style = 'width : 700px; height : 300px'></div>");
            $containerDiv.append($lineChartDiv);
            $containerDiv.append("<div style = 'width : 5px; height : 5px'></div>");

            new kbaseLinechart($lineChartDiv, {
                scaleAxes: true,
                hGrid: true,
                xLabel: 'Conditions',
                yLabel: 'Expression Values',
                xLabelRegion: 'yPadding',
                yLabelRegion: 'xPadding',
                xAxisColor: '#444',
                yAxisColor: '#444',
                xLabelSize: '11pt',
                yLabelSize: '11pt',
                xLabelOffset: 10,
                xPadding: 80,
                yPadding: 30,
                xLabels: false,
                overColor: null,

                useLineLabelToolTip: false,

                autoLegend: true,
                legendRegion: 'xGutter',

                legendSize: '9pt',
                xGutter: 220,
                legendAlignment: 'TR',
                legendLineHeight: 18,

                dataset: [
                    {
                        strokeColor: 'red',
                        label: '- Min/Max Range of Selected Features',
                        values: clusterDisp,
                        fillColor: 'red',
                        strokeOpacity: 0.2,
                        fillOpacity: 0.2,
                        width: 0,
                    },
                    {
                        strokeColor: 'green',
                        label: '- Selected Features Average',
                        values: clusterAvg,
                        width: 1,
                        shape: 'circle',
                        shapeArea: 36,
                        pointOver: function (d) {
                            this.showToolTip({
                                label: 'Selected Features Average<br>' + d.y + '<br>' + d.name,
                            });
                        },
                        pointOut: function () {
                            this.hideToolTip();
                        },
                    },
                    {
                        strokeColor: 'blue',
                        label: '- All Data Average',
                        values: matrixAvg,
                        width: 1,
                        shape: 'circle',
                        shapeArea: 36,
                        pointOver: function (d) {
                            this.showToolTip({
                                label: 'All Data Average<br>' + d.y + '<br>' + d.name,
                            });
                        },
                        pointOut: function () {
                            this.hideToolTip();
                        },
                    },
                ],
            });
        },
    });
});
