/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'jquery',
    'KBModeling'
], function($, kbm) {
    describe('test the KBModeling module', function() {
        it('should load a function', function() {
            expect(KBModeling).toEqual(jasmine.any(Function));
        });

        it('KBModeling should return an api object', function() {
            var fakeToken = 'mytoken';
            var api = new KBModeling(fakeToken);
            expect(api.token).toEqual(fakeToken);
            expect(api.kbapi).toEqual(jasmine.any(Function));
        });

        it('should create a loading plugin', function() {
            expect($.fn.loading).toBeDefined();
        });

        it('should create a rmloading plugin', function() {
            expect($.fn.rmLoading).toBeDefined();
        });
    });
});
