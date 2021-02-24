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
], (
    $,
    KBWidget,
    Config,
    Runtime,
    Dropzone,
    Handlebars,
    StagingServiceClient,
    DropzoneAreaHtml,
    DropFileHtml
) => {
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
            const globusUrlLinked = uploadConfig.globus_upload_url + '&destination_path=' + this.userInfo.user;
            const $dropzoneElem = $(this.dropzoneTmpl({
                userInfo: this.userInfo,
                globusUrl: globusUrlLinked
            }));

            // there are two anchor elements with same class name .globus_linked.
            // One link takes the user to globus site,
            // and the other link takes user to how to link globus account.
            $dropzoneElem.find('globus_linked').click(function(e) {
                this.uploadGlobusClickEvent(e, globusUrlLinked);
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
                userInfo: this.userInfo
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
                .on('success', (file) => {
                    const $successElem = $(file.previewElement);
                    $successElem.find('#upload_progress_and_cancel').hide();
                    $successElem.find('#dz_file_row_1').css({'display': 'flex', 'align-items': 'center'});
                    $successElem.find('#success_icon').css('display', 'flex');
                    $successElem.find('#success_message').css('display', 'inline');
                    $dropzoneElem.find('#upload-message').text(this.makeUploadMessage());

                    this.removeProgressBar($dropzoneElem);
                    $(file.previewElement).fadeOut(1000, () => {
                        $(file.previewElement.querySelector('.btn')).trigger('click');
                    });
                })
                .on('sending', (file, xhr, data) => {
                    $dropzoneElem.find('#global-info').css({'display': 'inline'});
                    //okay, if we've been given a full path, then we pull out the pieces (ignoring the filename at the end) and then
                    //tack it onto our set path, then set that as the destPath form param.
                    if (file.fullPath) {
                        const subPath = file.fullPath.replace(new RegExp('/' + file.name + '$'), '');
                        data.append('destPath', [this.path, subPath].join('/'));
                    }
                    //if we don't have a fullPath, then we're uploading a file and not a folder. Just use the current path.
                    else {
                        data.append('destPath', this.path);
                    }
                    $($dropzoneElem.find('#total-progress')).show();
                    $dropzoneElem.find('#upload-message').text(this.makeUploadMessage());
                })
                .on('reset', () => {
                    $('#clear-all-btn-container').remove();
                    $('#clear-all-btn').remove();
                    $dropzoneElem.find('#global-info').css({'display': 'none'});
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': '0'});
                })
                .on('error', (erroredFile) => {
                    const $errorElem = $(erroredFile.previewElement);
                    $errorElem.find('#upload_progress_and_cancel').hide();
                    $errorElem.find('#dz_file_row_1').css({'display': 'flex', 'align-items': 'center'});
                    $errorElem.css('color', '#DF0002');
                    $errorElem.find('#error_icon').css('display', 'flex');
                    this.removeProgressBar($dropzoneElem);

                    // Set error message
                    let errorText = 'unable to upload file!';
                    const $errorMessage = $errorElem.find('#error_message');

                    // I don't know how to determine if the file was too big other than looking at the preview message
                    if ($errorMessage.html().search('File is too big') !== -1){
                        errorText  = 'File size exceeds maximum of 20GB. Please ';
                        $errorMessage.text('Error: ' + errorText);
                        $errorMessage.append(this.makeGlobusErrorLink(globusUrlLinked));
                    } else if (erroredFile && erroredFile.xhr && erroredFile.xhr.responseText) {
                        errorText = erroredFile.xhr.responseText;
                        $errorMessage.text('Error: ' + errorText);
                    } else {
                        $errorMessage.text('Error: ' + errorText);
                    }

                    // Check to see if there already a button in the dropzone area
                    if (!$dropzoneElem.find('#clear-all-btn').length){
                        $dropzoneElem.append(this.makeClearAllButton());
                    }
                });
        },

        uploadGlobusClickEvent: function(e, globusUrlLinked) {
            e.stopPropagation();
            e.preventDefault();

            if(e.target.href === globusUrlLinked) {
                const stagingServiceClient = new StagingServiceClient({
                    root: this.stagingUrl,
                    token: Runtime.make().authToken()
                });
                const globusWindow = window.open('', 'dz-globus');
                globusWindow.document.write('<html><body><h2 style="text-align:center; font-family:\'Oxygen\', arial, sans-serif;">Loading Globus...</h2></body></html>');
                stagingServiceClient.addAcl()
                    .done(() => {
                        window.open($(e.target).attr('href'), 'dz-globus');
                        return true;
                    });
            } else {
                window.open(e.target.href, '_blank');
            }
        },

        makeClearAllButton: function() {
            const $clearAllBtn = $('<button>')
                .text('Clear All')
                .addClass('btn__text clear-all-dropzone')
                .attr('aria-label', 'clear all errored files from the dropzone')
                .attr('id', 'clear-all-btn')
                .click(()=> {
                    this.dropzone.removeAllFiles();
                    this.deleteClearAllButton();
                });

            const $buttonContainer = $('<div>')
                .attr('id', 'clear-all-btn-container')
                .addClass('text-center')
                .append($clearAllBtn);

            return $buttonContainer;
        },

        deleteClearAllButton: function() {
            $('#clear-all-btn-container').remove();
            $('#clear-all-btn').remove();
        },

        makeGlobusErrorLink: function(globusUrlLinked) {
            const url = 'https://docs.kbase.us/data/globus';

            const $globusErrorLink = $('<a>')
                .attr({
                    'id': 'globus_error_link',
                    'href': url,
                    'aria-label': 'opens new window to kbase globus upload docs'
                }).text('upload with Globus.')
                .click((e) => {
                    this.uploadGlobusClickEvent(e, globusUrlLinked);
                });

            if (this.userInfo.globusLinked){
                $globusErrorLink
                    .attr({
                        'href': globusUrlLinked,
                        'aria-label': 'opens new window to upload via globus'
                    });
            }

            return $globusErrorLink;
        },

        removeProgressBar: function($dropzoneElem) {
            if (!this.dropzone.getQueuedFiles().length &&
            !this.dropzone.getUploadingFiles().length) {
                $($dropzoneElem.find('#total-progress')).fadeOut(1000, () => {
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({'width': '0'});
                });
            }
        },

        makeUploadMessage: function() {
            if (!this.dropzone) {
                return 'No files uploading.';
            }
            const numUploading = this.dropzone.getUploadingFiles().length;
            const numQueued = this.dropzone.getQueuedFiles().length;
            if (numUploading === 0 && numQueued === 0) {
                return 'No files uploading.';
            }
            const queuedText = numQueued ? ('(' + numQueued + ' queued)') : '';
            const pluralFiles = numUploading > 1 ? 's' : '';
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
