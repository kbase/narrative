define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], ($, FileUploadWidget, Jupyter, Config, TestUtil) => {
    'use strict';

    const fakeUser = 'notAUser',
        filename = 'foo.txt',
        stagingUrl = Config.url('staging_api_url') + '/upload';

    describe('Test the fileUploadWidget', () => {
        beforeEach(function () {
            jasmine.Ajax.install();
            Jupyter.narrative = {
                userId: fakeUser,
                getAuthToken: () => {
                    return 'fakeToken';
                },
                sidePanel: {
                    $dataWidget: {
                        $overlayPanel: {},
                    },
                },
                showDataOverlay: () => {},
            };
            this.mockFile = new File(['0123456789'], filename, { type: 'text/plain' });

            const responseData = {
                message: 'Request entity is too large',
                responseCode: 413,
                maxBodySize: '5GB',
                contentLength: 6000000000,
            };

            jasmine.Ajax.stubRequest(stagingUrl).andReturn({
                status: 413,
                statusText: 'HTTP/1.1 413 OK',
                contentType: 'application/json',
                responseText: JSON.stringify(responseData),
            });
        });

        afterEach(() => {
            jasmine.Ajax.requests.reset();
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
        });

        it('Should display an error message if the server reports the file is too big', function (done) {
            // Dropzone size unit is one mebibyte (1024 * 1024); uploadWidget takes bytes.
            // For this test, size doesn't matter, as long as the max file size is greater
            // than the fake file we send, as we don't want to trigger the dropzones
            // max file size.
            const maxFileSize = Math.pow(1024, 2);
            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
                maxFileSize,
            });

            uploadWidget.dropzone.addFile(this.mockFile);

            setTimeout(() => {
                const $uploadWidget = uploadWidget.$elem;
                // expect($fileTemplate.find('#globus_error_link').attr('href')).toEqual(
                //     'https://app.globus.org/file-manager?destination_id=c3c0a65f-5827-4834-b6c9-388b0b19953a&destination_path=' +
                //         fakeUser
                // );

                expect($uploadWidget.find('#globus_error_link').text()).toContain(
                    'upload large files with Globus'
                );

                expect($uploadWidget.text()).toContain(
                    'Request size of 6.0 GB exceeds maximum allowed by the upload server (5GB)'
                );
                done();
            });
        });
    });
});
