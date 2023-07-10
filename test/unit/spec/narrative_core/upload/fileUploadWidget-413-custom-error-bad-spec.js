define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], ($, FileUploadWidget, Jupyter, Config, TestUtil) => {
    ('use strict');

    /**
     * Handles the case of the server emitting a 413 response which looks superficially
     * like the custom response - "Request entity is too large" is in the response text -
     * but is invalid JSON.
     */

    const fakeUser = 'notAUser',
        filename = 'foo.txt',
        stagingUrl = Config.url('staging_api_url') + '/upload';

    describe('Test the fileUploadWidget 413 error with errors', () => {
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

            const responseText = 'oh dear, not JSON.';

            jasmine.Ajax.stubRequest(stagingUrl).andReturn({
                status: 413,
                statusText: 'HTTP/1.1 413 OK',
                contentType: 'application/json',
                responseText,
            });
        });

        afterEach(() => {
            jasmine.Ajax.requests.reset();
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
        });

        it('Should display a default error message if the server reports the file is too big but the custom response is invalid JSON ', function (done) {
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

            // TODO: realistically, this should poll until the condition is met, or
            // timeout. Reason being that in real usage (or if using a real service mock),
            // the call that generates the error may take an indeterminate amount of time,
            // and certainly will not be on the next tick of the event loop.
            setTimeout(() => {
                const $uploadWidget = uploadWidget.$elem;

                expect($uploadWidget.find('#globus_error_link').text()).toContain(
                    'upload large files with Globus'
                );

                // If the custom error is bad JSON, we should still get a generic message.
                expect($uploadWidget.text()).toContain(
                    'Request size exceeds maximum allowed by the upload server'
                );
                done();
            });
        });
    });
});
