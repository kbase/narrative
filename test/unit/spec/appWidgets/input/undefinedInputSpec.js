define(['widgets/appWidgets2/input/undefinedInput'], (UndefinedInput) => {
    'use strict';

    describe('Undefined Input Widget test', () => {
        it('Should be loaded', () => {
            expect(UndefinedInput).not.toBeNull();
        });

        it('Should be instantiable and have an "attach" function', () => {
            const widget = UndefinedInput.make({});
            expect(widget).toEqual(jasmine.any(Object));
            expect(widget.attach).toEqual(jasmine.any(Function));
        });

        it('Should attach to a DOM node', () => {
            const widget = UndefinedInput.make({});
            const node = document.createElement('div');
            widget.attach(node);
            expect(node.innerHTML).toContain('Undefined widget');
        });
    });
});
