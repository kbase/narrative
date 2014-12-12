/**
 * "Import" tab on data side panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeSideImportTab",
        parent: "kbaseAuthenticatedWidget",
        version: "1.0.0",
        options: {
        },
        token: null,
        wsName: null,
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: "https://kbase.us/services/ws/",
        methodStoreURL: 'http://dev19.berkeley.kbase.us/narrative_method_store',
        methClient: null,
        uploaderURL: 'http://140.221.67.172:7778',
        aweURL: 'http://140.221.67.172:7080',
        methods: null,			// {method_id -> method_spec}
        types: null,			// {type_name -> type_spec}
        selectedType: null,		// selected type name
        widgetPanel: null,		// div for selected type
        inputWidget: null,		// widget for selected type
        methodSpec: null,		// method spec-file for selected type
        init: function(options) {
            this._super(options);
            var self = this;
            $(document).on(
            		'setWorkspaceName.Narrative', $.proxy(function(e, info) {
                        //console.log('side panel import tab -- setting ws to ' + info.wsId);
                        self.wsName = info.wsId;
            		}, this)
            );
            return this;
        },
        
        render: function() {
        	var self = this;
            var errorModalId = "app-error-modal-"+ self.uuid();
            var modalLabel = "app-error-modal-lablel-"+ self.uuid();
            self.$errorModalContent = $('<div>');
            self.$errorModal =  $('<div id="'+errorModalId+'" tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="z-index: 1000000;">').addClass("modal fade");
            self.$errorModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">Problems exist in your parameter settings.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(self.$errorModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append(
                            $('<button type="button" data-dismiss="modal">').addClass("btn btn-default").append("Dismiss"))
                    )
                ));
            self.$elem.append(self.$errorModal);

            if (window.kbconfig && window.kbconfig.urls) {
                this.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }
            var upperPanel = $('<div>');
            this.widgetPanel = $('<div>');
            this.errorPanel = $('<div>');

            this.$elem.append(upperPanel);
            this.$elem.append(this.widgetPanel);
            this.$elem.append(this.errorPanel);
            this.methClient = new NarrativeMethodStore(this.methodStoreURL);
            this.methClient.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1}, 
                    $.proxy(function(data) {
                    	var aTypes = data[3];
                    	var methodIds = [];
                    	self.types = {};
                    	for (var key in aTypes) {
                    		if (aTypes[key]["loading_error"]) {
                            	console.log("Error loading type [" + key + "]: " + aTypes[key]["loading_error"]);
                    			continue;
                    		}
                    		if (aTypes[key]["import_method_ids"].length > 0) {
                    			self.types[key] = aTypes[key];
                    			var methodId = aTypes[key]["import_method_ids"][0];
                    			methodIds.push(methodId);
                    		}
                    	}
                        self.methClient.get_method_spec({ 'ids' : methodIds },
                                $.proxy(function(specs) {
                                	self.methods = {};
                                	for (var i in specs) {
                                		self.methods[specs[i].info.id] = specs[i];
                                	}
                                	for (var key in self.types) {
                                		addButton(key);
                                	}
                                	
                                	function addButton(key) {
                                		var btn = $('<button>' + self.types[key]["name"] + '</button>');
                                    	btn.click(function() {
                                        	self.showWidget(key);                                	
                                    	});
                                		upperPanel.append(btn);
                                	}
                                }, this),
                                $.proxy(function(error) {
                                    self.showError(error);
                                }, this)
                            );
                    }, this),
                    $.proxy(function(error) {
                        self.showError(error);
                    }, this)
                );
            return this;
        },

        showWidget: function(type) {
        	console.log("WS name: " + this.wsName);
            var self = this;
            this.selectedType = type;
        	this.widgetPanel.empty();
        	this.widgetPanel.addClass('panel kb-func-panel kb-cell-run')
        	var methodId = this.types[type]["import_method_ids"][0];
        	this.methodSpec = this.methods[methodId];
            var inputWidgetName = this.methodSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = "kbaseNarrativeMethodInput";
            var methodJson = JSON.stringify(this.methodSpec);
            
            var $inputDiv = $('<div>');

            // These are the 'delete' and 'run' buttons for the cell
            var $runButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Run')
                             .addClass('btn btn-primary btn-sm')
                             .append('Import');
            $runButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    var v = self.inputWidget.isValid();
                    if (v.isValid) {
                    	self.runImport();
                    } else {
                        var errorCount = 1;
                        self.$errorModalContent.empty();
                        var $errorStep = $('<div>');
                        for (var e=0; e<v.errormssgs.length; e++) {
                        	$errorStep.append($('<div>').addClass("kb-app-step-error-mssg").append('['+errorCount+']: ' + v.errormssgs[e]));
                        	errorCount = errorCount+1;
                        }
                        self.$errorModalContent.append($errorStep);
                        self.$errorModal.modal('show');
                        return false;
                    }
                }, this)
            );

            var $buttons = $('<div>')
                           .addClass('buttons pull-right')
                           .append($runButton);

            var $progressBar = $('<div>')
                               .attr('id', 'kb-func-progress')
                               .addClass('pull-left')
                               .css({'display' : 'none'})
                               .append($('<div>')
                                       .addClass('progress progress-striped active kb-cell-progressbar')
                                       .append($('<div>')
                                               .addClass('progress-bar progress-bar-success')
                                               .attr('role', 'progressbar')
                                               .attr('aria-valuenow', '0')
                                               .attr('aria-valuemin', '0')
                                               .attr('aria-valuemax', '100')
                                               .css({'width' : '0%'})))
                               .append($('<p>')
                                       .addClass('text-success'));

            var methodId = 'import-method-details-'+this.uuid();
            var buttonLabel = 'details';
            var methodDesc = this.methodSpec.info.tooltip;
            var $menuSpan = $('<div class="pull-right">');
            var $methodInfo = $('<div>')
            .addClass('kb-func-desc')
            .append('<h1><b>' + this.methodSpec.info.name + '</b></h1>')
            .append($menuSpan)
            .append($('<span>')
                    .addClass('pull-right kb-func-timestamp')
                    .attr('id', 'last-run'))
            .append($('<button>')
                    .addClass('btn btn-default btn-xs')
                    .attr('type', 'button')
                    .attr('data-toggle', 'collapse')
                    .attr('data-target', '#' + methodId)
                    .append(buttonLabel))
            .append($('<h2>')
                    .attr('id', methodId)
                    .addClass('collapse')
                    .append(methodDesc));

            
            this.widgetPanel
            .append($('<div>')
                    .addClass('panel-heading')
                    .append($methodInfo))
            .append($('<div>')
                    .addClass('panel-body')
                    .append($inputDiv))
            .append($('<div>')
                    .addClass('panel-footer')
                    .css({'overflow' : 'hidden'})
                    .append($progressBar)
                    .append($buttons));
            
            this.inputWidget = $inputDiv[inputWidgetName]({ method: methodJson, isInSidePanel: true });
        },
        
        runImport: function() {
        	var self = this;
        	var paramValueArray = self.inputWidget.getParameters();
        	var params = {};
        	for(var i in self.methodSpec.parameters) {
            	var paramId = self.methodSpec.parameters[i].id;
            	var paramValue = paramValueArray[i];
            	params[paramId] = paramValue;
        	}
        	console.log(params);
        	//alert(JSON.stringify(params));
            var uploaderClient = new Transform(this.uploaderURL, {'token': self.token});
            if (self.selectedType === 'KBaseGenomes.Genome') {
            	var mode = params["mode"];
            	if (mode === 'uploadGbk') {
            		var contigsetId = null;
            		if (params['contigObject'].length > 0) {
            			contigsetId = params['contigObject'];
            		} else {
            			contigsetId = params['outputObject'] + '.contigset';
            		}
            		var args = {'etype': 'KBaseGenomes.GBK', 
            				'kb_type': 'KBaseGenomes.Genome', 
            				'in_id': params['gbkFile'], 
            				'ws_name': self.wsName, 
            				'obj_name': params['outputObject'], 
            				'opt_args': '{"validator":{},"transformer":{"contigset_ref":"'+self.wsName+'/'+contigsetId+'"}}'}
            		console.log(args);
            		uploaderClient.upload({},
            				$.proxy(function(data) {
            					console.log(data);
            					self.waitForJob(data[0]);
                            }, this),
                            $.proxy(function(error) {
                                self.showError(error);
                            }, this)
                        );
            	} else {
            		self.showError(mode + " import mode for Genome type is not supported yet");
            	}
            } else if (self.selectedType === 'KBaseGenomes.ContigSet') {
            	self.showError("Support for ContigSet is coming.");
            } else {
            	self.showError("Import for [" + self.selectedType + "] type is not supported yet.");
            }
        },
        
        waitForJob: function(jobId) {
        	var self = this;
        	var aweClient = new AweClient({url: self.aweURL, token: self.token});
        	var timeLst = function(event) {
        		aweClient.get_job(jobId, function(data) {
        			console.log("Job status:");
        			console.log(data);
        			var state = data['state'];
        			if (state === 'completed') {  // Done
        				clearInterval(self.timer);
        				console.log("Import is done");
        			} else if (state === 'suspended') {  // Error
        				clearInterval(self.timer);
        				self.showError("Unexpected error");
        			}
        		}, function(error) {
    				clearInterval(self.timer);
    				console.log(error);
        		});
        	};
        	self.timer = setInterval(timeLst, 5000);
        },
        
        showError: function(error) {
        	console.log(error);
        	var errorMsg = error;
        	if (error.error && error.error.message)
        		errorMsg = error.error.message;
        	this.errorPanel.empty();
        	this.errorPanel.append('<span class="label label-danger">Error: '+errorMsg+'"</span>');
        },
        
        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
            return this;
        },
        
        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }
    });
})( jQuery );
