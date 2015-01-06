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
        //uploaderURL: 'http://140.221.67.172:7778',
        uploaderURL: 'https://narrative-dev.kbase.us/transform',
        //aweURL: 'http://140.221.67.172:7080',
        ujsURL: 'https://kbase.us/services/userandjobstate/',
        methods: null,			// {method_id -> method_spec}
        types: null,			// {type_name -> type_spec}
        selectedType: null,		// selected type name
        widgetPanel: null,		// div for selected type
        widgetPanelCard1: null, // first page with importer type combobox (this page will be put on widgetPanel) 
        widgetPanelCard2: null, // second page with import widget (this page will be put on widgetPanel) 
        infoPanel: null,
        inputWidget: null,		// {methodId -> widget for selected type}
        tabs: null,				// mapping {methodId -> div}
        
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
        	this.inputWidget = {};
        	this.tabs = {};
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
            self.$warningModalContent = $('<div>');
            self.$warningModal =  $('<div tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="z-index: 1000000;">').addClass("modal fade");
            var confirmButton = $('<button type="button" data-dismiss="modal">').addClass("btn").append("Confirm");
            confirmButton.click($.proxy(function(event) {
            	self.stopTimer();
            	self.back();
            }, this));
            self.$warningModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">User confirmation required.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(self.$warningModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append(confirmButton).append(
                            $('<button type="button" data-dismiss="modal">').addClass("btn btn-default").append("Cancel"))
                    )
                ));
            self.$elem.append(self.$warningModal);


            if (window.kbconfig && window.kbconfig.urls) {
                this.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }
            var upperPanel = $('<div>');
            this.widgetPanel = $('<div style="margin: 0px; width: 643px;">');
            this.widgetPanelCard1 = $('<div>');
            this.widgetPanel.append(this.widgetPanelCard1);
            this.widgetPanelCard1.append("<br>Use your own data or data from another data source in your narrative. First, select the type of data you wish to import.<hr>");
            
            var $nameDiv = $('<div>').addClass("kb-method-parameter-name").css("text-align", "left")
            	.append("DATA TYPE");

            var $dropdown= $('<select>').css({width:"400px"});
            var $nextButton = $('<button>')
                              .attr('id', this.cellId + '-next')
                              .attr('type', 'button')
                              .attr('value', 'Next')
                              .addClass('btn btn-primary btn-sm')
                              .css({'border' : '4px'})
                              .append('Next');
            var $hintDiv  = $('<div>').addClass("kb-method-parameter-hint")
            	.append("Select the type of data you wish to import.");

            $nextButton.click(
            		$.proxy(function(event) {
            			event.preventDefault();
            			var selectedType = $dropdown.val();
                    	self.showWidget(selectedType);
            		}, this)
            );
            this.widgetPanelCard1
            	.append('<div style="height: 30px">')
            	.append($nameDiv)
            	.append($('<div>').append($dropdown))
            	.append($hintDiv)
            	.append('<div style="height: 30px">')
            	.append($('<div>').append($nextButton));
            
            this.widgetPanelCard2 = $('<div style="display: none;">');
            this.widgetPanel.append(this.widgetPanelCard2);

            this.infoPanel = $('<div style="margin: 20px 0px 0px 30px;">');

            this.$elem.append(upperPanel);
            this.$elem.append(this.widgetPanel);
            this.$elem.append(this.infoPanel);
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
                    			for (var methodPos in aTypes[key]["import_method_ids"]) {
                    				var methodId = aTypes[key]["import_method_ids"][methodPos];
                    				methodIds.push(methodId);
                    			}
                    		}
                    	}
                        self.methClient.get_method_spec({ 'ids' : methodIds },
                                $.proxy(function(specs) {
                                	self.methods = {};
                                	for (var i in specs) {
                                		self.methods[specs[i].info.id] = specs[i];
                                	}
                                	for (var key in self.types) {
                                		addItem(key);
                                	}
                                    $dropdown.select2({
                                        minimumResultsForSearch: -1,
                                        formatSelection: function(object, container) {
                                            var display = '<span class="kb-parameter-data-selection">'+object.text+'</span>';
                                            return display;
                                        }
                                    });

                                	function addItem(key) {
                                		var name = self.types[key]["name"];
                                        $dropdown.append($('<option value="'+key+'">').append(name));
                                		/*var btn = $('<button>' + name + '</button>');
                                    	btn.click(function() {
                                        	self.showWidget(key);                                	
                                    	});
                                    	self.widgetPanelCard1.append(btn);*/
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
            var self = this;
            this.selectedType = type;
            this.widgetPanelCard1.css('display', 'none');
        	this.widgetPanelCard2.css('display', '');
        	this.widgetPanelCard2.empty();
        	this.buildTabs(this.widgetPanelCard2, this.types[type]["import_method_ids"].length);
        	//this.widgetPanel.addClass('panel kb-func-panel kb-cell-run')
        	var tabCount = 0;
        	for (var methodPos in this.types[type]["import_method_ids"]) {
        		
        	var methodId = this.types[type]["import_method_ids"][methodPos];
        	var methodSpec = this.methods[methodId];
            var inputWidgetName = methodSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = "kbaseNarrativeMethodInput";
            var methodJson = JSON.stringify(methodSpec);
            
            var $inputDiv = $('<div>');

            // These are the 'delete' and 'run' buttons for the cell
            var $runButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Import')
                             .addClass('btn btn-primary btn-sm')
                             .append('Import');
            $runButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    var v = self.getInputWidget().isValid();
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
                    }
                }, this)
            );
            var $backButton = $('<button>')
                             .attr('id', this.cellId + '-back')
                             .attr('type', 'button')
                             .attr('value', 'Back')
                             .addClass('btn btn-primary btn-sm')
                             .append('Back');
            $backButton.click(
                $.proxy(function(event) {
                	event.preventDefault();
                	self.back();
                }, this)
            );

            var $buttons = $('<div>')
                           .addClass('buttons')
                           .append($runButton)
                           .append('&nbsp;')
                           .append($backButton);

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

            var methodUuid = 'import-method-details-'+this.uuid();
            var buttonLabel = 'details';
            var methodDesc = methodSpec.info.tooltip;
            var $menuSpan = $('<div class="pull-right">');
            var $methodInfo = $('<div>')
                    .addClass('kb-func-desc')
                    .append($menuSpan)
                    .append($('<span>')
                    .addClass('pull-right kb-func-timestamp')
                    .attr('id', 'last-run'))
            .append($('<h2>')
                    .attr('id', methodUuid)
                    .addClass('collapse in')
                    .append("<br>" + methodDesc));
            
            var tab = $("<div>")
                    .append($('<div>')
                    .addClass('kb-func-panel kb-cell-run')
                    .append($methodInfo))
                    .append("<hr>")
                    .append($('<div>')
                    //.addClass('panel-body')
                    .append($inputDiv))
                    .append($('<div>')
                    //.addClass('panel kb-func-panel kb-cell-run panel-footer')
                    .css({'overflow' : 'hidden'})
                    //.append($progressBar)
                    .append($buttons));
            
            
            
            this.inputWidget[methodId] = $inputDiv[inputWidgetName]({ method: methodJson, isInSidePanel: true });
            
        	var isShown = tabCount == 0;
        	var tabName = methodSpec.info.name;
        	this.widgetPanelCard2.kbaseTabs('addTab', {tab: tabName, content: tab, canDelete : false, show: isShown});
        	tabCount++;
        	this.tabs[methodId] = tab;
        	}
        },
        
        buildTabs: function(tabPane, numberOfTabs) {
            var $header = $('<div>');
            var $body = $('<div>');
            //var tabNameToIndex = {};
            //var tabCount = 0;
            tabPane['kbaseTabs'] = function(funcName, params) {
            	if (funcName === 'addTab') {
            		if (numberOfTabs && numberOfTabs == 1) {
                        $body.append(params.content);
            		} else {
            		//tabNameToIndex[params.tab] = tabCount;
            		//tabCount++;
            		var tabHeader = $('<div>')
                    	.addClass('kb-side-header');
            		if (numberOfTabs)
            			tabHeader.css('width', (100/numberOfTabs)+'%');
            		tabHeader.append(params.tab);
                    $header.append(tabHeader);
                    var tabContent = $('<div>')
                    	.addClass('kb-side-tab2')
                    	.css("display", "none")
                    	.append(params.content);
                    $body.append(tabContent);
                    if (params.show) {
                        tabHeader.addClass('active');
                        tabContent.css('display', '');
                    }
            		tabHeader.click($.proxy(function(event) {
                        event.preventDefault();
                        event.stopPropagation();
                        var $headerDiv = $(event.currentTarget);
                        if (!$headerDiv.hasClass('active')) {
                            var idx = $headerDiv.index();
                            $header.find('div').removeClass('active');
                            $headerDiv.addClass('active');
                            $body.find('div.kb-side-tab2').css('display', 'none');
                            $body.find('div:nth-child(' + (idx+1) + ').kb-side-tab2').css('display', '');
                        }
                    }, this));
            		}
            	}
            };
            tabPane.append($header).append($body);
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

        getInputWidget: function() {
        	return this.inputWidget[this.getSelectedTabId()];
        },
        
        back: function() {
        	var self = this;
        	if (self.timer != null) {
                self.$warningModalContent.empty();
                self.$warningModalContent.append(
                		$('<div>').addClass("kb-app-step-error-mssg")
                			.append('Import process is not finished yet. Are you sure you want to stop watching it?'));
                self.$warningModal.modal('show');
        		return;
        	}
        	this.infoPanel.empty();
        	this.widgetPanelCard2.css('display', 'none');
            this.widgetPanelCard1.css('display', '');
        },
        
        runImport: function() {
        	var self = this;
        	var paramValueArray = this.getInputWidget().getParameters();
        	var params = {};
        	var methodId = self.getSelectedTabId();
        	var methodSpec = self.methods[methodId];
        	for(var i in methodSpec.parameters) {
            	var paramId = methodSpec.parameters[i].id;
            	var paramValue = paramValueArray[i];
            	params[paramId] = paramValue;
        	}
        	//console.log(params);
        	//alert(JSON.stringify(params));
            var uploaderClient = new Transform(this.uploaderURL, {'token': self.token});
            if (self.selectedType === 'KBaseGenomes.Genome') {
            	var mode = methodId;
            	if (mode === 'import_genome_gbk_file') {
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
            				'obj_name': params['outputObject']};
            				//'opt_args': '{"validator":{},"transformer":{"contigset_ref":"'+self.wsName+'/'+contigsetId+'"}}'}
            		console.log(args);
    				self.showInfo("Sending data...", true);
            		uploaderClient.upload(args,
            				$.proxy(function(data) {
            					console.log(data);
            					self.waitForJob(data[1]);
                            }, this),
                            $.proxy(function(error) {
                                self.showError(error);
                            }, this)
                        );
            	} else if (mode === 'import_transcript_file') {
            		var args = {'etype': 'Transcript.FASTA', 
            				'kb_type': 'KBaseGenomes.Genome', 
            				'in_id': params['fastaFile'], 
            				'ws_name': self.wsName, 
            				'obj_name': params['outputObject']};
            				//'opt_args': '{"validator":{},"transformer":{"contigset_ref":"'+self.wsName+'/'+contigsetId+'"}}'}
            		console.log(args);
    				self.showInfo("Sending data...", true);
            		uploaderClient.upload(args,
            				$.proxy(function(data) {
            					console.log(data);
            					self.waitForJob(data[1]);
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
        	/*var aweClient = new AweClient({url: self.aweURL, token: self.token});
        	var timeLst = function(event) {
        		aweClient.get_job(jobId, function(data) {
        			console.log("Job status:");
        			console.log(data);
        			var state = data['state'];
        			if (state === 'completed') {  // Done
        				self.stopTimer();
        				self.showInfo("Import job is done");
        			} else if (state === 'suspended') {  // Error
        				self.stopTimer();
        				self.showError("Unexpected error");
        			} else {
        				self.showInfo("Import job has status: " + state, true);
        			}
        		}, function(error) {
    				self.stopTimer();
    				console.log(error);
        		});
        	};*/
            var jobSrv = new UserAndJobState(self.ujsURL, {'token': self.token});
        	var timeLst = function(event) {
        		jobSrv.get_job_status(jobId, function(data) {
        			console.log(data);
        			var status = data[2];
        			var complete = data[5];
        			var wasError = data[6];
        			if (complete === 1) {
        				self.stopTimer();
        				if (wasError === 0) {
            				self.showInfo("Import job is done");
        				} else {
            				self.showError(status);
        				}
        			} else {
        				self.showInfo("Import job has status: " + status, true);
        			}
        		}, function(data) {
        			self.stopTimer();
    				console.log(data.error.message);
        		});
        	};
        	self.timer = setInterval(timeLst, 5000);
        	timeLst();
        },
        
        stopTimer: function() {
        	var self = this;
			if (self.timer != null) {
				clearInterval(self.timer);
				self.timer = null;
			}
		},
        
        showError: function(error) {
        	console.log(error);
        	var errorMsg = error;
        	if (error.error && error.error.message)
        		errorMsg = error.error.message;
        	this.infoPanel.empty();
        	this.infoPanel.append('<span class="label label-danger">Error: '+errorMsg+'"</span>');
        },

        showInfo: function(message, spinner) {
        	if (spinner)
        		message = '<img src="'+this.loadingImage+'"/> ' + message;
        	this.infoPanel.empty();
        	this.infoPanel.append(message);
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
