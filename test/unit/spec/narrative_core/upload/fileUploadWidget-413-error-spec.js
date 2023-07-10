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
            this.mockFile = new File(['0123456789'], filename, { type: 'text/plain' });

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
                const $fileTemplate = uploadWidget.$elem;

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
