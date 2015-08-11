/**
 * Browsing of heatmaps for a gene set for each condition. Basic statistics for each condition is also provided. 
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 define([
        'jquery', 
        'kbaseExpressionGenesetBaseWidget'
        ], function($) {
    $.KBWidget({
        name: 'kbaseExpressionHeatmap',
        parent: 'kbaseExpressionGenesetBaseWidget',
        version: '1.0.0',

        // To be overriden to specify additional parameters
        getSubmtrixParams: function(){
            var self = this;
            // self.setTestParameters();

            return{
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: $.map(self.options.geneIds.split(","), $.trim),
                fl_column_set_stat: 1,
                fl_row_set_stats: 1,
                fl_values: 1
            };
        },
        
        buildWidget: function($containerDiv){
            var self = this;
            var pref = this.pref;

            $containerDiv.append(
                $('<div style="font-size: 1.5em; width:100%; text-align: center;"> Browse conditions </div>')
            );
            $containerDiv.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated for the selected genes</div>')
            );

            // Define stype for the heat cell
            $("<style type='text/css'> \
                .heat_cell{  \
                    float: left;\
                    width: 1em; \
                    height: 1em; \
                    border: 0.1em solid #AAAAAA; \
                    border-radius: 0.2em; \
                } \
                </style>").appendTo("head");

            var tableConditions = $('<table id="' + pref + 'conditions-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo($containerDiv)
                .dataTable( {
                    "sDom": 'lftip',
                    "iDisplayLength": 10,
                    "scrollX": true,
                    "aaData": self.buildConditionsTableData(),                  
                    "aoColumns": [
                        { sTitle: "Condition", mData:"id"},
                        { sTitle: "Min", mData:"min"},
                        { sTitle: "Max", mData:"max"},
                        { sTitle: "Avg", mData:"avg"},                            
                        { sTitle: "Std", mData:"std"},
                        { sTitle: "Expression", mData: "values",
                            mRender: function ( values ) {
                                var $heatRow = $('<div class="heat_row"/>');

                                for(var i = 0 ; i < values.length; i++){
                                    var heatCell = $('<div/>')
                                        .addClass('heat_cell')
                                        .css('background',self.getColor(values[i]))
                                        .attr('title', 
                                            'Feature: ' + self.submatrixStat.row_descriptors[i].id
                                             + '\n' + 'Value: ' + values[i].toFixed(2)
                                        );
                                    $heatRow.append(heatCell);
                                }
                                return $heatRow.html();
                            }
                        }
                    ]
                } );     
        },
        buildConditionsTableData: function(){
            var tableData = [];

            var submatrixStat = this.submatrixStat;
            var columnDescriptors = submatrixStat.column_descriptors;
            var rowDescriptors = submatrixStat.row_descriptors;
            var stat = submatrixStat.column_set_stat;
            var values = submatrixStat.values;
            for(var ci = 0; ci < columnDescriptors.length; ci++){
                var desc = columnDescriptors[ci];

                var columnValues = [];
                for(var ri = 0; ri < rowDescriptors.length; ri++){
                    columnValues.push(values[ri][ci]);
                }

                tableData.push(
                    {
                        'id': desc.id,
                        'min': stat.mins[ci] === null? ' ' : stat.mins[ci].toFixed(2),
                        'max': stat.maxs[ci] === null? ' ' : stat.maxs[ci].toFixed(2),
                        'avg': stat.avgs[ci] === null? ' ' : stat.avgs[ci].toFixed(2),
                        'std': stat.stds[ci] === null? ' ' : stat.stds[ci].toFixed(2),
                        'missing_values': stat.missing_values[ci],
                        'values': columnValues
                    }
                );
            }
            return tableData;
        },
        getColor: function(value){
            //TODO needs to be imporved
            var r = 0;
            var g = 255;
            var b = 0;

            if(value >= 0){
                b = 255;
                r = ((2 - value)/2*255).toFixed(0);
            }
            if(value > 2){
                b = 255;
                r = 0;
            }

            if(value < 0){
                b = ((2 + value)/2*255).toFixed(0);
                r = 255;
            }
            if(value < -2){
                b = 0;
                r = 255;
            }

            return 'rgb('+r+','+g+','+b+')';
        }
    });
});