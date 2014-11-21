/**
 * Input widget for import genomes into workspace.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseTabbedInput",
        parent: "kbaseNarrativeMethodInput",
        version: "1.0.0",
        options: {
        },

        tabParamId: null,		// string
        tabParamPos: null,		// int
        tabPane: null,			// div jquery element
        tabPaneWasAdded: false,
        tabs: null,				// mapping {tabId -> div}
        tabNames: null,			// mapping {tabId -> tabName}
        tabParamToSpec: null,	// mapping {tabId -> {paramId -> paramSpec}}
        paramIdToTab: null,		// mapping {paramId -> tabId}
        
        init: function(options) {
            this._super(options);
            // render and refresh are done in super-class.
            return this;
        },

        render: function() {
            // figure out all types from the method
            var self = this;
            var method = this.options.method;
            var params = method.parameters;
            for (var i=0; i<params.length; i++) {
                var paramSpec = params[i];
                // check what kind of parameter here.
                if (paramSpec.field_type === "tab") {
                	self.tabNames = paramSpec.radio_options.ids_to_options;
                	self.tabParamId = paramSpec.id;
                	self.tabParamPos = i;
                	self.tabPane = $('<div/>');
                	self.tabPane.kbaseTabs({canDelete : true, tabs : []});
                	self.tabs = {};
                	self.tabParamToSpec = {};
                	self.paramIdToTab = {};
                	var tabCount = 0;
                	for (var tabId in self.tabNames) {
                		var tabName = self.tabNames[tabId];
                    	tab = $('<div/>');
                    	var isShown = tabCount == 0;
                    	self.tabPane.kbaseTabs('addTab', {tab: tabName, content: tab, canDelete : false, show: isShown});
                		tabCount++;
                    	self.tabs[tabId] = tab;
                    	self.tabParamToSpec[tabId] = {};
                	}
                	var paramIdToTabJson = paramSpec.default_values[0];
                	paramIdToTabJson = $('<div/>').html(paramIdToTabJson).text();
                	self.paramIdToTab = JSON.parse(paramIdToTabJson);
                }
            }
            self._superMethod('render');
        },
        
        addParameterDiv: function(paramPos, paramSpec, $stepDiv, $optionsDiv, $advancedOptionsDiv, isAdvanced) {
        	var tabId = this.paramIdToTab[paramSpec.id];
        	if (tabId) {
        		this.putInTab(paramSpec, $stepDiv, $optionsDiv, tabId);
        	} else {
            	this._superMethod('addParameterDiv', paramPos, paramSpec, $stepDiv, $optionsDiv, $advancedOptionsDiv, isAdvanced);
        	}
        },
        
        putInTab: function(paramSpec, $stepDiv, $optionsDiv, tabId) {
            if ($optionsDiv.children().length == 0)
                $stepDiv.css({"margin-top":"5px"});
            if (!this.tabPaneWasAdded) {
            	$optionsDiv.append(this.tabPane);
            	this.tabPaneWasAdded = true;
            }
            var tab = this.tabs[tabId];
            if (tab.children().length == 0)
            	tab.css({"margin-top":"5px"});
            tab.append($stepDiv);
            this.tabParamToSpec[tabId][paramSpec.id] = paramSpec;
        },
        
        getParameters: function() {
        	var ret = [];
            var selectedParameterTab = this.getSelectedTabId();
            for(var i=0; i<this.parameters.length; i++) {
            	var paramId = this.parameters[i].id;
                var tabId = this.paramIdToTab[paramId];
            	var value = ((!tabId) || tabId === selectedParameterTab) ? 
            			this.parameters[i].widget.getParameterValue() : "";
            	ret.push(value);
            }
        	ret.splice(this.tabParamPos, 0, this.getSelectedTabId());
        	return ret;
        },
        
        getState: function() {
            var state = this._superMethod('getState');
            var selectedParameterTab = this.getSelectedTabId();
            state['selectedParameterTab'] = selectedParameterTab;
            return state;
        },
        
        getSelectedTabId: function() {
            var ret = null;
            for (var tabId in this.tabs) {
            	var tab = this.tabs[tabId];
            	if (tab.is(':visible'))
            		ret = tabId;
            }
            return ret;
        },
        
        loadState: function(state) {
            if (!state)
                return;
            this._superMethod('loadState', state);
            var selectedParameterTab = state['selectedParameterTab'];
            if (selectedParameterTab) {
            	this.tabPane.kbaseTabs('showTab', this.tabNames[selectedParameterTab]);
            }
        },
        
        isValid: function() {
            var isValidRet = { isValid:true, errormssgs: [] };
            var selectedParameterTab = this.getSelectedTabId();
            if (this.parameters) {
                for (var i=0; i<this.parameters.length; i++) {
                	var paramId = this.parameters[i].id;
                    var tabId = this.paramIdToTab[paramId];
                    if ((!tabId) || tabId === selectedParameterTab) {
                    	var parameterStatus = this.parameters[i].widget.isValid();
                    	if (!parameterStatus.isValid) {
                    		isValidRet.isValid = false;
                    		for(var e = 0; e<parameterStatus.errormssgs.length; e++) {
                    			isValidRet.errormssgs.push(parameterStatus.errormssgs[e]);
                    		}
                    	}
                    }
                }
            }
            return isValidRet; 
        },
        
        getAllParameterValues: function() {
        	var ret = this._superMethod('getAllParameterValues');
        	ret.splice(this.tabParamPos, 0, {id:this.tabParamId, value:this.getSelectedTabId()});
        	return ret;
        }
    });

})( jQuery );