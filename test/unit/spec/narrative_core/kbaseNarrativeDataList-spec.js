/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'kbaseNarrativeDataList',
    'base/js/namespace',
    'kbaseNarrative',
    'bootstrap'
], function($, DataList, Jupyter, Narrative) {
    describe('Test the kbaseNarrativeDataList widget', function() {
        let $div = null;
        beforeEach(() => {
            jasmine.Ajax.install();
            $div = $('<div>');
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.getAuthToken = () => { return 'NotARealToken!' };
        });

        afterEach(() => {
            jasmine.Ajax.uninstall();
            $div.remove();
        });

        it('Should initialize an empty data list properly', function() {
            expect(dataList).toEqual(jasmine.any(Object));
        });

        it('Should have an add data button with Add Data text when there are no list items', function(){
            var addDataButton = $list.find('.kb-data-list-add-data-text-button')
            expect(addDataButton.length).toBe(1);
            expect(addDataButton.text()).toEqual('Add Data');
        });

        it('Should have an add data button with no text when there are list items', function(){
            var addDataButton = $list.find('.kb-data-list-add-data-button')
            expect(addDataButton.length).toBe(1);
        });

        it('Should fire a trigger when the add data button is clicked', function(){
            // Not sure how to do this in Jasmine yet
            // this.trigger('hideGalleryPanelOverlay.Narrative'); is this adding a class or is this a function?
        });
    });
});
