/*global define, jasmine*/
/*global describe, it, expect*/
/*global beforeEach, afterEach, spyOn*/
/*jslint white: true*/
define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'base/js/namespace',
    'narrativeConfig'
], (
    $,
    FileUploadWidget,
    Jupyter,
    Config
) => {
    'use strict';

    let fuWidget,
        $targetNode,
        fakeUser = 'notAUser';

    const mockUploadEndpoint = (filename, username, isFolder) => {
        jasmine.Ajax.stubRequest(Config.url('staging_api_url') + '/upload')
            .andReturn({
                status: 200,
                statusText: 'HTTP/1.1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify([{name: filename, path: `${username}/${filename}`, mtime: 1596747139855, size: 1376, isFolder: isFolder}])
            });
    };

    const createMockFile = (filename) => {
        let file = new File(['file contents'], filename, { type: 'text/html' });
        return file;
    };

    describe('Test the fileUploadWidget', () => {
        beforeEach(() => {
            jasmine.Ajax.install();
            Jupyter.narrative = {
                userId: fakeUser,
                getAuthToken: () => { return 'fakeToken'; },
                sidePanel: {
                    '$dataWidget': {
                        '$overlayPanel': {}
                    }
                },
                showDataOverlay: () => {}
            };
            $targetNode = $('<div>');
            fuWidget = new FileUploadWidget($targetNode, {
                path: '/',
                userInfo: {
                    user: fakeUser,
                    globusLinked: false
                }
            });
        });

        afterEach(() => {
            jasmine.Ajax.requests.reset();
            jasmine.Ajax.uninstall();
        });

        it('Should be able to set and retrieve the path', () => {
            const $node = $('<div>'),
                fuw = new FileUploadWidget($node, {
                    path: '/',
                    userInfo: {
                        user: fakeUser,
                        globusLinked: true
                    }
                });
            const newPath = 'newPath';
            fuw.setPath(newPath);
            expect(fuw.getPath()).toEqual(newPath);
        });

        it('Should start and succeed on an upload when a file is given', (done) => {
            const filename='foo.txt';
            mockUploadEndpoint(filename, fakeUser, false);
            const mockFile = createMockFile(filename);
            const adderMock = jasmine.createSpy('adderMock');
            const successMock = jasmine.createSpy('successMock');
            fuWidget.dropzone.on('addedfile', () => {
                adderMock();
            });
            fuWidget.dropzone.on('success', () => {
                successMock();
            });
            fuWidget.dropzone.addFile(mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                expect(successMock).toHaveBeenCalled();
                done();
            });
        });

        it('Should timeout an upload when configured', (done) => {
            // The default config gives an infinite timeout. Hard to test.
            expect(fuWidget.dropzone.options.timeout).toBe(0);
            // Let's set it shorter than disabled.
            fuWidget.dropzone.options.timeout = 100; // ms
            expect(fuWidget.dropzone.options.timeout).toBe(100);
            const filename='foo.txt';
            mockUploadEndpoint(filename, fakeUser, false);
            const mockFile = createMockFile(filename);
            fuWidget.dropzone.on('error', (file, errorMessage) => {
                expect(errorMessage).toBeDefined();
                done();
            });
            fuWidget.dropzone.on('success', () => {
                const req = jasmine.Ajax.requests.mostRecent();
                expect(req.url).toMatch(/\/upload/);
                expect(req.method).toBe('POST');
                done();
            });
            fuWidget.dropzone.addFile(mockFile);
        });

        it('Should error when too large of a file is uploaded', (done) => {
            // Set the file max size to 0
            fuWidget.dropzone.options.maxFilesize = 1;

            // Create file
            const filename='foo.txt';
            mockUploadEndpoint(filename, fakeUser, false);
            var mockFile = createMockFile(filename);
            Object.defineProperty(mockFile, 'size', {value: Math.pow(1024, 4), writable: false});

            // Create mock calls
            const adderMock = jasmine.createSpy('adderMock');
            const errorMock = jasmine.createSpy('errorMock');
            fuWidget.dropzone.on('addedfile', () => {
                adderMock();
            });
            fuWidget.dropzone.on('error', () => {
                errorMock();
            });
            fuWidget.dropzone.addFile(mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                expect(errorMock).toHaveBeenCalled();
                done();
            });
        });

        it('Should create a clear all button when a file upload error occurs', (done) => {
            // Set the file max size to 0
            fuWidget.dropzone.options.maxFilesize = 1;

            // Create file
            const filename='foo.txt';
            mockUploadEndpoint(filename, fakeUser, false);
            var mockFile = createMockFile(filename);
            Object.defineProperty(mockFile, 'size', {value: Math.pow(1024, 4), writable: false});

            // Create mock calls
            const adderMock = jasmine.createSpy('adderMock');
            fuWidget.dropzone.on('addedfile', () => {
                adderMock();
            });

            fuWidget.dropzone.addFile(mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                var clearAllButton = document.getElementById('clear-all-btn');
                expect(clearAllButton).toBeDefined();
                done();
            });
        });

        it('Should display an error icon and hide the progress bar and cancel button when an error occurs', (done) => {
            fuWidget.dropzone.options.maxFilesize = 1;

            // Create file
            const filename='foo.txt';
            mockUploadEndpoint(filename, fakeUser, false);
            var mockFile = createMockFile(filename);
            Object.defineProperty(mockFile, 'size', {value: Math.pow(1024, 4), writable: false});

            // Create mock calls
            const adderMock = jasmine.createSpy('adderMock');
            fuWidget.dropzone.on('addedfile', () => {
                adderMock();
            });

            fuWidget.dropzone.addFile(mockFile);
            setTimeout(() => {
                expect(adderMock).toHaveBeenCalled();
                expect(document.getElementById('upload_progress_and_cancel')).toBeNull();
                expect(document.getElementById('error_icon')).toBeDefined();
                done();
            });
        });

    });
});
