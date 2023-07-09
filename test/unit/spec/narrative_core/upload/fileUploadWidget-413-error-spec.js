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

    //  const default413Response = /413 Request Entity Too Large/;
    //  const custom413Response = /File is too big/;

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
            this.mockFile = new File(['file contents'], filename, { type: 'text/plain' });

            jasmine.Ajax.stubRequest(stagingUrl).andReturn({
                status: 413,
                statusText: 'HTTP/1.1 413 OK',
                contentType: 'text/html',
                responseText: '413 Request Entity Too Large',
            });
        });

        afterEach(() => {
            jasmine.Ajax.requests.reset();
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
        });

        it('Should display an error message if the server reports the file is too big', function (done) {
            // Dropzone size unit is one mebibyte (1024 * 1024); uploadWidget takes bytes.
            // For this test, size doesn't matter, as long as the max file size is less
            // than the fake file we send.
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

            const addedfileSpy = jasmine.createSpy('addedfileSpy');
            const errorSpy = jasmine.createSpy('errorSpy');
            uploadWidget.dropzone.on('addedfile', () => {
                addedfileSpy();
            });
            uploadWidget.dropzone.on('error', () => {
                errorSpy();
            });
            uploadWidget.dropzone.addFile(this.mockFile);

            setTimeout(() => {
                expect(addedfileSpy).toHaveBeenCalled();
                expect(errorSpy).toHaveBeenCalled();
                const $fileTemplate = uploadWidget.$elem;
                // expect($fileTemplate.find('#globus_error_link').attr('href')).toEqual(
                //     'https://app.globus.org/file-manager?destination_id=c3c0a65f-5827-4834-b6c9-388b0b19953a&destination_path=' +
                //         fakeUser
                // );

                expect($fileTemplate.find('#globus_error_link').text()).toContain(
                    'upload large files with Globus'
                );

                expect($fileTemplate.text()).toContain(
                    'Request size exceeds maximum allowed by the upload server'
                );
                done();
            });
        });
    });
});
