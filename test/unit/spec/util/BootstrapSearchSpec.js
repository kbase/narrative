define(['jquery', 'util/bootstrapSearch', 'base/js/namespace'], ($, BootstrapSearch, Jupyter) => {
    'use strict';

    describe('Test the BootstrapSearch module', () => {
        let $container;
        beforeEach(() => {
            $container = $('<div>');
            Jupyter.narrative = {
                disableKeyboardManager: () => {},
            };
        });

        afterEach(() => {
            $container.remove();
            Jupyter.narrative = null;
        });

        it('Should create a new search object', () => {
            const bsSearch = new BootstrapSearch($container, {});
            expect(bsSearch).not.toBeNull();
        });

        it('Should fire an input function when triggered by input', (done) => {
            const bsSearch = new BootstrapSearch($container, {
                inputFunction: (event) => {
                    expect(event.type).toBe('input');
                    done();
                },
            });
            bsSearch.val('stuff');
        });

        it('Should have empty and filled icons at the right time', () => {
            const emptyFa = 'fa-battery-0',
                filledFa = 'fa-battery-4';

            const bsSearch = new BootstrapSearch($container, {
                emptyIcon: emptyFa,
                filledIcon: filledFa,
            });
            const addon = $container.find('span.input-group-addon > span');
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

            const bsSearch = new BootstrapSearch($container, {
                emptyIcon: empty,
                filledIcon: filled,
            });
            const addon = $container.find('span.input-group-addon > span');
            expect(addon.hasClass(emptyFa)).toBe(true);
            bsSearch.val('stuff');
            expect(addon.hasClass(filledFa)).toBe(true);
            bsSearch.val('');
            expect(addon.hasClass(emptyFa)).toBe(true);
        });

        it('Should clear input by default when clicking addon', () => {
            const bsSearch = new BootstrapSearch($container);
            bsSearch.val('stuff');
            $container.find('span.input-group-addon').click();
            expect(bsSearch.val()).toBeFalsy();
        });

        it('Should fire a function when clicking the addon - overrides default clear', (done) => {
            const bsSearch = new BootstrapSearch($container, {
                addonFunction: () => {
                    expect(bsSearch.val()).toEqual('stuff');
                    done();
                },
            });
            bsSearch.val('stuff');
            $container.find('span.input-group-addon').click();
        });

        it('Should have a val function that works as in vanilla JS', () => {
            const bsSearch = new BootstrapSearch($container);
            bsSearch.val('stuff');
            expect(bsSearch.val()).toEqual('stuff');
        });

        // this test times out sporadically
        it('Should have a working focus function', (done) => {
            const bsSearch = new BootstrapSearch($container);
            $('body').append($container);
            spyOn(Jupyter.narrative, 'disableKeyboardManager');
            $container.find('input[type="text"]').on('focus', (event) => {
                expect(event.type).toBe('focus');
                expect(Jupyter.narrative.disableKeyboardManager).toHaveBeenCalled();
                done();
            });
            bsSearch.focus();
        });

        it('Should set placeholder text', () => {
            const placeholder = 'some text';
            new BootstrapSearch($container, {
                placeholder: placeholder,
            });
            expect($container.find('input.form-control').attr('placeholder')).toEqual(placeholder);
        });

        it('Should trigger an escape function', (done) => {
            new BootstrapSearch($container, {
                escFunction: (event) => {
                    expect(event.type).toBe('keyup');
                    done();
                },
            });
            const e = $.Event('keyup');
            e.which = 27;
            e.keyCode = 27;
            $container.find('input.form-control').trigger(e);
        });
    });
});
