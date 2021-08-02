define(['jquery', 'KBModeling', 'testUtil'], ($, kbm, TestUtil) => {
    'use strict';

    afterAll(() => TestUtil.clearRuntime());

    describe('test the KBModeling module', () => {
        it('should load a function', () => {
            expect(KBModeling).toEqual(jasmine.any(Function));
        });

        it('KBModeling should return an api object', () => {
            const fakeToken = 'mytoken';
            const api = new KBModeling(fakeToken);
            expect(api.token).toEqual(fakeToken);
            expect(api.kbapi).toEqual(jasmine.any(Function));
        });

        it('should create a loading plugin', () => {
            expect($.fn.loading).toBeDefined();
        });

        it('should create a rmloading plugin', () => {
            expect($.fn.rmLoading).toBeDefined();
        });
    });
});
