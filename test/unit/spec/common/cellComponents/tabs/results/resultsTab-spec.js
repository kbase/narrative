define([
    'common/cellComponents/tabs/results/resultsTab',
    'base/js/namespace',
    'common/props',
    '/test/data/testAppObj',
], (ResultsTab, Jupyter, Props, TestAppObject) => {
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
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            expect(TestAppObject).toBeDefined();
        });

        beforeEach(function () {
            this.workspaceClient = {
                get_objects2: () => Promise.resolve({ data: [] }),
                get_object_info_new: () => Promise.resolve([]),
            };
            this.node = document.createElement('div');
            this.model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });
            document.body.appendChild(this.node);
        });

        afterEach(function () {
            this.node.remove();
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
                    node: this.node,
                })
                .then(() => {
                    // just make sure it renders the "Objects" and "Report" headers
                    expect(this.node.innerHTML).toContain('Objects');
                    expect(this.node.innerHTML).toContain('Report');
                });
        });

        it('should stop itself and empty the node it was in', function () {
            const resultsTabInstance = ResultsTab.make({
                model: this.model,
                workspaceClient: this.workspaceClient,
            });
            return resultsTabInstance
                .start({
                    node: this.node,
                })
                .then(() => {
                    return resultsTabInstance.stop();
                })
                .then(() => {
                    expect(this.node.innerHTML).toEqual('');
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
                    node: this.node,
                })
                .then(() => {
                    // don't go into detail here - that's for the other unit tests,
                    // just verify that we're rendering data.
                    const objNode = this.node.querySelector('div.kb-created-objects');
                    expect(objNode).toBeDefined();
                    expect(objNode.innerHTML).toContain('Test_contigs');

                    const reportNode = this.node.querySelector('div.kb-reports-view');
                    expect(reportNode).toBeDefined();
                    expect(reportNode.innerHTML).toContain('Test_contigs');
                });
        });
    });
});
