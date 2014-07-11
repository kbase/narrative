/**
 * KBase widget to upload content.
 */
(function($, undefined) {
    $.KBWidget({
        name: 'UploadFileWidget',
        version: '1.0.0',
        options: {
            'callback': null,
            'url': 'https://kbase.us/services/invocation',
            'clearTarget': true,
            'buttonTitle': "upload",
            'showProgress': true,
            'externalProgressTarget': null,
            'auth': null,
            'div': null
        },
        init: function(options) {
            this._super(options);
            this.params = {};
            jQuery.extend(true, this.params, this.options, options);
            return this.render();
        },
        render: function() {
            // creater main comtainer
            var params = this.params;
            params.div = document.createElement('div');
            
            // create a file upload button and hide it and store it
            var realButton = document.createElement('input');
            realButton.setAttribute('type', 'file');
            realButton.setAttribute('style', 'display: none;');
            realButton.addEventListener('change', this.fileSelected);
            realButton.uploader = this;
            this.fileBrowse = realButton;
            params.div.appendChild(realButton);
            
            // create the visible upload button
            var fakeButton = document.createElement('button');
            fakeButton.setAttribute('class', 'btn');
            fakeButton.setAttribute('class', 'btn-info');
            fakeButton.innerHTML = params.buttonTitle;
            fakeButton.fb = realButton;
            fakeButton.addEventListener('click', function () {
            	this.fb.click();
            });
            params.div.appendChild(fakeButton);
            
            // check if we want a progress bar
            if (params.showProgress) {
                // aquire the target for the progress bar if it is external
                var pdiv;
                if (params.externalProgressTarget) {
                    if (typeof params.externalProgressTarget == 'string') {
                        pdiv = document.getElementById(params.externalProgressTarget);
                        if (typeof pdiv == 'undefined') {
                            console.log('error in uploader invocation: progress target div does not exist');
                            return 1;
                        }
                    } else if (typeof params.externalProgressTarget == 'undefined') {
                        console.log('error in uploader invocation: progress target div is undefined');
                        return 1;
                    } else if (! params.externalProgressTarget.hasOwnProperty('innerHTML')) {
                        console.log('error in uploader invocation: progress target div is not an HTML container element');
                        return 1;
                    }
                } else {
                    pdiv = document.createElement('div');
                    params.div.appendChild(pdiv);
                }
                this.progressDiv = pdiv;
            }
            
            // put container in cell
            this.$elem.append(params.div);
            return this;
        },
        fileSelected: function () {
        	// get the selected file
        	var file = this.files[0];
        	
        	// get the filereader
        	var fileReader = new FileReader();
        	fileReader.uploader = this.uploader;
        	fileReader.onerror = function (error) {
        		console.log(error);
        	};
            
            // we need the uploader
        	var ul = this.uploader;
        	
            // done callback
        	var done = function () {
        		ul.progressDiv.innerHTML = '\
<div class="alert alert-success" style="margin-top: 10px;">\
    <button type="button" class="close" data-dismiss="alert">&times;</button>\
    <strong>Success!</strong> - file \''+ul.fileBrowse.files[0].name+'\' uploaded successfully.\
</div>';
        		if (typeof ul.callback == "function") {
        		    ul.callback.call(null, {
        		        result: "ok",
        				error: null,
        				file: { name: ul.fileBrowse.files[0].name,
        						size: ul.fileBrowse.files[0].size,
        						type: ul.fileBrowse.files[0].type }
        			});
        		}
        	};

            // error callback
        	var error = function (error) {
        		ul.progressDiv.innerHTML = '\
<div class="alert alert-error" style="margin-top: 10px;">\
    <button type="button" class="close" data-dismiss="alert">&times;</button>\
    <strong>Error:</strong> - file \''+ul.fileBrowse.files[0].name+'\' failed to upload: '+error.statusText+'\
</div>';
        		if (typeof uploader.callback == "function") {
        		    ul.callback.call(null, {
        		        result: "error",
        				error: error.statusText,
        				file: { name: ul.fileBrowse.files[0].name,
        						size: ul.fileBrowse.files[0].size,
        						type: ul.fileBrowse.files[0].type }
        			});
        		}
        	};

        	// handle the file once loaded
        	fileReader.onload = function(e) {
        	    var data = e.target.result;
        		InvocationService(this.uploader.params.url, this.uploader.params.auth);
        		put_file(null, file.name, data, "/", done, error);
        	};

        	// initiate file reading
        	fileReader.readAsText(file);
        }
    });
})(jQuery);