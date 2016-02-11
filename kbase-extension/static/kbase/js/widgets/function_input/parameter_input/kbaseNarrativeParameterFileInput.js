/*global define*/
/*jslint white: true*/
/**
 * KBase widget to upload file content into shock node.
 */
define(['jquery',
        'narrativeConfig',
        'kbwidget',
        'kbaseNarrativeParameterInput'],
function($, Config) {
    'use strict';
    $.KBWidget({
        name: 'kbaseNarrativeParameterFileInput',
        parent: "kbaseNarrativeParameterInput",
        version: '1.0.0',
        options: {
            isInSidePanel: false,
            shockUrl: Config.url('shock'),
            ujsUrl: Config.url('user_and_job_state'),
            fullShockSearchToResume: false,
            serviceNameInUJS: "ShockUploader",
            maxFileStatesInUJS: 100,
            maxFileStateTime: 7 * 24 * 3600000	// in milliseconds
        },
        wrongToken: false,
        token: null,
        shockNodeId: null,
        fileName: null,
        percentText: null,
        uploadIsReady: false,
        uploadWasStarted: false,
        enabled: true,
        locked: false,
        required: true,
        rowDivs: null,
        fakeButton: null,
        inSelectFileMode: true,
        cancelUpload: false,
        changeFuncs: [],

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
            
            var tbl = $('<table style="border: 0px; margin: 0px; cellpadding: 0px; cellspacing: 0px; width: 100%;"/>');

            var tr = $('<tr/>');
            var cellCss = { 'border' : 'none', 'vertical-align' : 'middle' };
            tr.css(cellCss);
            tbl.append(tr);
            
            this.fileName = $('<input readonly>')
            	.addClass('form-control')
            	.css({'width' : '100%'})
            	.attr('type', 'text');
            var percentTextWidth = '50px';
            if (self.options.isInSidePanel)
                percentTextWidth = '100px';
            this.percentText = $('<input readonly>')
            	.addClass('form-control')
            	.css({'width' : percentTextWidth, 'padding': '0px', 'text-align': 'center'})
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
            
            // create the visible upload button
            this.fakeButton = document.createElement('button');
            this.fakeButton.setAttribute('class', 'kb-primary-btn');
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
                    self.uploadWasStarted = false;
            	}
            });
            $(this.fakeButton);
            var td2 = $('<td/>');
            td2.css(cellCss);
            tr.append(td2);
            td2.append(this.fakeButton);
	    
	    var td = $('<td/>');
            td.css(cellCss);
            td.css({'width' : '70%', 'padding' : '0px', 'margin':'2px'});
            tr.append(td);
            td.append(this.fileName);

            var td3 = $('<td/>');
            td3.css(cellCss);
            td3.css({'width' : percentTextWidth, 'padding' : '0px'});
            tr.append(td3);
            td3.append(this.percentText);
            
            var $feedbackTip = $("<span>").css({"vertical-align":"middle"}).removeClass();
            if (self.required) {
                $feedbackTip.addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
            }

            var nameColClass  = "col-md-2";
            var inputColClass = "col-md-5";
            var hintColClass  = "col-md-5";
            if (self.options.isInSidePanel) {
            	nameColClass = "col-md-12";
                inputColClass = "col-md-12";
                hintColClass  = "col-md-12";
            }

            var $row = $('<div>').addClass("row kb-method-parameter-row")
            	.hover(function(){$(this).toggleClass('kb-method-parameter-row-hover');});
            var $nameCol = $('<div>').addClass(nameColClass).addClass("kb-method-parameter-name")
            	.append(spec.ui_name);
            if (self.options.isInSidePanel)
            	$nameCol.css({'text-align': 'left', 'padding-left': '10px'});
            var $inputCol = $('<div>').addClass(inputColClass).addClass("kb-method-parameter-input")
            	.append($('<div>').css({"width":"100%","display":"inline-block"}).append(tbl))
            	.append($('<div>').css({"display":"inline-block", "height": "34px", "vertical-align":"top"}).append($feedbackTip));
            var $hintCol = $('<div>').addClass(hintColClass).addClass("kb-method-parameter-hint")
            	.append(spec.short_hint);
	    if (spec.description && spec.short_hint !== spec.description) {
                $hintCol.append($('<span>').addClass('fa fa-info kb-method-parameter-info')
                                .tooltip({title:spec.description, html:true, container: 'body'}));
            }
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
            this.fakeButton.innerHTML = inSelectFileMode ? "Select File" : "Cancel";
        },
        
        fileSelected: function (nameText, prcText, realButton) {
            if (realButton.files.length != 1)
        	return;
            var self = this;

            var file = realButton.files[0];
            self.fileName.val(file.name);
    	    self.onChange();
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

	    /*
	     * We're valid if we have a filename chosen. The upload
	     * does not have to have been completed which is why we
	     * are not looking at getParameterValue.
	     */
	     
            var pVal = this.fileName.val();

	    var valid = pVal != "";

	    var required = self.required;
	    self.updateValidCheckbox(valid, required);

	    /*
	     * For the purposes of the validity check here, an invalid
	     * but not required parameter is valid.
	     */

            return {isValid: valid || !required, errormssgs:errorMessages};
        },

	cancelImport: function() {
	    var self = this;
	    self.cancelUpload = true;
	},

	runImport: function() {
	    var self = this;
	    self.cancelUpload = false;
            var shockClient = new ShockClient({url: self.options.shockUrl, token: self.token});
	    var p = new Promise(function(resolve, reject) {

		/*
		 * Start the upload.
		 */
		
		var file = self.fakeButton.fb.files[0];

		if (!file)
		{
		    if (!self.required)
		    {
			console.log("Not uploading " + self.spec.id + " as it is not required and was not specified");
			resolve("not_required");
			return;
		    }
		    else
		    {
			reject("File not defined for parameter " + self.spec.id);
			return;
		    }
		}

		console.log("start upload on " + file.name);
		
		self.percentText.val("0.0 %");

		var ret_cb = function(retInfo) {
		    if (retInfo.uploaded_size)
		    {
			self.shockNodeId = retInfo['node_id'];
			if (retInfo.uploaded_size >= retInfo.file_size)
			{
			    self.percentText.val("100.0 %");
			    self.uploadIsReady = true;
			    self.uploadWasStarted = false;
			    self.onChange();
			    shockClient.change_node_file_name(self.shockNodeId, file.name, function(info) {},
							      function (error) {
								  console.log("error changing file name for shock node " + self.shockNodeId);
								  });
			    console.log("upload finished");
			    console.log(retInfo);
			    resolve(1);
			}
			else
			{
			    var percent = "" + (Math.floor(retInfo.uploaded_size * 1000 / retInfo.file_size) / 10);
            		    if (percent.indexOf('.') < 0)
            			percent += ".0";
			    self.percentText.val(percent + " %");
			}
			
		    }
		};
		var error_cb = function(errorInfo) {
		    console.log("upload error");
		    console.log(errorInfo);
		    reject(errorInfo);
		};
		var cancel_cb = function() {
		    return self.cancelUpload;
		};
		shockClient.upload_node(file, null, false, ret_cb, error_cb, cancel_cb);

	    });
	    return p;
	},

	updateValidCheckbox: function(valid, required) {
	    var self = this;
            if (valid) {
            	self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-accepted-glyph glyphicon glyphicon-ok');
            } else if (required) {
            	self.rowDivs[0].$feedback.removeClass().addClass('kb-method-parameter-required-glyph glyphicon glyphicon-arrow-left').prop("title","required field");
            }
            self.rowDivs[0].$feedback.show();
	},
        
        getParameterValue: function() {
            var ret = this.shockNodeId ? this.shockNodeId : ""
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
            var self = this;
            this.shockNodeId = state[0][0];
            if (this.shockNodeId === "")
            	this.shockNodeId = null;
            this.fileName.val(state[0][1]);
            this.uploadIsReady = state[0][2];
            this.percentText.val(state[0][3]);
            if (this.shockNodeId) {
            	var shockClient = new ShockClient({url: self.options.shockUrl, token: self.token});
            	shockClient.get_node(self.shockNodeId, function(info) {
            		if (!info)
                		self.shockNodeId = null;
                	self.isValid();                		
            	}, function(error) {
            		self.shockNodeId = null;
                	self.isValid();
            	});
            } else {
            	this.isValid();
            }
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

        addInputListener: function(onChangeFunc) {
            this.changeFuncs.push(onChangeFunc);
        },
        
        onChange: function() {
            var value = "" + this.shockNodeId + ", " + this.fileName.val() + ", " + this.uploadIsReady + ", " + this.percentText.val();
            for (var i in this.changeFuncs) {
                var changeFunc = this.changeFuncs[i];
                try {
                    changeFunc(value);
                } catch (ignore) {}
            }
        },

        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        },
        
        getUser: function() {
            var ret = null;
            if (!this.token)
            	return ret;
            var tokenParts = this.token.split("|");
            for (var i in tokenParts) {
            	var keyValue = tokenParts[i].split("=");
            	if (keyValue.length == 2 && keyValue[0] === "un")
            		ret = keyValue[1];
            }
            return ret;
        }
    });
});
