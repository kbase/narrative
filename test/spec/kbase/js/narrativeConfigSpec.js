'use strict';
define(['jquery', 'narrativeConfig'], function($, config) {
    describe('Tests for narrativeConfig', function() {
        it('loaded the config module', function() {
            expect(config).not.toBe.null;
        });

        it('has a config object', function() {
            expect(config.config).not.toBe.null;
        });

        it('has a valid workspace url', function() {
            expect(config.config.urls.workspace).toMatch(/https\:\/\/.*kbase\.us\/services\/ws/);
        });

        it('tries to update based on ui-common', function() {
            config.updateConfig();
        });
    });
});