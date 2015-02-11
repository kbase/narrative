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
        wsUrl: window.kbconfig.urls.workspace,
        methodStoreURL: window.kbconfig.urls.narrative_method_store,
        methClient: null,
        uploaderURL: window.kbconfig.urls.transform,
        ujsURL: window.kbconfig.urls.user_and_job_state,
        shockURL: window.kbconfig.urls.shock,
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
            self.$errorModal =  $('<div id="'+errorModalId+'" tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="position:auto">').addClass("modal fade");
            self.$errorModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">Problems exist in your parameter settings.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(self.$errorModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append(
                            $('<button type="button" data-dismiss="modal">').addClass("kb-default-btn").append("Dismiss"))
                    )
                ));
            $('body').append(self.$errorModal);
            self.$warningModalContent = $('<div>');
            self.$warningModal =  $('<div tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="position:auto">').addClass("modal fade");
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
                            $('<button type="button" data-dismiss="modal">').addClass("kb-default-btn").append("Cancel"))
                    )
                ));
            $('body').append(self.$warningModal);


            if (window.kbconfig && window.kbconfig.urls) {
                this.methodStoreURL = window.kbconfig.urls.narrative_method_store;
            }
            var upperPanel = $('<div>');
            this.widgetPanel = $('<div>');
            this.widgetPanelCard1 = $('<div style="margin: 30px 30px 0px 30px;">');
            this.widgetPanel.append(this.widgetPanelCard1);
            this.widgetPanelCard1.append("<div class='kb-cell-run'><h2 class='collapse in'>Use your own data or data from another data source in your narrative. First, select the type of data you wish to import.</h2></div><hr>");
            
            var $nameDiv = $('<div>').addClass("kb-method-parameter-name").css("text-align", "left")
            	.append("DATA TYPE");

            var $dropdown= $('<select>').css({width:"400px"});
            var $nextButton = $('<button>')
                              .attr('id', this.cellId + '-next')
                              .attr('type', 'button')
                              .attr('value', 'Next')
                              .addClass('kb-primary-btn')
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
            
            this.widgetPanelCard2 = $('<div style="display: none; margin: 0px;">');
            this.widgetPanel.append(this.widgetPanelCard2);

            this.infoPanel = $('<div style="margin: 20px 30px 0px 30px;">');

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
                                	var keys = [];
                                	for (var key in self.types) {
                                		keys.push(key);
                                	}
                                	keys.sort(function(a,b) {return self.types[a]["name"].localeCompare(self.types[b]["name"])});
                                	for (var keyPos in keys) {
                                		addItem(keys[keyPos]);                                		
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
            var $header = null;
            var $body = null;
            var numberOfTabs = this.types[type]["import_method_ids"].length;
            if (numberOfTabs > 1) {
            	var $header = $('<div>');
            	var $body = $('<div>');
            	this.widgetPanelCard2.append($header).append($body);
            }
            for (var methodPos in this.types[type]["import_method_ids"]) {
            	self.showTab(type, methodPos, $header, $body, numberOfTabs);
            }
            var $importButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Import')
                             .addClass('kb-primary-btn')
                             .append('Import');

            var $cancelButton = $('<button>')
                             .attr('id', this.cellId + '-run')
                             .attr('type', 'button')
                             .attr('value', 'Cancel')
                             .addClass('kb-primary-btn')
                             .append('Cancel');

            var btnImport = function(show) {
            	if (show) {
            		$importButton.show();
            		$cancelButton.hide();
            	} else {
            		$importButton.hide();
            		$cancelButton.show();
            	}
            };
            
            $importButton.click(
                $.proxy(function(event) {
                    event.preventDefault();
                    var v = self.getInputWidget().isValid();
                    if (v.isValid) {
                    	btnImport(false);
                    	self.runImport(function() {
                        	btnImport(true);
                    	});
                    } else {
                    	var errorCount = 1;
                    	self.$errorModalContent.empty();
                    	var $errorStep = $('<div>');
                    	for (var e=0; e<v.errormssgs.length; e++) {
                    		$errorStep.append($('<div>')
                    				.addClass("kb-app-step-error-mssg")
                    				.append('['+errorCount+']: ' + v.errormssgs[e]));
                    		errorCount = errorCount+1;
                    	}
                    	self.$errorModalContent.append($errorStep);
                    	self.$errorModal.modal('show');
                    	}
                }, this)
            );
            
            $cancelButton.click(function() {
            	self.stopTimer();
            	btnImport(true);
				self.showInfo("Import job was cancelled");
            });
            
            var $backButton = $('<button>')
                             .attr('id', this.cellId + '-back')
                             .attr('type', 'button')
                             .attr('value', 'Back')
                             .addClass('kb-primary-btn')
                             .append('Back');
            $backButton.click(
                $.proxy(function(event) {
                	event.preventDefault();
                	self.back();
                }, this)
            );

            var $buttons = $('<div style="margin: 0px 30px 0px 33px;">')
                           .addClass('buttons')
                           .append($importButton)
                           .append('&nbsp;')
                           .append($cancelButton)
                           .append('&nbsp;')
                           .append($backButton);

        	$cancelButton.hide();
        	self.widgetPanelCard2.append($buttons);
        },
        
        showTab: function(type, methodPos, $header, $body, numberOfTabs) {
            var self = this;
        	var methodId = this.types[type]["import_method_ids"][methodPos];
        	var methodSpec = this.methods[methodId];
            var inputWidgetName = methodSpec.widgets.input;
            if (!inputWidgetName || inputWidgetName === 'null')
                inputWidgetName = "kbaseNarrativeMethodInput";
            var methodJson = JSON.stringify(methodSpec);
            
            var $inputDiv = $('<div>');

            // These are the 'delete' and 'run' buttons for the cell

            var methodUuid = 'import-method-details-'+this.uuid();
            var buttonLabel = 'details';
            var methodDesc = methodSpec.info.tooltip;
            var $methodInfo = $('<div>')
                    .addClass('kb-func-desc')
                    .css({'margin' : '25px 0px 0px 15px'})
            		.append($('<h2>')
                    .attr('id', methodUuid)
                    .addClass('collapse in')
                    .append(methodDesc));
            
            var tab = $('<div style="margin: 0px 30px 0px 15px;">')
                    .append($('<div>')
                    .addClass('kb-func-panel kb-cell-run')
                    .append($methodInfo))
                    .append($('<div>').css({'margin' : '25px 0px 0px 15px'}).append("<hr>"))
                    .append($('<div>')
                    .append($inputDiv))
                    .append($('<div>')
                    .css({'overflow' : 'hidden', 'margin' : '0px 0px 0px 18px'}));
                        
        	var isShown = methodPos == 0;
        	var tabName = methodSpec.info.name;
        	var params = {tab: tabName, content: tab, canDelete : false, show: isShown};
    		if (numberOfTabs == 1) {
    			this.widgetPanelCard2.append(tab);
    		} else {
    			var tabHeader = $('<div>')
    				.addClass('kb-side-header');
    			tabHeader.css('width', (100/numberOfTabs)+'%');
    			tabHeader.append($('<small>').append(params.tab));
    			$header.append(tabHeader);
    			var tabContent = $('<div>')
    				.addClass('kb-side-tab3')
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
    					$body.find('div.kb-side-tab3').css('display', 'none');
    					$body.find('div:nth-child(' + (idx+1) + ').kb-side-tab3').css('display', '');
    				}
    			}, this));
    		}
            this.inputWidget[methodId] = $inputDiv[inputWidgetName]({ method: methodJson, isInSidePanel: true });

        	this.tabs[methodId] = tab;
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
        
        runImport: function(callback) {
        	var self = this;
        	var paramValueArray = this.getInputWidget().getParameters();
        	var params = {};
        	var methodId = self.getSelectedTabId();
        	var methodSpec = self.methods[methodId];
        	for (var i in methodSpec.parameters) {
            	var paramId = methodSpec.parameters[i].id;
            	var paramValue = paramValueArray[i];
            	params[paramId] = paramValue;
        	}
            var uploaderClient = new Transform(this.uploaderURL, {'token': self.token});
            var args = null;
            if (self.selectedType === 'KBaseGenomes.Genome') {
            	var url = null;
            	if (methodId === 'import_genome_gbk_file') {
            		url = self.shockURL + '/node/' + params['gbkFile'];
            	} else if (methodId === 'import_genome_gbk_ftp') {
            		url = params['ftpFolder'];
            	}
            	if (url) {
            		var options = {};
            		if (params['contigObject'] && params['contigObject'].length > 0) {
            			options['contigset_object_name'] = params['contigObject'];
            		} else {
            			options['contigset_object_name'] = params['outputObject'] + '.contigset';
            		}
            		args = {'external_type': 'Genbank.Genome', 
            				'kbase_type': 'KBaseGenomes.Genome', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':options},
            				'url_mapping': {'Genbank.Genome': url}};
            	} else {
            		self.showError(methodId + " import mode for Genome type is not supported yet");
            	}
            } else if (self.selectedType === 'Transcript') {
            	if (methodId === 'import_transcript_file') {
            		var options = {'dna':self.asInt(params['dna']),
            				"output_file_name": "transcripts.json"};
            		var genomeId = params['genomeId'];
            		if (genomeId)
            			options['genome_id'] = genomeId;
            		args = {'external_type': 'FASTA.Transcripts', 
            				'kbase_type': 'KBaseGenomes.Genome', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':options},
            				'url_mapping': {'FASTA.Transcripts': self.shockURL + '/node/' + params['fastaFile']}};
            	} else {
            		self.showError(methodId + " import mode for Genome type is not supported yet");
            	}
            } else if (self.selectedType === 'KBaseGenomes.ContigSet') {
            	var url = null;
            	if (methodId === 'import_contigset_fasta_file') {
            		url = self.shockURL + '/node/' + params['fastaFile'];
            	} else if (methodId === 'import_contigset_fasta_ftp') {
            		url = params['ftpFolder'];
            	}
            	if (url) {
            		args = {'external_type': 'FASTA.DNA.Assembly', 
            				'kbase_type': 'KBaseGenomes.ContigSet', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':
            						{"fasta_reference_only":self.asBool(params['fastaReferenceOnly'])}},
            				'url_mapping': {'FASTA.DNA.Assembly': url}};
            	} else {
            		self.showError(methodId + " import mode for ContigSet type is not supported yet");
            	}
            } else if (self.selectedType === 'ShortReads') {
            	if (methodId === 'import_reads_fasta_file') {
            		var options = {'output_file_name': 'reflib.fasta.json'};
            		var refName = params['refname'];
            		if (refName)
            			options['refname'] = refName;
            		args = {'external_type': 'FASTA.DNA.Assembly', 
            				'kbase_type': 'KBaseAssembly.ReferenceAssembly', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':options},
            				'url_mapping': {'FASTA.DNA.Assembly': self.shockURL + '/node/' + params['fastaFile']}};
            	} else if (methodId === 'import_reads_pe_fastq_file') {
            		var urlMapping = {'SequenceReads.1': self.shockURL + '/node/' + params['fastqFile1']};
            		if (params['fastqFile2'] && params['fastqFile2'].length > 0)
            			urlMapping['SequenceReads.2'] = self.shockURL + '/node/' + params['fastqFile2'];
            		var options = {'outward':self.asInt(params['readOrientationOutward']),
            				'output_file_name': 'pelib.fastq.json'};
            		var optInsert = params['insertSizeMean'];
            		if (optInsert)
            			options['insert'] = optInsert;
            		var optStdev = params['insertSizeStDev'];
            		if (optStdev)
            			options['stdev'] = optStdev;
            		args = {'external_type': 'SequenceReads', 
            				'kbase_type': 'KBaseAssembly.PairedEndLibrary', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':options},
            				'url_mapping': urlMapping};
            	} else if (methodId === 'import_reads_se_fastq_file') {
            		args = {'external_type': 'SequenceReads', 
            				'kbase_type': 'KBaseAssembly.SingleEndLibrary', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':{'output_file_name': 'selib.fastq.json'}},
            				'url_mapping': {'SequenceReads': self.shockURL + '/node/' + params['fastqFile']}};
            	} else {
            		self.showError(methodId + " import mode for ShortReads type is not supported yet");
            	}
            } else if (self.selectedType === 'KBaseFBA.FBAModel') {
            	if (methodId === 'import_fbamodel_csv_file') {
            		var options = {};
            		var genome = params['genomeObject'];
            		if (genome)
            			options['genome'] = genome;
            		var biomass = params['biomass'];
            		if (biomass)
            			options['biomass'] = biomass;
            		args = {'external_type': 'TSV.FBAModel', 
            				'kbase_type': 'KBaseFBA.FBAModel', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':options},
            				'url_mapping': {
            					'TSV.FBAModel': self.shockURL + '/node/' + params['reactionFile'],
            					'TSV.Compounds': self.shockURL + '/node/' + params['compoundFile']
            				}
            		};
            	} else if (methodId === 'import_fbamodel_sbml_file') {
            		var urlMapping = {'SBML.FBAModel': self.shockURL + '/node/' + params['reactionFile']};
            		var compoundFile = params['compoundFile'];
            		if (compoundFile)
            			urlMapping['TSV.Compounds'] = self.shockURL + '/node/' + compoundFile;
            		var options = {};
            		var genome = params['genomeObject'];
            		if (genome)
            			options['genome'] = genome;
            		var biomass = params['biomass'];
            		if (biomass)
            			options['biomass'] = biomass;
            		args = {'external_type': 'SBML.FBAModel', 
            				'kbase_type': 'KBaseFBA.FBAModel', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':options},
            				'url_mapping': urlMapping};
            	} else if (methodId === 'import_fbamodel_excel_file') {
                    var urlMapping = {'Excel.FBAModel': self.shockURL + '/node/' + params['inputFile']};
                    var options = {};
                    var genome = params['genomeObject'];
                    if (genome)
                        options['genome'] = genome;
                    var biomass = params['biomass'];
                    if (biomass)
                        options['biomass'] = biomass;
                    args = {'external_type': 'Excel.FBAModel', 
                            'kbase_type': 'KBaseFBA.FBAModel', 
                            'workspace_name': self.wsName, 
                            'object_name': params['outputObject'],
                            'optional_arguments': {'validate':{},'transform':options},
                            'url_mapping': urlMapping};
                } else {
            		self.showError(methodId + " import mode for FBAModel type is not supported yet");
            	}
            } else if (self.selectedType === 'KBaseBiochem.Media') {
            	if (methodId === 'import_media_csv_file') {
            		args = {'external_type': 'TSV.Media', 
            				'kbase_type': 'KBaseBiochem.Media', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':{}},
            				'url_mapping': {'TSV.Media': self.shockURL + '/node/' + params['csvFile']}};
            	} else if (methodId === 'import_media_excel_file') {
                    args = {'external_type': 'Excel.Media', 
                            'kbase_type': 'KBaseBiochem.Media', 
                            'workspace_name': self.wsName, 
                            'object_name': params['outputObject'],
                            'optional_arguments': {'validate':{},'transform':{}},
                            'url_mapping': {'Excel.Media': self.shockURL + '/node/' + params['inputFile']}};
                } else {
            		self.showError(methodId + " import mode for Media type is not supported yet");
            	}
            } else if (self.selectedType === 'KBasePhenotypes.PhenotypeSet') {
            	if (methodId === 'import_phenotypeset_csv_file') {
            		var options = {};
            		var genome = params['genomeObject'];
            		if (genome)
            			options['genome'] = genome;
            		args = {'external_type': 'TSV.PhenotypeSet', 
            				'kbase_type': 'KBasePhenotypes.PhenotypeSet', 
            				'workspace_name': self.wsName, 
            				'object_name': params['outputObject'],
            				'optional_arguments': {'validate':{},'transform':options},
            				'url_mapping': {'TSV.PhenotypeSet': self.shockURL + '/node/' + params['csvFile']}};
            	} else {
            		self.showError(methodId + " import mode for PhenotypeSet type is not supported yet");
            	}
            } else {
            	self.showError("Import for [" + self.selectedType + "] type is not supported yet.");
            }
            if (args) {
        		console.log("Data to be sent to transform service:");
        		console.log(JSON.stringify(args));
				self.showInfo("Sending data...", true);
        		uploaderClient.upload(args,
        				$.proxy(function(data) {
        					console.log(data);
        					self.waitForJob(data[1], callback);
                        }, this),
                        $.proxy(function(error) {
                            self.showError(error);
                        	callback(false);
                        }, this)
                    );
            } else {
            	callback(false);
            }
        },
        
        asBool: function(val) {
        	if (!val)
        		return false;
        	return (val == 1 || val === "1");
        },

        asInt: function(val) {
        	if (!val)
        		return 0;
        	if (val == 1 || val === "1")
        		return 1;
        	return 0;
        },

        waitForJob: function(jobId, callback) {
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
        				callback(wasError === 0);
        				if (wasError === 0) {
                            self.trigger('updateDataList.Narrative');
            				self.showInfo("Import job is done");
        				} else {
    						self.showError('loading detailed error...');
        					jobSrv.get_detailed_error(jobId, function(data) {
        						self.showError(data);
        					}, function(data) {
        						self.showError(data.error.message);
        	        		});
        				}
        			} else {
        				self.showInfo("Import job has status: " + status, true);
        			}
        		}, function(data) {
        			self.stopTimer();
        			self.showError(data.error.message);
    				callback(false);
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
        	if (typeof error === 'object' && error.error) {
        	    error = error.error;
        	    if (typeof error === 'object' && error.message)
        	        error = error.message;
        	}
        	this.infoPanel.empty();
        	this.infoPanel.append('<pre style="text-align: left; background-color: #ffe0e0;">Error:\n'+error+'</pre>');
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
