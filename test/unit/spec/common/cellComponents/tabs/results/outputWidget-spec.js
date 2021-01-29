define([
    'common/cellComponents/tabs/results/outputWidget',
    'base/js/namespace',
    'narrativeConfig',
    'kb_service/client/workspace',
    './fakeResultsData'
], (OutputWidget, Jupyter, Config, Workspace, ResultsData) => {
    'use strict';

    /**
     * Sets up happy path workspace mock AJAX calls using jasmine.Ajax.
     * This mocks the calls to get_objects2 and get_object_info_new
     */
    function happyWorkspaceMocks() {
        const returnData = {
            data: []
        };
        Object.keys(ResultsData.reports).forEach(ref => {
            returnData.data.push({
                data: ResultsData.reports[ref]
            });
        });
        const returnInfos = Object.values(ResultsData.objectInfos);
        jasmine.Ajax.stubRequest(Config.url('workspace'), /get_objects2/)
            .andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [returnData]
                })
            });

        jasmine.Ajax.stubRequest(Config.url('workspace'), /get_object_info_new/)
            .andReturn({
                status: 200,
                statusText: 'success',
                contentType: 'application/json',
                responseText: JSON.stringify({
                    version: '1.1',
                    result: [returnInfos]
                })
            });
    }

    describe('test the created objects viewer', () => {
        let workspaceClient;
        beforeEach(() => {
            Jupyter.narrative = {
                getAuthToken: () => 'fakeToken',
            };
            // make an anonymous workspace client. We're gonna be mocking its calls anyway.
            workspaceClient = new Workspace(Config.url('workspace'));
            jasmine.Ajax.install();
            // add workspace mocks here.
        });

        afterEach(() => {
            Jupyter.narrative = null;
            jasmine.Ajax.uninstall();
        });

        it('should start and render with data', () => {
            happyWorkspaceMocks();
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const widget = OutputWidget.make();
            return widget.start({node, reports: Object.keys(ResultsData.reports), workspaceClient})
                .then(() => {
                    // we should have a table with two rows.
                    expect(node.querySelectorAll('tr').length).toBe(3);
                    expect(node.innerHTML).toContain('Objects');
                });
        });

        it('should start and render an empty area without data', () => {
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const widget = OutputWidget.make();
            return widget.start({node, reports: [], workspaceClient})
                .then(() => {
                    // should make an outer, classed node with nothing in it
                    const objNode = node.querySelector('div.kb-created-objects');
                    expect(objNode).toBeDefined();
                    expect(objNode.innerHTML).toEqual('');
                });
        });

        it('should stop and clear its node', () => {
            happyWorkspaceMocks();
            const node = document.createElement('div');
            document.getElementsByTagName('body')[0].appendChild(node);
            const widget = OutputWidget.make();
            return widget.start({node, reports: Object.keys(ResultsData.reports), workspaceClient})
                .then(() => {
                    // we should have a table with two rows.
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
