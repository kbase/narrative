/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/

define(['narrativeConfig'], function(Config) {
    'use strict';
    describe('Tests for narrativeConfig', function() {
        it('loaded the config module', function() {
            expect(Config).not.toBe.null;
        });

        it('has a config object', function() {
            expect(Config.config).not.toBe.null;
        });

        it('has a valid workspace url', function() {
            expect(Config.config.urls.workspace).toMatch(/https\:\/\/.*kbase\.us\/services\/ws/);
        });

        it('tries to update paths from ui-common', function() {
            Config.updateConfig(function(cfg) { });
        });

        it('can use the url method to fetch a url', function() {
            expect(Config.url('workspace')).toMatch(/https\:\/\/.*kbase\.us\/services\/ws/);
        });

        it('can use the get method to fetch tooltip info', function() {
            expect(Config.get('tooltip').showDelay).toEqual(jasmine.any(Number));
        });

        it('should return undefined for an unknown configuration key', function() {
            expect(Config.get('gleeblegorf')).toBeUndefined();
        });
    });
});