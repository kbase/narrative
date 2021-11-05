define([
    'common/cellComponents/tabs/results/resultsTab',
    'base/js/namespace',
    'common/props',
    'testUtil',
    '/test/data/testBulkImportObj',
], (ResultsTab, Jupyter, Props, TestUtil, TestBulkImportObject) => {
    'use strict';

    const reportObject = {
        data: {
            objects_created: [
                {
                    description: 'Assembled Contigs',
                    ref: '11/22/33',
                },
            ],
        },
    };

    const newObjectInfo = [
        22,
        'Test_contigs',
        'KBaseGenomeAnnotations.Assembly-6.0',
        '2020-12-04T19:16:03+0000',
        33,
        'some_user',
        11,
        'some_workspace_name',
        'hash',
        12345,
        null,
    ];

    describe('test the bulk import cell results tab', () => {
        let container;
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            expect(TestBulkImportObject).toBeDefined();
        });

        beforeEach(function () {
            this.workspaceClient = {
                get_objects2: () => Promise.resolve({ data: [] }),
                get_object_info_new: () => Promise.resolve([]),
            };
            container = document.createElement('div');
            this.model = Props.make({
                data: TestBulkImportObject,
                onUpdate: () => {},
            });
        });

        afterEach(() => {
            container.remove();
            TestUtil.clearRuntime();
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        it('should start and render itself', function () {
            const resultsTabInstance = ResultsTab.make({
                model: this.model,
                workspaceClient: this.workspaceClient,
            });
            return resultsTabInstance
                .start({
                    node: container,
                })
                .then(() => {
                    // just make sure it renders the "Objects" and "Report" headers
                    expect(container.querySelector('.kb-created-objects')).not.toBeNull();
                    expect(container.querySelector('.kb-reports-view')).not.toBeNull();
                });
        });

        it('should stop itself and empty the node it was in', function () {
            const resultsTabInstance = ResultsTab.make({
                model: this.model,
                workspaceClient: this.workspaceClient,
            });
            return resultsTabInstance
                .start({
                    node: container,
                })
                .then(() => {
                    return resultsTabInstance.stop();
                })
                .then(() => {
                    expect(container.innerHTML).toEqual('');
                });
        });

        it('should render report data', function () {
            const workspaceClient = {
                get_objects2: () =>
                    Promise.resolve({
                        data: [reportObject],
                    }),
                get_object_info_new: () => Promise.resolve([newObjectInfo]),
            };
            const resultsTabInstance = ResultsTab.make({
                model: this.model,
                workspaceClient,
            });
            return resultsTabInstance
                .start({
                    node: container,
                })
                .then(() => {
                    // don't go into detail here - that's for the other unit tests,
                    // just verify that we're rendering data.
                    const objNode = container.querySelector('div.kb-created-objects');
                    expect(objNode).toBeDefined();
                    expect(objNode.innerHTML).toContain('Test_contigs');

                    const reportNode = container.querySelector('div.kb-reports-view');
                    expect(reportNode).toBeDefined();
                    expect(reportNode.innerHTML).toContain('Test_contigs');
                });
        });

        it('should render a brief error if the workspace call fails', async function () {
            const workspaceClient = {
                get_objects2: () => Promise.reject(new Error('workspace not available')),
                get_object_info_new: () => Promise.reject(new Error('workspace not available')),
            };
            const resultsTab = ResultsTab.make({
                model: this.model,
                workspaceClient,
            });

            await resultsTab.start({ node: container });
            expect(container.textContent).toBe(
                'An error occurred preventing results from being displayed.'
            );
        });

        it('should recover from seeing workspace missing data', async function () {
            const workspaceClient = {
                get_objects2: () =>
                    Promise.resolve({
                        data: [reportObject],
                    }),
                get_object_info_new: () => Promise.resolve([null]),
            };
            const resultsTab = ResultsTab.make({
                model: this.model,
                workspaceClient,
            });

            await resultsTab.start({ node: container });
            const objNode = container.querySelector('div.kb-created-objects');
            expect(objNode.innerHTML).toContain('Object 11/22/33 not found');

            const reportNode = container.querySelector('div.kb-reports-view');
            expect(reportNode.innerHTML).toContain('Object 11/22/33 not found');
        });
    });
});
