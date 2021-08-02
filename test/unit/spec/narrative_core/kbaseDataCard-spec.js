define(['jquery', 'kbase/js/widgets/narrative_core/kbaseDataCard', 'testUtil'], (
    $,
    DataCard,
    TestUtil
) => {
    'use strict';
    let object_info, $card;

    afterAll(() => TestUtil.clearRuntime());

    describe('The kbaseDataCard widget', () => {
        beforeEach(() => {
            object_info = [
                1,
                'Object Name',
                'objecttype.Type-1.0',
                '2017-10-16T20:19:00+0000',
                1,
                'user',
                2,
                'user:narrative_2',
                'chsum',
                3,
                {},
            ];
            $card = DataCard({
                object_info: object_info,
            });
        });
        it('Should initalize properly', (done) => {
            expect($card instanceof $).toEqual(true);
            done();
        });
        it('Should use name as Title', (done) => {
            const $title = $card.find('.kb-data-list-name');
            expect($title.html()).toEqual(object_info[1]);
            done();
        });
        it('Should shorten Title', (done) => {
            const $card2 = DataCard({
                object_info: object_info,
                max_name_length: 5,
            });
            const $title = $card2.find('.kb-data-list-name');
            expect($title.html().length).toEqual(5);
            done();
        });
        it('Should parse Type', () => {
            const $type = $card.find('.kb-data-list-type');
            expect($type.html()).toEqual('Type');
        });
        it('Should not mutate moreContent passed in', () => {
            const $moreContent = $('<div>').text('More Content').addClass('test-more-content');

            const $card2 = DataCard({
                object_info: object_info,
                moreContent: $moreContent,
            });
            const content = $card2.find('.narrative-card-row-more').children()[0];
            expect($moreContent.is($(content))).toEqual(true);
        });
    });
});
