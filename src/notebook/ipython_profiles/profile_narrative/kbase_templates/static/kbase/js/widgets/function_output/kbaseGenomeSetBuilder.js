/**
 * @author Bill Riehl <wjriehl@lbl.gov>, Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */

(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseGenomeSetBuilder",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
        	wsName: null,
        	genomeSetName: null,
            loadingImage: "../images/ajax-loader.gif",
        },

        useSelect2: true,
        IGNORE_VERSION: true,
        pref: null,
        wsUrl: "http://dev04.berkeley.kbase.us:7058",
        genomeList: null,
        	
        init: function(options) {
            this._super(options);
            this.pref = this.genUUID();
            this.render();
            return this;
        },

        render: function() {
        	this.renderState({});
        },
        
        renderState: function(state) {
        	this.$elem.empty();
        	var cellStyle = "border:none; vertical-align:middle;";
            var inputDiv = "<div class='kb-cell-params'>" +
            		"Target genome set object name: " + this.options.genomeSetName + "<br>" +
            		"<table id='gnms" + this.pref + "' class='table'>" +
        			"<tr style='" + cellStyle + "'>" + 
            		"<td style='" + cellStyle + "'>Genome set description</td>" +
            		"<td style='" + cellStyle + " width: 50%;'>" +
            			"<input class='form-control' style='width: 85%' id='descr"+this.pref+"' name='descr' value='' type='text'/>" +
            		"</td>" +
            		"<td style='" + cellStyle + "'>Description of target genome set object.</td>" +
            		"</tr>" +
            		"</table>";
            inputDiv += "You can <button id='add"+this.pref+"'>Add</button> more genomes " +
            		"and finally <button id='save"+this.pref+"'>Save</button> genome set object." +
            		"</div>";
            this.$elem.append(inputDiv);
            var self = this;
            $('#add'+this.pref).click(function(e) {
            	self.addParam("");
            	self.refresh();
            });
            $('#save'+this.pref).click(function(e) {
            	self.saveIntoWs();
            });
            if (this.size(state) == 0) {
            	this.addParam("");
            } else {
            	for (var key in state)
            		if (state.hasOwnProperty(key) && key.indexOf("param") == 0)
            			this.addParam(state[key]);
            }
            if (state.hasOwnProperty("descr")) {
				$('#descr'+this.pref).val(state["descr"]);
            }
            this.refresh();
        },

        saveIntoWs: function() {
            var kbws = new Workspace(this.wsUrl, {'token': this.authToken()});
            var elems = {};
            var state = this.getState();
        	for (var key in state)
        		if (state.hasOwnProperty(key) && key.indexOf("param") == 0)
        			elems[key] = {ref: this.options.wsName + "/" + state[key]};
			var gset = {
					description: state['descr'],
					elements: elems
			};
			kbws.save_objects({workspace: this.options.wsName, objects: [{type: 'KBaseSearch.GenomeSet', 
				name: this.options.genomeSetName, data: gset}]}, function(data) {
					alert('Genome set object was stored in workspace');
				}, function(data) {
					alert('Error: ' + data.error.message);
				});
        },
        
        addParam: function(genomeObjectName) {
        	var paramPos = this.size(this.getState());
        	var pid = "param" + paramPos;
        	var cellStyle = "border:none; vertical-align:middle;";
        	$('#gnms'+this.pref).append("" +
        			"<tr style='" + cellStyle + "'>" + 
                		"<td style='" + cellStyle + "'>Genome " + (paramPos + 1) + "</td>" +
                		"<td style='" + cellStyle + " width: 50%;'>" +
                			"<input class='form-control' style='width: 85%' name='"+pid+"' " +
                					"value='"+genomeObjectName+"' type='text'/>" +
                		"</td>" +
                		"<td style='" + cellStyle + "'>Just leave it blank if you don't need it anymore.</td>" +
                	"</tr>");
        },
        
        size: function(obj) {
        	var size = 0;
        	for (var key in obj)
        		if (obj.hasOwnProperty(key) && key.indexOf("param") == 0) 
        			size++;
        	return size;
        },
        
        /**
         * Returns an object representing the state of this widget.
         * In this particular case, it is a list of key-value pairs, like this:
         * { 
         *   'param0' : 'parameter value',
         *   'param1' : 'parameter value'
         * }
         * with one key/value for each parameter in the defined method.
         */
        getState: function() {
            var state = {};

            $(this.$elem).find("[name^=param]").filter(":input").each(function(key, field) {
                state[field.name] = field.value;
            });

            $(this.$elem).find("[name^=descr]").filter(":input").each(function(key, field) {
                state[field.name] = field.value;
            });

            return state;
        },

        /**
         * Adjusts the current set of parameters based on the given state.
         * Doesn't really do a whole lot of type checking yet, but it's assumed that
         * a state will be loaded from an object generated by getState.
         */
        loadState: function(state) {
            if (!state)
                return;
            this.renderState(state);
        },

        /**
         * Refreshes the input fields for this widget. I.e. if any of them reference workspace
         * information, those fields get refreshed without altering any other inputs.
         */
        refresh: function() {
        	var type = "KBaseGenomes.Genome";
            var lookupTypes = [type];
            var size = this.size(this.getState());
            var self = this;
            if (this.genomeList && this.genomeList.length > 0) {
            	this.refreshInputs();
            } else {
            	this.trigger('dataLoadedQuery.Narrative', [lookupTypes, this.IGNORE_VERSION, $.proxy(
            			function(objects) {
            				// we know from each parameter what each input type is.
            				// we also know how many of each type there is.
            				// so, iterate over all parameters and fulfill cases as below.
            				var objList = [];
            				/*
            				 * New sorting - by date, then alphabetically within dates.
            				 */
            				if (objects[type] && objects[type].length > 0) {
            					objList = objects[type];
            					objList.sort(function(a, b) {
            						if (a[3] > b[3]) return -1;
            						if (a[3] < b[3]) return 1;
            						if (a[1] < b[1]) return -1;
            						if (a[1] > b[1]) return 1;
            						return 0;
            					});
            				}
            				self.genomeList = objList;
            				self.refreshInputs();
            			},
            			this
            	)]);
            }
        },

        refreshInputs: function() {
        	var type = "KBaseGenomes.Genome";
        	var lookupTypes = [type];
        	var size = this.size(this.getState());
        	var objList = this.genomeList;
        	for (var i=0; i<size; i++) {
        		var pid = 'param' + i;
        		var $input = $($(this.$elem).find("[name=" + pid + "]"));
        		var datalistID = $input.attr('list');
        		if (objList.length == 0 && datalistID) {
        			$(this.$elem.find("#" + datalistID)).remove();
        			$input.removeAttr('list');
        			$input.val("");
        		}
        		else if (objList.length > 0) {
        			var $datalist;
        			if (!datalistID) {
        				datalistID = this.genUUID();
        				$input.attr('list', datalistID);
        				$datalist = $('<datalist>')
        				.attr('id', datalistID);
        				$input.after($datalist);
        			}
        			else {
        				$datalist = $(this.$elem.find("#" + datalistID));
        			}
        			$datalist.empty();
        			for (var j=0; j<objList.length; j++) {
        				$datalist.append($('<option>')
        						.attr('value', objList[j][1])
        						.append(objList[j][1]));
        			}
        		}
        	}
        },

        genUUID: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                return v.toString(16);
            });
        }

    });

})( jQuery );