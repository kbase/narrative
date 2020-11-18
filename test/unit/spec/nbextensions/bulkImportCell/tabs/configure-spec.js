/* global describe, it, expect, spyOn */
define([
    '../../../../../../../narrative/nbextensions/bulkImportCell/tabs/configure',
    'common/ui',
    'common/runtime'
], (
    ConfigureTab,
    UI,
    Runtime
) => {
    'use strict';

    describe('test the bulk import cell configure tab', () => {
        it('should start and render itself', () => {
            const bus = Runtime.make().bus();
            const node = document.createElement('div');
            const configure = ConfigureTab.make({bus: bus});
            return configure.start({
                node: node
            })
                .then(() => {
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(node.innerHTML).toContain('Parameters');
                    expect(node.innerHTML).toContain('File Paths');
                });
        });

        it('should stop itself and empty the node it was in', () => {
            const bus = Runtime.make().bus();
            const node = document.createElement('div');
            const configure = ConfigureTab.make({bus: bus});
            return configure.start({
                node: node
            })
                .then(() => {
                    // just make sure it renders the "File Paths" and "Parameters" headers
                    expect(node.innerHTML).toContain('Parameters');
                    return configure.stop();
                })
                .then(() => {
                    expect(node.innerHTML).toEqual('');
                });
        });
    });
});
