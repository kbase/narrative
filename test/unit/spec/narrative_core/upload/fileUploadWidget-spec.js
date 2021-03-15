define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'base/js/namespace',
    'narrativeConfig',
], ($, FileUploadWidget, Jupyter, Config) => {
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
            this.node = document.createElement('div');
            this.fuWidget = new FileUploadWidget($(this.node), {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: false,
                },
            });
            this.mockFile = new File(['file contents'], filename, { type: 'text/html' });

            jasmine.Ajax.stubRequest(stagingUrl).andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify([
                    {
                        name: filename,
                        path: `${fakeUser}/${filename}`,
                        mtime: 1596747139855,
                        size: 1376,
                        isFolder: false,
                    },
                ]),
            });
        });

        afterEach(() => {
            jasmine.Ajax.requests.reset();
            jasmine.Ajax.uninstall();
        });

        it('Should be able to set and retrieve the path', () => {
            const uploadWidget = new FileUploadWidget($('<div>'), {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
            });
            const newPath = 'newPath';
            uploadWidget.setPath(newPath);
            expect(uploadWidget.getPath()).toEqual(newPath);
        });

        it('Should start and succeed on an upload when a file is given', function (done) {
            const adderMock = jasmine.createSpy('adderMock');
            const successMock = jasmine.createSpy('successMock');
            this.fuWidget.dropzone.on('addedfile', () => {
                adderMock();
            });
            this.fuWidget.dropzone.on('success', () => {
                successMock();
            });
            this.fuWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                expect(successMock).toHaveBeenCalled();
                done();
            });
        });

        it('Should timeout an upload when configured', function (done) {
            // The default config gives an infinite timeout. Hard to test.
            expect(this.fuWidget.dropzone.options.timeout).toBe(0);
            // Let's set it shorter than disabled.
            this.fuWidget.dropzone.options.timeout = 100; // ms
            expect(this.fuWidget.dropzone.options.timeout).toBe(100);

            this.fuWidget.dropzone.on('error', (file, errorMessage) => {
                expect(errorMessage).toBeDefined();
                done();
            });
            this.fuWidget.dropzone.on('success', () => {
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.url).toMatch(/\/upload/);
                expect(req.method).toBe('POST');
                done();
            });
            this.fuWidget.dropzone.addFile(this.mockFile);
        });

        it('Should error when too large of a file is uploaded', function (done) {
            // Set the file max size to 0
            this.fuWidget.dropzone.options.maxFilesize = 1;

            Object.defineProperty(this.mockFile, 'size', {
                value: Math.pow(1024, 4),
                writable: false,
            });

            // Create mock calls
            const adderMock = jasmine.createSpy('adderMock');
            const errorMock = jasmine.createSpy('errorMock');
            this.fuWidget.dropzone.on('addedfile', () => {
                adderMock();
            });
            this.fuWidget.dropzone.on('error', () => {
                errorMock();
            });
            this.fuWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                expect(errorMock).toHaveBeenCalled();
                done();
            });
        });

        it('Should render properly when a file upload error occurs', function (done) {
            // Set the file max size to 0
            this.fuWidget.dropzone.options.maxFilesize = 1;

            Object.defineProperty(this.mockFile, 'size', {
                value: Math.pow(1024, 4),
                writable: false,
            });

            this.fuWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                const $fileTemplate = this.fuWidget.$elem;
                expect(document.getElementById('clear_all_button')).toBeDefined();
                expect($fileTemplate.find('#upload_progress_and_cancel').css('display')).toEqual(
                    'none'
                );
                expect($fileTemplate.find('#error_icon').css('display')).toEqual('flex');
                expect($fileTemplate.find('#globus_error_link').attr('href')).toEqual(
                    'https://docs.kbase.us/data/globus'
                );
                done();
            });
        });

        it('Should provide a link to a globus account when file upload maxfile size error occurs', function (done) {
            const uploadWidget = new FileUploadWidget($('<div>'), {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
            });

            // Set the file max size to 0
            uploadWidget.dropzone.options.maxFilesize = 1;
            Object.defineProperty(this.mockFile, 'size', {
                value: Math.pow(1024, 4),
                writable: false,
            });

            uploadWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                const $fileTemplate = uploadWidget.$elem;
                expect($fileTemplate.find('#globus_error_link').attr('href')).toEqual(
                    'https://app.globus.org/file-manager?destination_id=c3c0a65f-5827-4834-b6c9-388b0b19953a&destination_path=' +
                        fakeUser
                );
                done();
            });
        });

        it('Should contain a cancel warning button', function (done) {
            document.body.appendChild(this.node);

            this.fuWidget.dropzone.on('sending', () => {
                const $cancelButton = this.fuWidget.$elem.find('.cancel');
                expect($cancelButton).toBeDefined();
                expect($cancelButton.attr('data-dz-remove')).toBeDefined();
                // prevent the XHR from being submitted -- for some reason jasmine.ajax does not catch it
                this.fuWidget.dropzone.disable();
                done();
            });

            this.fuWidget.dropzone.addFile(this.mockFile);
        });
    });
});
