/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace',
    'kbaseNarrative',
    'testUtil'
], function(
    $,
    StagingAreaViewer,
    Jupyter,
    Narrative,
    TestUtil
) {
    'use strict';
    describe('Test the staging area viewer widget', function() {
        var stagingViewer,
            $targetNode = $('<div>'),
            startingPath = '/',
            updatePathFn = function(newPath) { };

        beforeEach(function() {
            if (TestUtil.getAuthToken()) {
                Jupyter.narrative = new Narrative();
                Jupyter.narrative.authToken = TestUtil.getAuthToken();
                Jupyter.narrative.userId = TestUtil.getUserId();
                Jupyter.narrative.sidePanel = {
                    '$dataWidget': {
                        '$overlayPanel': {}
                    }
                };
                stagingViewer = new StagingAreaViewer($targetNode, {
                    path: startingPath,
                    updatePathFn: updatePathFn
                });
            }
        });

        it('Should initialize properly', function() {
            TestUtil.pendingIfNoToken();
            expect(stagingViewer).not.toBeNull();
        });

        it('Should render properly', function() {
            TestUtil.pendingIfNoToken();
            stagingViewer.render();
            expect(stagingViewer).not.toBeNull();
        });

        it('Should start a help tour', function() {
            TestUtil.pendingIfNoToken();
            stagingViewer.render();
            stagingViewer.startTour();
            expect(stagingViewer.tour).not.toBeNull();
        });

        xit('Should try to create a new import app with missing info', function() {
            TestUtil.pendingIfNoToken();
            stagingViewer.initImportApp('foo', 'i_am_a_file');
        });

        xit('Should try to create a new import app with appropriate info', function() {
            TestUtil.pendingIfNoToken();
            stagingViewer.initImportApp('fba_model', 'i_am_a_file');
        });

        it('Should update its view with a proper subpath', function(done) {
            TestUtil.pendingIfNoToken();
            stagingViewer.updateView()
                .then(function() {
                    done();
                });
        });
    });
});
