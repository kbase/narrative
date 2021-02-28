define([
    'kbaseNarrativeDataList',
    'jquery',
    'narrativeConfig',
    'kb_service/client/workspace',
    'base/js/namespace',
    'narrativeMocks'
], (DataList, $, Config, Workspace, Jupyter, Mocks) => {
    'use strict';

    const FAKE_NS_URL = 'https://ci.kbase.us/services/fake_url';
    const FAKE_WS_NAME = 'some_workspace';

    function mockNarrativeServiceListObjects(objData) {
        Mocks.mockJsonRpc1Call({
            url: FAKE_NS_URL,
            response: {
                data: objData,
                data_palette_refs: {}
            }
        });
    }

    function mockWorkSpaceService() {
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            response: [
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
        });
    }

    const OBJDATA = [
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

    function makeDataListInstance($node) {
        const widget = new DataList($node, {});
        widget.ws_name = FAKE_WS_NAME;
        widget.ws = new Workspace(Config.url('workspace'), null);
        return widget;
    }


    describe('Test the kbaseNarrativeDataList', () => {
        let $dataList;
        let dataListObj = null;

        beforeAll(() => {
            // remove any jquery events that get bound to document,
            // including login and logout listeners
            $(document).off();
        });

        beforeEach(() => {
            jasmine.Ajax.install();
            Jupyter.narrative = {
                getAuthToken: () => 'someToken',
                getWorkspaceName: () => 'someWorkspace',
            };

            // mock service calls
            Mocks.mockServiceWizardLookup({
                module: 'NarrativeService',
                url: FAKE_NS_URL,
            });
            mockWorkSpaceService();

            // Create datalist object
            $dataList = $('<div>');
            dataListObj = makeDataListInstance($dataList);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            dataListObj.destroy();
            $dataList.remove();
            $dataList = null;
            dataListObj = null;
            $(document).off();
        });

        it('Should instantiate itself with expected functions', () => {
            expect(dataListObj).toEqual(jasmine.any(Object));
            ['refresh', 'destroy'].forEach((fn) => {
                expect(dataListObj[fn]).toEqual(jasmine.any(Function));
            });
        });

        it('Should render itself without data', async () => {
            mockNarrativeServiceListObjects([]);
            await dataListObj.refresh();

            expect($dataList.html()).toContain('This Narrative has no data yet.');
        });

        it('Should render the add data text button w/o data, and hide the other add data button', async () => {
            mockNarrativeServiceListObjects([]);
            await dataListObj.refresh();

            const $addDataTxtButton = $dataList.find('.kb-data-list-add-data-text-button');
            expect($addDataTxtButton).toBeDefined();
            expect($addDataTxtButton.length).toEqual(1);
            expect($addDataTxtButton.is('button')).toBeTruthy();
            expect($addDataTxtButton.html()).toContain('Add Data');

            const $addDataButton = $dataList.find('.kb-data-list-add-data-button');
            // When .hide() is called on a jquery element, the display attribute is set to none.
            expect($addDataButton.css('display')).toEqual('none');
        });

        it('Should render with data and show a data card', async () => {
            mockNarrativeServiceListObjects(OBJDATA);
            await dataListObj.refresh();

            expect($dataList.find('.narrative-card-row')).toBeDefined();
        });

        it('Should generate the add data button with data present', async () => {
            mockNarrativeServiceListObjects(OBJDATA);
            await dataListObj.refresh();

            const $addDataButton = $dataList.find('.kb-data-list-add-data-button');
            expect($addDataButton).toBeDefined();
            expect($addDataButton.length).toEqual(1);
            expect($addDataButton.is('button')).toBeTruthy();
            expect($addDataButton.css('display')).toEqual('inline-block');
        });
    });
});
