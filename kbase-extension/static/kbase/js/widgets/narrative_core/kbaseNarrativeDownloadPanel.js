/*global define*/
/*jslint white: true*/
/**
 * "Download" panel for each element in data list panel.
 * @author Roman Sutormin <rsutormin@lbl.gov>
 * @public
 */
define ([
    'bluebird',
    'kbwidget',
    'jquery',
    'narrativeConfig',
    'kbase-client-api',
    'kbase-generic-client-api',
    'base/js/namespace'
], function(
    Promise,
    KBWidget,
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
        	objId: null,
            ref: null,
            objName: null,
        	downloadSpecCache: null  // {'lastUpdateTime': <millisec.>, 'types': {<type>: <spec>}}
        },
        token: null,
        type: null,  // Type of workspace object to show downloaders for
        objId: null,
        loadingImage: Config.get('loading_gif'),
        wsUrl: Config.url('workspace'),
        ujsURL: Config.url('user_and_job_state'),
        shockURL: Config.url('shock'),
        exportURL: Config.url('data_import_export'),
        useDynamicDownloadSupport: false,
        nmsURL: Config.url('narrative_method_store'),
        eeURL: Config.url('job_service'),
        srvWizURL: Config.url('service_wizard'),
        timer: null,
        downloadSpecCache: null,    // {'lastUpdateTime': <millisec.>, 'types': {<type>: <spec>}}

        init: function(options) {
            this._super(options);
            this.token = this.options.token;
            this.type = this.options.type;
            this.objId = this.options.objId;
            this.objName = this.options.objName;
            this.ref = this.options.ref;
            if (!this.objId) {
                var refPathItems = this.ref.split(';');
                this.objId = refPathItems[refPathItems.length - 1].trim().split('/')[1];
            }
            this.downloadSpecCache = options['downloadSpecCache'];
            var lastUpdateTime = this.downloadSpecCache['lastUpdateTime'];
            if (lastUpdateTime) {
                this.render();
            } else {
                var nms = new NarrativeMethodStore(this.nmsURL, { token: this.token });
                Promise.resolve(nms.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1}))
                    .then((data) => {
                        let aTypes = data[3],
                            types = {};
                        Object.keys(aTypes).forEach(key => {
                            if (aTypes[key]["loading_error"]) {
                                console.error("Error loading type [" + key + "]: " +
                                        aTypes[key]["loading_error"]);
                            }
                            types[key] = aTypes[key];
                        });
                        this.downloadSpecCache['types'] = types;
                        this.downloadSpecCache['lastUpdateTime'] = Date.now();
                        this.render();
                    })
                    .catch(error => {
                        this.showError(error);
                    });
            }
            return this;
        },

        render: function() {
            var self = this;
            var downloadPanel = this.$elem;

            var $labeltd = $('<td>')
                .css({'white-space':'nowrap','padding':'1px'})
                .append('Export as:');
            var $btnTd = $('<td>').css({'padding':'1px'});
            downloadPanel.append($('<table>').css({width:'100%'})
                .append('<tr>')
                .append($labeltd)
                .append($btnTd));

            var addDownloader = (descr) => {
                let $dlBtn = $('<button>')
                    .addClass('kb-data-list-btn')
                    .append(descr.name);

                if (descr.name.toLocaleLowerCase() === 'staging') {
                    $dlBtn.click(() => {
                        Jupyter.narrative.addAndPopulateApp('kb_staging_exporter/export_to_staging', 'beta', {
                            input_ref: self.objName
                        });
                    });
                }
                else {
                    $dlBtn.click(() => {
                        $btnTd.find('.kb-data-list-btn').prop('disabled', true);
                        self.runDownloader(self.type, self.ref, self.objName, descr);
                    });
                }
                $btnTd.append($dlBtn);
            };

            var downloaders = self.prepareDownloaders(self.type);
            downloaders.forEach(dl => addDownloader(dl));

    		$btnTd.append($('<button>').addClass('kb-data-list-btn')
                    .append('JSON')
                    .click(function() {
                    	var urlSuffix = '/download?' +
                    	    'ref='+encodeURIComponent(self.ref)+
                    		'&url='+encodeURIComponent(self.wsUrl) + '&wszip=1'+
                    		'&name=' + encodeURIComponent(self.objName + '.JSON.zip');
                    	self.downloadFile(urlSuffix);
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

        prepareDownloaders: function(type) {
            var ret = [];
            if (!this.downloadSpecCache['types']) {
                return ret
            }
            var module = type.split(".", 1)[0];
            var typeSpec = this.downloadSpecCache['types'][type] ?
                    this.downloadSpecCache['types'][type] : this.downloadSpecCache['types'][module];
            if (typeSpec && typeSpec['export_functions']) {
                Object.keys(typeSpec['export_functions']).forEach(name => {
                    ret.push({name: name, local_function: typeSpec['export_functions'][name]});
                });
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

        runDownloader: function(type, ref, objId, descr) {
            // descr is {name: ..., local_function: ...}
            this.showMessage('<img src="'+this.loadingImage+'" /> Export status: Preparing data');
            this.$statusDiv.show();
            var wsObjectName = objId + '.' + descr.name.replace(/[^a-zA-Z0-9|\.\-_]/g,'_');
            var tag = this.getVersionTag();
            var method = descr.local_function.replace('/', '.');
            var genericClient = new GenericClient(this.eeURL, {token: this.token}, null, false);
            Promise.resolve(genericClient.sync_call(
                "NarrativeJobService.run_job",
                [{
                    method: method,
                    params: [{input_ref: ref}],
                    service_ver: tag,
                }]))
                .then(data => {
                    var jobId = data[0];
                    console.log("Running " + descr.local_function + " (tag=\"" + tag + "\"), " +
                            "job ID: " + jobId);
                    this.waitForSdkJob(jobId, wsObjectName);
                })
                .catch(error => {
                    console.error(error);
                    this.showError(error);
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
    			var urlSuffix = '/download?id='+shockNode+'&del=1';
    			if (unzip) {
    			    urlSuffix += '&unzip='+encodeURIComponent(unzip);
    			} else {
    			    urlSuffix += '&name='+encodeURIComponent(name);
    			}
    			if (remoteShockUrl)
    			    urlSuffix += '&url='+encodeURIComponent(remoteShockUrl);
    			self.downloadFile(urlSuffix);
        	};
        	downloadShockNodeWithName(wsObjectName + ".zip");
        },

        downloadFile: function(urlSuffix) {
            var self = this;
            if (self.useDynamicDownloadSupport) {
                var genericClient = new GenericClient(self.srvWizURL, {token: self.token}, null,
                        false);
                genericClient.sync_call("ServiceWizard.get_service_status",
                        [{module_name: 'NarrativeDownloadSupport', version: 'dev'}], function(data) {
                    var urlPrefix = data[0]['url'];
                    self.downloadFileInner(urlPrefix + urlSuffix);
                },
                function(error){
                    console.error(error);
                    self.showError(error);
                });
            } else {
                self.downloadFileInner(self.exportURL + urlSuffix);
            }
        },

        downloadFileInner: function(url) {
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
                if (typeof msg === 'object' && msg.message) {
                    msg = msg.message;
                }
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
			}
		}
    });
});
