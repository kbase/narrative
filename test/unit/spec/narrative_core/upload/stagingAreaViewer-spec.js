/*global define*/
/*global describe, it, xit, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil'
], function(
    $,
    StagingAreaViewer,
    Jupyter,
    Narrative,
    TestUtil
) {
    'use strict';

    describe('Test the staging area viewer widget', function() {
        let stagingViewer,
            $targetNode = $('<div>'),
            startingPath = '/',
            updatePathFn = function(newPath) { },
            fakeUser = 'notAUser';

        beforeEach(function() {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/?/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify([
                    {
                        name: "test_folder",
                        path: fakeUser + "/test_folder",
                        mtime: 1532738637499,
                        size: 34,
                        isFolder: true
                    }, {
                        name: "file_list.txt",
                        path: fakeUser + "/test_folder/file_list.txt",
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload'
                    }
                ])
            });
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
            stagingViewer = new StagingAreaViewer($targetNode, {
                path: startingPath,
                updatePathFn: updatePathFn,
                userInfo: {
                    user: fakeUser,
                    globusLinked: false
                }
            });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $targetNode.remove();
        });

        it('Should initialize properly', function() {
            expect(stagingViewer).not.toBeNull();
        });

        it('Should render properly', function() {
            stagingViewer.render();
            expect(stagingViewer).not.toBeNull();
        });

        it('Should render properly with a Globus linked account', (done) => {
            let $node = $('<div>'),
                linkedStagingViewer = new StagingAreaViewer($node, {
                    path: startingPath,
                    updatePathFn: updatePathFn,
                    userInfo: {
                        user: fakeUser,
                        globusLinked: true
                    }
                });
            linkedStagingViewer.render()
                .then(() => {
                    expect($node.html()).toContain('Or upload to this staging area by using');
                    expect($node.html()).toContain('https://app.globus.org/file-manager?destination_id=3aca022a-5e5b-11e6-8309-22000b97daec&amp;destination_path=%2F' + fakeUser);
                    done();
                });
        });

        it('Should render properly without a Globus linked account', () => {
            expect($targetNode.html()).not.toContain('Or upload to this staging area by using');
        });

        it('Should start a help tour', function() {
            stagingViewer.render();
            stagingViewer.startTour();
            expect(stagingViewer.tour).not.toBeNull();
        });

        xit('Should try to create a new import app with missing info', function() {
            stagingViewer.initImportApp('foo', 'i_am_a_file');
        });

        xit('Should try to create a new import app with appropriate info', function() {
            stagingViewer.initImportApp('fba_model', 'i_am_a_file');
        });

        it('Should update its view with a proper subpath', function(done) {
            stagingViewer.updateView()
                .then(function() {
                    done();
                })
                .catch(err => {
                    console.log(err);
                    fail();
                });
        });

        it('Should show an error when a path does not exist', (done, fail) => {
            const errorText = 'directory not found';
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/foo?/).andReturn({
                status: 404,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: errorText
            });

            stagingViewer.setPath('//foo')
                .then(() => {
                    expect($targetNode.find('#kb-data-staging-table').html()).toContain(errorText);
                    done();
                });
        });

        it('Should show a "no files" next when a path has no files', (done) => {
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/empty?/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify([])
            });

            stagingViewer.setPath('//empty')
                .then(() => {
                    expect($targetNode.find('#kb-data-staging-table').html()).toContain('No files found.');
                    done();
                });
        });
    });
});
