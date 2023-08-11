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
            this.mockFile = new File(['01234567890'], filename, { type: 'foo' });

            jasmine.Ajax.stubRequest(stagingUrl).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify([
                    {
                        name: filename,
                        path: `${fakeUser}/${filename}`,
                        mtime: 1689027814382,
                        size: 10,
                        isFolder: false,
                    },
                ]),
            });
        });

        afterEach(() => {
            jasmine.Ajax.requests.reset();
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
        });

        it('Should display an error message emitted by dropzone', function (done) {
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

            // Override acceptedFiles, which is not set by default.
            uploadWidget.dropzone.options.acceptedFiles = 'bar';

            uploadWidget.dropzone.addFile(this.mockFile);

            setTimeout(() => {
                expect(uploadWidget.$elem.text()).toContain("You can't upload files of this type");
                done();
            });
        });
    });
});
