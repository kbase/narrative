/*global define, jasmine*/
/*global describe, it, expect*/
/*global beforeEach, afterEach, spyOn*/
/*jslint white: true*/
define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/fileUploadWidget',
    'base/js/namespace',
    'dropzone',
    'narrativeConfig'
], (
    $,
    FileUploadWidget,
    Jupyter,
    Dropzone,
    Config
) => {
    'use strict';

    let fuWidget,
        $targetNode,
        fakeUser = 'notAUser';

    const mockUploadEndpoint = (filename, username, isFolder, timeout) => {
        jasmine.Ajax.stubRequest(Config.url('staging_api_url') + '/upload')
            .andReturn(() => {
                const response = {
                    status: 200,
                    statusText: 'HTTP/1.1 200 OK',
                    contentType: 'application/json',
                    responseText: JSON.stringify([{name: filename, path: `${username}/${filename}`, mtime: 1596747139855, size: 1376, isFolder: isFolder}])
                };
                if (timeout) {
                    jasmine.clock().install();
                    jasmine.clock().tick(timeout);
                    jasmine.clock().uninstall();
                }
                return response;
            });
    };

    const createMockFile = (filename) => {
        let file = new File(['file contents'], filename, { type: 'text/html' });
        file.status = Dropzone.ADDED;
        file.accepted = true;
        file.upload = {
            filename: filename
        };
        return file;
    };

    beforeEach(() => {
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
        // jasmine.clock().install();
        jasmine.Ajax.install();
    });

    afterEach(() => {
        jasmine.Ajax.uninstall();
        // jasmine.clock().uninstall();
    });

    describe('Test the kbaseNarrativeSidePublicTab widget', () => {
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
            expect(renderedMsg).not.toContain('http://kbase.us/transfer-data-from-globus-to-kbase/');
        });

        it('Should render properly when not linked to globus', () => {
            const renderedMsg = $targetNode.find('.dz-message').html();
            expect(renderedMsg).toContain('<p>Three ways to add data to the staging area:</p>');
            expect(renderedMsg).toContain('<li>Click in this box.</li>');
            expect(renderedMsg).toContain('<li>Drag and drop data files.</li>');
            expect(renderedMsg).toContain('For large files (over 20GB), use Globus. Click');
            expect(renderedMsg).toContain('http://kbase.us/transfer-data-from-globus-to-kbase/');
            expect(renderedMsg).not.toContain('For large files (over 20GB) or a large number of files use');
            expect(renderedMsg).not.toContain(Config.get('upload').globus_upload_url);
        });

        it('Should be able to set and retrieve the path', () => {
            const newPath = 'newPath';
            fuWidget.setPath(newPath);
            expect(fuWidget.getPath()).toEqual(newPath);
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
            mockUploadEndpoint(filename, fakeUser, false, 1500);
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
            const unlinkedLink = 'http://kbase.us/transfer-data-from-globus-to-kbase/';
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
