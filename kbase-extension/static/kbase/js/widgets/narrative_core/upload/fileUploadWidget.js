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
            const uploadConfig = Config.get('upload');
            const $dropzoneElem = $(this.dropzoneTmpl({
                userInfo: this.userInfo,
                globusUrl: uploadConfig.globus_upload_url + '&destination_path=' + this.userInfo.user
            }));

            // there are two anchor elements with same class name .globus_linked.
            // One link takes the user to globus site,
            // and the other link takes user to how to link globus account.
            $dropzoneElem.find('globus_linked').click(e => {
                e.stopPropagation();
                e.preventDefault();

                if(e.target.href === uploadConfig.globus_upload_url + '&destination_path=' + this.userInfo.user) {
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
                    window.open(e.target.href, '_blank');
                }
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
                parallelUploads: uploadConfig.parallel_uploads,
                maxFilesize: uploadConfig.max_file_size,
                timeout: uploadConfig.timeout,
            })
                .on('totaluploadprogress', (progress) => {
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': progress + '%'});
                })
                .on('addedfile', (file) => {
                    $dropzoneElem.find('#global-info').css({'display': 'inline'});
                    $dropzoneElem.find('#upload-message').text(this.makeUploadMessage());

                    // If there is a button already in the area, it has to be removed,
                    // and appened to the new document when additional errored files are added.
                    if ($dropzoneElem.find('#clear-all-btn').length){
                        this.deleteClearAllButton();
                        $dropzoneElem.append(this.makeClearAllButton());
                    }

                })
                .on('success', (file, serverResponse) => {
                    $dropzoneElem.find('#upload-message').text(this.makeUploadMessage());
                    var $successElem = $(file.previewElement);
                    $successElem.find('#upload_progress_and_cancel').remove();
                    $successElem.find('#success_icon').css('display', 'inline');
                    $successElem.find('#success_message').css('display', 'inline');

                    this.removeProgressBar($dropzoneElem);
                    $(file.previewElement).fadeOut(1000, function() {
                        $(file.previewElement.querySelector('.btn')).trigger('click');
                    });
                })
                .on('sending', (file, xhr, data) => {
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
                })
                .on('reset', function() {
                    $('#clear-all-btn-container').remove();
                    $('#clear-all-btn').remove();
                    $dropzoneElem.find('#global-info').css({'display': 'none'});
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': '0%'});
                })
                .on('error', (erroredFile) => {
                    var $errorElem = $(erroredFile.previewElement);
                    $errorElem.css('color', '#DF0002');
                    $errorElem.find('#upload_progress_and_cancel').remove();
                    $errorElem.find('#error_icon').css('display', 'inline');

                    this.removeProgressBar($dropzoneElem);
                    let errorText = 'unable to upload file!';
                    if (erroredFile && erroredFile.xhr && erroredFile.xhr.responseText) {
                        errorText = erroredFile.xhr.responseText;
                    }
                    $dropzoneElem.find('#error_message').text('Error: ' + errorText);

                    // Check to see if there already a button in the dropzone area
                    if (!$dropzoneElem.find('#clear-all-btn').length){
                        $dropzoneElem.append(this.makeClearAllButton());
                    }
                });
        },

        makeClearAllButton: function() {
            var $clearAllBtn = $('<button>')
                .text('Clear All')
                .addClass('btn__text clear-all-dropzone')
                .attr('aria-label', 'clear all errored files from the dropzone')
                .attr('id', 'clear-all-btn')
                .click(function(){
                    this.dropzone.removeAllFiles();
                    this.deleteClearAllButton();
                }.bind(this));

            var $buttonContainer = $('<div>')
                .attr('id', 'clear-all-btn-container')
                .addClass('text-center')
                .append($clearAllBtn);

            return $buttonContainer;
        },

        deleteClearAllButton: function() {
            $('#clear-all-btn-container').remove();
            $('#clear-all-btn').remove();
        },

        removeProgressBar: function($dropzoneElem) {
            if (this.dropzone.getQueuedFiles().length === 0 &&
            this.dropzone.getUploadingFiles().length === 0) {
                $($dropzoneElem.find('#total-progress')).fadeOut(1000, function() {
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': '0%'});
                });
            }
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
