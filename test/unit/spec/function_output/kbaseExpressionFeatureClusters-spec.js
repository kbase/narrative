define([
    'jquery',
    'kbaseExpressionFeatureClusters',
    'narrativeMocks',
    'narrativeConfig',
    'base/js/namespace',
], ($, Widget, Mocks, Config, Jupyter) => {
    'use strict';
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

    const FAKE_NS_URL = 'https://ci.kbase.us/services/fake_url';
    const FAKE_WS_NAME = 'some_workspace';

    xdescribe('The kbaseExpressionFeatureClusters widget', () => {
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
            // const $dataList = $('<div>');
            // const dataListObj = makeDataListInstance($dataList);
        });

        xit('should be defined', () => {
            expect(Widget).toBeDefined();
        });

        xit('should render the Overview tab correctly', () => {});

        xit('should render the Clusters tab correctly', () => {});

        xit('should render the Clusters tab correctly', () => {});

        xit('should render the Features tab correctly', () => {});
    });
});
