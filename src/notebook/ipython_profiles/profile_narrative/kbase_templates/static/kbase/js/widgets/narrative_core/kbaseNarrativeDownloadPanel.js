/**
 * "Download" panel for each element in data list panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
(function( $, undefined ) {
    $.KBWidget({
        name: "kbaseNarrativeDownloadPanel",
        parent: "kbaseWidget",
        version: "1.0.0",
        options: {
        	token: null,
        	type: null,
        	wsId: null,
        	objId: null
        },
        token: null,
        type: null,
        wsId: null,
        objId: null,
        loadingImage: "static/kbase/images/ajax-loader.gif",
        wsUrl: window.kbconfig.urls.workspace,
        transformURL: window.kbconfig.urls.transform,
        ujsURL: window.kbconfig.urls.user_and_job_state,
        shockURL: window.kbconfig.urls.shock,
        exportURL: window.kbconfig.urls.data_import_export,
        timer: null,
        
        downloaders: {  // type -> {name: ..., external_type: ...[, transform_options: ...[, unzip: <file_ext>]}
        	'KBaseGenomes.ContigSet': [{name: 'FASTA', external_type: 'FASTA.DNA.Assembly', transform_options: {output_file_name: '?.fasta'}, unzip: 'fasta'}],
        	'KBaseGenomes.Genome': [{name: "GENBANK", external_type: 'Genbank.Genome', transform_options: {}}],
        	'KBaseAssembly.SingleEndLibrary': [{name: "FASTQ", external_type: 'SequenceReads', transform_options: {output_file_name: '?.fastq'}, unzip: 'fastq'}]
        },

        init: function(options) {
            this._super(options);
            this.token = this.options.token;
            this.type = this.options.type;
            this.wsId = this.options.wsId;
            this.objId = this.options.objId;
            this.render();
            return this;
        },
        
        render: function() {
            var self = this;
    		var downloadPanel = this.$elem;
		downloadPanel.append('Export as:');
    		var addDownloader = function(descr) {
    		downloadPanel.append($('<button>').addClass('kb-data-list-btn')
    					.append(descr.name)
    					.click(function() {
						downloadPanel.find('.kb-data-list-btn').prop('disabled', true);
    						self.runDownloader(self.type, self.wsId, self.objId, descr);
    					}));
    		};
    		var downloaders = self.prepareDownloaders(self.type, self.wsId, self.objId);
    		for (var downloadPos in downloaders)
    			addDownloader(downloaders[downloadPos]);
		
    		downloadPanel.append($('<button>').addClass('kb-data-list-btn')
                    .append('JSON')
                    .click(function() {
                    	var url = self.exportURL + '/download?ws='+self.wsId+'&id='+self.objId+'&token='+self.token+
                    		'&url='+encodeURIComponent(self.wsUrl);
                    	self.downloadFile(url);
                    }));
    		downloadPanel.append($('<button>').addClass('kb-data-list-cancel-btn')
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
        	var descrList = this.downloaders[type];
        	var ret = [];
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
        	return ret;
        },
        
        runDownloader: function(type, wsId, objId, descr) { // descr is {name: ..., external_type: ...[, transform_options: ...[, unzip: ...]]}
            var self = this;
            self.showMessage('<img src="'+self.loadingImage+'" /> Export status: Preparing data');
            self.$statusDiv.show();
        	var transform_options = descr.transform_options;
        	if (!transform_options)
        		transform_options = {};
        	var args = {external_type: descr.external_type, kbase_type: type, workspace_name: wsId, object_name: objId, optional_arguments: {transform: transform_options}};
    		console.log("Downloader data to be sent to transform service:");
    		console.log(JSON.stringify(args));
            var transformSrv = new Transform(this.transformURL, {token: this.token});
            transformSrv.download(args,
            		$.proxy(function(data) {
            			console.log(data);
            			var jobId = data[1];
            			self.waitForJob(jobId, objId, descr.unzip);
            		}, this),
            		$.proxy(function(data) {
            			console.log(data.error.error);
            			self.showError(data.error.error);
            		}, this)
            );
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
								self.downloadUJSResults(data, wsObjectName, unzip);
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
        
        downloadUJSResults: function(ujsResults, wsObjectName, unzip) {
        	var self = this;
			var shockNode = ujsResults.shocknodes[0];
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
    				url += '&zip='+encodeURIComponent(unzip);
    			} else {
    				url += '&name='+encodeURIComponent(name);
    			}
    			var remoteShockUrl = ujsResults.shockurl;
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
})( jQuery );
