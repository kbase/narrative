define(['widgets/common/loadingMessage'], (loadingMessage) => {
    'use strict';
    describe('The loadingMessage widget', () => {
        it('should be defined', () => {
            expect(loadingMessage).toBeDefined();
        });

        it('should display a loading message string', () => {
            const message = 'I am loading';
            const $testDiv = loadingMessage(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });
    });
});
