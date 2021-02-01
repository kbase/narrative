define(['jquery', 'util/bootstrapSearch', 'base/js/namespace', 'kbaseNarrative'], (
    $,
    BootstrapSearch,
    Jupyter,
    Narrative
) => {
    'use strict';
    let $targetElem;

    describe('Test the BootstrapSearch module', () => {
        beforeEach(() => {
            $targetElem = $('<div>');
            Jupyter.narrative = new Narrative();
            Jupyter.narrative.disableKeyboardManager = () => {};
        });

        afterEach(() => {
            $targetElem.empty();
        });

        it('Should create a new search object', () => {
            const bsSearch = new BootstrapSearch($targetElem, {});
            expect(bsSearch).not.toBeNull();
        });

        it('Should fire an input function when triggered by input', () => {
            let passed = false;
            const bsSearch = new BootstrapSearch($targetElem, {
                inputFunction: function () {
                    passed = true;
                },
            });
            bsSearch.val('stuff');
            expect(passed).toBe(true);
        });

        it('Should have empty and filled icons at the right time', () => {
            const emptyFa = 'fa-battery-0',
                filledFa = 'fa-battery-4';

            const bsSearch = new BootstrapSearch($targetElem, {
                emptyIcon: emptyFa,
                filledIcon: filledFa,
            });
            const addon = $targetElem.find('span.input-group-addon > span');
            expect(addon.hasClass(emptyFa)).toBe(true);
            bsSearch.val('stuff');
            expect(addon.hasClass(filledFa)).toBe(true);
            bsSearch.val('');
            expect(addon.hasClass(emptyFa)).toBe(true);
        });

        it('Should auto-set fa- in front of icons without it', () => {
            const empty = 'battery-0',
                emptyFa = 'fa-battery-0',
                filled = 'battery-4',
                filledFa = 'fa-battery-4';

            const bsSearch = new BootstrapSearch($targetElem, {
                emptyIcon: empty,
                filledIcon: filled,
            });
            const addon = $targetElem.find('span.input-group-addon > span');
            expect(addon.hasClass(emptyFa)).toBe(true);
            bsSearch.val('stuff');
            expect(addon.hasClass(filledFa)).toBe(true);
            bsSearch.val('');
            expect(addon.hasClass(emptyFa)).toBe(true);
        });

        it('Should clear input by default when clicking addon', () => {
            const bsSearch = new BootstrapSearch($targetElem);
            bsSearch.val('stuff');
            $targetElem.find('span.input-group-addon').click();
            expect(bsSearch.val()).toBeFalsy();
        });

        it('Should fire a function when clicking the addon - overrides default clear', () => {
            let passed = false;
            const bsSearch = new BootstrapSearch($targetElem, {
                addonFunction: function () {
                    passed = true;
                },
            });
            bsSearch.val('stuff');
            $targetElem.find('span.input-group-addon').click();
            expect(passed).toBe(true);
            expect(bsSearch.val()).toEqual('stuff');
        });

        it('Should have a val function that works as in vanilla JS', () => {
            const bsSearch = new BootstrapSearch($targetElem);
            bsSearch.val('stuff');
            expect(bsSearch.val()).toEqual('stuff');
        });

        it('Should have a working focus function', () => {
            const bsSearch = new BootstrapSearch($targetElem);
            let passed = false;
            $('body').append($targetElem);
            $targetElem.find('input.form-control').on('focus', () => {
                passed = true;
            });
            bsSearch.focus();
            expect(passed).toBe(true);
        });

        it('Should set placeholder text', () => {
            const placeholder = 'some text';
            new BootstrapSearch($targetElem, {
                placeholder: placeholder,
            });
            expect($targetElem.find('input.form-control').attr('placeholder')).toEqual(placeholder);
        });

        it('Should trigger an escape function', () => {
            let passed = false;
            new BootstrapSearch($targetElem, {
                escFunction: function () {
                    passed = true;
                },
            });
            const e = $.Event('keyup');
            e.which = 27;
            e.keyCode = 27;
            $targetElem.find('input.form-control').trigger(e);
            expect(passed).toBe(true);
        });
    });
});
