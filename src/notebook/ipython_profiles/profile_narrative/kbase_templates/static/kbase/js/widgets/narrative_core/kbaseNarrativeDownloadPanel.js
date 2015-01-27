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
        	'KBaseGenomes.Genome': []
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
            console.log(downloadPanel);
    		downloadPanel.append($('<button>').addClass('kb-data-list-btn')
                    .append('Download as JSON')
                    .click(function() {
                    	var url = self.exportURL + '/download?ws='+self.wsId+'&id='+self.objId+'&token='+self.token;
                    	console.log("Download url=" + url);
                    	var hiddenIFrameID = 'hiddenDownloader';
                        var iframe = document.getElementById(hiddenIFrameID);
                    	if (iframe === null) {
                    		iframe = document.createElement('iframe');
                    		iframe.id = hiddenIFrameID;
                    		iframe.style.display = 'none';
                    		document.body.appendChild(iframe);
                    	}
                    	iframe.src = url;
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
    		return this;
        },
        
        prepareDownloaders: function(type, wsId, objId) {
        	var ret = this.downloaders[type];
        	return ret;
        },
        
        runDownloader: function(type, wsId, objId, descr) { // descr is {name: ..., external_type: ...[, transform_options: ...]}
        	var transform_options = descr.transform_options;
        	if (!transform_options)
        		transform_options = {};
        	var args = {external_type: descr.external_type, kbase_type: type, workspace_name: wsId, object_name: objId, optional_arguments: {transform: transform_options}};
    		console.log("Downloader data to be sent to transform service:");
    		console.log(JSON.stringify(args));
            var jobSrv = new UserAndJobState(this.ujsURL, {token: this.token});
            var transformSrv = new Transform(this.transformURL, {token: this.token});
            var self = this;
            transformSrv.download(args,
            		$.proxy(function(data) {
            			console.log(data);
            			var jobId = data[1];
            			var timeLst = function(event) {
            				jobSrv.get_job_status(jobId, function(data) {
            					console.log(data);
            					var status = data[2];
            					var complete = data[5];
            					var wasError = data[6];
            					if (complete === 1) {
            						self.stopTimer();
            						if (wasError === 0) {
            							console.log("Download job is done");
            							// Starting download from Shock
            							jobSrv.get_job_info(jobId, function(data) {
            								console.log(data);
            								var jobResults = data[13];
            								console.log(jobResults);
            							}, function(data) {
                        					console.log(data.error.message);
            							});
            						} else {
            							console.log(status);
            						}
            					} else {
            						console.log("Download job has status: " + status, true);
            					}
            				}, function(data) {
            					self.stopTimer();
            					console.log(data.error.message);
            				});
            			};
            			self.timer = setInterval(timeLst, 5000);
            			timeLst();
            		}, this),
            		$.proxy(function(error) {
            			console.log(error);
            		}, this)
            );
        },

        stopTimer: function() {
        	var self = this;
			if (self.timer != null) {
				clearInterval(self.timer);
				self.timer = null;
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
