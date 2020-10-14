/*global define*/
/*global describe, it, expect, spyOn*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil'
], (
    $,
    StagingAreaViewer,
    Jupyter
) => {
    'use strict';

    describe('Test the staging area viewer widget', () => {
        let stagingViewer,
            $targetNode,
            startingPath = '/',
            updatePathFn = () => {},
            fakeUser = 'notAUser';

        beforeEach(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/?/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify([
                    {
                        name: 'test_folder',
                        path: fakeUser + '/test_folder',
                        mtime: 1532738637499,
                        size: 34,
                        isFolder: true
                    }, {
                        name: 'file_list.txt',
                        path: fakeUser + '/test_folder/file_list.txt',
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload'
                    }
                ])
            });
            Jupyter.narrative = {
                userId: fakeUser,
                getAuthToken: () => 'fakeToken',
                sidePanel: {
                    '$dataWidget': {
                        '$overlayPanel': {}
                    },
                    '$methodsWidget': {
                        currentTag: 'release'
                    }
                },
                showDataOverlay: () => {},
                addAndPopulateApp: () => {},
                hideOverlay: () => {},
            };
            $targetNode = $('<div>');
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
            stagingViewer = null;
        });

        it('Should initialize properly', () => {
            expect(stagingViewer).not.toBeNull();
        });

        it('Should render properly', () => {
            stagingViewer.render();
            expect(stagingViewer).not.toBeNull();
        });

        it('Should render properly with a Globus linked account', (done) => {
            var $node = $('<div>'),
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
                    var $globusButton = $node.find('.globus_linked');
                    expect($globusButton).toBeDefined();
                    expect($globusButton.html()).toContain('Upload with Globus');
                    expect($globusButton.html()).toContain('https://app.globus.org/file-manager?destination_id=c3c0a65f-5827-4834-b6c9-388b0b19953a&amp;destination_path=' + fakeUser);
                    done();
                });
        });

        it('Should render properly without a Globus linked account', () => {
            var $globusButton = $targetNode.find('.globus_not_linked');
            expect($globusButton).toBeDefined();
            expect($globusButton.html()).toContain('Upload with Globus');
            expect($globusButton.html()).toContain('https://docs.kbase.us/data/globus');
        });

        it('Should render a url button', () => {
            var $urlButton = $targetNode.find('.web_upload_div');
            expect($urlButton).toBeDefined();
            expect($urlButton.html()).toContain('Upload with URL');
        });


        it('Should start a help tour', function() {
            stagingViewer.render();
            stagingViewer.startTour();
            expect(stagingViewer.tour).not.toBeNull();
        });

        it('Should update its view with a proper subpath', async () => {
            await stagingViewer.updateView();
        });

        it('Should show an error when a path does not exist', async () => {
            const errorText = 'An error occurred while fetching your files';
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/foo?/).andReturn({
                status: 404,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: errorText
            });

            await stagingViewer.setPath('//foo');
            expect($targetNode.find('.alert.alert-danger').html()).toContain(errorText);
        });

        it('Should show a "no files" next when a path has no files', async () => {
            jasmine.Ajax.stubRequest(/.*\/staging_service\/list\/empty?/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify([])
            });

            await stagingViewer.setPath('//empty');
            expect($targetNode.find('#kb-data-staging-table').html()).toContain('No files found.');
        });

        it('Should respond to activate and deactivate commands', () => {
            expect(stagingViewer.refreshInterval).toBeFalsy();
            stagingViewer.activate();
            expect(stagingViewer.refreshInterval).toBeDefined();
            stagingViewer.deactivate();
            expect(stagingViewer.refreshInterval).toBeUndefined();
        });

        it('Should have clickable folder icons', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem.find('button[data-name="test_folder"]').click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledWith('//test_folder');
        });

        it('Should have clickable folder names', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem.find('span.kb-data-staging-folder').click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledWith('//test_folder');
        });

        it('Should have multi-clicked folder buttons only fire once', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem.find('button[data-name]').click().click().click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledTimes(1);
        });

        it('Should have multi-clicked folder names only fire once', async () => {
            spyOn(stagingViewer, 'updatePathFn');
            await stagingViewer.render();
            stagingViewer.$elem.find('span.kb-data-staging-folder').click().click().click();
            expect(stagingViewer.updatePathFn).toHaveBeenCalledTimes(1);
        });

        it('Should initialize an import app with the expected inputs', () => {
            const fileType = 'fastq_reads',
                fileName = 'foobar.txt',
                appId = 'kb_uploadmethods/import_fastq_sra_as_reads_from_staging',
                tag = Jupyter.narrative.sidePanel.$methodsWidget.currentTag,
                inputs = {
                    fastq_fwd_staging_file_name: fileName,
                    name: fileName + '_reads',
                    import_type: 'FASTQ/FASTA'
                };
            spyOn(Jupyter.narrative, 'addAndPopulateApp');
            spyOn(Jupyter.narrative, 'hideOverlay');
            stagingViewer.initImportApp(fileType, {name: fileName});
            expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledWith(appId, tag, inputs);
            expect(Jupyter.narrative.hideOverlay).toHaveBeenCalled();
        });

        it('Should NOT initialize an import app with an unknown type', () => {
            spyOn(Jupyter.narrative, 'addAndPopulateApp');
            spyOn(Jupyter.narrative, 'hideOverlay');
            stagingViewer.initImportApp('some_unknown_type', 'foobar.txt');
            expect(Jupyter.narrative.addAndPopulateApp).not.toHaveBeenCalled();
            expect(Jupyter.narrative.hideOverlay).not.toHaveBeenCalled();
        });

        it('Creates a downloader iframe when requested', () => {
            stagingViewer.downloadFile('some_url');
            let dlNode = document.getElementById('hiddenDownloader');
            expect(dlNode).toBeDefined();
            expect(dlNode.getAttribute('src')).toEqual('some_url');
        });

    });
});
