define([
    'kbaseNarrativeDataList',
    'jquery',
    'narrativeConfig',
    'kb_service/client/workspace',
    'base/js/namespace',
    'narrativeMocks',
], (DataList, $, Config, Workspace, Jupyter, Mocks) => {
    'use strict';

    const fakeNSUrl = 'https://ci.kbase.us/services/fake_url';
    const narrativeServiceInfo = {
        version: '1.1',
        id: '12345',
        result: [
            {
                git_commit_hash: 'foo',
                hash: 'bar',
                health: 'healthy',
                module_name: 'SampleService',
                url: fakeNSUrl,
            },
        ],
    };

    function mockServiceWizard() {
        jasmine.Ajax.stubRequest(Config.url('service_wizard')).andReturn({
            status: 200,
            statusText: 'HTTP/1/1 200 OK',
            contentType: 'application/json',
            responseText: JSON.stringify(narrativeServiceInfo),
        });
    }

    function mockNarrativeServiceListObjects(objData) {
        jasmine.Ajax.stubRequest(fakeNSUrl).andReturn({
            status: 200,
            statusText: 'HTTP/1 200 OK',
            contentType: 'application/json',
            responseText: JSON.stringify({
                version: '1.1',
                id: '12345',
                result: [
                    {
                        // The data object is where objects will be return
                        data: objData,
                        data_palette_refs: {},
                    },
                ],
            }),
        });
    }

    function mockWorkSpaceService() {
        jasmine.Ajax.stubRequest('https://ci.kbase.us/services/ws').andReturn({
            status: 200,
            statusText: 'success',
            contentType: 'application/json',
            responseHeaders: '',
            responseText: JSON.stringify({
                version: '1.1',
                result: [
                    [
                        35855,
                        'testUser:narrative_1534979778065',
                        'testUser',
                        '2020-09-30T23:22:25+0000',
                        2,
                        'a',
                        'n',
                        'unlocked',
                        {
                            narrative_nice_name: 'CI Scratch',
                            searchtags: 'narrative',
                            is_temporary: 'false',
                            narrative: '1',
                        },
                    ],
                ],
            }),
        });
    }

    describe('Test the kbaseNarrativeDataList', () => {
        let $dataList, dataListObj;
        beforeEach(() => {
            $dataList = $('<div>');
            jasmine.Ajax.install();
            const AUTH_TOKEN = 'fakeAuthToken';
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                getWorkspaceName: () => 'someWorkspace',
            };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            Jupyter.narrative = null;
        });

        describe('Without data', () => {
            beforeEach(async () => {
                const objData = [];

                // mock service calls
                mockServiceWizard();
                mockNarrativeServiceListObjects(objData);
                mockWorkSpaceService();

                // Create datalist object
                dataListObj = new DataList($dataList, {});
                expect(dataListObj).toBeDefined();

                // Populate datalist object via the refresh function
                dataListObj.ws_name = 'some_workspace';
                dataListObj.ws = new Workspace(Config.url('workspace'), null);
                await dataListObj.refresh();
            });

            it('Should instantiate itself', () => {
                expect(dataListObj).toBeDefined();
                expect($dataList.html()).toContain('This Narrative has no data yet.');
            });

            it('Should render the add data text button and hide the other add data button', () => {
                const $addDataTxtButton = $dataList.find('.kb-data-list-add-data-text-button');
                expect($addDataTxtButton).toBeDefined();
                expect($addDataTxtButton.length).toEqual(1);
                expect($addDataTxtButton.is('button')).toBeTruthy();
                expect($addDataTxtButton.html()).toContain('Add Data');

                const $addDataButton = $dataList.find('.kb-data-list-add-data-button');
                // When .hide() is called on a jquery element, the display attribute is set to none.
                expect($addDataButton.css('display')).toEqual('none');
            });
        });

        describe('With data', () => {
            beforeEach(async () => {
                const objData = [
                    {
                        object_info: [
                            5,
                            'Rhodobacter_CACIA_14H1',
                            'KBaseGenomes.Genome-7.0',
                            '2020-10-03T01:15:14+0000',
                            1,
                            'testuser',
                            54640,
                            'testuser:narrative_1601675739009',
                            '53af8071b814a1db43f81eb490a35491',
                            3110399,
                            {},
                        ],
                    },
                ];

                // mock service calls
                mockServiceWizard();
                mockNarrativeServiceListObjects(objData);
                mockWorkSpaceService();

                // Create datalist object
                dataListObj = new DataList($dataList, {});

                // Populate datalist object via the refresh function
                dataListObj.ws_name = 'some_workspace';
                dataListObj.ws = new Workspace(Config.url('workspace'), null);
                await dataListObj.refresh();
            });

            it('Should instantiate itself', () => {
                expect(dataListObj).toBeDefined();
            });

            it('Should render a data object row', () => {
                expect($dataList.find('.narrative-card-row')).toBeDefined();
            });

            it('Should generate the add data button ', () => {
                const $addDataButton = $dataList.find('.kb-data-list-add-data-button');
                expect($addDataButton).toBeDefined();
                expect($addDataButton.length).toEqual(1);
                expect($addDataButton.is('button')).toBeTruthy();
                expect($addDataButton.css('display')).toEqual('inline-block');
            });
        });
    });
});
