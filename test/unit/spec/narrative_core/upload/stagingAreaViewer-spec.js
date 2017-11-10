/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define ([
    'jquery',
    'kbase/js/widgets/narrative_core/upload/stagingAreaViewer',
    'base/js/namespace',
    'testUtil'
], function(
    $,
    StagingAreaViewer,
    Jupyter,
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
                Jupyter.narrative = {
                    userId: TestUtil.getUserId(),
                    authToken: TestUtil.getAuthToken()
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
    });
});
