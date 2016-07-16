/*global define*/
/*jslint white: true*/
/**
 * "Download" panel for each element in data list panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define (
	[
		'kbwidget',
		'bootstrap',
		'jquery',
		'narrativeConfig',
		'kbase-client-api',
		'kbase-generic-client-api'
	], function(
		KBWidget,
		bootstrap,
		$,
		Config,
		kbase_client_api,
		kbase_generic_client_api
	) {
    'use strict';
    return KBWidget({
        name: "kbaseNarrativeDownloadPanel",
        
        version: "1.0.0",
        options: {
        	token: null,
        	type: null,
        	wsId: null,
        	objId: null,
        	downloadSpecCache: null  // value is structure {'tag': <tag>, 'lastUpdateTime': <milliseconds>, 'types': {<type>: <type-spec>}}
        },
        token: null,
        type: null,  // Type of workspace object to show downloaders for
        wsId: null,
        objId: null,
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        transformURL: Config.url('transform'),
        ujsURL: Config.url('user_and_job_state'),
        shockURL: Config.url('shock'),
        exportURL: Config.url('data_import_export'),
        nmsURL: Config.url('narrative_method_store'),
        eeURL: Config.url('job_service'),
        timer: null,
        downloadSpecCache: null,
        
        downloaders: {  // type -> {name: ..., external_type: ...[, transform_options: ...[, unzip: <file_ext>]}
        	'KBaseGenomes.ContigSet': [{name: 'FASTA', external_type: 'FASTA.DNA.Assembly', transform_options: {"output_file_name": "?.fasta"}}],
        	'KBaseGenomes.Genome': [{name: "GENBANK", external_type: 'Genbank.Genome', transform_options: {}}],

                'KBaseGenomeAnnotations.Assembly': [{name: 'FASTA', external_type: 'FASTA.DNA.Assembly', transform_options: {}}],
                'KBaseGenomeAnnotations.GenomeAnnotation': [{name: "GENBANK", external_type: 'Genbank.Genome', transform_options: {}}],

        	'KBaseAssembly.SingleEndLibrary': [{name: "FASTA/FASTQ", external_type: 'SequenceReads', transform_options: {}}],
        	'KBaseAssembly.PairedEndLibrary': [{name: "FASTA/FASTQ", external_type: 'SequenceReads', transform_options: {}}],
        	'KBaseFile.SingleEndLibrary': [{name: "FASTA/FASTQ", external_type: 'SequenceReads', transform_options: {}}],
        	'KBaseFile.PairedEndLibrary': [{name: "FASTA/FASTQ", external_type: 'SequenceReads', transform_options: {}}],

        	'KBaseFBA.FBAModel':[{
        	    name: "SBML", external_type: 'SBML.FBAModel', transform_options: {}
        	}, {
        	    name: "TSV", external_type: 'TSV.FBAModel', transform_options: {}
        	}, {
        	    name: "EXCEL", external_type: 'Excel.FBAModel', transform_options: {}
        	}],

        	'KBaseFBA.FBA':[{
        	    name: "TSV", external_type: 'TSV.FBA', transform_options: {}
        	}, {
        	    name: "EXCEL", external_type: 'Excel.FBA', transform_options: {}
        	}],

        	'KBaseBiochem.Media':[{
        	    name: "TSV", external_type: 'TSV.Media', transform_options: {}
        	}, {
        	    name: "EXCEL", external_type: 'Excel.Media', transform_options: {}
        	}],

        	'KBasePhenotypes.PhenotypeSet':[{name: "TSV", external_type: 'TSV.PhenotypeSet', transform_options: {}}],
        	
        	'KBasePhenotypes.PhenotypeSimulationSet':[{
        	    name: "TSV", external_type: 'TSV.PhenotypeSimulationSet', transform_options: {}
        	}, {
                name: "EXCEL", external_type: 'Excel.PhenotypeSimulationSet', transform_options: {}
            }],
            
        	'KBaseGenomes.Pangenome':[{
        	    name: 'TSV', external_type: 'TSV.Pangenome', transform_options: {}
        	}, {
        	    name: "EXCEL", external_type: 'Excel.Pangenome', transform_options: {}
        	}],
            
            'KBaseFeatureValues.ExpressionMatrix':[{
                name: "TSV", external_type: 'TSV.Matrix', transform_options: {}
            }],

            'KBaseEnigmaMetals.GrowthMatrix':[{
                name: "TSV", external_type: 'TSV.Growth', transform_options: {}
            }],

            'KBaseEnigmaMetals.ChromatographyMatrix':[{
                name: "TSV", external_type: 'TSV.Chromatography', transform_options: {}
            }],

            'KBaseEnigmaMetals.SamplePropertyMatrix':[{
                name: "TSV", external_type: 'TSV.SampleProperty', transform_options: {}
            }],

            'KBaseFeatureValues.FeatureClusters':[{
                name: "TSV", external_type: 'TSV.FeatureClusters', transform_options: {}
            }, {
                name: "SIF", external_type: 'SIF.FeatureClusters', transform_options: {}
            }],

            'KBaseOntology.OntologyDictionary':[{
			name: "OBO", external_type: 'OBO.Ontology', transform_options: { "output_file_name": "Toy.obo" }
            }],

            'KBaseOntology.OntologyTranslation':[{
			name: "TSV", external_type: 'TSV.OntologyTranslation', transform_options: { "output_file_name" : "Toy.tsv" }
            }]
        },

        init: function(options) {
            this._super(options);
            var self = this;
            this.token = this.options.token;
            this.type = this.options.type;
            this.wsId = this.options.wsId;
            this.objId = this.options.objId;
            this.downloadSpecCache = options['downloadSpecCache'];
            console.log(this.downloadSpecCache);
            var lastUpdateTime = this.downloadSpecCache['lastUpdateTime'];
            if (lastUpdateTime) {
                this.render();
            } else {
                console.log("Loading type specs...");
                //downloadSpecCache: {'currentTag': <current-tag>, <tag>: {'types': {<type>: <type-spec>}}}
                var nms = new NarrativeMethodStore(this.nmsURL, { token: this.token });
                nms.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1},
                        $.proxy(function(data) {
                            console.log(data);
                            var aTypes = data[3];
                            var types = {};
                            for (var key in aTypes) {
                                if (aTypes[key]["loading_error"]) {
                                    console.log("Error loading type [" + key + "] for tag [" + currentTag + "]: " + 
                                            aTypes[key]["loading_error"]);
                                    continue;
                                }
                                types[key] = aTypes[key];
                            }
                            self.downloadSpecCache['types'] = types;
                            self.downloadSpecCache['lastUpdateTime'] = Date.now();
                            console.log("2", self.downloadSpecCache);
                            self.render();
                        }, this),
                        $.proxy(function(error) {
                            self.showError(error);
                        }, this)
                );
            }
            return this;
        },
        
        render: function() {
            var self = this;
    		var downloadPanel = this.$elem;
		
    		var $labeltd = $('<td>').css({'white-space':'nowrap','padding':'1px'}).append('Export as:');
    		var $btnTd = $('<td>').css({'padding':'1px'});
    		downloadPanel.append($('<table>').css({width:'100%'})
    		        .append('<tr>')
    		        .append($labeltd)
    		        .append($btnTd));

		
    		var addDownloader = function(descr) {
    		    $btnTd.append($('<button>').addClass('kb-data-list-btn')
    		            .append(descr.name)
    		            .click(function() {
    		                $btnTd.find('.kb-data-list-btn').prop('disabled', true);
    		                self.runDownloader(self.type, self.wsId, self.objId, descr);
    		            }));
    		};
    		
    		var downloaders = self.prepareDownloaders(self.type, self.wsId, self.objId);
    		for (var downloadPos in downloaders)
    			addDownloader(downloaders[downloadPos]);
		
    		$btnTd.append($('<button>').addClass('kb-data-list-btn')
                    .append('JSON')
                    .click(function() {
                    	var url = self.exportURL + '/download?ws='+encodeURIComponent(self.wsId)+
                    	    '&id='+encodeURIComponent(self.objId)+'&token='+encodeURIComponent(self.token)+
                    		'&url='+encodeURIComponent(self.wsUrl) + '&wszip=1'+
                    		'&name=' + encodeURIComponent(self.objId + '.JSON.zip');
                    	self.downloadFile(url);
                    }));
    		$btnTd.append($('<button>').addClass('kb-data-list-cancel-btn')
    		        .append('Cancel')
    		        .click(function() {
    		            self.stopTimer();
    		            downloadPanel.empty();
    		        } ));
		
    		self.$statusDiv = $('<div>').css({'margin':'15px'});
    		self.$statusDivContent = $('<div>');
    		self.$statusDiv.append(self.$statusDivContent);
    		downloadPanel.append(self.$statusDiv.hide());
        },
        
        prepareDownloaders: function(type, wsId, objId) {
            var ret = [];
            var typeSpec = this.downloadSpecCache['types'] ? 
                    this.downloadSpecCache['types'][type] : null;
            if (typeSpec && typeSpec['export_functions']) {
                for (var name in typeSpec['export_functions'])
                    if (typeSpec['export_functions'].hasOwnProperty(name))
                        ret.push({name: name + " (SDK)", local_function: typeSpec['export_functions'][name]});
            } else {
                var descrList = this.downloaders[type];
                for (var descrPos in descrList) {
                    var descr = descrList[descrPos];
                    var retDescr = {name: descr.name, external_type: descr.external_type, unzip: descr.unzip};
                    ret.push(retDescr);
                    if (descr.transform_options) {
                        retDescr.transform_options = {};
                        for (var key in descr.transform_options) {
                            if (!descr.transform_options.hasOwnProperty(key))
                                continue;
                            var value = descr.transform_options[key];
                            if (value.indexOf('?') == 0)
                                value = objId + value.substring(1);
                            retDescr.transform_options[key] = value;
                        }
                    }
                }
            }
            console.log(ret);
            return ret;
        },
        
        runDownloader: function(type, wsId, objId, descr) {
            // descr is {name: ..., external_type: ...[, transform_options: ...[, unzip: ...]] [, local_function: ...]}
            var self = this;
            self.showMessage('<img src="'+self.loadingImage+'" /> Export status: Preparing data');
            self.$statusDiv.show();
            var wsObjectName = objId + '.' + descr.name.replace(/[^a-zA-Z0-9|\.\-_]/g,'_');
            if (descr.local_function) {
                var method = descr.local_function.replace('/', '.');
                var genericClient = new GenericClient(this.eeURL, { token: this.token }, null, false);
                genericClient.sync_call("NarrativeJobService.run_job",
                        [{method: method, params: [{input_ref: wsId + "/" + objId}],
                            service_ver: this.downloadSpecCache['tag']}], function(data){
                    var jobId = data[0];
                    console.log("Running " + descr.local_function + ", job ID: " + jobId);
                },
                function(error){
                    self.showError(error);
                });
            } else {
                var transform_options = descr.transform_options;
                if (!transform_options)
                    transform_options = {};
                var args = {external_type: descr.external_type, kbase_type: type, workspace_name: wsId, 
                        object_name: objId, optional_arguments: {transform: transform_options}};
                console.log("Downloader data to be sent to transform service:");
                console.log(JSON.stringify(args));
                var transformSrv = new Transform(this.transformURL, {token: this.token});
                transformSrv.download(args,
                        $.proxy(function(data) {
                            console.log(data);
                            var jobId = data[1];
                            self.waitForJob(jobId, wsObjectName, descr.unzip);
                        }, this),
                        $.proxy(function(data) {
                            console.log(data.error.error);
                            self.showError(data.error.error);
                        }, this)
                );
            }
        },

        waitForJob: function(jobId, wsObjectName, unzip) {
            var self = this;
            var jobSrv = new UserAndJobState(this.ujsURL, {token: this.token});
			var timeLst = function(event) {
				jobSrv.get_job_status(jobId, function(data) {
					//console.log(data);
					var status = data[2];
					var complete = data[5];
					var wasError = data[6];
					if (complete === 1) {
						self.stopTimer();
						if (wasError === 0) {
							console.log("Export is complete");
							// Starting download from Shock
							jobSrv.get_results(jobId, function(data) {
								self.$statusDiv.hide();
								self.$elem.find('.kb-data-list-btn').prop('disabled', false);
								console.log(data);
								self.downloadUJSResults(data.shocknodes[0], data.shockurl, 
								        wsObjectName, unzip);
							}, function(data) {
            					console.log(data.error.message);
                    			self.showError(data.error.message);
							});
						} else {
							console.log(status);
	            			self.showError(status);
						}
					} else {
						console.log("Export status: " + status, true);
			            self.showMessage('<img src="'+self.loadingImage+'" /> Export status: ' + status);
					}
				}, function(data) {
					self.stopTimer();
					console.log(data.error.message);
        			self.showError(data.error.message);
				});
			};
			self.timer = setInterval(timeLst, 5000);
			timeLst();
        },
        
        downloadUJSResults: function(shockNode, remoteShockUrl, wsObjectName, unzip) {
        	var self = this;
			var elems = shockNode.split('/');
			if (elems.length > 1)
				shockNode = elems[elems.length - 1];
			elems = shockNode.split('?');
			if (elems.length > 0)
				shockNode = elems[0];
			console.log("Shock node ID: " + shockNode);
        	var shockClient = new ShockClient({url: self.shockURL, token: self.token});
        	var downloadShockNodeWithName = function(name) {
    			var url = self.exportURL + '/download?id='+shockNode+'&token='+
    				encodeURIComponent(self.token)+'&del=1';
    			if (unzip) {
    				url += '&unzip='+encodeURIComponent(unzip);
    			} else {
    				url += '&name='+encodeURIComponent(name);
    			}
    			if (remoteShockUrl)
    				url += '&url='+encodeURIComponent(remoteShockUrl);
    			self.downloadFile(url);
        	};
        	/*shockClient.get_node(shockNode, function(data) {
        		console.log(data);
        		downloadShockNodeWithName(data.file.name);
        	}, function(error) {
        		console.log(error);
        	});*/
        	downloadShockNodeWithName(wsObjectName + ".zip");
        },
        
        downloadFile: function(url) {
        	console.log("Downloading url=" + url);
        	var hiddenIFrameID = 'hiddenDownloader';
            var iframe = document.getElementById(hiddenIFrameID);
        	if (iframe === null) {
        		iframe = document.createElement('iframe');
        		iframe.id = hiddenIFrameID;
        		iframe.style.display = 'none';
        		document.body.appendChild(iframe);
        	}
        	iframe.src = url;
        },
        
        showMessage: function(msg) {
        	var self = this;
            self.$statusDivContent.empty();
            self.$statusDivContent.append(msg);
        },
        
        showError: function(msg) {
        	var self = this;
		self.$statusDivContent.empty();
		self.$elem.find('.kb-data-list-btn').prop('disabled', false); // error is final state, so reactivate!
		self.$statusDivContent.append($('<span>').css({color:'#F44336'}).append('Error: '+msg));
        },
        
        stopTimer: function() {
			if (this.timer != null) {
				clearInterval(this.timer);
				this.timer = null;
				console.log("Timer was stopped");
			}
		}
    });
});
