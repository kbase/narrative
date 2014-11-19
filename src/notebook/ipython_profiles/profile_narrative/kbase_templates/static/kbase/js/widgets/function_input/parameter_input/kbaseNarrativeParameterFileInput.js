/**
 * KBase widget to upload file content into shock node.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'kbaseNarrativeParameterFileInput',
        parent: "kbaseNarrativeParameterInput",
        version: '1.0.0',
        options: {
            'url': 'https://kbase.us/services/shock-api/',
        },
        wrongToken: false,
        token: null,
        shockNodeId: null,
        uploadIsReady: false,
        enabled: true,
        required: true,
        rowDivs: null,

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
            			
            var nameText = $('<input>')
            	.addClass('form-control')
            	.css({'width' : '100%'})
            	.attr('type', 'text');

            var prcText = $('<input readonly>')
            	.addClass('form-control')
            	.css({'width' : '45px', 'padding': '2px'})
            	.attr('type', 'text');

            // create a file upload button and hide it and store it
            var realButton = document.createElement('input');
            realButton.setAttribute('type', 'file');
            realButton.setAttribute('style', 'display: none;');
            realButton.addEventListener('change', function() { 
            	self.fileSelected(nameText, prcText, realButton); 
            });
            realButton.uploader = this;
            //this.fileBrowse = realButton;
            this.$elem.append(realButton);
            
            var td = $('<td/>');
            td.css(cellCss);
            td.css({'width' : '70%', 'padding' : '0px'});
            tr.append(td);
            td.append(nameText);
            
            // create the visible upload button
            var fakeButton = document.createElement('button');
            fakeButton.setAttribute('class', 'btn btn-primary');
            fakeButton.innerHTML = "Select file";
            fakeButton.fb = realButton;
            fakeButton.addEventListener('click', function () {
            	this.fb.click();
            });
            var td2 = $('<td/>');
            td2.css(cellCss);
            td2.css({'width' : '60px', 'padding' : '0px'});
            tr.append(td2);
            td2.append(fakeButton);

            var td3 = $('<td/>');
            td3.css(cellCss);
            td3.css({'width' : '45px', 'padding' : '0px'});
            tr.append(td3);
            td3.append(prcText);
            
            var $feedbackTip = $("<span>").removeClass();
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
            	.append($('<div>').css({"display":"inline-block"}).append($feedbackTip));
            var $hintCol  = $('<div>').addClass(hintColClass).addClass("kb-method-parameter-hint")
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
        
        fileSelected: function (nameText, prcText, realButton) {
            var self = this;
            self.shockNodeId = null;
            self.uploadIsReady = false;
    		self.isValid();
        	// get the selected file
        	var file = realButton.files[0];
        	console.log(file);
        	nameText.val(file.name);
        	
    		console.log("Before upload");
    		prcText.val("?..%");
            var SHOCK = new ShockClient({ token: self.token, url: self.options.url });

            SHOCK.upload_node(file, function(info) {
            	if (info.uploaded_size) {
            		console.log(info);
            		self.shockNodeId = info['incomplete_id'];
            		if (info.uploaded_size >= info.file_size) {
                		self.uploadIsReady = true;
                		self.isValid();
                		console.log("Finish");
            		}
            		var percent = Math.floor(info.uploaded_size * 1000 / info.file_size) / 10;
            		prcText.val(percent + "%");
            		self.isValid();
            	}
            }, function(error) {
            	console.log("Shock error:");
            	console.log(error);
            	alert("Error: " + error);
            });
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
            return this.uploadIsReady ? this.shockNodeId : null;
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
        
        uuid: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, 
                function(c) {
                    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
        }
    });
})(jQuery);