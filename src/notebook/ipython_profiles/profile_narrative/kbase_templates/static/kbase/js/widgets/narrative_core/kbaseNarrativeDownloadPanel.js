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
        
        downloaders: {  // type -> {name: ..., external_type: ...[, transform_options: ...]}
        	'KBaseGenomes.ContigSet': [{name: 'FASTA', external_type: 'FASTA.DNA.Assembly', transform_options: {"output_file_name": "fs.fasta"}}],
        	'KBaseGenomes.Genome': [{name: "GENBANK", external_type: 'Genbank.Genome', transform_options: {}}]
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
    		downloadPanel.append($('<button>').addClass('kb-data-list-btn')
                    .append('Download as JSON')
                    .click(function() {
                    	var url = self.exportURL + '/download?ws='+self.wsId+'&id='+self.objId+'&token='+self.token;
                    	self.downloadFile(url);
                    }));
    		var addDownloader = function(descr) {
    			downloadPanel.append($('<button>').addClass('kb-data-list-btn')
    					.append('Download as ' + descr.name)
    					.click(function() {
    						self.runDownloader(self.type, self.wsId, self.objId, descr);
    					}));
    		};
    		var downloaders = self.prepareDownloaders(self.type, self.wsId, self.objId);
    		for (var downloadPos in downloaders)
    			addDownloader(downloaders[downloadPos]);
            var modalLabel = "app-warning-modal-lablel-"+ self.uuid();
            self.$warningModal = $('<div tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="position:auto">').addClass("modal fade");
            self.getDownloadDialogEmptyPanel().append(self.$warningModal);
            self.$warningModalContent = $('<div>');
            var $stopButton = $('<button type="button" data-dismiss="modal">').addClass("btn").append("Cancel");
            $stopButton.click($.proxy(function(event) {
            	self.stopTimer();
            }, this));
            self.$warningModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">Download should start quickly...</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append(self.$warningModalContent)
                    ).append(
                        $('<div>').addClass('modal-footer').append($stopButton)
                    )
                ));
    		return this;
        },
        
        getDownloadDialogEmptyPanel: function() {
    		var downloadDialogDivId = "downloadDialogDivId";
    		var dialog = $('#' + downloadDialogDivId);
    		if (dialog) {
    			dialog.empty();
    		} else {
    			console.log("Creating download dialog element...");
    			dialog = $('<div id="' + downloadDialogDivId + '">');
                $('body').append(dialog);
    		}
    		return dialog;
        },
        
        prepareDownloaders: function(type, wsId, objId) {
        	var ret = this.downloaders[type];
        	return ret;
        },
        
        runDownloader: function(type, wsId, objId, descr) { // descr is {name: ..., external_type: ...[, transform_options: ...]}
            var self = this;
            self.showMessage('Download status: Preparing server-side data');
            self.$warningModal.modal('show');
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
            			self.waitForJob(jobId, objId);
            		}, this),
            		$.proxy(function(data) {
            			console.log(data.error.error);
            			self.showError(data.error.error);
            		}, this)
            );
        },

        waitForJob: function(jobId, wsObjectName) {
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
							console.log("Download job is done");
							// Starting download from Shock
							jobSrv.get_results(jobId, function(data) {
								self.$warningModal.modal('hide');
					        	self.$warningModal = null;
								console.log(data);
								self.downloadUJSResults(data, wsObjectName);
							}, function(data) {
            					console.log(data.error.message);
                    			self.showError(data.error.message);
							});
						} else {
							console.log(status);
	            			self.showError(status);
						}
					} else {
						console.log("Download status: " + status, true);
			            self.showMessage('Download status: ' + status);
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
        
        downloadUJSResults: function(ujsResults, wsObjectName) {
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
    				encodeURIComponent(self.token)+'&name='+encodeURIComponent(name);
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
            self.$warningModalContent.empty();
            self.$warningModalContent.append(msg);
        },
        
        showError: function(msg) {
        	var self = this;
        	if (self.$warningModal)
        		self.$warningModal.modal('hide');
        	self.$warningModal = null;
            var errorModalId = "app-error-modal-"+ self.uuid();
            var modalLabel = "app-error-modal-lablel-"+ self.uuid();
            var $errorModal =  $('<div id="'+errorModalId+'" tabindex="-1" role="dialog" aria-labelledby="'+modalLabel+'" aria-hidden="true" style="position:auto">').addClass("modal fade");
            $errorModal.append(
                $('<div>').addClass('modal-dialog').append(
                    $('<div>').addClass('modal-content').append(
                        $('<div>').addClass('modal-header kb-app-step-error-main-heading').append('<h4 class="modal-title" id="'+modalLabel+'">Problems in file download.</h4>')
                    ).append(
                       $('<div>').addClass('modal-body').append($('<div>').addClass("kb-app-step-error-mssg")
                			.append('Error: ' + msg))
                    ).append(
                        $('<div>').addClass('modal-footer').append(
                            $('<button type="button" data-dismiss="modal">').addClass("btn btn-default").append("Close"))
                    )
                ));
            self.getDownloadDialogEmptyPanel().append($errorModal);
            $errorModal.modal('show');
        },
        
        stopTimer: function() {
			if (this.timer != null) {
				clearInterval(this.timer);
				this.timer = null;
				console.log("Timer was stopped");
			}
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
