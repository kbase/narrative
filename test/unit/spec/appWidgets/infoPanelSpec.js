/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define([
    'jquery',
    'bluebird',
    'kbase/js/widgets/appInfoPanel'
], function(
    $,
    Promise,
    InfoPanel
) {
    'use strict';

    function makeDummyPanel() {
        return InfoPanel.make({
            appId: 'MegaHit/run_megahit',
            appModule: 'MegaHit',
            tag: 'release'
        });
    }

    describe('Test the App Info Panel module', function() {
        it('Loaded the module', function() {
            expect(InfoPanel).not.toBe(null);
        });

        it('Has expected functions', function() {
            expect(InfoPanel.make).toBeDefined();
        });

        it('Can be instantiated', function() {
            expect(makeDummyPanel()).not.toBe(null);
        });

        it('Has expected functions when instantiated', function() {
            var panel = makeDummyPanel();
            expect(panel.start).toBeDefined();
            expect(panel.stop).toBeDefined();
        });

        it('Can render with "start" and return a Promise', function(done) {
            var panel = makeDummyPanel();
            var myNode = $('<div>');
            panel.start({ node: myNode })
                .then(function() {
                    expect(myNode.find('.kb-app-cell-info-desc p:first-child').text()).toEqual('This is a KBase wrapper for MEGAHIT.');
                    done();
                });
        });

        it('Can unrender with "stop" and return a Promise', function(done) {
            var panel = makeDummyPanel();
            var myNode = $('<div>');
            panel.start({ node: myNode });
            panel.stop()
                .then(function() {
                    expect(myNode.text()).toEqual('');
                    done();
                });
        });
    });
});