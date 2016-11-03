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
		'kbase-generic-client-api',
		'base/js/namespace'
	], function(
		KBWidget,
		bootstrap,
		$,
		Config,
		kbase_client_api,
		GenericClient,
		Jupyter
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
        	downloadSpecCache: null  // {'lastUpdateTime': <millisec.>, 'types': {<type>: <spec>}}
        },
        token: null,
        type: null,  // Type of workspace object to show downloaders for
        wsId: null,
        objId: null,
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        ujsURL: Config.url('user_and_job_state'),
        shockURL: Config.url('shock'),
        exportURL: Config.url('data_import_export'),
        nmsURL: Config.url('narrative_method_store'),
        nmsTypesURL: Config.url('narrative_method_store_types'),
        eeURL: Config.url('job_service'),
        timer: null,
        downloadSpecCache: null,    // {'lastUpdateTime': <millisec.>, 'types': {<type>: <spec>}}

        init: function(options) {
            this._super(options);
            var self = this;
            this.token = this.options.token;
            this.type = this.options.type;
            this.wsId = this.options.wsId;
            this.objId = this.options.objId;
            this.downloadSpecCache = options['downloadSpecCache'];
            var lastUpdateTime = this.downloadSpecCache['lastUpdateTime'];
            if (lastUpdateTime) {
                this.render();
            } else {
                if (!this.nmsTypesURL) {
                    this.nmsTypesURL = this.nmsURL;
                }
                var nms = new NarrativeMethodStore(this.nmsTypesURL, { token: this.token });
                nms.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1},
                        $.proxy(function(data) {
                            var aTypes = data[3];
                            var types = {};
                            var count = 0;
                            for (var key in aTypes) {
                                if (aTypes[key]["loading_error"]) {
                                    console.log("Error loading type [" + key + "]: " + 
                                            aTypes[key]["loading_error"]);
                                    continue;
                                }
                                types[key] = aTypes[key];
                                count++;
                            }
                            self.downloadSpecCache['types'] = types;
                            self.downloadSpecCache['lastUpdateTime'] = Date.now();
                            console.log(count + " type-specs loaded");
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
		
    		var $labeltd = $('<td>').css({'white-space':'nowrap','padding':'1px'})
    		        .append('Export as:');
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
                    	var url = self.exportURL + '/download?' + 
                    	    'ws='+encodeURIComponent(self.wsId)+
                    	    '&id='+encodeURIComponent(self.objId)+
                    	    '&token='+encodeURIComponent(self.token)+
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
                        ret.push({name: name, local_function: 
                            typeSpec['export_functions'][name]});
            } else {
                console.log("Type [" + type + "] was skipped (no 'export_functions' block in " +
                        "type-spec).");
            }
            return ret;
        },
        
        getVersionTag: function() {
            var tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
            if (!tag) {
                tag = "release";
            }
            return tag;
        },
        
        runDownloader: function(type, wsId, objId, descr) {
            // descr is {name: ..., local_function: ...}
            var self = this;
            self.showMessage('<img src="'+self.loadingImage+'" /> Export status: Preparing data');
            self.$statusDiv.show();
            var wsObjectName = objId + '.' + descr.name.replace(/[^a-zA-Z0-9|\.\-_]/g,'_');
            var tag = self.getVersionTag();
            var method = descr.local_function.replace('/', '.');
            var genericClient = new GenericClient(this.eeURL, {token: this.token}, null, 
                    false);
            genericClient.sync_call("NarrativeJobService.run_job",
                    [{method: method, params: [{input_ref: wsId + "/" + objId}],
                        service_ver: tag}], function(data){
                var jobId = data[0];
                console.log("Running " + descr.local_function + " (tag=\"" + tag + "\"), " +
                        "job ID: " + jobId);
                self.waitForSdkJob(jobId, wsObjectName);
            },
            function(error){
                console.error(error);
                self.showError(error);
            });
        },

        waitForSdkJob: function(jobId, wsObjectName) {
            var self = this;
            var genericClient = new GenericClient(this.eeURL, { token: this.token }, null, false);
            var skipLogLines = 0;
            var lastLogLine = null;
            var timeLst = function(event) {
                genericClient.sync_call("NarrativeJobService.check_job", [jobId], function(data) {
                    var jobState = data[0];
                    genericClient.sync_call("NarrativeJobService.get_job_logs",
                            [{"job_id": jobId, "skip_lines": skipLogLines}], function(data2) {
                        var logLines = data2[0].lines;
                        for (var i = 0; i < logLines.length; i++) {
                            lastLogLine = logLines[i];
                            if (lastLogLine.is_error) {
                                console.error("Export logging: " + lastLogLine.line);
                            } else {
                                console.log("Export logging: " + lastLogLine.line);
                            }
                        }
                        skipLogLines += logLines.length;
                        var complete = jobState['finished'];
                        var error = jobState['error'];
                        if (complete) {
                            self.stopTimer();
                            if (error) {
                                console.error(error);
                                self.showError(error['message']);
                            } else {
                                console.log("Export is complete");
                                // Starting download from Shock
                                self.$statusDiv.hide();
                                self.$elem.find('.kb-data-list-btn').prop('disabled', false);
                                var result = jobState['result'];
                                self.downloadUJSResults(result[0].shock_id, self.shockURL, 
                                        wsObjectName);
                            }
                        } else {
                            var status = skipLogLines == 0 ? jobState['job_state'] : 
                                lastLogLine.line;
                            if (skipLogLines == 0)
                                console.log("Export status: " + status);
                            self.showMessage('<img src="'+self.loadingImage+'" /> ' + 
                                    'Export status: ' + status);
                        }
                    }, function(data) {
                        self.stopTimer();
                        console.log(data.error.message);
                        self.showError(data.error.message);
                    });
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
            if (typeof msg === 'object' && msg.error) {
                msg = msg.error;
                if (typeof msg === 'object' && msg.message)
                    msg = msg.message;
            }
        	self.$statusDivContent.empty();
        	// error is final state, so reactivate!
        	self.$elem.find('.kb-data-list-btn').prop('disabled', false);
        	self.$statusDivContent.append($('<span>').css({color:'#F44336'})
        	        .append('Error: '+msg));
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
