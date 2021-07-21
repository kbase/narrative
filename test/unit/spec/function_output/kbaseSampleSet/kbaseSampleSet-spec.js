define([
    'jquery',
    'kbaseSampleSetView',
    '../../util/mswUtils',
    'require',
    'jsonrpc/1.1/ServiceClient',
    'narrativeConfig',
], ($, KBaseSampleSetView, mswUtils, localRequire, ServiceClient, Config) => {
    'use strict';

    const { tryFor, MockWorker, findTabContent, expectCell, findTab } = mswUtils;

    const WORKSPACE_URL = Config.url('workspace'); // 'https://ci.kbase.us/services/ws';
    const SAMPLE_SERVICE_URL = Config.url('sample_service'); // 'https://ci.kbase.us/services/sampleservice';

    /** The SampleSet viewer requires access to:
     *   - Workspace
     *   - Sample Service
     *   - User Profile Service
     * So We need to mock a set of data which captures all of this. This data was captured
     * from live data in CI.
     *
     * The viewer uses the newer JSON-RPC 1.1 client, which uses fetch, so the Mock Service Worker (MSW)
     * library is used
     */
    function pRequire(modulePath) {
        return new Promise((resolve, reject) => {
            localRequire(
                [modulePath],
                (module) => {
                    resolve(module);
                },
                (err) => {
                    reject(err);
                }
            );
        });
    }

    function sampleServiceHandler() {
        const handleGetSamples = async (params, id) => {
            // just handle ref for now.
            const samples = await Promise.all(
                params.samples.map(({ id, version }) => {
                    const fileName = `sample_${id}_${version}.json`;
                    return pRequire(`json!./data/${fileName}`);
                })
            );

            // Don't forget to wrap the result in an array!
            return {
                version: '1.1',
                id,
                result: [samples],
            };
        };
        return async (req) => {
            const method = req.body.method;
            const [params] = req.body.params;
            switch (method) {
                case 'SampleService.get_samples':
                    try {
                        return await handleGetSamples(params, req.body.id);
                    } catch (ex) {
                        return {
                            version: '1.1',
                            id: req.body.id,
                            error: {
                                message: ex.message,
                            },
                        };
                    }
                default:
                    return {
                        version: '1.1',
                        id: req.body.id,
                        error: {
                            message: 'Method not defined',
                        },
                    };
            }
        };
    }

    function workspaceHandler() {
        const handleGetObjects2 = async (params, id) => {
            // just handle ref for now.
            const objects = await Promise.all(
                params.objects.map((objectSpec) => {
                    const { ref } = objectSpec;
                    // make object ref into a filesystem friendly name
                    // E.g. 53116/17/1 = > 53116-17-1
                    const fileName = `object_${ref.replace(/\//g, '-')}.json`;
                    return pRequire(`json!./data/${fileName}`);
                })
            );

            // Don't forget to wrap the result in an array!
            return {
                version: '1.1',
                id,
                result: [
                    {
                        data: objects,
                    },
                ],
            };
        };

        return async (req) => {
            const method = req.body.method;
            const [params] = req.body.params;
            switch (method) {
                case 'Workspace.get_objects2':
                    try {
                        return await handleGetObjects2(params, req.body.id);
                    } catch (ex) {
                        return {
                            version: '1.1',
                            id: req.body.id,
                            error: {
                                message: ex.message,
                            },
                        };
                    }
                default:
                    return {
                        version: '1.1',
                        id: req.body.id,
                        error: {
                            message: 'Method not defined',
                        },
                    };
            }
        };
    }

    describe('The kbaseSampleSet viewer widget', () => {
        it('should be able to fetch a SampleSet object via the workspace client', async () => {
            const mock = new MockWorker();
            const url = WORKSPACE_URL;
            mock.addJSONResponder(url, workspaceHandler());
            await mock.start();

            const wsClient = new ServiceClient({
                url,
                module: 'Workspace',
                token: 'token',
                timeout: 2000,
            });

            const objects = await wsClient.callFunc('get_objects2', {
                params: {
                    objects: [
                        {
                            ref: '53116/17/1',
                        },
                    ],
                },
            });

            expect(objects).toBeDefined();

            await mock.stop();
        });

        it('should fetch samples via the SampleService', async () => {
            const mock = new MockWorker();
            const url = SAMPLE_SERVICE_URL;
            mock.addJSONResponder(url, sampleServiceHandler());
            await mock.start();

            const sampleServiceClient = new ServiceClient({
                url,
                module: 'SampleService',
                token: 'token',
                timeout: 2000,
            });

            const samples = await sampleServiceClient.callFunc('get_samples', {
                params: {
                    samples: [
                        {
                            id: '11d293e2-b968-4efa-bba4-c16ca61cf4c6',
                            version: 1,
                        },
                    ],
                },
            });

            expect(samples).toBeDefined();

            await mock.stop();
        });

        it('should fetch a SampleSet and all Samples', async () => {
            const mock = new MockWorker();
            mock.addJSONResponder(WORKSPACE_URL, workspaceHandler());
            mock.addJSONResponder(SAMPLE_SERVICE_URL, sampleServiceHandler());
            await mock.start();

            const wsClient = new ServiceClient({
                url: WORKSPACE_URL,
                module: 'Workspace',
                token: 'token',
                timeout: 2000,
            });

            const { data } = await wsClient.callFunc('get_objects2', {
                params: {
                    objects: [
                        {
                            ref: '53116/17/1',
                        },
                    ],
                },
            });
            const sampleSet = data[0].data;

            const sampleServiceClient = new ServiceClient({
                url: SAMPLE_SERVICE_URL,
                module: 'SampleService',
                token: 'token',
                timeout: 2000,
            });

            const samples = await sampleServiceClient.callFunc('get_samples', {
                params: {
                    samples: sampleSet.samples.map(({ id, version }) => {
                        return { id, version };
                    }),
                },
            });

            expect(samples).toBeDefined();

            await mock.stop();
        });

        it('should render a SampleSet', async () => {
            const mock = new MockWorker();
            mock.addJSONResponder(WORKSPACE_URL, workspaceHandler());
            mock.addJSONResponder(SAMPLE_SERVICE_URL, sampleServiceHandler());
            await mock.start();

            const $div = $('<div>');
            new KBaseSampleSetView($div, { upas: { id: '53116/17/1' } });

            function findDescription() {
                return tryFor(() => {
                    const textToMatch = $div.html();
                    const result = /whondrs 8 samples two user columns/.test(textToMatch);
                    return Promise.resolve([result, result]);
                }, 3000);
            }

            await expectAsync(findDescription()).toBeResolvedTo(true);

            // Inspect the rows of the summary table.
            const $summaryTab = await findTab($div, 'Summary');
            expect($summaryTab).toBeDefined();
            $summaryTab.click();

            const $summaryTabContent = await findTabContent($div, 1);
            expect($summaryTabContent).toBeDefined();

            expectCell($summaryTabContent, 1, 1, 1, 'KBase Object Name');
            expectCell(
                $summaryTabContent,
                1,
                1,
                2,
                'WHONDRS_8_samples_JE_TwoUserColumns.xlsx_-_Sheet1.csv_sample_set'
            );

            [
                ['Saved by', 'kbaseuitest'],
                ['Number of Samples', '8'],
                ['Description', 'whondrs 8 samples two user columns'],
            ].forEach((row, rowIndex) => {
                row.forEach((cellText, cellIndex) => {
                    expectCell($summaryTabContent, 1, rowIndex + 2, cellIndex + 1, cellText);
                });
            });

            // Inspect the rows of the samples table.
            const $samplesTab = await findTab($div, 'Samples');
            expect($samplesTab).toBeDefined();
            $samplesTab.click();

            const $samplesTabContent = await findTabContent($div, 2);
            expect($samplesTabContent).toBeDefined();

            // Tests first sample in the set.
            [
                'SESAR',
                'HRV003M16',
                'Other',
                'Filter',
                '15 hour time point. Filter used for filtered pore water samples (second site located a few meters upstream in a more variably inundated zone)',
                '0.22 micron filter used to filter water samples',
                'Microbial analyses (e.g. metagenomics, metatranscriptomics) for 48hr time series (whondrs.pnnl.gov)',
                '31.335',
                '-81.479',
                'Stream',
                'Altamaha River',
                'Persistently inundated location of the stream near to the shoreline.',
                'United States',
                'WHONDRS 48hr',
                'Christof Meile',
                '2018-10-17',
                '10:00:00Z',
                'Associated data from surface and pore water samples (i.e. anions, cations, FTICR) are published on ESS-DIVE',
                'Pore Water',
                'https://data.ess-dive.lbl.gov/view/doi:10.15485/1577263',
                'DOI',
                '15hr',
            ].forEach((text, index) => {
                expectCell($samplesTabContent, 2, 1, index + 1, text);
            });

            // Check second column.
            [
                'HRV003M16',
                'WHO000BC7',
                'IECUR0002',
                'HRV003M16X',
                'WHO000BC8',
                'WHO000BC7',
                'IECUR0002Y',
                'IECUR0002Z',
            ].forEach((text, rowIndex) => {
                expectCell($samplesTabContent, 2, rowIndex + 1, 2, text);
            });

            await mock.stop();
        });
    });
});
