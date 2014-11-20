/**
 * Input widget for import genomes into workspace.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @author Bill Riehl <wjriehl@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "GenomeImportWidget",
        parent: "kbaseNarrativeMethodInput",
        version: "1.0.0",
        options: {
        },

        tabPane: null,
        tabs: null,
        tabParamToSpec: null,
        paramIdToTab: null,
        
        init: function(options) {
            this._super(options);
            // render and refresh are done in super-class.
            return this;
        },

        addParameterDiv: function(paramPos, paramSpec, $stepDiv, $optionsDiv, $advancedOptionsDiv, isAdvanced) {
        	if (paramSpec.id === 'gbkFile') {
        		this.putInTab(paramSpec, $stepDiv, $optionsDiv, "Upload GBK file");
        	} else if (paramSpec.id === 'ftpFolder') {
        		this.putInTab(paramSpec, $stepDiv, $optionsDiv, "Import from FTP");
        	} else {
            	this._superMethod('addParameterDiv', paramPos, paramSpec, $stepDiv, $optionsDiv, $advancedOptionsDiv, isAdvanced);
        	}
        },
        
        putInTab: function(paramSpec, $stepDiv, $optionsDiv, tabName) {
            if ($optionsDiv.children().length == 0)
                $stepDiv.css({"margin-top":"5px"});
            if (this.tabPane == null) {
            	this.tabPane = $('<div/>');
    			$optionsDiv.append(this.tabPane);
    			this.tabPane.kbaseTabs({canDelete : true, tabs : []});
    			this.tabs = {};
    			this.tabParamToSpec = {};
    			this.paramIdToTab = {};
    			this.getTab("Existing data");
            }
            var tab = this.getTab(tabName);
            tab.append($stepDiv);
            this.tabParamToSpec[tabName][paramSpec.id] = paramSpec;
            this.paramIdToTab[paramSpec.id] = tabName;
        },
        
        getTab: function(tabName) {
            var tab = this.tabs[tabName];
            if (!tab) {
            	tab = $('<div/>');
            	var tabCount = 0;
            	for (var key in this.tabs)
            		tabCount++;
            	this.tabPane.kbaseTabs('addTab', {tab: tabName, content: tab, canDelete : false, show: (tabCount == 0)});
            	this.tabs[tabName] = tab;
            	this.tabParamToSpec[tabName] = {};
            }
            return tab;
        },
        
        getState: function() {
            var state = this._superMethod('getState');
            var selectedParameterTabName = this.getSelectedTab();
            state['selectedParameterTabName'] = selectedParameterTabName;
            console.log(state);
            return state;
        },
        
        getSelectedTab: function() {
            var selectedParameterTabName = null;
            for (var tabName in this.tabs) {
            	var tab = this.tabs[tabName];
            	if (tab.is(':visible'))
            		selectedParameterTabName = tabName;
            }
            return selectedParameterTabName;
        },
        
        loadState: function(state) {
            if (!state)
                return;
            this._superMethod('loadState', state);
            var selectedParameterTabName = state['selectedParameterTabName'];
            if (selectedParameterTabName)
				this.tabPane.kbaseTabs('showTab', selectedParameterTabName);
        },
        
        isValid: function() {
            var isValidRet = { isValid:true, errormssgs: [] };
            var selectedParameterTabName = this.getSelectedTab();
            if (this.parameters) {
                for (var i=0; i<this.parameters.length; i++) {
                	var paramId = this.parameters[i].id;
                    var tabName = this.paramIdToTab[paramId];
                    if (tabName && tabName === selectedParameterTabName) {
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
        }
    });

})( jQuery );