/**
 * @author Pavel Novickov <psnovichkov@lbl.gov>
 * @public
 */
define(['jquery', 'kbaseNarrativeParameterCustomTextSubdataInput'],
    function( $ ) {
    $.KBWidget({
        name: "kbaseWellSample2DPlotInput",
        parent: "kbaseNarrativeMethodInput",
        
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            isInSidePanel: false
        },
        
        
        inRefreshState: false,
        columnMetadata: {},        
        substanceParams: [],        
        STATE_NONE: 0,
        STATE_FETCHING: 1,
        STATE_READY: 2,
        state: 0,
        ws : null,
        initWsClient: function() {
            var self = this;
            console.log('initWsClient.self', self);
            
            if(this.authToken){
                this.ws = new Workspace(window.kbconfig.urls.workspace, {token: this.authToken()});
            } else {
                error('not properly initialized - no auth token found')
            }
        },
        
        
        
        /**
         * Builds the input div for a function cell, based on the given method object.
         * @param {Object} method - the method being constructed around.
         * @returns {String} an HTML string describing the available parameters for the cell.
         * @private
         */
        
        render: function(){
            var self = this;
            self.initWsClient();
            
            this.parameters = [];
            this.parameterIdLookup = {};
            var $inputParameterContainer = $('<div>');
            var $optionsDiv = $('<div>');
            
            var method = this.options.method;
            var params = method.parameters;
                        
            this.addParameterDiv(params[0], "kbaseNarrativeParameterTextInput", $optionsDiv);
            this.addParameterDiv(params[1], "kbaseNarrativeParameterCustomTextSubdataInput", $optionsDiv, self);
            this.addParameterDiv(params[2], "kbaseNarrativeParameterCustomTextSubdataInput", $optionsDiv, self);
            
            
            self.parameterIdLookup['input_well_sample_matrix'].addInputListener(function(){
                if(!self.inRefreshState){
                    self.state = self.STATE_NONE;
                    self.parameterIdLookup['input_substance_x'].setParameterValue('');
                    self.parameterIdLookup['input_substance_y'].setParameterValue('');
                }
            });            
            
            $inputParameterContainer.append($optionsDiv);
            this.$elem.append($inputParameterContainer);
            this.$elem.css({"margin-bottom":"5px"});     
        },
                
        addParameterDiv: function(paramSpec, widgetName, $optionsDiv, $dataModel){
            var self = this;
            var $stepDiv = $('<div>');
            var $widget = $stepDiv[widgetName](
                {
                    loadingImage: self.options.loadingImage, 
                    parsedParameterSpec: paramSpec, 
                    isInSidePanel: self.options.isInSidePanel,
                    dataModel: $dataModel
                });
            this.parameters.push({id:paramSpec.id, widget:$widget});
            this.parameterIdLookup[paramSpec.id] = $widget;
    
            if ($optionsDiv.children().length == 0)
                $stepDiv.css({"margin-top":"5px"});
            $optionsDiv.append($stepDiv);
        },
                        
        fetchData: function(doneCallback){
            var self = this;
            console.log('fetchData.self', self);
            if(self.state == self.STATE_NONE){
                $(document).trigger('workspaceQuery.Narrative', 
                    function(ws_name) {
                        var matrixId = self.getParameterValue( 'input_well_sample_matrix' );
                        if(!matrixId) return;
                    
                        var query = [];
                        query.push( {ref:ws_name+'/'+matrixId, included: ["metadata/column_metadata"]} );


                        self.state = self.STATE_FETCHING;                    
                        self.ws.get_object_subset(query,
                            function(result) {
                                self.columnMetadata = result[0].data.metadata.column_metadata;
                                var substances = {};
                                for(var i in self.columnMetadata){
                                    var cm = self.columnMetadata[i];
                                    var averageColumn = false;
                                    var substance = "";
                                    
                                    for(var j in cm){
                                        var propValue = cm[j];
                                        if( propValue.entity == 'Measurement' && propValue.property_name == 'Substance' ){
                                            substance = propValue.property_value;
                                        }
                                        if(propValue.entity == 'Measurement' && propValue.property_name == 'ValueType' && propValue.property_value == 'Average'){
                                            averageColumn = true;
                                        } 
                                    }
                                    if(!averageColumn) continue;
                                    substances[substance] = substance;
                                }

                                self.substanceParams = [];
                                for(var substance in substances){
                                    self.substanceParams.push({id: substance, text: substance});
                                }
                                self.substanceParams.sort(function(a, b) { return a.text > b.text ? 1 : -1});

                                self.state = self.STATE_READY;
                                if(doneCallback) { doneCallback(self.substanceParams); }
                            },
                            function(error) {
                                console.error(error);
                            }
                        );                        
                    }
                );
            } else if(self.state == self.STATE_READY){
                if(doneCallback) { doneCallback(self.substanceParams); }
            }           
        },  
        refresh: function() {
            this.inRefreshState = true;
            if (this.parameters) {
                for(var i=0; i<this.parameters.length; i++) {
                    this.parameters[i].widget.refresh();
                }
            }
            this.inRefreshState = false;
        }        
        
    });
});