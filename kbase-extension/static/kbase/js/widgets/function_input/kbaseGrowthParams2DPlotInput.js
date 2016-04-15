/**
 * @author Pavel Novickov <psnovichkov@lbl.gov>
 * @public
 */
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'kbaseNarrativeParameterCustomTextSubdataInput',
		'kbaseNarrativeParameterCustomButtonInput',
		'kbaseNarrativeParameterCustomDropdownGroupInput'
	], function(
		KBWidget,
		bootstrap,
		$,
		kbaseNarrativeParameterCustomTextSubdataInput,
		kbaseNarrativeParameterCustomButtonInput,
		kbaseNarrativeParameterCustomDropdownGroupInput
	) {
    return KBWidget({
        name: "kbaseGrowthParams2DPlotInput",
        parent : kbaseNarrativeMethodInput,
        
        version: "1.0.0",
        options: {
            loadingImage: "../images/ajax-loader.gif",
            isInSidePanel: false
        },        
        
        inRefreshState: false,
        columnMetadata: {},        
        conditionParams: [],        
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
            this.addParameterDiv(params[1], "kbaseNarrativeParameterDropdownInput", $optionsDiv);
            this.addParameterDiv(params[2], "kbaseNarrativeParameterCustomTextSubdataInput", $optionsDiv, self);
            this.addParameterDiv(params[3], "kbaseNarrativeParameterCustomTextSubdataInput", $optionsDiv, self);
            this.addParameterDiv(params[4], "kbaseNarrativeParameterCustomButtonInput", $optionsDiv, self);
            this.addParameterDiv(params[5], "kbaseNarrativeParameterCustomDropdownGroupInput", $optionsDiv, self);
            
            
            self.parameterIdLookup['input_growth_matrix'].addInputListener(function(){
                if(!self.inRefreshState){
                    self.state = self.STATE_NONE;
                    self.parameterIdLookup['input_condition_param_x'].setParameterValue('');
                    self.parameterIdLookup['input_condition_param_y'].setParameterValue('');
                    self.parameterIdLookup['input_check_other_params'].setParameterValue(false);
                    self.parameterIdLookup['input_check_other_params'].deactivate();
                    self.parameterIdLookup['input_condition_filter'].reset();                
                }
            });
            
            self.parameterIdLookup['input_condition_param_x'].addInputListener(function(){
                self.parameterIdLookup['input_check_other_params'].setParameterValue(false);
                self.parameterIdLookup['input_check_other_params'].activate();
                self.parameterIdLookup['input_condition_filter'].reset();                
            });

            self.parameterIdLookup['input_condition_param_y'].addInputListener(function(){
                self.parameterIdLookup['input_check_other_params'].setParameterValue(false);
                self.parameterIdLookup['input_check_other_params'].activate();
                self.parameterIdLookup['input_condition_filter'].reset();                
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
        
        geMainParams: function(){
            var self = this;
            var mainParams = [];
            var paramX = self.parameterIdLookup['input_condition_param_x'].getParameterValue();
            if(paramX) {
                mainParams.push(paramX);
            }
            var paramY = self.parameterIdLookup['input_condition_param_y'].getParameterValue();
            if(paramY) {
                mainParams.push(paramY);
            }
                        
            return mainParams;
        },
        
        getAdditionalParams: function(){
            var self = this;
            var params = [];
            if(!self.columnMetadata) return params;
            
            var mainParams = self.geMainParams();
            if(mainParams.length == 0) return params;
            
            // Collect params
            var paramValues = {};
            for(var i in self.columnMetadata){
                var cMetadata = self.columnMetadata[i];
                
                
                // Check whether the column is a good (all main parameters are present)
                var goodColumn = true;
                
                for(var k in mainParams){
                    var mainParam = mainParams[k];
                    var paramFound = false;
                    for(var j in cMetadata){
                        var propValue = cMetadata[j];
                        if(propValue.entity != 'Condition') continue;
                        if(propValue.property_name == mainParam){
                            paramFound = true;
                            break;
                        }
                    }
                    if(!paramFound){
                        goodColumn = false;
                        break;
                    }
                }                                
                if(!goodColumn) continue;
                
                
                // Collect other params
               for(var j in cMetadata){
                    var propValue = cMetadata[j];
                    if(propValue.entity != 'Condition') continue;
                   
                    var isMainParam = false;
                    for(var k in mainParams){
                        if(mainParams[k] == propValue.property_name){
                            isMainParam = true;
                            break;
                        }                        
                    }
                   
                    if(isMainParam){
                        continue;
                    } else{
                        var name = propValue.property_name;
                        var value = propValue.property_value;
                        if(!paramValues[name]){
                            paramValues[name] = {};
                        }
                        paramValues[name][value] = value;
                    }                   
                } 
            }            
            
            // Build params
            for(var name in paramValues){
                var valueSet = paramValues[name];
                var values = [];
                for(var val in valueSet){
                    values.push(val);
                }
                params.push({name:name, values:values});
            }
                
            return params;
        },
        
        getDropdownSpecs: function(){
            var self = this;
            var specs = [];

            var params = self.getAdditionalParams(); 
            for(var i in params){
                var param = params[i];
                var spec = {
                    "id" : "input_param_filter_" + i,
                    ui_name: param.name,
                    short_hint: 'Parameter to be constrained',
                    description: 'Parameter to be constrained',
                    "optional" : false,
                    "advanced" : false,
                    "allow_multiple" : false,
                    "default_values" : [],
                    "field_type" : "dropdown",
                    "dropdown_options":{
                        "options": []
                    }
                };  
                var options = [];
                for(var j in param.values){
                    var value = param.values[j];
                    options.push({value:value, display:value});
                }
                spec.dropdown_options.options = options;
                spec.default_values.push(param.values[0]);
                specs.push(spec);                
            }
            
            return specs;            
        },
        
        onButtonClick: function(){
            this.parameterIdLookup['input_condition_filter'].show();
        },
                
        fetchData: function(doneCallback){
            var self = this;
            console.log('fetchData.self', self);
            if(self.state == self.STATE_NONE){
                $(document).trigger('workspaceQuery.Narrative', 
                    function(ws_name) {
                        var matrixId = self.getParameterValue( 'input_growth_matrix' );
                        if(!matrixId) return;
                    
                        var query = [];
                        query.push( {ref:ws_name+'/'+matrixId, included: ["metadata/column_metadata"]} );


                        self.state = self.STATE_FETCHING;                    
                        self.ws.get_object_subset(query,
                            function(result) {
                                self.columnMetadata = result[0].data.metadata.column_metadata;
                                var conditions = {};
                                for(var i in self.columnMetadata){
                                    var cm = self.columnMetadata[i];
                                    for(var j in cm){
                                        var propValue = cm[j];
                                        if(propValue.entity != 'Condition') continue;
                                        conditions[propValue.property_name] = propValue.property_name;
                                    }
                                }

                                self.conditionParams = [];
                                for(var i in conditions){
                                    var conditionParam = conditions[i];
                                    self.conditionParams.push({id: conditionParam, text: conditionParam});
                                }

                                self.state = self.STATE_READY;
                                if(doneCallback) { doneCallback(self.conditionParams); }
                            },
                            function(error) {
                                console.error(error);
                            }
                        );                        
                    }
                );
            } else if(self.state == self.STATE_READY){
                if(doneCallback) { doneCallback(self.conditionParams); }
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