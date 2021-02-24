define(['narrativeConfig'], (Config) => {
    'use strict';
    describe('Tests for narrativeConfig', () => {
        it('loaded the config module', () => {
            expect(Config).not.toBeNull();
        });

        it('has a config object', () => {
            expect(Config.config).not.toBeNull();
        });

        it('has a valid workspace url', () => {
            expect(Config.config.urls.workspace).toMatch(/https:\/\/.*kbase\.us\/services\/ws/);
        });

        it('tries to update paths from ui-common and gets data source config', () => {
            return Config.updateConfig().then((config) => {
                expect(config).toBeDefined();
            });
        });

        it('updates paths and sees data sources for example data', () => {
            return Config.updateConfig().then((config) => {
                expect(config.exampleData).toBeDefined();
            });
        });

        it('can use the url method to fetch a url', () => {
            expect(Config.url('workspace')).toMatch(/https:\/\/.*kbase\.us\/services\/ws/);
        });

        it('can use the get method to fetch tooltip info', () => {
            expect(Config.get('tooltip').showDelay).toEqual(jasmine.any(Number));
        });

        it('should return undefined for an unknown configuration key', () => {
            expect(Config.get('gleeblegorf')).toBeUndefined();
        });

        it('can use the get method to see what features should be enabled or not', () => {
            const features = Config.get('features');
            expect(features).toEqual(jasmine.any(Object));
            expect(features.stagingDataViewer).toBeDefined();
        });
    });
});
