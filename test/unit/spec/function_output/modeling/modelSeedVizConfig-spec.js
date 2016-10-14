/*global define*/
/*global describe, it, expect*/
/*global jasmine*/
/*global beforeEach, afterEach*/
/*jslint white: true*/
define([
    'modelSeedVizConfig'
], function(Widget) {
    describe('Test the modelSeedVizConfig widget', function() {
        var cfg;

        beforeEach(function() {
            cfg = new ModelSeedVizConfig();
        });

        it('Should load the functions', function() {
            expect(ModelSeedVizConfig).toBeDefined();
        });

        it('Has a known gene color', function() {
            expect(cfg.geneColor).toBe('#87CEEB');
        });

        it('Implements a getColor function', function() {
            var col = cfg.getColor(100, 100);
            expect(col).toBe('#8b0000');
        });
    });
});
