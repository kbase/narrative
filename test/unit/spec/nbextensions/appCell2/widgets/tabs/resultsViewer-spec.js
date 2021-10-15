define([
    '/narrative/nbextensions/appCell2/widgets/tabs/resultsViewer',
    'common/props',
    'narrativeConfig',
    'testUtil',
], (ResultsViewer, Props, Config, TestUtil) => {
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
            results: [mockOutputWidgetInfo],
        },
    };

    function buildModel(options) {
        const { isParentJob, jobComplete, hasReport } = options;
        const data = Object.assign({}, mockModelData);
        if (isParentJob && jobComplete && hasReport) {
            data.exec.outputWidgetInfo = mockOutputWidgetInfo;
        }
        return Props.make(data);
    }

    fdescribe('App Cell Results Viewer tests', () => {
        let node;

        beforeEach(() => {
            jasmine.Ajax.install();
            node = document.createElement('div');
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            TestUtil.clearRuntime();
            node.remove();
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
            expect(viewer).not.toBeNull();
        });

        xit('starts a viewer with a report from a parent job', async () => {});

        xit('starts a viewer with a report from a non-batch job', async () => {});

        xit('stops a started viewer', async () => {});

        xit('renders suggested next methods', async () => {});
    });
});
