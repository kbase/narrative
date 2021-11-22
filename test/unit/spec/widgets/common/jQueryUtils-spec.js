define(['jquery', 'widgets/common/jQueryUtils'], ($, jQueryUtils) => {
    'use strict';
    const { $el, $row, $col } = jQueryUtils;

    describe('The $el function', () => {
        it('should produce a jQuery object', () => {
            expect($el('div')).toBeInstanceOf($);
        });

        it('should generate the desired element', () => {
            const tags = ['DIV', 'SPAN', 'TABLE', 'P', 'H1'];
            for (const tag of tags) {
                expect($el(tag).get(0).tagName).toEqual(tag);
            }
        });

        it('should display text within', () => {
            const message = 'I am loading';
            const $testDiv = $el('div').text(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });
    });

    describe('The $row function', () => {
        it('should produce a jQuery object', () => {
            expect($row()).toBeInstanceOf($);
        });

        it('should generate a div element', () => {
            expect($row().get(0).tagName).toEqual('DIV');
        });

        it('should display text within', () => {
            const message = 'I am content';
            const $testDiv = $row().text(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });
    });

    describe('The $col function', () => {
        it('should produce a jQuery object', () => {
            expect($col()).toBeInstanceOf($);
        });

        it('should generate a div element', () => {
            expect($col().get(0).tagName).toEqual('DIV');
        });

        it('should display text within', () => {
            const message = 'I am content';
            const $testDiv = $col().text(message);
            expect($testDiv).toBeDefined();
            expect($testDiv.text()).toContain(message);
        });
    });
});
