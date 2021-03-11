define(['kbaseReportView', 'base/js/namespace', 'jquery', 'narrativeMocks', 'narrativeConfig'], (
    ReportView,
    Jupyter,
    $,
    Mocks,
    Config
) => {
    'use strict';
    const FAKE_SERV_URL = 'https://ci.kbase.us/report_serv';
    const REPORT_REF = '1/2/3';

    const REPORT_OBJ = {
        direct_html: 'Here is some direct html for your Narrative perusal.',
        direct_html_link_index: 0,
        file_links: [{
            URL: 'https://ci.kbase.us/services/shock-api/node/203c54b4-d348-4ad2-a7a3-91139f0c7ae2',
            description: 'Simple test file 1',
            handle: 'KBH_658368',
            label: '',
            name: 'file_number_1.txt'
        }],
        html_links: [{
            URL: 'https://ci.kbase.us/services/shock-api/node/bf67e724-2025-477a-9cc9-868e71e89cbf',
            description: 'Report page 1',
            handle: 'KBH_658369',
            label: '',
            name: 'page1.html'
        }, {
            URL: 'https://ci.kbase.us/services/shock-api/node/5caa6be0-0e71-4fab-92a0-8ede347b4a5b',
            description: 'Report page 2',
            handle: 'KBH_658370',
            label: '',
            name: 'page2.html'
        }],
        html_window_height: null,
        objects_created: [{
            ref: '4/5/6',
            description: 'an object'
        }],
        summary_window_height: null,
        text_message: 'Here is an example report',
        warnings: []
    };

    const CREATED_OBJECTS_INFO = [
        [5, 'SomeObject', 'KBaseGenomes.Genome-1.0', new Date().getTime(), 6, 'some_user', 4, 'some_workspace'],
    ];

    function mockReportLookup(reportData) {
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            body: /get_objects2/,
            response: {
                data: [{
                    data: reportData
                }]
            }
        });
    }

    function mockCreatedObjectInfo(objectInfo) {
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            body: /get_object_info_new/,
            response: objectInfo
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
            fileLinks: '[data-element="downloadable-files"]'
        };
        for (const [panel, selector] of Object.entries(panelSelectors)) {
            let expectation = 0;
            if (panels[panel]) {
                expectation = 1;
            }
            expect($node.find(selector).length).toEqual(expectation);
        };
    }

    describe('The kbaseReportView widget', () => {
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken'
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(function () {
            jasmine.Ajax.install();
            this.$node = $('<div>');
            Mocks.mockJsonRpc1Call({
                url: Config.url('service_wizard'),
                body: /ServiceWizard.get_service_status/,
                response: {url: FAKE_SERV_URL}
            });
            $(document.body).append(this.$node);
        });

        afterEach(function () {
            jasmine.Ajax.uninstall();
            this.$node.remove();
        });

        it('should be defined', () => {
            expect(ReportView).toBeDefined();
        });

        it('should build a report view without object info or file links from a report object', async function () {
            const reportData = Object.assign({}, REPORT_OBJ);
            reportData.file_links = [];
            reportData.objects_created = [];
            mockReportLookup(reportData);
            mockCreatedObjectInfo([]);
            const reportWidget = new ReportView(this.$node, { report_ref: REPORT_REF });
            await reportWidget.loadAndRender();
            verifyPanelPresence({
                createdObjects: false,
                htmlPanel: true,
                summary: true,
                htmlLinks: true,
                fileLinks: false
            }, this.$node);
            // expect there's 2 downloadable html pages
            expect(this.$node.find('[data-element="downloadable-html"] li').length).toEqual(2);
            // and their links are well formatted
            this.$node.find('[data-element="downloadable-html"] li > a').each(function (idx) {
                expect($(this).prop('href')).toBeDefined();
                const href = $(this).prop('href');
                expect(href).toEqual(`${FAKE_SERV_URL}/api/v1/${REPORT_REF}/$/${idx}/page${idx+1}.html`);
            });
        });

        it('should build a report view with object info and no file links', async function () {
            const reportData = Object.assign({}, REPORT_OBJ);
            reportData.file_links = [];
            mockReportLookup(reportData);
            mockCreatedObjectInfo(CREATED_OBJECTS_INFO);
            const reportWidget = new ReportView(this.$node, {
                report_ref: REPORT_REF,
                showCreatedObjects: true
            });
            await reportWidget.loadAndRender();
            verifyPanelPresence({
                createdObjects: true,
                htmlPanel: true,
                summary: true,
                htmlLinks: true,
                fileLinks: false
            }, this.$node);
            // expect to see a single created object
        });

        it('should build a report view with object info and file links', async function () {
            mockReportLookup(REPORT_OBJ);
            mockCreatedObjectInfo(CREATED_OBJECTS_INFO);
            const reportWidget = new ReportView(this.$node, {
                report_ref: REPORT_REF,
                showCreatedObjects: true
            });
            await reportWidget.loadAndRender();
            verifyPanelPresence({
                createdObjects: true,
                htmlPanel: true,
                summary: true,
                htmlLinks: true,
                fileLinks: true
            }, this.$node);
            // expect to see one file and a downloader iframe
        });

        it('should build a report view with direct HTML content', () => {

        });

        it('should build a report view with HTML from the file set service', () => {

        });
    });
});
