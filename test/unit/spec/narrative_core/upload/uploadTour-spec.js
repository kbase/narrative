define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/uploadTour',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], ($, UploadTour, Jupyter, Config, TestUtil) => {
    'use strict';

    const fakeUser = 'fakeuser',
        stagingServiceUrl = Config.url('staging_api_url');
    describe('staging area upload tour', () => {
        beforeAll(() => {
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
                showDataOverlay: () => {},
                hideOverlay: () => {},
            };
        });

        afterAll(() => {
            TestUtil.clearRuntime();
            jasmine.Ajax.uninstall();
        });

        it('Loaded the Tour module', () => {
            expect(UploadTour).toEqual(jasmine.any(Object));
            expect(UploadTour.Tour).toEqual(jasmine.any(Function));
        });

        it('Can be instantiated', () => {
            const tourInstance = new UploadTour.Tour($('div'));
            expect(tourInstance).not.toBe(null);
        });

        it('Can be started', () => {
            const tourInstance = new UploadTour.Tour($('div'));
            tourInstance.start();
            expect(document.querySelector('.kb-tour')).toBeTruthy();
        });
    });
});
