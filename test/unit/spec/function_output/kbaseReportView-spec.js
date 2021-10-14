define([
    'kbaseReportView',
    'base/js/namespace',
    'jquery',
    'narrativeMocks',
    'narrativeConfig',
    'testUtil',
], (ReportView, Jupyter, $, Mocks, Config, TestUtil) => {
    'use strict';
    const FAKE_SERV_URL = 'https://ci.kbase.us/report_serv';
    const REPORT_REF = '1/2/3';

    const REPORT_OBJ = {
        direct_html: 'Here is some direct html for your Narrative perusal.',
        direct_html_link_index: 0,
        file_links: [
            {
                URL: 'https://ci.kbase.us/services/shock-api/node/203c54b4-d348-4ad2-a7a3-91139f0c7ae2',
                description: 'Simple test file 1',
                handle: 'KBH_658368',
                label: '',
                name: 'file_number_1.txt',
            },
        ],
        html_links: [
            {
                URL: 'https://ci.kbase.us/services/shock-api/node/bf67e724-2025-477a-9cc9-868e71e89cbf',
                description: 'Report page 1',
                handle: 'KBH_658369',
                label: '',
                name: 'page1.html',
            },
            {
                URL: 'https://ci.kbase.us/services/shock-api/node/5caa6be0-0e71-4fab-92a0-8ede347b4a5b',
                description: 'Report page 2',
                handle: 'KBH_658370',
                label: '',
                name: 'page2.html',
            },
        ],
        html_window_height: null,
        objects_created: [
            {
                ref: '4/5/6',
                description: 'an object',
            },
        ],
        summary_window_height: null,
        text_message: 'Here is an example report',
        warnings: [],
    };

    const CREATED_OBJECTS_INFO = [
        [
            5,
            'SomeObject',
            'KBaseGenomes.Genome-1.0',
            new Date().getTime(),
            6,
            'some_user',
            4,
            'some_workspace',
        ],
    ];

    function mockReportLookup(reportData) {
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            body: /get_objects2/,
            response: {
                data: [
                    {
                        data: reportData,
                    },
                ],
            },
        });
    }

    function mockCreatedObjectInfo(objectInfo) {
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            body: /get_object_info_new/,
            response: objectInfo,
        });
    }

    /**
     * @param {object} panels should have these properties with boolean values
     * - createdObjects
     * - htmlPanel
     * - summary
     * - htmlLinks
     * - fileLinks
     * @param {object} $node - the jquery node hosting the report viewer
     */
    function verifyPanelPresence(panels, $node) {
        const panelSelectors = {
            createdObjects: '.kb-created-objects',
            htmlPanel: '[data-element="html-panel"]',
            summary: '[data-element="summary-section"]',
            htmlLinks: '[data-element="downloadable-html"]',
            fileLinks: '[data-element="downloadable-files"]',
        };
        for (const [panel, selector] of Object.entries(panelSelectors)) {
            let expectation = 0;
            if (panels[panel]) {
                expectation = 1;
            }
            expect($node.find(selector).length).toEqual(expectation);
        }
    }

    describe('The kbaseReportView widget', () => {
        let container;
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
            TestUtil.clearRuntime();
        });

        beforeEach(function () {
            jasmine.Ajax.install();
            container = document.createElement('div');
            this.$node = $(container);
            Mocks.mockJsonRpc1Call({
                url: Config.url('service_wizard'),
                body: /ServiceWizard.get_service_status/,
                response: { url: FAKE_SERV_URL },
            });
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            container.remove();
            TestUtil.clearRuntime();
        });

        it('should be defined', () => {
            expect(ReportView).toBeDefined();
        });

        it('should build a report view without object info or file links from a report object', async function () {
            // copy the base report here so we don't modify it for future tests
            const reportData = Object.assign({}, REPORT_OBJ);
            reportData.file_links = [];
            reportData.objects_created = [];
            mockReportLookup(reportData);
            mockCreatedObjectInfo([]);
            const reportWidget = new ReportView(this.$node, { report_ref: REPORT_REF });
            await reportWidget.loadAndRender();
            verifyPanelPresence(
                {
                    createdObjects: false,
                    htmlPanel: true,
                    summary: true,
                    htmlLinks: true,
                    fileLinks: false,
                },
                this.$node
            );
            // expect there's 2 downloadable html pages
            expect(this.$node.find('[data-element="downloadable-html"] li').length).toEqual(2);
            // and their links are well formatted
            this.$node.find('[data-element="downloadable-html"] li > a').each(function (idx) {
                expect($(this).prop('href')).toBeDefined();
                const href = $(this).prop('href');
                expect(href).toEqual(
                    `${FAKE_SERV_URL}/api/v1/${REPORT_REF}/$/${idx}/page${idx + 1}.html`
                );
            });
        });

        it('should build a report view with object info and no file links', async function () {
            const reportData = Object.assign({}, REPORT_OBJ);
            reportData.file_links = [];
            mockReportLookup(reportData);
            mockCreatedObjectInfo(CREATED_OBJECTS_INFO);
            const reportWidget = new ReportView(this.$node, {
                report_ref: REPORT_REF,
                showCreatedObjects: true,
            });
            await reportWidget.loadAndRender();
            verifyPanelPresence(
                {
                    createdObjects: true,
                    htmlPanel: true,
                    summary: true,
                    htmlLinks: true,
                    fileLinks: false,
                },
                this.$node
            );
            // expect to see a single created object
            const $objectsNode = this.$node.find('.kb-created-objects');
            expect($objectsNode.find('tbody tr').length).toEqual(1);
        });

        it('should build a report view with object info and file links', async function () {
            mockReportLookup(REPORT_OBJ);
            mockCreatedObjectInfo(CREATED_OBJECTS_INFO);
            const reportWidget = new ReportView(this.$node, {
                report_ref: REPORT_REF,
                showCreatedObjects: true,
            });
            await reportWidget.loadAndRender();
            verifyPanelPresence(
                {
                    createdObjects: true,
                    htmlPanel: true,
                    summary: true,
                    htmlLinks: true,
                    fileLinks: true,
                },
                this.$node
            );
            // expect to see one file and a downloader iframe
            const $fileLinksNode = this.$node.find('[data-element="downloadable-files"]');
            expect($fileLinksNode.find('iframe.kb-report-view__download-iframe').length).toEqual(1);
            const $fileLinks = $fileLinksNode.find('a');
            expect($fileLinks.length).toEqual(1);
            expect($fileLinks.html()).toContain('file_number_1.txt');
        });

        it('should build a report view with direct HTML content, not in an HTML tag', async function () {
            const reportData = Object.assign({}, REPORT_OBJ);
            delete reportData.direct_html_link_index; // the link index takes precedence, so take it out.
            mockReportLookup(reportData);
            const reportWidget = new ReportView(this.$node, {
                report_ref: REPORT_REF,
            });
            await reportWidget.loadAndRender();
            // get the iframe node
            const $iframe = this.$node.find('iframe.kb-report-view__report_iframe');
            expect($iframe.length).toEqual(1);
            expect($iframe.attr('srcdoc')).toContain(reportData.direct_html);
        });

        it('should build a report view with HTML from the file set service', async function () {
            mockReportLookup(REPORT_OBJ);
            const reportWidget = new ReportView(this.$node, {
                report_ref: REPORT_REF,
            });
            await reportWidget.loadAndRender();
            const $iframe = this.$node.find('iframe.kb-report-view__report_iframe');
            expect($iframe.length).toEqual(1);
            const htmlIndex = REPORT_OBJ.direct_html_link_index;
            const expectedIframeSrc = [
                FAKE_SERV_URL,
                'api',
                'v1',
                REPORT_REF,
                '$',
                htmlIndex,
                REPORT_OBJ.html_links[htmlIndex].name,
            ].join('/');
            expect($iframe.attr('src')).toEqual(expectedIframeSrc);
        });

        it('should build a report view with direct HTML content, in an HTML tag, and warn the console', async function () {
            const fakeReportHtml = '<html><body>This is a dummy report. BEHOLD!</body></html>';
            const reportData = Object.assign({}, REPORT_OBJ);
            reportData.direct_html = fakeReportHtml;
            delete reportData.direct_html_link_index;
            mockReportLookup(reportData);
            const reportWidget = new ReportView(this.$node, { report_ref: REPORT_REF });
            spyOn(console, 'warn');
            await reportWidget.loadAndRender();
            const $iframe = this.$node.find('iframe.kb-report-view__report_iframe');
            expect($iframe.length).toEqual(1);
            expect($iframe.attr('src')).toContain(encodeURIComponent(fakeReportHtml));
            expect(console.warn).toHaveBeenCalled();
        });

        // A counter for the warnings should only appear for 5 or more. Might be overkill, but we'll test it!
        const warningsCount = [1, 2, 3, 4, 5, 6, 7];
        warningsCount.forEach((count) => {
            const withCounter = count >= 5;
            it(`should make a list of warnings ${
                withCounter ? 'with a counter ' : ''
            }for ${count} html report(s)`, async function () {
                const reportData = Object.assign({}, REPORT_OBJ);
                reportData.warnings = [];
                for (let i = 0; i < count; i++) {
                    reportData.warnings.push(`warning #${i}`);
                }
                mockReportLookup(reportData);
                const reportWidget = new ReportView(this.$node, { report_ref: REPORT_REF });
                await reportWidget.loadAndRender();
                const $reportWarnings = this.$node.find('div.kb-report-view__warning__container');
                expect($reportWarnings.length).toEqual(1);
                const $warningCounter = $reportWarnings.find('div.kb-report-view__warning__count');
                if (withCounter) {
                    expect($warningCounter.length).toEqual(1);
                    expect($warningCounter.html()).toContain(`${count} warnings`);
                } else {
                    expect($warningCounter.length).toEqual(0);
                }
                expect($reportWarnings.find('div.kb-report-view__warning__text').length).toEqual(
                    count
                );
            });
        });

        it('should build a proper export link from a file url, or return null', function () {
            // just unit testing the importExportLink function here, not even calling render,
            // so we don't need to set up mocks.
            const reportWidget = new ReportView(this.$node, { report_ref: REPORT_REF }),
                shockNode = 'some-magic-shock-node',
                goodUrl = 'https://ci.kbase.us/services/shock-api/node/' + shockNode,
                name = 'some_file.txt',
                badUrl = 'https://ci.kbase.us/not/a/shock/url';
            expect(reportWidget.importExportLink(badUrl, name)).toBeNull();
            const result = reportWidget.importExportLink(goodUrl, name);
            expect(result).toMatch(new RegExp('^' + Config.url('data_import_export')));
            expect(result).toContain('wszip=0');
            expect(result).toContain('name=some_file.txt');
            expect(result).toContain('id=' + shockNode);
        });

        it('should respond to errors by rendering an error string', async function () {
            const errorMessage = 'This is an error message';
            Mocks.mockJsonRpc1Call({
                url: Config.url('workspace'),
                response: {
                    error: 'This would be an error stacktrace',
                    message: errorMessage,
                    code: -32500,
                    name: 'JSONRPCError',
                },
                statusCode: 500,
                statusText: 'HTTP 1.1 / 500 internal service error',
                isError: true,
            });
            const reportWidget = new ReportView(this.$node, { report_ref: REPORT_REF });
            await reportWidget.loadAndRender();
            verifyPanelPresence(
                {
                    createdObjects: false,
                    htmlPanel: false,
                    summary: false,
                    htmlLinks: false,
                    fileLinks: false,
                },
                this.$node
            );
            const $errorNode = this.$node.find('div.alert.alert-danger');
            expect($errorNode.html()).toContain('Error:');
            expect($errorNode.html()).toContain(errorMessage);
        });
    });
});
