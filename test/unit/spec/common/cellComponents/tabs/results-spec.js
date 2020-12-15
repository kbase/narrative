define([
    'common/cellComponents/tabs/results/resultsTab',
    'base/js/namespace',
    'common/props',
    'json!../../../../../data/testAppObj.json',
], (ResultsTab, Jupyter, Props, TestAppObject) => {
    'use strict';

    describe('test the bulk import cell results tab', () => {
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

            const results = ResultsTab.make({ model });
            return results
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

            const results = ResultsTab.make({ model });
            return results
                .start({
                    node: node,
                })
                .then(() => {
                    return results.stop();
                })
                .then(() => {
                    expect(node.innerHTML).toEqual('');
                });
        });
    });
});
