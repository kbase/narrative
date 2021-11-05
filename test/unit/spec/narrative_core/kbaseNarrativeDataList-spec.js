define([
    'kbaseNarrativeDataList',
    'jquery',
    'narrativeConfig',
    'kb_service/client/workspace',
    'base/js/namespace',
    'narrativeMocks',
    'testUtil',
], (DataList, $, Config, Workspace, Jupyter, Mocks, TestUtil) => {
    'use strict';

    const FAKE_NS_URL = 'https://ci.kbase.us/services/fake_url';
    const FAKE_WS_NAME = 'some_workspace';

    function mockNarrativeServiceListObjects(objData) {
        Mocks.mockJsonRpc1Call({
            url: FAKE_NS_URL,
            response: {
                data: objData,
                data_palette_refs: {},
            },
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

    /**
     * Returns a promise which will resolve when the provided function returns true,
     * and reject if it exceeds the provided timeout or default of 5s, or if the
     * function throws an exception.
     */
    function waitFor(fun, timeout = 5000) {
        const interval = 100;
        let elapsed = 0;
        const started = Date.now();
        return new Promise((resolve, reject) => {
            const tryIt = () => {
                elapsed = Date.now() - started;
                if (elapsed > timeout) {
                    throw new Error(`waitFor expired without success after ${elapsed}ms`);
                }
                try {
                    const result = fun();
                    if (!result) {
                        window.setTimeout(() => {
                            tryIt();
                        }, interval);
                    } else {
                        resolve(result);
                        return;
                    }
                } catch (ex) {
                    reject(ex);
                }
            };
            tryIt();
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
        {
            object_info: [
                6,
                'Rhodobacter_CACIA_x',
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
            const AUTH_TOKEN = 'fakeAuthToken';
            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
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
            TestUtil.clearRuntime();
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

        it('Should render with data, conduct a search, and show a resulting data card', async () => {
            mockNarrativeServiceListObjects(OBJDATA);
            await dataListObj.refresh();

            // There should initially be as many rows as test objects
            const $initialRows = $dataList.find('.narrative-card-row');
            expect($initialRows.length).toEqual(OBJDATA.length);

            // Click the search button to expose the search input.
            const $searchButton = $dataList.find('#kb-data-list-searchctl');
            $searchButton.click();

            // Simulate a search for the second object.
            const $searchInput = $dataList.find('[data-testid="search-field"] input');
            const objectName = OBJDATA[1].object_info[1];
            $searchInput.val(objectName);
            $searchInput.trigger('input');

            const success = await waitFor(() => {
                const $result = $dataList.find('.narrative-card-row');
                // Wait for there to be only one row.
                if ($result.length !== 1) {
                    return false;
                }
                // And the result should be the object we searched for.
                const $title = $result.find('.kb-data-list-name');
                return $title.text() === objectName;
            });
            expect(success).toBeTrue();
        });
    });
});
