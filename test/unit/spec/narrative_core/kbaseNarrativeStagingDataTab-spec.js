/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseNarrativeStagingDataTab',
    'base/js/namespace'
], function(
    $,
    StagingDataTab,
    Jupyter
) {
    'use strict';
    describe('Test the kbaseNarrativeStagingDataTab widget', function() {
        var $dummyNode = $('<div>'),
            stagingWidget;
        beforeEach(function() {
            Jupyter.narrative = { userId: 'fakeUser' };
            stagingWidget = new StagingDataTab($dummyNode);
        });

        it('load properly with a real user', function() {
            expect(stagingWidget).not.toBeNull();
        });

        it('can update its path properly', function() {
            var newPath = 'a_new_path';
            stagingWidget.updatePath(newPath);
            expect(stagingWidget.path).toEqual(newPath);
        });
    });
});
