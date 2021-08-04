define(['widgets/appWidgets2/input/undefinedInput', 'testUtil'], (UndefinedInput, TestUtil) => {
    'use strict';

    describe('Undefined Input Widget test', () => {
        let container;

        beforeEach(() => {
            container = document.createElement('div');
        });
        afterEach(() => {
            container.remove();
            TestUtil.clearRuntime();
        });
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
            widget.attach(container);
            expect(container.innerHTML).toContain('Undefined widget');
        });
    });
});
