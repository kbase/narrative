define([
    'jquery',
    'kbwidget',
    'narrativeConfig',
    'common/runtime',
    'dropzone',
    'handlebars',
    'StagingServiceClient',
    'text!kbase/templates/data_staging/dropzone_area.html',
    'text!kbase/templates/data_staging/dropped_file.html'
], function(
    $,
    KBWidget,
    Config,
    Runtime,
    Dropzone,
    Handlebars,
    StagingServiceClient,
    DropzoneAreaHtml,
    DropFileHtml
) {
    'use strict';
    return new KBWidget({
        name: 'fileUploadWidget',

        init: function(options) {
            this._super(options);
            this.dropzoneTmpl = Handlebars.compile(DropzoneAreaHtml);
            this.dropFileTmpl = Handlebars.compile(DropFileHtml);
            this.path = options.path;
            this.stagingUrl = Config.url('staging_api_url');
            this.userInfo = options.userInfo;
            this.render();
            return this;
        },

        render: function() {
            var $dropzoneElem = $(this.dropzoneTmpl({userInfo: this.userInfo}));
            $dropzoneElem.find('#clear-completed > button').click(function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.dropzone.removeAllFiles();
                $dropzoneElem.find('#clear-completed').css({'display': 'none'});
            }.bind(this));

            // $dropzoneElem.find('a').click((e) => {
            //     e.stopPropagation();
            // });
            
            // there are two anchor elements with same class name .globus_link.
            // One link takes the user to globus site, 
            // and the other link takes user to how to link globus account. 
            $dropzoneElem.find('a.globus_link').click((e) => {
                e.stopPropagation();
                e.preventDefault();
                if((e.target.href).includes("app.globus.org")) {
                    let stagingServiceClient = new StagingServiceClient({
                        root: this.stagingUrl,
                        token: Runtime.make().authToken()
                    });
                    var globusWindow = window.open('', 'dz-globus');
                    globusWindow.document.write('<html><body><h2 style="text-align:center; font-family:\'Oxygen\', arial, sans-serif;">Loading Globus...</h2></body></html>');
                    stagingServiceClient.addAcl()
                        .done(() => {
                            window.open($(e.target).attr('href'), 'dz-globus');
                            return true;
                        });
                } else {
                    window.open(e.target.href, "_blank");
                };
            });

            this.$elem.append($dropzoneElem);
            this.dropzone = new Dropzone($dropzoneElem.get(0), {
                url: this.stagingUrl + '/upload',
                accept: function(file, done) {
                    done();
                },
                headers: {'Authorization': Runtime.make().authToken()},
                paramName: 'uploads',
                previewTemplate: this.dropFileTmpl(),
                autoProcessQueue: true,
                parallelUploads: 10,
                maxFilesize: 20480  //20GB
            })
                .on('totaluploadprogress', function(progress) {
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': progress + '%'});
                }.bind(this))
                .on('addedFile', function(file) {
                    $dropzoneElem.find('#global-info').css({'display': 'inline'});
                    $dropzoneElem.find('#upload-message').text(this.makeUploadMessage());
                }.bind(this))
                .on('success', function(file, serverResponse) {
                    $dropzoneElem.find('#clear-completed').css({'display': 'inline'});
                    $dropzoneElem.find('#upload-message').text(this.makeUploadMessage());
                    file.previewElement.querySelector('#status-message').textContent = 'Completed';
                    file.previewElement.querySelector('.progress').style.display = 'none';
                    file.previewElement.querySelector('#status-message').style.display = 'inline';
                    $(file.previewElement.querySelector('.fa-ban')).removeClass('fa-ban').addClass('fa-check');
                    $(file.previewElement.querySelector('.btn-danger')).removeClass('btn-danger').addClass('btn-success');
                    if (this.dropzone.getQueuedFiles().length === 0 &&
                        this.dropzone.getUploadingFiles().length === 0) {
                        $($dropzoneElem.find('#total-progress')).fadeOut(1000, function() {
                            $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': '0%'});
                        });
                    }
                    $(file.previewElement).fadeOut(1000, function() {
                        $(file.previewElement.querySelector('.btn')).trigger('click');
                    });
                }.bind(this))
                .on('sending', function(file, xhr, data) {

                    $dropzoneElem.find('#global-info').css({'display': 'inline'});
                    //okay, if we've been given a full path, then we pull out the pieces (ignoring the filename at the end) and then
                    //tack it onto our set path, then set that as the destPath form param.
                    if (file.fullPath) {
                        var subPath = file.fullPath.replace(new RegExp('/' + file.name + '$'), '');
                        data.append('destPath', [this.path, subPath].join('/'));
                    }
                    //if we don't have a fullPath, then we're uploading a file and not a folder. Just use the current path.
                    else {
                        data.append('destPath', this.path);
                    }
                    $($dropzoneElem.find('#total-progress')).show();
                    $dropzoneElem.find('#upload-message').text(this.makeUploadMessage());
                }.bind(this))
                .on('reset', function() {
                    $dropzoneElem.find('#global-info').css({'display': 'none'});
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': '0%'});
                });
        },

        makeUploadMessage: function() {
            if (!this.dropzone) {
                return 'No files uploading.';
            }
            var numUploading = this.dropzone.getUploadingFiles().length;
            var numQueued = this.dropzone.getQueuedFiles().length;
            if (numUploading === 0 && numQueued === 0) {
                return 'No files uploading.';
            }
            var queuedText = numQueued ? ('(' + numQueued + ' queued)') : '';
            var pluralFiles = numUploading > 1 ? 's' : '';
            return [
                'Uploading ',
                numUploading,
                ' file',
                pluralFiles,
                ' ',
                queuedText,
                ' to ',
                this.getPath()
            ].join('');
        },

        setPath: function(path) {
            this.path = path;
        },

        getPath: function() {
            return this.path;
        },

    });
});
