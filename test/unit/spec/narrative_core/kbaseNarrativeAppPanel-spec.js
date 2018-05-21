/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseNarrativeAppPanel',
    'base/js/namespace',
    'kbaseNarrative'
], function($, AppPanel, Jupyter, Narrative) {
    'use strict';
    var $panel = $('<div>');
    var appPanel = null;

    describe('Test the kbaseNarrativeAppPanel widget', function() {
        beforeEach(function(done) {
            Jupyter.narrative = new Narrative();
            appPanel = new AppPanel($panel);
            appPanel.refreshFromService().then(function() {
                done();
            });
        });
        afterEach(function() {
            $panel = $('<div>');
            appPanel = null;
        });

        it('Should initialize properly', function() {
            expect(appPanel).toEqual(jasmine.any(Object));
        });

        it('Should have a working search interface', function() {
            expect(appPanel.$methodList.children().children().length).not.toBe(0);

            appPanel.bsSearch.val('should show nothing');
            appPanel.refreshPanel();
            expect(appPanel.$methodList.children().children().length).toBe(0);

            appPanel.bsSearch.val('genome');
            appPanel.refreshPanel();
            expect(appPanel.$methodList.children().children().length).not.toBe(0);
            //TODO:
            // verify by setting output:genome and making sure there's only one output category
        });

        it('Should trigger search by jquery event filterMethods.Narrative', function () {
            expect(appPanel.$methodList.children().children().length).not.toBe(0);

            $(document).trigger('filterMethods.Narrative', 'should show nothing');
            expect(appPanel.$methodList.children().children().length).toBe(0);
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
