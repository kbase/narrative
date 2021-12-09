define([
    'jquery',
    'kbaseSampleSetView',
    '../../util/mswUtils',
    'require',
    'jsonrpc/1.1/ServiceClient',
    'narrativeConfig',
    'json!./data/index.json',
], ($, KBaseSampleSetView, mswUtils, localRequire, ServiceClient, Config, testData) => {
    'use strict';

    const { tryFor, MockWorker, findTabContent, expectCell, findTab, getProp } = mswUtils;

    const WORKSPACE_URL = Config.url('workspace'); // 'https://ci.kbase.us/services/ws';
    const SAMPLE_SERVICE_URL = Config.url('sample_service'); // 'https://ci.kbase.us/services/sampleservice';

    /** The SampleSet viewer requires access to:
     *   - Workspace
     *   - Sample Service
     *
     * So We need to mock a set of data which captures all of this. This data was captured
     * from live data in CI using the `kbaseuitest` account.
     *
     * The viewer uses the newer JSON-RPC 1.1 client, which uses fetch, so the Mock Service Worker (MSW)
     * library is used
     */

    /**
     * An `msw` handler for the sample service. It handles the methods implemented within the switch statement,
     * using data available in the local `data` directory.
     *
     * @returns {Promise} A promise which resolves to the jsonrpc response for the requested method;
     *                    or an error response.
     */
    function sampleServiceHandler(sampleSetName) {
        const handleGetSamples = (params, id) => {
            const samples = params.samples.map(({ id: sampleId, version }) => {
                const fileName = `sample_${sampleId}_${version}.json`;
                const path = [sampleSetName, fileName];
                return getProp(testData, path);
            });

            // Don't forget to wrap the result in an array!
            return {
                version: '1.1',
                id,
                result: [samples],
            };
        };
        return (req) => {
            const rpc = JSON.parse(req.body);
            const method = rpc.method;
            const [params] = rpc.params;
            switch (method) {
                case 'SampleService.get_samples':
                    try {
                        return handleGetSamples(params, rpc.id);
                    } catch (ex) {
                        return {
                            version: '1.1',
                            id: rpc.id,
                            error: {
                                name: 'JSONRPCError',
                                code: 100,
                                message: ex.message,
                            },
                        };
                    }
                default:
                    return {
                        version: '1.1',
                        id: rpc.id,
                        error: {
                            name: 'JSONRPCError',
                            code: -32601,
                            message: 'Method not found',
                        },
                    };
            }
        };
    }

    /**
     * An `msw` handler for the workspace. It handles the methods implemented within the switch statement,
     * using data available in the local `data` directory.
     *
     * @returns {Promise} A promise which resolves to the jsonrpc response for the requested method;
     *                    or an error response.
     */
    function workspaceHandler(sampleSetName) {
        const handleGetObjects2 = (params, id) => {
            const objects = params.objects.map((objectSpec) => {
                // make object ref into a filesystem friendly name
                // E.g. 53116/17/1 = > 53116-17-1
                const { ref } = objectSpec;
                const fileName = `object_${ref.replace(/\//g, '_')}.json`;
                const path = [sampleSetName, fileName];
                return getProp(testData, path);
            });

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

        return (req) => {
            const rpc = JSON.parse(req.body);
            const method = rpc.method;
            // console.log('BODY', req.body);
            const [params] = rpc.params;
            switch (method) {
                case 'Workspace.get_objects2':
                    try {
                        return handleGetObjects2(params, rpc.id);
                    } catch (ex) {
                        return {
                            version: '1.1',
                            id: rpc.id,
                            error: {
                                name: 'JSONRPCError',
                                code: 100,
                                message: ex.message,
                            },
                        };
                    }
                default:
                    return {
                        version: '1.1',
                        id: rpc.id,
                        error: {
                            name: 'JSONRPCError',
                            code: -32601,
                            message: 'Method not found',
                        },
                    };
            }
        };
    }

    describe('The kbaseSampleSet viewer widget with a SESAR sample set', () => {
        let mock = null;
        beforeAll(async () => {
            mock = new MockWorker();
            await mock.start();
            mock.useJSONResponder(WORKSPACE_URL, workspaceHandler('sampleSet1'));
            mock.useJSONResponder(SAMPLE_SERVICE_URL, sampleServiceHandler('sampleSet1'));
        });

        afterAll(() => {
            if (mock) {
                mock.stop();
            }
        });

        it('should be able to fetch a SampleSet object via the workspace client', async () => {
            const wsClient = new ServiceClient({
                url: WORKSPACE_URL,
                module: 'Workspace',
                token: 'token',
                timeout: 2000,
            });

            const objects = await wsClient.callFunc('get_objects2', {
                objects: [
                    {
                        ref: '53116/17/1',
                    },
                ],
            });

            expect(objects).toBeDefined();
        });

        it('should fetch samples via the SampleService', async () => {
            const sampleServiceClient = new ServiceClient({
                url: SAMPLE_SERVICE_URL,
                module: 'SampleService',
                token: 'token',
                timeout: 2000,
            });

            const samples = await sampleServiceClient.callFunc('get_samples', {
                samples: [
                    {
                        id: '11d293e2-b968-4efa-bba4-c16ca61cf4c6',
                        version: 1,
                    },
                ],
            });

            expect(samples).toBeDefined();
        });

        it('should fetch a SampleSet and all Samples', async () => {
            const wsClient = new ServiceClient({
                url: WORKSPACE_URL,
                module: 'Workspace',
                token: 'token',
                timeout: 2000,
            });

            const { data } = await wsClient.callFunc('get_objects2', {
                objects: [
                    {
                        ref: '53116/17/1',
                    },
                ],
            });
            const sampleSet = data[0].data;

            const sampleServiceClient = new ServiceClient({
                url: SAMPLE_SERVICE_URL,
                module: 'SampleService',
                token: 'token',
                timeout: 2000,
            });

            const samples = await sampleServiceClient.callFunc('get_samples', {
                samples: sampleSet.samples.map(({ id, version }) => {
                    return { id, version };
                }),
            });

            expect(samples).toBeDefined();
        });

        it('should render a SampleSet', async () => {
            const sampleSetViewWidget = new KBaseSampleSetView($('<div>'), {
                upas: { id: '53116/17/1' },
            });
            sampleSetViewWidget.loggedInCallback();
            const $sampleSetView = sampleSetViewWidget.$elem;

            function findDescription() {
                return tryFor(() => {
                    const textToMatch = $sampleSetView.html();
                    const result = /whondrs 8 samples two user columns/.test(textToMatch);
                    return Promise.resolve([result, result]);
                }, 3000);
            }

            await expectAsync(findDescription()).toBeResolvedTo(true);

            // Inspect the rows of the summary table.
            const $summaryTab = await findTab($sampleSetView, 'Summary');
            expect($summaryTab).toBeDefined();
            $summaryTab.click();

            const $summaryTabContent = await findTabContent($sampleSetView, 1);
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
            const $samplesTab = await findTab($sampleSetView, 'Samples');
            expect($samplesTab).toBeDefined();
            $samplesTab.click();

            const $samplesTabContent = await findTabContent($sampleSetView, 2);
            expect($samplesTabContent).toBeDefined();

            // Tests first sample in the set.
            [
                '1',
                'altamaha_2018_pw_15hr_WHONDRS-PP48-000107',
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

            // Check 4th column.
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
                expectCell($samplesTabContent, 2, rowIndex + 1, 4, text);
            });
        });
    });

    describe('The kbaseSampleSet viewer widget with an ENIGMA sample set', () => {
        let mock = null;
        beforeAll(async () => {
            mock = new MockWorker();
            await mock.start();
            mock.useJSONResponder(WORKSPACE_URL, workspaceHandler('sampleSet2'));
            mock.useJSONResponder(SAMPLE_SERVICE_URL, sampleServiceHandler('sampleSet2'));
        });

        afterAll(async () => {
            if (mock) {
                await mock.stop();
                mock.reset();
            }
        });

        it('should be able to fetch a SampleSet object via the workspace client', async () => {
            const wsClient = new ServiceClient({
                url: WORKSPACE_URL,
                module: 'Workspace',
                token: 'token',
                timeout: 2000,
            });

            const objects = await wsClient.callFunc('get_objects2', {
                objects: [
                    {
                        ref: '53116/34/1',
                    },
                ],
            });

            expect(objects).toBeDefined();
        });

        it('should fetch samples via the SampleService', async () => {
            const sampleServiceClient = new ServiceClient({
                url: SAMPLE_SERVICE_URL,
                module: 'SampleService',
                token: 'token',
                timeout: 2000,
            });

            const samples = await sampleServiceClient.callFunc('get_samples', {
                samples: [
                    {
                        id: '1e476e13-20be-4133-bf8a-6a5681423070',
                        version: 1,
                    },
                ],
            });

            expect(samples).toBeDefined();
        });

        it('should fetch a SampleSet and all Samples', async () => {
            const wsClient = new ServiceClient({
                url: WORKSPACE_URL,
                module: 'Workspace',
                token: 'token',
                timeout: 2000,
            });

            const { data } = await wsClient.callFunc('get_objects2', {
                objects: [
                    {
                        ref: '53116/34/1',
                    },
                ],
            });
            const sampleSet = data[0].data;

            const sampleServiceClient = new ServiceClient({
                url: SAMPLE_SERVICE_URL,
                module: 'SampleService',
                token: 'token',
                timeout: 2000,
            });

            const samples = await sampleServiceClient.callFunc('get_samples', {
                samples: sampleSet.samples.map(({ id, version }) => {
                    return { id, version };
                }),
            });

            expect(samples).toBeDefined();
        });

        it('should render a SampleSet', async () => {
            const sampleSetViewWidget = new KBaseSampleSetView($('<div>'), {
                upas: { id: '53116/34/1' },
            });
            sampleSetViewWidget.loggedInCallback();
            const $sampleSetView = sampleSetViewWidget.$elem;

            function findDescription() {
                return tryFor(() => {
                    const textToMatch = $sampleSetView.html();
                    const result = /enigma sample set first 10 samples/.test(textToMatch);
                    return Promise.resolve([result, result]);
                }, 3000);
            }

            await expectAsync(findDescription()).toBeResolvedTo(true);

            // Inspect the rows of the summary table.
            const $summaryTab = await findTab($sampleSetView, 'Summary');
            expect($summaryTab).toBeDefined();
            $summaryTab.click();

            const $summaryTabContent = await findTabContent($sampleSetView, 1);
            expect($summaryTabContent).toBeDefined();

            expectCell($summaryTabContent, 1, 1, 1, 'KBase Object Name');
            expectCell(
                $summaryTabContent,
                1,
                1,
                2,
                'ENIGMA_SampleMetaData_AddedENVO_May4-2_first_10.csv_sample_set'
            );

            [
                ['Saved by', 'kbaseuitest'],
                ['Number of Samples', '10'],
                ['Description', 'enigma sample set first 10 samples'],
            ].forEach((row, rowIndex) => {
                row.forEach((cellText, cellIndex) => {
                    expectCell($summaryTabContent, 1, rowIndex + 2, cellIndex + 1, cellText);
                });
            });

            // Inspect the rows of the samples table.
            const $samplesTab = await findTab($sampleSetView, 'Samples');
            expect($samplesTab).toBeDefined();
            $samplesTab.click();

            const $samplesTabContent = await findTabContent($sampleSetView, 2);
            expect($samplesTabContent).toBeDefined();

            // Tests first sample in the set.
            [
                '1',
                '0408-FW021.46.11.27.12.02',
                'ENIGMA',
                'filtered groundwater',
                '100 Well',
                'Area 1',
                'FW021',
                'water',
                'ENVO:01001004',
                '2',
                '35.978',
                '-84.272',
                '597.8652',
                '11/27/12',
                '10:17:00 AM',
                'UTC-4',
                '6678.5',
            ].forEach((text, index) => {
                expectCell($samplesTabContent, 2, 1, index + 1, text);
            });

            // Check 7th column, Well Name
            [
                'FW021',
                'FW021',
                'FW021',
                'FW021',
                'FW106',
                'FW233-17',
                'FW233-17',
                'FW303',
                'FW303',
                'FW303',
            ].forEach((text, rowIndex) => {
                expectCell($samplesTabContent, 2, rowIndex + 1, 7, text);
            });
        });
    });
});
