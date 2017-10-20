/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/


define([
    'jquery',
    'base/js/namespace',
    'kbase/js/widgets/narrative_core/kbaseDataCard'
], function ($, Jupyter, DataCard) {
    var object_info, $card;
    describe('Test the kbaseDataCard widget', function() {
        beforeEach(function () {
            object_info = [
                1, 'Object Name', 'objecttype.Type-1.0', '2017-10-16T20:19:00+0000', 1, 
                'user', 2, 'user:narrative_2', 'chsum', 3, {}
            ];
            $card = DataCard({
                object_info: object_info
            });
        });
        it('Should initalize properly', function(done) {
            expect($card instanceof $).toEqual(true);
            done();
        });
        it('Should use name as Title', function(done) {
            var $title = $card.find('.kb-data-list-name');
            expect($title.html()).toEqual(object_info[1]);
            done();
        });
        it('Should shorten Title', function(done) {
            var $card2 = DataCard({
                object_info: object_info,
                max_name_length: 5,
            });
            var $title = $card2.find('.kb-data-list-name');
            expect($title.html().length).toEqual(5);
            done();
        });
        it('Should parse Type', function() {
            var $type = $card.find('.kb-data-list-type');
            expect($type.html()).toEqual('Type');
        });
        it('Should not mutate moreContent passed in', function() {
            var $moreContent = $('<div>').text('More Content').addClass('test-more-content');

            var $card2 = DataCard({
                object_info: object_info,
                moreContent: $moreContent,
            });
            var content = $card2.find('.narrative-card-row-more').children()[0];
            expect($moreContent.is($(content))).toEqual(true);
        });
        

    });
});
