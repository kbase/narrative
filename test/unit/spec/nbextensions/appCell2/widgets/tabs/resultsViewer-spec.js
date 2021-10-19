define([
    '/narrative/nbextensions/appCell2/widgets/tabs/resultsViewer',
    'common/props',
    'base/js/namespace',
    'narrativeConfig',
    'testUtil',
    'narrativeMocks',
], (ResultsViewer, Props, Jupyter, Config, TestUtil, Mocks) => {
    'use strict';

    const mockModelData = {
        exec: {},
        app: {
            spec: {
                full_info: {
                    suggestions: {
                        next_methods: [],
                    },
                },
            },
            tag: 'release',
        },
    };

    const mockOutputWidgetInfo = {
        params: {
            report_name: 'some_report',
            report_ref: '1/2/3',
            workspace_name: 'some_workspace',
        },
    };

    const mockFinalJobState = {
        job_output: {
            result: [mockOutputWidgetInfo],
        },
    };

    const reportData = {
        direct_html: 'Here is some direct html for your Narrative perusal.',
        direct_html_link_index: 0,
        file_links: [],
        html_links: [],
        html_window_height: null,
        objects_created: [],
        summary_window_height: null,
        text_message: 'This is a report',
        warnings: [],
    };

    function buildModel(options) {
        const { isParentJob, jobComplete, hasReport } = options;
        const data = Object.assign({}, mockModelData);
        if (isParentJob && jobComplete && hasReport) {
            data.exec.outputWidgetInfo = mockOutputWidgetInfo;
        }
        return Props.make({ data });
    }

    describe('App Cell Results Viewer tests', () => {
        let node, outerNode;

        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        beforeEach(() => {
            jasmine.Ajax.install();
            node = document.createElement('div');
            outerNode = document.createElement('div');
            outerNode.id = 'notebook-container';
            document.body.appendChild(outerNode);
            outerNode.appendChild(node);
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
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
            node.remove();
            outerNode.remove();
        });

        it('loads and has the expected factory function', () => {
            expect(ResultsViewer.make).toEqual(jasmine.any(Function));
        });

        it('makes a ResultsViewer that has expected lifecycle functions', () => {
            const model = buildModel({});
            const viewer = ResultsViewer.make({ model });
            ['start', 'stop'].forEach((fn) => {
                expect(viewer[fn]).toEqual(jasmine.any(Function));
            });
            expect(viewer.reportRenderingPromise).toBeNull();
        });

        it('starts a viewer without a report', async () => {
            const model = buildModel({ hasReport: false, isParentJob: false, jobComplete: true });
            const viewer = ResultsViewer.make({ model });
            await viewer.start({
                node,
                jobState: mockFinalJobState,
                isParentJob: false,
            });
            expect(node.querySelector('.kb-app-results-tab')).toBeDefined();
            for (const [k, v] of Object.values(mockOutputWidgetInfo.params)) {
                // pick through the mocked results and make sure they're just printed out -
                // that's what happens when its treated as not having a report
                expect(node.innerHTML).toContain(k);
                expect(node.innerHTML).toContain(v);
            }
        });

        it('starts and stops a viewer with a report from a batch job', async () => {
            const model = buildModel({ hasReport: true, isParentJob: true, jobComplete: true });
            const viewer = ResultsViewer.make({ model });
            await viewer.start({
                node,
                jobState: mockFinalJobState,
                isParentJob: true,
            });
            await TestUtil.wait(500);
            expect(viewer.reportRenderingPromise).not.toBeNull();
            await viewer.reportRenderingPromise;
            expect(node.innerHTML).toContain(reportData.text_message);
            await viewer.stop();
            expect(node.innerHTML).toBe('');
        });

        it('starts and stops a viewer with a report from a non-batch job', async () => {
            const model = buildModel({ hasReport: true, isParentJob: false, jobComplete: true });
            const viewer = ResultsViewer.make({ model });
            const jobState = Object.assign({}, mockFinalJobState);
            jobState.widget_info = mockOutputWidgetInfo;
            await viewer.start({
                node,
                jobState,
                isParentJob: false,
            });
            await TestUtil.wait(500);
            expect(viewer.reportRenderingPromise).not.toBeNull();
            await viewer.reportRenderingPromise;
            expect(node.innerHTML).toContain(reportData.text_message);
        });

        it('renders suggested next apps', async () => {
            const model = buildModel({ hasReport: false, isParentJob: false, jobComplete: true });
            const nextMethods = ['SomeModule.someNewMethod'];
            const nextMethodSpec = {
                info: {
                    module_name: 'SomeModule',
                    name: 'Some Next App',
                },
            };

            Mocks.mockJsonRpc1Call({
                url: Config.url('narrative_method_store'),
                body: /get_method_spec/,
                response: [nextMethodSpec],
            });
            model.setItem('app.spec.full_info.suggestions.next_methods', nextMethods);
            const viewer = ResultsViewer.make({ model });
            await viewer.start({
                node,
                jobState: mockFinalJobState,
                isParentJob: false,
            });
            expect(node.innerHTML).toContain(nextMethodSpec.info.name);
        });
    });
});
