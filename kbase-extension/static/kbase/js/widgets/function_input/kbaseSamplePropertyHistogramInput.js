/**
 * @author Pavel Novickov <psnovichkov@lbl.gov>
 * @public
 */
define(['jquery', 
        'narrativeConfig',
        'kbaseNarrativeMethodInput', 
        'kbaseNarrativeParameterCheckboxInput',
        'kbaseNarrativeParameterCustomTextSubdataInput'],
    function( $, Config ) {
    
    var workspaceUrl = Config.url('workspace');
    var loadingImage = Config.get('loading_gif');
    $.KBWidget({
        name: "kbaseSamplePropertyHistogramInput",
        parent: "kbaseNarrativeMethodInput",
        
        version: "1.0.0",
        options: {
            isInSidePanel: false
        },
        
        
        inRefreshState: false,
        rowMetadata: {},        
        wellIdParams: [],        
        STATE_NONE: 0,
        STATE_FETCHING: 1,
        STATE_READY: 2,
        state: 0,
        ws : null,
        initWsClient: function() {
            var self = this;

            if(this.authToken){
                this.ws = new Workspace(workspaceUrl, {token: this.authToken()});
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
            this.addParameterDiv(params[2], "kbaseNarrativeParameterCheckboxInput", $optionsDiv);
            this.addParameterDiv(params[3], "kbaseNarrativeParameterCheckboxInput", $optionsDiv);
            
            
            self.parameterIdLookup['input_sample_property_matrix'].addInputListener(function(){
                if(!self.inRefreshState){
                    self.state = self.STATE_NONE;
                    self.parameterIdLookup['input_samples'].setParameterValue('');
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
                    loadingImage: loadingImage, 
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
                        var matrixId = self.getParameterValue( 'input_sample_property_matrix' );
                        if(!matrixId) return;
                    
                        var query = [];
                        query.push( {ref:ws_name+'/'+matrixId, included: ["metadata/row_metadata"]} );


                        self.state = self.STATE_FETCHING;                    
                        self.ws.get_object_subset(query,
                            function(result) {
                                self.rowMetadata = result[0].data.metadata.row_metadata;
                                var wellIds = {};
                                for(var i in self.rowMetadata){
                                    var rm = self.rowMetadata[i];
                                    for(var j in rm){
                                        var propValue = rm[j];
                                        if( propValue.category == 'Sample' && propValue.property_name == 'Name' ){
                                            wellIds[propValue.property_value] = propValue.property_value;
                                        }
                                    }
                                }

                                self.wellIdParams = [];
                                for(var wellId in wellIds){
                                    self.wellIdParams.push({id: wellId, text: wellId});
                                }
                                self.wellIdParams.sort(function(a, b) { return a.text > b.text ? 1 : -1});

                                self.state = self.STATE_READY;
                                if(doneCallback) { doneCallback(self.wellIdParams); }
                            },
                            function(error) {
                                console.error(error);
                            }
                        );                        
                    }
                );
            } else if(self.state == self.STATE_READY){
                if(doneCallback) { doneCallback(self.wellIdParams); }
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