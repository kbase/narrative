define([
    'jquery',
    'kbaseExpressionPairwiseCorrelation',
    'narrativeMocks',
    'narrativeConfig',
    'base/js/namespace',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    '../../util/asyncTools',

    'json!./data/case1/constructorParams.json',
    'json!./data/case1/KBaseFeatureValues.get_submatrix_stat.request.json',
    'json!./data/case1/KBaseFeatureValues.get_submatrix_stat.response.json',

    'json!./data/case2/constructorParams.json',
    'json!./data/case2/KBaseFeatureValues.get_submatrix_stat.request.json',
    'json!./data/case2/KBaseFeatureValues.get_submatrix_stat.response.json',

    'json!./data/case3/constructorParams.json',
    'json!./data/case3/KBaseFeatureValues.get_submatrix_stat.request.json',
    'json!./data/case3/KBaseFeatureValues.get_submatrix_stat.response.json',
], (
    $,
    Widget,
    Mocks,
    Config,
    Jupyter,
    DynamicServiceClient,
    ServiceClient,
    asyncTools,
    case1ConstructorParams,
    case1Request1Data,
    case1ResponseData,
    case2ConstructorParams,
    case2Request1Data,
    case2ResponseData,
    case3ConstructorParams,
    case3Request1Data,
    case3ResponseData
) => {
    'use strict';

    const { tryFor } = asyncTools;

    // function mockWorkSpaceService() {
    //     Mocks.mockJsonRpc1Call({
    //         url: Config.url('workspace'),
    //         response: [
    //             35855,
    //             'testUser:narrative_1534979778065',
    //             'testUser',
    //             '2020-09-30T23:22:25+0000',
    //             2,
    //             'a',
    //             'n',
    //             'unlocked',
    //             {
    //                 narrative_nice_name: 'CI Scratch',
    //                 searchtags: 'narrative',
    //                 is_temporary: 'false',
    //                 narrative: '1',
    //             },
    //         ],
    //     });
    // }

    function mockKBaseFeatureValuesDynamicService(bodyFilter, caseData) {
        Mocks.mockJsonRpc1Call({
            url: KBASE_FEATURE_VALUES_URL,
            // A bit crude, but I think we can make this work...
            // the "body", if present, is used to match against
            // the entire request body. We are sending json, so we
            // match a fragment of json. If only this were a callback...
            body: new RegExp(bodyFilter),
            // id: '1130778572818838',
            response: caseData,
        });
    }

    const KBASE_FEATURE_VALUES_URL = 'https://ci.kbase.us/dynserv/xyz.KBaseFeatureValues';
    const AUTH_TOKEN = 'fakeAuthToken';

    describe('The kbaseExpressionPairwiseCorrelation widget', () => {
        beforeAll(() => {
            // remove any jquery events that get bound to document,
            // including login and logout listeners
            $(document).off();
        });

        beforeEach(() => {
            jasmine.Ajax.install();

            Mocks.setAuthToken(AUTH_TOKEN);
            Jupyter.narrative = {
                getAuthToken: () => AUTH_TOKEN,
                getWorkspaceName: () => 'someWorkspace',
            };

            // mock service calls
            // Note that the url doesn't really matter
            Mocks.mockServiceWizardLookup({
                module: 'KBaseFeatureValues',
                url: KBASE_FEATURE_VALUES_URL,
            });
            mockKBaseFeatureValuesDynamicService('b2577', case1ResponseData);
            mockKBaseFeatureValuesDynamicService('b0023', case2ResponseData);
            mockKBaseFeatureValuesDynamicService('b0049', case3ResponseData);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
        });

        it('should have a functioning module definition', () => {
            expect(Widget).toBeDefined();
        });

        // Happy paths

        // Just make sure the api call works

        it('should have a functioning FeatureValues ', async () => {
            const featureValues = new DynamicServiceClient({
                module: 'KBaseFeatureValues',
                url: Config.url('service_wizard'),
                token: AUTH_TOKEN,
            });
            const [result] = await featureValues.callFunc('get_submatrix_stat', [
                case1Request1Data,
            ]);
            expect(result).toBeDefined();
            expect(result.mtx_descriptor).toBeDefined();
        });

        // it('should have a functioning Workspace ', async () => {
        //     const featureValues = new ServiceClient({
        //         module: 'Workspace',
        //         url: Config.url('workspace'),
        //         token: AUTH_TOKEN,
        //     });
        //     const params = Object.assign({}, caseRequest1Data.params[0]);
        //     params.__FAKE__ = 'case1';
        //     const [result] = await featureValues.callFunc('get_submatrix_stat', [params]);
        //     expect(result).toBeDefined();
        //     expect(result.mtx_descriptor).toBeDefined();
        // });

        // Normal display with <= 50 genes
        it('should show a heatmap with < 50 genes', async () => {
            const widgetParams = case1ConstructorParams;
            const $host = $('<div>');
            const widget = new Widget($host, widgetParams);
            expect(widget).toBeDefined();
            widget.loggedInCallback(null, { token: 'token' });

            // Ensure heatmap is displayed.
            await tryFor(() => {
                const $heatmap = $host.find('[data-testid="heatmap"]');
                return [$heatmap.length === 1, $heatmap];
            }, 5000);

            // An an svg is in place.
            await tryFor(() => {
                const $svg = $host.find('[data-testid="heatmap"] svg');
                return [$svg.length === 1, $svg];
            }, 5000);
        });

        // With > 50 genes, displays warning, allows download
        it('should show a warning and a download button with > 50, < 200 genes', async () => {
            const widgetParams = case2ConstructorParams;
            const $host = $('<div>');
            const widget = new Widget($host, widgetParams);
            expect(widget).toBeDefined();
            widget.loggedInCallback(null, { token: 'token' });

            const warnings = [
                new RegExp('The selected cluster has 55 genes\\.'),
                new RegExp(
                    'Heatmaps for clusters with more than 50 genes are not displayed inline, for performance reasons\\.'
                ),
            ];

            // Ensure heatmap is displayed.
            await tryFor(() => {
                const $warning = $host.find('.alert.alert-warning');
                if ($warning.length === 0) {
                    return [false];
                }
                const warningText = $warning.text();
                const warningsMatch = warnings.every((warning) => {
                    return warning.test(warningText);
                });

                return [warningsMatch];
            }, 5000);

            // A download button is in place.
            const $downloadButton = await tryFor(() => {
                const $button = $host.find('button');
                return [$button.length === 1, $button];
            }, 5000);

            expect($downloadButton.text()).toContain(
                'Download the SVG image file for this pairwise correlation'
            );

            // An an svg is not displayed
            const $svg = $host.find('[data-testid="heatmap"] svg');
            expect($svg.length).toEqual(0);
        });

        // With > 250 genes, displays warning, does not attempt to generate heatmap
        it('should show a warning, have no svg, and no download button with > 200 genes', async () => {
            const widgetParams = case3ConstructorParams;
            const $host = $('<div>');
            const widget = new Widget($host, widgetParams);
            expect(widget).toBeDefined();
            widget.loggedInCallback(null, { token: 'token' });

            const warnings = [
                new RegExp('The selected cluster has 262 genes\\.'),
                new RegExp(
                    'Heatmaps cannot be generated for clusters with more than 200 genes, for performance reasons\\.'
                ),
            ];

            await tryFor(() => {
                const $warning = $host.find('.alert.alert-warning');
                if ($warning.length === 0) {
                    return [false];
                }
                const warningText = $warning.text();
                const warningsMatch = warnings.every((warning) => {
                    return warning.test(warningText);
                });

                return [warningsMatch];
            }, 5000);

            // The download button is not displayed
            const $button = $host.find('button');
            expect($button.length).toEqual(0);

            // An an svg is not displayed
            const $svg = $host.find('[data-testid="heatmap"] svg');
            expect($svg.length).toEqual(0);
        });
    });
});
