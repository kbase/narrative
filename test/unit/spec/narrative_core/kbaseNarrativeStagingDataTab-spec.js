define([
    'jquery',
    'kbaseNarrativeStagingDataTab',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], ($, StagingDataTab, Jupyter, Config, TestUtil) => {
    'use strict';

    describe('The kbaseNarrativeStagingDataTab widget', () => {
        const fakeUser = 'notAUser',
            stagingServiceUrl = Config.url('staging_api_url');
        let $dummyNode, stagingWidget;

        beforeEach(() => {
            jasmine.Ajax.install();
            jasmine.Ajax.stubRequest(/\/auth\/api\/V2\/me$/).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseHeaders: '',
                responseText: JSON.stringify({
                    user: fakeUser,
                    idents: [
                        {
                            provider: 'Google',
                            provusername: 'notAUser@google.com',
                        },
                        {
                            provider: 'Globus',
                            provusername: 'notauser@globusid.org',
                        },
                    ],
                }),
            });
            jasmine.Ajax.stubRequest(new RegExp(`${stagingServiceUrl}/list/`)).andReturn({
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
                        isFolder: true,
                    },
                    {
                        name: 'file_list.txt',
                        path: fakeUser + '/test_folder/file_list.txt',
                        mtime: 1532738637555,
                        size: 49233,
                        source: 'KBase upload',
                        isFolder: false,
                    },
                ]),
            });
            const mappings = {
                mappings: [null, null],
            };
            jasmine.Ajax.stubRequest(
                new RegExp(`${stagingServiceUrl}/importer_mappings/`)
            ).andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'text/plain',
                responseHeaders: '',
                responseText: JSON.stringify(mappings),
            });

            Jupyter.narrative = {
                userId: fakeUser,
                getAuthToken: () => {
                    return 'fakeToken';
                },
            };
            $dummyNode = $('<div>');
            stagingWidget = new StagingDataTab($dummyNode);
        });

        afterEach(() => {
            stagingWidget.deactivate();
            // to deal with some datatables bleed over into global testing space.
            $.fn.DataTable.ext.search.pop();
            $dummyNode.empty();
            $dummyNode.remove();
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
        });

        it('can load properly', async () => {
            await stagingWidget.render();
            expect(stagingWidget).not.toBeNull();
        });

        it('properly catches failed user profile lookups by returning a default unlinked profile', async () => {
            jasmine.Ajax.stubRequest(/\/auth\/api\/V2\/me$/).andReturn({
                status: 500,
                statusText: 'error',
                contentType: 'text/html',
                responseHeaders: '',
                responseText: 'error! no profile for you!',
            });
            const userInfo = await stagingWidget.getUserInfo();
            expect(userInfo).toEqual({ user: fakeUser, globusLinked: false });
        });

        it('gets user info and parsed into whether or not the user is linked to globus', async () => {
            const userInfo = await stagingWidget.getUserInfo();
            expect(userInfo).toEqual({ user: fakeUser, globusLinked: true });
        });

        it('can update its path properly', async () => {
            await stagingWidget.render();
            const newPath = 'a_new_path';
            stagingWidget.updatePath(newPath);
            expect(stagingWidget.path).toEqual(newPath);
        });

        it('can activate its staging area viewer', async () => {
            await stagingWidget.render();
            spyOn(stagingWidget.stagingAreaViewer, 'activate');
            stagingWidget.activate();
            expect(stagingWidget.stagingAreaViewer.activate).toHaveBeenCalled();
        });

        it('can deactivate its staging area viewer', async () => {
            await stagingWidget.render();
            spyOn(stagingWidget.stagingAreaViewer, 'deactivate').and.callThrough();
            stagingWidget.activate();
            stagingWidget.deactivate();
            expect(stagingWidget.stagingAreaViewer.deactivate).toHaveBeenCalled();
        });

        it('can be told to update its view', async () => {
            jasmine.clock().install();
            await stagingWidget.render();
            // kinda cheating - but to test that things are run, we know that this will call
            // stagingAreaViewer.render
            spyOn(stagingWidget.stagingAreaViewer, 'updateView');
            stagingWidget.updateView();
            jasmine.clock().tick(stagingWidget.minRefreshTime + 100);
            expect(stagingWidget.stagingAreaViewer.updateView).toHaveBeenCalled();

            jasmine.clock().uninstall();
        });

        it('can be triggered to update its view after a completed upload', async () => {
            await stagingWidget.render();
            spyOn(stagingWidget, 'updateView');
            // a little more cheating with implementation, this triggers the "upload complete" event
            stagingWidget.uploadWidget.dropzone.emit('complete', { name: 'foo', size: 12345 });
            expect(stagingWidget.updateView).toHaveBeenCalled();
        });

        it('only updates its view once per interval on completed uploads', async () => {
            jasmine.clock().install();
            await stagingWidget.render();
            // run a bunch of triggers, should only call render on the staging area once
            spyOn(stagingWidget.stagingAreaViewer, 'updateView');
            for (let i = 0; i < 50; i++) {
                stagingWidget.uploadWidget.dropzone.emit('complete', { name: 'foo', size: 12345 });
            }
            jasmine.clock().tick(stagingWidget.minRefreshTime + 100);
            expect(stagingWidget.stagingAreaViewer.updateView.calls.count()).toEqual(2);
            jasmine.clock().uninstall();
        });
    });
});
