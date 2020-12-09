/*jslint white: true*/
define([
    'kbaseNarrativeWorkspace',
    'jquery'
], (kbaseNarrativeWorkspace, $) => {
    'use strict';
    describe('Test the kbaseNarrativeWorkspace widget', () => {
        let $node;
        beforeEach(() => {
            jasmine.Ajax.install();
            $node = $('div');
            $('body').append($node);
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $node.detach();
        });

        it('should attach to a node and do stuff', () => {

        });
    });
});
