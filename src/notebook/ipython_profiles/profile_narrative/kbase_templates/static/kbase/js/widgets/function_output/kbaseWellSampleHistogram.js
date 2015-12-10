

define(['jquery', 
        'plotly',        
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap'
        ], function($, Plotly) {
    $.KBWidget({
        name: 'kbaseWellSampleHistogram',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            workspaceID: null,

            wellSampleMatrixID: null,
            wellIds: [],

            // Service URL: should be in window.kbconfig.urls.
            workspaceURL: window.kbconfig.urls.workspace,
            loadingImage: "static/kbase/images/ajax-loader.gif"
        },

        // Prefix for all div ids
        pref: null,

        // KBaseFeatureValue client
        wsClient: null,

        // Matrix set stat
        wellSampleMatrix: null,

        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            // Create a message pane
            this.$messagePane = $("<div/>").addClass("kbwidget-message-pane kbwidget-hide-message");
            this.$elem.append(this.$messagePane);       

            return this;
        },

        loggedInCallback: function(event, auth) {

           // Build a client
            this.wsClient = new Workspace(this.options.workspaceURL, auth);

            // Let's go...
            this.loadAndRender();           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.isLoggedIn = false;
            return this;
        },

        setTestParameters: function(){
            // this.options.workspaceID = '645';
            // this.options.wellSampleMatrixID = '9';
            // this.options.geneIds = "VNG0001H,VNG0002G,VNG0003C,VNG0006G,VNG0013C,VNG0014C,VNG0361C,VNG0518H,VNG0868H,VNG0289H,VNG0852C";
        },


        loadAndRender: function(){
            var self = this;
            self.loading(true);

            // self.setTestParameters();
            var ref = self.buildObjectIdentity(this.options.workspaceID, this.options.wellSampleMatrixID);
            self.wsClient.get_objects([ref], 
                function(data) {

                    self.wellSampleMatrix = data[0].data;
                    console.log("wellSampleMatrix",self.wellSampleMatrix);
                    self.loading(false);
                    self.render();
                },
                function(error){
                    self.clientError(error);
                }
            );
        },

        render: function(){

            // var $overviewContainer = $("<div/>");
            // this.$elem.append( $overviewContainer );
            // this.buildOverviewDiv( $overviewContainer );

            // // Separator
            // this.$elem.append( $('<div style="margin-top:1em"></div>') );

            var $vizContainer = $("<div/>");
            this.$elem.append( $vizContainer );
            this.buildWidget( $vizContainer );            
        },

        buildOverviewDiv: function($containerDiv){
            var self = this;
            var pref = this.pref;

            var $overviewSwitch = $("<a/>").html('[Selected genes]');
            $containerDiv.append($overviewSwitch);

            $overviewSwitch.click(function(){
                $overvewContainer.toggle();
            });
        },
      
        // buildGenesTableData: function(){
        //     var submatrixStat = this.submatrixStat;
        //     var tableData = [];
        //     var stat = submatrixStat.row_set_stats;
        //     for(var i = 0; i < submatrixStat.row_descriptors.length; i++){
        //         var desc = submatrixStat.row_descriptors[i];

        //         var gene_function = desc.properties['function'];
        //         tableData.push(
        //             {
        //                 'index': desc.index,
        //                 'id': desc.id,
        //                 'name': desc.name,
        //                 'function' : gene_function,
        //                 'min': stat.mins[i] === null? ' ' : stat.mins[i].toFixed(2),
        //                 'max': stat.maxs[i] === null? ' ' : stat.maxs[i].toFixed(2),
        //                 'avg': stat.avgs[i] === null? ' ' : stat.avgs[i].toFixed(2),
        //                 'std': stat.stds[i] === null? ' ' : stat.stds[i].toFixed(2),
        //                 'missing_values': stat.missing_values[i]
        //             }
        //         );
        //     }
        //     return tableData;
        // },

        // To be overriden
        buildWidget: function($containerDiv){
            var data = this.wellSampleMatrix.data;
            var row_metadata = this.wellSampleMatrix.metadata.row_metadata;
            var column_metadata = this.wellSampleMatrix.metadata.column_metadata;
            
            
            // Find rows
            var rowIndeces = [];
            for(var wIndex in this.options.wellIds){
                var wellId = this.options.wellIds[wIndex];
                for(var rIndex in data.row_ids){
                    var found = false;
                    var rowId = data.row_ids[rIndex];
                    var rm = row_metadata[rowId];
                    for(var rmIndex in rm){
                        var propValue = rm[rmIndex];
                        if( propValue.entity == 'Sample' && propValue.property_name == 'Well' ){
//                            console.log(propValue.property_value);
                            if(wellId == propValue.property_value){
                                rowIndeces.push(rIndex);
                                found = true;
                                break;
                            }
                        }
                    }
                    if(found){
                        break;
                    }
                }
            }
            
            
            for(var i in rowIndeces){
                console.log(row_metadata[ data.row_ids[rowIndeces[i]] ]);
            }
            console.log('rowIndeces', rowIndeces);
            
            
            var traces = [];
            for(var i in rowIndeces){
                traces.push({
                  x: [], 
                  y: [], 
                  name: this.options.wellIds[i], 
                  type: 'bar'                
                });
            }
            
            var columns = [];
            for(var cIndex in data.col_ids){
                var cm = column_metadata[data.col_ids[cIndex]];
                
                var averageColumn = false;
                var substance = "";
                
                for(var pvIndex in cm){
                    var pv = cm[pvIndex];
                    if(pv.entity == 'Measurement' && pv.property_name == 'Substance'){
                        substance = pv.property_value;
                    } 
                    if(pv.entity == 'Measurement' && pv.property_name == 'ValueType' && pv.property_value == 'Average'){
                        averageColumn = true;
                    } 
                }
                
                if(!averageColumn) continue;
                columns.push({cIndex: cIndex, substance: substance});
            }
            columns.sort(function(a, b) { return a.substance > b.substance ? 1 : -1});
            
            
            
            
            for(var ci in columns){
                var column = columns[ci];
                
                for(var i in rowIndeces){
                    var rIndex = rowIndeces[i];
                    traces[i].x.push(column.substance);
                    traces[i].y.push(data.values[rIndex][column.cIndex]);
                }
            }
            
            var layout = {
                barmode: 'group',
                title: this.wellSampleMatrix.description,
                "yaxis": {
                    type: 'log',
                    autorange: true
                }                  
            };
            Plotly.newPlot($containerDiv[0], traces, layout, {showLink: false});            
        },

        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<th />").css('width','20%').append(name))
                       .append($("<td />").append(value));
            return $row;
        },
        
        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + this.options.loadingImage + "'/>");
            else
                this.hideMessage();                
        },

        showMessage: function(message) {
            var span = $("<span/>").append(message);

            this.$messagePane.append(span);
            this.$messagePane.show();
        },

        hideMessage: function() {
            this.$messagePane.hide();
            this.$messagePane.empty();
        },

        clientError: function(error){
            this.loading(false);
            this.showMessage(error.error.error);
        },            

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },

        buildObjectIdentity: function(workspaceID, objectID, objectVer, wsRef) {
            var obj = {};
            if (wsRef) {
                obj['ref'] = wsRef;
            } else {
                if (/^\d+$/.exec(workspaceID))
                    obj['wsid'] = workspaceID;
                else
                    obj['workspace'] = workspaceID;

                // same for the id
                if (/^\d+$/.exec(objectID))
                    obj['objid'] = objectID;
                else
                    obj['name'] = objectID;
                
                if (objectVer)
                    obj['ver'] = objectVer;
            }
            return obj;
        }

    });
});