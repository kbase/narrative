/*jslint white: true*/
define([
    'kbaseNarrativeWorkspace',
    'jquery',
    'base/js/namespace',
    'narrativeMocks'
], (
    KBaseNarrativeWorkspace,
    $,
    Jupyter,
    Mocks
) => {
    'use strict';
    describe('Test the kbaseNarrativeWorkspace widget', () => {
        let $node;
        beforeEach(() => {
            jasmine.Ajax.install();
            $node = $('div');
            $('body').append($node);
            Jupyter.notebook = Mocks.buildMockNotebook({
                readOnly: false
            });
            Jupyter.narrative = {};
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $node.detach();
        });

        it('should attach to a node and do stuff', () => {
            let widget = new KBaseNarrativeWorkspace($node);
        });

        it('buildAppCodeCell', () => {

        });

        it('createViewerCell', () => {

        });

        it('should go back and forth between read-only and read-write modes', () => {

        });

        it('should delete cells on command', () => {

        });

        it('should have a working copy button', () => {

        });
    });
});
