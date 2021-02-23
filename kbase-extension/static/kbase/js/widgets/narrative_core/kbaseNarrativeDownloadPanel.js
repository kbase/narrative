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
], (
    Promise,
    KBWidget,
    $,
    Config,
    kbase_client_api,
    GenericClient,
    Jupyter
) => {
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
        eeURL: Config.url('execution_engine2'),
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
                const refPathItems = this.ref.split(';');
                this.objId = refPathItems[refPathItems.length - 1].trim().split('/')[1];
            }
            this.downloadSpecCache = options['downloadSpecCache'];
            const lastUpdateTime = this.downloadSpecCache['lastUpdateTime'];
            if (lastUpdateTime) {
                this.render();
            } else {
                const nms = new NarrativeMethodStore(this.nmsURL, { token: this.token });
                Promise.resolve(nms.list_categories({'load_methods': 0, 'load_apps' : 0, 'load_types' : 1}))
                    .then((data) => {
                        const aTypes = data[3],
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
            const self = this;
            const downloadPanel = this.$elem;

            const $labeltd = $('<td>')
                .css({'white-space':'nowrap','padding':'1px'})
                .append('Export as:');
            const $btnTd = $('<td>').css({'padding':'1px'});
            downloadPanel.append($('<table>').css({width:'100%'})
                .append('<tr>')
                .append($labeltd)
                .append($btnTd));

            const addDownloader = (descr) => {
                const $dlBtn = $('<button>')
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

            const downloaders = self.prepareDownloaders(self.type);
            downloaders.forEach(dl => addDownloader(dl));

    		$btnTd.append($('<button>').addClass('kb-data-list-btn')
                    .append('JSON')
                    .click(() => {
                    	const urlSuffix = '/download?' +
                    	    'ref='+encodeURIComponent(self.ref)+
                    		'&url='+encodeURIComponent(self.wsUrl) + '&wszip=1'+
                    		'&name=' + encodeURIComponent(self.objName + '.JSON.zip');
                    	self.downloadFile(urlSuffix);
                    }));
    		$btnTd.append($('<button>').addClass('kb-data-list-cancel-btn')
    		        .append('Cancel')
    		        .click(() => {
    		            self.stopTimer();
    		            downloadPanel.empty();
    		        } ));

    		self.$statusDiv = $('<div>').css({'margin':'15px'});
    		self.$statusDivContent = $('<div>');
    		self.$statusDiv.append(self.$statusDivContent);
    		downloadPanel.append(self.$statusDiv.hide());
        },

        prepareDownloaders: function(type) {
            const ret = [];
            if (!this.downloadSpecCache['types']) {
                return ret;
            }
            const module = type.split('.', 1)[0];
            const typeSpec = this.downloadSpecCache['types'][type] ?
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
            let tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag;
            if (!tag) {
                tag = "release";
            }
            return tag;
        },

        runDownloader: function(type, ref, objId, descr) {
            // descr is {name: ..., local_function: ...}
            this.showMessage('<img src="'+this.loadingImage+'" /> Export status: Preparing data');
            this.$statusDiv.show();
            const wsObjectName = objId + '.' + descr.name.replace(/[^a-zA-Z0-9|\.\-_]/g,'_');
            const tag = this.getVersionTag();
            const method = descr.local_function.replace('/', '.');
            const genericClient = new GenericClient(this.eeURL, {token: this.token}, null, false);

            Promise.resolve(genericClient.sync_call(
                "execution_engine2.run_job",
                [{
                    method: method,
                    params: [{input_ref: ref}],
                    service_ver: tag,
                    app_id: method,
                }]))
                .then(data => {
                    const jobId = data[0];
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
            const self = this;
            const genericClient = new GenericClient(this.eeURL, { token: this.token }, null, false);
            let skipLogLines = 0;
            let lastLogLine = null;
            const timeLst = function(event) {
                genericClient.sync_call("execution_engine2.check_job", [{"job_id": jobId}], (data) => {
                    const jobState = data[0];
                    if (jobState['running']) {
                        genericClient.sync_call("execution_engine2.get_job_logs",
                                [{"job_id": jobId, "skip_lines": skipLogLines}], (data2) => {
                            const logLines = data2[0].lines;
                            for (let i = 0; i < logLines.length; i++) {
                                lastLogLine = logLines[i];
                                if (lastLogLine.is_error) {
                                    console.error("Export logging: " + lastLogLine.line);
                                } else {
                                    console.log("Export logging: " + lastLogLine.line);
                                }
                            }
                            skipLogLines += logLines.length;
                            const complete = jobState['finished'];
                            const error = jobState['error'];
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
                                    const result = jobState['job_output']['result'];
                                    self.downloadUJSResults(result[0].shock_id, self.shockURL,
                                            wsObjectName);
                                }
                            } else {
                                const status = skipLogLines == 0 ? jobState['job_state'] :
                                    lastLogLine.line;
                                if (skipLogLines == 0)
                                    console.log("Export status: " + status);
                                self.showMessage('<img src="'+self.loadingImage+'" /> ' +
                                        'Export status: ' + status);
                            }
                        }, (data) => {
                            self.stopTimer();
                            console.log(data.error.message);
                            self.showError(data.error.message);
                        })
                    };
                }, (data) => {
                    self.stopTimer();
                    console.log(data.error.message);
                    self.showError(data.error.message);
                });
            };
            self.timer = setInterval(timeLst, 5000);
            timeLst();
        },

        downloadUJSResults: function(shockNode, remoteShockUrl, wsObjectName, unzip) {
        	const self = this;
			let elems = shockNode.split('/');
			if (elems.length > 1)
				shockNode = elems[elems.length - 1];
			elems = shockNode.split('?');
			if (elems.length > 0)
				shockNode = elems[0];
			console.log("Shock node ID: " + shockNode);
        	const shockClient = new ShockClient({url: self.shockURL, token: self.token});
        	const downloadShockNodeWithName = function(name) {
    			let urlSuffix = '/download?id='+shockNode+'&del=1';
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
            const self = this;
            if (self.useDynamicDownloadSupport) {
                const genericClient = new GenericClient(self.srvWizURL, {token: self.token}, null,
                        false);
                genericClient.sync_call("ServiceWizard.get_service_status",
                        [{module_name: 'NarrativeDownloadSupport', version: 'dev'}], (data) => {
                    const urlPrefix = data[0]['url'];
                    self.downloadFileInner(urlPrefix + urlSuffix);
                },
                (error)=> {
                    console.error(error);
                    self.showError(error);
                });
            } else {
                self.downloadFileInner(self.exportURL + urlSuffix);
            }
        },

        downloadFileInner: function(url) {
        	console.log("Downloading url=" + url);
        	const hiddenIFrameID = 'hiddenDownloader';
            let iframe = document.getElementById(hiddenIFrameID);
        	if (iframe === null) {
        		iframe = document.createElement('iframe');
        		iframe.id = hiddenIFrameID;
        		iframe.style.display = 'none';
        		document.body.appendChild(iframe);
        	}
        	iframe.src = url;
        },

        showMessage: function(msg) {
        	const self = this;
            self.$statusDivContent.empty();
            self.$statusDivContent.append(msg);
        },

        showError: function(msg) {
        	const self = this;
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
