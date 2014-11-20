/**
 * KBase widget to upload file content into shock node.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeParameterFileInput',
        parent: "kbaseNarrativeParameterInput",
        version: '1.0.0',
        options: {
            shockUrl: 'https://kbase.us/services/shock-api/',
            ujsUrl: 'https://kbase.us/services/userandjobstate/',
            fullShockSearchToResume: false
        },
        wrongToken: false,
        token: null,
        shockNodeId: null,
        fileName: null,
        percentText: null,
        uploadIsReady: false,
        enabled: true,
        locked: false,
        required: true,
        rowDivs: null,
        fakeButton: null,
        inSelectFileMode: true,
        cancelUpload: false,

        render: function() {
        	if (!this.token) {
        		this.wrongToken = true;
        		return;
        	}
            var self = this;
            var spec = self.spec;

            self.rowDivs = [];
            self.required = true;
            if (spec.optional) {
                self.required = false;
            }

        	var pref = this.uuid();
            //var div = this.$elem;
        	
            var tbl = $('<table style="border: 0px; margin: 0px; cellpadding: 0px; cellspacing: 0px;"/>');
            //div.append(tbl);
            var tr = $('<tr/>');
            var cellCss = { 'border' : 'none', 'vertical-align' : 'middle' };
            tr.css(cellCss);
            tbl.append(tr);
            			
            this.fileName = $('<input readonly>')
            	.addClass('form-control')
            	.css({'width' : '100%'})
            	.attr('type', 'text');

            this.percentText = $('<input readonly>')
            	.addClass('form-control')
            	.css({'width' : '50px', 'padding': '0px', 'text-align': 'center'})
            	.attr('type', 'text');

            // create a file upload button and hide it and store it
            var realButton = document.createElement('input');
            realButton.setAttribute('type', 'file');
            realButton.setAttribute('style', 'display: none;');
            realButton.addEventListener('change', function() { 
            	var fileName = $(realButton).val();
            	if (fileName && fileName.length > 0)
            		self.fileSelected(self.fileName, self.percentText, realButton);
            });
            realButton.uploader = this;
            //this.fileBrowse = realButton;
            this.$elem.append(realButton);
            
            var td = $('<td/>');
            td.css(cellCss);
            td.css({'width' : '70%', 'padding' : '0px'});
            tr.append(td);
            td.append(this.fileName);
            
            // create the visible upload button
            this.fakeButton = document.createElement('button');
            this.fakeButton.setAttribute('class', 'btn btn-primary');
            this.selectFileMode(true);
            this.fakeButton.fb = realButton;
            this.fakeButton.addEventListener('click', function() {
            	if (self.locked || !self.enabled)
            		return;
            	if (self.inSelectFileMode) {
            		$(this.fb).val("");
            		this.fb.click();
            	} else {
            		self.cancelUpload = true;
                    self.selectFileMode(true);
            	}
            });
            $(this.fakeButton).css({"width": "90px"});
            var td2 = $('<td/>');
            td2.css(cellCss);
            td2.css({'width' : '90px', 'padding' : '0px'});
            tr.append(td2);
            td2.append(this.fakeButton);

            var td3 = $('<td/>');
            td3.css(cellCss);
            td3.css({'width' : '50px', 'padding' : '0px'});
            tr.append(td3);
            td3.append(this.percentText);
            
            var $feedbackTip = $("<span>").css({"vertical-align":"middle"}).removeClass();
            if (self.required) {
                $feedbackTip.addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
            }

            var nameColClass  = "col-md-2";
            var inputColClass = "col-md-5";
            var hintColClass  = "col-md-5";

            var $row = $('<div>').addClass("row kb-method-parameter-row")
            	.hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
            var $nameCol = $('<div>').addClass(nameColClass).addClass("kb-method-parameter-name")
            	.append(spec.ui_name);
            var $inputCol = $('<div>').addClass(inputColClass).addClass("kb-method-parameter-input")
            	.append($('<div>').css({"width":"100%","display":"inline-block"}).append(tbl))
            	.append($('<div>').css({"display":"inline-block", "height": "34px", "vertical-align":"top"}).append($feedbackTip));
            var $hintCol = $('<div>').addClass(hintColClass).addClass("kb-method-parameter-hint")
            	.append(spec.short_hint);
            $row.append($nameCol).append($inputCol).append($hintCol);

            var $errorPanel = $('<div>').addClass("kb-method-parameter-error-mssg").hide();
            var $errorRow = $('<div>').addClass('row')
            	.append($('<div>').addClass(nameColClass))
            	.append($errorPanel.addClass(inputColClass));

            self.$mainPanel.append($row);
            self.$mainPanel.append($errorRow);
            self.rowDivs.push({$row:$row, $error:$errorPanel, $feedback:$feedbackTip});
            return this;
        },
        
        selectFileMode: function(inSelectFileMode) {
            this.inSelectFileMode = inSelectFileMode;
            this.fakeButton.innerHTML = inSelectFileMode ? "Select file" : "Cancel";
        },
        
        fileSelected: function (nameText, prcText, realButton) {
        	if (realButton.files.length != 1)
        		return;
            var self = this;
            var prevShockNodeId = self.shockNodeId;
            self.shockNodeId = null;
            self.uploadIsReady = false;
    		self.isValid();
        	// get the selected file
        	var file = realButton.files[0];
        	self.fileName.val(file.name);
    		prcText.val("?..%");
    		var ujsKey = "File:"+file.size+":"+file.lastModifiedDate.getTime()+":"+file.name;
            var ujsClient = new UserAndJobState(self.options.ujsUrl, {'token': self.token});
            ujsClient.get_has_state("ShockUploader", ujsKey, 0, function(data) {
    			var value = data[1];
    			processAfterNodeCheck(value != null ? value : prevShockNodeId);
    		}, function(error) {
    			processAfterNodeCheck(prevShockNodeId);
    		});
    		
            function processAfterNodeCheck(storedShockNodeId) {
            	var shockClient = new ShockClient({url: self.options.shockUrl, token: self.token});
            	self.selectFileMode(false);
            	self.cancelUpload = false;
            	shockClient.upload_node(file, storedShockNodeId, self.options.fullShockSearchToResume, function(info) {
            		if (info.uploaded_size) {
            			var shockNodeWasntDefined = self.shockNodeId == null || self.shockNodeId !== info['node_id'];
            			if (shockNodeWasntDefined) {
            				self.shockNodeId = info['node_id'];
            				ujsClient.set_state("ShockUploader", ujsKey, self.shockNodeId, function(data) {
            	    		}, function(error) {
            	            	console.log("Error saving shock node " + self.shockNodeId + " into UJS:");
            	    			console.log(error);
            	    		});
            			}
            			if (info.uploaded_size >= info.file_size) {
            				self.uploadIsReady = true;
            				self.isValid();
            				self.selectFileMode(true);
            			}
            			var percent = "" + (Math.floor(info.uploaded_size * 1000 / info.file_size) / 10);
            			if (percent.indexOf('.') < 0)
            				percent += ".0";
            			prcText.val(percent + "%");
            			self.isValid();
            		}
            	}, function(error) {
            		self.selectFileMode(true);
            		alert("Error: " + error);
            	}, function() {
            		return self.cancelUpload;
            	});
            }
        },
        
        getShockNodeId: function() {
        	return this.shockNodeId;
        },
        
        isUploadReady: function() {
        	return this.uploadIsReady;
        },
        
        isValid: function() {
            var self = this;
            var errorDetected = false;
            var errorMessages = [];
            var pVal = self.getParameterValue();
            if (self.enabled && self.required && !pVal) {
            	self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
            	self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
            	self.rowDivs[0].$feedback.show();
            	self.rowDivs[0].$error.hide();
            	errorDetectedHere = true;
            	errorMessages.push("required field "+self.spec.ui_name+" missing.");
            } else {
            	self.rowDivs[0].$row.removeClass("kb-method-parameter-row-error");
            	self.rowDivs[0].$error.hide();
            	self.rowDivs[0].$feedback.removeClass();
            	if (pVal)
            		self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');
            }
            return {isValid: !errorDetected, errormssgs:errorMessages};
        },
        
        getParameterValue: function() {
            var ret = this.uploadIsReady ? this.shockNodeId : null;
            return ret ? ret : "";
        },

        getState: function() {
            return [[this.shockNodeId ? this.shockNodeId : "", this.fileName.val(), this.uploadIsReady, this.percentText.val()]];
        },

        loadState: function(state) {
            if (!state)
                return;
            if (!$.isArray(state))
            	return;
            this.shockNodeId = state[0][0];
            if (this.shockNodeId === "")
            	this.shockNodeId = null;
            this.fileName.val(state[0][1]);
            this.uploadIsReady = state[0][2];
            this.percentText.val(state[0][3]);
            this.isValid();
        },

        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            if (this.wrongToken)
            	this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            //this.render();
            return this;
        },
        
        disableParameterEditing: function() {
            this.enabled = false;
            if (this.rowDivs) {
                this.rowDivs[0].$feedback.removeClass();
            }
        },
        
        enableParameterEditing: function() {
            // enable the input
            this.enabled = true;
            this.isValid();
        },
        
        lockInputs: function() {
            if (this.enabled) {
            	this.locked = true;
            }
            if (this.rowDivs) {
                this.rowDivs[0].$feedback.removeClass();
            }
        },
        
        unlockInputs: function() {
            if (this.enabled) {
            	this.locked = false;
            }
            this.isValid();
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }
    });
})(jQuery);