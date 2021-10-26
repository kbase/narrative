define(['widgets/common/AlertMessage'], (
    $AlertMessage,
) => {
    'use strict';

    describe('The $AlertMessage widget', () => {
        it('should be defined', () => {
            expect($AlertMessage).toBeDefined();
        });

        it('should display a message', () => {
            const message = 'I am an message';
            const $testDiv = $AlertMessage(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });

        it('should display a message with type', () => {
            const types = ['info', 'warning', 'danger', 'success'];
            for (const type of types) {
                const message = `I am a "${type}" error`;
                const $testDiv = $AlertMessage(message, { type });
                expect($testDiv).toBeDefined();
                expect($testDiv.text()).toContain(message);
            }
        });

        it('should throw with a bad type message', () => {
            expect(() => {
                $AlertMessage('foo', { type: 'bar' });
            }).toThrow();
        });
    });
});
