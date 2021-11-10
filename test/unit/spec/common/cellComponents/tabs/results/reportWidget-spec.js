define([
    'common/cellComponents/tabs/results/reportWidget',
    'base/js/namespace',
    '/test/data/fakeResultsData',
    'narrativeConfig',
    'narrativeMocks',
    'testUtil',
], (ReportWidget, Jupyter, ResultsData, Config, Mocks, TestUtil) => {
    'use strict';

    const FAKE_REPORT_OBJ = {
        direct_html: 'Here is some direct html for your Narrative perusal.',
        direct_html_link_index: 0,
        file_links: [],
        html_links: [],
        html_window_height: null,
        objects_created: [],
        summary_window_height: null,
        text_message: 'Here is an example report',
        warnings: [],
    };

    function mockReportCalls() {
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            body: /get_objects2/,
            response: {
                data: [
                    {
                        data: FAKE_REPORT_OBJ,
                    },
                ],
            },
        });
        Mocks.mockJsonRpc1Call({
            url: Config.url('workspace'),
            body: /get_object_info_new/,
            response: [],
        });
        Mocks.mockJsonRpc1Call({
            url: Config.url('service_wizard'),
            body: /ServiceWizard.get_service_status/,
            response: { url: 'https://fake.kbase.us/services/fake_service' },
        });
    }

    describe('Test the app/bulk import cell report widget', () => {
        let container;
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        beforeEach(function () {
            jasmine.Ajax.install();
            container = document.createElement('div');
            this.widget = ReportWidget.make();
        });

        afterEach(() => {
            container.remove();
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
        });

        it('should start and render with data', async function () {
            await this.widget.start({
                node: container,
                objectData: ResultsData.objectData,
            });
            // we should have a div with two <a> elements, each with the
            // name of an object
            expect(container.querySelectorAll('.kb-report__item_container').length).toBe(2);
            expect(container.innerHTML).toContain('Reports');
            ResultsData.objectData.forEach((obj) => {
                expect(container.innerHTML).toContain(obj.name);
            });
        });

        it('should clear itself after stopping', async function () {
            await this.widget.start({
                node: container,
                objectData: ResultsData.objectData,
            });
            expect(container.innerHTML).toContain('Reports');
            await this.widget.stop();
            expect(container.innerHTML).toBe('');
        });

        it('should expand and create a kbaseReportView widget on toggle', async function () {
            mockReportCalls();
            // just take a single object to render
            const singleDataObject = ResultsData.objectData[0];

            await this.widget.start({
                node: container,
                objectData: [singleDataObject],
            });
            // there should be only one
            expect(container.querySelectorAll('.kb-report__item_toggle').length).toBe(1);
            // get a handle on it
            const toggleNode = container.querySelector('.kb-report__item_toggle');
            // expect it to be collapsed and not to have any siblings
            expect(toggleNode).toHaveClass('collapsed');
            expect(toggleNode.nextSibling).toBeNull();

            toggleNode.click();
            // expect it to open up and make a div as a sibling
            expect(toggleNode).not.toHaveClass('collapsed');
            const reportNode = toggleNode.nextSibling;
            expect(reportNode).toBeDefined();
            // marker for running kbaseReportView
            expect(reportNode.innerHTML).toContain('kb-report-view__container');
        });

        it('should expand and collapse again on click', async function () {
            mockReportCalls();
            // just take a single object to render
            const singleDataObject = ResultsData.objectData[0];

            await this.widget.start({
                node: container,
                objectData: [singleDataObject],
            });
            const toggleNode = container.querySelector('.kb-report__item_toggle');
            // expect it to be collapsed and not to have any siblings
            expect(toggleNode).toHaveClass('collapsed');
            expect(toggleNode.nextSibling).toBeNull();

            toggleNode.click();
            // expect it to open up and make a div as a sibling
            expect(toggleNode).not.toHaveClass('collapsed');
            const reportNode = toggleNode.nextSibling;
            expect(reportNode).toBeDefined();

            // close again on another click
            toggleNode.click();
            expect(toggleNode).toHaveClass('collapsed');
            expect(toggleNode.nextSibling).toBeNull();
        });

        it('should start with empty data', async function () {
            await this.widget.start({
                node: container,
                objectData: [],
            });
            const mainNode = container.querySelector('div.kb-reports-view');
            expect(mainNode.innerHTML).toBe('');
        });

        [
            {
                label: 'missing name',
                obj: { reportRef: '1/2/3' },
                expect: {
                    hasToggle: true,
                    text: 'Object not found',
                },
            },
            {
                label: 'missing report',
                obj: { name: 'some_object' },
                expect: {
                    hasToggle: false,
                    text: 'some_object (report not found)',
                },
            },
            {
                label: 'missing name, ref, and report',
                obj: {},
                expect: {
                    hasToggle: false,
                    text: 'Object not found (report not found)',
                },
            },
            {
                label: 'missing name and report',
                obj: { ref: '1/2/3', reportRef: '4/5/6' },
                expect: {
                    hasToggle: true,
                    text: 'Object 1/2/3 not found, may have been deleted',
                },
            },
        ].forEach((testCase) => {
            it(`should show report objects with a ${testCase.label}`, async function () {
                await this.widget.start({
                    node: container,
                    objectData: [testCase.obj],
                });
                const listParent = container.querySelector(
                    '.kb-reports-view .panel-body[data-element="body"] .kb-report__container'
                );
                expect(listParent.childElementCount).toEqual(1);
                const reportItem = listParent.firstChild;
                if (testCase.expect.hasToggle) {
                    const toggleNode = reportItem.querySelector('.kb-report__item_toggle');
                    expect(toggleNode).not.toBeNull();
                    expect(toggleNode.innerHTML).toContain(testCase.expect.text);
                } else {
                    expect(reportItem.innerHTML).toBe(testCase.expect.text);
                }
            });
        });
    });
});
