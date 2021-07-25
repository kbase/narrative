define(['jquery', 'widgets/common/RenderIn'], ($, RenderIn) => {
    'use strict';
    const { $TextIn, $HTMLIn } = RenderIn;
    describe('The $TextIn widget', () => {
        it('should be defined', () => {
            expect($TextIn).toBeDefined();
        });

        it('should display a text', () => {
            const message = 'I am text';
            const $testDiv = $TextIn(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });

        it('should display text wrapped in a jquery object', () => {
            const message = 'I am text in html';
            const $message = $('<span>').text(message);
            const $testDiv = $HTMLIn($message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });
    });
});
