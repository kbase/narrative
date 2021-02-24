/**
 * Pairwise correlation of gene expression profiles.
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 const MAGIC_DOWNLOAD_NUMBER = 50;

define ([
    'kbwidget',
    'bootstrap',
    'jquery',
    'kbaseExpressionGenesetBaseWidget',
    'kbaseHeatmap'
], (
    KBWidget,
    bootstrap,
    $,
    kbaseExpressionGenesetBaseWidget,
    kbaseHeatmap
) => {
    'use strict';

    return KBWidget({
        name: 'kbaseExpressionPairwiseCorrelation',
        parent : kbaseExpressionGenesetBaseWidget,
        version: '1.0.0',

        maxRange: null,
        minRange: null,

        // To be overriden to specify additional parameters
        getSubmtrixParams: function(){
            const self = this;

            let features = [];
            if(self.options.geneIds) { features = $.map(self.options.geneIds.split(','), $.trim); }

            self.minRange = -1; self.maxRange = 1;
            if(self.options.minRange) {
                self.minRange = self.options.minRange;
            }
            if(self.options.maxRange) {
                self.maxRange = self.options.maxRange;
            }
            if(self.minRange>self.maxRange) {
                self.minRange = self.maxRange;
            }

            return{
                input_data: self.options.workspaceID + '/' + self.options.expressionMatrixID,
                row_ids: features,
                fl_row_pairwise_correlation: 1,
                fl_row_set_stats: 1
            };
        },

        buildWidget : function($containerDiv){
            const self = this;
            const submatrixStat = this.submatrixStat;
            const rowDescriptors = submatrixStat.row_descriptors;
            const values = submatrixStat.row_pairwise_correlation.comparison_values;

            //Build row ids
            const rowIds = [];
            let i;
            for(i = 0 ; i < rowDescriptors.length; i++){
                rowIds.push(rowDescriptors[i].id);
            }

            // Build data
            const data = [];
            for(i = 0 ; i < rowDescriptors.length; i++){
                const row = [];
                for(let j = 0 ; j < rowDescriptors.length; j++){
                    row.push(values[i][j].toFixed(3));
                }
                data.push(row);
            }
            const heatmap =
                {
                    row_ids : rowIds,
                    row_labels : rowIds,
                    column_ids : rowIds,
                    column_labels : rowIds,
                    data : data,
                };

            const size = rowIds.length;
            let rowH = 15;
            let hmH = 80 + 20 + size * rowH;

            if (hmH < 210) {
                hmH = 210;
                rowH = Math.round((hmH - 100) / size);
            }
            const colW = rowH;
            const hmW = 150 + 110 + size * colW;

            const $heatmapDiv = $('<div style = \'width : '+hmW+'px; height : '+hmH+'px\'></div>');
//            $containerDiv.append($heatmapDiv);
            $containerDiv.append('<div style = \'width : 5px; height : 5px\'></div>');

            // TODO: heatmap values out of range still scale color instead of just the max/min color
            new kbaseHeatmap($heatmapDiv, {
                dataset : heatmap,
                colors : ['#FFA500', '#FFFFFF', '#0066AA'],
                minValue : self.minRange,
                maxValue : self.maxRange
            });

            if (rowIds.length < MAGIC_DOWNLOAD_NUMBER) {
              $containerDiv.append($heatmapDiv);
            }
            else {
              const $svg = $heatmapDiv.find('svg');
              const $dummy = $.jqElem('div').append($svg);

              $containerDiv.append(
                $.jqElem('button')
                  .append("Please download the svg of this pairwise correlation")
                  .addClass('btn btn-primary')
                  .on('click', (e) => {
                  const file = new Blob([$dummy.html()], {type : 'text'});
                  const a = document.createElement("a"),
                          url = URL.createObjectURL(file);
                  a.href = url;
                  a.download = 'pairwise.svg';
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                      document.body.removeChild(a);
                      window.URL.revokeObjectURL(url);
                  }, 0);
                })
              );
            }

        }
    });
});
