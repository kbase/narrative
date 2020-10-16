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

        it('Should render properly when linked to globus', () => {
            const $node = $('<div>'),
                fuw = new FileUploadWidget($node, {
                    path: '/',
                    userInfo: {
                        user: fakeUser,
                        globusLinked: true
                    }
                }),
                renderedMsg = $node.find('.dz-message').html();
            expect(renderedMsg).toContain('<p>Three ways to add data to the staging area:</p>');
            expect(renderedMsg).toContain('<li>Click in this box.</li>');
            expect(renderedMsg).toContain('<li>Drag and drop data files.</li>');
            expect(renderedMsg).toContain('For large files (over 20GB) or a large number of files use');
            expect(renderedMsg).toContain(Config.get('upload').globus_upload_url);
            expect(renderedMsg).toContain(fakeUser);
            expect(renderedMsg).not.toContain('For large files (over 20GB), use Globus. Click');
            expect(renderedMsg).not.toContain('https://docs.kbase.us/data/globus');
        });

        it('Should render properly when not linked to globus', () => {
            const $node = $('<div>'),
                fuw = new FileUploadWidget($node, {
                    path: '/',
                    userInfo: {
                        user: fakeUser,
                        globusLinked: false
                    }
                }),
                renderedMsg = $node.find('.dz-message').html();
            expect(renderedMsg).toContain('<p>Three ways to add data to the staging area:</p>');
            expect(renderedMsg).toContain('<li>Click in this box.</li>');
            expect(renderedMsg).toContain('<li>Drag and drop data files.</li>');
            expect(renderedMsg).toContain('For large files (over 20GB), use Globus. Click');
            expect(renderedMsg).toContain('https://docs.kbase.us/data/globus');
            expect(renderedMsg).not.toContain('For large files (over 20GB) or a large number of files use');
            expect(renderedMsg).not.toContain(Config.get('upload').globus_upload_url);
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

        it('Should open a Globus window on click', () => {
            // first pass = no globus link.
            const unlinkedLink = 'https://docs.kbase.us/data/globus';
            spyOn(window, 'open').and.callThrough();
            fuWidget.$elem.find('a.globus_link').click();
            expect(window.open).toHaveBeenCalledWith(unlinkedLink, '_blank');
            const $node = $('<div>'),
                fuw = new FileUploadWidget($node, {
                    path: '/',
                    userInfo: {
                        user: fakeUser,
                        globusLinked: true
                    }
                });
            fuw.$elem.find('a.globus_link').click();
            expect(window.open).toHaveBeenCalledWith('', 'dz-globus');
        });

    });
});
