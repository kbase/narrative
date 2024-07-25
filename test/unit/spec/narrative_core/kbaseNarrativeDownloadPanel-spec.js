define([
    'jquery',
    'kbaseNarrativeDownloadPanel',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
    'narrativeConfig',
], ($, kbaseNarrativeDownloadPanel, Jupyter, Mocks, TestUtil, Config) => {
    const JSON_EXPORT_APP = 'kb_staging_exporter/export_json_to_staging';
    const STAGING_EXPORT_APP = 'kb_staging_exporter/export_to_staging';
    const CSS_BASE = 'kb-download-panel';

    describe('The kbaseNarrativeDownloadPanel widget', () => {
        let $div = null;
        const ws = 1111,
            oid = 2222,
            ver = 3333,
            name = 'fake_test_object',
            objType = 'FakeModule.FakeType',
            upa = `${ws}/${oid}/${ver}`;

        const initDownloadPanel = async (authToken, exporterCache) => {
            return await new kbaseNarrativeDownloadPanel($div, {
                token: authToken,
                type: objType,
                objId: oid,
                ref: upa,
                objName: name,
                downloadSpecCache: exporterCache,
            });
        };

        beforeEach(() => {
            jasmine.Ajax.install();
            const AUTH_TOKEN = 'fakeAuthToken';
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                addAndPopulateApp: () => {},
                sidePanel: {
                    $methodsWidget: {
                        currentTag: 'release',
                    },
                },
            };
            $div = $('<div>');
        });

        afterEach(() => {
            Mocks.clearAuthToken();
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
            $div.remove();
            TestUtil.clearRuntime();
        });

        const exportCases = [
            ['single method', { FAKE: 'fake_method' }],
            ['a staging method', { FAKE: 'fake_method', STAGING: 'fake_staging_method' }],
            ['no downloaders', {}],
        ];
        exportCases.forEach((exportCase) => {
            it(`Should properly load with ${exportCase[0]}`, async () => {
                const exporters = exportCase[1];
                const exporterCache = {
                    lastUpdateTime: 100,
                    types: {
                        [objType]: { export_functions: exporters },
                    },
                };

                await initDownloadPanel(null, exporterCache);
                const exportBtns = $div.find('.kb-data-list-btn');
                const names = Object.keys(exporters);
                expect(exportBtns.length).toEqual(1 + names.length);
                [...names, 'JSON'].forEach((exporterName, idx) => {
                    expect(exportBtns[idx].textContent).toContain(exporterName);
                });
                expect($div.find('.kb-data-list-cancel-btn').html()).toContain('Cancel');
            });
        });

        it('Should load after fetching exporter info from NMS', async () => {
            jasmine.Ajax.stubRequest(
                Config.url('narrative_method_store'),
                /NarrativeMethodStore.list_categories/
            ).andReturn({
                status: 200,
                statusText: 'HTTP/1 200 OK',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    version: '1.1',
                    id: '12345',
                    result: [
                        {},
                        {},
                        {},
                        {
                            'FakeModule.FakeType': {
                                export_functions: {
                                    SOME_FORMAT: 'export_as_some_format',
                                },
                            },
                        },
                    ],
                }),
            });

            await initDownloadPanel(null, {});
            const exportBtns = $div.find('.kb-data-list-btn');
            expect(exportBtns.length).toEqual(2);
            ['SOME_FORMAT', 'JSON'].forEach((exporterName, idx) => {
                expect(exportBtns[idx].textContent).toContain(exporterName);
            });
            expect($div.find('.kb-data-list-cancel-btn').html()).toContain('Cancel');
        });

        it('Should show an error if NMS fails on start', async () => {
            Mocks.mockJsonRpc1Call({
                url: Config.url('narrative_method_store'),
                body: /list_categories/,
                statusCode: 500,
                response: 'an error happened',
                isError: true,
            });

            await initDownloadPanel(null, {});
            const $status = $div.find(`.${CSS_BASE}__status`);
            expect($status.text()).toContain('Error: an error happened');
        });

        it('Should start a "hidden" download job when clicking an exporter', async () => {
            /* uses mocks
             *   ee2.run_job
             *   ee2.check_job
             *   ee2.job_logs
             *   DataImportExport url
             */
            const fakeJobId = 'dl_job_123',
                exportApp = 'exporter/export_as_some_format',
                exporterCache = {
                    lastUpdateTime: 100,
                    types: {
                        [objType]: {
                            export_functions: {
                                SOME_FORMAT: exportApp,
                            },
                        },
                    },
                };
            // set up mocks here
            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /run_job/,
                response: [fakeJobId],
            });
            // instant finish to the job!
            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /check_job/,
                response: {
                    running: 12345,
                    finished: 67890,
                    status: 'completed',
                    job_output: {
                        result: [
                            {
                                shock_id: 'some_shock_id',
                            },
                        ],
                    },
                },
            });
            // some logs
            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /execution_engine2.get_job_logs/,
                response: {
                    count: 1,
                    last_line_number: 1,
                    lines: [
                        {
                            line: 'a bit of log',
                            is_error: 0,
                        },
                    ],
                },
            });

            const dlUrlRegex = new RegExp(Config.url('blobstore'));
            jasmine.Ajax.stubRequest(dlUrlRegex);

            await initDownloadPanel(null, exporterCache);
            const exportBtns = $div.find('.kb-data-list-btn');

            await TestUtil.waitForElementState(
                document,
                () => {
                    return document.getElementById('hiddenDownloader') !== null;
                },
                () => {
                    exportBtns[0].click();
                }
            );
            const iframe = document.getElementById('hiddenDownloader');
            expect(iframe).not.toBeNull();
            const expectedUrl =
                'https://ci.kbase.us/services/blobstore/node/some_shock_id?download&del';
            expect(iframe.src).toBe(expectedUrl);
        });

        it('Should show an error if the hidden download job fails to start', async () => {
            const exportApp = 'exporter/export_as_some_format',
                errorMsg = 'failed to start job',
                exporterCache = {
                    lastUpdateTime: 100,
                    types: {
                        [objType]: {
                            export_functions: {
                                SOME_FORMAT: exportApp,
                            },
                        },
                    },
                };
            // set up mocks here
            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /run_job/,
                statusCode: 500,
                response: errorMsg,
                isError: true,
            });

            const widget = await initDownloadPanel(null, exporterCache);
            const exportBtns = $div.find('.kb-data-list-btn');

            await TestUtil.waitForElementState(
                $div[0],
                () => {
                    const text = $div[0].querySelector(`.${CSS_BASE}__status`).textContent || '';
                    return text.endsWith(errorMsg);
                },
                () => {
                    exportBtns[0].click();
                }
            );
            expect($div[0].querySelector(`.${CSS_BASE}__status`).textContent).toContain(errorMsg);
            expect(widget.timer).toBeNull();
        });

        it('Should show running logs during a download job', async () => {
            const fakeJobId = 'dl_job_123456',
                exportApp = 'exporter/export_as_some_format',
                exporterCache = {
                    lastUpdateTime: 100,
                    types: {
                        [objType]: {
                            export_functions: {
                                SOME_FORMAT: exportApp,
                            },
                        },
                    },
                },
                jobStates = [
                    [{ running: 12345 }],
                    [
                        {
                            running: 12345,
                            finished: 11111,
                            status: 'completed',
                            job_output: {
                                result: [
                                    {
                                        shock_id: 'foobar',
                                    },
                                ],
                            },
                        },
                    ],
                ];

            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /run_job/,
                response: [fakeJobId],
            });

            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /get_job_logs/,
                response: {
                    count: 1,
                    last_line_number: 1,
                    lines: [
                        {
                            line: 'some log',
                            isError: 0,
                        },
                    ],
                },
            });

            // we're running a couple times so things complete, and the mocks aren't set
            // up for that, so just call jasmine.Ajax directly
            jasmine.Ajax.stubRequest(Config.url('execution_engine2'), /check_job/).andCallFunction(
                (request) => {
                    const response = {
                        version: '1.1',
                        id: '12345',
                        result: jobStates.shift(),
                    };
                    request.respondWith({
                        status: 200,
                        statusText: 'HTTP/1.1 200 OK',
                        contentType: 'application/json',
                        responseText: JSON.stringify(response),
                    });
                }
            );

            const widget = await initDownloadPanel(null, exporterCache);
            const exportBtns = $div.find('.kb-data-list-btn');

            await TestUtil.waitForElementState(
                $div[0],
                () => {
                    const text = $div[0].querySelector(`.${CSS_BASE}__status`).textContent || '';
                    return text.endsWith('some log');
                },
                () => {
                    exportBtns[0].click();
                }
            );
            expect($div[0].querySelector(`.${CSS_BASE}__status`).textContent).toContain('some log');
            expect(widget.timer).not.toBeNull();

            await TestUtil.waitForElementState($div[0], () => {
                const text = $div[0].querySelector(`.${CSS_BASE}__status`).textContent;
                return text === '';
            });

            expect($div[0].querySelector(`.${CSS_BASE}__status`).textContent).toBe('');
            expect(widget.timer).toBeNull();
        });

        it('Should show an error if one happens while trying to get the job state', async () => {
            /* uses mocks
             *   ee2.run_job
             *   ee2.check_job
             *   ee2.job_logs
             *   DataImportExport url
             */
            const fakeJobId = 'dl_job_123',
                exportApp = 'exporter/export_as_some_format',
                exporterCache = {
                    lastUpdateTime: 100,
                    types: {
                        [objType]: {
                            export_functions: {
                                SOME_FORMAT: exportApp,
                            },
                        },
                    },
                },
                errorMsg = 'error while checking job state';
            // set up mocks here
            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /run_job/,
                response: [fakeJobId],
            });
            // instant finish to the job!
            Mocks.mockJsonRpc1Call({
                url: Config.url('execution_engine2'),
                body: /check_job/,
                response: errorMsg,
                isError: true,
                statusCode: 500,
            });

            const widget = await initDownloadPanel(null, exporterCache);
            const exportBtns = $div.find('.kb-data-list-btn');

            await TestUtil.waitForElementState(
                $div[0],
                () => {
                    const text = $div[0].querySelector(`.${CSS_BASE}__status`).textContent || '';
                    return text.endsWith(errorMsg);
                },
                () => {
                    exportBtns[0].click();
                }
            );
            expect($div[0].querySelector(`.${CSS_BASE}__status`).textContent).toContain(errorMsg);
            expect(widget.timer).toBeNull();
        });

        it('Should create an app cell with the staging exporter', async () => {
            /* use mock for Jupyter.narrative.addAndPopulateApp */
            spyOn(Jupyter.narrative, 'addAndPopulateApp');
            const exporterCache = {
                lastUpdateTime: 100,
                types: {
                    [objType]: {
                        export_functions: {
                            STAGING: 'gets_overwritten_right_now',
                        },
                    },
                },
            };
            await initDownloadPanel(null, exporterCache);
            const exportBtns = $div.find('.kb-data-list-btn');
            // expect 2 buttons - STAGING, JSON, in that order.
            expect(exportBtns.length).toEqual(2);
            exportBtns[0].click();
            expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledOnceWith(
                STAGING_EXPORT_APP,
                'release',
                { input_ref: 'fake_test_object' }
            );
        });

        it('Should create an app cell with the JSON exporter', async () => {
            /* use mock for Jupyter.narrative.addAndPopulateApp */
            spyOn(Jupyter.narrative, 'addAndPopulateApp');
            await initDownloadPanel(null, { lastUpdateTime: 100, types: { [objType]: {} } });
            const exportBtn = $div.find('.kb-data-list-btn');
            // only one is JSON
            expect(exportBtn.length).toEqual(1);
            exportBtn.click();
            expect(Jupyter.narrative.addAndPopulateApp).toHaveBeenCalledOnceWith(
                JSON_EXPORT_APP,
                'release',
                { input_ref: 'fake_test_object' }
            );
        });

        it('Should have a cancel button that empties the widget', async () => {
            const widget = await initDownloadPanel(null, {
                lastUpdateTime: 100,
                types: { [objType]: {} },
            });
            const cancelBtn = $div.find('.kb-data-list-cancel-btn');
            cancelBtn.click();
            expect($div.children().length).toBe(0);
            expect(widget.timer).toBeNull();
        });
    });
});
