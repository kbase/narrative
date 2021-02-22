/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define(['jquery', 'base/js/namespace', 'kbase/js/widgets/narrative_core/kbaseAppCard'], (
    $,
    Jupyter,
    AppCard
) => {
    let app, $card;
    describe('Test the kbaseAppCard widget', () => {
        beforeEach(() => {
            app = {
                info: {
                    id: 'modle/descript',
                    git_commit_hash: '',
                    icon: {
                        url:
                            'img?method_id=ProkkaAnnotation/annotate_contigs&image_name=prokka.png&tag=release',
                    },
                    authors: ['rsutormin'],
                    app_type: 'app',
                    categories: ['annotation'],
                    name: 'Title',
                    namespace: 'type',
                    ver: '134.34',
                },
                favorite: 124,
            };
            $card = AppCard({
                app: app,
                favorite: '123',
            });
        });
        it('Should initalize properly', (done) => {
            expect($card instanceof $).toEqual(true);
            done();
        });
        it('Should use name as Title', (done) => {
            const $title = $card.find('.kb-data-list-name');
            expect($title.html()).toEqual(app.info.name);
            done();
        });

        it('Should parse Type', () => {
            const $type = $card.find('.kb-data-list-type');
            expect($type.html()).toContain(app.info.ver);
        });
        it('Should not mutate moreContent passed in', () => {
            const $moreContent = $('<div>').text('More Content').addClass('test-more-content');

            const $card2 = AppCard({
                app: app,
                favorite: '123',
                moreContent: $moreContent,
            });
            const content = $card2.find('.narrative-card-row-more').children()[0];
            expect($moreContent.is($(content))).toEqual(true);
        });
    });
});
