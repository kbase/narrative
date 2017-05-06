/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseNarrativeAppPanel'
], function($, AppPanel) {
    var $panel = $('<div>');
    var appPanel = null;

    describe('Test the kbaseNarrativeAppPanel widget', function() {
        beforeEach(function() {
            appPanel = new AppPanel($panel);
        });
        afterEach(function() {
            $panel = $('<div>');
            appPanel = null;
        });

        it('Should initialize properly', function() {
            expect(appPanel).toEqual(jasmine.any(Object));
        });

        it('Should have a working search interface', function() {

        });

        it('Should have a working filter menu', function() {

        });

        it('Should have a working version toggle button', function() {

        });

        it('Should have a working refresh button', function() {

        });

        it('Should have a working catalog slideout button', function() {

        });

        it('Should populate itself normally in flat mode', function() {

        });

        it('Should populate itself normally in reverse flat mode', function() {

        });

        it('Should populate itself normally in category mode', function() {

        });

        it('Should populate itself normally in input types mode', function() {

        });

        it('Should populate itself normally in output types mode', function() {

        });

        it('Should trigger the insert app function when clicking on an app', function() {

        });

        it('Should render each app correctly', function() {

        });
    });
});
