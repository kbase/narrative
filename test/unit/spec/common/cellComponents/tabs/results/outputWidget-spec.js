define([
    'common/cellComponents/tabs/results/outputWidget',
    'base/js/namespace',
    'narrativeConfig',
    'kb_service/client/workspace',
    '/test/data/fakeResultsData',
], (
    OutputWidget,
    Jupyter,
    Config,
    Workspace,
    ResultsData
) => {
    'use strict';

    describe('test the created objects viewer', () => {
        beforeEach(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
        });

        afterEach(() => {
            Jupyter.narrative = null;
        });

        it('should start and render with data', () => {
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const widget = OutputWidget.make();
            return widget.start({ node, objectData: ResultsData.objectData }).then(() => {
                // we should have a table with a header and two rows.
                expect(node.querySelectorAll('tr').length).toBe(3);
                expect(node.innerHTML).toContain('Objects');
            });
        });

        it('should start and render an empty area with a message saying there is no data', () => {
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const widget = OutputWidget.make();
            return widget.start({ node, objectData: [] }).then(() => {
                // should make an outer, classed node with nothing in it
                const objNode = node.querySelector('div.kb-created-objects');
                expect(objNode).toBeDefined();
                expect(objNode.innerHTML).toContain('No objects created');
            });
        });

        it('should stop and clear its node', () => {
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const widget = OutputWidget.make();
            return widget
                .start({ node, objectData: ResultsData.objectData })
                .then(() => {
                    // we should have a table with a header and two rows.
                    expect(node.querySelectorAll('tr').length).toBe(3);
                    expect(node.innerHTML).toContain('Objects');
                    return widget.stop();
                })
                .then(() => {
                    expect(node.innerHTML).toEqual('');
                });
        });
    });
});
