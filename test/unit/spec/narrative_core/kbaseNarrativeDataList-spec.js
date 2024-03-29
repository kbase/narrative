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

    const FAKE_NS_URL = 'https://kbase.us/service/fakeNSUrl';
    const FAKE_WS_NAME = 'some_workspace';

    function mockNarrativeServiceListObjects(objData) {
        Mocks.mockJsonRpc1Call({
            url: FAKE_NS_URL,
            body: /list_objects_with_sets/,
            response: {
                data: objData,
                data_palette_refs: {},
            },
        });
    }

    function mockNarrativeServiceReport(reportData) {
        Mocks.mockJsonRpc1Call({
            url: FAKE_NS_URL,
            body: /find_object_report/,
            response: reportData,
        });
    }

    function mockWorkSpaceService() {
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            body: /get_workspace_info/,
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
        ],
        MANY_VERSION_OBJECT = [
            {
                object_info: [
                    5,
                    'some_object',
                    'KBaseGenomes.Genome-7.0',
                    '2020-10-03T01:15:14+0000',
                    5,
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
            expect($dataList.find('kb-data-list-main')).toBeDefined();
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
            // What we are testing is that the button has been displayed - it is controlled
            // with jquery hide()/show(), which sets display to "none" to hide,
            // and leaves alone or restores the display value to show.
            expect($addDataButton.css('display')).not.toEqual('none');
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

        describe('Functionality for reverting object versions', () => {
            const objInfo = MANY_VERSION_OBJECT[0].object_info;

            beforeEach(async () => {
                mockNarrativeServiceListObjects(MANY_VERSION_OBJECT);
                Jupyter.narrative.readonly = false;

                // make a list of history object infos, one for each of our object versions
                // they're identical for simplicity, other than version number
                const objHistory = [];
                for (let i = 1; i <= objInfo[4]; i++) {
                    const histObj = TestUtil.JSONcopy(objInfo);
                    histObj[4] = i;
                    objHistory.push(histObj);
                }
                Mocks.mockJsonRpc1Call({
                    url: Config.url('workspace'),
                    body: /get_object_history/,
                    response: objHistory,
                });
                mockNarrativeServiceReport({ report_upas: [] });
                // make the datalist think we're in the proper workspace so we use the history button
                dataListObj.wsId = objInfo[6];
                await dataListObj.refresh();
            });

            it('should show options for reverting history', async () => {
                // now some jquery/DOM jiggery-pokery!
                // expect a single data object card
                const $card = $dataList.find('.narrative-card-row');
                expect($card.length).toEqual(1);
                // get its "more info" container as a DOM element
                const infoContainer = $card.find('.narrative-card-row-more')[0];
                await TestUtil.waitForElementState(
                    $card[0],
                    () => {
                        // when it's visible, it's display: block
                        return infoContainer.style.display === 'block';
                    },
                    () => {
                        $card.find('.narrative-card-ellipsis').click();
                    }
                );
                // find the history icon button
                const historyIcon = infoContainer.querySelector('.fa-history');
                // below is the container where history info will go (as DOMElement, not jquery)
                const historyContainer = infoContainer.querySelector(
                    '.kb-data-list-more-div > div'
                );
                await TestUtil.waitForElementState(
                    historyContainer,
                    () => {
                        // wait on this container to get populated
                        return historyContainer.childElementCount > 0;
                    },
                    () => {
                        historyIcon.click();
                    }
                );
                // look for the following, in order:
                // 1. a div with the "hide history" button
                const hideBtn = historyContainer.querySelector('div:first-child');
                expect(hideBtn.querySelector('.kb-data-list-cancel-btn')).not.toBeNull();
                // 2. a table with an expected number of rows, and 3 columns:
                //    a. revert button
                //    b. "saved by testuser..."
                //    c. a span that, when moused over, gives much more info
                const verTableRows = historyContainer.querySelectorAll('table tr');
                const expectRows = objInfo[4];
                expect(verTableRows.length).toBe(objInfo[4]);
                for (let i = 0; i < verTableRows.length; i++) {
                    const row = verTableRows[i];
                    // button check
                    const buttonCol = row.querySelector('td:first-child');
                    expect(
                        buttonCol.querySelector('button.kb-data-list-btn').textContent
                    ).toContain(`v${expectRows - i}`);
                    // text check
                    const textCol = row.querySelector('td:nth-child(2)');
                    expect(textCol.textContent).toContain(`Saved by ${objInfo[5]}`);
                    // span check
                    const spanCol = row.querySelector('td:last-child');
                    expect(spanCol.querySelector('span')).toHaveClass('fa-info');
                }
            });

            it('should call out to the history reversion function on request', async () => {
                const infoContainer = $dataList.find(
                    '.narrative-card-row .narrative-card-row-more'
                )[0];

                await TestUtil.waitForElementState(
                    infoContainer,
                    () => {
                        // when it's visible, it's display: block
                        return infoContainer.style.display === 'block';
                    },
                    () => {
                        infoContainer.parentElement
                            .querySelector('.narrative-card-ellipsis')
                            .click();
                    }
                );
                // below is the container where history info will go (as DOMElement, not jquery)
                const historyContainer = infoContainer.querySelector(
                    '.kb-data-list-more-div > div'
                );
                await TestUtil.waitForElementState(
                    historyContainer,
                    () => {
                        // wait on this container to get populated
                        return historyContainer.childElementCount > 0;
                    },
                    () => {
                        infoContainer.querySelector('.fa-history').click();
                    }
                );

                const newVersion = TestUtil.JSONcopy(objInfo);
                newVersion[4]++;
                Mocks.mockJsonRpc1Call({
                    url: Config.url('workspace'),
                    body: /revert_object/,
                    response: newVersion,
                });

                // revert to the oldest (last) version
                spyOn(dataListObj, 'refresh').and.callThrough();
                spyOn(dataListObj.ws, 'revert_object').and.callThrough();
                historyContainer.querySelector('table tr:last-child button').click();
                expect(dataListObj.ws.revert_object).toHaveBeenCalledWith(
                    {
                        wsid: objInfo[6],
                        objid: objInfo[0],
                        ver: 1,
                    },
                    jasmine.any(Function),
                    jasmine.any(Function)
                );
                expect(dataListObj.refresh).toHaveBeenCalled();
            });
        });
    });
});
