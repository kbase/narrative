define([
    'jquery',
    'kbwidget',
    'filesize',
    'narrativeConfig',
    'common/runtime',
    'widgets/common/jQueryUtils',
    'dropzone',
    'handlebars',
    'StagingServiceClient',
    'util/bootstrapDialog',
    'text!kbase/templates/data_staging/dropzone_area.html',
    'text!kbase/templates/data_staging/dropped_file.html',
], (
    $,
    KBWidget,
    filesize,
    Config,
    Runtime,
    jQueryUtils,
    Dropzone,
    Handlebars,
    StagingServiceClient,
    BootstrapDialog,
    DropzoneAreaHtml,
    DropFileHtml
) => {
    'use strict';

    const { $el } = jQueryUtils;

    const GLOBUS_DOC_URL = 'https://docs.kbase.us/data/globus';

    function formatFileSize(fileSizeInBytes) {
        return filesize.filesize(fileSizeInBytes, {
            base: 10,
            locale: 'en-US',
            localeOptions: {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            },
        });
    }

    return new KBWidget({
        name: 'fileUploadWidget',

        init: function (options) {
            this._super(options);
            this.dropzoneTmpl = Handlebars.compile(DropzoneAreaHtml);
            this.dropFileTmpl = Handlebars.compile(DropFileHtml);
            this.path = options.path;
            this.stagingUrl = Config.url('staging_api_url');
            this.userInfo = options.userInfo;

            if (typeof options.maxFileSize === 'undefined') {
                throw new Error('The "maxFileSize" option is required');
            }

            this.setMaxFileSize(options.maxFileSize);

            const runtime = Runtime.make();
            this.stagingServiceClient = new StagingServiceClient({
                root: Config.url('staging_api_url'),
                token: runtime.authToken(),
            });

            this.render();
            return this;
        },

        /**
         * Give a file size in bytes, set the file size for the dropzone
         *  widget in mibibytes (MiB).
         *
         * @param {number} maxFileSize Maximum file size in bytes
         */
        setMaxFileSize: function (maxFileSize) {
            this.maxFileSizeBytes = maxFileSize;
            this.maxFileSizeMiB = maxFileSize / Math.pow(1024, 2);
            if (this.dropzone) {
                this.dropzone.options.maxFilesize = this.maxFileSizeMiB;
            }
        },

        /**
         * Given a message, and optionally additional content, display a compact error
         * component with a pre-set title.
         *
         * This is specifically for displaying within the dropzone widget and is not a
         * general purpose, or luxuriant, error display widget.
         *
         * @param {string} message A message to display
         * @param {JQuery} $content (optional_ Extended message content to display
         * @returns {JQuery} A jquery object continaing the error message ready for display
         */
        $renderError: function (message, $content) {
            const $messageColumn = $el('div').addClass('-body').append($el('div').text(message));

            if ($content) {
                $messageColumn.append($el('div').append($content));
            }

            return $el('div')
                .addClass('kb-file-upload-widget__error-message')
                .append($el('div').addClass('-title').append($el('b').text('Error!')))
                .append($messageColumn);
        },

        /**
         * Attempts to open a separate window which navigates to Globus transfer,
         * where the user may be able to transfer large files to their staging
         * directory.
         *
         * Before opening the window, a dialog is displayed alerting them to this,
         * and showing a spinner as there is an initial call to the staging service
         * to attempt to add Globus access to the user's staging directory.
         *
         * If that access request fails, an error message is displayed in the dialog.
         *
         * This is a change from a previous implementation in which the window
         * was opened unconditionally, and would hang without any indication of
         * an issue, if the acl call throw an error.
         */
        onUploadWithGlobus: function () {
            // Do a dialog, THEN open a window if that works.
            // Otherwise, we don't really have a good way of showing an
            // error message, or a good ui for waiting for the staging
            // service call.
            const $body = $el('div')
                .append($el('span').text('Redirecting to Globus ...'))
                .append($el('span').addClass('fa fa-spinner fa-spin fa-fw'));

            const dialog = new BootstrapDialog({
                title: 'Globus Transfer',
                body: $body,
            });

            dialog.onShown(async () => {
                try {
                    await this.stagingServiceClient.addAcl();
                } catch (xhr) {
                    // The exception is actually an XHR object, a bit unusual, as
                    // exceptions should really be a kind of Error, but it works.
                    $body.html(
                        $el('div')
                            .addClass('alert alert-danger')
                            .append($el('p').append($el('b').text('Error Connecting Globus! ')))
                            .append($el('p').text(xhr.responseText))
                    );

                    dialog.setButtons([
                        $el('button')
                            .addClass('btn btn-default')
                            .text('Close')
                            .click(() => {
                                dialog.hide();
                            }),
                    ]);
                }

                dialog.hide();
                window.open(this.makeGlobusUploadURL(), 'dz-globus');
            });

            dialog.show();
        },

        /**
         * To be used in the case of files too large for the upload
         * widget or service, provides either a link to help the user use
         * Globus for the upload.
         *
         * If the user is known to have a Globus account, the link acts as a button
         * to open a new window which leads to Globus itself.
         * Otherwise, the link opens a new browser window to the KBase documentation
         * covering Globus upload
         *
         * @returns {JQuery} a jquery object containing a link
         */
        $renderGlobusUploadLink: function () {
            if (this.userInfo.globusLinked) {
                return $el('div')
                    .addClass('kb-file-upload-widget__globus-upload-link-container')
                    .append($el('span').text('You may '))
                    .append(
                        $el('button')
                            .attr({
                                id: 'globus_error_link',
                                // href: '#',
                                'aria-label': 'opens new window to upload via Globus',
                            })
                            // Note overrides in fileUploadWidget.css
                            .addClass('btn btn-link kb-file-upload-widget__globus_error_link')
                            .text('upload large files with Globus')
                            .click((e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                this.onUploadWithGlobus();
                            })
                    );
            }

            return $el('a')
                .attr({
                    id: 'globus_error_link',
                    href: GLOBUS_DOC_URL,
                    target: '_blank',
                    'aria-label': 'opens new window to KBase Globus upload docs',
                })
                .text('Learn how to upload large files with Globus');
        },

        /**
         * Creates and returns a button which, when clicked, will remove all dropzone-listed
         * files which are in an error state.
         *
         * The dropzone widget lists files which are either queued for, or in the process of,
         * uploading, and removes them when they are finished. However, if a file entry is
         * in an error state, for instance if it is larger than the max file size, it will
         * persist in the list. This button allows the user to clear these error entries out
         * of the list.
         *
         * Note that the button will remove itself from the display after the file entries
         * are removed.
         *
         * @returns {JQuery} A jquery object containing a button.
         */
        $renderClearAllButton: function () {
            const $clearAllBtn = $('<button>')
                .text('Clear Errors')
                .addClass('dz-clear-all__button')
                .attr('aria-label', 'clear all errored files from the dropzone')
                .attr('id', 'clear-all-btn')
                .click((e) => {
                    e.stopPropagation();
                    this.dropzone.removeAllFiles();
                    this.deleteClearAllButton();
                });

            return $('<div>')
                .attr('id', 'clear-all-btn-container')
                .addClass('text-center kb-file-upload-widget__clear-all-btn-container')
                .append($clearAllBtn);
        },

        /**
         * Simply removes the "clear all" button.
         */
        deleteClearAllButton: function () {
            $('#clear-all-btn-container').remove();
            $('#clear-all-btn').remove();
        },

        /**
         * Removes the progress bar from the display if there are no files current
         * uploading or queued for uploading.
         *
         */
        maybeRemoveProgressBar: function () {
            if (!this.isUploading()) {
                $(this.$dropzoneElem.find('#total-progress')).fadeOut(1000, () => {
                    $(this.$dropzoneElem.find('#total-progress .progress-bar'));
                });
            }
        },

        /**
         * Determines whether any files are currently uploading or queued for uploading.
         *
         * Handy for bits of the ui which need to conditionally show or hide content based
         * on whether files are uploading.
         *
         * @returns {boolean} True if files are uploading, false otherwise.
         */
        isUploading: function () {
            if (!this.dropzone) {
                return false;
            }
            const numUploading = this.dropzone.getUploadingFiles().length;
            const numQueued = this.dropzone.getQueuedFiles().length;
            return numUploading + numQueued > 0;
        },

        /**
         * Sets the current path within the user's staging directory.
         *
         * This is setable from outside this widget, in the staging area viewer, when the
         * user changes direcotires.
         *
         * @param {string} path The path within the user's staging directory
         */
        setPath: function (path) {
            this.path = path;
        },

        /**
         * Returns the current path within the user's staging folder.
         *
         * @returns {string}
         */
        getPath: function () {
            return this.path;
        },

        /**
         * Makes a url to globus for the current user.
         *
         * @returns {string}
         */
        makeGlobusUploadURL: function () {
            const { globus_upload_url } = Config.get('upload');
            return `${globus_upload_url}&destination_path=${this.userInfo.user}`;
        },

        /**
         * Shows or hides the "upload warning" alert, which should let the user know any
         * special considerations when files are uploading, such as not closing the browser.
         */
        updateUploadWarning: function () {
            const $warning = this.$dropzoneElem.find('#upload-narrative-close-warning');
            if (!this.isUploading()) {
                $warning.hide();
            } else {
                $warning.show();
            }
        },

        /**
         * Updates the "upload message" based on the state of the dropzone widget.
         */
        updateUploadMessage: function () {
            const uploadMessage = () => {
                if (!this.isUploading()) {
                    return 'No files uploading';
                }

                const numUploading = this.dropzone.getUploadingFiles().length;
                const numQueued = this.dropzone.getQueuedFiles().length;

                const queuedText = numQueued ? '(' + numQueued + ' queued)' : '';
                const pluralFiles = numUploading > 1 ? 's' : '';
                return `Uploading ${numUploading} file${pluralFiles} ${queuedText} to ${this.getPath()}`;
            };
            this.$dropzoneElem.find('#upload-message').text(uploadMessage);
        },

        /**
         * Primary entry point for rendering this widget.
         */
        render: function () {
            const $dropzoneElem = $(
                this.dropzoneTmpl({
                    userInfo: this.userInfo,
                    maxFilesize: formatFileSize(this.maxFileSizeBytes),
                })
            );
            this.$dropzoneElem = $dropzoneElem;

            this.$elem.append($dropzoneElem);
            this.$elem.addClass('kb-file-upload-widget');

            const { parallel_uploads, timeout } = Config.get('upload');

            this.dropzone = new Dropzone($dropzoneElem.get(0), {
                url: `${this.stagingUrl}/upload`,
                accept: function (_, done) {
                    done();
                },
                headers: { Authorization: Runtime.make().authToken() },
                paramName: 'uploads',
                previewTemplate: this.dropFileTmpl(),
                autoProcessQueue: true,
                parallelUploads: parallel_uploads,
                maxFilesize: this.maxFileSizeMiB,
                timeout,
                userInfo: this.userInfo,
            })
                .on('totaluploadprogress', (progress) => {
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({
                        width: `${progress}%`,
                    });
                })
                .on('addedfile', () => {
                    $dropzoneElem.find('#global-info').removeClass('hide');
                    $dropzoneElem.css('justify-content', 'flex-start');

                    // If there is a button already in the area, it has to be removed,
                    // and appended to the new document when additional errored files are added.
                    if ($dropzoneElem.find('#clear-all-btn').length) {
                        this.deleteClearAllButton();
                        $dropzoneElem.append(this.$renderClearAllButton());
                    }

                    this.updateUploadMessage();
                    this.updateUploadWarning();
                })
                .on('success', (file) => {
                    const $successElem = $(file.previewElement);
                    $successElem.find('#upload_progress_and_cancel').hide();
                    $successElem
                        .find('#dz_file_row_1')
                        .css({ display: 'flex', 'align-items': 'center' });
                    $successElem.find('#success_icon').css('display', 'flex');
                    $successElem.find('#success_message').css('display', 'inline');

                    this.maybeRemoveProgressBar();
                    $(file.previewElement).fadeOut(1000, () => {
                        $(file.previewElement.querySelector('.btn')).trigger('click');
                    });

                    this.updateUploadMessage();
                    this.updateUploadWarning();
                })
                .on('sending', (file, _xhr, data) => {
                    $dropzoneElem.find('#global-info').removeClass('hide');
                    //okay, if we've been given a full path, then we pull out the pieces (ignoring the filename at the end) and then
                    //tack it onto our set path, then set that as the destPath form param.
                    if (file.fullPath) {
                        const subPath = file.fullPath.replace(
                            new RegExp('/' + file.name + '$'),
                            ''
                        );
                        data.append('destPath', [this.path, subPath].join('/'));
                    }
                    //if we don't have a fullPath, then we're uploading a file and not a folder. Just use the current path.
                    else {
                        data.append('destPath', this.path);
                    }
                    $($dropzoneElem.find('#total-progress')).show();
                    this.updateUploadMessage();
                    this.updateUploadWarning();
                })
                .on('reset', () => {
                    $('#clear-all-btn-container').remove();
                    $('#clear-all-btn').remove();
                    $dropzoneElem.find('#global-info').addClass('hide');
                    $($dropzoneElem.find('#total-progress .progress-bar')).css({ width: '0' });
                    $dropzoneElem.css('justify-content', 'center');
                    this.updateUploadWarning();
                })
                .on('canceled', () => {
                    // Note that this relies upon the version of the staging service which uses a
                    // temp file for the upload file as it is being sent, and therefore automatically
                    // removes the file if it is interrupted with a cancelation.
                    // In the previous version the cancelation code here would have to request the
                    // deletion of the partially uploaded file.
                    this.updateUploadMessage();
                    this.updateUploadWarning();
                })
                .on('error', (erroredFile) => {
                    const $errorElem = $(erroredFile.previewElement);
                    $errorElem.find('#upload_progress_and_cancel').hide();
                    $errorElem
                        .find('#dz_file_row_1')
                        .css({ display: 'flex', 'align-items': 'center' });
                    $errorElem.find('#error_icon').css('display', 'flex');
                    this.maybeRemoveProgressBar();

                    // Set error message
                    const $errorMessage = $errorElem.find('#error_message');

                    const default413Response = /413 Request Entity Too Large/;
                    const custom413Response = /Request entity is too large/; // or whatever it is.
                    const dropzoneFileTooBigMessage = /File is too big.*Max filesize:/;
                    const errorMessage = $errorMessage.text();

                    // I don't know how to determine if the file was too big other than looking at the preview message
                    if (dropzoneFileTooBigMessage.test(errorMessage)) {
                        // Extract the size reported by the dropzone widget.

                        // Convert the size reported from gibibtyes to gigabytes, since that is what
                        // a user will see for the file size in their file system.

                        // Note that dropzone shows the file size as an approximation - decimal and with rounding.
                        // There fore it is not possible to accurately get the size of the file, so we
                        // don't try to do so. The file size is already shown in the file list anyway.
                        const errorText = `File size exceeds maximum allowable of ${formatFileSize(
                            this.maxFileSizeBytes
                        )}`;
                        const $errorContent = $el('div').append(this.$renderGlobusUploadLink());
                        $errorMessage.html(this.$renderError(errorText, $errorContent));
                    } else if (
                        default413Response.test(errorMessage) ||
                        custom413Response.test(errorMessage)
                    ) {
                        let errorText;
                        if (custom413Response.test(errorMessage)) {
                            try {
                                const serverError = JSON.parse(errorMessage);
                                errorText = `Request size of ${formatFileSize(
                                    serverError.contentLength
                                )} exceeds maximum allowed by the upload server (${
                                    serverError.maxBodySize
                                })`;
                            } catch (ex) {
                                errorText =
                                    'Request size exceeds maximum allowed by the upload server';
                            }
                        } else {
                            errorText = 'Request size exceeds maximum allowed by the uload server';
                        }

                        const $errorContent = $el('div').append(this.$renderGlobusUploadLink());
                        $errorMessage.html(this.$renderError(errorText, $errorContent));
                    } else if (erroredFile.xhr && erroredFile.xhr.responseText) {
                        $errorMessage.html(this.$renderError(erroredFile.xhr.responseText));
                    } else {
                        $errorMessage.html(this.$renderError('unable to upload file!'));
                    }

                    // Check to see if there already a button in the dropzone area
                    if (!$dropzoneElem.find('#clear-all-btn').length) {
                        $dropzoneElem.append(this.$renderClearAllButton());
                    }
                });
        },
    });
});
