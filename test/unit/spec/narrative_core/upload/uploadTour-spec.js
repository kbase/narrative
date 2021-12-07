define([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/uploadTour',
    'kbaseNarrativeStagingDataTab',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
], ($, UploadTour, StagingDataTab, Jupyter, Config, TestUtil) => {
    'use strict';

    const fakeUser = 'fakeuser',
        stagingServiceUrl = Config.url('staging_api_url');
    describe('staging area upload tour', () => {
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
                showDataOverlay: () => {},
                hideOverlay: () => {},
            };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        afterAll(() => {
            TestUtil.clearRuntime();
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
            tourInstance.stop();
        });

        xit('Can run with the Globus step', async () => {
            const stagingDiv = $('div'),
                tourDiv = $('div');
            $(document.body).append(stagingDiv);
            $(document.body).append(tourDiv);
            const stagingWidget = new StagingDataTab(stagingDiv);
            const tourInstance = new UploadTour.Tour(tourDiv, true);

            await stagingWidget.render();
            await TestUtil.waitForElement(
                document.body,
                '.kb-staging-table .kb-staging-table-body__name',
                () => stagingWidget.activate()
            );
            tourInstance.start();
            for (const step of tourInstance.tour_steps) {
                const tourOuter = 'div.kb-tour';
                const titleSelector = `${tourOuter} > h3.popover-title`;
                const bodySelector = `${tourOuter} > div.popover-content`;
                const nextSelector = `${tourOuter} button.fa-step-forward`;
                await TestUtil.waitFor({
                    documentElement: document.body,
                    domStateFunction: () => {
                        return (
                            document.querySelector(titleSelector) !== null &&
                            document.querySelector(titleSelector).textContent === step.title
                        );
                    },
                });
                expect(document.querySelector(bodySelector).textContent).toEqual(step.content);
                $(document.querySelector(nextSelector)).click();
            }
            tourInstance.stop();
        });
    });
});
