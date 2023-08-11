define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], ($, FileUploadWidget, Jupyter, Config, TestUtil) => {
    'use strict';

    const fakeUser = 'notAUser';
    const filename = 'foo.txt';
    const stagingUrl = `${Config.url('staging_api_url')}/upload`;

    describe('Test the fileUploadWidget', () => {
        let container;
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
            container = document.createElement('div');

            this.mockFile = new File(['file contents'], filename, { type: 'text/plain' });

            this.mockFile2 = new File(['file contents'], filename, { type: 'text/plain' });
            this.mockFile2.fullPath = 'baz/foo.txt';

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
            container.remove();
            TestUtil.clearRuntime();
        });

        it('Should fail to initialize if the maxFileSize is not provided', () => {
            expect(() => {
                const $wrapper = $('<div>');
                // prettier-ignore
                new FileUploadWidget($wrapper, {  //NOSONAR
                    path: '/',
                    userInfo: {
                        user: fakeUser,
                        globusLinked: true,
                    },
                });
            }).toThrow(new Error('The "maxFileSize" option is required'));
        });

        it('Should be able to set and retrieve the path', () => {
            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
                maxFileSize: 1, // doesn't matter
            });
            const newPath = 'newPath';
            uploadWidget.setPath(newPath);
            expect(uploadWidget.getPath()).toEqual(newPath);
        });

        it('Should start and succeed on an upload when a file is given', function (done) {
            const adderMock = jasmine.createSpy('adderMock');
            const successMock = jasmine.createSpy('successMock');
            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: false,
                },
                maxFileSize: 1000, // just as long as it is larger than the mock file
            });
            uploadWidget.dropzone.on('addedfile', () => {
                adderMock();
            });
            uploadWidget.dropzone.on('success', () => {
                successMock();
            });
            uploadWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                expect(successMock).toHaveBeenCalled();
                done();
            });
        });

        /**
         * Ensure that when fullPath is set when sending a directory, that the
         * destPath is set.
         *
         * fullPath is for the file when a directory is sent via the drop handler.
         *
         * What we do need to do is inspect the multipart/form-data body that is sent,
         * to ensure that that the destPath part is set correctly, which would be "baz"
         * in this case.
         * However, the jasmine ajax mock does not have this built-in.
         * So, for now, this is more of a placeholder which at least ensures that the
         * mechanism doesn't break in the presence of fullPath.
         */
        it('Should start and succeed on an upload when a file is given from directory', function (done) {
            const successMock = jasmine.createSpy('successMock');
            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: false,
                },
                maxFileSize: 1000, // just as long as it is larger than the mock file
            });
            let fullPathFound = false;
            uploadWidget.dropzone.on('addedfile', (file) => {
                fullPathFound = file.fullPath === 'baz/foo.txt';
            });
            uploadWidget.dropzone.on('success', () => {
                successMock();
            });
            uploadWidget.dropzone.addFile(this.mockFile2);

            // Same caveat that this only works because we are not really properly
            // mocking the async call to the upload server.
            setTimeout(() => {
                expect(successMock).toHaveBeenCalled();
                expect(fullPathFound).toBeTrue();
                done();
            });
        });

        it('Should timeout an upload when configured', function (done) {
            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
                maxFileSize: 1000, // Just as long as bigger than mock file
            });
            // The default config gives an infinite timeout. Hard to test.
            expect(uploadWidget.dropzone.options.timeout).toBe(0);
            // Let's set it shorter than disabled.
            uploadWidget.dropzone.options.timeout = 100; // ms
            expect(uploadWidget.dropzone.options.timeout).toBe(100);

            uploadWidget.dropzone.on('error', (file, errorMessage) => {
                expect(errorMessage).toBeDefined();
                done();
            });
            uploadWidget.dropzone.on('success', () => {
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.url).toMatch(/\/upload/);
                expect(req.method).toBe('POST');
                done();
            });
            uploadWidget.dropzone.addFile(this.mockFile);
        });

        it('Should error when too large of a file is uploaded', function (done) {
            // Set the file max size to 0

            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
                maxFileSize: 1, // Just as long as smaller than the mock file
            });

            uploadWidget.dropzone.options.maxFilesize = 1;

            Object.defineProperty(this.mockFile, 'size', {
                value: Math.pow(1024, 4),
                writable: false,
            });

            // Create mock calls
            const adderMock = jasmine.createSpy('adderMock');
            const errorMock = jasmine.createSpy('errorMock');
            uploadWidget.dropzone.on('addedfile', () => {
                adderMock();
            });
            uploadWidget.dropzone.on('error', () => {
                errorMock();
            });
            uploadWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                expect(errorMock).toHaveBeenCalled();
                done();
            });
        });

        it('Should render properly when a file upload error occurs', function (done) {
            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: false,
                },
                maxFileSize: 1, // Just as long as smaller than the mock file
            });

            Object.defineProperty(this.mockFile, 'size', {
                value: Math.pow(1024, 4),
                writable: false,
            });

            uploadWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                const $uploadWidget = uploadWidget.$elem;
                expect(document.getElementById('clear-all-button')).toBeDefined();
                expect($uploadWidget.find('#upload_progress_and_cancel').css('display')).toEqual(
                    'none'
                );
                expect($uploadWidget.find('#error_icon').css('display')).toEqual('flex');

                expect($uploadWidget.find('#globus_error_link').attr('href')).toEqual(
                    'https://docs.kbase.us/data/globus'
                );
                done();
            });
        });

        it('Should provide a link to a globus account when file upload maxfile size error occurs', function (done) {
            // use max file size of 1 megabyte.
            const maxFileSize = Math.pow(1000, 2);

            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
                maxFileSize,
            });

            // Must set the property this way as this is a Blob object,
            // whose 'size' property is read-only.
            Object.defineProperty(this.mockFile, 'size', {
                value: maxFileSize + 1,
                writable: false,
            });

            uploadWidget.dropzone.addFile(this.mockFile);
            setTimeout(() => {
                const $fileTemplate = uploadWidget.$elem;
                expect($fileTemplate.find('#globus_error_link').text()).toContain(
                    'upload large files with Globus'
                );

                expect($fileTemplate.text()).toContain(
                    'File size exceeds maximum allowable of 1.0 MB'
                );
                done();
            });
        });

        it('Should contain a cancel warning button', function (done) {
            const $wrapper = $('<div>');
            const uploadWidget = new FileUploadWidget($wrapper, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: true,
                },
                maxFileSize: 1000,
            });
            uploadWidget.dropzone.on('sending', () => {
                const $cancelButton = uploadWidget.$elem.find('.cancel');
                expect($cancelButton).toBeDefined();
                expect($cancelButton.attr('data-dz-remove')).toBeDefined();
                // prevent the XHR from being submitted -- for some reason jasmine.ajax does not catch it
                uploadWidget.dropzone.disable();
                done();
            });

            uploadWidget.dropzone.addFile(this.mockFile);
        });
    });
});
