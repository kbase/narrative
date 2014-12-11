/**
 * KBase widget to upload file content into shock node.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'kbaseShockFileUploader',
        parent: "kbaseAuthenticatedWidget",
        version: '1.0.0',
        options: {
            'url': 'https://kbase.us/services/shock-api/',
        },
        token: null,
        shockNodeId: null,
        uploadIsReady: false,
        init: function(options) {
            this._super(options);
            return this;
        },
        render: function() {
            var self = this;
        	var pref = this.uuid();
            var div = this.$elem;
        	
            var tbl = $('<table style="border: 0px; margin: 0px; cellpadding: 0px; cellspacing: 0px;"/>');
            div.append(tbl);
            var tr = $('<tr/>');
            var cellCss = { 'border' : 'none', 'vertical-align' : 'middle' };
            tr.css(cellCss);
            tbl.append(tr);
            			
            var nameText = $('<input>')
            	.addClass('form-control')
            	.css({'width' : '300px'})
            	.attr('type', 'text');

            var prcText = $('<input>')
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
            div.append(realButton);
            
            var td = $('<td/>');
            td.css(cellCss);
            td.css({'width' : '300px'});
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
            td = $('<td/>');
            td.css(cellCss);
            td.css({'width' : '60px'});
            tr.append(td);
            td.append(fakeButton);

            td = $('<td/>');
            td.css(cellCss);
            td.css({'width' : '45px'});
            tr.append(td);
            td.append(prcText);

            return this;
        },
        fileSelected: function (nameText, prcText, realButton) {
            var self = this;
            self.shockNodeId = null;
            self.uploadIsReady = false;
        	// get the selected file
        	var file = realButton.files[0];
        	console.log(file);
        	nameText.val(file.name);
        	
    		console.log("Before upload");
            var SHOCK = new ShockClient({ token: self.token, url: self.options.url });

            SHOCK.upload_node(file, function(info) {
            	if (info.uploaded_size) {
            		console.log(info);
            		self.shockNodeId = info['incomplete_id'];
            		if (info.uploaded_size >= info.file_size) {
                		self.uploadIsReady = true;
                		console.log("Finish");
            		}
            		var percent = Math.floor(info.uploaded_size * 1000 / info.file_size) / 10;
            		prcText.val(percent + "%");
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
        
        loggedInCallback: function(event, auth) {
            this.token = auth.token;
            this.render();
            return this;
        },

        loggedOutCallback: function(event, auth) {
            this.token = null;
            this.render();
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