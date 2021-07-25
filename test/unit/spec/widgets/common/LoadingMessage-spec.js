define(['jquery', 'widgets/common/LoadingMessage'], ($, $LoadingMessage) => {
    'use strict';
    describe('The LoadingMessage widget', () => {
        it('should be defined', () => {
            expect($LoadingMessage).toBeDefined();
        });

        it('should display a loading message string', () => {
            const message = 'I am loading';
            const $testDiv = $LoadingMessage(message);
            expect($testDiv.text()).toContain(message);
        });

        it('should display a loading message jquery node', () => {
            const message = 'I am loading';
            const $message = $('<div>').text(message);
            const $testDiv = $LoadingMessage($message);
            expect($testDiv.text()).toContain(message);
        });
    });
});
