/**
 * Pairwise correlation of gene expression profiles.
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseExpressionGenesetBaseWidget',
		'kbaseHeatmap'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseExpressionGenesetBaseWidget,
		kbaseHeatmap
	) {
    return KBWidget({
        name: 'kbaseExpressionPairwiseCorrelation',
        parent : kbaseExpressionGenesetBaseWidget,
        version: '1.0.0',

        maxRange: null,
        minRange: null,

        // To be overriden to specify additional parameters
        getSubmtrixParams: function(){
            var self = this;

            var features = [];
            if(self.options.geneIds) { features = $.map(self.options.geneIds.split(","), $.trim); }

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
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: features,
                fl_row_pairwise_correlation: 1,
                fl_row_set_stats: 1
            };
        },

        buildWidget : function($containerDiv){
            var self = this;
            var submatrixStat = this.submatrixStat;
            var rowDescriptors = submatrixStat.row_descriptors;
            var values = submatrixStat.row_pairwise_correlation.comparison_values;

            //Build row ids
            var rowIds = [];
            for(var i = 0 ; i < rowDescriptors.length; i++){
                rowIds.push(rowDescriptors[i].id);
            }

            // Build data
            var data = [];
            for(var i = 0 ; i < rowDescriptors.length; i++){
                var row = [];
                for(var j = 0 ; j < rowDescriptors.length; j++){
                    row.push(values[i][j].toFixed(3));
                }                
                data.push(row);
            }            
            var heatmap =
                {
                    row_ids : rowIds,
                    row_labels : rowIds,
                    column_ids : rowIds,
                    column_labels : rowIds,
                    data : data,
                };

            var size = rowIds.length;
            var rowH = 35;
            var hmH = 80 + 20 + size * rowH;
            if (hmH > 700)
                hmH = 700;
            if (hmH < 210) {
                hmH = 210;
                rowH = Math.round((hmH - 100) / size);
            }
            var colW = rowH;
            var hmW = 150 + 110 + size * colW;
            if (hmW > 700)
                hmW = 700;
            $heatmapDiv = $("<div style = 'width : "+hmW+"px; height : "+hmH+"px'></div>");
            $containerDiv.append($heatmapDiv);
            $containerDiv.append("<div style = 'width : 5px; height : 5px'></div>");

            // TODO: heatmap values out of range still scale color instead of just the max/min color
            var hm =  new kbaseHeatmap($heatmapDiv, {
                    dataset : heatmap,
                    colors : ['#FFA500', '#FFFFFF', '#0066AA'],
                    minValue : self.minRange,
                    maxValue : self.maxRange
                }
            );
            
        }
    });
});