define(['widgets/common/LoadingMessage'], ($LoadingMessage) => {
    'use strict';
    describe('The loadingMessage widget', () => {
        it('should be defined', () => {
            expect($LoadingMessage).toBeDefined();
        });

        it('should display a loading message string', () => {
            const message = 'I am loading';
            const $testDiv = $LoadingMessage(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });
    });
});
