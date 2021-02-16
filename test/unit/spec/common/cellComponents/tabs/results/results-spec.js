define([
    'common/cellComponents/tabs/results/resultsTab',
    'base/js/namespace',
    'common/props',
    '/test/data/testAppObj',
], (ResultsTab, Jupyter, Props, TestAppObject) => {
    'use strict';

    describe('test the bulk import cell results tab', () => {
        const workspaceClient = {
            get_objects2: () => Promise.resolve({ data: [] }),
            get_object_info_new: () => Promise.resolve([]),
        };
        beforeAll(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };

            expect(TestAppObject).toBeDefined();
        });

        afterAll(() => {
            Jupyter.narrative = null;
        });

        it('should start and render itself', () => {
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            const resultsTabInstance = ResultsTab.make({ model, workspaceClient });
            return resultsTabInstance
                .start({
                    node: node,
                })
                .then(() => {
                    // just make sure it renders the "Objects" and "Report" headers
                    expect(node.innerHTML).toContain('Objects');
                    expect(node.innerHTML).toContain('Report');
                });
        });

        it('should stop itself and empty the node it was in', () => {
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const model = Props.make({
                data: TestAppObject,
                onUpdate: () => {},
            });

            const resultsTabInstance = ResultsTab.make({ model, workspaceClient });
            return resultsTabInstance
                .start({
                    node: node,
                })
                .then(() => {
                    return resultsTabInstance.stop();
                })
                .then(() => {
                    expect(node.innerHTML).toEqual('');
                });
        });
    });
});
