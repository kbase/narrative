/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'widgets/function_output/kbaseDefaultObjectView',
    'testUtil',
    'base/js/namespace',
    'kbaseNarrative'
], (
    $,
    KBaseDefaultObjectView,
    TestUtil,
    Jupyter,
    Narrative
) => {
    'use strict';
    describe('Test the kbaseDefaultObjectView widget', () => {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            $div = $('<div>');
            if (TestUtil.getAuthToken()) {
                Jupyter.narrative = new Narrative();
                Jupyter.narrative.authToken = TestUtil.getAuthToken();
                // Jupyter.narrative.userId = TestUtil.getUserId();
                // Jupyter.narrative.sidePanel = {
                //     '$dataWidget': {
                //         '$overlayPanel': {}
                //     }
                // };
                // stagingViewer = new StagingAreaViewer($targetNode, {
                //     path: startingPath,
                //     updatePathFn: updatePathFn
                // });
            }
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.remove();
        });

        it('Should load properly when no upas given', () => {
            TestUtil.pendingIfNoToken();
            let w = new KBaseDefaultObjectView($div);
            expect($div.html()).toContainText('No objects to display!');
        });

        it('Should load properly when not logged in', () => {

        });

        it('Should properly load with a valid upa', () => {

        });
    });
});
