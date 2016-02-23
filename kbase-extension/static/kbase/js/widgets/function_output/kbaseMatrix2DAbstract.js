

define([
        'jquery',
        'narrativeConfig',    
        'kbwidget', 
        'kbaseAuthenticatedWidget', 
        'kbaseTabs',
        'jquery-dataTables',
        'jquery-dataTables-bootstrap' 
        ], 
    function( $, Config ) {
    
    var workspaceURL = Config.url('workspace');
    var loadingImage = Config.get('loading_gif');
    $.KBWidget({
        name: 'kbaseMatrix2DAbstract',
        parent: 'kbaseAuthenticatedWidget',
        version: '1.0.0',
        options: {
            workspaceID: null,
            matrixID: null,               
        },
        

        // Prefix for all div ids
        pref: null,
        
        // KBaseFeatureValue client
        wsClient: null,

        // Matrix 
        matrix: null,
                
        init: function(options) {
            this._super(options);
            this.pref = this.uuid();

            // Create a message pane
            this.$messagePane = $("<div/>")
                .addClass("kbwidget-message-pane kbwidget-hide-message")
                .appendTo(this.$elem);

            return this;
        },

        loggedInCallback: function(event, auth) {
            
           // Build a client
            this.wsClient = new Workspace(workspaceURL, auth);

            // Let's go...
            this.loadAndRender();           
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.isLoggedIn = false;
            return this;
        },

        loadAndRender: function(){
            var self = this;
            self.loading(true);

//            self.setTestParameters();
            var ref = self.buildObjectIdentity(this.options.workspaceID, this.options.matrixID);
            self.wsClient.get_objects([ref], 
                function(data) {
                    self.matrix = data[0].data;
                    self.render();
                },
                function(error){
                    self.clientError(error);
//                    self.clientError('Can not load the matrix');
                }
            );
        },
        
        // To be overriden
        render: function(){
            this.loading(false);
        },
        
        ////////////////// Matrix2D API /////////////////////////////////////////////
        
                
        /*
        * Checks whether the column or row metadata (array of PropertyValue) has a given PropertyValue defined by
        * category, propertyName, propertyUnit and propertyValue
        *
        * @return:
            boolean
        */
        hasProperty: function(properties, category, propertyName, propertyUnit, propertyValue){
            for(var i in properties){
                var pv = properties[i];
                if(pv.category != category) continue;
                if(pv.property_name != propertyName) continue;
                if(pv.property_unit != propertyUnit) continue;
                if(pv.property_value != propertyValue) continue;
                return true;
            }
            return false;
        },

        /*
        * Checks the column or row metadata (array of PropertyValue) and returns a list of all PropertyValues that 
        * have a given category
        *
        * @return:
            [PropertyValue]
        */        
        getProperties: function(properties, category){
            var selectedProperties = [];
            for(var i in properties){
                var pv = properties[i];
                if(pv.category != category) continue;
                selectedProperties.push(pv);
            }
            return selectedProperties;            
        },
        
        /*
        * Checks the column or row metadata (array of PropertyValue) and returns the first PropertyValue
        * that has a given category and propertyName. If not found, returns null
        *
        * @return:
            PropertyValue
        */          
        getProperty: function(properties, category, propertyName){
            for(var i in properties){
                var pv = properties[i];
                if(pv.category != category) continue;
                if(pv.property_name != propertyName) continue;
                return pv;
            }
            return null;            
        },
        
        /*
        * Checks the column or row metadata (array of PropertyValue) and returns the property_value
        * of the first PropertyValue that has a given category and propertyName. If not found, returns null
        *
        * @return:
            scalar - property_value
        */          
        getPropertyValue: function(properties, category, propertyName){
            for(var i in properties){
                var pv = properties[i];
                if(pv.category != category) continue;
                if(pv.property_name != propertyName) continue;
                return pv.property_value;
            }
            return null;            
        },
        
        /*
        * Checks the metadatas of all columns or rows (crsMetadata) and returns a list of property_values
        * constrained by a given category and propertyName. 
        *
        * @return:
            [scalar] - list of property_value
        */           
        getPropertyValues: function(crsMetadata, category, propertyName){
            var values = [];
            for(var id in crsMetadata){
                var properties = crsMetadata[id];
                var val = this.getPropertyValue(properties, category, propertyName);
                if(val != null){
                    values.push(val);
                }
            }
            return values;
        },
        
        /*
        * The method will group columns or rows ("crow") metadata by the value of a property defined by 
        * by the provided category and propertyName
        * 
        * @return:
        {
            seriesId : 
            [
                {
                    "id": id of row or column,
                    "index": index of row or column in the matrix.data
                    "properties": metadata for a row or column - array of PropertyValue 
                }
            ]
        }
        */
        groupCrowsByPropertyValue: function(crowsIds, crowsMetadata, category, propertyName){
            var groupId2CrowsMetadata = {};
            for(var crowIndex in crowsIds){
                var crowId = crowsIds[crowIndex];
                var crowMetadata = crowsMetadata[crowId];
                var groupValue = this.getPropertyValue(crowMetadata, category, propertyName);
                if( groupValue != null){
                    var crowList = groupId2CrowsMetadata[groupValue];
                    if( crowList == null){
                        crowList = [];
                        groupId2CrowsMetadata[groupValue] = crowList;
                    }
                    crowList.push({
                        id: crowId,
                        index: crowIndex,
                        properties: crowMetadata
                    });
                }
            }
            return groupId2CrowsMetadata;
        },
        
        /*
        * Iterates over all columns or rows defined by "crowsIds" (ids of columns or rows). 
        * For each crow (column or row) it searches for the first PropertyValue that belongs to 
        * the given category and propertyName, extracts property_name and converts it to float.  
        * The property_value together with crowIndex and crowId defines the Point in the corse.
        * All points are sorted by property_value. Later, indeces can be used to access matrix.data.values.
        * Id can be used to access column or row metadata.
        * 
        * The method can be used to build time points using {categor:'TimeSeries', propertyName: 'Time'} input parameters.
        * 
        * !IMPORTANT! propertyName can be null. In this case the first PropertyValue that belings to a given
        * category defines the propertyName.
        *
        * @return:
        
            [
                {
                    "value": property value of a column or row metadata defined by category & propertyName,
                    "index": column or row index as it is defined in the matrix.data.col_ids or matrix.data.row_ids,
                    "id": column or row id as it is defined in the matrix.data.col_ids or matrix.data.row_ids
                }
            ]
            
        */                
        getNumericPropertyCourse: function(crowsIds, crowsMetadata, category, propertyName){
            var points = [];
            
            for(var crowIndex in crowsIds){
                var crowId = crowsIds[crowIndex];
                var crowMetadata = crowsMetadata[crowId];
                
                var value = null;
                for(var i in crowMetadata){
                    var pv = crowMetadata[i];
                    if(pv.category != category) continue;
                    if(propertyName != null && pv.property_name != propertyName) continue;
                    value = parseFloat(pv.property_value);
                    break;
                }
                if(value == null) continue; 
                points.push({
                    value: value,
                    index: crowIndex,
                    id: crowId
                });
            }
            
            points.sort(function (a, b) {
                return a.value > b.value ? 1 : ( a.value < b.value ? -1 : 0);
            });            
            return points;
        },            
            
            
        /*
        * The method iterates across all columns or rows metadata and calculates basic 
        * characteriscs of PropertyValues that belong to a given category and propertyName
        * It calculated the min and max values of property_value, identifies the value unit, 
        * and calcualtes the number of such PropertyValues
        *
        * !IMPORTANT! propertyName can be null. In this case the first PropertyValue that belings to a given
        * category defines the propertyName.
        *
        * @return:
        
        {
            "propertyName": the property name that was analyzed,
            "valueMin": the min value of property_value,
            "valueMax": the max value of property_value,
            "valueUnit": the unit of the property_value,
            "pointsCount": the number of property_values
        }
            
        */          
        getNumericProperyStat: function(crowsMetadata, category, propertyName){
            var valueMin = null;
            var valueMax = null;
            var pointsCount = 0;
            var valueUnit = null;
            for(var crId in crowsMetadata){
                var crMetadata = crowsMetadata[crId];
                var value = null;
                for(var i in crMetadata){
                    var pv = crMetadata[i];
                    if(pv.category != category) { 
                        continue;
                    }
                    if(propertyName != null && pv.property_name != propertyName) continue;
                    
                    // If property name is not defined as an input parameter, 
                    // than we will identify automaticlly by taking the frist one from the given category
                    propertyName = pv.property_name;
                    
                    value = parseFloat(pv.property_value);
                    valueUnit = pv.property_unit;
                    break;
                }
                if(value == null){
                    // this should be error
                    continue;
                }
                pointsCount ++;
                if(valueMin == null || value < valueMin){
                    valueMin = value;
                }
                if(valueMax == null || value > valueMax){
                    valueMax = value;
                }
            }
            return { 
                        propertyName: propertyName,
                        valueMin : valueMin,
                        valueMax : valueMax,
                        valueUnit: valueUnit,
                        pointsCount: pointsCount
                   };            
            
        },        
        
        
        /*
        * Creates a lookup table to convert columnId into column index. Colummn index is needed for fast access of 
        * of values stored in the matrix.data.values
        *
        * @return
        
            {
                id: index,
                id: index,
                ...
            }
        
        */
        buildColumnIds2ColumnIndex: function(matrix){
            var columnIds2ColumnIndex = {};
            var columnIds = matrix.data.col_ids;
            for(var columnIndex in columnIds){
                columnIds2ColumnIndex[ columnIds[columnIndex] ] = columnIndex;
            }
            return columnIds2ColumnIndex;
        },        
        
        /*
        * This is toString method for PropertyValues
        *
        * @return
            string
        */
        propertiesToString: function(properties){
            var str = "";
            for(var i in properties){
                var pv  = properties[i];
                if(str){
                    str += "; ";
                }
                str += this.propertyValueToString(pv);
            }
            return str;            
        },
        
        /*
        * This is toString method for PropertyValue
        *
        * @return
            string
        */        
        propertyValueToString: function(pv){
//            return pv.property_name 
//                    + ": " + pv.property_value 
//                    +  (pv.property_unit ? " " + pv.property_unit : "");
            return pv.property_name 
                    + ": " + pv.property_value 
                    +  (pv.property_unit ? "" + pv.property_unit : "");
        },
        
        ////////////////// WIDGETS /////////////////////////////////////////////
        
        buildTable: function($container, data, columns, emptyTableMessage){
            var pref = self.pref;
            
            var iDisplayLength = 10;
            var style = 'lftip';
            if(data.length <= iDisplayLength) { style = 'fti'; }

            var table = $('<table>')
                .attr('id', pref+'conditions-table')
                .addClass('table table-bordered table-striped')
                .css('width', '100%')
                .css('margin-left', '0px')
                .css('margin-right', '0px')
                .appendTo($container)
                .dataTable( {
                    "sDom": style,
                    "iDisplayLength": iDisplayLength,
                    "aaData": data,
                    "aoColumns": columns,
                    "oLanguage": {
                                "sEmptyTable": emptyTableMessage,
                                "sSearch": "Search: "
                    }                    
                } );              
            
        },    
        
        buildMatrixOverview: function($container){
            var pref = self.pref;
            
            
            var $tableOverview = $('<table>')
                .attr('id',pref+'overview-table')
                .addClass('table table-striped table-bordered')
                .css('width','100%')
                .css('margin-left','0px')
                .css('margin-right','0px')
                .appendTo($container);            
                                
            for(var i in this.matrix.metadata.matrix_metadata){
                var md = this.matrix.metadata.matrix_metadata[i];
                
                var label = md.category;
                if( md.property_name != undefined && md.property_name != ''){
                    label += "." + md.property_name;
                }
                
                $tableOverview.append( this.makeRow( 
                    label, 
                    md.property_value + (md.property_unit ? md.property_unit : "" ) ) );                
            }            
        },           
  
        makeRow: function(name, value) {
            var $row = $("<tr/>")
                       .append($("<th />").css('width','20%').append(name))
                       .append($("<td />").append(value));
            return $row;
        },
        
        loading: function(isLoading) {
            if (isLoading)
                this.showMessage("<img src='" + loadingImage + "'/>");
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

