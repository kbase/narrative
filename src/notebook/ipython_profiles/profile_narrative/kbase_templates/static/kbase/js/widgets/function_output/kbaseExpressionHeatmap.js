/**
 * Browsing of heatmaps for a gene set for each condition. Basic statistics for each condition is also provided. 
 *
 * Pavel Novichkov <psnovichkov@lbl.gov>
 * @public
 */

 define([
        'jquery',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap',      
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

            this.minColorValue=-2;
            this.maxColorValue=2;

            return{
                input_data: self.options.workspaceID + "/" + self.options.expressionMatrixID,
                row_ids: $.map(self.options.geneIds.split(","), $.trim),
                fl_column_set_stat: 1,
                fl_row_set_stats: 1,
                fl_values: 1
            };
        },
        
        $tableDiv: null,


        buildWidget: function($containerDiv){
            var self = this;
            var pref = this.pref;

            $containerDiv.append(
                $('<div style="font-size: 1.2em; width:100%; text-align: center;">Browse Conditions</div>')
            );
            $containerDiv.append(
                $('<div style="font-size: 1em; margin-top:0.2em; font-style: italic; width:100%; text-align: center;">Statistics calculated for the selected features in a condition</div>')
            );

            self.$tableDiv = $('<div>');
            $containerDiv.append(self.$tableDiv);

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

            self.redrawTable();


            var minCell = $('<div>')
                            .addClass('heat_cell')
                            .css('float','right')
                            .css('padding','4px')
                            .css('background',self.getColor(self.minColorValue));

            var maxCell = $('<div>')
                            .addClass('heat_cell')
                            .css('float','right')
                            .css('padding','4px')
                            .css('background',self.getColor(self.maxColorValue));

            $containerDiv.append('<br><br><br>');
            var padding = '2px';
            var $rangeController = $('<div class="row">');
            var $minInput = $('<input id="min" type="text" class="form-control input-sm">').val(self.minColorValue)
            var $maxInput = $('<input id="min" type="text" class="form-control input-sm">').val(self.maxColorValue)
            $rangeController
                .append($('<div class="form-group col-xs-4">'))
                .append($('<div class="form-group col-xs-2 text-right">').css('padding',padding)
                    .append("<small>Min Color Range</small>&nbsp").append(minCell))
                .append($('<div class="form-group col-xs-1 text-left">').css('padding',padding)
                    .append($minInput))
                .append($('<div class="form-group col-xs-2 text-right">').css('padding',padding)
                    .append("<small>Max Color Range</small>&nbsp").append(maxCell))
                .append($('<div class="form-group col-xs-1 text-left">').css('padding',padding)
                    .append($maxInput))
                .append($('<div class="form-group col-xs-1 text-right">').css('padding',padding).append(
                    $('<button>').addClass('btn btn-default btn-sm').append('Update')
                        .on('click', function() {
                            var min = parseFloat($minInput.val());
                            if(min && !isNaN(min)) { 
                                if(min>0) min=0;
                                self.minColorValue = min;
                            }
                            $minInput.val(self.minColorValue);
                            var max = parseFloat($maxInput.val());
                            if(max && !isNaN(max)) {
                                if(max<0) max=0;
                                self.maxColorValue = max; }
                            $maxInput.val(self.maxColorValue);
                            self.redrawTable();
                        })
                    ));
            $containerDiv.append($rangeController);
        },

        redrawTable: function() {
            var self = this;
            var pref = self.pref;
            self.$tableDiv.empty();
            var $tableConditions = $('<table id="' + pref + 'conditions-table" \
                class="table table-bordered table-striped" style="width: 100%; margin-left: 0px; margin-right: 0px;">\
                </table>')
                .appendTo(self.$tableDiv)
                .dataTable( {
                    "sDom": 'lftip',
                    "iDisplayLength": 10,
                    "scrollX": true,
                    "aaData": self.buildConditionsTableData(),                  
                    "aoColumns": [
                        { sTitle: "Condition ID", mData:"id"},
                        { sTitle: "Min", mData:"min"},
                        { sTitle: "Max", mData:"max"},
                        { sTitle: "Avgerage", mData:"avg"},                            
                        { sTitle: "Std. Dev.", mData:"std"},
                        { sTitle: "Expression Values", mData: "values",
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

        minColorValue:null,
        maxColorValue:null,

        getColor: function(value){
            var min = this.minColorValue;
            var max = this.maxColorValue;

            //TODO needs to be imporved
            var r = 0;
            var g = 255;
            var b = 0;

            if(value >= 0){
                b = 255;
                r = ((max - value)/max*255).toFixed(0);
            }
            if(value > this.maxColorValue){
                b = 255;
                r = 0;
            }

            if(value < 0){
                b = ((Math.abs(min) + value)/Math.abs(min)*255).toFixed(0);
                r = 255;
            }
            if(value < this.minColorValue){
                b = 0;
                r = 255;
            }

            return 'rgb('+r+','+g+','+b+')';
        }
    });
});