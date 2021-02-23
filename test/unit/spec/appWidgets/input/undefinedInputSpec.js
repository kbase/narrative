define(['widgets/appWidgets2/input/undefinedInput'], (UndefinedInput) => {
    'use strict';

    describe('Undefined Input Widget test', () => {
        it('Should be loaded', () => {
            expect(UndefinedInput).not.toBeNull();
        });

        it('Should be instantiable and have an element', () => {
            const widget = UndefinedInput.make({});
            const node = document.createElement('div');
            widget.attach(node);
            expect(node.innerHTML).toContain('Undefined widget');
        });
    });
});
